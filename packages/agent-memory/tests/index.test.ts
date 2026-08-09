import { describe, expect, it } from "vitest";
import { createAgentMemoryAdapter } from "../src/index.js";

describe("createAgentMemoryAdapter", () => {
  it("defaults to the local fallback when no Hindsight config is supplied (no credentials in this environment)", async () => {
    const adapter = createAgentMemoryAdapter();
    const result = await adapter.retainSecurityIncident({
      workspaceId: "ws_1",
      category: "other",
      severity: "low",
      summary: "Test incident.",
    });
    expect(result.source).toBe("local_fallback");
  });

  it("uses the Hindsight client only when explicit config is supplied", async () => {
    const adapter = createAgentMemoryAdapter({
      hindsight: {
        baseUrl: "http://localhost:8888",
        client: {
          retain: async () => ({ success: true, items_count: 1 }),
          recall: async () => ({ results: [] }),
          reflect: async () => ({ text: "ok", based_on: [] }),
          listMentalModels: async () => ({ items: [] }),
          createMentalModel: async () => ({ mental_model_id: "mm_1", operation_id: "op_1" }),
          getMentalModel: async () => ({ content: "" }),
        },
      },
    });
    const result = await adapter.retainSecurityIncident({
      workspaceId: "ws_1",
      category: "other",
      severity: "low",
      summary: "Test incident.",
    });
    expect(result.source).toBe("hindsight");
  });

  it("every result from the factory-produced adapter reports its own source — no caller needs to know which implementation is active to use it correctly", async () => {
    const adapter = createAgentMemoryAdapter();
    const result = await adapter.retainSecurityIncident({
      workspaceId: "ws_1",
      category: "other",
      severity: "low",
      summary: "Test incident.",
    });
    expect(["hindsight", "local_fallback"]).toContain(result.source);
  });
});
