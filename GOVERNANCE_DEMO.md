# Runtime governance demo — status

This repo merges two prior work streams into one buildable app:

- Backend governance/memory/routing (`apps/api/services/governance/`,
  `packages/agent-memory`, `packages/model-routing`) — Hindsight and
  cascadeflow integration, previously only in a local working copy.
- Frontend (`apps/web`) — the existing Next.js app from `main`, plus one
  new page: `apps/web/app/runtime-governance`.

## What is real vs. pending

- cascadeflow routing: real (`@cascadeflow/core`, decision-only, no
  network call, no API key needed). See `packages/model-routing/src/cascadeflowClient.ts`.
- Hindsight memory: real SDK wiring (`@vectorize-io/hindsight-client`), but
  **not yet verified against a live Hindsight instance**. Until
  `HINDSIGHT_BASE_URL`/`HINDSIGHT_API_KEY` are set and a real
  `retain()`/`recall()` round trip is confirmed, the app uses an in-process
  local fallback and labels it as such everywhere (UI badge, API response
  `memory.source`). See `packages/agent-memory/src/hindsightClient.ts`.

## Before recording a demo video

1. `pnpm install` (no lockfile is committed here — dependencies changed;
   generate a fresh one).
2. Set `HINDSIGHT_BASE_URL` / `HINDSIGHT_API_KEY` (Hindsight Cloud promo
   code `MEMHACK625` gives $50 credit) and confirm one real retain/recall
   call succeeds.
3. `pnpm db:up && pnpm db:migrate && pnpm dev`.
4. Open `/runtime-governance`, create a workspace, and run the four
   presets on that page in order: normal request → prompt injection
   (blocked + retained) → similar request later (recall escalates risk) →
   budget exhausted (enforcement rejects). That sequence is the demo
   script.
5. Add a nav link to `/runtime-governance` so a judge doesn't need the
   direct URL.
