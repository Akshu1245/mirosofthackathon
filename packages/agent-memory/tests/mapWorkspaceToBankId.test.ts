import { describe, expect, it } from "vitest";
import { mapWorkspaceToBankId, AgentMemoryError } from "../src/types.js";

describe("mapWorkspaceToBankId", () => {
  it("is deterministic for the same workspace id", () => {
    expect(mapWorkspaceToBankId("ws-abc-123")).toBe(mapWorkspaceToBankId("ws-abc-123"));
  });

  it("produces different bank ids for different workspace ids", () => {
    expect(mapWorkspaceToBankId("ws-abc-123")).not.toBe(mapWorkspaceToBankId("ws-xyz-789"));
  });

  it("throws rather than silently mapping an empty workspace id", () => {
    expect(() => mapWorkspaceToBankId("")).toThrow(AgentMemoryError);
  });

  it("sanitizes unsafe characters so the bank id is always a safe identifier", () => {
    expect(mapWorkspaceToBankId("Ws Weird!ID/../etc")).toMatch(/^rakshex-ws-[a-z0-9-]+$/);
  });
});
