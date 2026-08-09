/**
 * Real cascadeflow-backed implementation.
 *
 * Verified against the installed @cascadeflow/core package (see
 * docs/cascadeflow-source-verification.md): PreRouter.route() is a
 * general-purpose, decision-only routing primitive backed by a local
 * keyword/pattern ComplexityDetector. It makes no network call and
 * requires no API key or credential of any kind. This client never
 * imports CascadeAgent or any provider-calling class from cascadeflow —
 * that is enforced by what this file imports, not just by convention.
 */
import { PreRouter, RoutingDecisionHelper, CostCalculator } from "@cascadeflow/core";
import { calculateCost } from "@rakshex/pricing-engine";
import type {
  EscalationState,
  EstimatedCost,
  LatencyPreference,
  RoutingAdapter,
  RoutingComplexity,
  RoutingDecision,
  RoutingRequest,
} from "./types.js";
import { RoutingRequestError } from "./types.js";

/**
 * RaksHex-owned default latency targets, independent of cascadeflow's own
 * internal presets, to avoid a second source of truth for "what does
 * 'interactive' mean" — mirrors the design decision already applied to
 * cost (packages/pricing-engine is the single source of truth for cost;
 * this map is the single source of truth for latency targets).
 */
const LATENCY_TARGET_MS: Record<LatencyPreference, number> = {
  realtime: 800,
  interactive: 2500,
  standard: 8000,
  background: 30000,
};

function pickModel(
  candidateModels: RoutingRequest["candidateModels"],
  useStrongest: boolean,
) {
  return useStrongest
    ? candidateModels[candidateModels.length - 1]!
    : candidateModels[0]!;
}

function estimateCost(
  provider: string,
  model: string,
  query: string,
  estimatedInputTokens: number | undefined,
  estimatedOutputTokens: number | undefined,
): EstimatedCost | null {
  // CostCalculator.estimateTokens is a pure, local, static heuristic (no
  // network call) — reused only for token counting, not for pricing, so it
  // does not reintroduce the two-source-of-truth cost problem.
  const inputTokens = estimatedInputTokens ?? CostCalculator.estimateTokens(query);
  // No signal exists yet about output length before generation; a 2x-input,
  // capped heuristic is a deliberately rough placeholder — always labelled
  // "estimate" downstream via pricing-engine's own CostKind.
  const outputTokens = estimatedOutputTokens ?? Math.min(inputTokens * 2, 2000);

  const record = calculateCost({ provider, model, inputTokens, outputTokens });
  if (record.pricingVersionId === "none") {
    return null;
  }
  return {
    amountUsd: record.amountUsd,
    kind: "estimate",
    pricingVersionId: record.pricingVersionId,
    notes: record.notes,
  };
}

export class CascadeflowRoutingClient implements RoutingAdapter {
  private readonly router: PreRouter;

  constructor() {
    this.router = new PreRouter({ enableCascade: true, verbose: false });
  }

  async decideRoute(request: RoutingRequest): Promise<RoutingDecision> {
    if (!request.candidateModels || request.candidateModels.length === 0) {
      throw new RoutingRequestError("candidateModels must be a non-empty, caller-approved list");
    }
    if (!request.workspaceId) {
      throw new RoutingRequestError("workspaceId is required");
    }

    const riskSignal = request.riskSignal ?? "none";
    const latencyPreference = request.latencyPreference ?? "standard";

    const cfDecision = await this.router.route(request.query);
    RoutingDecisionHelper.validate(cfDecision);

    const complexity = (cfDecision.metadata?.["complexity"] as RoutingComplexity | undefined) ?? "moderate";
    const cascadeflowWantsStrong = RoutingDecisionHelper.isDirect(cfDecision);

    let useStrongest = cascadeflowWantsStrong;
    let escalation: EscalationState = cascadeflowWantsStrong ? "escalated" : "none";
    let reason = cfDecision.reason;

    // Risk-based escalation is layered on top of, never derived from,
    // cascadeflow's complexity read (see docs/cascadeflow-source-verification.md —
    // cascadeflow does not classify security risk).
    if (riskSignal === "high_risk") {
      useStrongest = true;
      escalation = "forced_escalation";
      reason = `forced to strongest approved model: caller-supplied risk signal "high_risk" (cascadeflow's own read: ${cfDecision.reason})`;
    } else if (riskSignal === "suspicious" && !useStrongest) {
      useStrongest = true;
      escalation = "escalated";
      reason = `escalated due to caller-supplied risk signal "suspicious" (cascadeflow's own read: ${cfDecision.reason})`;
    }

    const chosen = pickModel(request.candidateModels, useStrongest);

    return {
      workspaceId: request.workspaceId,
      model: chosen.name,
      provider: chosen.provider,
      reason,
      complexity,
      confidence: cfDecision.confidence,
      estimatedCost: estimateCost(
        chosen.provider,
        chosen.name,
        request.query,
        request.estimatedInputTokens,
        request.estimatedOutputTokens,
      ),
      latencyTargetMs: LATENCY_TARGET_MS[latencyPreference],
      escalation,
      fallbackState: "cascadeflow",
      decidedAt: new Date().toISOString(),
    };
  }
}
