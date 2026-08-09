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

This is real, scoped, buildable work — not a vague idea — but it's new
surface area that needs its own tests before being claimed as proven in
CLAUDE.md §3b. Treat it as the next block of work, not something to rush
in before finals.
