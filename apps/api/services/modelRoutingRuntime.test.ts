import { afterEach, describe, expect, it } from "vitest";
import { getModelRoutingAdapter, __resetModelRoutingAdapterForTests } from "./modelRoutingRuntime";

describe("modelRoutingRuntime — process-wide singleton", () => {
  afterEach(() => {
    __resetModelRoutingAdapterForTests();
  });

  it("returns the exact same adapter instance across multiple calls", () => {
    const first = getModelRoutingAdapter();
    const second = getModelRoutingAdapter();
    expect(first).toBe(second);
  });

  it("uses cascadeflow (no credentials needed) by default", async () => {
    const adapter = getModelRoutingAdapter();
    const decision = await adapter.decideRoute({
      workspaceId: "ws_1",
      query: "hi",
      candidateModels: [{ name: "gpt-4o-mini", provider: "openai" }],
    });
    expect(decision.fallbackState).toBe("cascadeflow");
  });
});
