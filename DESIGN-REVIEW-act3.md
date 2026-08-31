# Design Review — Act 3: At the Clinic, Then Home

**Date:** 2026-08-31
**Scope:** `js/act3-screen.js`, `css/act3-screen.css`, and Act 3's handoff surface in
`js/app.js` / `js/act2-screen.js`.
**Reviewed against:** `docs/design-language.md` v1.0, the Craft "Act 3 — Story Beats" and
"Act 3 — Dialogue Script" docs, and the repo's UX skill set.
**Reviewed at:** commit `90acd0c`, after the usability-heuristics fixes landed.

---

**Verdict:** Solid — ships as-is. Every finding below is a refinement, not a blocker.

The narrative architecture is doing what the beats doc asked of it: the wait is unresolved,
the numbers are verdicts rather than lectures, and Tay's voice lands against the act's
heaviest stretch. Accessibility is in better shape than the acts that precede it. What is
left is polish, one measurable rule violation, and one structural tension the beats doc
itself creates.

---

## Top issues

### 1. No sense of position in the act — H1, cognitive load

Act 3 runs eight beats and 53 keypresses with no indication of how far through you are.
Every sibling act has one: Act 0 a progress badge, Act 1 the leads pill, Act 2
`REPORTED: n/4`. Act 3's HUD carries a clock and a status pill, neither of which answers
"how much is left."

The beat dots exist, but only *inside* the case-file modal — they measure five steps of one
beat, not the act.

**Why it matters.** This is the fourth act of a ten-minute module and the one that most
resembles a lecture. A learner who cannot see the end is the learner most likely to
disengage during it — which is precisely the failure mode the beats doc names ("waiting
rooms have no momentum").

**Cost of the current design.** It is also the one place the module breaks its own
convention, so the inconsistency reads as an omission rather than a choice.

### 2. The clock advances one minute per spoken line — H8, subtraction test

`nextSubStep()` increments `clockMinutes` on every press, and `prevSubStep()` now decrements
it. The clock pill is one of only two persistent HUD elements, and it changes on every
single interaction while carrying no information: it is a step counter wearing a clock's
clothes.

**Why it matters.** Act 1 and Act 2 earned their clocks — the afternoon advancing *was* the
threat. In Act 3 the emergency is over, so a ticking clock invites the learner to look for
significance that is not there. It fails the subtraction test: remove per-step advancement
and nothing breaks.

### 3. The case file cannot show what it promises — H6, structural

The beats doc: the four checks and the Act 1 counter appear "together on one screen for the
first and only time." By report step 3 the body holds a four-row table, a prevalence chart,
a four-item timeline and two truth stamps in a ~605px card. All four checks fit at step 0;
by step 5 you cannot see the table and the 4× stamp at once.

**Why it matters.** The synthesis *is* the lesson here — one thing at three stages. If the
learner has to scroll to hold it in view, they are reconstructing it from memory, which is
the exact burden the panel was built to remove.

This is a genuine tension in the source material, not a build error: the doc asks for five
distinct reveals and one simultaneous view, and a fixed 16:9 stage cannot give both.

### 4. Spacing does not follow the scale the project wrote down — visual craft R8

`docs/design-language.md` §4.1 is explicit: new work uses a 4px base scale, and the finer
hand-tuned values in Acts 0–2 are grandfathered with the instruction *"Do not copy them into
new work."*

Measured across `css/act3-screen.css`:

> **113 off-scale `rem` values across 31 distinct sizes** — including `0.6rem` ×17,
> `0.7rem` ×11, `0.4rem` ×9, `0.55rem` ×7, `0.28rem` ×3.

**Why it matters.** This is self-inflicted and the only finding here that breaks a written
project rule rather than a general principle. Left alone it makes Act 3 the precedent that
retires §4.1 — the next screen will copy Act 3, and the scale becomes documentation of
something nobody does.

The visible symptom is mild (proximity grouping still reads correctly), so this is a debt
finding, not a defect.

### 5. The one place the learner commits to behaviour is the easiest to skip — persuasive UX

Beat 3E is the module's only forward-looking commitment: *what changes about the next lake
day?* With nothing chosen, the advance button reads **"Skip ahead ▶"** — the interface's own
label recommends skipping the reflection.

Requiring a selection would be worse (the doc is right that there are no wrong answers here,
and gating a reflection turns it into a quiz). But the zero-state label should not do the
persuading in the wrong direction.

---

## Recommended changes

1. **Add an act-level progress signal to the HUD.** A `BEAT n/8` pill, or reuse the beat-dot
   component at act scale in the nav bar. Follows Act 1/2 convention; costs one HUD slot.

2. **Advance the clock at beat boundaries only.** Delete the `clockMinutes += 1` in
   `nextSubStep()` and the matching decrement in `prevSubStep()`; keep the per-beat `jump`
   table. The clock then marks *the afternoon passing*, which is the only thing it should
   mean. Cheapest fix on this list.

3. **Collapse earlier case-file panels as later ones open.** Once the timeline is revealed,
   reduce the table to a four-chip summary row (`💨 1 Early · 👂 2 Building · 👄 3 Advanced ·
   🗣 3 Advanced`) with the full table one click away. The synthesis stays on screen; the
   detail stays reachable. Preserves the doc's intent within the card's real estate.

4. **Retire the off-scale spacing.** Round `css/act3-screen.css` to `0.25 / 0.5 / 0.75 / 1 /
   1.25 / 1.5 / 2 / 2.5 / 3 / 4rem`. Mechanical, low-risk, and worth doing *before* Act 3
   becomes the reference implementation for the next screen. Re-screenshot the case file and
   the prevention grid afterwards — those two are the densest and most likely to shift.

5. **Change the 3E zero-state label** from "Skip ahead ▶" to "Nothing changes ▶". Same
   freedom, honest about what the choice means, and it stops the button arguing for the
   least useful outcome.

---

## Accessibility

Verified in the browser, not inferred:

- **Contrast** — 745 text/background pairs across every beat and step, alpha-composited
  against effective backgrounds. **0 failures.** Tightest is 4.51 (`--color-amber-pale` on
  `--color-amber-deep`), the pairing Appendix A already flags as at-threshold.
- **Keyboard** — the act completes on ArrowRight alone in 53 presses, with ArrowLeft
  back-steps interleaved throughout. No traps. Escape closes the case file.
- **Modals** — `role="dialog"`, `aria-modal`, `aria-labelledby` resolving to a real element,
  focus moved in on open, siblings marked `inert` (0 tabbable controls behind an open dialog).
- **Colour independence** — stage is a numeral *and* a word; chosen is a glyph *and* a word
  *and* `aria-pressed`; prevalence is a bar length *and* a numeral.
- **Reduced motion** — loops set to `none`, entrances shortened to `0.01s` rather than
  removed, so the three keyframes carrying a centring transform do not drop it.

### Remaining risks

- **The 3A wait bar has no accessible equivalent.** It is `aria-hidden="true"`, so a screen
  reader user gets no signal that the wait is finite. "Skip the wait" is reachable, but its
  label does not say the wait also ends on its own. Add that to the `aria-label`, or expose
  the remaining time in the existing `aria-live` region.
- **Not verified:** actual screen-reader output, Windows High Contrast, and zoom to 200%.
  Automated contrast and DOM assertions cannot stand in for these.

*(Fixed during this pass: chosen prevention options emitted `aria-describedby=""` on
unchosen siblings. The attribute is now omitted entirely when there is no target.)*

---

## Visual craft — inherited vs. introduced

Three craft rules read as violated. Two are the design language's own documented patterns
and should stay; one is mine.

| Rule | Where | Call |
|---|---|---|
| R2 — no glow | `.act3-report-card` carries `0 0 40px -12px rgba(56,189,248,.5)`; `act3PulseBtn` animates shadow spread | **Inherited — keep.** §6.4 prescribes "a coloured bloom matching the border"; the pulse is the module's primary-button attention pattern, shared with Acts 0–2. Diverging in Act 3 alone would cost more than it buys. |
| R10 — one elevation language | Cards stack a border *and* `--elev-modal` *and* a bloom | **Inherited — keep.** §6.4 specifies exactly this composite. |
| R8 — space on a scale | 113 off-scale values in a new file | **Introduced — fix.** See finding 4. |

Clean on the rest: no `transition: all`, no placeholder copy, `isolation: isolate` on the
viewport card with a contained 10/12/20/30/40/45/50 z-index scale, every interactive state
designed, motion at 250–400ms on transform and opacity.

---

## Open questions

1. **Are the stage names clinically defensible?** "Stage 1 Early / 2 Building / 3 Advanced"
   and the four-signs-to-three-stages mapping are my construction from Reyes's line, not
   from the Research Notes. A learner whose own vet uses different staging language will
   notice. **Needs Dr. Clark.**
2. **The Texas A&M cool-down attribution is still unsourced** — flagged in the dialogue
   script, shipped as `smePending: true` with an unattributed fallback string beside it.
   `getSmePendingCopy()` reaches it; sourcing it or cutting the attribution is a one-field
   swap. **Needs a decision before recording.**
3. **Does "Dr. Reyes" read as "Dr. Clark"?** The dialogue script raises this. Character and
   SME coexisting in one project is a real collision risk in review.

---

## Next step

**Run a moderated playthrough of Acts 2 → 3 with 5 dog owners, half of them told to pick
"wait" in Act 2.** Everything above is a judgment call I can make from the code; the two
questions I cannot answer without behaviour are:

- Does the 95%/43% "waited" variant land as information or as blame? The doc is emphatic
  that it must never scold, and the copy is careful — but the learner's read of it is the
  only test that counts, and it is the module's most delicate moment.
- Does Beat 3A's twelve-second wait build tension or read as broken? That is a stopwatch
  question, not a design-review question. Watch whether they reach for "Skip the wait", and
  how fast.

Findings 1, 2 and 5 are cheap enough to apply first so the test session sees them. Finding 4
is debt with no user-visible symptom — do it before the next screen is built, not before the
test.

---

## Out of scope, worth tracking

**Act 2's check modal has the same z-index bug Act 3 hit and fixed** — the modal's
`z-index: 50` is local to `.act2-speech-layer`'s `z-index: 30`, so the HUD (40) draws over
it. Cosmetic on desktop (visible-but-inert chrome above the scrim); at phone width the HUD
wraps across the modal title and its close button, which is disabling. Act 3 left untouched.
A task is already queued with the repro and the fix pattern.

Related: neither act's dense surfaces are comfortable on a 4:3 phone card. The design
language forbids body text below `0.8rem` (§3.2), so scrolling is the prescribed answer and
Act 3 implements it — but the module's responsive strategy deserves its own look rather than
a per-act workaround.
