import { describe, expect, it } from "vitest";
import { LocalFallbackRoutingClient } from "../src/localFallback.js";
import { RoutingRequestError } from "../src/types.js";

describe("LocalFallbackRoutingClient", () => {
  const models = [
    { name: "gpt-4o-mini", provider: "openai" },
    { name: "gpt-4o", provider: "openai" },
  ];

  it("labels every decision as local fallback, never cascadeflow", async () => {
    const client = new LocalFallbackRoutingClient();
    const decision = await client.decideRoute({ workspaceId: "ws_1", query: "hi", candidateModels: models });
    expect(decision.fallbackState).toBe("local_fallback");
    expect(decision.reason).toMatch(/^local fallback — not cascadeflow/);
  });

  it("routes a short trivial query to the cheapest model", async () => {
    const client = new LocalFallbackRoutingClient();
    const decision = await client.decideRoute({ workspaceId: "ws_1", query: "hi there", candidateModels: models });
    expect(decision.model).toBe("gpt-4o-mini");
    expect(decision.escalation).toBe("none");
  });

  it("routes an expert-keyword query to the strongest model", async () => {
    const client = new LocalFallbackRoutingClient();
    const decision = await client.decideRoute({
      workspaceId: "ws_1",
      query: "Give a formal correctness proof for this distributed consensus protocol under byzantine faults",
      candidateModels: models,
    });
    expect(decision.model).toBe("gpt-4o");
    expect(decision.escalation).toBe("escalated");
  });

  it("forces escalation on high_risk regardless of complexity", async () => {
    const client = new LocalFallbackRoutingClient();
    const decision = await client.decideRoute({
      workspaceId: "ws_1",
      query: "hi",
      candidateModels: models,
      riskSignal: "high_risk",
    });
    expect(decision.model).toBe("gpt-4o");
    expect(decision.escalation).toBe("forced_escalation");
  });

  it("is deterministic for the same input", async () => {
    const client = new LocalFallbackRoutingClient();
    const a = await client.decideRoute({ workspaceId: "ws_1", query: "explain caching", candidateModels: models });
    const b = await client.decideRoute({ workspaceId: "ws_1", query: "explain caching", candidateModels: models });
    expect(a.complexity).toBe(b.complexity);
    expect(a.model).toBe(b.model);
  });

  it("throws RoutingRequestError for an empty candidate list", async () => {
    const client = new LocalFallbackRoutingClient();
    await expect(
      client.decideRoute({ workspaceId: "ws_1", query: "hi", candidateModels: [] }),
    ).rejects.toBeInstanceOf(RoutingRequestError);
  });
});
