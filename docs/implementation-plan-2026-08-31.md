# Implementation Plan — 2026-08-31

Three parallel workstreams, each executed by a dedicated Opus agent. Boundaries are drawn
so no two agents edit the same file.

## Workstream A — Act 0 Voiceover & Audio System (agent: `act0-voiceover`)

**Goal:** Callie's Magnific-generated VO plays when her dialogue boxes appear; Tay's lines
get real dog vocalizations (stock, CC0/public-domain) instead of synth beeps.

- Download the 9 Magnific voiceover clips (identifiers & URLs in `Assets/Audio/vo-manifest.json`
  once created; source URLs expire 2026-09-03) into `Assets/Audio/callie/`.
- Map clips → Act 0 steps by creation order + duration (order matches the script exactly);
  the 9th, later clip is staged as `unassigned-retake.mp3` for the author to audition.
- Download CC0/public-domain French-Bulldog-appropriate dog sounds (sniffs, small-dog barks,
  huffs, whines) from Wikimedia Commons into `Assets/Audio/tay/`, with license/attribution
  recorded in the manifest.
- New `js/audio-manager.js`: preload, play-on-step with interrupt (advancing cuts the
  previous line), mute toggle persisted to localStorage, autoplay-policy-safe (primed on
  first user gesture), respects Edit Mode (no VO while editing).
- Wire into `js/act0-screen.js` step rendering. **Owns:** `js/audio-manager.js`,
  `js/act0-screen.js`, `Assets/Audio/**`. Does NOT touch `app.js`.

## Workstream B — Act 2 Screen (agent: `act2-builder`)

**Goal:** Act 2 built to the Craft user-flow doc (`ba02c6a4-68fc-69ec-a980-465324c8e8fb`),
with minimal placeholder art.

Beats: Tay's last subtitle → clinic call (triage Qs) → four observation checks in any
order (gums+refill, ears, panting, name response — each flashing back to its Act 1 lead)
→ gate → HINTS DROPPED payoff → the decision (act now vs wait 5 min; waiting costs
visibly, no fail state) → cooling sequence (shade/air → lake water not ice chest → belly
not face → sips not forced → wet towel re-wet loop) → transport (AC, windows, call ahead).

- Ice-chest guidance built as written per author's decision, with copy tagged
  `smePending: true` in the data for the Dr. Clark string-swap.
- No bystander. Callie is alone with Tay for the whole act. The ice chest stays as a prop —
  it is Callie's own cooler and the Act 1 "cooler" lead — and the ice misconception is
  presented unattributed ("what everyone knows") so the learner overrules their own instinct
  rather than a stranger's.
- Colorblind-safe: gum check pairs color with capillary-refill TIME everywhere.
- Follows Act 1 conventions (`data-editor-id` on everything, `isEditModeActive()` guards,
  beat-based render, Edit Mode compatible) via the `new-act-screen` skill.
- **Owns:** `js/act2-screen.js`, `css/act2-screen.css`, `js/app.js`, `index.html`,
  new placeholder SVGs. Reads `docs/design-language.md` if present before finishing.

## Workstream C — Visual Design System & WCAG (agent: `design-systems`)

**Goal:** One design language, documented, applied, accessible.

1. **First deliverable (early, so Workstream B can reference it):**
   `docs/design-language.md` — palette tokens, type scale, spacing, radii, elevation,
   component patterns (HUD pills, buttons, speech bubbles, modals, stamps, interactables),
   motion rules, and WCAG requirements. Grounded in the Craft Visual Asset Brief
   (`3ed42241-4d05-d76d-f9b4-7a7a4272c7b6`) and the existing de facto system in css/.
2. Consolidate duplicated values into custom properties in `css/main.css`.
3. WCAG 2.1 AA pass over opening / act0 / act1: contrast (compute ratios, fix failures),
   visible focus states everywhere interactive, `prefers-reduced-motion` coverage,
   aria-labels/roles audit, keyboard reachability.
4. **Owns:** `docs/design-language.md`, `css/main.css`, `css/opening-screen.css`,
   `css/act0-screen.css`, `css/act1-screen.css`, plus aria/focus attributes in existing
   screen JS where needed. Does NOT touch Act 2 files (Workstream B owns them; B applies
   the doc itself).

## Shared rules (all agents)

- Dev server already running at `http://localhost:3000`. Playwright MCP is broken here
  (no Chromium); verify with the Claude_Browser tools in a NEW tab (`tabs_create`), via
  `javascript_tool` DOM/state assertions + `read_console_messages`. Screenshots don't work.
- Non-destructive editing per `.agents/rules/`. An autosave git hook commits before edits;
  finish with your own descriptive commit. If `index.lock` collides, wait and retry.
- Craft docs readable via `craft_read` MCP: `blocks get <id> --format markdown`.
- SME items outstanding: ice-vs-cool-water (Dr. Clark), 9th VO clip assignment (author).
