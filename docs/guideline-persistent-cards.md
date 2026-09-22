# Guideline — Persistent cards and once-only entrances

**Problem this fixes.** Every screen controller in this project renders by rebuilding the
whole stage with `this.container.innerHTML = …`. That is fine for advancing a line of
dialogue, but any interaction *inside* a card (choosing an option, toggling a table,
expanding a panel) also rebuilds the card, so:

- the card replays its entrance animation on every click — it looks like the pop-up
  "reloads";
- every other animated element on the stage replays too (a character's slide-in, a
  bubble's pop, a panel's fade), so things visibly bounce in the background;
- keyboard focus is lost, because the button the learner clicked no longer exists.

Act 3's prevention card (`js/act3-screen.js`, `renderNextTime()` / `togglePrevention()`)
is the reference implementation. Apply the same three rules to any card in Acts 0–2 that
"reloads".

---

## Rule 1 — Entrance animations run once per beat, never per render

**JS** (constructor, plus wherever the screen is reset — `mount()`, `applyHandoff()`):

```js
this._enteredBeat = null;   // which beat last got its entrance animation
this._renderedStep = null;  // `${beat}-${stepIndex}` of the last render
```

**JS** (`render()`), computed *before* building the template:

```js
const entering = this._enteredBeat !== this.currentBeat;
this._enteredBeat = this.currentBeat;
// …
<div class="actN-viewport-card … ${entering ? 'is-entering' : ''}" data-beat="${this.currentBeat}">
```

`nextSubStep()` / `prevSubStep()` must **not** touch `_enteredBeat`; only a beat change
(or a reset) does. Deep links start from `null`, so the first frame still animates.

**CSS** — every entrance animation is scoped under `.is-entering`. Never leave an
`animation:` on an element that survives a re-render unscoped:

```css
/* before */
.actN-prevention-card { animation: actNCardRise var(--dur-base) var(--ease-out-expo) forwards; }

/* after */
.is-entering .actN-prevention-card { animation: actNCardRise var(--dur-base) var(--ease-out-expo) forwards; }
```

Scope character entrances even tighter, to the beat they belong to:

```css
.is-entering[data-beat="verdict"] .act3-cast-reyes.is-active { animation: act3ReyesSlide … ; }
```

Cross-fades driven by `transition:` (opacity/transform on state-class changes) are fine
as they are — transitions only fire when a value actually changes.

**Speech bubbles** are the one exception: they *should* pop when a new line appears, but
not when the same line is re-rendered. Key them by step:

```js
const stepKey = `${this.currentBeat}-${this.stepIndex}`;
const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';
// …after the template is written:
this._renderedStep = stepKey;
```

```css
#screen-actN .speech-bubble:not(.is-new-line) { animation: none; }
```

## Rule 2 — Interactions inside a card patch the DOM; they do not call `render()`

The handler mutates state, then edits the existing elements in place:

```js
togglePrevention(id) {
  if (!id || this.preventionChosen.has(id)) return;   // choices are final
  this.preventionChosen.add(id);
  this.activePrevention = id;

  const li  = this.container.querySelector(`.act3-prevention-item:has([data-prevention="${id}"])`);
  const btn = li?.querySelector('.act3-prevention-option');
  li.classList.add('is-chosen');
  btn.classList.add('is-chosen');
  btn.setAttribute('aria-pressed', 'true');
  btn.setAttribute('aria-disabled', 'true');
  btn.setAttribute('aria-describedby', `act3-prevention-reply-${id}`);
  btn.querySelector('.act3-prevention-state').innerHTML = this.getPreventionStateHtml(true);

  // live region: only the newest reply announces
  this.container.querySelectorAll('.act3-prevention-reply').forEach(r => { … });

  // the count and the advance button, from the SAME helpers render() uses
  this.container.querySelector('.act3-prevention-count').textContent = `${chosen} of ${total} chosen`;
  const { className, html } = this.getPreventionButtonState();
  const adv = this.container.querySelector('#act3-btn-next-step');
  adv.className = className; adv.innerHTML = html;
}
```

**Non-negotiable:** any markup or class logic that both `render()` and the patch need
lives in one helper (`getPreventionStateHtml()`, `getPreventionButtonState()`), so the
two paths cannot drift. `render()` must still produce the correct final DOM for any state
— Back into the beat, Replay, and `?screen=…&beat=…` deep links all go through it.

Check after implementing: click an option and confirm (a) `document.activeElement` is
still that button, (b) the card element is the same object as before the click, and
(c) `el.getAnimations()` on the background cast returns nothing.

## Rule 3 — Expandable content is always in the DOM and animates open with a grid trick

Render the collapsible content for **every** item, not only the chosen ones; visibility is
a class, not a conditional in the template.

```html
<li class="act3-prevention-item">
  <button class="act3-prevention-option" …>…</button>
  <div class="act3-prevention-reply-wrap">      <!-- grid, 0fr → 1fr -->
    <div class="act3-prevention-reply-clip">    <!-- the grid item: NO padding/border -->
      <div class="act3-prevention-reply" aria-hidden="true">…</div>   <!-- the styled box -->
    </div>
  </div>
</li>
```

```css
.act3-prevention-reply-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--dur-base) var(--ease-out-expo);
}
.is-chosen > .act3-prevention-reply-wrap { grid-template-rows: 1fr; }

.act3-prevention-reply-clip {
  overflow: hidden;
  min-height: 0;
  visibility: hidden;                              /* no hit-testing, no AT, no peeking */
  transition: visibility 0s linear var(--dur-base);
}
.is-chosen > .act3-prevention-reply-wrap > .act3-prevention-reply-clip {
  visibility: visible;
  transition-delay: 0s;
}
@media (prefers-reduced-motion: reduce) {
  .act3-prevention-reply-wrap { transition: none; }
}
```

Why three layers: the grid item must carry **no padding or border** of its own, otherwise
at `0fr` a few pixels of the reply still show (that was the "sliver" bug). Put all visual
styling on the innermost box. Toggle `aria-hidden` on it in the patch handler.

---

## Checklist for converting a card

1. Find every `animation:` in the act's stylesheet; scope each one under `.is-entering`
   (or `.is-entering[data-beat="…"]`). Leave `transition:` rules alone.
2. Add `_enteredBeat` / `_renderedStep`, the `is-entering` class and `data-beat`
   attribute in `render()`, and the bubble `is-new-line` key.
3. For each in-card interaction, replace `this.render()` with a DOM patch; hoist shared
   markup into helpers.
4. Make collapsible content always-rendered with the wrap/clip/box structure.
5. Verify in the browser: same card element after a click, focus preserved, no
   animations running on background elements, collapsed content measures 0px, Back and
   deep links still render the right state.
6. After editing CSS, count `{` and `}` outside comments — they must match. A single
   unclosed block silently drops every rule after it.
