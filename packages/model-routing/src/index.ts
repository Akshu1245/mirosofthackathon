export type {
  EscalationState,
  EstimatedCost,
  FallbackState,
  LatencyPreference,
  RouteModelOption,
  RoutingAdapter,
  RoutingComplexity,
  RoutingDecision,
  RoutingRequest,
} from "./types.js";
export { RoutingRequestError } from "./types.js";

import type { RoutingAdapter, RoutingDecision, RoutingRequest } from "./types.js";
import { CascadeflowRoutingClient } from "./cascadeflowClient.js";
import { LocalFallbackRoutingClient } from "./localFallback.js";

export { CascadeflowRoutingClient } from "./cascadeflowClient.js";
export { LocalFallbackRoutingClient } from "./localFallback.js";

export interface ModelRoutingAdapterOptions {
  /** Force the local (non-cascadeflow) fallback even if cascadeflow is available. Defaults to false. */
  preferLocal?: boolean;
}

/**
 * Callers should use this factory, not the two client classes directly, so
 * that which implementation is active is an internal detail — the returned
 * adapter's decideRoute() signature is identical either way, and every
 * RoutingDecision carries fallbackState so nothing is hidden from callers
 * that DO care (e.g. the UI, audit log).
 */
class ModelRoutingAdapter implements RoutingAdapter {
  constructor(private readonly primary: RoutingAdapter, private readonly fallback: RoutingAdapter) {}

  async decideRoute(request: RoutingRequest): Promise<RoutingDecision> {
    try {
      return await this.primary.decideRoute(request);
    } catch (err) {
      if (err instanceof Error && err.name === "RoutingRequestError") {
        // Caller error (e.g. empty candidateModels) — do not mask it by
        // silently falling back; the fallback would fail identically.
        throw err;
      }
      return this.fallback.decideRoute(request);
    }
  }
}

export function createModelRoutingAdapter(options: ModelRoutingAdapterOptions = {}): RoutingAdapter {
  const fallback = new LocalFallbackRoutingClient();
  if (options.preferLocal) {
    return fallback;
  }
  const primary = new CascadeflowRoutingClient();
  return new ModelRoutingAdapter(primary, fallback);
}
