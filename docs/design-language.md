# Design Language — Callie & Tay: Heat Stroke in Dogs

**Status:** authoritative. Version 1.1, 2026-09-22 (v1.0 2026-08-31).
**Owner:** Workstream C (`design-systems`).
**Audience:** every agent or human adding a screen, component, or asset to this module.

This document is the contract. It is grounded in two sources:

1. **The Craft Visual Asset Brief** (`3ed42241-4d05-d76d-f9b4-7a7a4272c7b6`) — the locked
   illustration style and character specs.
2. **The de facto system already in `css/`** — Opening, Act 0 and Act 1 were built before this
   document existed. Where they agreed with each other, that agreement is now a rule. Where they
   disagreed, this document picks a winner and `css/main.css` now carries it as a token.

If you are building a new screen, read §1, §5, §6, §7, and the checklist in §9. Everything else is
reference.

---

## 1. Principles

1. **Flat vector, no outlines, no gradients on characters.** The art direction is locked by the
   asset brief: clean bold shapes, limited warm palette, soft ambient shading. UI chrome may use
   translucency and shadow; *illustrated characters may not* get outlines, gradients, texture, or
   eye highlights. Tay and Callie's eyes are a single unbroken flat black shape — no catchlight.
2. **The scene is the interface.** Act 1 established that leads are the drawn objects themselves,
   not floating pins or badges laid over them. A new interactable should be a thing in the world
   that glows, not a marker pointing at a thing in the world.
3. **Two voices, two treatments.** Tay's voice is warm/ember (orange-brown family). Callie's is
   cool/ink (dark brown on white, teal speaker label). The flat third voice — the truth stamp —
   is dark slate with an amber rule. A learner should be able to tell who is speaking with the
   sound off and the text blurred.
4. **Never colour alone.** Every state that is communicated by colour must also be communicated
   by a glyph, a word, a number, or a shape. This is a clinical module about a colour-coded
   symptom (gum colour); the interface may not model bad practice. See §7.3.
5. **Escalation is continuous, not stepped.** Clock, saturation drain, shade drift and Tay's
   temperature are driven by continuous custom properties updated from JS, never by hard state
   swaps. New escalating elements follow that pattern (see §6.8).
6. **Non-destructive.** Everything on screen carries a `data-editor-id` and survives Edit Mode.
   See §9.

---

## 2. Colour

### 2.1 The warm palette (locked, pre-existing — do not rename)

These `--palette-*` names are referenced by game logic and by other CSS files. **Extend, never
rename.**

| Token | Hex | Role |
|---|---|---|
| `--palette-peach-light` | `#FDF4ED` | App ground, page background |
| `--palette-peach` | `#F6D6C4` | Warm background terminus of every stage gradient |
| `--palette-peach-dark` | `#E4BAA3` | Reserved warm mid |
| `--palette-brown-dark` | `#382418` | Primary text on light; Callie's bubble ink and border |
| `--palette-brown-med` | `#5E3D2A` | Secondary text on light (subtitles) |
| `--palette-brown-light` | `#8D6B53` | Reserved tertiary |
| `--palette-sage` | `#6B8E6D` | Accent dot, quiet affirmative |
| `--palette-sage-light` | `#E0ECE1` | Badge ground |
| `--palette-teal` | `#366B77` | Primary button on light surfaces (Continue) |
| `--palette-teal-dark` | `#244952` | Callie's speaker label; focus ring on light; strong borders |
| `--palette-teal-hover` | `#2B5762` | Reserved teal hover |
| `--palette-cream` | `#FAF6F0` | Reserved warm white |
| `--palette-warm-white` | `#FFFFFF` | Card ground |
| `--palette-text-dark` | `#27211E` | Near-black warm; the HUD chrome base colour |
| `--palette-text-muted` | `#6E635C` | Muted body copy on white |
| `--palette-shadow` | `rgba(56,36,24,0.08)` | Warm shadow tint |

### 2.2 Semantic tokens (added in v1.0)

The screens were carrying a second, unnamed palette — a cool slate "clinical HUD" family and a
warm ember "Tay / urgency" family, both hardcoded. They are now named.

**Dark surfaces**

| Token | Value | Role |
|---|---|---|
| `--surface-hud` | `rgba(39,33,30,0.88)` | Persistent HUD pill ground |
| `--surface-hud-btn` | `rgba(39,33,30,0.85)` | HUD button ground |
| `--surface-hud-btn-hover` | `rgba(39,33,30,1)` | HUD button hover ground |
| `--surface-tooltip` | `rgba(39,33,30,0.92)` | Tooltip ground (interactables, canopy) |
| `--surface-clock` | `rgba(30,41,59,0.92)` | Clock pill — cooler than the neutral pills on purpose |
| `--surface-card-dark` | `#0F172A` | Modal card ground (mission card, case file) |
| `--surface-card-darkest` | `#020617` | POV viewport card ground |
| `--surface-chip-dark` | `rgba(15,23,42,0.88)` | Chip/badge ground inside dark modals |
| `--surface-stamp` | `rgba(15,23,42,0.94)` | Truth stamp ground |
| `--surface-scrim` | `rgba(15,23,42,0.78)` | Full-stage modal scrim (with `blur(8px)`) |
| `--surface-glass-light` | `rgba(255,255,255,0.94)` | Light glass banner ground |

**Hairlines** — the 1px/1.5px borders that sit on dark surfaces.

| Token | Value |
|---|---|
| `--hairline-light` | `rgba(255,255,255,0.25)` |
| `--hairline-light-strong` | `rgba(255,255,255,0.6)` (hover) |
| `--hairline-light-soft` | `rgba(255,255,255,0.15)` |
| `--hairline-light-faint` | `rgba(255,255,255,0.08)` |

**Text on dark**

| Token | Value | Role |
|---|---|---|
| `--text-inverse` | `#FFFFFF` | Text on HUD chrome and saturated buttons |
| `--text-on-dark` | `#F8FAFC` | Body text inside dark modals |
| `--text-on-dark-muted` | `#E2E8F0` | Secondary text inside dark modals |
| `--text-on-dark-dim` | `#94A3B8` | Table headers, de-emphasised labels |

**Accents**

| Token | Value | Role | AA note |
|---|---|---|---|
| `--color-heat` | `#C2410C` | **Primary action.** Tay's border, primary buttons, onomatopoeia | White text on it = 5.18 ✓ |
| `--color-heat-hover` | `#9A3412` | Primary action hover | 7.31 ✓ |
| `--color-heat-bright` | `#EA580C` | **Decorative only** — glow, non-text borders | White text on it = 3.56 ✗. Never a text ground. |
| `--color-heat-deep` | `#7C2D12` | Tay's bubble ink; deep ember ground |  |
| `--color-heat-tint` | `#FFF8F3` | Tay's bubble ground |  |
| `--color-amber` | `#F59E0B` | Mission/truth accent rule and border |  |
| `--color-amber-deep` | `#B45309` | Metric badge ground | `--color-amber-pale` on it = 4.51 ✓ (at threshold — do not lighten) |
| `--color-amber-pale` | `#FEF3C7` | Metric badge text |  |
| `--color-amber-tint` | `#FDBA74` | Focus ring on dark; accent text on dark; secondary border |  |
| `--color-amber-tint-2` | `#FCD34D` | Badge hairline; elevated temp |  |
| `--color-success` | `#15803D` | Completed / all-done pill ground | White on it = 5.02 ✓ |
| `--color-success-strong` | `#047857` | Visited checkmark ground | White glyph on it = 5.48 ✓ |
| `--color-success-pale` | `#86EFAC` | Success hairline |  |
| `--color-danger` | `#B91C1C` | Hints-dropped pill, destructive hover | 6.04 ✓ |
| `--color-danger-bright` | `#EF4444` | Critical temp accent, danger hairline |  |
| `--color-danger-pale` | `#FCA5A5` | Critical label text on dark |  |
| `--color-info-strong` | `#0369A1` | Case-file badge ground | White on it = 5.93 ✓ |
| `--color-info-mid` | `#0284C7` | **Non-text only** — lake-row rules, scrollbar thumb | White text on it = 4.10 ✗ |
| `--color-info` | `#38BDF8` | Lake accent text on dark; card border |  |
| `--color-info-pale` | `#BAE6FD` | Lake reality text |  |
| `--color-water` | `rgba(56,189,248,0.13)` | Lake interactable patch fill |  |
| `--color-water-edge` | `rgba(224,242,254,0.5)` | Lake interactable inset rule |  |
| `--color-water-glow` | `rgba(125,211,252,0.75)` | Water / canopy invitation glow |  |
| `--color-food-glow` | `rgba(245,158,11,0.65)` | Solid-object invitation glow |  |
| `--surface-radio` | `#08212C` | Phone/radio bubble ground (Act 2 clinic call) |  |
| `--surface-radio-pill` | `rgba(8,33,44,0.92)` | "Calling…" pill ground |  |
| `--color-radio` | `#06B6D4` | **Non-text only** — radio bubble border, bolt tail |  |
| `--color-radio-glow` | `rgba(6,182,212,0.45)` | Radio bubble bloom |  |
| `--text-radio` | `#E0F2FE` | Text on `--surface-radio` | 14.48 ✓ |
| `--surface-art-mat` | `#F3E4DA` | Warm mat behind a framed art plate (Act 2 checks) |  |
| `--gum-blanched` | `#F2DCD6` | Capillary-refill blanch — illustration only |  |

**Temperature ramp** (Tay's gauge, §6.8)

| Token | Value | Stage |
|---|---|---|
| `--temp-normal` | `#34D399` | 100.5–102.5 °F |
| `--temp-elevated` | `#FCD34D` | rising |
| `--temp-danger` | `#F97316` | danger |
| `--temp-critical` | `#EF4444` | critical |

### 2.3 Character colour specs (locked by the asset brief)

Illustration only — these are **not** UI tokens and must not be used as text or ground colours.

| Element | Hex |
|---|---|
| Tay — coat (gray body and ears) | `#34383B` |
| Tay — white blaze / chest | `#FFFFFF` |
| Tay — inner ear pink | `#DC7F77` |
| Tay — paw pads | `#43484B` |
| Tay / Callie — eyes | flat `#000000`, single unbroken shape, **no catchlight** |
| Callie — skin | warm brown |
| Callie — hair | black, very long, straight |
| Callie — top | dusty blue with rust leaf motif |

Locations use the warm palette: peach walls, gray-taupe couch, sage green, muted teal-blue.

### 2.4 Approved text/background pairings

Every pair below is computed, not eyeballed. Full table with ratios in **Appendix A**. The short
version:

- **On light (`#FFFFFF`, `#FDF4ED`, `#F6D6C4`, `#E0ECE1`):** use `--palette-brown-dark`,
  `--palette-brown-med` (≥18.66px bold or ≥24px only), `--palette-teal-dark`,
  `--palette-text-muted`, `--color-heat`, `--color-heat-deep`.
- **On dark HUD chrome:** use `--text-inverse` only.
- **On `--surface-card-dark`:** `--text-on-dark`, `--text-on-dark-muted`, `--text-on-dark-dim`,
  `--color-amber-tint`, `--color-info`, `--color-info-pale`, all four temp-ramp colours.
- **Forbidden as a ground for body-size text:** `--color-heat-bright` (`#EA580C`),
  `--color-info-mid` (`#0284C7`), `#10B981`. All three fail AA against white.

### 2.5 Grandfathered literals (the complete list)

Tokenisation is complete except for the values below. They are the *only* colour literals left in
`opening-screen.css`, `act0-screen.css` and `act1-screen.css`, they are all deliberate, and they
are all frozen. **Do not copy them into new work, and do not "clean them up"** — several are
load-bearing for contrast (Appendix A composites against them).

| Literal | Where | Why it stays |
|---|---|---|
| `#FFF9F5`, `#FFFDFB` | Opening / Act 0 / Act 1 stage gradient first stop | Near-white gradient origins, one step off `--palette-peach-light`. Tokenising three one-use gradient stops buys nothing. `main.css`'s `#app` does the same. |
| `#1E293B` | `.act1-viewport-card` background | The card ground *behind* the scene image; only ever visible for one frame while the image decodes. |
| `#FFEDD5` | `.clock-pill` text | Warm off-white chosen against `--surface-clock`; 9.99:1. |
| `#FB923C` | `.leads-pill` border | Non-text hairline tuned to the pill's own brown ground. |
| `rgba(255,255,255,0.05 … 0.3)` | Hairlines and inner rules throughout Act 1 | Hand-tuned alphas on a photographic backdrop. The four `--hairline-*` tokens (`0.08 / 0.15 / 0.25 / 0.6`) are the rule for **new** work; these eight existing alphas are optical adjustments, same reasoning as the grandfathered spacing in §4.1. |
| `rgba(185,28,28,0.95)` | `.hints-dropped-pill` ground | `--color-danger` at 95%. CSS cannot apply alpha to a hex token without `color-mix()`; composited it is `#BD2727` at 6.04:1. |

Everything else — every colour in every one of the three files — comes from `css/main.css`.

---

## 3. Typography

### 3.1 The two families

| Token | Stack | Use |
|---|---|---|
| `--font-family-display` | `'Outfit', 'Nunito', 'Segoe UI', system-ui, sans-serif` | Headings, all UI chrome (pills, buttons, badges, tooltips, labels), **all speech-bubble dialogue** (§6.3.1), table headers, `td.tay-term` |
| `--font-family-body` | `'Plus Jakarta Sans', 'Inter', 'Segoe UI', system-ui, sans-serif` | Running prose, card bodies, table cells, truth-stamp lines |

The split is meaningful, not decorative: **Outfit is the module's voice** (systems, labels, every
character speaking) and **Plus Jakarta Sans is the read** (facts, body copy). v1.1 resolved a
conflict with §6.3.1: Tay's bubbles were body family in Acts 0–2 and display in Act 3. §6.3.1
wins — speaker identity is carried by colour, border and stem, never by family.
Loaded from Google Fonts in `index.html` — Outfit 500/600/700/800, Plus Jakarta Sans 400/500/600/700.
Weights 800 and 900 render from the nearest available face; keep 900 to short all-caps runs.

### 3.2 Scale

Sizes are `rem` at a 16px root. Fluid entries use `clamp()` so a 16:9 card scales its own type.

| Step | Size | Weight | Used for |
|---|---|---|---|
| Display XL | `clamp(2rem, 3.8vw, 3.6rem)` | 800 | Opening title |
| Display L | `clamp(1.2rem, 2.2vw, 2rem)` | 500 | Opening subtitle (body family) |
| Title | `1.5rem` | 800 | Modal titles |
| Title S | `1.35rem` / `clamp(1rem,1.45vw,1.25rem)` | 800 | Card titles |
| Dialogue | `clamp(1rem, 1.25vw, 1.2rem)` | 600 | Speech bubble text (§6.3.1) |
| Body | `0.98rem`–`1rem` | 400–500 | Card body, prose |
| Body S | `clamp(0.82rem, 1.1vw, 0.94rem)` | 400–500 | Table cells, truth-stamp line |
| UI | `0.92rem`–`0.95rem` | 700 | HUD buttons |
| UI S | `0.85rem`–`0.88rem` | 700 | HUD pills, progress badges |
| Label | `0.78rem`–`0.82rem` | 700–800 | Tooltips, tag badges |
| Micro | `0.72rem`–`0.75rem` | 800–900 | Badges, table headers, eyebrow labels |
| Nano | `0.62rem` | 800 | Gauge label only |

**Line height:** 1.1 for stacked numerals, 1.2 for titles, 1.35–1.48 for body, 1.42 for dialogue.
**Letter-spacing:** `-0.02em` on display, `0` on body, `+0.04em` to `+0.09em` on uppercase micro
labels. All-caps runs must always carry positive tracking.

**Minimum sizes.** Nothing below `0.62rem`. Anything under `0.8rem` must be ≥700 weight and must
clear 4.5:1 — small type is where this codebase's contrast failures clustered.

### 3.3 No decorative emoji in copy

Decorative or pictorial emoji are not used anywhere in UI copy, labels, ARIA text, or character dialogue anywhere in the module. The subject is a medical emergency; pictorial emoji undercut the tone and read as unserious.

Icons that genuinely aid recognition belong in the art or as SVG, not as emoji in a text node.

**The narrow exception:** a small closed set of typographic UI glyphs is permitted where it
carries affordance or state. These five, and no near-variants of them:

| Glyph | Codepoint | Used for |
|---|---|---|
| `➔` | U+2794 | Advance to the next beat — "Report it ➔" |
| `▶` | U+25B6 | Advance within a beat — "Next ▶" |
| `◀` | U+25C0 | Go back — "◀ Act 1", "◀ Back" (added v1.1, the mirror of ▶) |
| `✓` | U+2713 | A completed or correct state |
| `✕` | U+2715 | Dismiss or close — "✕ Back to Tay" |

The codepoints are listed because the near-variants are the trap: `➡` U+27A1, `✔` U+2714 and
`✖` U+2716 look almost identical in a proof and are **not** permitted. Copy the glyph from this
table rather than typing a lookalike, or the module ends up with two visually inconsistent sets.

Nothing beyond these five without a deliberate decision recorded here. Emoji in `console.log`
developer output are out of scope.

**Recorded exception (v1.1):** the plain text arrow `→` U+2192 is permitted *inside a measurement*
— a truth-stamp metric chip that reports a change in a number (`95% → 43%`). There it is
mathematical notation, not affordance, and it renders in the text face rather than as a symbol.
It never appears on a button or in running copy.

The v1.1 pass (2026-09-22) swept every act; the rule now describes current state. Where an
emoji sat in an icon slot, it became a numeral or time in a §6.7 square badge. The mute toggle
uses inline SVG.

---

## 4. Spacing, radius, elevation

### 4.1 Spacing

New work uses a **4px base scale**: `0.25 / 0.5 / 0.75 / 1 / 1.25 / 1.5 / 2 / 2.5 / 3 / 4 rem`.

Existing screens carry a finer, hand-tuned set (`0.35rem`, `0.55rem`, `0.65rem`, `1.1rem`,
`1.35rem`…). Those values are **grandfathered** — they are optical adjustments inside a fixed
16:9 card, and retrofitting them would move pixels for no benefit. Do not "clean them up." Do
not copy them into new components either.

### 4.2 Radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | `6px` | Small square badges (metric, mission, case-file) |
| `--radius-sm` | `12px` | Banners, truth stamp, inline panels, lake patch |
| `--radius-md` | `16px` | Emphasis banners (foil crinkle) |
| `--radius-lg` | `20px` | Modal cards |
| `--radius-xl` | `24px` | Viewport cards, speech bubbles |
| `--radius-2xl` | `28px` | Opening character card |
| `--radius-pill` | `100px` | **Every** pill, tooltip, tag, and button |

Anything that reads as a button, pill, chip, tag, or tooltip is `--radius-pill`. Anything that
reads as a card or a panel is `20px` or `24px`. There is no in-between.

### 4.3 Elevation

Shadow is how this module signals layer. Five steps, plus two composites.

| Token | Value | Layer |
|---|---|---|
| `--elev-1` | `0 2px 8px rgba(0,0,0,0.12)` | Progress badge |
| `--elev-2` | `0 4px 12px rgba(0,0,0,0.2)` | HUD buttons |
| `--elev-3` | `0 4px 14px rgba(0,0,0,0.25)` | HUD pills, tooltips |
| `--elev-4` | `0 8px 24px rgba(0,0,0,0.3)` | Floating banners |
| `--elev-5` | `0 10px 28px rgba(0,0,0,0.45)` | Truth stamp |
| `--elev-card` | `0 24px 60px -12px rgba(56,36,24,0.3), 0 4px 18px rgba(56,36,24,0.12)` | The 16:9 viewport card (warm shadow — it sits on a warm ground) |
| `--elev-modal` | `0 24px 60px rgba(0,0,0,0.8)` | Dark modals over the scene |

Note the tint rule: shadows cast onto the **warm page** use `rgba(56,36,24,…)`; shadows cast
**inside the scene card** use neutral `rgba(0,0,0,…)`.

---

## 5. Motion

### 5.1 Durations and easings

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | `0.18s` | Tooltip fade |
| `--dur-fast` | `0.25s` | Hover, colour, scrim fade |
| `--dur-base` | `0.35s` | Modal and bubble entrances |
| `--dur-slow` | `0.8s` | Reveals, filter/POV transitions |
| `--dur-scene` | `1.6s` | Camera push-in |
| `--dur-escalation` | `2.5s` | Shade drift, saturation drain |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | **Default.** Everything, unless stated |
| `--ease-back` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Speech bubble pop |
| `--ease-pop` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Interactable hover lift |

`--transition-fast` / `--transition-smooth` / `--transition-fade` (pre-existing) remain valid
shorthands pairing a duration with `--ease-out-expo`.

### 5.2 Rules

- **Entrances are short.** 0.3–0.4s. A learner clicks a lead and reads; they do not wait.
- **Escalation is slow.** 1.8–2.5s eased, so the clock advancing feels like weather, not a state
  change.
- **Infinite animation is an invitation or an alarm, never decoration.** Currently legitimate:
  prop ground ring, lake invite, canopy invite, pill pulse, start-button pulse, temp-critical,
  heat haze, Tay's breathing/panting/ear rig, lake waves. If a new looping animation is not
  saying "click me" or "something is wrong," delete it.
- **Hover pauses the invitation.** `animation-play-state: paused` on hover/focus — once the
  learner has found the thing, stop waving at it.
- **Never animate what the learner is reading.** Text is static once it has arrived.

### 5.3 `prefers-reduced-motion` policy

**Every infinite or decorative animation must be neutralised**, and every entrance must collapse
to a near-instant fade. The module's rule:

```css
@media (prefers-reduced-motion: reduce) {
  /* 1. Kill all looping animation, hold the mid-emphasis frame. */
  .thing-that-pulses { animation: none; }

  /* 2. Collapse entrances rather than removing them — the element must still appear. */
  .thing-that-enters { animation-duration: 0.01s; animation-delay: 0s; }

  /* 3. Preserve any final-frame transform an entrance was responsible for. */
}
```

Point 3 is the trap. `stampSlam` ends on `translateX(-50%)` and `stampSlamCentered` ends on
`translate(-50%,-50%)`; if you disable those animations outright the element loses its centring
and jumps. Always shorten, never remove, an entrance that carries a transform. Motion-carrying
state that is not decorative (a scrim fading in, a card appearing) must remain perceivable.

---

## 6. Component anatomy

Every component below exists today. Reuse the class, don't clone the styles.

### 6.1 HUD pill — `.act1-hud-pill`

Persistent, read-only status. Never clickable.

```
ground   --surface-hud + backdrop-filter: blur(10px)
border   1.5px solid --hairline-light   /* see note */
text     --text-inverse, display family, 0.88rem/700
metrics  height 38px, padding 0 1rem, --radius-pill, gap 0.45rem
shadow   --elev-3
```

> **Note.** Reconciled in v1.1: `.act1-hud-pill` now uses `--hairline-light` like every other
> act's pill.

Variants swap ground + border only: `.clock-pill` (`--surface-clock` / `--color-amber-tint` /
`#FFEDD5` text), `.leads-pill` (`rgba(124,45,18,0.9)` / `#FB923C`), `.leads-pill.all-done` and
`.canopy-prompt-pill` (`--color-success` / `--color-success-pale`), `.hints-dropped-pill`
(`--color-danger` / `--color-danger-pale`, weight 800, pulsing).

**Rule:** a pill that changes state must change its *text* too, not only its colour. `Leads 3/4`
→ `Leads 4/4` is the real signal; the green is reinforcement.

### 6.2 HUD button — `.act1-hud-btn` / `.act0-hud-btn`

```
ground   --surface-hud-btn + blur(8px)
border   1.5px solid --hairline-light
text     --text-inverse, display family, 0.92rem/700
metrics  height 40px, padding 0 1.2rem, --radius-pill
shadow   --elev-2
hover    ground --surface-hud-btn-hover, border --hairline-light-strong, translateY(-2px)
disabled opacity 0.4, cursor not-allowed
```

**Primary variant** — `.btn-action-primary` (Act 1) / `.btn-start` (Act 0). One per screen, and
only for the action that advances the story.

**The glyph names the tier (v1.1).** A label ending in `▶` advances *within* a beat ("Next ▶",
"Check Finished ▶") and is always the standard dark HUD button. A label ending in `➔` advances
the *story* — starts or finishes a beat or an act — and is always the primary variant. A learner
can tell how big a step a button takes before reading it.

**Nav labels are identical in every act.** Previous act: `◀ Act N` (aria-label "Return to Act N").
Step back inside an act: `◀ Back`. Title: `Title`, no glyph (aria-label "Return to the title
screen").

```
ground   --color-heat            /* NOT --color-heat-bright: that fails AA */
border   2px solid --color-amber-tint
weight   800
shadow   0 6px 20px rgba(194,65,12,0.4)
hover    ground --color-heat-hover, border-color #FFFFFF
attention .pulse-btn adds `pulseStartBtn 1.8s infinite`
```

> **`pulseStartBtn` lives in `css/act0-screen.css`,** but Act 1 uses it too. `@keyframes` are
> document-scoped and every stylesheet is loaded unconditionally in `index.html`, so this works —
> but it is a real cross-file dependency. Reuse the name rather than redefining it; if you ever
> make stylesheet loading conditional, this breaks silently (the button simply stops pulsing).

### 6.3 Speech bubble — `.speech-bubble`

Shared across Act 0 and Act 1. Absolutely positioned inside a `pointer-events: none` speech layer;
the bubble itself re-enables pointer events.

```
padding  1.1rem 1.4rem
radius   --radius-xl (24px)
shadow   0 16px 36px -4px rgba(56,36,24,0.28), 0 4px 12px rgba(56,36,24,0.15)
entrance bubblePop 0.3s --ease-back
```

**Anatomy:** `.speech-bubble-speaker` (display, 0.7rem/700, uppercase, +0.08em — §6.3.1)
then `.speech-bubble-text`.

### 6.3.1 Bubble typography (standard)

Speaker identity is carried by colour, border and stem, never by type size or family.
Bubble text (`.speech-bubble-text`, `.speech-bubble-text span`): `font-family: var(--font-family-display)`, `font-size: clamp(1rem, 1.25vw, 1.2rem)`, `font-weight: 600`, `line-height: 1.4`.
Speaker label (`.speech-bubble-speaker`): `0.7rem`, `font-weight: 700`, uppercase, `letter-spacing: 0.08em`.

**Callie** — `.callie-bubble`: white ground, `3px solid --palette-brown-dark`, brown-dark text,
`--palette-teal-dark` speaker label.

**Tay** — `.tay-bubble`: `--color-heat-tint` (`#FFF8F3`) ground, `3px solid --color-heat`,
`--color-heat-deep` text, `--color-heat` speaker label.

**The stem.** Two stacked CSS triangles — a `::before` in the border colour at `bottom:-22px`, and
a `::after` inset 2px in the fill colour at `bottom:-18px`, giving a seamless bordered tail.
Callie's points down-right, Tay's down-left. Horizontal position is overridable via
`--stem-left` / `--stem-right` so Edit Mode can move a bubble and keep the tail on the speaker:

```css
.speech-bubble.callie-bubble::before { right: var(--stem-right, 28px); }
.speech-bubble.callie-bubble::after  { right: calc(var(--stem-right, 28px) + 2px); }
.speech-bubble.tay-bubble::before    { left:  var(--stem-left, 24px); }
.speech-bubble.tay-bubble::after     { left:  calc(var(--stem-left, 24px) + 2px); }
```

The fallbacks *are* the defaults, so a bubble with no override renders exactly as before. The
`+ 2px` inset on the `::after` is what keeps the border seamless — preserve it if you retune.
Edit Mode's stem handle writes `--stem-right` for `.callie-bubble` and `--stem-left` for every
other bubble (`js/editor/selection-manager.js`); a new bubble variant that hardcodes `left`/`right`
will silently swallow the author's saved stem position.

**Tay onomatopoeia format** — Tay does not talk. Her subtitles are a sound, then her thought in
parentheses (the Act 3 format, adopted module-wide in v1.1):

```html
<p class="speech-bubble-text">
  <span class="tay-onomatopoeia">Sniff!</span> <span class="tay-sub-dialogue">(Cold box. Definitely food in there.)</span>
</p>
```

`.tay-onomatopoeia` is weight 800, `--color-heat`, upright, and `text-transform: uppercase` — the
casing is enforced by CSS so the script can be written naturally. The parentheses are added by
the template, never typed into the data. `.tay-sub-dialogue` is italic, `--color-heat-deep`, inline. Both inline —
never a line break between them. On an exit line, add `.is-exit-line` to the bubble: the sub
dialogue goes italic at 0.9 opacity, reading as trailing off.

### 6.4 Modal card

Two grounds. **Dark** (`--surface-card-dark`) for in-world clinical documents — mission card,
case file. **Light** (white) for out-of-world system messages — placeholders, interstitials.

```
position top 50%; left 50%; transform translate(-50%, -50%)
width    min(90%, 620px)  /* case file: min(92%, 840px) */
radius   --radius-lg
padding  1.35rem 1.6rem
shadow   --elev-modal + a coloured bloom matching the border
z-index  50 (60 for system-level)
entrance stampSlamCentered 0.35s --ease-out-expo forwards
```

Border colour carries meaning: `--color-amber` = Tay's mission, `--color-info` = the case file,
`--palette-teal-dark` = system.

Anatomy is header (badge + title, bottom hairline) → body → footer (top hairline, right-aligned
`.act1-hud-btn`). Dark modals get a 6px custom scrollbar with a `--color-info-mid` thumb.

> **⚠ The centred-modal gotcha.** There are two entrance keyframes and picking the wrong one
> silently breaks layout.
>
> - `stampSlam` ends on `transform: translateX(-50%) …`. Use it **only** for elements centred on
>   the **X axis alone** (`left:50%` + `translateX(-50%)`), e.g. banners.
> - `stampSlamCentered` ends on `transform: translate(-50%,-50%)`. Use it for elements centred on
>   **both** axes.
>
> Because these run with `forwards`, the final keyframe's transform *replaces* the rule's own
> transform for good. Put `stampSlam` on a both-axes-centred modal and it will drop its vertical
> centring the instant the animation finishes and slide down half its own height. Match the
> keyframe to the centring, always.

### 6.5 Truth stamp — `.act1-truth-stamp`

The module's flat third voice: one metric, one sentence, no argument. It arrives *after* Tay has
had her say, so the contradiction lands in a glance.

```
position bottom 4rem; left 50%; width min(680px, 86%)
ground   --surface-stamp + blur(8px)
border   1px solid rgba(245,158,11,0.5); border-left 4px solid --color-amber
radius   --radius-sm
padding  0.55rem 1rem
shadow   --elev-5
entrance povStampIn 0.4s --ease-out-expo 0.35s both   /* preserves translateX(-50%) */
```

Two children: `.truth-stamp-metric` — a hard number in an `--color-amber-deep` chip with
`--color-amber-pale` text and an `--color-amber-tint-2` hairline, `white-space: nowrap`, never
wrapping — and `.truth-stamp-line`, body family, one sentence, in `#F1F5F9` (a grandfathered
literal one step darker than `--text-on-dark`; §2.5 — new work uses the token).

**Where it appears (v1.1).** Acts 2 and 3 use it in the moment. Act 1 no longer does: the
author wanted the lake-hunt facts to land in retrospect, so each lead's `stamp.metric` now
appears as a chip inside its row of the Act 1 case file, and the POV close-ups carry dialogue
only.

**Rule:** the metric is a *measurement* (`131°F`, `2.5 sec`), not a label. If you cannot put a
number in the chip, you do not have a truth stamp; you have a caption. On narrow viewports it
stacks metric-above-line. `.stamp-temp-badge` is the same chip reused in the case-file header.

### 6.6 Interactable — `.act1-interactable`

A `<button>` with a transparent ground, absolutely positioned over the scene, wrapping the drawn
object itself. Four parts:

1. **`.interactable-art`** — the rendered prop. No glow on the art itself: an outward glow
   tracing a silhouette makes a cutout look pasted on (changed 2026-09-22, `e75e7ed`). The
   invitation is **`.prop-affordance-ring`** — a 2px `--color-food-glow` ellipse lying on the
   ground at the object's base, breathing via `propRingPulse 2.6s infinite`, plus a
   `.prop-ground-shadow` contact shadow. Hover/focus: art `scale(1.04)` with `--ease-pop`; ring
   paused at full opacity. Visited: ring fades out.
2. **`.interactable-tooltip`** — the name. Hidden at rest (`opacity: 0`), revealed on hover **and
   `:focus-visible`**, sliding up 6px. `--surface-tooltip`, pill radius, `pointer-events: none`.
3. **`.interactable-check`** — a 20px `--color-success-strong` disc with a 2px white ring and a
   white glyph, pinned top-right at `-6px/-6px`. Appears with `.visited`, which also retires the
   ground ring.
4. **`:focus-visible`** — `3px solid --color-amber-tint`, `outline-offset: 4px`,
   `border-radius: 12px`.

**Variants.** Solid objects lift. **Water does not** — `.interactable-lake` overrides
`transform: none; filter: none` and instead brightens its own outlined patch (`--color-water` fill,
`--color-water-edge` inset rule, `lakeInvite` breathing) plus shore-parallel `.lake-wave` ripples.
Its tooltip stays permanently visible, because it has no drawn object to be recognised by. If a
lead has no art, it must earn an always-on label.

The check is positioned per-object where the default corner would float free of the art (see
`.interactable-dock .interactable-check`).

**Rule:** visited state is *never* colour alone — the checkmark glyph is the primary signal, and
the leads pill counts up in text.

### 6.7 Tooltip / tag / badge

- **Tooltip** (`.interactable-tooltip`, `.canopy-tooltip`): `--surface-tooltip` + `blur(6px)`,
  `1px solid rgba(255,255,255,0.2)`, `--text-inverse`, display 0.78rem/700, pill radius, nowrap,
  `pointer-events: none`, fades on hover **and** focus-visible.
- **Tag badge** (`.pov-tag-badge`): pill, `--surface-chip-dark`, `--color-amber-tint` text and a
  `--color-heat-bright` hairline, uppercase 0.82rem/800.
- **Square badge** (`.mission-card-badge`, `.case-file-badge`, `.truth-stamp-metric`):
  `--radius-xs`, uppercase, 0.72–0.85rem, weight 800–900, +0.08em tracking.

### 6.8 Temperature gauge — `.act1-temp-gauge`

Deliberately *not* a pill. It is the only HUD element reporting on Tay rather than on the scene,
so it is built differently: taller (46px), `--radius-sm` instead of pill, its own dark gradient
ground, and a coloured border that heats up.

```
ground   linear-gradient(160deg, rgba(12,20,34,0.96), rgba(24,16,14,0.96))
border   2px solid var(--temp-accent)
shadow   0 6px 20px rgba(0,0,0,0.35), 0 0 18px -4px var(--temp-glow)
children .temp-gauge-icon · .temp-gauge-readout (.temp-gauge-value + .temp-gauge-label)
         .temp-gauge-track > .temp-gauge-fill   /* 4px bottom rail, width: var(--temp-fill) */
```

Stage classes set `--temp-accent` / `--temp-glow` from the §2.2 ramp:
`.stage-normal` → `.stage-elevated` → `.stage-danger` → `.stage-critical` (which also pulses its
glow and turns the label `--color-danger-pale`). The fill bar carries the whole ramp as a
gradient, so the bar's *length* and the numeral's *value* both encode severity independently of
hue — colourblind-safe by construction. Copy this pattern for any new severity indicator.

It is `role="img"` with an `aria-label` spelling out the number and the stage in words, plus a
`title` giving the normal range. Keep that.

### 6.9 Light glass banner

`.callie-offscreen-banner`, `.foil-crinkle-banner`: `--surface-glass-light` + blur, a 5px
left rule or 2px full border in the speaker's accent, `--palette-brown-dark` text, `--radius-sm`
or `--radius-md`, `--elev-4`. Used when a voice arrives from outside the frame.

---

## 7. Accessibility requirements (WCAG 2.1 AA)

### 7.1 Contrast

- **Normal text** (< 18.66px bold, < 24px regular): **≥ 4.5:1**.
- **Large text** (≥ 18.66px bold or ≥ 24px): **≥ 3:1**.
- **UI components and meaningful graphics** (borders that carry state, focus rings, the
  checkmark disc against its surroundings): **≥ 3:1**.
- Translucent grounds must be evaluated **composited against the worst-case backdrop**. HUD chrome
  floats over a photographic scene that ranges from near-white sky to dark water; compute dark
  chips against white and light chips against dark.
- Do not eyeball this. `scratchpad/contrast.js` + `pairs.json` in the design-systems working set
  computes it; Appendix A is its output.

### 7.2 Focus

Every interactive element has a visible `:focus-visible` ring. Two rings, by ground, and both
are tokenised — **use the tokens, not the literals**:

| Token | Value |
|---|---|
| `--focus-ring-width` | `3px` |
| `--focus-ring-offset` | `3px` |
| `--focus-ring-on-light` | `var(--palette-teal-dark)` (`#244952`) |
| `--focus-ring-on-dark` | `var(--color-amber-tint)` (`#FDBA74`) |

```css
/* On light surfaces */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-on-light);
  outline-offset: var(--focus-ring-offset);
}
/* On dark surfaces / over the scene */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-on-dark);
  outline-offset: var(--focus-ring-offset);
}
```

Rules: never `outline: none` without an equally visible replacement; the ring must not be clipped
by an ancestor's `overflow: hidden` (use `outline-offset` ≤ 4px inside the viewport card); an
element whose hover state changes appearance must show that same change on focus — every
`:hover` selector in this codebase is paired with `:focus-visible`, and yours must be too.

### 7.3 Never colour alone

Required by SC 1.4.1, and doubly required here because the subject matter is a colour-read
symptom. Established patterns:

- Visited lead → checkmark **glyph** + counter **text**, not just a green glow.
- Temperature → **numeral** + fill **length** + stage **word**, not just a hue.
- Gum check (Act 2) → colour **paired with capillary refill time in seconds**, everywhere,
  without exception.
- Disabled → `opacity` **plus** the `disabled` attribute, so it is announced.

### 7.4 Semantics

- Interactive = a real `<button>`. If markup forces a `<div>`, it needs
  `role="button" tabindex="0"` **and** Enter/Space handlers (see the armed canopy).
- Every icon-only or art-only control needs an `aria-label` naming the *action*
  (`"Investigate the cooler"`), not the art.
- Decorative SVG and glyphs get `aria-hidden="true"`.
- Scene images get a descriptive `alt`; purely atmospheric layers get `alt=""`.
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title, focus
  moved in on open and restored on close, Escape closes.
- Live status (clock, leads counter, temperature) belongs in an `aria-live="polite"` region so a
  screen-reader user hears escalation. Never `assertive` — it interrupts the narration.

### 7.5 Keyboard

Tab order follows visual order. Every lead is reachable and actionable by keyboard. Nothing is
hover-only: every tooltip, glow and lift reveals on `:focus-visible` too. No keyboard traps —
a modal returns focus to the control that opened it.

---

## 8. Edit Mode compatibility

Edit Mode is a first-class constraint, not an afterthought. `css/edit-mode.css`,
`css/visual-overrides.css` and `js/editor/` are owned elsewhere — **do not edit them** — but every
screen must cooperate:

1. **Every positioned, visible element carries a stable `data-editor-id`.** Kebab-case, prefixed
   with its screen: `act2-hud-clock`, `act2-btn-call-clinic`. It is the selector key that
   `visual-overrides.css` writes against, so **never rename one** — a rename orphans the author's
   saved position silently.
2. **Overrides win via `!important` on `left/top/right/bottom/width/height` and custom
   properties.** Author your defaults so they are overridable: position with `left`/`top` rather
   than transforms where an author might want to move something, and expose stem/offset positions
   as custom properties (as the speech bubble does with `--stem-left` / `--stem-right`).
3. **Guard every gameplay handler** with an `isEditModeActive()` check (or
   `document.body.classList.contains('edit-mode-active')`) and `preventDefault()` +
   `stopPropagation()` — clicking a button to *select* it must not fire its lesson action.
4. **Do not suppress voiceover, timers, or autoplay logic while editing.** Check the flag and skip.

---

## 9. Building a new screen — checklist

**Structure**

- [ ] Root `.actN-container` reusing the shared radial stage gradient.
- [ ] Content inside an `.actN-viewport-card`: `aspect-ratio: 16/9`, `min(94vw, 1300px)`,
      `max-height: 84vh`, `--radius-xl`, `4px solid #FFFFFF`, `--elev-card`.
- [ ] Separate `pointer-events: none` overlay layers, each explicitly `position: absolute; inset: 0`.
      *(A scene layer left `static` falls below the full-height background image in normal flow
      and gets clipped away by the card's `overflow: hidden` — this has already bitten Act 1.)*
- [ ] HUD bar top, nav bar bottom, both `pointer-events: none` with `pointer-events: auto` groups.

**Design tokens**

- [ ] No new hex literals. Every colour comes from `css/main.css`. If you truly need a new one,
      add it there as a semantic token and add it to §2.2 and Appendix A.
- [ ] Radii from §4.2. Pill for anything button-shaped, 20/24px for anything card-shaped.
- [ ] Elevation from §4.3, with the correct shadow tint for the surface it casts onto.
- [ ] Type from §3.2. Display family for chrome, body family for prose.

**Motion**

- [ ] Entrances 0.3–0.4s on `--ease-out-expo`.
- [ ] Correct centring keyframe: `stampSlam` (X only) vs `stampSlamCentered` (both axes). §6.4.
- [ ] Every looping animation is an invitation or an alarm.
- [ ] `prefers-reduced-motion` block covers **every** animation you added — loops set to `none`,
      entrances shortened to `0.01s` (never removed, if they carry a transform).

**Accessibility**

- [ ] Every text/background pair run through the contrast script; all ≥ 4.5 (or 3.0 large).
- [ ] Every interactive element has `:focus-visible` with the correct ring for its ground.
- [ ] Every `:hover` rule paired with `:focus-visible`.
- [ ] Every state also readable without colour.
- [ ] Real `<button>`s; `aria-label` on art-only controls; `aria-hidden` on decorative SVG.
- [ ] Modals: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, Escape.
- [ ] Live status in `aria-live="polite"`.
- [ ] Tab through the whole screen with no mouse and complete it.

**Edit Mode**

- [ ] `data-editor-id` on every positioned element, screen-prefixed, kebab-case, never renamed.
- [ ] `isEditModeActive()` guard with `preventDefault()`/`stopPropagation()` at the top of every
      gameplay handler.
- [ ] Positional defaults expressed as overridable `left/top/width/height` or custom properties.

**Responsive**

- [ ] `@media (max-width: 768px)`: card flips to `4/3`, HUD shrinks to 40px/32px pills, modals
      widen to 96%.
- [ ] `@media (max-height: 700px)`: tall modals tighten padding and type rather than scrolling.

---

## Appendix A — Contrast audit

Computed with `contrast.js` (WCAG 2.1 relative-luminance formula), alpha-composited against the
stated worst-case backdrop. Sizes are px at a 16px root; "large" = ≥24px, or ≥18.66px at weight
≥700.

### A.1 Failures found and fixed (v1.0 pass)

| Element | Before | Ratio | After | Ratio | Fix |
|---|---|---|---|---|---|
| `.tay-bubble .speech-bubble-speaker` | `#EA580C` on `#FFF8F3` | **3.39** ✗ | `#C2410C` on `#FFF8F3` | **4.93** ✓ | Speaker label darkened to `--color-heat`, matching the bubble border and the onomatopoeia |
| `.act0-hud-btn.btn-start` | `#FFFFFF` on `#EA580C` | **3.56** ✗ | `#FFFFFF` on `#C2410C` | **5.18** ✓ | Primary-button ground unified with Act 1's `--color-heat` |
| `.act1-hud-pill.leads-pill.all-done` | `#FFF` on `rgba(21,128,61,.92)` | **4.34** ✗ | `#FFF` on `#15803D` | **5.02** ✓ | Alpha dropped to opaque `--color-success` |
| `.act1-hud-pill.canopy-prompt-pill` | `#FFF` on `rgba(21,128,61,.92)` | **4.34** ✗ | `#FFF` on `#15803D` | **5.02** ✓ | Same |
| `.interactable-check` | `#FFFFFF` on `#10B981` | **2.54** ✗ | `#FFFFFF` on `#047857` | **5.48** ✓ | Disc darkened to `--color-success-strong`; still 5.48 against its white ring |
| `.case-file-badge` | `#FFFFFF` on `#0284C7` | **4.10** ✗ | `#FFFFFF` on `#0369A1` | **5.93** ✓ | Text ground moved to `--color-info-strong`; `#0284C7` retained for non-text rules |

### A.2 Full pass — 61 pairs, 0 failures after fixes

| Element | FG | Effective BG | Kind | Required | Ratio |
|---|---|---|---|---|---|
| OPEN `.opening-title` | `#382418` | `#F6D6C4` | large | 3.0 | 10.70 |
| OPEN `.subtitle-part` | `#5E3D2A` | `#F6D6C4` | large | 3.0 | 7.04 |
| OPEN `.opening-title-badge` | `#382418` | `#E0ECE1` | normal | 4.5 | 12.04 |
| OPEN `.character-label-pill` | `#382418` | `#FFFFFF` | normal | 4.5 | 14.65 |
| OPEN `.continue-btn` | `#FFFFFF` | `#366B77` | large | 3.0 | 5.96 |
| OPEN `.continue-btn:hover` | `#FFFFFF` | `#382418` | large | 3.0 | 14.65 |
| OPEN focus ring | `#244952` | `#F6D6C4` | non-text | 3.0 | 7.13 |
| A0 `.callie-bubble` text | `#382418` | `#FFFFFF` | normal | 4.5 | 14.65 |
| A0 `.callie-bubble` speaker | `#244952` | `#FFFFFF` | normal | 4.5 | 9.77 |
| A0 `.tay-bubble` text | `#7C2D12` | `#FFF8F3` | large | 3.0 | 8.91 |
| **A0 `.tay-bubble` speaker** | `#C2410C` | `#FFF8F3` | normal | 4.5 | **4.93** |
| A0 `.tay-onomatopoeia` | `#C2410C` | `#FFF8F3` | large | 3.0 | 4.93 |
| A0 `.tay-bubble` border vs fill | `#C2410C` | `#FFF8F3` | non-text | 3.0 | 4.93 |
| A0 `.act0-hud-btn` | `#FFFFFF` | `#474240` | normal | 4.5 | 9.86 |
| **A0 `.btn-start`** | `#FFFFFF` | `#C2410C` | normal | 4.5 | **5.18** |
| A0 `.btn-start:hover` | `#FFFFFF` | `#9A3412` | normal | 4.5 | 7.31 |
| A0 `.act0-progress-badge` | `#382418` | `#FFFFFF` | normal | 4.5 | 14.65 |
| A1 `.act1-hud-pill` | `#FFFFFF` | `#413C39` | normal | 4.5 | 10.93 |
| A1 `.clock-pill` | `#FFEDD5` | `#303A4B` | normal | 4.5 | 9.99 |
| A1 `.leads-pill` | `#FFFFFF` | `#89422A` | normal | 4.5 | 7.30 |
| **A1 `.leads-pill.all-done`** | `#FFFFFF` | `#15803D` | normal | 4.5 | **5.02** |
| **A1 `.canopy-prompt-pill`** | `#FFFFFF` | `#15803D` | normal | 4.5 | **5.02** |
| A1 `.hints-dropped-pill` | `#FFFFFF` | `#BD2727` | normal | 4.5 | 6.04 |
| A1 temp value — normal | `#34D399` | `#0C1422` | normal | 4.5 | 9.59 |
| A1 temp value — elevated | `#FCD34D` | `#0C1422` | normal | 4.5 | 12.79 |
| A1 temp value — danger | `#F97316` | `#0C1422` | normal | 4.5 | 6.58 |
| A1 temp value — critical | `#EF4444` | `#0C1422` | normal | 4.5 | 4.90 |
| A1 `.temp-gauge-label` | `#BBBDC1` | `#0C1422` | normal | 4.5 | 9.82 |
| A1 `.temp-gauge-label` critical | `#FCA5A5` | `#0C1422` | normal | 4.5 | 9.72 |
| A1 `.interactable-tooltip` | `#FFFFFF` | `#383330` | normal | 4.5 | 12.49 |
| A1 `.canopy-tooltip` | `#FFFFFF` | `#383330` | normal | 4.5 | 12.49 |
| **A1 `.interactable-check`** | `#FFFFFF` | `#047857` | normal | 4.5 | **5.48** |
| A1 interactable focus ring | `#FDBA74` | `#0F172A` | non-text | 3.0 | 10.59 |
| A1 `.mission-card-title` | `#FFFFFF` | `#0F172A` | large | 3.0 | 17.85 |
| A1 `.mission-card-body` | `#E2E8F0` | `#0F172A` | normal | 4.5 | 14.48 |
| A1 `.mission-card-badge` | `#FEF3C7` | `#B45309` | normal | 4.5 | 4.51 |
| A1 `.mission-lead-item` | `#FDBA74` | `#1B2335` | normal | 4.5 | 9.34 |
| A1 `.pov-tag-badge` | `#FDBA74` | `#0D1528` | normal | 4.5 | 10.78 |
| A1 `.pov-close-btn` | `#FFFFFF` | `#0D1528` | normal | 4.5 | 18.18 |
| A1 `.pov-close-btn:hover` | `#FFFFFF` | `#B91C1C` | normal | 4.5 | 6.47 |
| A1 `.callie-dialogue` | `#382418` | `#FFFFFF` | normal | 4.5 | 14.65 |
| A1 `.truth-stamp-metric` | `#FEF3C7` | `#B45309` | normal | 4.5 | 4.51 |
| A1 `.truth-stamp-line` | `#F1F5F9` | `#0E1629` | normal | 4.5 | 16.45 |
| A1 `.stamp-temp-badge` | `#FEF3C7` | `#B45309` | normal | 4.5 | 4.51 |
| A1 `.act1-hud-btn` | `#FFFFFF` | `#474240` | normal | 4.5 | 9.86 |
| A1 `.btn-action-primary` | `#FFFFFF` | `#C2410C` | normal | 4.5 | 5.18 |
| A1 `.btn-action-primary:hover` | `#FFFFFF` | `#9A3412` | normal | 4.5 | 7.31 |
| **A1 `.case-file-badge`** | `#FFFFFF` | `#0369A1` | normal | 4.5 | **5.93** |
| A1 `.case-file-title` | `#FFFFFF` | `#0F172A` | large | 3.0 | 17.85 |
| A1 `.case-file-table th` | `#94A3B8` | `#0F172A` | normal | 4.5 | 6.96 |
| A1 `.case-file-table td` | `#E2E8F0` | `#0F172A` | normal | 4.5 | 14.48 |
| A1 `td.tay-term` | `#FDBA74` | `#0F172A` | normal | 4.5 | 10.59 |
| A1 lake-row `td.tay-term` | `#38BDF8` | `#0F2841` | normal | 4.5 | 7.00 |
| A1 lake-row `td.reality-term` | `#BAE6FD` | `#0F2841` | normal | 4.5 | 11.30 |
| A1 `.shade-drift-timelapse-banner` | `#FDBA74` | `#272E3F` | normal | 4.5 | 8.02 |
| A1 `.foil-crinkle-banner` | `#382418` | `#FFFFFF` | normal | 4.5 | 14.65 |
| A1 `.foil-crinkle-sound` | `#C2410C` | `#FFFFFF` | normal | 4.5 | 5.18 |
| A1 `.callie-offscreen-banner` | `#382418` | `#FFFFFF` | normal | 4.5 | 14.65 |
| A1 `.callie-offscreen-label` | `#244952` | `#FFFFFF` | normal | 4.5 | 9.77 |
| A1 `.act2-placeholder-title` | `#382418` | `#FFFFFF` | large | 3.0 | 14.65 |
| A1 `.act2-placeholder-text` | `#6E635C` | `#FFFFFF` | normal | 4.5 | 5.83 |

**Watch list.** `--color-amber-pale` on `--color-amber-deep` sits at **4.51** — it passes by
0.01. Do not lighten `#B45309` or darken `#FEF3C7`. Any new badge on that ground must keep both
values exactly.
