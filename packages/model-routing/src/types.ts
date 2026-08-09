/**
 * @rakshex/model-routing — domain types.
 *
 * This package is a DECISION-ONLY routing layer. It never calls a model
 * provider. Every function here answers "which model, and why" — the
 * caller (RaksHex's own gateway, apps/api/services/gateway/enforcement.ts)
 * is responsible for actually executing the provider call, after its own
 * policy/budget/kill-switch checks have run. See docs/cascadeflow-source-verification.md
 * for why this boundary is enforced structurally (no provider-calling class
 * is imported anywhere in this package) rather than by convention alone.
 */

/** Mirrors cascadeflow's own complexity buckets so the real client's output maps 1:1. */
export type RoutingComplexity = "trivial" | "simple" | "moderate" | "hard" | "expert";

/**
 * Whether — and why — the decision moved to a stronger model than a pure
 * complexity read would have chosen.
 *
 *  - "none": no escalation; the routing engine's own complexity read decided a cheap/cascade model was enough.
 *  - "escalated": the routing engine's own complexity read decided a strong model was needed (e.g. an "expert" query).
 *  - "forced_escalation": overridden to the strongest available candidate because the CALLER supplied a risk signal
 *    (suspicious / high_risk). This is never derived from cascadeflow's own output — cascadeflow classifies
 *    complexity, not security risk (verified in docs/cascadeflow-source-verification.md: a prompt-injection-shaped
 *    query was classified as merely "moderate" complexity by cascadeflow's own PreRouter). RaksHex's own
 *    security/policy layer must supply riskSignal; this package does not compute it.
 */
export type EscalationState = "none" | "escalated" | "forced_escalation";

/** Which implementation actually produced the decision. Always present so callers/UI can be honest about provenance. */
export type FallbackState = "cascadeflow" | "local_fallback";

/** A model the caller has already approved for use (e.g. via the gateway's allowlist). Ordering matters: index 0 is the cheapest/fastest candidate, the last entry is the strongest/most capable. */
export interface RouteModelOption {
  name: string;
  provider: string;
}

export type LatencyPreference = "realtime" | "interactive" | "standard" | "background";

export interface RoutingRequest {
  /** RaksHex workspace ID. Required — every decision is scoped to a workspace, no implicit global routing. */
  workspaceId: string;
  /** The user/agent query text. Used only for local complexity classification; never sent to a model provider by this package. */
  query: string;
  /** Pre-approved models, ordered cheap/fast -> strong/expensive. Must be non-empty. */
  candidateModels: RouteModelOption[];
  /**
   * Risk signal supplied by RaksHex's own security scanning (e.g. apps/api/api/agentGuard.ts's
   * prompt-injection/PII engines), NOT derived by this package. Optional; defaults to "none".
   */
  riskSignal?: "none" | "suspicious" | "high_risk";
  latencyPreference?: LatencyPreference;
  /** Optional caller-supplied token estimates; if omitted, a local heuristic is used (see cascadeflowClient.ts). */
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
}

export interface EstimatedCost {
  amountUsd: number;
  /** Always "estimate" today — this package never claims live/exact provider pricing. Mirrors packages/pricing-engine's own CostKind labelling. */
  kind: "estimate";
  pricingVersionId: string;
  notes: string[];
}

export interface RoutingDecision {
  workspaceId: string;
  model: string;
  provider: string;
  reason: string;
  complexity: RoutingComplexity;
  confidence: number;
  /** null only if no pricing entry exists for the chosen model in packages/pricing-engine's catalog. */
  estimatedCost: EstimatedCost | null;
  latencyTargetMs: number;
  escalation: EscalationState;
  fallbackState: FallbackState;
  decidedAt: string;
}

export interface RoutingAdapter {
  decideRoute(request: RoutingRequest): Promise<RoutingDecision>;
}

export class RoutingRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoutingRequestError";
  }
}
