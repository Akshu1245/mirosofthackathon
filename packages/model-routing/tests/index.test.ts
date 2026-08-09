import { describe, expect, it, vi } from "vitest";
import { createModelRoutingAdapter } from "../src/index.js";
import { CascadeflowRoutingClient } from "../src/cascadeflowClient.js";

const models = [
  { name: "gpt-4o-mini", provider: "openai" },
  { name: "gpt-4o", provider: "openai" },
];

describe("createModelRoutingAdapter", () => {
  it("uses cascadeflow by default — caller does not choose an implementation", async () => {
    const adapter = createModelRoutingAdapter();
    const decision = await adapter.decideRoute({ workspaceId: "ws_1", query: "hi", candidateModels: models });
    expect(decision.fallbackState).toBe("cascadeflow");
  });

  it("uses the local fallback when preferLocal is set", async () => {
    const adapter = createModelRoutingAdapter({ preferLocal: true });
    const decision = await adapter.decideRoute({ workspaceId: "ws_1", query: "hi", candidateModels: models });
    expect(decision.fallbackState).toBe("local_fallback");
  });

  it("falls back to local automatically if the cascadeflow client throws an unexpected error", async () => {
    const spy = vi
      .spyOn(CascadeflowRoutingClient.prototype, "decideRoute")
      .mockRejectedValueOnce(new Error("simulated cascadeflow failure"));
    const adapter = createModelRoutingAdapter();
    const decision = await adapter.decideRoute({ workspaceId: "ws_1", query: "hi", candidateModels: models });
    expect(decision.fallbackState).toBe("local_fallback");
    spy.mockRestore();
  });

  it("does not mask caller errors (empty candidateModels) by silently falling back", async () => {
    const adapter = createModelRoutingAdapter();
    await expect(
      adapter.decideRoute({ workspaceId: "ws_1", query: "hi", candidateModels: [] }),
    ).rejects.toThrow(/candidateModels must be a non-empty/);
  });

  it("every decision reports which implementation produced it", async () => {
    const adapter = createModelRoutingAdapter();
    const decision = await adapter.decideRoute({ workspaceId: "ws_1", query: "hi", candidateModels: models });
    expect(["cascadeflow", "local_fallback"]).toContain(decision.fallbackState);
  });
});
