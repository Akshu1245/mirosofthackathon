export type {
  AgentMemoryAdapter,
  IncidentCategory,
  IncidentDecision,
  IncidentSeverity,
  MemorySource,
  RecallQuery,
  RecalledIncident,
  ReflectionRequest,
  ReflectionResult,
  RetainResult,
  SafeMetadata,
  SecurityIncidentInput,
  WorkspacePatternSummary,
} from "./types.js";
export { AgentMemoryError, AgentMemoryTimeoutError, mapWorkspaceToBankId } from "./types.js";

export { HindsightAgentMemoryClient } from "./hindsightClient.js";
export type { HindsightAgentMemoryClientOptions, HindsightWireClient } from "./hindsightClient.js";
export { LocalFallbackAgentMemoryClient } from "./localFallback.js";

import type { AgentMemoryAdapter } from "./types.js";
import { HindsightAgentMemoryClient, type HindsightAgentMemoryClientOptions } from "./hindsightClient.js";
import { LocalFallbackAgentMemoryClient } from "./localFallback.js";

export interface AgentMemoryAdapterOptions {
  /**
   * Only when this is supplied does the real Hindsight client get used.
   * With no config (the default in this environment today — no Hindsight
   * credentials exist yet), the local fallback is used, clearly labelled.
   * This mirrors the working agreement: do not default to "try Hindsight"
   * the way the cascadeflow adapter defaults to "try cascadeflow", because
   * Hindsight cannot function at all without an LLM key behind it, so
   * defaulting to it would just fail on every call.
   */
  hindsight?: HindsightAgentMemoryClientOptions;
}

/**
 * Callers use this factory, never the two client classes directly — which
 * implementation is active is an internal detail. Every result object
 * still carries `source` so audit/UI code that DOES care can be honest
 * about provenance.
 */
export function createAgentMemoryAdapter(options: AgentMemoryAdapterOptions = {}): AgentMemoryAdapter {
  if (options.hindsight) {
    return new HindsightAgentMemoryClient(options.hindsight);
  }
  return new LocalFallbackAgentMemoryClient();
}
