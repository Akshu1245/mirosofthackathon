# Hindsight architecture review

Performed 2026-08-09 by applying `vectorize-io/hindsight-skills`'
`/hindsight-architect` documented expertise (fetched directly from
https://raw.githubusercontent.com/vectorize-io/hindsight-skills/main/skills/hindsight-architect/SKILL.md)
against the existing integration in `packages/agent-memory` and
`apps/api/services/governance/runtimeGovernance.ts`. This is a review of
already-shipped code, not a from-scratch architecture session — the skill's
own logic says to review, not rebuild, when Hindsight is already configured.

## What's right, and why it deviates from the skill's default

The skill's default recommendation is "single bank with user tags" for
multi-user apps, with separate banks reserved for regulatory isolation
needs. RaksHex uses **one Hindsight bank per workspace**
(`mapWorkspaceToBankId` in `packages/agent-memory/src/types.ts`), not the
default.

This is the correct call for this product, not an oversight: RaksHex is a
security governance platform, and hard tenant isolation between workspaces
is a real security requirement, not just an organizational convenience —
exactly the case the skill carves out as justifying per-entity banks. Keep
it this way.

## Gap 1 — tags are declared but never used (low risk, not fixed yet)

`SecurityIncidentInput.tags` and `RecallQuery.tags` exist in
`packages/agent-memory/src/types.ts`, but `runtimeGovernance.ts` never
populates them on retain or filters by them on recall. Within a workspace
bank, tags could still scope by `agentId`, so one agent's incident doesn't
necessarily influence a different agent's risk signal in the same
workspace.

**Recommended fix (not applied):** tag retained incidents with
`agentId:{agentId}` when present. This is additive only — recall doesn't
currently filter by tags, so adding tags to retain calls changes nothing
about current demo behavior. Left undone intentionally so close to the
finals demo; verified, tested code shouldn't be touched for a
non-demo-visible improvement without a full re-verification pass.

## Gap 2 — no mental models (the real opportunity)

This is the significant one. RaksHex currently only does retain + recall:
individual incidents in, individual incidents out, with recalled severity
bounded to a one-step risk escalation (`applyMemoryInfluence` in
`runtimeGovernance.ts`). There is no synthesis across incidents over time.

Per the skill's own framing, this is exactly the gap between "the agent
remembers" and "the agent learns" — and it maps directly onto this
product's own pain statement (`/governance-demo`: "your AI agent forgets
every attack it's seen"). A mental model closes that gap for real, instead
of only demonstrating it for one incident at a time.

**Concrete proposal, not yet built:**

- Mental model per workspace, tags `[]` scoped to that workspace's bank
  (no additional tag needed — the bank itself is the workspace boundary).
- `source_query`: "What recurring security risk patterns exist in this
  workspace's request history?"
- `trigger: { refresh_after_consolidation: true }` so it stays current
  without manual refresh.
- Fetch (`get_mental_model`, a fast key-value lookup, not a search) at the
  start of `evaluateGovernedRequest` and feed its content into the risk
  signal alongside the existing bounded recall-based escalation — this
  would let the honest-close screen's "recurring pattern" story become
  literally true rather than only demonstrated via a single presets.

## Status: MVP built 2026-08-09

Built, not just proposed, once the actual finals date (16 Aug) made "later"
the wrong call for a same-week gap. Scope was deliberately kept to the
single moment described above — no scoring, no multiple mental models, no
change to the already-verified evaluateGoverned request path.

**What changed:**

- `packages/agent-memory`: new `getWorkspacePatternSummary(workspaceId)` on
  `AgentMemoryAdapter`. Hindsight impl does get-or-create-by-name on a
  single mental model per workspace bank (`rakshex-workspace-pattern-summary`,
  `source_query: "What recurring security risk patterns exist in this
  workspace?"`, `trigger.refresh_after_consolidation: true`), then fetches
  its content — a key-value lookup per the architect skill's own guidance,
  not a search, so it's cheap enough to call on page load. Local fallback
  impl is a deterministic, non-LLM tally by category over locally stored
  incidents — explicitly never dressed up as synthesis it didn't do.
- `apps/api/api/agentFirewall.ts`: new `workspacePatternSummary` read-only
  procedure, additive, does not touch `evaluateGoverned`.
- `apps/web/app/governance-demo/trust/page.tsx`: new live panel showing the
  fetched summary, with the same honest Hindsight/local-fallback badge used
  everywhere else in this feature.

**Verification status — precise, not rounded up:**

| Layer | Status |
|---|---|
| `packages/agent-memory` (types, hindsightClient, localFallback) | **Verified 2026-08-09** — 27/27 tests pass, `tsc --noEmit` clean, run standalone outside the monorepo workspace to route around this sandbox's disk limits. Real output, not claimed. |
| `apps/api` (`workspacePatternSummary` procedure) | **Verified 2026-08-09** — `pnpm --filter @rakshex/api typecheck` clean, run on the founder's actual machine after pulling this change. (A real bug — missing `getAgentMemoryAdapter` import — was caught and fixed by hand before this run, not by it.) |
| `apps/web` (trust page live panel) | **Verified 2026-08-09** — `pnpm --filter @rakshex/web typecheck` clean, same run. |
| Mental model method names against the real `@vectorize-io/hindsight-client` package | **Unverified against a live call**, same status as the existing retain/recall/reflect methods — taken from the hindsight-skills project's own documented Node.js examples, not from inspecting the installed package's actual `.d.ts` (attempted, blocked by output-size limits in this session). First live call to `/governance-demo/trust` with a real Hindsight key will either confirm or break this — watch for it specifically, don't assume it's fine just because retain/recall already work. |

Both pending typecheck runs are clean.

## Post-mortem: our own types lied about the real SDK (found and fixed 2026-08-09)

Before any live call happened, `hindsightClient.ts`'s `HindsightWireClient`
interface was checked against the actual installed
`@vectorize-io/hindsight-client@0.9.0` type definitions
(`node_modules/@vectorize-io/hindsight-client/dist/index.d.ts`, 9,570
lines, real types — the package declares `"types": "./dist/index.d.ts"`
in its own `package.json`, this is not an `any`-typed wrapper). The method
names/shapes I'd written were taken from the hindsight-skills project's
own documented Node.js SDK examples, not from the installed package
itself. Three real mismatches, all fixed:

1. **`createMentalModel` call shape.** Assumed `createMentalModel(bankId, { name, source_query, tags, trigger })` — one options object. Real signature: `createMentalModel(bankId, name, sourceQuery, options?)` — three positional arguments. Would have sent the wrong data to the server on every live call.
2. **Trigger field casing.** Assumed `trigger: { refresh_after_consolidation: true }` (snake_case, copied from the skill doc's Python example). Real field: `refreshAfterConsolidation` (camelCase). This would not have errored — an unrecognized key in a JS options object is just silently dropped — so the mental model would have silently never auto-refreshed, with no error to notice.
3. **Response shapes.** `listMentalModels` returns `{ items: [...] }`, not `{ mental_models: [...] }` — the old code would have thrown `Cannot read properties of undefined (reading 'find')` on the very first live call. `createMentalModel`'s `mental_model_id` is nullable (creation can be processed asynchronously) — the old code assumed it was always a string and would have called `getMentalModel` with `undefined`. `getMentalModel`'s response has no `based_on` field at all (unlike `reflect()`, which does) — the old `basedOnCount` calculation was reading a field that doesn't exist on this endpoint; it always silently evaluated to 0, not a crash, just quietly wrong.

Retain/recall/reflect were checked the same way at the same time and are
**confirmed correct** against the real types — no changes needed there,
their existing "proven" status holds.

**What's still honestly unverified:** the corrected code has never been
called against a live Hindsight server — the type-level contract is now
right, but "the real API's runtime behavior matches its own published
types" is still an assumption until one live call actually succeeds. That
resolves the same way it always was going to: wire in a real key, load
`/governance-demo/trust`, and watch for either a working synthesized
summary or an error. Do not mark this "proven" on the honest-close screen
until that happens.

**One known consequence not yet fixed, intentionally out of scope for this
pass:** `getWorkspacePatternSummary`'s Hindsight implementation now always
returns `basedOnCount: 0`, because the real API has no field to compute it
from. `apps/web/app/governance-demo/trust/page.tsx` still renders "based on
N incident(s)" for both sources — against live Hindsight, that will always
read "based on 0 incident(s)" even when the summary clearly reflects real
incidents. This is a real, known UI inaccuracy, left as-is because fixing
it means touching the UI, which was out of scope for this pass. Fix before
using this in front of a judge: either drop the count entirely for the
Hindsight path, or find a different signal (e.g. `last_refreshed_at`) to
show instead.
