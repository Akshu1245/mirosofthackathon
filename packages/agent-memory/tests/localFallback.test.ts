import { describe, expect, it } from "vitest";
import { LocalFallbackAgentMemoryClient } from "../src/localFallback.js";
import { AgentMemoryError } from "../src/types.js";

describe("LocalFallbackAgentMemoryClient", () => {
  it("labels every result source: local_fallback, never hindsight", async () => {
    const client = new LocalFallbackAgentMemoryClient();
    const retained = await client.retainSecurityIncident({
      workspaceId: "ws_1",
      category: "prompt_injection",
      severity: "high",
      summary: "Blocked an attempt to override system instructions via a fake system tag.",
    });
    expect(retained.source).toBe("local_fallback");

    const recalled = await client.recallRelevantIncidents({ workspaceId: "ws_1", query: "prompt injection" });
    expect(recalled.every((r) => r.source === "local_fallback")).toBe(true);

    const reflected = await client.reflectOnDecision({ workspaceId: "ws_1", question: "prompt injection history" });
    expect(reflected.source).toBe("local_fallback");
    expect(reflected.answer).toMatch(/^local fallback — not Hindsight/);
  });

  it("recalls a retained incident by relevant keywords", async () => {
    const client = new LocalFallbackAgentMemoryClient();
    await client.retainSecurityIncident({
      workspaceId: "ws_1",
      category: "prompt_injection",
      severity: "high",
      summary: "Blocked a prompt injection attempt from agent support-bot-1.",
    });
    const results = await client.recallRelevantIncidents({ workspaceId: "ws_1", query: "prompt injection agent" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.text).toContain("prompt injection");
  });

  it("enforces workspace isolation: a workspace cannot recall another workspace's incidents", async () => {
    const client = new LocalFallbackAgentMemoryClient();
    await client.retainSecurityIncident({
      workspaceId: "ws_alpha",
      category: "credential_misuse",
      severity: "critical",
      summary: "Blocked an attempt to exfiltrate a brokered credential.",
    });
    const crossWorkspaceResults = await client.recallRelevantIncidents({
      workspaceId: "ws_beta",
      query: "credential exfiltrate",
    });
    expect(crossWorkspaceResults).toHaveLength(0);

    const sameWorkspaceResults = await client.recallRelevantIncidents({
      workspaceId: "ws_alpha",
      query: "credential exfiltrate",
    });
    expect(sameWorkspaceResults.length).toBeGreaterThan(0);
  });

  it("rejects a summary that looks like a raw transcript instead of a summary", async () => {
    const client = new LocalFallbackAgentMemoryClient();
    const tooLong = "x".repeat(700);
    await expect(
      client.retainSecurityIncident({
        workspaceId: "ws_1",
        category: "other",
        severity: "low",
        summary: tooLong,
      }),
    ).rejects.toBeInstanceOf(AgentMemoryError);
  });

  it("rejects an empty summary", async () => {
    const client = new LocalFallbackAgentMemoryClient();
    await expect(
      client.retainSecurityIncident({ workspaceId: "ws_1", category: "other", severity: "low", summary: "" }),
    ).rejects.toBeInstanceOf(AgentMemoryError);
  });

  it("reflect reports how many prior incidents it based its answer on", async () => {
    const client = new LocalFallbackAgentMemoryClient();
    await client.retainSecurityIncident({
      workspaceId: "ws_1",
      category: "policy_violation",
      severity: "medium",
      summary: "Blocked a disallowed tool call to an unapproved domain.",
    });
    const reflection = await client.reflectOnDecision({ workspaceId: "ws_1", question: "disallowed tool call" });
    expect(reflection.basedOnCount).toBeGreaterThan(0);
  });
});
