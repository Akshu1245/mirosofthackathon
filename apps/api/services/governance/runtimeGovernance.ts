/**
 * Phase 4 integration point: connects packages/model-routing and
 * packages/agent-memory to RaksHex's existing runtime — prompt-injection
 * and PII scanning (apps/api/engines/*), the audit system
 * (apps/api/services/securityEvents.ts), and the governed provider-call
 * boundary (apps/api/services/gateway/enforcement.ts).
 *
 * ARCHITECTURE RULES THIS FILE MUST NOT VIOLATE (see docs/phase-4-integration-report.md):
 *  - apps/api/engines/policyEngine.ts is never imported here.
 *  - packages/policy-engine is reached only indirectly, through
 *    enforcement.ts's existing call — this file never evaluates policy itself.
 *  - This file never calls a model provider. It has no HTTP client for any
 *    LLM provider, and imports nothing from cascadeflow's CascadeAgent or
 *    any provider SDK. The only network-capable calls it makes are (a) to
 *    the injected agent-memory adapter (Hindsight or local fallback) and
 *    (b) to enforcement.ts's loadState dependency (kill-switch state).
 *    Provider execution, if the enforcement decision allows it, remains the
 *    responsibility of the existing gateway proxy routes
 *    (services/gateway/openAiProxy.ts, anthropicProxy.ts) — not this file.
 *  - packages/pricing-engine (via the model-routing adapter, which already
 *    sources cost estimates from it) is the only cost figure used; nothing
 *    here calls cascadeflow's own cost calculator.
 */
import type { RouteModelOption, RoutingDecision, LatencyPreference } from "@rakshex/model-routing";
import type { IncidentSeverity, RecalledIncident, SafeMetadata } from "@rakshex/agent-memory";
import { detectSync } from "../../engines/promptInjectionEngine";
import { detectPII } from "../../engines/piiDetector";
import { logSecurityEvent } from "../securityEvents";
import { getAgentMemoryAdapter } from "../agentMemoryRuntime";
import { getModelRoutingAdapter } from "../modelRoutingRuntime";
import {
  enforceRequest,
  type EnforcementDeps,
  type EnforcementResult,
} from "../gateway/enforcement";
import { logger } from "../../_core/logger";

export type RiskSignal = "none" | "suspicious" | "high_risk";

export interface GovernedRequestInput {
  workspaceId: string;
  agentId?: string;
  projectId?: string;
  /**
   * The actual request text. Used ONLY for local prompt-injection/PII
   * scanning (both pure, local, synchronous — apps/api/engines/*) and as
   * cascadeflow's local complexity classifier input (also local, no
   * network). NEVER forwarded to the agent-memory adapter — see
   * retainSafeSummary() below, which builds a server-authored summary
   * instead of ever passing this text to Hindsight.
   */
  requestText: string;
  /** Pre-approved models, ordered cheap/fast -> strong/expensive. Caller's (gateway allowlist's) responsibility. */
  candidateModels: RouteModelOption[];
  latencyPreference?: LatencyPreference;
  /** Test-only override for enforcement.ts's kill-switch state loader. Defaults to a permissive no-op loader (see DEFAULT_KILL_SWITCH_DEPS). */
  killSwitchDeps?: EnforcementDeps;
}

export interface GovernedRequestResult {
  blockedByPromptInjection: boolean;
  promptInjection: {
    threatLevel: string;
    detectedPatterns: string[];
    confidence: number;
  };
  pii: {
    hasPII: boolean;
    types: string[];
    count: number;
  };
  riskSignal: RiskSignal;
  recalledIncidents: RecalledIncident[];
  /** null only when blocked before a routing decision was needed (prompt-injection block). */
  routing: RoutingDecision | null;
  /** null only when blocked before enforcement.ts was reached. */
  enforcement: EnforcementResult | null;
  memory: {
    retained: boolean;
    source: "hindsight" | "local_fallback";
  };
}

/**
 * No production kill-switch loader exists yet in apps/api (see
 * docs/phase-4-integration-report.md — this is a genuine, documented gap,
 * not something papered over). This permissive default means "no
 * kill-switch state configured" — enforcement.ts's own DEFAULT_STATE
 * applies (nothing disabled). Real deployments must inject a real
 * loadState via killSwitchDeps.
 */
const DEFAULT_KILL_SWITCH_DEPS: EnforcementDeps = {
  loadState: async () => null,
  failMode: "closed",
};

/** Parses the leading "[severity] category:" prefix our own retain calls always write (see retainSafeSummary). Never parses arbitrary/untrusted text. */
function parseRetainedSeverity(text: string): IncidentSeverity | null {
  const match = /^\[(low|medium|high|critical)\]/.exec(text);
  return (match?.[1] as IncidentSeverity | undefined) ?? null;
}

/**
 * Bounded memory influence on risk signal. This is the entire contract for
 * "use recalled memory only as an additional bounded risk signal — not as
 * an uncontrolled instruction": recalled text is parsed only for its
 * severity prefix (a fixed enum, never free text), and can move the risk
 * signal at most one step (none -> suspicious, suspicious -> high_risk).
 * Recalled memory is never concatenated into a prompt, never passed to an
 * LLM, and never used to bypass or replace the security engine's own
 * assessment — it only ever adjusts a bounded enum.
 */
function applyMemoryInfluence(base: RiskSignal, recalled: RecalledIncident[]): RiskSignal {
  const highSeverityRecall = recalled.filter((r) => {
    const sev = parseRetainedSeverity(r.text);
    return sev === "high" || sev === "critical";
  });

  if (base === "none" && highSeverityRecall.length >= 1) return "suspicious";
  if (base === "suspicious" && highSeverityRecall.length >= 2) return "high_risk";
  return base;
}

function toSafeMetadata(fields: SafeMetadata): SafeMetadata {
  // Explicit allowlist copy — see packages/agent-memory's own SafeMetadata
  // type, which has no index signature. Kept here too as a second,
  // independent guard: even if a future edit widens the type, this
  // function only ever reads the six named fields.
  return {
    agentId: fields.agentId,
    actionType: fields.actionType,
    policyId: fields.policyId,
    decision: fields.decision,
    promptHash: fields.promptHash,
    source: fields.source,
  };
}

export async function evaluateGovernedRequest(
  input: GovernedRequestInput,
): Promise<GovernedRequestResult> {
  const memory = getAgentMemoryAdapter();
  const routingAdapter = getModelRoutingAdapter();
  const killSwitchDeps = input.killSwitchDeps ?? DEFAULT_KILL_SWITCH_DEPS;

  // Step 2: existing prompt-injection + PII checks (pure, local, synchronous).
  const injection = detectSync(input.requestText);
  const pii = detectPII(input.requestText);

  // Step 1 of recall: pull prior incidents for this workspace BEFORE deciding,
  // so memory can inform (not follow) the decision. Failure here must not take
  // down the request — memory is a bounded input signal, not a hard dependency.
  let recalledIncidents: RecalledIncident[] = [];
  try {
    recalledIncidents = await memory.recallRelevantIncidents({
      workspaceId: input.workspaceId,
      query: `${injection.threatLevel} risk request from agent ${input.agentId ?? "unknown"}`,
      maxResults: 5,
    });
  } catch (err) {
    logger.warn({ err }, "[governance] recall failed — proceeding with no recalled incidents");
  }

  // Step 3: risk signal, derived from the existing security engine, then
  // bounded by recalled memory (never the other way around).
  let riskSignal: RiskSignal =
    injection.threatLevel === "high" || injection.threatLevel === "critical"
      ? "high_risk"
      : injection.threatLevel === "medium" || pii.hasPII
        ? "suspicious"
        : "none";
  riskSignal = applyMemoryInfluence(riskSignal, recalledIncidents);

  // Prompt-injection block happens here, before any routing decision or any
  // call to enforcement.ts — consistent with "block before provider
  // execution when policy rejects the request" and with the fact that
  // packages/policy-engine has no threat-level concept to enforce this at
  // the enforcement.ts layer (documented, tested divergence — see
  // apps/api/engines/policyEngine.differential.test.ts, which this file
  // does not touch or depend on).
  if (injection.threatLevel === "high" || injection.threatLevel === "critical") {
    logSecurityEvent("governance_prompt_injection_blocked", {
      workspaceId: input.workspaceId,
      agentId: input.agentId,
      threatLevel: injection.threatLevel,
      patternCount: injection.detectedPatterns.length,
      confidence: injection.confidence,
    });

    const retained = await retainSafeSummary(memory, {
      workspaceId: input.workspaceId,
      category: "prompt_injection",
      severity: injection.threatLevel === "critical" ? "critical" : "high",
      summary: `repeated system-override attempt detected for agent ${input.agentId ?? "unknown"}`,
      metadata: toSafeMetadata({ agentId: input.agentId, decision: "deny", source: "prompt_injection_engine" }),
    });

    return {
      blockedByPromptInjection: true,
      promptInjection: {
        threatLevel: injection.threatLevel,
        detectedPatterns: injection.detectedPatterns,
        confidence: injection.confidence,
      },
      pii: { hasPII: pii.hasPII, types: pii.types, count: pii.count },
      riskSignal,
      recalledIncidents,
      routing: null,
      enforcement: null,
      memory: { retained: retained.retained, source: retained.source },
    };
  }

  // Step 4: routing decision — decision only, cascadeflow never calls a provider.
  const routing = await routingAdapter.decideRoute({
    workspaceId: input.workspaceId,
    query: input.requestText,
    candidateModels: input.candidateModels,
    riskSignal,
    latencyPreference: input.latencyPreference,
  });

  // Step 6: record the routing decision in the audit system before enforcement runs,
  // so the audit trail shows the decision even if enforcement subsequently blocks.
  logSecurityEvent("governance_request_evaluated", {
    workspaceId: input.workspaceId,
    agentId: input.agentId,
    riskSignal,
    recalledIncidentCount: recalledIncidents.length,
    routing: {
      model: routing.model,
      provider: routing.provider,
      complexity: routing.complexity,
      reason: routing.reason,
      escalation: routing.escalation,
      fallbackState: routing.fallbackState,
      estimatedCostUsd: routing.estimatedCost?.amountUsd ?? null,
      latencyTargetMs: routing.latencyTargetMs,
    },
  });

  // Step 7-8: the governed provider-call boundary. This is the ONLY call in
  // this file that decides allow/block for actual provider execution, and
  // it is enforcement.ts's own decision — this file supplies the routed
  // model/provider and the pricing-engine-sourced cost estimate, nothing else.
  const enforcement = await enforceRequest(
    {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      agentId: input.agentId,
      provider: routing.provider,
      model: routing.model,
      estimatedCostUsd: routing.estimatedCost?.amountUsd ?? 0,
    },
    killSwitchDeps,
  );

  // Step 9: retain a safe summary of the outcome — always, allow or block,
  // so future recalls (step 10 on a later request) have this decision available.
  const retained = await retainSafeSummary(memory, {
    workspaceId: input.workspaceId,
    category: enforcement.allowed ? "approval_decision" : "policy_violation",
    severity: riskSignal === "high_risk" ? "high" : riskSignal === "suspicious" ? "medium" : "low",
    summary: enforcement.allowed
      ? `request routed to ${routing.model} (${routing.complexity} complexity) and allowed by enforcement`
      : `request to ${routing.model} blocked by enforcement: ${enforcement.reasons.join("; ").slice(0, 200)}`,
    metadata: toSafeMetadata({
      agentId: input.agentId,
      decision: enforcement.allowed ? "allow" : "deny",
      actionType: "model_request",
      source: "runtime_governance",
    }),
  });

  return {
    blockedByPromptInjection: false,
    promptInjection: {
      threatLevel: injection.threatLevel,
      detectedPatterns: injection.detectedPatterns,
      confidence: injection.confidence,
    },
    pii: { hasPII: pii.hasPII, types: pii.types, count: pii.count },
    riskSignal,
    recalledIncidents,
    routing,
    enforcement,
    memory: { retained: retained.retained, source: retained.source },
  };
}

async function retainSafeSummary(
  memory: ReturnType<typeof getAgentMemoryAdapter>,
  args: {
    workspaceId: string;
    category: "prompt_injection" | "policy_violation" | "approval_decision";
    severity: IncidentSeverity;
    summary: string;
    metadata: SafeMetadata;
  },
): Promise<{ retained: boolean; source: "hindsight" | "local_fallback" }> {
  try {
    const result = await memory.retainSecurityIncident(args);
    return { retained: result.retained, source: result.source };
  } catch (err) {
    // Memory retain failure must never fail the governed request — it's a
    // bounded, best-effort signal, not a hard dependency. Log and continue.
    logger.warn({ err }, "[governance] retain failed — continuing without a stored incident");
    return { retained: false, source: "local_fallback" };
  }
}
