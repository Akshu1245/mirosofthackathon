# RaksHex — governance demo script (timed, ~3 min)

Route through: `/governance-demo` → `/runtime-governance` → `/governance-demo/trust`
→ `/governance-demo/close`. Rehearse until someone who didn't build it can say it
in their own words — if they can't, it's not ready.

**Fallback if network/API is down:** screen-record the four presets running once
locally beforehand. One keystroke (spacebar) advances the recording. Judges' wifi
failing should never be visible in the room.

---

**0:00–0:20 — The pain (screen 1)**

> "A stateless AI agent has no memory of the last attack it saw, and no sense of
> what a request should cost. So the same prompt injection works twice — and every
> request gets routed to the same expensive model whether it needs to or not.
> RaksHex fixes both: it remembers the first attempt, and it routes by cost."

*(On screen: the pain headline, no interaction yet.)*

**0:20–2:00 — Live: block, retain, recall, reroute (screen 2)**

> "Watch this. Preset one — a normal support request. cascadeflow picks a cheap,
> fast model, decision-only, no API key needed for that call."

*(Click preset 1, point at the routing decision + cost estimate.)*

> "Preset two — a prompt injection attempt. Blocked before any model is called.
> A safe summary gets retained — never the raw prompt."

*(Click preset 2, point at the red DENY badge and the memory badge.)*

> "Preset three — a softer, similar request, later. The earlier incident is
> recalled, and the risk signal escalates from what it would've been alone."

*(Click preset 3, point at "recalled incidents" section.)*

> "Preset four — same normal request, but the workspace budget is already spent.
> Enforcement rejects it before a provider is ever touched."

*(Click preset 4, point at enforcement reasons.)*

**2:00–2:40 — Why this is hard to fake (screen 3)**

> "This isn't policy on a slide. Memory can only escalate risk by one bounded
> step — never arbitrary text back into a prompt. Only a safe summary is ever
> retained, filtered through an explicit allowlist. And routing is decision-only
> by construction — this code doesn't even import the class that would let it
> call a provider directly."

*(Point at one code snippet, don't read all four aloud.)*

**2:40–3:00 — Honest close (screen 4)**

> "Here's exactly what's proven and what isn't. cascadeflow routing: proven,
> tested against the real package. Hindsight memory: real SDK, but we haven't
> yet verified a live retain-and-recall round trip — so right now it's running on
> a clearly-labeled local fallback, not live Hindsight. And to be precise: this
> audit trail is not the same as our hash-chained Action Ledger — that's a
> separate, stronger guarantee elsewhere in the product."

*(Let the status table speak for itself — don't over-explain a green row.)*

---

## Before you're on stage

```
pnpm install
pnpm lint
pnpm typecheck
pnpm test:api
pnpm test:packages
```

Run this right before your demo slot, not the night before — per CLAUDE.md §7,
green here has been wrong before. If anything is red, the honest close screen is
your fallback: say what's proven, say what isn't, and don't paper over it live.
