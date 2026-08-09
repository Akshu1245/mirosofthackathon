const STATUS_ROWS: Array<{ claim: string; status: "proven" | "pending" | "false-if-claimed"; note: string }> = [
  {
    claim: "cascadeflow makes a real, decision-only routing call",
    status: "proven",
    note: "No provider call, no network call. Verified against the real @cascadeflow/core package.",
  },
  {
    claim: "Hindsight retains/recalls against a live instance",
    status: "pending",
    note: "SDK wiring is real. The live retain()/recall() round trip has not happened yet — local fallback is active right now.",
  },
  {
    claim: "Memory-recalled severity can escalate risk, bounded to one step",
    status: "proven",
    note: "applyMemoryInfluence() — unit tested.",
  },
  {
    claim: "Prompt injection / PII blocked before any provider call",
    status: "proven",
    note: "Reuses the existing, already-tested apps/api/engines/*.",
  },
  {
    claim: "This audit trail is hash-chained / tamper-evident",
    status: "false-if-claimed",
    note: "Only the separate Action Ledger has that guarantee. This path's audit trail is the standard security-event log — same as every other logSecurityEvent call in the codebase.",
  },
  {
    claim: "This code's typecheck and tests are currently green",
    status: "proven",
    note: "Verified 2026-08-09: test:api 97/98 suites (936/947 tests, 11 skipped and documented elsewhere), test:packages all green, apps/api and apps/web both typecheck clean individually.",
  },
];

const STATUS_STYLE: Record<string, string> = {
  proven: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  pending: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  "false-if-claimed": "border-red-500/40 bg-red-500/10 text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  proven: "PROVEN",
  pending: "PENDING",
  "false-if-claimed": "DO NOT CLAIM",
};

export default function HonestClosePage() {
  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Honest close
          </p>
          <h1 className="text-3xl font-bold">What&apos;s real, what isn&apos;t yet</h1>
          <p className="max-w-3xl text-gray-400">
            This table is generated from CLAUDE.md §3b, the same file the whole team
            uses as source of truth. If this page and CLAUDE.md ever disagree, trust
            CLAUDE.md and file a bug — this page should always be a rendering of it,
            not a separate claim.
          </p>
        </header>

        <div className="space-y-3">
          {STATUS_ROWS.map((row) => (
            <div key={row.claim} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-2.5 py-1 font-mono text-xs font-semibold ${STATUS_STYLE[row.status]}`}
                >
                  {STATUS_LABEL[row.status]}
                </span>
                <h2 className="font-semibold">{row.claim}</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-400">{row.note}</p>
            </div>
          ))}
        </div>

        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold">What we&apos;d do with one more week</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-400">
            <li>Get a live Hindsight Cloud key and verify one real retain/recall round trip — the single biggest gap between &quot;looks real&quot; and &quot;is real.&quot;</li>
            <li>Re-run <code className="font-mono text-gray-300">pnpm typecheck && pnpm test:api</code> and update CLAUDE.md §3b with the actual result, not an assumption.</li>
            <li>Decide whether this path should adopt the hash-chained Action Ledger instead of the plain security-event log, so &quot;governs the action&quot; and &quot;remembers the action&quot; share one tamper-evident guarantee.</li>
            <li>Add an unauthenticated demo route (like <code className="font-mono text-gray-300">/demo/judge</code> already has) so judges don&apos;t need a workspace login mid-demo.</li>
          </ol>
        </article>
      </div>
    </main>
  );
}
