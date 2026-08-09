import { describe, expect, it, vi } from "vitest";
import { HindsightAgentMemoryClient, type HindsightWireClient } from "../src/hindsightClient.js";
import { mapWorkspaceToBankId, AgentMemoryError, AgentMemoryTimeoutError } from "../src/types.js";

/**
 * No live Hindsight server or LLM key exists in this environment (see
 * docs/hindsight-adapter-status.md). These tests inject a fake
 * HindsightWireClient that implements the same method shapes as the real
 * @vectorize-io/hindsight-client, so the adapter's own logic — bank id
 * derivation, content construction, metadata filtering, timeout handling,
 * error mapping — is verified without a network dependency. This is NOT a
 * claim that the real Hindsight integration has been exercised live.
 */
function fakeClient(overrides: Partial<HindsightWireClient> = {}): HindsightWireClient {
  return {
    retain: vi.fn().mockResolvedValue({ success: true, items_count: 1 }),
    recall: vi.fn().mockResolvedValue({ results: [] }),
    reflect: vi.fn().mockResolvedValue({ text: "no relevant memories", based_on: [] }),
    listMentalModels: vi.fn().mockResolvedValue({ items: [] }),
    createMentalModel: vi.fn().mockResolvedValue({ mental_model_id: "mm_default", operation_id: "op_default" }),
    getMentalModel: vi.fn().mockResolvedValue({ content: "" }),
    ...overrides,
  };
}

describe("HindsightAgentMemoryClient — retainSecurityIncident", () => {
  it("never sends the raw content field as anything other than the server-built summary string", async () => {
    const retain = vi.fn().mockResolvedValue({ success: true, items_count: 1 });
    const client = new HindsightAgentMemoryClient({ baseUrl: "http://localhost:8888", client: fakeClient({ retain }) });

    await client.retainSecurityIncident({
      workspaceId: "ws_1",
      category: "prompt_injection",
      severity: "high",
      summary: "Blocked an attempt to override system instructions.",
    });

    expect(retain).toHaveBeenCalledTimes(1);
    const [bankId, content] = retain.mock.calls[0]!;
    expect(bankId).toBe(mapWorkspaceToBankId("ws_1"));
    expect(content).toBe("[high] prompt_injection: Blocked an attempt to override system instructions.");
    // No field in SecurityIncidentInput carries a raw prompt/response, so there is
    // no way for this call to have forwarded one — asserted structurally by the type,
    // and here empirically by checking the exact string that was sent.
  });

  it("forwards only allowlisted SafeMetadata keys, dropping anything else the caller attaches", async () => {
    const retain = vi.fn().mockResolvedValue({ success: true, items_count: 1 });
    const client = new HindsightAgentMemoryClient({ baseUrl: "http://localhost:8888", client: fakeClient({ retain }) });

    await client.retainSecurityIncident({
      workspaceId: "ws_1",
      category: "credential_misuse",
      severity: "critical",
      summary: "Blocked a credential exfiltration attempt.",
      metadata: {
        agentId: "agent-42",
        policyId: "policy-9",
        // @ts-expect-error — deliberately attaching an unsafe key to prove runtime stripping,
        // since a non-TypeScript caller could bypass the type system.
        rawPrompt: "some sensitive text that must never reach Hindsight",
      },
    });

    const [, , options] = retain.mock.calls[0]!;
    expect(options.metadata).toEqual({ agentId: "agent-42", policyId: "policy-9" });
    expect(JSON.stringify(options.metadata)).not.toMatch(/sensitive/);
  });

  it("rejects a raw-transcript-length summary before calling the wire client at all", async () => {
    const retain = vi.fn();
    const client = new HindsightAgentMemoryClient({ baseUrl: "http://localhost:8888", client: fakeClient({ retain }) });
    await expect(
      client.retainSecurityIncident({
        workspaceId: "ws_1",
        category: "other",
        severity: "low",
        summary: "x".repeat(700),
      }),
    ).rejects.toBeInstanceOf(AgentMemoryError);
    expect(retain).not.toHaveBeenCalled();
  });

  it("wraps an unexpected wire-client failure in AgentMemoryError, not the raw error", async () => {
    const retain = vi.fn().mockRejectedValue(new Error("HTTP 500: internal server error, apiKey=super-secret-value"));
    const client = new HindsightAgentMemoryClient({ baseUrl: "http://localhost:8888", client: fakeClient({ retain }) });
    const promise = client.retainSecurityIncident({
      workspaceId: "ws_1",
      category: "other",
      severity: "low",
      summary: "Blocked something.",
    });
    await expect(promise).rejects.toBeInstanceOf(AgentMemoryError);
    await expect(promise).rejects.not.toThrow(/super-secret-value/);
  });

  it("times out and raises AgentMemoryTimeoutError if the wire client never resolves", async () => {
    const retain = vi.fn().mockImplementation(() => new Promise(() => {})); // never resolves
    const client = new HindsightAgentMemoryClient({
      baseUrl: "http://localhost:8888",
      timeoutMs: 20,
      client: fakeClient({ retain }),
    });
    await expect(
      client.retainSecurityIncident({
        workspaceId: "ws_1",
        category: "other",
        severity: "low",
        summary: "Blocked something.",
      }),
    ).rejects.toBeInstanceOf(AgentMemoryTimeoutError);
  });
});

describe("HindsightAgentMemoryClient — recallRelevantIncidents", () => {
  it("derives the bank id from the workspace id and maps wire results to RecalledIncident", async () => {
    const recall = vi.fn().mockResolvedValue({
      results: [
        {
          text: "Blocked a prior prompt injection attempt.",
          metadata: { agentId: "agent-1", unsafeKey: "should be dropped" },
          mentioned_at: "2026-08-01T00:00:00Z",
          scores: { final: 0.82 },
        },
      ],
    });
    const client = new HindsightAgentMemoryClient({ baseUrl: "http://localhost:8888", client: fakeClient({ recall }) });
    const results = await client.recallRelevantIncidents({ workspaceId: "ws_1", query: "prompt injection" });

    expect(recall).toHaveBeenCalledWith(mapWorkspaceToBankId("ws_1"), "prompt injection", expect.anything());
    expect(results).toHaveLength(1);
    expect(results[0]!.source).toBe("hindsight");
    expect(results[0]!.relevanceScore).toBe(0.82);
    expect(results[0]!.metadata).toEqual({ agentId: "agent-1" });
  });

  it("times out and raises AgentMemoryTimeoutError if recall never resolves", async () => {
    const recall = vi.fn().mockImplementation(() => new Promise(() => {}));
    const client = new HindsightAgentMemoryClient({
      baseUrl: "http://localhost:8888",
      timeoutMs: 20,
      client: fakeClient({ recall }),
    });
    await expect(
      client.recallRelevantIncidents({ workspaceId: "ws_1", query: "anything" }),
    ).rejects.toBeInstanceOf(AgentMemoryTimeoutError);
  });
});

describe("HindsightAgentMemoryClient — reflectOnDecision", () => {
  it("derives the bank id from the workspace id and reports basedOnCount", async () => {
    const reflect = vi.fn().mockResolvedValue({ text: "Approve with caution.", based_on: [{ id: "1" }, { id: "2" }] });
    const client = new HindsightAgentMemoryClient({ baseUrl: "http://localhost:8888", client: fakeClient({ reflect }) });
    const result = await client.reflectOnDecision({ workspaceId: "ws_1", question: "should we approve this?" });

    expect(reflect).toHaveBeenCalledWith(mapWorkspaceToBankId("ws_1"), "should we approve this?", expect.anything());
    expect(result.source).toBe("hindsight");
    expect(result.basedOnCount).toBe(2);
    expect(result.answer).toBe("Approve with caution.");
  });
});

describe("HindsightAgentMemoryClient — getWorkspacePatternSummary", () => {
  it("creates a mental model with positional (bankId, name, sourceQuery) args on first call, then fetches its content", async () => {
    const listMentalModels = vi.fn().mockResolvedValue({ items: [] });
    const createMentalModel = vi.fn().mockResolvedValue({ mental_model_id: "mm_1", operation_id: "op_1" });
    const getMentalModel = vi.fn().mockResolvedValue({ content: "Recurring pattern: 3 prompt injection attempts." });
    const client = new HindsightAgentMemoryClient({
      baseUrl: "http://localhost:8888",
      client: fakeClient({ listMentalModels, createMentalModel, getMentalModel }),
    });

    const result = await client.getWorkspacePatternSummary("ws_1");

    expect(listMentalModels).toHaveBeenCalledTimes(1);
    expect(createMentalModel).toHaveBeenCalledTimes(1);
    const [bankId, name, sourceQuery, options] = createMentalModel.mock.calls[0]!;
    expect(bankId).toBe(mapWorkspaceToBankId("ws_1"));
    expect(name).toBe("rakshex-workspace-pattern-summary");
    expect(sourceQuery).toMatch(/recurring security risk patterns/i);
    expect(options.trigger).toEqual({ refreshAfterConsolidation: true });
    expect(getMentalModel).toHaveBeenCalledWith(mapWorkspaceToBankId("ws_1"), "mm_1", expect.anything());
    expect(result).toEqual({
      content: "Recurring pattern: 3 prompt injection attempts.",
      source: "hindsight",
      mentalModelId: "mm_1",
      basedOnCount: 0,
    });
  });

  it("reuses an existing mental model found in the items array, not creating a duplicate", async () => {
    const listMentalModels = vi.fn().mockResolvedValue({
      items: [{ id: "mm_existing", name: "rakshex-workspace-pattern-summary" }],
    });
    const createMentalModel = vi.fn();
    const getMentalModel = vi.fn().mockResolvedValue({ content: "No strong patterns yet." });
    const client = new HindsightAgentMemoryClient({
      baseUrl: "http://localhost:8888",
      client: fakeClient({ listMentalModels, createMentalModel, getMentalModel }),
    });

    const result = await client.getWorkspacePatternSummary("ws_1");

    expect(createMentalModel).not.toHaveBeenCalled();
    expect(getMentalModel).toHaveBeenCalledWith(mapWorkspaceToBankId("ws_1"), "mm_existing", expect.anything());
    expect(result.mentalModelId).toBe("mm_existing");
    expect(result.basedOnCount).toBe(0);
  });

  it("reports honestly, without crashing, when creation is processed asynchronously and returns a null mental_model_id", async () => {
    const listMentalModels = vi.fn().mockResolvedValue({ items: [] });
    const createMentalModel = vi.fn().mockResolvedValue({ mental_model_id: null, operation_id: "op_async_1" });
    const getMentalModel = vi.fn();
    const client = new HindsightAgentMemoryClient({
      baseUrl: "http://localhost:8888",
      client: fakeClient({ listMentalModels, createMentalModel, getMentalModel }),
    });

    const result = await client.getWorkspacePatternSummary("ws_1");

    expect(getMentalModel).not.toHaveBeenCalled();
    expect(result.mentalModelId).toBeNull();
    expect(result.source).toBe("hindsight");
    expect(result.content).toMatch(/still generating/i);
  });

  it("scopes the mental model lookup to the calling workspace's bank id, not another workspace's", async () => {
    const listMentalModels = vi.fn().mockResolvedValue({ items: [] });
    const createMentalModel = vi.fn().mockResolvedValue({ mental_model_id: "mm_2", operation_id: "op_2" });
    const getMentalModel = vi.fn().mockResolvedValue({ content: "x" });
    const client = new HindsightAgentMemoryClient({
      baseUrl: "http://localhost:8888",
      client: fakeClient({ listMentalModels, createMentalModel, getMentalModel }),
    });

    await client.getWorkspacePatternSummary("ws_alpha");

    expect(listMentalModels).toHaveBeenCalledWith(mapWorkspaceToBankId("ws_alpha"), expect.anything());
    expect(listMentalModels).not.toHaveBeenCalledWith(mapWorkspaceToBankId("ws_beta"), expect.anything());
  });
});
