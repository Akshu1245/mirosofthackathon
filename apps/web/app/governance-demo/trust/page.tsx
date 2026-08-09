"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { trpc } from "@/lib/trpc";

const MECHANICS = [
  {
    title: "Memory can only move risk one step",
    body: "Recalled incidents don't get fed back into a model or concatenated into a prompt. They're parsed for a fixed [severity] prefix and can escalate the risk signal by exactly one step — none → suspicious, or suspicious → high_risk. Never more, never by free text.",
    code: `function applyMemoryInfluence(base, recalled) {
  const highSeverity = recalled.filter(r =>
    parseRetainedSeverity(r.text) === "high" ||
    parseRetainedSeverity(r.text) === "critical"
  );
  if (base === "none" && highSeverity.length >= 1) return "suspicious";
  if (base === "suspicious" && highSeverity.length >= 2) return "high_risk";
  return base;
}`,
    file: "apps/api/services/governance/runtimeGovernance.ts",
  },
  {
    title: "Only a safe summary is ever retained",
    body: "The raw prompt never reaches the memory layer. Only a server-authored one-line summary plus six allowlisted metadata fields are sent — copied through an explicit allowlist, twice, as an independent guard against a future edit widening what's sent.",
    code: `const SAFE_METADATA_KEYS = [
  "agentId", "actionType", "policyId",
  "decision", "promptHash", "source",
];
// requestText is used ONLY for local scanning —
// never forwarded to the agent-memory adapter.`,
    file: "packages/agent-memory/src/types.ts, runtimeGovernance.ts",
  },
  {
    title: "Routing is decision-only, enforced by imports",
    body: "The routing adapter imports cascadeflow's PreRouter, RoutingDecisionHelper, and CostCalculator — never CascadeAgent or any class that calls a provider. If a future edit tried to add a provider call here, it would require importing something this file's own header comment says it never imports.",
    code: `import { PreRouter, RoutingDecisionHelper, CostCalculator }
  from "@cascadeflow/core";
// This client never imports CascadeAgent or any
// provider-calling class from cascadeflow.`,
    file: "packages/model-routing/src/cascadeflowClient.ts",
  },
  {
    title: "Blocking happens before routing, not after",
    body: "A high/critical prompt-injection verdict short-circuits the request before cascadeflow is even called and before enforcement.ts is reached. There's no path where a blocked request still gets routed to a paid model.",
    code: `if (injection.threatLevel === "high" ||
    injection.threatLevel === "critical") {
  // retain incident, return blocked — routing
  // adapter is never called on this path.
}`,
    file: "apps/api/services/governance/runtimeGovernance.ts",
  },
];

export default function TrustMechanicsPage() {
  const { workspaceId, isLoading } = useWorkspace();
  const enabled = workspaceId > 0;
  const pattern = trpc.agentFirewall.workspacePatternSummary.useQuery(
    { workspaceId },
    { enabled, retry: false },
  );

  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Why this is hard to fake
          </p>
          <h1 className="text-3xl font-bold">
            Not policy promises — constraints enforced by the code itself
          </h1>
          <p className="max-w-3xl text-gray-400">
            Every claim below is checked against the actual source in this repo, not a
            slide. The audit trail for this path reuses the existing security-event
            log — it is <strong>not</strong> the hash-chained Action Ledger; that
            stronger, tamper-evident guarantee belongs to a different part of RaksHex.
            See the honest close for exactly where the line is.
          </p>
        </header>

        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold">Live: what this workspace has learned</h2>
          <p className="mt-1 text-sm text-gray-400">
            Not a demo of individual incident recall — this is a single synthesized
            summary across every incident retained for this workspace, refreshed by
            Hindsight after each new retain. Run the presets on the live screen first,
            then come back here to see this update.
          </p>
          {!enabled || isLoading ? (
            <p className="mt-4 text-sm text-gray-500">Loading workspace…</p>
          ) : pattern.isLoading ? (
            <p className="mt-4 text-sm text-gray-500">Synthesizing…</p>
          ) : pattern.error ? (
            <p className="mt-4 text-sm text-red-300">{pattern.error.message}</p>
          ) : pattern.data ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm leading-6 text-gray-200">{pattern.data.content}</p>
              <p className="text-xs text-gray-500">
                based on {pattern.data.basedOnCount} incident(s) · source:{" "}
                <span
                  className={
                    pattern.data.source === "hindsight" ? "text-emerald-300" : "text-amber-300"
                  }
                >
                  {pattern.data.source === "hindsight" ? "Hindsight" : "local fallback (not Hindsight)"}
                </span>
              </p>
            </div>
          ) : null}
        </article>

        <div className="grid gap-6 md:grid-cols-2">
          {MECHANICS.map((m) => (
            <article key={m.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold">{m.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">{m.body}</p>
              <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs leading-5 text-emerald-300/90">
                {m.code}
              </pre>
              <p className="mt-2 text-xs text-gray-500">{m.file}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
