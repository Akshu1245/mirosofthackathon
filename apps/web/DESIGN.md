# RaksHex — DESIGN.md

Merged reference from three sources: getdesign.md's analyses of Linear, Vercel,
and Stripe. Not a literal mashup — one voice, borrowed reasoning. Every new
screen in `apps/web` should read as visually identical to every other screen;
that consistency is worth more than any single borrowed idea.

**Existing constraint this file must respect:** `apps/web/app/agent-firewall`
and `apps/web/app/runtime-governance` already ship with a dark canvas and an
emerald accent (`emerald-400`/`emerald-300`). Rather than introduce a second
accent color across the app on hackathon week, this file keeps emerald as the
single accent and pulls Linear/Vercel/Stripe for density, restraint, and
type/spacing discipline instead of for color.

## What each source contributes (and what we reject)

- **Linear** — the density and hairline-border discipline. Multi-step surface
  ladder (canvas → surface-1 → surface-2 → surface-3) instead of one flat
  panel color everywhere. Small, precise type scale. We take the *structure*
  (surface ladder, hairline borders, tight negative tracking on headings), not
  the lavender accent.
- **Vercel** — restraint. "The only color allowed is confined to one place."
  We take this literally: gradient/color noise is banned except on the single
  hero moment (see below). Geist Mono's role — labeling technical eyebrows —
  becomes our monospace rule for anything that is data, not prose.
- **Stripe** — weight-300 elegance for exactly one thing: the trust-critical
  surface. Credential mediation and the Action Ledger are where "we handle
  this seriously" has to be felt, not stated. Tabular figures for money/hash
  columns so digits align in a column — this is the one screen that earns a
  gradient, per the constraint below.

## Color tokens

Reuse existing Tailwind classes already in the codebase — do not add new hex
values.

| Role | Class | Notes |
|---|---|---|
| Canvas | `bg-black` / `bg-[#0a0a0b]` | Base page background |
| Surface 1 | `bg-white/[0.03]` | Cards, panels (matches existing agent-firewall page) |
| Surface 2 | `bg-black/20` | Nested/recessed content (ledger rows, code blocks) |
| Surface 3 | `bg-black/30` | Input fields |
| Hairline | `border-white/10` | Default 1px border |
| Hairline strong | `border-emerald-400/60` | Focus / hover state only |
| Accent | `emerald-400` / `emerald-300` | The one chromatic accent. Do not add a second. |
| Ink | `text-white` | Headings, primary body |
| Ink muted | `text-gray-400` | Secondary copy |
| Ink subtle | `text-gray-500` | Captions, timestamps |
| Success | `text-emerald-300` / `border-emerald-400/40` `bg-emerald-400/10` | ALLOW state |
| Danger | `text-red-200` / `border-red-500/40` `bg-red-500/10` | DENY / blocked state |
| Warning | `text-amber-300` | "Not yet live-verified" labels — used honestly, not decoratively |

**The one hero gradient.** Reserved for exactly one moment: the instant a
DENY fires on the live-action screen. A one-frame radial gradient
(`emerald-400` → transparent, or `red-500` → transparent depending on
allow/deny) behind the decision badge, then it's gone. Nowhere else in the
app gets a gradient. If you're reaching for a second gradient, stop — that's
the Stripe reference being misused as decoration instead of emphasis.

## Typography

One voice, borrowed from Vercel's binary-weight discipline and Linear's
tight negative tracking, not three separate scales:

| Token | Size / weight / tracking | Use |
|---|---|---|
| `display` | 40px · 600 · -1.0px | Screen title (max one per screen) |
| `headline` | 24px · 600 · -0.5px | Section header |
| `body-lg` | 18px · 400 | Lead paragraph, the one-sentence pain statement |
| `body` | 16px · 400 | Default UI copy |
| `body-sm` | 14px · 400 | Card copy, form labels |
| `caption` | 12px · 400 | Timestamps, footnotes |
| `mono` | 13–14px · monospace (`font-mono`) | **Any data value**: hashes, ledger IDs, model names, costs, trace IDs, JSON. Never use mono for prose. |

Weight is binary, per Vercel's rule: 600 for anything a judge should read
first (headings, decisions), 400 for everything else. No 500s, no italics.

## Spacing & radius

4px base unit (Vercel's scale, already close to Tailwind's default):
`4 / 8 / 12 / 16 / 24 / 32 / 48 / 96`px → Tailwind `1 / 2 / 3 / 4 / 6 / 8 / 12 / 24`.

Radius: `rounded-lg` (8px) for inputs and buttons, `rounded-xl` (12px) for
cards — matches what's already shipped in `agent-firewall`. Don't introduce a
third radius value.

## Components

Every component should come from the existing pattern already established in
`apps/web/components/agent-firewall/` and `apps/web/app/agent-firewall/page.tsx`
first. Only reach for Watermelon UI (https://ui.watermelon.sh) when the
existing codebase has no equivalent:

- **Data tables** → Watermelon UI table primitive, for the Action Ledger
  screen. Must support monospace columns for hash/ID fields and
  tabular-nums for any numeric column so digits align.
- **Status/badge components** → Watermelon UI badge, restyled to this file's
  tokens (emerald = ALLOW, red = DENY, amber = shadow-mode/unverified).
  Must be readable from the back of a room — no subtle color-only
  distinctions, pair color with a text label every time (accessibility and
  demo-distance both demand it).
- **Command-palette / terminal-style component** → optional, only if it
  strengthens "governs the action" framing on the live-action screen. Do not
  add generic SaaS dashboard chrome (sidebars, breadcrumbs, avatar menus)
  that Linear/Vercel/Stripe would use for a full product but that adds
  nothing to a 4-screen, 3-minute demo.

Before wiring any component to real data: confirm the field exists in
`apps/api`'s actual response shape. Per CLAUDE.md §5 item 0, `AIEventContext`
has no network-destination field — don't build a UI control that implies one
exists.

## Non-negotiables

1. No screen introduces a new accent color.
2. No gradient except the single DENY/ALLOW hero moment.
3. All hash/ID/cost/model values render in `font-mono`, never sans-serif.
4. Every ALLOW/DENY badge pairs color with a text label.
5. A capability not listed in CLAUDE.md §3 does not get a "solved" visual
   treatment (a checkmark, a green badge, a completed step) anywhere.
