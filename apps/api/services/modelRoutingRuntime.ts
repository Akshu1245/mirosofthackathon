/**
 * Composition root for the model-routing adapter.
 *
 * Unlike agent-memory, cascadeflow's PreRouter needs no credentials and no
 * persistent state (each decideRoute() call is stateless), so a per-process
 * singleton here is purely a small perf/consistency convenience, not a
 * correctness requirement the way it is for agent-memory. Still created
 * once per process so callers share one instance rather than constructing
 * @rakshex/model-routing objects ad hoc in request handlers.
 */
import { createModelRoutingAdapter, type RoutingAdapter } from "@rakshex/model-routing";

let singleton: RoutingAdapter | undefined;

export function getModelRoutingAdapter(): RoutingAdapter {
  if (!singleton) {
    singleton = createModelRoutingAdapter();
  }
  return singleton;
}

/** Test-only: reset the singleton so tests don't leak state across files. */
export function __resetModelRoutingAdapterForTests(): void {
  singleton = undefined;
}
