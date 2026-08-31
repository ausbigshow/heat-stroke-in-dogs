---
name: new-act-screen
description: Scaffold a new "Act" screen (JS controller + CSS + app.js wiring) following this project's existing Act 0 / Act 1 conventions. Use when adding a new act/scene to the Callie & Tay interactive course, e.g. "add Act 2" or "build the clinic transport screen".
---

# New Act Screen

This project structures its story as a sequence of "Act" screens, each a self-contained
JS controller mounted into `#stage` by [js/app.js](../../../js/app.js). Follow the exact
pattern below so new screens stay compatible with the visual Edit Mode
(`js/editor/`) and the navigation system.

## Reference implementations

Read these before writing anything new — they are the ground truth for structure and style:

- [js/act0-screen.js](../../../js/act0-screen.js) — simplest example (single-bubble dialogue sequence)
- [js/act1-screen.js](../../../js/act1-screen.js) — more complex example (beats, HUD, quiz-like interaction)
- [js/app.js](../../../js/app.js) — the orchestrator; see `navigateTo()` for how screens are mounted/unmounted and `renderAct2Placeholder()` for the current Act 2 stub that a real Act 2 screen would replace

## Steps

1. **Ask what the act covers** if not already clear from the request (the beats/steps, any interactive choices, character dialogue). Don't invent story content — the existing acts (see [.agents/rules/edit-mode.md](../../../.agents/rules/edit-mode.md) and any dialogue scripts already in the repo) are the source of truth for tone and character voice (Callie, Tay).

2. **Create `js/actN-screen.js`** exporting a class `ActNScreen`:
   - `constructor(app)` — store `this.app = app`, `this.container = null`, and whatever step/state fields the act needs (mirror `Act0Screen`'s `currentStepIndex` / `Act1Screen`'s `currentBeat`, `stepIndex`, `activeLeadId` as appropriate).
   - `mount()` — `this.container = document.getElementById('screen-actN')`; guard on missing container; call `this.render()`; attach any listeners (bind them in the constructor first, e.g. `this.handleKeyDown = this.handleKeyDown.bind(this)`).
   - `unmount()` — remove every listener `mount()` added. This is called by `app.navigateTo()` before switching screens — leaking a listener here breaks every later screen change.
   - `render()` — builds `this.container.innerHTML` from a `steps`/`beats` data array (declared in the constructor, not hardcoded into template strings) so the content stays easy to edit later.
   - Every element the Edit Mode should be able to select/drag/resize needs a unique `data-editor-id="actN-<name>"` attribute — check how liberally `act1-screen.js` applies these and match that density.

3. **Create `css/actN-screen.css`** for the new screen's styles, scoped under `#screen-actN`. Keep it separate from `css/visual-overrides.css` — that file is written exclusively by the in-app Edit Mode save system and should never be hand-edited (see the project's `warn-visual-overrides` hook).

4. **Wire it into [index.html](../../../index.html)**:
   - Add `<link rel="stylesheet" href="css/actN-screen.css">` near the other act stylesheet links, before `edit-mode.css` and `visual-overrides.css`.

5. **Wire it into [js/app.js](../../../js/app.js)**:
   - Add `import { ActNScreen } from './actN-screen.js';` at the top.
   - Add an `else if (screenKey === 'actN')` branch in `navigateTo()` that sets `stage.innerHTML = '<section id="screen-actN" aria-label="...">'`, constructs `new ActNScreen(this)`, applies any `options` (beat/step/etc.), and calls `.mount()` — mirror the existing `act0`/`act1` branches exactly.
   - If this screen replaces a placeholder (e.g. `renderAct2Placeholder()`), remove the placeholder branch and its now-unused handler wiring.

6. **Verify in the browser** — use the `verify-in-browser` skill (or start the dev server and navigate manually) to confirm the screen mounts, renders its first step, and that `unmount()` doesn't throw when navigating away.

## Things to not do

- Don't touch `css/visual-overrides.css` — that's the Edit Mode's file.
- Don't add a build step, bundler, or new runtime dependency — this project is plain ES modules served by [dev-server.js](../../../dev-server.js), and that's intentional.
- Don't write acts that skip `unmount()` cleanup — every existing screen does this and the editor relies on clean screen transitions (`this.editor.selection.setSelectedElement(null)` runs right after `navigateTo`).
