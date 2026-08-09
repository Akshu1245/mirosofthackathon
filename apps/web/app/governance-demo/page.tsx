export default function GovernancePainPage() {
  return (
    <main className="p-5 md:p-8">
      <div className="mx-auto max-w-4xl space-y-10 py-16 text-center md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          RaksHex — runtime governance
        </p>

        <h1 className="text-4xl font-semibold leading-tight tracking-[-0.02em] md:text-5xl">
          Your AI agent forgets every attack it&apos;s seen —
          <br />
          so the same prompt injection works twice.
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-gray-400">
          A stateless agent has no memory of the last attempt and no sense of what a
          request should cost. RaksHex remembers the first attempt, escalates risk on
          the second, and blocks it before any model runs — routed by cost, not luck.
        </p>

        <div className="mx-auto grid max-w-3xl gap-3 pt-6 text-left md:grid-cols-3">
          {[
            ["1. Attack happens", "A prompt injection attempt is scanned locally and blocked. A safe summary — never the raw prompt — is retained."],
            ["2. It comes back", "A softer, similar request arrives later. The prior incident is recalled and the risk signal escalates."],
            ["3. Routing responds", "cascadeflow picks the route by cost and complexity — decision-only, no provider call from this layer, ever."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">{body}</p>
            </article>
          ))}
        </div>

        <a
          href="/runtime-governance"
          className="inline-block rounded-lg bg-emerald-400 px-6 py-3 font-semibold text-black transition hover:bg-emerald-300"
        >
          Watch it happen, live →
        </a>
      </div>
    </main>
  );
}
