# Callie and Tay: A Story About Heat Stroke in Dogs

An interactive e-learning module about recognising and treating heat stroke in dogs,
told in four acts from two points of view.

Callie takes her French Bulldog, Tay, to the lake on a hot afternoon. Act 1 is Tay's
story — she hunts for food and gets everything wrong, and every promising lead is a heat
risk factor. Act 2 is Callie's, and it is the same afternoon from outside the dog:
recognising it, calling the clinic, cooling her, and driving her in. The learner spends
the first act causing the emergency without knowing it, and the second act reading it
back as a case history.

## Design

The module's core idea is that **Act 2 is the structural inversion of Act 1**, and the
opposition is the lesson:

|                    | Act 1            | Act 2                      |
| ------------------ | ---------------- | -------------------------- |
| Order              | Any              | Fixed                      |
| Inner access       | Full narration   | One line, then silence     |
| Wrong answers      | None exist       | Exist, and cost            |
| Learner's position | Inside the dog   | Outside the dog, inferring |

Owners cannot feel heat stroke happening — they have to infer it from a body that
cannot explain itself. So every interaction in Act 2 is an inference tool: look, touch,
count, compare. **Callie never gets a temperature readout, and neither does the learner.**

A few rules the code holds to deliberately:

- **Tay speaks once in Act 2** and is silent afterwards. Her voice returning in Act 3 is
  the payoff, so no other Tay line exists anywhere in `js/act2-screen.js`.
- **No fail state.** Waiting or choosing wrongly costs visible time and worsens her
  condition on screen, but never ends the run. The learner always gets to fix it.
- **Colourblind-safe vitals.** Gum state is never carried by colour alone — every render
  pairs the swatch with a written label, a distinct SVG fill pattern, the capillary
  refill time in seconds against the printed normal, and a severity word.
- **The misconceptions are unattributed.** The wrong cooling answers ("pack her in ice",
  "wrap her up tight") are presented as received wisdom under a *What everyone knows*
  label rather than spoken by a character, so what the learner overrules is their own
  instinct and nobody has to be made a fool.

## Running it

The course is plain static files with no build step and no dependencies. Any static
server works:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

### Authoring mode

The repository also ships a small Node dev server that backs **Edit Mode** — an
in-browser visual authoring layer with drag/resize, in-place text editing, reviewer
sticky notes, and version snapshots.

```bash
npm run dev
```

Then open <http://localhost:3000> and press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd>.

Edit Mode writes back to disk through `/api/*` routes in `dev-server.js` — reviewer
notes to `data/notes.json` and layout tweaks to `css/visual-overrides.css`. Because none
of that exists on a static host, `js/app.js` only loads Edit Mode from a localhost
origin (or with `?edit=1`). The published build never fetches the editor modules at all.

## Layout

```
index.html              Single page shell — every screen renders into #stage
js/app.js               Screen orchestrator and Edit Mode gate
js/act0-screen.js       Intro: Callie and Tay on the couch
js/act1-screen.js       Tay's POV at the lake — four leads, any order
js/act2-screen.js       Callie's POV — triage call, cooling, transport
js/act3-screen.js       The clinic, then home
js/audio-manager.js     Voiceover and dog vocalisations
js/a11y-focus.js        Focus continuity across re-renders
js/editor/              Edit Mode (authoring only, not shipped to learners)
css/                    One stylesheet per screen, tokens in main.css
Assets/                 Images and audio
docs/design-language.md Palette, type scale, spacing, motion, WCAG requirements
dev-server.js           Authoring backend — not part of the deployed site
```

## Accessibility

Built to WCAG 2.1 AA: computed contrast ratios, visible focus states on every
interactive element, full keyboard reachability with focus continuity preserved across
re-renders, `prefers-reduced-motion` coverage throughout, and a screen-reader status
region that narrates Tay's observable state as it changes.

## Credits and licensing

- **Dog vocalisations** are CC0 / public domain, sourced from Wikimedia Commons.
  Per-clip source URLs, authors, licences, and the processing applied are recorded in
  [`Assets/Audio/vo-manifest.json`](Assets/Audio/vo-manifest.json).
- **Callie's voiceover** was generated with Magnific / ElevenLabs and is licensed to the
  project owner through their Magnific account.
- Veterinary guidance in the module is pending sign-off from the project's subject
  matter expert. Strings affected by the outstanding ice-versus-cool-water question are
  tagged `smePending: true` in `js/act2-screen.js` so they can be swapped in one pass.

> **Note:** This is an instructional design project, not veterinary advice. If you think
> your dog has heat stroke, start cooling them and call your vet immediately.
