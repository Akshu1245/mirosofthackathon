import { afterEach, describe, expect, it } from "vitest";
import { getAgentMemoryAdapter, __resetAgentMemoryAdapterForTests } from "./agentMemoryRuntime";

describe("agentMemoryRuntime — process-wide singleton lifecycle", () => {
  afterEach(() => {
    __resetAgentMemoryAdapterForTests();
  });

  it("returns the exact same adapter instance across multiple calls (not a fresh instance per call)", () => {
    const first = getAgentMemoryAdapter();
    const second = getAgentMemoryAdapter();
    const third = getAgentMemoryAdapter();
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it("defaults to the local fallback in this environment (no HINDSIGHT_BASE_URL configured)", async () => {
    const adapter = getAgentMemoryAdapter();
    const result = await adapter.retainSecurityIncident({
      workspaceId: "ws_singleton_test",
      category: "other",
      severity: "low",
      summary: "Singleton lifecycle test incident.",
    });
    expect(result.source).toBe("local_fallback");
  });

  it("retained data persists across separate getAgentMemoryAdapter() call sites — simulating separate request handlers", async () => {
    // Simulates request handler 1
    const handlerOneAdapter = getAgentMemoryAdapter();
    await handlerOneAdapter.retainSecurityIncident({
      workspaceId: "ws_singleton_persist",
      category: "policy_violation",
      severity: "medium",
      summary: "Retained by simulated request handler 1.",
    });

    // Simulates request handler 2 — a different call site, same process
    const handlerTwoAdapter = getAgentMemoryAdapter();
    const recalled = await handlerTwoAdapter.recallRelevantIncidents({
      workspaceId: "ws_singleton_persist",
      query: "policy violation",
    });

    expect(recalled.length).toBeGreaterThan(0);
  });
});
