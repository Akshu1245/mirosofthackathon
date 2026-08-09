/**
 * Local fallback — NOT Hindsight.
 *
 * An in-process, per-instance store (never shared globally, never
 * persisted) implementing the same three-method contract. Used whenever no
 * Hindsight configuration is supplied (see index.ts) — which, per the
 * working agreement for this phase, is the default, since no Hindsight
 * credentials exist in this environment yet.
 *
 * Every returned object carries source: "local_fallback" and every answer
 * string is prefixed so nothing downstream can present this as Hindsight.
 */
import {
  AgentMemoryError,
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
  type WorkspacePatternSummary,
} from "./types.js";

interface StoredIncident {
  bankId: string;
  text: string;
  metadata: SafeMetadata;
  tags: string[];
  occurredAt: string;
}

function score(query: string, text: string): number {
  const q = query.toLowerCase().split(/\s+/).filter(Boolean);
  const t = text.toLowerCase();
  if (q.length === 0) return 0;
  const hits = q.filter((word) => t.includes(word)).length;
  return hits / q.length;
}

export class LocalFallbackAgentMemoryClient implements AgentMemoryAdapter {
  // Instance-scoped, not module-scoped — no cross-instance/cross-test leakage.
  private readonly store: StoredIncident[] = [];

  async retainSecurityIncident(input: SecurityIncidentInput): Promise<RetainResult> {
    assertSafeSummary(input.summary);
    const bankId = mapWorkspaceToBankId(input.workspaceId);
    const text = `[${input.severity}] ${input.category}: ${input.summary}`;
    this.store.push({
      bankId,
      text,
      metadata: input.metadata ?? {},
      tags: input.tags ?? [],
      occurredAt: input.occurredAt ?? new Date().toISOString(),
    });
    return { retained: true, bankId, source: "local_fallback", itemsCount: 1 };
  }

  async recallRelevantIncidents(query: RecallQuery): Promise<RecalledIncident[]> {
    if (!query.workspaceId) {
      throw new AgentMemoryError("workspaceId is required");
    }
    const bankId = mapWorkspaceToBankId(query.workspaceId);
    const maxResults = query.maxResults ?? 10;

    return this.store
      .filter((item) => item.bankId === bankId) // workspace isolation
      .filter((item) => !query.tags || query.tags.some((t) => item.tags.includes(t)))
      .map((item) => ({ item, relevance: score(query.query, item.text) }))
      .filter(({ relevance }) => relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults)
      .map(({ item, relevance }) => ({
        text: item.text,
        relevanceScore: relevance,
        occurredAt: item.occurredAt,
        metadata: item.metadata,
        source: "local_fallback" as const,
      }));
  }

  async reflectOnDecision(request: ReflectionRequest): Promise<ReflectionResult> {
    const relevant = await this.recallRelevantIncidents({
      workspaceId: request.workspaceId,
      query: request.question,
      tags: request.tags,
    });

    const answer =
      relevant.length === 0
        ? "local fallback — not Hindsight: no relevant prior incidents found for this workspace"
        : `local fallback — not Hindsight: ${relevant.length} related incident(s) found. Most relevant: "${relevant[0]!.text}"`;

    return { answer, basedOnCount: relevant.length, source: "local_fallback" };
  }

  /**
   * Deterministic, non-LLM tally over this instance's stored incidents —
   * no synthesis, no reasoning, just a count grouped by category. Exists
   * so the UI has something honest to show when no live Hindsight
   * instance is configured; never dressed up as pattern *learning*, which
   * is exactly what distinguishes this from the real mental-model path.
   */
  async getWorkspacePatternSummary(workspaceId: string): Promise<WorkspacePatternSummary> {
    const bankId = mapWorkspaceToBankId(workspaceId);
    const incidents = this.store.filter((item) => item.bankId === bankId);

    if (incidents.length === 0) {
      return {
        content: "local fallback — not Hindsight: no incidents retained yet for this workspace",
        source: "local_fallback",
        mentalModelId: null,
        basedOnCount: 0,
      };
    }

    const counts = new Map<string, number>();
    for (const item of incidents) {
      const match = /^\[(?:low|medium|high|critical)\] ([a-z_]+):/.exec(item.text);
      const category = match?.[1] ?? "other";
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    const [topCategory, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]!;

    return {
      content: `local fallback — not Hindsight: ${incidents.length} incident(s) retained for this workspace. Most common: ${topCategory} (${topCount}\u00d7).`,
      source: "local_fallback",
      mentalModelId: null,
      basedOnCount: incidents.length,
    };
  }
}
