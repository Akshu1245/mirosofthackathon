/**
 * Real Hindsight-backed implementation.
 *
 * STATUS: implemented and unit-tested against an injected fake client (no
 * live Hindsight instance or LLM key is available in this environment —
 * see docs/hindsight-adapter-status.md). Per the working agreement for
 * this phase, this must NOT be described as "integrated" until a real
 * retain() and recall() call against a live Hindsight server has actually
 * succeeded. Treat this file as "implemented, pending live verification."
 *
 * Wraps @vectorize-io/hindsight-client's HindsightClient. Every call:
 *  - derives its bank id exclusively via mapWorkspaceToBankId (workspace isolation)
 *  - sends only a server-authored summary as `content`, never a raw prompt/response
 *  - sends only allowlisted SafeMetadata fields, filtering out anything else
 *  - is wrapped in a timeout (AbortController) and converts any failure into AgentMemoryError
 *  - never logs the API key, base URL, or any request/response payload
 */
import { HindsightClient } from "@vectorize-io/hindsight-client";
import {
  AgentMemoryError,
  AgentMemoryTimeoutError,
  assertSafeSummary,
  mapWorkspaceToBankId,
  type AgentMemoryAdapter,
  type RecallQuery,
  type RecalledIncident,
  type ReflectionRequest,
  type ReflectionResult,
  type RetainResult,
  type SafeMetadata,
  type SecurityIncidentInput,
} from "./types.js";

/** Minimal shape this file actually depends on — lets tests inject a fake without a live server. */
export interface HindsightWireClient {
  retain(
    bankId: string,
    content: string,
    options?: { metadata?: Record<string, string>; tags?: string[]; context?: string; signal?: AbortSignal },
  ): Promise<{ success: boolean; items_count: number }>;
  recall(
    bankId: string,
    query: string,
    options?: { tags?: string[]; signal?: AbortSignal },
  ): Promise<{
    results: Array<{
      text: string;
      metadata?: Record<string, string> | null;
      mentioned_at?: string | null;
      occurred_start?: string | null;
      scores?: { final: number } | null;
    }>;
  }>;
  reflect(
    bankId: string,
    query: string,
    options?: { tags?: string[]; includeFacts?: boolean; signal?: AbortSignal },
  ): Promise<{ text: string; based_on?: unknown }>;
}

export interface HindsightAgentMemoryClientOptions {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
  /** Injected for tests; defaults to a real HindsightClient built from baseUrl/apiKey. */
  client?: HindsightWireClient;
}

const DEFAULT_TIMEOUT_MS = 5000;

/** Known-safe keys only — anything else on a caller-supplied metadata object is dropped, not forwarded. */
const SAFE_METADATA_KEYS: Array<keyof SafeMetadata> = [
  "agentId",
  "actionType",
  "policyId",
  "decision",
  "promptHash",
  "source",
];

function toWireMetadata(metadata: SafeMetadata | undefined): Record<string, string> {
  if (!metadata) return {};
  const out: Record<string, string> = {};
  for (const key of SAFE_METADATA_KEYS) {
    const value = metadata[key];
    if (value !== undefined && value !== null) {
      out[key] = String(value);
    }
  }
  return out;
}

function fromWireMetadata(metadata: Record<string, string> | null | undefined): SafeMetadata {
  if (!metadata) return {};
  const out: SafeMetadata = {};
  for (const key of SAFE_METADATA_KEYS) {
    const value = metadata[key];
    if (value !== undefined) {
      (out as Record<string, string>)[key] = value;
    }
  }
  return out;
}

async function withTimeout<T>(operation: string, timeoutMs: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  // Race against an explicit timeout promise rather than relying on the
  // callee to reject when the AbortSignal fires — a real HTTP client wired
  // to `signal` will do that, but this guarantees the timeout is enforced
  // here regardless of whether the underlying call honors abort.
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new AgentMemoryTimeoutError(operation, timeoutMs));
    }, timeoutMs);
  });
  try {
    return await Promise.race([run(controller.signal), timeoutPromise]);
  } catch (err) {
    if (err instanceof AgentMemoryTimeoutError) {
      throw err;
    }
    // Deliberately do not include `err` details verbatim in the thrown message —
    // the underlying HindsightError can carry request details we don't want to
    // risk surfacing. The original error is kept only as `cause` for server-side logging.
    throw new AgentMemoryError(`Hindsight ${operation} failed`, err);
  } finally {
    clearTimeout(timer!);
  }
}

export class HindsightAgentMemoryClient implements AgentMemoryAdapter {
  private readonly client: HindsightWireClient;
  private readonly timeoutMs: number;

  constructor(options: HindsightAgentMemoryClientOptions) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.client =
      options.client ??
      (new HindsightClient({ baseUrl: options.baseUrl, apiKey: options.apiKey }) as unknown as HindsightWireClient);
  }

  async retainSecurityIncident(input: SecurityIncidentInput): Promise<RetainResult> {
    assertSafeSummary(input.summary);
    const bankId = mapWorkspaceToBankId(input.workspaceId);
    // `content` is built server-side from category/severity/summary only —
    // there is no code path in this method that can forward a raw prompt or
    // response, because SecurityIncidentInput has no such field.
    const content = `[${input.severity}] ${input.category}: ${input.summary}`;

    const response = await withTimeout("retain", this.timeoutMs, (signal) =>
      this.client.retain(bankId, content, {
        metadata: toWireMetadata(input.metadata),
        tags: input.tags,
        context: input.category,
        signal,
      }),
    );

    return {
      retained: response.success,
      bankId,
      source: "hindsight",
      itemsCount: response.items_count,
    };
  }

  async recallRelevantIncidents(query: RecallQuery): Promise<RecalledIncident[]> {
    const bankId = mapWorkspaceToBankId(query.workspaceId);
    const response = await withTimeout("recall", this.timeoutMs, (signal) =>
      this.client.recall(bankId, query.query, { tags: query.tags, signal }),
    );

    const results = response.results.slice(0, query.maxResults ?? 10);
    return results.map((r) => ({
      text: r.text,
      relevanceScore: r.scores?.final ?? null,
      occurredAt: r.mentioned_at ?? r.occurred_start ?? null,
      metadata: fromWireMetadata(r.metadata),
      source: "hindsight",
    }));
  }

  async reflectOnDecision(request: ReflectionRequest): Promise<ReflectionResult> {
    const bankId = mapWorkspaceToBankId(request.workspaceId);
    const response = await withTimeout("reflect", this.timeoutMs, (signal) =>
      this.client.reflect(bankId, request.question, { tags: request.tags, includeFacts: true, signal }),
    );

    const basedOnCount = Array.isArray(response.based_on)
      ? response.based_on.length
      : response.based_on && typeof response.based_on === "object"
        ? Object.keys(response.based_on as object).length
        : 0;

    return {
      answer: response.text,
      basedOnCount,
      source: "hindsight",
    };
  }
}
