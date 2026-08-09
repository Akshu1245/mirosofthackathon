/**
 * Local fallback — NOT cascadeflow.
 *
 * A deliberately simple, deterministic, keyword/length heuristic used only
 * when the real cascadeflow client is unavailable or throws. Every reason
 * string is prefixed so no caller or UI can mistake this for a cascadeflow
 * decision. No network call, no dependency on @cascadeflow/core at all.
 */
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

const LATENCY_TARGET_MS: Record<LatencyPreference, number> = {
  realtime: 800,
  interactive: 2500,
  standard: 8000,
  background: 30000,
};

const EXPERT_HINTS = /\b(prove|proof|formal verification|distributed consensus|byzantine|complexity theory|thesis)\b/i;
const HARD_HINTS = /\b(algorithm|architecture|optimi[sz]e|refactor|design pattern|concurrency)\b/i;
const TRIVIAL_HINTS = /^(hi|hello|hey|thanks|ok|yes|no)\b/i;

function classify(query: string): RoutingComplexity {
  const wordCount = query.trim().split(/\s+/).filter(Boolean).length;
  if (TRIVIAL_HINTS.test(query.trim()) || wordCount <= 4) return "trivial";
  if (EXPERT_HINTS.test(query)) return "expert";
  if (HARD_HINTS.test(query)) return "hard";
  if (wordCount > 40) return "moderate";
  return "simple";
}

function estimateTokensLocally(text: string): number {
  // Rough char/4 heuristic, same order of magnitude as common tokenizer
  // averages for English text — explicitly a placeholder, not a tokenizer.
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateCost(
  provider: string,
  model: string,
  query: string,
  estimatedInputTokens: number | undefined,
  estimatedOutputTokens: number | undefined,
): EstimatedCost | null {
  const inputTokens = estimatedInputTokens ?? estimateTokensLocally(query);
  const outputTokens = estimatedOutputTokens ?? Math.min(inputTokens * 2, 2000);
  const record = calculateCost({ provider, model, inputTokens, outputTokens });
  if (record.pricingVersionId === "none") return null;
  return {
    amountUsd: record.amountUsd,
    kind: "estimate",
    pricingVersionId: record.pricingVersionId,
    notes: [...record.notes, "local fallback — not cascadeflow"],
  };
}

export class LocalFallbackRoutingClient implements RoutingAdapter {
  async decideRoute(request: RoutingRequest): Promise<RoutingDecision> {
    if (!request.candidateModels || request.candidateModels.length === 0) {
      throw new RoutingRequestError("candidateModels must be a non-empty, caller-approved list");
    }
    if (!request.workspaceId) {
      throw new RoutingRequestError("workspaceId is required");
    }

    const riskSignal = request.riskSignal ?? "none";
    const latencyPreference = request.latencyPreference ?? "standard";
    const complexity = classify(request.query);

    let useStrongest = complexity === "expert" || complexity === "hard";
    let escalation: EscalationState = useStrongest ? "escalated" : "none";
    let reason = `local fallback — not cascadeflow: keyword/length heuristic classified query as "${complexity}"`;

    if (riskSignal === "high_risk") {
      useStrongest = true;
      escalation = "forced_escalation";
      reason = `local fallback — not cascadeflow: forced to strongest approved model due to caller-supplied risk signal "high_risk"`;
    } else if (riskSignal === "suspicious" && !useStrongest) {
      useStrongest = true;
      escalation = "escalated";
      reason = `local fallback — not cascadeflow: escalated due to caller-supplied risk signal "suspicious"`;
    }

    const chosen = useStrongest
      ? request.candidateModels[request.candidateModels.length - 1]!
      : request.candidateModels[0]!;

    return {
      workspaceId: request.workspaceId,
      model: chosen.name,
      provider: chosen.provider,
      reason,
      complexity,
      confidence: 0.5, // heuristic — deliberately not overstated relative to cascadeflow's calibrated confidence
      estimatedCost: estimateCost(
        chosen.provider,
        chosen.name,
        request.query,
        request.estimatedInputTokens,
        request.estimatedOutputTokens,
      ),
      latencyTargetMs: LATENCY_TARGET_MS[latencyPreference],
      escalation,
      fallbackState: "local_fallback",
      decidedAt: new Date().toISOString(),
    };
  }
}
