/**
 * @rakshex/agent-memory — domain types.
 *
 * Public interface uses RaksHex domain concepts (security incidents,
 * decisions), not Hindsight's own vocabulary (banks, memory units) —
 * callers never construct a Hindsight request shape directly.
 *
 * Hard rule enforced at the type level: there is no field anywhere in this
 * file for a raw prompt or raw model response. `summary` must be a short,
 * server-authored sentence describing what happened, not a transcript.
 * See hindsightClient.ts for the runtime length guard that backs this up.
 */

export type IncidentCategory =
  | "prompt_injection"
  | "pii_exposure"
  | "policy_violation"
  | "credential_misuse"
  | "approval_decision"
  | "false_positive"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentDecision = "allow" | "deny" | "require_approval" | "redact" | "alert_only";

/**
 * Deliberately NOT a free-form Record<string,string> — an explicit,
 * closed set of fields. This is the "metadata must contain only safe
 * non-sensitive values" requirement enforced structurally: a caller
 * cannot pass an arbitrary key that later leaks something sensitive,
 * because the type has no index signature. hindsightClient.ts also
 * strips any unexpected keys at runtime as defense in depth against
 * callers that bypass the type system (e.g. plain JS callers).
 */
export interface SafeMetadata {
  agentId?: string;
  actionType?: string;
  policyId?: string;
  decision?: IncidentDecision;
  /** Hash of the raw content for correlation only — never the raw content itself. */
  promptHash?: string;
  source?: string;
}

const MAX_SUMMARY_LENGTH = 600;

export interface SecurityIncidentInput {
  workspaceId: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  /**
   * Server-authored summary sentence(s), e.g. "Prompt-injection attempt
   * blocked: agent tried to override system instructions via a fake
   * <system> tag." NOT the raw prompt or raw response. Enforced at
   * runtime in hindsightClient.ts and localFallback.ts (both call
   * assertSafeSummary before doing anything else).
   */
  summary: string;
  metadata?: SafeMetadata;
  occurredAt?: string;
  tags?: string[];
}

export function assertSafeSummary(summary: string): void {
  if (!summary || summary.trim().length === 0) {
    throw new AgentMemoryError("summary must be a non-empty, server-authored sentence");
  }
  if (summary.length > MAX_SUMMARY_LENGTH) {
    throw new AgentMemoryError(
      `summary exceeds ${MAX_SUMMARY_LENGTH} chars — retain only concise server-created summaries, never raw prompts/transcripts`,
    );
  }
}

export type MemorySource = "hindsight" | "local_fallback";

export interface RetainResult {
  retained: boolean;
  bankId: string;
  source: MemorySource;
  itemsCount?: number;
}

export interface RecallQuery {
  workspaceId: string;
  query: string;
  maxResults?: number;
  tags?: string[];
}

export interface RecalledIncident {
  text: string;
  relevanceScore: number | null;
  occurredAt: string | null;
  metadata: SafeMetadata;
  source: MemorySource;
}

export interface ReflectionRequest {
  workspaceId: string;
  question: string;
  tags?: string[];
}

export interface ReflectionResult {
  answer: string;
  basedOnCount: number;
  source: MemorySource;
}

export interface WorkspacePatternSummary {
  /** Synthesized text describing recurring patterns across this workspace's retained incidents. */
  content: string;
  source: MemorySource;
  /** Hindsight mental model id backing this summary. null for local fallback (no mental model concept there). */
  mentalModelId: string | null;
  /** How many incidents the summary is grounded in. 0 means nothing to synthesize yet. */
  basedOnCount: number;
}

export interface AgentMemoryAdapter {
  retainSecurityIncident(input: SecurityIncidentInput): Promise<RetainResult>;
  recallRelevantIncidents(query: RecallQuery): Promise<RecalledIncident[]>;
  reflectOnDecision(request: ReflectionRequest): Promise<ReflectionResult>;
  /**
   * MVP mental-models integration (added 2026-08-09, see
   * docs/hindsight-architecture-review.md). One synthesized summary per
   * workspace answering "what recurring security risk patterns exist
   * here" — the difference between remembering individual incidents and
   * learning across them. Hindsight impl: get-or-create a single named
   * mental model per bank, then fetch its content (a fast key-value
   * lookup per the architect skill's own guidance, not a search). Local
   * fallback impl: a deterministic, non-LLM tally over locally stored
   * incidents, clearly labeled as such — never claims synthesis it did
   * not do.
   */
  getWorkspacePatternSummary(workspaceId: string): Promise<WorkspacePatternSummary>;
}

export class AgentMemoryError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "AgentMemoryError";
  }
}

export class AgentMemoryTimeoutError extends AgentMemoryError {
  constructor(operation: string, timeoutMs: number) {
    super(`Hindsight ${operation} timed out after ${timeoutMs}ms`);
    this.name = "AgentMemoryTimeoutError";
  }
}

/**
 * Deterministic workspace -> Hindsight bank id mapping. This is the ONLY
 * place a bank id is constructed anywhere in this package — both client
 * implementations call this, so isolation cannot be bypassed by
 * constructing a bank id differently in one code path.
 */
export function mapWorkspaceToBankId(workspaceId: string): string {
  if (!workspaceId || workspaceId.trim().length === 0) {
    throw new AgentMemoryError("workspaceId is required to derive a Hindsight bank id");
  }
  const sanitized = workspaceId.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `rakshex-ws-${sanitized}`;
}
