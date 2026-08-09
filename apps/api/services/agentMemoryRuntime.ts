/**
 * Composition root for the agent-memory adapter.
 *
 * Requirement (Phase 4): do NOT create a fresh LocalFallbackAgentMemoryClient
 * per request — that would silently lose every retained incident between
 * requests, defeating the entire point of "memory." This module creates
 * exactly one adapter instance per process (module-level singleton — Node
 * caches module evaluation, so every importer gets the same instance) and
 * every caller in apps/api must go through getAgentMemoryAdapter() rather
 * than constructing @rakshex/agent-memory clients directly.
 *
 * PRODUCTION / SERVERLESS CAVEAT — read before deploying anywhere but a
 * single long-running process:
 *   - If HINDSIGHT_BASE_URL is unset, this singleton falls back to
 *     LocalFallbackAgentMemoryClient, which stores incidents in a plain
 *     in-process array. That array is scoped to ONE process and is lost on
 *     restart, and is NOT shared across horizontally-scaled instances or
 *     serverless invocations (each cold start gets an empty store, and two
 *     concurrently running instances behind a load balancer will each have
 *     their own, inconsistent view of "memory").
 *   - This is fine for a single-process demo. It is NOT fine for production
 *     multi-instance deployment — real persistence requires HINDSIGHT_BASE_URL
 *     to be configured, or a durable backing store swapped in here.
 *   - Do not remove this comment when wiring real infra; it documents a real
 *     correctness boundary, not a hypothetical one.
 */
import { createAgentMemoryAdapter, type AgentMemoryAdapter } from "@rakshex/agent-memory";
import { ENV } from "../_core/env";
import { logger } from "../_core/logger";

let singleton: AgentMemoryAdapter | undefined;
let loggedBackendChoice = false;

export function getAgentMemoryAdapter(): AgentMemoryAdapter {
  if (!singleton) {
    const hasHindsightConfig = Boolean(ENV.hindsightBaseUrl);
    singleton = createAgentMemoryAdapter(
      hasHindsightConfig
        ? { hindsight: { baseUrl: ENV.hindsightBaseUrl, apiKey: ENV.hindsightApiKey || undefined } }
        : {},
    );
    if (!loggedBackendChoice) {
      loggedBackendChoice = true;
      // Never log ENV.hindsightApiKey or ENV.hindsightBaseUrl's contents —
      // only whether a backend is configured.
      logger.info(
        { backend: hasHindsightConfig ? "hindsight" : "local_fallback" },
        "[agent-memory] singleton adapter created for this process",
      );
    }
  }
  return singleton;
}

/** Test-only: reset the singleton so tests don't leak state across files. */
export function __resetAgentMemoryAdapterForTests(): void {
  singleton = undefined;
  loggedBackendChoice = false;
}
