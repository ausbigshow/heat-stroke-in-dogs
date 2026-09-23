/**
 * Act 2 Screen Logic — Callie's POV: Recognition, Triage, Cooling, Transport
 * Callie & Tay — Heat Stroke in Dogs
 *
 * Act 2 is the structural INVERSION of Act 1 (per the Craft "Act 2 — User Flow" doc):
 *
 *   |               | Act 1            | Act 2                       |
 *   | Order         | Any              | Fixed                       |
 *   | Inner access  | Full narration   | One line, then silence      |
 *   | Wrong answers | None exist       | Exist, and cost             |
 *   | Learner       | Inside the dog   | Outside the dog, inferring  |
 *
 * The ONLY exception to the fixed order is the four observation checks in Beat 2A,
 * which may be reported in any order and are gated at all four.
 *
 * Beats:
 *   2-arrival  — Callie crouches. Tay's ONE subtitle ("I'm okay. I'm okay."), then silence.
 *   2A call    — the clinic phone call; a vet tech asks the triage questions.
 *   2A checks  — four observation checks (any order).
 *   2A gate    — all four must be reported before the call moves on.
 *   2A payoff  — "How long has this been going on?" — HINTS DROPPED: 4 cashes out.
 *   2B decision— act now, or give her 5 minutes. NO fail state; waiting visibly costs.
 *   2C cooling — five fixed choices, real wrong answers, consequence + correction.
 *   2D transport— a first-person driver-seat view where the learner switches on the AC and cracks the rear windows.
 *
 * DELIBERATE OMISSION: there is no temperature gauge anywhere in this act. Act 1 had one.
 * "Callie never gets a temperature readout, and neither does the learner." Everything the
 * learner knows about Tay's state in Act 2 they inferred by looking, touching, and counting.
 *
 * DELIBERATE OMISSION: the 95% / 43% survival figures are NOT shown here. They are banked
 * for Dr. Reyes in Act 3, where they recontextualise a decision the learner already made.
 *
 * SME PENDING: every string tied to the ice-chest guidance carries `smePending: true` so
 * Dr. Clark's confirmation can be applied as a targeted string swap. See getSmePendingCopy().
 */

import { renderPreservingFocus, focusInto, containFocusIn, releaseFocusContainment } from './a11y-focus.js';
import { progressStore } from './progress-store.js';
import { confirmLeave, actMarkerHtml } from './shared-ui.js';

export class Act2Screen {
  constructor(app) {
    this.app = app;
    this.container = null;

    // ---- Core beat state -------------------------------------------------
    // 'arrival' | 'call' | 'checks' | 'check_active' | 'gate' | 'payoff'
    // | 'decision' | 'waiting' | 'cooling' | 'transport' | 'handoff'
    this.currentBeat = 'arrival';
    this.stepIndex = 0;
    this._enteredBeat = null;
    this._renderedStep = null;

    // Clock continues straight out of Act 1's shade drift (3:05 PM = 185 minutes past noon).
    this.clockMinutes = 185;

    // The emergency clock. Starts at the decision (Beat 2B) and stays visible from there on,
    // per the Craft doc: "Keep the clock visible from the decision onward."
    this.elapsedSeconds = 0;
    this.elapsedTimer = null;
    this.clockVisible = false;

    // Severity drives the visual escalation and every observed value. It only ever rises.
    // Waiting in Beat 2B pushes it hard — that is the cost, and it is the only cost.
    this.severity = 0.5;

    // ---- Beat 2A: the four observation checks (ANY order, gated at four) ---
    this.checksDone = new Set();
    this.checkReportOrder = [];
    this.activeCheckId = null;
    this.checkStepIndex = 0;
    this.returnFocusCheckId = null; // hotspot to restore focus to when the modal closes

    // Carried over from Act 1's HUD. Cashes out in the payoff beat.
    this.hintsDropped = 4;
    this.hintsCashedOut = false;

    // ---- Beat 2B ---------------------------------------------------------
    this.decisionChoice = null; // 'act_now' | 'wait'

    // ---- Beat 2C ---------------------------------------------------------
    this.coolingIndex = 0;
    this.coolingFeedback = null; // { optionId, correct }
    this.coolingWrongCount = 0;

    // ---- Beat 2D ------------------------------------
    this.acOn = false;
    this.acInteracted = false;
    this.windowsOpen = false;
    this.winInteracted = false;
    this.arriving = false;
    this.arriveTimeout = null;
    this.skipListener = null;
    // Pre-paid off by the phone call in Beat 2A — the learner does not have to do this.
    this.calledAhead = true;

    // =====================================================================
    // CONTENT DATA
    // =====================================================================

    // Beat: arrival. Tay's ONE subtitle in the entire act lives here and nowhere else.
    // DO NOT ADD TAY LINES ANYWHERE ELSE IN THIS FILE. Her silence is the act's engine,
    // and her voice returning in Act 3 is the payoff for it.
    this.arrivalSteps = [
      { speaker: 'callie', text: "Tay. Hey. Hey — look at me." },
      {
        speaker: 'tay_final',
        onomatopoeia: 'Huff…',
        dialogue: "I'm okay. I'm okay.",
        note: "Tay's last line of the act."
      },
      { speaker: 'callie', text: "You're not okay. You're not okay. Where's my phone —" }
    ];

    // Beat 2A: the call itself. The vet tech (Dana) speaks over the phone.
    this.callSteps = [
      { speaker: 'system', text: 'Calling Lakeside Emergency Clinic…' },
      { speaker: 'tech', text: "Lakeside Emergency, this is Dana." },
      { speaker: 'callie', text: "My dog's down. French Bulldog, she's 4, she won't get up. We're out at the lake." },
      { speaker: 'tech', text: "Okay. Is she breathing? Is she standing up? Alright, stay with me. I need you to look at 4 things and tell me what you see. Don't move her yet." },
      { speaker: 'tech', text: "You're my eyes right now. Take them in whatever order you can get to. Start whenever you're ready." }
    ];

    // The four observation checks. Any order; gated at all four.
    // Each carries its Act 1 flashback — the learner is being shown their own playthrough.
    this.checksData = {
      gums: {
        id: 'gums',
        label: 'Lift her lip',
        hudLabel: 'Gums + refill',
        hotspotAria: 'Lift Tay\'s lip and check her gum colour and capillary refill time',
        techPrompt: "Lift her lip for me. 2 things — what colour are the gums, and when you press on them and let go, how many seconds until the colour comes back?",
        // Carries the "under two seconds" threshold in dialogue. It used to be printed in
        // the readout panel beside the art; with those panels gone, this spoken line is
        // the only place the learner meets the normal range, so it has to live here.
        techResponse: "Both of those are outside normal — under 2 seconds is what I want to hear. Colour on its own can fool you; the refill time is the part I actually needed."
      },
      ears: {
        id: 'ears',
        label: 'Hands on her ears',
        hudLabel: 'Ears',
        hotspotAria: 'Put your hands on Tay\'s ears to feel how hot they are',
        techPrompt: "Cup both her ears in your hands. Ears run hot before the rest of her does. Tell me what they feel like.",
        techResponse: "That's not sun on the outside of her. That's heat coming out of her."
      },
      panting: {
        id: 'panting',
        label: 'Watch her panting',
        hudLabel: 'Panting',
        hotspotAria: 'Watch the rhythm and depth of Tay\'s panting',
        techPrompt: "Don't touch her for this one. Just watch her ribs for 15 seconds. Is it deep and even, or fast and shallow — and does she ever stop?",
        techResponse: "Panting is nearly all the cooling a dog has. When it goes fast and shallow it's moving less air, not more. She's working and losing ground."
      },
      name: {
        id: 'name',
        label: 'Say her name',
        hudLabel: 'Name response',
        hotspotAria: 'Say Tay\'s name and count how long she takes to respond',
        techPrompt: "Say her name in your normal voice and count out loud until she reacts. I want the number, even if the number is 'she didn't'.",
        techResponse: "A slow answer to her own name is not her being tired. That's heat reaching the brain, and it shows up before anything else looks wrong."
      }
    };

    // Beat 2A payoff: the four Act 1 leads, restated as a case history with times.
    this.hintsTimeline = [
      { time: '1:30 PM', title: 'The cooler, in open sun', line: 'She parked herself against it for 90 minutes. No shade.' },
      { time: '1:48 PM', title: 'The dock', line: '137°F boards. She patrolled the length of them twice.' },
      { time: '2:03 PM', title: 'The water bowl', line: 'Sun-warm, half empty, untouched. No water since the car.' },
      { time: '2:38 PM', title: 'The shade that moved', line: 'Asleep for 27 minutes while the shade crept off her.' }
    ];

    // Beat 2C: fixed sequence. Real wrong answers, real consequences, never a game-over.
    this.coolingSteps = [
      {
        id: 'first_move',
        stepLabel: 'First move',
        techPrompt: "Before you touch water — what are you doing first?",
        options: [
          {
            id: 'shade_air',
            label: 'Get her out of the sun and get air moving over her',
            correct: true,
            result: "You haul the canopy over her, drag the beach umbrella around to close the gap, and start fanning her with your shirt. It is a stupid-looking way to move air and it is moving air. She is out of the sun in about 8 seconds.",
            stamp: {
              metric: 'Shade first, then airflow',
              line: "Stop the heat going in before you start taking heat out. Moving air over a panting dog cools her, and it costs nothing."
            }
          },
          {
            id: 'straight_water',
            label: 'Pick her up and get her into the lake right now',
            correct: false,
            consequence: "You carry her 20 feet across open sand in full sun to get there. She goes heavy in your arms halfway. The whole trip she is still absorbing heat.",
            correction: "Shade and airflow first. It costs 10 seconds and it stops the heat load while you set everything else up. The water is not going anywhere."
          }
        ]
      },
      {
        id: 'water_source',
        stepLabel: 'Water source',
        smePending: true,
        techPrompt: "Now water. What have you got, and what are you using?",
        commonBelief: "She's overheating, so pack her in ice. Coldest thing you've got, straight onto the dog — that's how you bring a temperature down fast.",
        options: [
          {
            id: 'lake_water',
            label: 'Cool lake water, 20 feet away',
            correct: true,
            result: "You take the towel and the bowl to the water and back at a dead run. It is 72°F — cool, not cold. It is the one thing at this lake Tay looked at 4 times and walked away from.",
            stamp: {
              metric: '72°F lake water',
              line: "Cool water, not ice water. This is the hotspot she dismissed all afternoon, and it is the thing that helps her now."
            }
          },
          {
            id: 'ice_chest',
            label: 'Ice out of the cooler — pack it against her',
            correct: false,
            smePending: true,
            consequence: "You have the lid up before you finish the thought — the same cooler she spent 90 minutes pressed against. Ice against her skin makes the surface vessels clamp down, and heat that needs to leave her core stays in it. She feels cold to your hand and is no cooler inside.",
            correction: "Cool water, not ice, and not ice packs. Extreme cold constricts the vessels near the skin and traps the heat where you least want it. The lake is right there."
          }
        ]
      },
      {
        id: 'where',
        stepLabel: 'Where the water goes',
        techPrompt: "Where are you putting it?",
        options: [
          {
            id: 'belly_groin',
            label: 'Belly, armpits, groin, paws',
            correct: true,
            result: "You turn her enough to get the wet towel against her belly and press cool water into her armpits and groin, then her paws. Every time it goes slack and warm you run it back to the lake.",
            stamp: {
              metric: 'Belly, armpits, groin, paws',
              line: "These are the places blood runs closest to the surface, so this is where cool water actually takes heat out of her instead of just off her."
            }
          },
          {
            id: 'face_head',
            label: 'Over her face and head — cool her down from the top',
            correct: false,
            consequence: "She is a flat-faced dog already fighting for air, and you have just poured water across her nose and mouth. She chokes, jerks her head sideways, and loses several seconds of panting she could not spare.",
            correction: "Never over the face and head. She is struggling to breathe as it is, and the head is not where the heat comes out. Belly, armpits, groin, paws."
          }
        ]
      },
      {
        id: 'drinking',
        stepLabel: 'Drinking',
        techPrompt: "Is she alert enough to swallow? If she is, you can offer water — but I need you to hear how.",
        options: [
          {
            id: 'small_sips',
            label: 'Offer small sips from the bowl and let her choose',
            correct: true,
            result: "You hold the bowl under her chin. She takes 3 shallow laps, stops, and puts her head back down. You let her.",
            stamp: {
              metric: 'Small sips, only if she can swallow',
              line: "Offered, never administered. A dog who can lap on her own is a dog whose airway is working — that is the whole test."
            }
          },
          {
            id: 'force_water',
            label: 'Tip the bowl into her mouth — she needs the fluid',
            correct: false,
            consequence: "Her swallow is slow and the water is faster. She coughs hard and some of it goes the wrong way. Aspirating water into the lungs is its own emergency, on top of the one she already has.",
            correction: "Never force water or pour it down the throat. Offer it. If she will not or cannot lap it up on her own, that is information — tell the clinic and move."
          }
        ]
      },
      {
        id: 'covering',
        stepLabel: 'Getting her in the car',
        smePending: true,
        techPrompt: "Get her in the car. Where is that towel when you do?",
        commonBelief: "Wrap her up good and tight and keep the cold on her the whole way in. Tuck it right around her so none of it gets out.",
        options: [
          {
            id: 'towel_under',
            label: 'Lay the cool wet towel flat on the seat and lay her down on it',
            correct: true,
            result: "You spread the soaked towel across the back seat, flat, and lower her onto it so it meets her belly and her flank. Nothing is on top of her. The air in the car can still reach every part of her.",
            stamp: {
              metric: 'Cool towel under her, nothing on top',
              line: "She lies on it, she is not wrapped in it. Heat leaves a dog through moving air, and anything laid over her is one more layer the air has to get through."
            }
          },
          {
            id: 'wrap_and_leave',
            label: 'Wrap her up tight in it for the drive',
            correct: false,
            consequence: "12 minutes in, that towel is at her body temperature and wrapped around her. It has stopped taking heat away and started holding it in — you have insulated her, in a hot car, on the way to an emergency.",
            correction: "Never wrap her. Lay the towel flat and put her on it, then get air moving over her. A towel around a dog stops cooling and starts trapping."
          }
        ]
      }
    ];

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.tickElapsed = this.tickElapsed.bind(this);
  }

  // =======================================================================
  // LIFECYCLE
  // =======================================================================

  mount(options = {}) {
    this.container = document.getElementById('screen-act2');
    if (!this.container) return;

    if (options.beat) {
      this.currentBeat = options.beat;
    }
    if (options.stepIndex !== undefined) {
      this.stepIndex = options.stepIndex;
    }

    this._enteredBeat = null;
    this._renderedStep = null;

    if (options.activeCheckId) {
      this.openCheck(options.activeCheckId, options.checkStepIndex ?? 0);
    } else {
      this.render();
    }
    window.addEventListener('keydown', this.handleKeyDown);
  }

  unmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.stopElapsedClock();
    if (this.arriveTimeout) {
      clearTimeout(this.arriveTimeout);
      this.arriveTimeout = null;
    }
    if (this.skipListener) {
      this.container?.removeEventListener('click', this.skipListener);
      this.skipListener = null;
    }
    this.arriving = false;
  }

  isEditModeActive() {
    return document.body.classList.contains('edit-mode-active');
  }

  /**
   * The playthrough, in the shape applyHandoff() accepts.
   *
   * Act 3's whole claim is that every number Dr. Reyes says lands on a decision the learner
   * already made, so this state has to survive leaving the screen. It travels forward on the
   * Act 3 button and back again on Act 3's "Act 2" — without the return trip, stepping back
   * and forward rebuilt this screen from defaults and silently downgraded the learner's
   * playthrough to "we were never told".
   */
  getHandoff() {
    return {
      decisionChoice: this.decisionChoice,
      checkReportOrder: [...this.checkReportOrder],
      hintsDropped: this.hintsDropped,
      hintsCashedOut: this.hintsCashedOut,
      coolingWrongCount: this.coolingWrongCount,
      severity: this.severity,
      clockMinutes: this.clockMinutes,
      elapsedSeconds: this.elapsedSeconds,
      clockVisible: this.clockVisible,
      acOn: this.acOn,
      acInteracted: this.acInteracted,
      windowsOpen: this.windowsOpen,
      winInteracted: this.winInteracted
    };
  }

  hasProgress() {
    return !(this.currentBeat === 'arrival' && this.stepIndex === 0);
  }

  getResumeState() {
    return {
      currentBeat: this.currentBeat,
      stepIndex: this.stepIndex,
      activeCheckId: this.activeCheckId,
      checkStepIndex: this.checkStepIndex,
      checkReportOrder: [...this.checkReportOrder],
      decisionChoice: this.decisionChoice,
      coolingIndex: this.coolingIndex,
      coolingFeedback: this.coolingFeedback ? { ...this.coolingFeedback } : null,
      coolingWrongCount: this.coolingWrongCount,
      acOn: this.acOn,
      acInteracted: this.acInteracted,
      windowsOpen: this.windowsOpen,
      winInteracted: this.winInteracted,
      calledAhead: this.calledAhead,
      clockMinutes: this.clockMinutes,
      elapsedSeconds: this.elapsedSeconds,
      clockVisible: this.clockVisible,
      severity: this.severity,
      hintsDropped: this.hintsDropped,
      hintsCashedOut: this.hintsCashedOut
    };
  }

  applyResumeState(state) {
    if (!state) return;
    this.currentBeat = state.currentBeat ?? 'arrival';
    this.stepIndex = state.stepIndex ?? 0;
    this.activeCheckId = state.activeCheckId ?? null;
    this.checkStepIndex = state.checkStepIndex ?? 0;
    this.checkReportOrder = state.checkReportOrder ? [...state.checkReportOrder] : [];
    this.checksDone = new Set(this.checkReportOrder);
    this.decisionChoice = state.decisionChoice ?? null;
    this.coolingIndex = state.coolingIndex ?? 0;
    this.coolingFeedback = state.coolingFeedback ? { ...state.coolingFeedback } : null;
    this.coolingWrongCount = state.coolingWrongCount ?? 0;
    this.acOn = state.acOn ?? false;
    this.acInteracted = state.acInteracted ?? false;
    this.windowsOpen = state.windowsOpen ?? false;
    this.winInteracted = state.winInteracted ?? false;
    this.calledAhead = state.calledAhead ?? true;
    this.clockMinutes = state.clockMinutes ?? 185;
    this.elapsedSeconds = state.elapsedSeconds ?? 0;
    this.clockVisible = state.clockVisible ?? false;
    this.severity = state.severity ?? 0.5;
    this.hintsDropped = state.hintsDropped ?? 4;
    this.hintsCashedOut = state.hintsCashedOut ?? false;
  }

  saveProgress() {
    try {
      progressStore.save('act2', this.getResumeState());
    } catch (e) {}
  }

  /** Restore a playthrough produced by getHandoff(). Partial payloads are fine. */
  applyHandoff(handoff = {}) {
    if (handoff.decisionChoice === 'act_now' || handoff.decisionChoice === 'wait') {
      this.decisionChoice = handoff.decisionChoice;
    }
    if (Array.isArray(handoff.checkReportOrder)) {
      this.checkReportOrder = [...handoff.checkReportOrder];
      this.checksDone = new Set(this.checkReportOrder);
    }
    if (Number.isFinite(handoff.hintsDropped)) this.hintsDropped = handoff.hintsDropped;
    if (Number.isFinite(handoff.coolingWrongCount)) this.coolingWrongCount = handoff.coolingWrongCount;
    if (Number.isFinite(handoff.severity)) this.severity = handoff.severity;
    if (Number.isFinite(handoff.clockMinutes)) this.clockMinutes = handoff.clockMinutes;
    if (Number.isFinite(handoff.elapsedSeconds)) this.elapsedSeconds = handoff.elapsedSeconds;
    if (typeof handoff.hintsCashedOut === 'boolean') this.hintsCashedOut = handoff.hintsCashedOut;
    if (typeof handoff.acOn === 'boolean') this.acOn = handoff.acOn;
    if (typeof handoff.acInteracted === 'boolean') this.acInteracted = handoff.acInteracted;
    if (typeof handoff.windowsOpen === 'boolean') this.windowsOpen = handoff.windowsOpen;
    if (typeof handoff.winInteracted === 'boolean') this.winInteracted = handoff.winInteracted;
    // The emergency clock is running by the time any of this is restorable, so restart it
    // rather than leaving a visible timer frozen.
    if (handoff.clockVisible) this.startElapsedClock();
  }

  prefersReducedMotion() {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // =======================================================================
  // CLOCKS & ESCALATION
  // =======================================================================

  getFormattedTime() {
    const startHour = 1;
    const hour = startHour + Math.floor(this.clockMinutes / 60) - 1;
    const min = this.clockMinutes % 60;
    return `${hour}:${min < 10 ? '0' : ''}${min} PM`;
  }

  getFormattedElapsed() {
    const m = Math.floor(this.elapsedSeconds / 60);
    const s = this.elapsedSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // The emergency clock. Once started it never stops until the act hands off.
  startElapsedClock() {
    this.clockVisible = true;
    if (this.elapsedTimer) return;
    this.elapsedTimer = window.setInterval(this.tickElapsed, 1000);
  }

  stopElapsedClock() {
    if (this.elapsedTimer) {
      window.clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
  }

  // Ticks update ONLY the readout's text node. A full re-render on a 1s interval would
  // fight the Edit Mode's selection and drag state, so it is deliberately avoided.
  tickElapsed() {
    if (this.isEditModeActive()) return;
    this.elapsedSeconds += 1;
    const el = this.container?.querySelector('#act2-elapsed-text');
    if (el) el.textContent = this.getFormattedElapsed();
  }

  // Visual Escalation System, carried on from Act 1: as she declines the palette drains
  // and the heat wash builds. Exposed as CSS custom properties, same pattern as Act 1's
  // --act1-saturation-drop / --act1-drift-opacity.
  getEscalation() {
    const s = Math.max(0, Math.min(1, this.severity));
    return {
      saturationDrop: Math.round(30 + s * 26),
      heatOpacity: (0.35 + s * 0.5).toFixed(2),
      severity: s.toFixed(3)
    };
  }

  // Everything the learner can observe, derived from severity so that WAITING in Beat 2B
  // visibly worsens every single reading. No temperature anywhere — by design.
  getVitals() {
    const s = Math.max(0, Math.min(1, this.severity));

    const refillSeconds = (2.3 + s * 1.9).toFixed(1);
    const responseSeconds = Math.round(3 + s * 5);

    return {
      refillSeconds,
      refillNormal: '< 2.0 s',
      // Computed above but never exported until now. renderNameArt() used to recompute it
      // locally, so nothing caught the omission; the moment Callie started speaking the
      // number it surfaced as "I counted undefined seconds". Single source for both.
      responseSeconds,
      // Colour is ALWAYS reported alongside the refill time and a written label —
      // never colour alone. See the colourblind-safety note in renderGumArt().
      gumLabel: s < 0.72 ? 'Brick red, tacky to the touch' : 'Dull red, greying at the edges',
      gumSwatch: s < 0.72 ? '#B4443C' : '#9C6A66',
      gumPattern: s < 0.72 ? 'hatch' : 'dots',
      gumSeverityWord: s < 0.72 ? 'Abnormal' : 'Worse than abnormal',
      earLabel: s < 0.72 ? 'Hot right through, no cool spot anywhere' : 'Hot, and the skin inside feels dry',
      pantRate: Math.round(118 + s * 74),
      pantLabel: s < 0.72 ? 'Fast and shallow. It never pauses.' : 'Faster, shallower, and noisy at the back of the throat.',
      responseLabel: s < 0.72
        ? 'Her eye moves. Her head does not.'
        : 'Nothing moves. Not the eye, not the ear, not the tail.',
      responseWord: s < 0.72 ? 'Delayed' : 'Absent'
    };
  }

  // Convenience accessor for the string-swap when Dr. Clark confirms the ice guidance.
  // Every ice-chest-dependent string in this act is reachable from here.
  getSmePendingCopy() {
    const pending = [];
    this.coolingSteps.forEach(step => {
      if (step.smePending) pending.push({ path: `coolingSteps.${step.id}`, step });
      step.options.forEach(opt => {
        if (opt.smePending) pending.push({ path: `coolingSteps.${step.id}.${opt.id}`, option: opt });
      });
    });
    return pending;
  }

  // =======================================================================
  // RENDER — SHELL
  // =======================================================================

  /**
   * Re-render the beat, keeping the keyboard learner on the control they were using
   * (see js/a11y-focus.js). The check modal already moves focus in on open via
   * focusInModal(); this covers every other beat advance, which previously dropped
   * focus to <body>. Containment is applied after render, once the dialog exists.
   */
  render() {
    releaseFocusContainment(this.container || document);
    renderPreservingFocus(
      this.container,
      () => this.renderNow(),
      ['#act2-btn-check-nav', '#act2-btn-next-step', '#act2-btn-report-all']
    );
    const dialog = this.container?.querySelector('[role="dialog"]');
    if (dialog) containFocusIn(dialog);
    const conv = this.container?.querySelector('.act2-check-conversation');
    if (conv) {
      requestAnimationFrame(() => {
        conv.scrollTop = conv.scrollHeight;
      });
    }

    if (this.hasProgress()) {
      this.saveProgress();
    }
  }

  getEntranceKey(beat) {
    if (beat === 'check_active') return 'checks';
    return beat;
  }

  renderNow() {
    if (!this.container) return;

    const { saturationDrop, heatOpacity, severity } = this.getEscalation();
    const isTransport = this.currentBeat === 'transport' || this.currentBeat === 'handoff';
    const isCloseCanopy = this.currentBeat === 'arrival' || this.currentBeat === 'call';
    const isFpvInspect = !isTransport && !isCloseCanopy;

    const beatKey = this.getEntranceKey(this.currentBeat);
    const entering = this._enteredBeat !== beatKey;
    this._enteredBeat = beatKey;

    this.container.innerHTML = `
      <div class="act2-container" data-editor-id="act2-screen-container">

        <!-- Main 16:9 Viewport Stage: close canopy framing, FPV downward inspection, or car interior -->
        <div
          id="act2-card"
          class="act2-viewport-card ${isTransport ? 'in-car' : ''} ${isCloseCanopy ? 'view-close-canopy' : ''} ${isFpvInspect ? 'view-fpv-inspect' : ''} ${entering ? 'is-entering' : ''}"
          data-beat="${this.currentBeat}"
          data-editor-id="act2-viewport-card"
          style="--act2-saturation-drop: ${saturationDrop}%; --act2-heat-opacity: ${heatOpacity}; --act2-severity: ${severity};"
        >
          ${isTransport ? `<img src="Assets/Image/Car-FPV-Interior.jpg" alt="" class="act2-scene-img" data-editor-id="act2-art-car-interior" />` : (
            isCloseCanopy ? `
              <img
                src="Assets/Image/Lake-CanopyClose-BG.jpg"
                alt="Lakeside park under the shade canopy, close perspective"
                class="act2-scene-img act2-close-canopy-bg"
                data-editor-id="act2-lake-close-img"
              />
            ` : `
              <img
                src="Assets/Image/Lake-GrassClean-BG.jpg"
                alt="Shaded grass ground beneath the canopy, downward first person perspective"
                class="act2-scene-img act2-fpv-ground-bg"
                data-editor-id="act2-lake-fpv-img"
              />
            `
          )}

          <!-- Heat / palette-drain wash -->
          <div class="act2-heat-wash" data-editor-id="act2-heat-wash" aria-hidden="true"></div>

          <!-- Persistent Top HUD Bar -->
          ${this.renderHudBar()}

          <!-- In-scene layer: Tay on the ground, Callie, the cooler, the observation hotspots -->
          ${this.renderSceneLayer()}

          <!-- Dialogue / modal layer -->
          <div class="act2-speech-layer ${this.beatHasModal() ? 'has-modal' : ''}" data-editor-id="act2-speech-layer">
            ${this.renderActiveBeatContent()}
          </div>

          <!-- Bottom Navigation HUD -->
          <nav class="act2-nav-bar" data-editor-id="act2-nav-bar">
            <div class="act2-hud-group">${this.renderBottomLeftControls()}</div>
            <div class="act2-hud-group">${this.renderBottomRightControls()}</div>
          </nav>

          <!-- Screen-reader running commentary of Tay's observable state -->
          <p class="sr-only" role="status" aria-live="polite" data-editor-id="act2-sr-status">
            ${this.renderSrStatusText()}
          </p>

        </div>
      </div>
    `;

    this.bindEvents();
    
    this._renderedStep = this.currentBeat === 'check_active' 
      ? `${this.currentBeat}-${this.activeCheckId}-${this.checkStepIndex}`
      : (this.currentBeat === 'cooling' ? `${this.currentBeat}-${this.coolingIndex}` : `${this.currentBeat}-${this.stepIndex}`);
  }

  /**
   * Whether this beat renders a modal dialog. When active, the speech layer is lifted
   * above the HUD bars (z-index 45 vs 40) so the modal scrim cleanly overlays the chrome.
   */
  beatHasModal() {
    return this.currentBeat === 'check_active';
  }

  renderSrStatusText() {
    const v = this.getVitals();
    const reported = this.checksDone.size;
    if (this.currentBeat === 'arrival' || this.currentBeat === 'call') {
      return 'Tay is lying on the grass and is not getting up. She is panting hard and is not responding normally.';
    }
    if (this.currentBeat === 'checks' || this.currentBeat === 'check_active' || this.currentBeat === 'gate') {
      return `${reported} of 4 observations reported to the clinic. Gums ${v.gumLabel}, capillary refill ${v.refillSeconds} seconds against a normal of under 2 seconds.`;
    }
    return `Tay's capillary refill is ${v.refillSeconds} seconds, her response to her name is ${v.responseWord.toLowerCase()}, and her panting is ${v.pantLabel.toLowerCase()}`;
  }

  renderHudBar() {
    const timeStr = this.getFormattedTime();
    const reported = this.checksDone.size;
    const allReported = reported === 4;

    return `
      <header class="act2-hud-bar" data-editor-id="act2-hud-bar">
        <div class="act2-hud-group">
          <button id="act2-btn-back-act1" class="act2-hud-btn" data-editor-id="act2-btn-back-act1"
                  title="Return to Act 1" aria-label="Return to Act 1">◀ Act 1</button>
          <button id="act2-btn-title" class="act2-hud-btn" data-editor-id="act2-btn-title"
                  title="Return to Title" aria-label="Return to the title screen">Title</button>
        </div>

        <div class="act2-hud-group">
          ${actMarkerHtml(2)}
          <div class="act2-hud-pill clock-pill" data-editor-id="act2-hud-clock" title="Lake time">
            <span>${timeStr}</span>
          </div>

          ${this.clockVisible ? `
            <div class="act2-hud-pill elapsed-pill" data-editor-id="act2-hud-elapsed"
                 role="timer" aria-label="Time since you decided to act">
              <span>SINCE YOU DECIDED</span>
              <span id="act2-elapsed-text" class="elapsed-value">${this.getFormattedElapsed()}</span>
            </div>
          ` : ''}

          ${this.hintsCashedOut ? `
            <div class="act2-hud-pill hints-cashed-pill" data-editor-id="act2-hud-hints"
                 aria-label="4 warning signs from Act 1, all reported to the clinic">
              <span>WARNING SIGNS: ${this.hintsDropped} — REPORTED</span>
            </div>
          ` : `
            <div class="act2-hud-pill hints-pill" data-editor-id="act2-hud-hints"
                 aria-label="4 warning signs from Act 1, not yet reported">
              <span>WARNING SIGNS: ${this.hintsDropped}</span>
            </div>
          `}

          ${['call', 'checks', 'check_active', 'gate', 'payoff'].includes(this.currentBeat) ? `
            <div class="act2-hud-pill checks-pill ${allReported ? 'all-done' : ''}"
                 data-editor-id="act2-hud-checks"
                 aria-label="${reported} of 4 observations reported">
              <span>REPORTED: ${reported}/4</span>
            </div>
          ` : ''}
        </div>
      </header>
    `;
  }

  // =======================================================================
  // RENDER — PLACEHOLDER ART
  // Every placeholder lives in its own render helper with its own data-editor-id so the
  // final illustrations can be dropped in one at a time without touching beat logic.
  // Flat vector, no outlines, warm limited palette, per the Visual Asset Brief.
  // =======================================================================

  // Tay, down on the grass in lateral recumbency.
  // In close canopy beats (arrival, call): uses the lateral side view with animated abdomen.
  // In inspection beats (checks, gate, payoff, cooling): uses the FPV downward angle looking down at the dog.
  renderTayDown() {
    const still = this.prefersReducedMotion() ? 'is-still' : '';
    const isFpv = !['arrival', 'call', 'transport', 'handoff'].includes(this.currentBeat);

    if (isFpv) {
      return `
        <svg class="act2-tay-svg act2-tay-fpv-svg ${still}" viewBox="0 0 1376 768" data-editor-id="act2-art-tay"
             role="img" aria-label="First person view looking down at Tay lying flat on her side on the grass, panting heavily with labored breathing">
          <defs>
            <clipPath id="act2-fpv-tay-abdomen-clip">
              <path d="M640,225 C700,215 800,215 850,235 C855,330 850,480 850,555 C800,565 720,575 640,575 C635,500 635,330 640,225 Z" />
            </clipPath>
          </defs>
          <!-- Base full dog image from top-down FPV angle -->
          <image href="Assets/Image/Tay-FPV-LateralLookingDown.png" xlink:href="Assets/Image/Tay-FPV-LateralLookingDown.png" x="0" y="0" width="1376" height="768" />
          <!-- Swelling abdomen layer for labored panting respiration strictly isolated to flank -->
          <g class="act2-tay-labored-abdomen fpv-labored-abdomen">
            <image href="Assets/Image/Tay-FPV-LateralLookingDown.png" xlink:href="Assets/Image/Tay-FPV-LateralLookingDown.png" x="0" y="0" width="1376" height="768" clip-path="url(#act2-fpv-tay-abdomen-clip)" />
          </g>
        </svg>
      `;
    }

    return `
      <svg class="act2-tay-svg act2-tay-close-svg ${still}" viewBox="0 0 1376 768" data-editor-id="act2-art-tay"
           role="img" aria-label="Tay lying flat on her side on the grass, panting heavily with labored breathing">
        <defs>
          <radialGradient id="act2-tay-lateral-ground-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(24, 36, 24, 0.45)" />
            <stop offset="70%" stop-color="rgba(24, 36, 24, 0.2)" />
            <stop offset="100%" stop-color="rgba(24, 36, 24, 0)" />
          </radialGradient>
          <clipPath id="act2-tay-abdomen-clip">
            <path d="M936,245 C856,215 696,215 616,220 C606,300 616,420 626,560 C696,565 856,565 926,545 C936,460 941,330 936,245 Z" />
          </clipPath>
        </defs>
        <ellipse cx="686" cy="585" rx="540" ry="42" fill="url(#act2-tay-lateral-ground-shadow)" />
        <image href="Assets/Image/Tay-LayingLateralPanting.png" xlink:href="Assets/Image/Tay-LayingLateralPanting.png" x="0" y="0" width="1376" height="768" />
        <g class="act2-tay-labored-abdomen tay-labored-abdomen">
          <image href="Assets/Image/Tay-LayingLateralPanting.png" xlink:href="Assets/Image/Tay-LayingLateralPanting.png" x="0" y="0" width="1376" height="768" clip-path="url(#act2-tay-abdomen-clip)" />
        </g>
      </svg>
    `;
  }

  // Callie, crouched beside Tay.
  // In Beat arrival: caring posture with hands reaching toward Tay.
  // In Beat call: phone to ear, talking urgently to Dana at the clinic.
  renderCallieCrouched() {
    const isOnPhone = this.currentBeat === 'call';
    const imgSrc = isOnPhone
      ? 'Assets/Image/Callie-CrouchedPhone.png'
      : 'Assets/Image/Callie-CrouchedCaring.png';
    const ariaLabel = isOnPhone
      ? 'Callie crouched beside Tay with a phone to her ear, talking urgently'
      : 'Callie crouched beside Tay with hands reaching forward in deep concern';

    return `
      <img
        src="${imgSrc}"
        alt="${ariaLabel}"
        class="act2-callie-img ${isOnPhone ? 'callie-on-phone' : 'callie-caring'}"
        data-editor-id="act2-art-callie"
        draggable="false"
      />
    `;
  }

  // Callie's cooler ("The Vault"). Matches Act 1 asset exactly for spatial continuity.
  renderIceChest() {
    return `
      <svg class="act2-cooler-svg" viewBox="0 0 130 90" data-editor-id="act2-art-ice-chest" aria-hidden="true">
        <ellipse cx="65" cy="80" rx="55" ry="9" fill="rgba(36, 52, 36, 0.45)" />
        <rect x="15" y="24" width="100" height="50" rx="8" fill="#0284C7" />
        <rect x="25" y="40" width="80" height="28" rx="4" fill="#0369A1" />
        <circle cx="28" cy="74" r="10" fill="#1E293B" />
        <circle cx="28" cy="74" r="4" fill="#64748B" />
        <circle cx="102" cy="74" r="10" fill="#1E293B" />
        <circle cx="102" cy="74" r="4" fill="#64748B" />
        <rect x="10" y="12" width="110" height="16" rx="5" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
        <rect x="58" y="22" width="14" height="12" rx="2" fill="#DC2626" />
        <rect x="6" y="32" width="8" height="14" rx="3" fill="#64748B" />
        <rect x="116" y="32" width="8" height="14" rx="3" fill="#64748B" />
      </svg>
    `;
  }

  // Persistent background objects maintaining continuity from Act 1:
  renderDock() {
    return `
      <svg viewBox="0 0 200 150">
        <rect x="80" y="44" width="7" height="30" rx="2" fill="#452A1D" />
        <rect x="114" y="44" width="7" height="30" rx="2" fill="#452A1D" />
        <ellipse cx="83" cy="74" rx="9" ry="3" fill="rgba(24, 62, 74, 0.5)" />
        <ellipse cx="118" cy="74" rx="9" ry="3" fill="rgba(24, 62, 74, 0.5)" />
        <rect x="52" y="96" width="9" height="42" rx="2" fill="#3A2317" />
        <rect x="140" y="96" width="9" height="42" rx="2" fill="#3A2317" />
        <polygon points="78,40 122,40 160,140 40,140" fill="#5E3D2A" />
        <polygon points="79,44 121,44 123,58 77,58" fill="#D97706" />
        <polygon points="77,60 123,60 126,76 74,76" fill="#B45309" />
        <polygon points="74,78 126,78 130,95 70,95" fill="#D97706" />
        <polygon points="71,97 129,97 134,115 66,115" fill="#B45309" />
        <polygon points="67,117 133,117 138,137 62,137" fill="#D97706" />
        <polygon points="40,140 160,140 156,145 44,145" fill="#3A2317" />
      </svg>
    `;
  }

  renderWaterBowl() {
    return `
      <svg viewBox="0 0 100 80">
        <ellipse cx="50" cy="62" rx="42" ry="12" fill="rgba(36, 52, 36, 0.45)" />
        <ellipse cx="50" cy="46" rx="40" ry="18" fill="#94A3B8" />
        <ellipse cx="50" cy="46" rx="36" ry="15" fill="#CBD5E1" />
        <ellipse cx="50" cy="48" rx="28" ry="10" fill="#38BDF8" opacity="0.8" />
        <ellipse cx="46" cy="47" rx="16" ry="4" fill="#E0F2FE" opacity="0.6" />
      </svg>
    `;
  }

  renderCanopy() {
    return `
      <svg class="canopy-shade-svg" viewBox="0 0 350 260" aria-hidden="true">
        <polygon points="10,240 330,240 345,190 25,190" fill="rgba(36, 52, 36, 0.38)" />
      </svg>
      <svg class="canopy-frame-svg" viewBox="0 0 350 260" aria-hidden="true">
        <rect x="35" y="60" width="8" height="145" fill="#5E3D2A" rx="2" />
        <rect x="305" y="60" width="8" height="145" fill="#5E3D2A" rx="2" />
        <rect x="15" y="70" width="10" height="165" fill="#784E34" rx="2" />
        <rect x="325" y="70" width="10" height="165" fill="#784E34" rx="2" />
        <polygon points="170,5 5,75 170,75" fill="#E2D4C3" />
        <polygon points="170,5 170,75 335,75" fill="#CFC2AC" />
        <polygon points="170,5 150,75 190,75" fill="#DDD0BC" />
        <polygon points="5,75 335,75 335,90 5,90" fill="#C8BAA4" />
        <polygon points="5,90 335,90 330,95 10,95" fill="#B3A58F" />
      </svg>
    `;
  }

  // PLACEHOLDER ART — phone call UI. Used as the frame for the whole 2A triage sequence.
  renderPhoneUi(bodyHtml, { status = 'On call' } = {}) {
    return `
      <div class="act2-phone" data-editor-id="act2-art-phone">
        <div class="act2-phone-bezel" data-editor-id="act2-art-phone-bezel">
          <div class="act2-phone-header" data-editor-id="act2-phone-header">
            
            <span class="act2-phone-meta">
              <span class="act2-phone-name">Lakeside Veterinary Clinic</span>
              <span class="act2-phone-status">
                <span class="act2-phone-dot" aria-hidden="true"></span>${status}
              </span>
            </span>
          </div>
          <div class="act2-phone-body" data-editor-id="act2-phone-body">
            ${bodyHtml}
          </div>
        </div>
      </div>
    `;
  }

  // PLACEHOLDER ART — lifted lip / gum closeup.
  //
  getGumKeyframeOffsets(refillSeconds) {
    const refill = parseFloat(refillSeconds);
    const total = 0.6 + 0.5 + refill + 1.0;
    const pct = (s) => (s / total * 100).toFixed(2) + '%';
    
    const styleBlock = `
      <style>
        @keyframes act2GumHandAnim {
          0% { transform: translate(var(--hand-offset-x, 8%), var(--hand-offset-y, 16%)); animation-timing-function: ease-out; }
          ${pct(0.6)} { transform: translate(0, 0); }
          ${pct(1.1)} { transform: translate(0, 0); animation-timing-function: ease-in; }
          ${pct(1.3)} { transform: translate(var(--hand-offset-x, 8%), var(--hand-offset-y, 16%)); }
          100% { transform: translate(var(--hand-offset-x, 8%), var(--hand-offset-y, 16%)); }
        }
        @keyframes act2GumBlanchAnim {
          0%, ${pct(0.6)} { background-color: var(--gum-color); animation-timing-function: ease; }
          ${pct(1.1)} { background-color: var(--gum-blanched); animation-timing-function: linear; }
          ${pct(1.1 + refill)} { background-color: var(--gum-color); }
          100% { background-color: var(--gum-color); }
        }
      </style>
    `;
    return { styleBlock, cssVars: `--cycle-total: ${total}s;` };
  }

  // COLOURBLIND SAFETY (Craft doc, and the single most important observation in the act):
  // gum state is NEVER carried by colour alone. Every gum render pairs the swatch with
  //   (a) a written colour label,
  //   (c) the capillary refill TIME in seconds against the printed normal range.
  renderGumArt(v, convHtml) {
    const animConfig = this.getGumKeyframeOffsets(v.refillSeconds);
    return `
      ${animConfig.styleBlock}
      <div class="act2-check-art" data-editor-id="act2-art-gums">
        <div class="act2-check-art-media" style="--gum-color: ${v.gumSwatch}; ${animConfig.cssVars}">
          <img
            src="Assets/Image/Check-Gums-Art.jpg"
            alt="Close-up of Tay's snout and upper gum at the lake park, showing canine tooth and capillary refill blanch spot"
            class="act2-check-char-img"
          />
          <div class="act2-gum-blanch" aria-hidden="true"></div>
          <img
            src="Assets/Image/Check-Gums-Hand-Press.png"
            alt=""
            aria-hidden="true"
            class="act2-check-char-img act2-gum-hand"
          />
        </div>

        <div class="act2-check-right-col">
          <div class="act2-check-conversation">
            ${convHtml}
          </div>
        </div>
      </div>
    `;
  }

  // CHARACTER ART — ear closeup with Callie cupping Tay's bat ears (Note 4).
  renderEarArt(v, convHtml) {
    return `
      <div class="act2-check-art" data-editor-id="act2-art-ears">
        <div class="act2-check-art-media">
          <img
            src="Assets/Image/Check-Ears-Art.jpg"
            alt="Callie crouched outdoors on the grass by the lake, with a concerned, worried expression gently feeling Tay's bat ears"
            class="act2-check-char-img"
          />
          <div class="act2-ear-heat-overlay" aria-hidden="true">
            <svg viewBox="0 0 320 200" class="act2-ear-heat-waves" style="position: absolute; inset: 0; width: 100%; height: 100%;">
              <path d="M120,70 C126,52 114,42 122,26" stroke="#C2410C" stroke-width="2.5" fill="none" stroke-linecap="round" />
              <path d="M152,74 C158,56 146,46 154,30" stroke="#EA580C" stroke-width="2" fill="none" stroke-linecap="round" />
            </svg>
          </div>
        </div>
        <div class="act2-check-right-col">
          <div class="act2-check-conversation">
            ${convHtml}
          </div>
        </div>
      </div>
    `;
  }

  // CHARACTER ART — panting rhythm with actual character art of Tay (Note 10).
  renderPantingArt(v, convHtml) {
    return `
      <div class="act2-check-art" data-editor-id="act2-art-panting">
        <div class="act2-panting-img-wrap">
          <img
            src="Assets/Image/Check-Panting-Art.jpg"
            alt="Tay panting heavily with mouth open and tongue extended from heat exhaustion"
            class="act2-check-char-img"
          />
        </div>
        <div class="act2-check-right-col">
          <div class="act2-check-conversation">
            ${convHtml}
          </div>
        </div>
      </div>
    `;
  }

  // CHARACTER ART — Callie calls Tay's name, measuring responsiveness (Note 3).
  renderNameArt(v, convHtml) {
    // The tick counter that used to live here is gone with the rest of the info panels —
    // Callie speaks the number now, from the same v.responseSeconds it used to read.
    return `
      <div class="act2-check-art" data-editor-id="act2-art-name">
        <div class="act2-check-art-media">
          <img
            src="Assets/Image/Check-Name-Art.jpg"
            alt="Callie kneeling on the grass by the lake calling Tay's name with concern while Tay lies unresponsive"
            class="act2-check-char-img"
          />
        </div>
        <div class="act2-check-right-col">
          <div class="act2-check-conversation">
            ${convHtml}
          </div>
        </div>
      </div>
    `;
  }



  // =======================================================================
  // RENDER — SCENE LAYER
  // =======================================================================

  renderSceneLayer() {
    if (this.currentBeat === 'transport' || this.currentBeat === 'handoff') return '';

    const isCloseCanopy = this.currentBeat === 'arrival' || this.currentBeat === 'call';
    // The four observation hotspots are live only while the checks hub is on screen.
    const hotspotsLive = this.currentBeat === 'checks';
    const showCooler = ['cooling'].includes(this.currentBeat);
    // The cooler leans into frame on exactly the step where reaching for it is the wrong move.
    const coolerTempting = this.isCoolerTempting();

    return `
      <div class="act2-scene-layer" data-editor-id="act2-scene-layer">

        ${isCloseCanopy ? `
          <!-- Callie crouched beside Tay (taking up majority of close canopy framing) -->
          <div class="act2-callie-group" data-editor-id="act2-callie-group">
            ${this.renderCallieCrouched()}
          </div>
        ` : ''}

        <!-- Tay: lateral recumbency in close canopy, or full-width downward FPV view in triage/cooling -->
        <div class="act2-tay-group" data-editor-id="act2-tay-group">
          ${this.renderTayDown()}
          ${hotspotsLive ? this.renderCheckHotspots() : ''}
        </div>

        ${showCooler ? `
          <!-- Cooler accessible during cooling intervention -->
          <div class="act2-cooler-group ${coolerTempting ? 'is-tempting' : ''}" data-editor-id="act2-cooler-group">
            ${this.renderIceChest()}
          </div>
        ` : ''}

      </div>
    `;
  }

  // The four checks, as hotspots pinned onto Tay. Any order.
  renderCheckHotspots() {
    return `
      <div class="act2-hotspot-layer" data-editor-id="act2-hotspot-layer">
        ${Object.values(this.checksData).map(check => {
          const done = this.checksDone.has(check.id);
          return `
            <button
              class="act2-hotspot hotspot-${check.id} ${done ? 'reported' : ''}"
              data-check="${check.id}"
              data-editor-id="act2-hotspot-${check.id}"
              aria-label="${check.hotspotAria}${done ? ' — already reported' : ''}"
              aria-pressed="${done ? 'true' : 'false'}"
            >
              <span class="act2-hotspot-icon" aria-hidden="true">${done ? '✓' : ''}</span>
              <span class="act2-hotspot-tooltip">${check.label}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  // =======================================================================
  // RENDER — BEAT CONTENT
  // =======================================================================

  renderActiveBeatContent() {
    switch (this.currentBeat) {
      case 'arrival': return this.renderArrival();
      case 'call': return this.renderCall();
      case 'checks': return this.renderChecksHub();
      case 'check_active': return this.renderCheckActive();
      case 'gate': return this.renderGate();
      case 'payoff': return this.renderPayoff();
      case 'decision': return this.renderDecision();
      case 'waiting': return this.renderWaiting();
      case 'cooling': return this.renderCooling();
      case 'transport': return this.renderTransport();
      case 'handoff': return this.renderHandoff();
      default: return '';
    }
  }

  // ---- Beat: arrival ----------------------------------------------------
  renderArrival() {
    const step = this.arrivalSteps[this.stepIndex];
    if (!step) return '';

    const stepKey = `${this.currentBeat}-${this.stepIndex}`;
    const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';

    if (step.speaker === 'tay_final') {
      return `
        <div class="speech-bubble tay-bubble act2-tay-final-bubble ${isNewLineClass}"
             style="bottom: 22%; top: auto; left: 42%; max-width: min(320px, 26vw);"
             data-editor-id="act2-tay-final-bubble">
          <div class="speech-bubble-speaker">
            
            <span>Tay</span>
          </div>
          <p class="speech-bubble-text">
            <span class="tay-onomatopoeia">${step.onomatopoeia}</span>
            <span class="tay-sub-dialogue">(${step.dialogue})</span>
          </p>
          <span class="act2-final-line-tag">${step.note}</span>
        </div>
      `;
    }

    return `
      <div class="speech-bubble callie-bubble act2-callie-bubble ${isNewLineClass}"
           style="top: 14%; left: 18%; max-width: min(380px, 32vw);"
           data-editor-id="act2-arrival-callie-bubble">
        <div class="speech-bubble-speaker">
          
          <span>Callie</span>
        </div>
        <p class="speech-bubble-text">
          <span class="callie-dialogue">${step.text}</span>
        </p>
      </div>
    `;
  }

  // ---- Beat 2A: the call (Note 4: separate Callie and comic phone radio bubbles) ----
  renderCall() {
    const step = this.callSteps[this.stepIndex];
    if (!step) return '';

    const stepKey = `${this.currentBeat}-${this.stepIndex}`;
    const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';

    if (step.speaker === 'system') {
      return `
        <div class="act2-call-calling-pill ${isNewLineClass}" data-editor-id="act2-call-status">
          <span class="act2-phone-dot" aria-hidden="true"></span>
          <span>${step.text}</span>
        </div>
      `;
    }

    if (step.speaker === 'callie') {
      return `
        <div class="speech-bubble callie-bubble act2-callie-bubble act2-call-callie-bubble ${isNewLineClass}"
             style="top: 14%; left: 18%; max-width: min(380px, 32vw);"
             data-editor-id="act2-call-callie-bubble">
          <div class="speech-bubble-speaker">
            
            <span>Callie</span>
          </div>
          <p class="speech-bubble-text">
            <span class="callie-dialogue">${step.text}</span>
          </p>
        </div>
      `;
    }

    if (step.speaker === 'tech') {
      return `
        <div class="speech-bubble phone-radio-bubble ${isNewLineClass}"
             style="top: 12%; left: 26%; max-width: min(440px, 36vw);"
             data-editor-id="act2-art-phone-bezel">
          <div class="speech-bubble-speaker comic-radio-speaker">
            
            <span>Dana · Lakeside Emergency (Phone)</span>
          </div>
          <p class="speech-bubble-text comic-radio-text">
            "${step.text}"
          </p>
          <svg class="electric-lightning-tail" viewBox="0 0 40 40" aria-hidden="true">
            <polygon points="2,0 36,0 26,14 38,18 10,38 18,22 4,18" style="fill: var(--surface-radio); stroke: var(--color-radio);" stroke-width="2.5" stroke-linejoin="miter" />
          </svg>
        </div>
      `;
    }

    return '';
  }

  // ---- Beat 2A: the checks hub -----------------------------------------
  renderChecksHub() {
    const remaining = Object.values(this.checksData).filter(c => !this.checksDone.has(c.id));
    const nextPrompt = remaining.length
      ? remaining[0].techPrompt
      : "That's all 4. Stay on the line with me.";

    const body = `
      <div class="act2-phone-line line-tech">
        <span class="act2-phone-line-who">Dana · Vet Tech</span>
        <p class="act2-phone-line-text">"${remaining.length
          ? "Whichever one you can get to. I'll take them in any order."
          : "That's all 4. Stay on the line."}"</p>
      </div>
      <ul class="act2-triage-list" data-editor-id="act2-triage-list">
        ${Object.values(this.checksData).map(c => {
          const done = this.checksDone.has(c.id);
          return `
            <li class="act2-triage-item ${done ? 'is-done' : ''}">
              ${done ? '<span class="act2-triage-mark" aria-hidden="true">✓</span>' : ''}
              <span class="act2-triage-label">${c.hudLabel}</span>
              <span class="act2-triage-state">${done ? 'reported' : 'not yet'}</span>
            </li>
          `;
        }).join('')}
      </ul>
      <p class="act2-phone-hint">${remaining.length
        ? 'Click on Tay to take an observation.'
        : 'Tell her you have everything.'}</p>
      <p class="sr-only">${nextPrompt}</p>
    `;

    return `
      <div class="act2-call-panel is-docked" data-editor-id="act2-call-panel">
        ${this.renderPhoneUi(body)}
      </div>
    `;
  }

  // ---- Beat 2A: one check, opened ---------------------------------------
  
  // ONE line per check — no severity variants. Anything that changes with severity is
  // interpolated from getVitals(), never written out twice, so Callie and the readout
  // beside her cannot drift apart. The gum colour in particular is read from the SAME
  // v.gumLabel the panel prints: hardcoding "brick red" here would contradict the readout
  // once severity passes the threshold where that label becomes "Dull red, greying…".
  getCallieReportLine(checkId, v) {
    if (checkId === 'gums') {
      const colour = v.gumLabel.charAt(0).toLowerCase() + v.gumLabel.slice(1);
      // Whole seconds. Callie is counting out loud under pressure, not reading an
      // instrument — nobody counts "three point three". The underlying vitals keep the
      // decimal, so the gum refill animation still runs on the precise value.
      const counted = Math.round(parseFloat(v.refillSeconds));
      return `Her gums are ${colour}. I pressed and counted — about ${counted} seconds before the colour came back.`;
    }
    if (checkId === 'ears') {
      return `Hot. Really hot. I'm going right round the edges and there's no cool spot anywhere on her.`;
    }
    if (checkId === 'panting') {
      return `Fast. Fast and shallow — about ${v.pantRate} in a minute. And she never closes her mouth. Not once in 15 seconds.`;
    }
    if (checkId === 'name') {
      // "not lifting her head" holds whether her eye still moves or nothing moves at all.
      return `Tay. Tay. … I counted ${v.responseSeconds} seconds. She's not lifting her head.`;
    }
    return '';
  }

  buildCheckSteps(checkId) {
    const check = this.checksData[checkId];
    if (!check) return [];
    // No 'observe' step. It rendered no dialogue, so clicking Next on it looked like a
    // dead click — one press appeared to do nothing and the next moved the conversation
    // on. The art is on screen for the whole exchange anyway, so the step bought nothing.
    return [
      { type: 'prompt', text: check.techPrompt },
      { type: 'report' },
      { type: 'response', text: check.techResponse }
    ];
  }

  getCheckBodyHtml(checkId, stepIndex) {
    const v = this.getVitals();
    const artByCheck = {
      gums: (conv) => this.renderGumArt(v, conv),
      ears: (conv) => this.renderEarArt(v, conv),
      panting: (conv) => this.renderPantingArt(v, conv),
      name: (conv) => this.renderNameArt(v, conv)
    };

    const steps = this.buildCheckSteps(checkId);
    let convHtml = '';
    
    for (let i = 0; i <= stepIndex; i++) {
      const step = steps[i];
      const stepKey = `${this.currentBeat}-${checkId}-${i}`;
      const isNew = (i === stepIndex) && (this._renderedStep !== null) && (this._renderedStep !== stepKey);
      const isNewLineClass = isNew ? 'is-new-line' : '';
      
      if (step.type === 'prompt' || step.type === 'response') {
        convHtml += `
          <div class="act2-check-tech-line ${isNewLineClass}" data-editor-id="act2-check-tech-line-${i}">
            <div class="speech-bubble-speaker comic-radio-speaker">
              
              <span>Dana · Lakeside Emergency (Phone)</span>
            </div>
            <p class="speech-bubble-text comic-radio-text">"${step.text}"</p>
          </div>
        `;
      } else if (step.type === 'report') {
        convHtml += `
          <div class="act2-check-callie-line ${isNewLineClass}" data-editor-id="act2-check-callie-line-${i}">
            <div class="speech-bubble-speaker">
              
              <span>Callie</span>
            </div>
            <p class="speech-bubble-text">
              <span class="callie-dialogue">${this.getCallieReportLine(checkId, v)}</span>
            </p>
          </div>
        `;
      }
    }
    
    return artByCheck[checkId](convHtml);
  }

  getCheckDotsHtml(steps, idx) {
    return steps.map((s, i) => `
      <span class="act2-beat-dot ${i === idx ? 'current' : ''} ${i < idx ? 'seen' : ''}"></span>
    `).join('');
  }

  getCheckNavButtonState(isLast) {
    if (isLast) {
      return {
        id: 'act2-btn-check-nav',
        className: 'act2-hud-btn btn-action-primary pulse-btn',
        html: 'Report it ➔'
      };
    }
    return {
      id: 'act2-btn-check-nav',
      className: 'act2-hud-btn',
      html: 'Next ▶'
    };
  }

  renderCheckActive() {
    const check = this.checksData[this.activeCheckId];
    if (!check) return '';

    const steps = this.buildCheckSteps(this.activeCheckId);
    const idx = Math.min(this.checkStepIndex, steps.length - 1);
    const step = steps[idx];
    const isLast = idx === steps.length - 1;
    const btnState = this.getCheckNavButtonState(isLast);

    // Modal semantics per docs/design-language.md §7.4: role="dialog", aria-modal,
    // aria-labelledby pointing at the title, Escape closes (see handleKeyDown), and focus
    // is moved in on open / restored to the opening hotspot on close (see openCheck/closeCheck).
    return `
      <div class="act2-check-modal" data-editor-id="act2-check-modal" role="dialog"
           aria-modal="true" aria-labelledby="act2-check-title">
        <div class="act2-check-card" data-editor-id="act2-check-card">

          <div class="act2-check-header">
            <div class="act2-check-badge" id="act2-check-title">
              <span>${check.label.toUpperCase()}</span>
            </div>
            <button id="act2-btn-check-close" class="act2-check-close"
                    data-editor-id="act2-btn-check-close"
                    aria-label="Close this observation and go back to Tay">✕ Back to Tay</button>
          </div>

          <div class="act2-check-body" data-editor-id="act2-check-body">
            ${this.getCheckBodyHtml(this.activeCheckId, idx)}
          </div>

          <nav class="act2-check-nav">
            <div class="act2-beat-dots" aria-hidden="true">
              ${this.getCheckDotsHtml(steps, idx)}
            </div>
            <button id="${btnState.id}" class="${btnState.className}"
                    data-editor-id="${btnState.id}">${btnState.html}</button>
          </nav>

        </div>
      </div>
    `;
  }

  // ---- Beat 2A: gate ----------------------------------------------------
  renderGate() {
    const missing = Object.values(this.checksData)
      .filter(c => !this.checksDone.has(c.id))
      .map(c => c.hudLabel);

    const body = `
      <div class="act2-phone-line line-tech">
        <span class="act2-phone-line-who">Dana · Vet Tech</span>
        <p class="act2-phone-line-text">"Not yet. I still need ${missing.length === 1
          ? 'one more thing'
          : `${missing.length} more`} before I can tell you anything useful."</p>
      </div>
      <ul class="act2-triage-list" data-editor-id="act2-gate-list">
        ${missing.map(m => `
          <li class="act2-triage-item is-missing">
            
            <span class="act2-triage-label">${m}</span>
            <span class="act2-triage-state">still needed</span>
          </li>
        `).join('')}
      </ul>
    `;

    return `
      <div class="act2-call-panel" data-editor-id="act2-call-panel">
        ${this.renderPhoneUi(body)}
      </div>
    `;
  }

  // ---- Beat 2A: the payoff ----------------------------------------------
  renderPayoff() {
    const step = this.stepIndex;

    if (step === 0) {
      const body = `
        <div class="act2-phone-line line-tech">
          <span class="act2-phone-line-who">Dana · Vet Tech</span>
          <p class="act2-phone-line-text">"One more question, and it's the one that matters. How long has this been going on?"</p>
        </div>
      `;
      return `
        <div class="act2-call-panel" data-editor-id="act2-call-panel">
          ${this.renderPhoneUi(body)}
        </div>
      `;
    }

    return `
      <div class="act2-payoff-card" data-editor-id="act2-payoff-card">
        <div class="act2-payoff-header">
          <span class="act2-payoff-badge">Warning Signs · 4 / 4</span>
          <h2 class="act2-payoff-title">It has been going on since 1:30 this afternoon.</h2>
        </div>
        <ol class="act2-payoff-timeline" data-editor-id="act2-payoff-timeline">
          ${this.hintsTimeline.map(item => `
            <li class="act2-payoff-item">
              <span class="act2-payoff-time">${item.time}</span>
              <span class="act2-payoff-copy">
                <strong>${item.title}</strong>
                <span>${item.line}</span>
              </span>
            </li>
          `).join('')}
        </ol>
        <p class="act2-payoff-tech">
          <span class="act2-phone-line-who">Dana · Vet Tech</span>
          "95 minutes of build-up, and everything you just described to me. I'm not
          going to make you wait for a number. Bring her in — and start cooling her before you drive."
        </p>
        <div class="act2-payoff-footer">
          <button id="act2-btn-to-decision" class="act2-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act2-btn-to-decision">What do you do? ➔</button>
        </div>
      </div>
    `;
  }

  // ---- Beat 2B: the decision -------------------------------------------
  renderDecision() {
    return `
      <div class="act2-decision-card" data-editor-id="act2-decision-card" role="group"
           aria-label="The decision: act now, or give her 5 minutes">
        <span class="act2-decision-badge">Your call</span>
        <h2 class="act2-decision-title">She's flat on the grass and she isn't answering you.</h2>
        <p class="act2-decision-sub">
          The lake is 20 feet away. The car is 40. Dana is still on the line.
        </p>
        <div class="act2-decision-options">
          <button id="act2-choice-act-now" class="act2-decision-option is-act"
                  data-editor-id="act2-decision-act-now"
                  aria-label="Start cooling her now">
            <span class="act2-decision-option-title">Start cooling her now</span>
            <span class="act2-decision-option-sub">Shade, water, the whole thing — right here, before the car.</span>
          </button>
          <button id="act2-choice-wait" class="act2-decision-option is-wait"
                  data-editor-id="act2-decision-wait"
                  aria-label="Give her 5 minutes to settle">
            <span class="act2-decision-option-title">Give her 5 minutes to settle</span>
            <span class="act2-decision-option-sub">She's been hot before. Let her rest and see if she comes round.</span>
          </button>
        </div>
      </div>
    `;
  }

  // ---- Beat 2B: what waiting costs. No fail state. ----------------------
  renderWaiting() {
    const v = this.getVitals();
    const step = this.stepIndex;

    if (step === 0) {
      return `
        <div class="act2-waiting-card" data-editor-id="act2-waiting-card">
          <span class="act2-waiting-badge">You waited</span>
          <h2 class="act2-waiting-title">3:05 PM ➔ 3:10 PM</h2>
          <p class="act2-waiting-line">
            You sit down next to her and put your hand on her side. The lake carries on
            behind you without noticing. Nothing about the 5 minutes feels like it's
            helping, and you watch all of it.
          </p>
          <div class="act2-waiting-delta" data-editor-id="act2-waiting-delta">
            <div class="act2-delta-row">
              <span class="act2-delta-label">Capillary refill</span>
              <span class="act2-delta-before">2.3 s</span>
              <span class="act2-delta-arrow" aria-hidden="true">➔</span>
              <span class="act2-delta-after">${v.refillSeconds} s</span>
            </div>
            <div class="act2-delta-row">
              <span class="act2-delta-label">Gums</span>
              <span class="act2-delta-before">Brick red</span>
              <span class="act2-delta-arrow" aria-hidden="true">➔</span>
              <span class="act2-delta-after">${v.gumLabel}</span>
            </div>
            <div class="act2-delta-row">
              <span class="act2-delta-label">Response to her name</span>
              <span class="act2-delta-before">Delayed</span>
              <span class="act2-delta-arrow" aria-hidden="true">➔</span>
              <span class="act2-delta-after">${v.responseWord}</span>
            </div>
          </div>
          <p class="act2-waiting-note">
            Nothing here is a game over. She is still in front of you and you can still do
            every single thing you were going to do. It is just 5 minutes worse.
          </p>
        </div>
      `;
    }

    return `
      <div class="act2-call-panel" data-editor-id="act2-call-panel">
        ${this.renderPhoneUi(`
          <div class="act2-phone-line line-tech">
            <span class="act2-phone-line-who">Dana · Vet Tech</span>
            <p class="act2-phone-line-text">"Callie. Are you cooling her? Start now, and keep me on speaker."</p>
          </div>
        `)}
      </div>
    `;
  }

  // ---- Beat 2C: cooling -------------------------------------------------
  renderCooling() {
    const step = this.coolingSteps[this.coolingIndex];
    if (!step) return '';

    const isLastStep = this.coolingIndex === this.coolingSteps.length - 1;
    const stepKey = `${this.currentBeat}-${this.coolingIndex}`;
    const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';

    return `
      <div class="act2-cool-card ${isNewLineClass}" data-editor-id="act2-cool-card" role="group"
           aria-label="Cooling step ${this.coolingIndex + 1} of ${this.coolingSteps.length}: ${step.stepLabel}">
        <div class="act2-cool-head">
          <span class="act2-cool-badge">Cooling · ${this.coolingIndex + 1} of ${this.coolingSteps.length}</span>
          <span class="act2-cool-step-label">${step.stepLabel}</span>
        </div>

        <p class="act2-cool-prompt">
          <span class="act2-phone-line-who">Dana · Vet Tech</span>
          "${step.techPrompt}"
        </p>

        ${step.commonBelief ? `
          <p class="act2-belief-line" data-editor-id="act2-belief-line">
            <span class="act2-belief-who">What everyone knows</span>${step.commonBelief}
          </p>
        ` : ''}

        <div class="act2-cool-options">
          ${step.options.map(opt => this.getCoolOptionButtonHtml(opt)).join('')}
        </div>

        <div class="act2-cool-replies">
          ${step.options.map(opt => {
            const isChosen = this.isCoolChosen(opt.id);
            return `
            <div class="act2-cool-item ${isChosen ? 'is-chosen' : ''} ${isChosen ? (opt.correct ? 'is-correct' : 'is-wrong') : ''}"
                 data-cool-item="${opt.id}">
              ${this.getCoolOptionStateHtml(opt, isChosen, step, isLastStep)}
            </div>
          `;}).join('')}
        </div>
      </div>
    `;
  }

  getTransportStateStrings() {
    const ready = this.acOn && this.windowsOpen;
    return {
      ready,
      sceneClass: `act2-transport-scene ${this.acOn ? 'ac-on' : ''} ${this.windowsOpen ? 'windows-open' : ''}`,
      acAria: this.acOn ? 'Air conditioning, currently on' : 'Air conditioning, currently off',
      acPillText: `AC · ${this.acOn ? 'ON' : 'OFF'}`,
      acChecked: this.acOn ? 'true' : 'false',
      winAria: this.windowsOpen ? 'Rear windows, currently cracked' : 'Rear windows, currently shut',
      winPillText: `WINDOWS · ${this.windowsOpen ? 'CRACKED' : 'SHUT'}`,
      winChecked: this.windowsOpen ? 'true' : 'false',
      hintText: ready
        ? 'Air is moving over her, she is on the cool towel, and they are expecting you.'
        : 'She is on the cool towel. Now get air moving over her.'
    };
  }

  // ---- Beat 2D: transport micro-sim -------------------------------------
  renderTransport() {
    const s = this.getTransportStateStrings();
    const acInviteClass = !this.acInteracted && !this.arriving ? 'needs-invite' : '';
    const winInviteClass = !this.winInteracted && !this.arriving ? 'needs-invite' : '';

    return `
      <div class="${s.sceneClass}" data-editor-id="act2-transport-scene">
        
        <div class="act2-car-sway-container">
          <img src="Assets/Image/Car-FPV-Interior.jpg" alt="" class="act2-scene-img act2-car-plate" style="z-index: 1;" />
          <div class="act2-exterior-motion" style="z-index: 2;">
            <div class="act2-lane-dashes">
              <div class="act2-dash"></div>
              <div class="act2-dash" style="animation-delay: calc(var(--road-dash-cadence) * -0.33)"></div>
              <div class="act2-dash" style="animation-delay: calc(var(--road-dash-cadence) * -0.66)"></div>
            </div>
            <div class="act2-roadside-drift">
              <div class="act2-drift act2-drift-left"></div>
              <div class="act2-drift act2-drift-right"></div>
            </div>
            <img src="Assets/Image/Clinic-Exterior-Approach.png" alt="" class="act2-clinic-approach" />
          </div>
          
          <div class="act2-car-overlays" aria-hidden="true" style="pointer-events: none; z-index: 3;">
            <img src="Assets/Image/Car-Mirror-Tay.png" alt="Tay lying on her side on the back seat on a cool wet towel spread flat underneath her, panting" class="act2-rear-view-mirror" />
            
            <div class="act2-window-aperture">
              <div class="act2-wind-gap"></div>
              <div class="act2-window-pane"></div>
            </div>

            <div class="act2-ac-knob-well">
              <svg class="act2-ac-knob-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="#1A1C1A" />
                <line x1="50" y1="50" x2="50" y2="15" stroke="#E2E8F0" stroke-width="6" stroke-linecap="round" />
              </svg>
            </div>

            <div class="act2-airflow-layer">
              <div class="act2-stream act2-stream-1"></div>
              <div class="act2-stream act2-stream-2"></div>
              <div class="act2-stream act2-stream-3"></div>
            </div>
            <div class="act2-ac-tint"></div>
          </div>
        </div>

        <button id="act2-toggle-ac" class="act2-diegetic-btn ${acInviteClass}" role="switch" aria-checked="${s.acChecked}" aria-label="${s.acAria}" ${this.arriving ? 'disabled="true"' : ''}>
           <span class="act2-diegetic-pill" id="act2-ac-pill">${s.acPillText}</span>
        </button>

        <button id="act2-toggle-windows" class="act2-diegetic-btn ${winInviteClass}" role="switch" aria-checked="${s.winChecked}" aria-label="${s.winAria}" ${this.arriving ? 'disabled="true"' : ''}>
           <span class="act2-diegetic-pill" id="act2-win-pill">${s.winPillText}</span>
        </button>

        <div class="act2-transport-hud">
          <div class="act2-transport-hud-msg">Cool her on the way. Don't just drive.</div>
          <div class="act2-transport-hud-hint" id="act2-transport-hint">${s.hintText}</div>
          <div class="act2-transport-hud-prepaid">
            Clinic called ahead — already done, Dana has been on the line since the lake
          </div>
        </div>

        <div class="act2-transport-footer">
          <button id="act2-btn-arrive" class="act2-hud-btn btn-action-primary ${s.ready && !this.arriving ? 'pulse-btn' : ''}" data-editor-id="act2-btn-arrive" ${s.ready && !this.arriving ? '' : 'disabled="true"'}>
            Pull in at the clinic ➔
          </button>
        </div>
      </div>
    `;
  }

  patchTransportControls() {
    const s = this.getTransportStateStrings();
    const scene = this.container.querySelector('.act2-transport-scene');
    if (scene) {
      scene.className = s.sceneClass;
      if (this.arriving) scene.classList.add('is-arriving');
    }
    
    const ac = this.container.querySelector('#act2-toggle-ac');
    if (ac) {
      ac.setAttribute('aria-checked', s.acChecked);
      ac.setAttribute('aria-label', s.acAria);
      if (this.arriving) {
        ac.setAttribute('disabled', 'true');
        ac.classList.remove('needs-invite');
      } else {
        ac.removeAttribute('disabled');
        if (!this.acInteracted) ac.classList.add('needs-invite');
        else ac.classList.remove('needs-invite');
      }
    }
    const acPill = this.container.querySelector('#act2-ac-pill');
    if (acPill) acPill.textContent = s.acPillText;
    
    const win = this.container.querySelector('#act2-toggle-windows');
    if (win) {
      win.setAttribute('aria-checked', s.winChecked);
      win.setAttribute('aria-label', s.winAria);
      if (this.arriving) {
        win.setAttribute('disabled', 'true');
        win.classList.remove('needs-invite');
      } else {
        win.removeAttribute('disabled');
        if (!this.winInteracted) win.classList.add('needs-invite');
        else win.classList.remove('needs-invite');
      }
    }
    const winPill = this.container.querySelector('#act2-win-pill');
    if (winPill) winPill.textContent = s.winPillText;
    
    const hint = this.container.querySelector('#act2-transport-hint');
    if (hint) hint.textContent = s.hintText;
    
    const arrive = this.container.querySelector('#act2-btn-arrive');
    if (arrive) {
      if (s.ready && !this.arriving) {
        arrive.removeAttribute('disabled');
        arrive.classList.add('pulse-btn');
      } else {
        arrive.setAttribute('disabled', 'true');
      }
    }
    if (this.hasProgress()) this.saveProgress();
  }

  renderHandoff() {
    return `
      <div class="act2-handoff-card" data-editor-id="act2-handoff-card">
        <h2 class="act2-handoff-title">You did the part nobody sees.</h2>
        <p class="act2-handoff-line">
          Cooled first, drove second, and they were ready for her at the door.
        </p>
        <button id="act2-btn-act3" class="act2-hud-btn btn-action-primary pulse-btn"
                data-editor-id="act2-btn-act3">Act 3: The Clinic ➔</button>
      </div>
    `;
  }

  // =======================================================================
  // RENDER — NAV CONTROLS
  // =======================================================================

  renderBottomLeftControls() {
    if (this.currentBeat === 'checks' && this.checksDone.size > 0) {
      return `
        <div class="act2-nudge-pill" data-editor-id="act2-nudge-pill">
          
          <span>Click Tay to take the next observation</span>
        </div>
      `;
    }
    if (this.currentBeat === 'cooling' && !this.coolingFeedback) {
      return `
        <div class="act2-nudge-pill" data-editor-id="act2-nudge-pill">
          
          <span>You choose. Callie does it.</span>
        </div>
      `;
    }
    return '';
  }

  renderBottomRightControls() {
    switch (this.currentBeat) {
      case 'arrival': {
        const isLast = this.stepIndex === this.arrivalSteps.length - 1;
        return isLast ? `
          <button id="act2-btn-start-call" class="act2-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act2-btn-start-call">Call the clinic ➔</button>
        ` : `
          <button id="act2-btn-next-step" class="act2-hud-btn" data-editor-id="act2-btn-next-step">Next ▶</button>
        `;
      }

      case 'call': {
        const isLast = this.stepIndex === this.callSteps.length - 1;
        return isLast ? `
          <button id="act2-btn-start-checks" class="act2-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act2-btn-start-checks">Start looking ➔</button>
        ` : `
          <button id="act2-btn-next-step" class="act2-hud-btn" data-editor-id="act2-btn-next-step">Next ▶</button>
        `;
      }

      case 'checks': {
        const all = this.checksDone.size === 4;
        return `
          <button id="act2-btn-report-all" class="act2-hud-btn ${all ? 'btn-action-primary pulse-btn' : ''}"
                  data-editor-id="act2-btn-report-all">
            ${all ? "That's everything ➔" : "Tell her that's everything ▶"}
          </button>
        `;
      }

      case 'gate':
        return `
          <button id="act2-btn-back-to-checks" class="act2-hud-btn btn-action-primary"
                  data-editor-id="act2-btn-back-to-checks">Keep looking ➔</button>
        `;

      case 'payoff':
        return this.stepIndex === 0 ? `
          <button id="act2-btn-next-step" class="act2-hud-btn"
                  data-editor-id="act2-btn-next-step">Tell her ▶</button>
        ` : '';

      case 'waiting':
        return this.stepIndex === 0 ? `
          <button id="act2-btn-next-step" class="act2-hud-btn" data-editor-id="act2-btn-next-step">Next ▶</button>
        ` : `
          <button id="act2-btn-start-cooling" class="act2-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act2-btn-start-cooling">Start cooling her ➔</button>
        `;

      default:
        return '';
    }
  }

  // =======================================================================
  // EVENTS
  // =======================================================================

  bindEvents() {
    if (!this.container) return;
    const q = sel => this.container.querySelector(sel);

    const on = (sel, handler) => {
      const el = q(sel);
      if (!el) return;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        handler(e);
      });
    };

    // --- Global nav ---
    on('#act2-btn-back-act1', async () => {
      if (this.hasProgress()) {
        const leave = await confirmLeave({
          title: 'Go back to Act 1?',
          message: 'Act 1 starts again from the beginning, and your progress in Act 2 will be cleared.',
          leaveLabel: 'Go back'
        });
        if (!leave) return;
        try { progressStore.clear(); } catch(e) {}
      }
      this.app?.navigateTo('act1', { beat: 'pov_rise' });
    });

    on('#act2-btn-title', async () => {
      if (this.hasProgress()) {
        const leave = await confirmLeave({
          title: 'Leave the story?',
          message: 'You\'ll go back to the title screen, and everything you\'ve done in Act 2 so far will be cleared.',
          leaveLabel: 'Leave anyway'
        });
        if (!leave) return;
        try { progressStore.clear(); } catch(e) {}
      }
      this.app?.navigateTo('opening');
    });

    // --- Generic advance ---
    on('#act2-btn-next-step', () => this.nextSubStep());

    // --- Beat: arrival -> call ---
    on('#act2-btn-start-call', () => {
      this.currentBeat = 'call';
      this.stepIndex = 0;
      this.render();
    });

    // --- Beat 2A: call -> checks ---
    on('#act2-btn-start-checks', () => {
      this.currentBeat = 'checks';
      this.stepIndex = 0;
      this.render();
    });

    // --- Beat 2A: the four hotspots (any order) ---
    this.container.querySelectorAll('.act2-hotspot').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive() || this.currentBeat !== 'checks') return;
        this.openCheck(el.getAttribute('data-check'));
      });
    });

    on('#act2-btn-check-close', () => this.closeCheck());
    on('#act2-btn-check-nav', () => {
      const steps = this.buildCheckSteps(this.activeCheckId);
      const isLast = this.checkStepIndex >= steps.length - 1;
      if (isLast) {
        this.reportCheck();
      } else {
        this.nextCheckStep();
      }
    });

    // --- Beat 2A: the gate ---
    on('#act2-btn-report-all', () => {
      if (this.checksDone.size < 4) {
        this.currentBeat = 'gate';
        this.render();
        return;
      }
      this.currentBeat = 'payoff';
      this.stepIndex = 0;
      this.hintsCashedOut = true;
      this.render();
    });

    on('#act2-btn-back-to-checks', () => {
      this.currentBeat = 'checks';
      this.render();
    });

    // --- Beat 2A -> 2B ---
    on('#act2-btn-to-decision', () => {
      this.currentBeat = 'decision';
      this.stepIndex = 0;
      this.render();
    });

    // --- Beat 2B: the decision ---
    on('#act2-choice-act-now', () => this.chooseDecision('act_now'));
    on('#act2-choice-wait', () => this.chooseDecision('wait'));
    on('#act2-btn-start-cooling', () => this.startCooling());

    // --- Beat 2C: cooling choices ---
    this.container.querySelectorAll('.act2-cool-option').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.chooseCooling(el.getAttribute('data-cool-option'));
      });
    });
    // Next / Retry live inside every option's (always-rendered) reply panel, so bind by class.
    this.container.querySelectorAll('.act2-btn-cool-next').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.advanceCooling();
      });
    });
    this.container.querySelectorAll('.act2-btn-cool-retry').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        if (this.coolingFeedback && !this.coolingFeedback.correct) {
          this.retryCooling(this.coolingFeedback.optionId);
        }
      });
    });

    // --- Beat 2D: transport ---
    on('#act2-toggle-ac', () => { 
      this.acOn = !this.acOn; 
      this.acInteracted = true;
      this.patchTransportControls(); 
    });
    on('#act2-toggle-windows', () => { 
      this.windowsOpen = !this.windowsOpen; 
      this.winInteracted = true;
      this.patchTransportControls(); 
    });
    on('#act2-btn-arrive', () => this.handleArriveClick());
    // Act 3's central claim is that every number lands on a decision the learner already
    // made, so the playthrough travels with them. Without this the survival payoff has to
    // fall back to its neutral variant. See Act3Screen.applyHandoff().
    on('#act2-btn-act3', () => this.app?.navigateTo('act3', { handoff: this.getHandoff() }));
  }

  // =======================================================================
  // BEAT TRANSITIONS
  // =======================================================================

  handleArriveClick() {
    if (this.arriving) {
      this.skipArrival();
      return;
    }
    this.arriving = true;
    
    this.patchTransportControls();

    this.skipListener = (ev) => {
      ev.stopPropagation();
      this.skipArrival();
    };
    // Attached on the NEXT frame, not now. The click that started the arrival is still
    // bubbling toward the container, so binding synchronously lets that same event hit
    // this listener and skip the sequence it just began.
    if (this.container) {
      window.requestAnimationFrame(() => {
        if (this.arriving && this.container && this.skipListener) {
          this.container.addEventListener('click', this.skipListener);
        }
      });
    }

    this.arriveTimeout = setTimeout(() => {
      this.finishArrival();
    }, 2500);
  }

  skipArrival() {
    this.finishArrival();
  }

  finishArrival() {
    if (!this.arriving) return;   // idempotent: skip and the timer both land here
    if (this.arriveTimeout) {
      clearTimeout(this.arriveTimeout);
      this.arriveTimeout = null;
    }
    if (this.skipListener && this.container) {
      this.container.removeEventListener('click', this.skipListener);
      this.skipListener = null;
    }
    // MUST clear. While this is true the beat renders with the AC, the windows and the
    // arrive button all disabled — so stepping Back into transport after arriving left
    // the learner on a dead screen with nothing clickable and no way forward.
    this.arriving = false;
    this.currentBeat = 'handoff';
    this.render();
  }

  nextSubStep() {
    if (this.currentBeat === 'arrival') {
      if (this.stepIndex < this.arrivalSteps.length - 1) {
        this.stepIndex++;
        this.render();
      }
    } else if (this.currentBeat === 'call') {
      if (this.stepIndex < this.callSteps.length - 1) {
        this.stepIndex++;
        this.render();
      }
    } else if (this.currentBeat === 'payoff' || this.currentBeat === 'waiting') {
      if (this.stepIndex < 1) {
        this.stepIndex++;
        this.render();
      }
    }
  }

  openCheck(checkId, stepIndex = 0) {
    if (!this.checksData[checkId]) return;
    // Remember which hotspot opened the modal so focus can be returned to it on close
    // (no keyboard trap — design-language.md §7.5).
    this.returnFocusCheckId = checkId;
    this.activeCheckId = checkId;
    this.checkStepIndex = stepIndex;
    this.currentBeat = 'check_active';
    this.render();
    this.focusInModal();
  }

  closeCheck() {
    const returnTo = this.returnFocusCheckId;
    this.currentBeat = 'checks';
    this.activeCheckId = null;
    this.checkStepIndex = 0;
    this.render();

    // Restore focus to the hotspot that opened the modal.
    const hotspot = this.container?.querySelector(`.act2-hotspot[data-check="${returnTo}"]`);
    if (hotspot && !this.isEditModeActive()) hotspot.focus();
    this.returnFocusCheckId = null;
  }

  // Move focus into the dialog on open and on every step advance, so a keyboard or
  // screen-reader user lands on the control that moves the beat forward.
  focusInModal() {
    // The nav button keeps ONE stable id and swaps its label between Next and Report it,
    // so there is a single selector to aim at. Close is the fallback only when the modal
    // has no advancing control at all.
    focusInto(this.container, ['#act2-btn-check-nav', '#act2-btn-check-close']);
  }

  nextCheckStep() {
    const steps = this.buildCheckSteps(this.activeCheckId);
    if (this.checkStepIndex < steps.length - 1) {
      this.checkStepIndex++;
      
      const step = steps[this.checkStepIndex];
      const isLast = this.checkStepIndex === steps.length - 1;

      // Patch the body
      const body = this.container.querySelector('.act2-check-body');
      if (body) body.innerHTML = this.getCheckBodyHtml(this.activeCheckId, this.checkStepIndex);

      // Scroll the conversation to the bottom so the newest line is in view
      const conv = this.container.querySelector('.act2-check-conversation');
      if (conv) {
        // Use requestAnimationFrame to ensure the DOM has updated and rendered
        requestAnimationFrame(() => {
          conv.scrollTop = conv.scrollHeight;
        });
      }

      // Patch the beat dots
      const dots = this.container.querySelector('.act2-beat-dots');
      if (dots) dots.innerHTML = this.getCheckDotsHtml(steps, this.checkStepIndex);

      // Patch the nav button
      const { id, className, html } = this.getCheckNavButtonState(isLast);
      const btn = this.container.querySelector('.act2-check-nav .act2-hud-btn');
      if (btn) {
        btn.id = id;
        btn.className = className;
        btn.innerHTML = html;
        btn.setAttribute('data-editor-id', id);
      }

      this.focusInModal();
      if (this.hasProgress()) this.saveProgress();
    } else {
      this.reportCheck();
    }
  }

  reportCheck() {
    if (this.activeCheckId && !this.checksDone.has(this.activeCheckId)) {
      this.checksDone.add(this.activeCheckId);
      this.checkReportOrder.push(this.activeCheckId);
    }
    this.closeCheck();
  }

  chooseDecision(choice) {
    this.decisionChoice = choice;
    // The clock becomes visible here and stays visible for the rest of the act.
    this.startElapsedClock();

    if (choice === 'act_now') {
      this.startCooling();
      return;
    }

    // Waiting is not a fail state. It runs the clock five minutes and every observable
    // reading gets worse — then the learner still gets to do everything they were going to do.
    this.currentBeat = 'waiting';
    this.stepIndex = 0;
    this.clockMinutes += 5;
    this.elapsedSeconds += 300;
    this.severity = Math.min(1, this.severity + 0.35);
    this.render();
  }

  startCooling() {
    this.startElapsedClock();
    this.currentBeat = 'cooling';
    this.coolingIndex = 0;
    this.coolingFeedback = null;
    this.render();
  }


  // ---- Cooling card helpers -------------------------------------------------
  // Shared by renderCooling() and the in-place patches (chooseCooling / retryCooling) so
  // the two paths cannot drift — docs/guideline-persistent-cards.md, Rule 2.

  isCoolChosen(optionId) {
    return !!this.coolingFeedback && this.coolingFeedback.optionId === optionId;
  }

  // The cooler leans into frame on exactly the step where reaching for it is the wrong move.
  isCoolerTempting() {
    return this.currentBeat === 'cooling'
      && this.coolingSteps[this.coolingIndex]?.id === 'water_source'
      && !this.coolingFeedback;
  }

  getCoolOptionButtonHtml(opt) {
    const isChosen = this.isCoolChosen(opt.id);
    const locked = !!this.coolingFeedback; // a choice is on the table: every option is inert
    return `
      <button class="act2-cool-option ${isChosen ? 'is-chosen' : ''}" data-cool-option="${opt.id}"
              data-editor-id="act2-cool-option-${opt.id}"
              aria-label="${opt.label}"
              aria-pressed="${isChosen ? 'true' : 'false'}"
              ${locked ? 'aria-disabled="true"' : ''}>
        <span class="act2-cool-option-label">${opt.label}</span>
      </button>
    `;
  }

  getCoolOptionStateHtml(opt, isChosen, step, isLastStep) {
    const correct = !!opt.correct;

    return `
      <div class="act2-cool-reply-wrap">
        <div class="act2-cool-reply-clip">
          <div class="act2-cool-feedback ${correct ? 'is-right' : 'is-wrong'}"
               data-editor-id="act2-cool-feedback-${opt.id}" role="status" aria-live="polite" aria-hidden="${!isChosen}">
            <div class="act2-cool-feedback-head">
              <span class="act2-cool-feedback-tag">${correct ? '✓ That works' : '✕ That costs her'}</span>
              <span class="act2-cool-step-label">${step.stepLabel}</span>
            </div>

            <p class="act2-cool-feedback-body">${correct ? opt.result : opt.consequence}</p>

            ${correct ? `
              <div class="act2-truth-stamp" data-editor-id="act2-cool-stamp-${opt.id}">
                <span class="act2-truth-stamp-metric">${opt.stamp.metric}</span>
                <span class="act2-truth-stamp-line">${opt.stamp.line}</span>
              </div>
            ` : `
              <div class="act2-cool-correction" data-editor-id="act2-cool-correction-${opt.id}">
                <span class="act2-cool-correction-tag">What to do instead</span>
                <p>${opt.correction}</p>
              </div>
              <p class="act2-cool-nofail">She is still here. Fix it and keep going.</p>
            `}

            <div class="act2-cool-feedback-footer">
              ${correct ? `
                <button class="act2-hud-btn ${isLastStep ? 'btn-action-primary pulse-btn' : ''} act2-btn-cool-next"
                        data-editor-id="act2-btn-cool-next-${opt.id}">
                  ${isLastStep ? 'Get her in the car ➔' : 'Next ▶'}
                </button>
              ` : `
                <button class="act2-hud-btn btn-action-primary act2-btn-cool-retry"
                        data-editor-id="act2-btn-cool-retry-${opt.id}">Try that again</button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Everything outside the card that depends on coolingFeedback: the nudge pill, the
  // tempting cooler, the elapsed clock. Patched in place, never re-rendered.
  patchCoolingChrome() {
    const pill = this.container.querySelector('.act2-nudge-pill');
    if (pill) pill.style.display = this.coolingFeedback ? 'none' : ''; // [hidden] loses to the pill's display:flex
    const cooler = this.container.querySelector('.act2-cooler-group');
    if (cooler) cooler.classList.toggle('is-tempting', this.isCoolerTempting());
    const elapsedEl = this.container.querySelector('#act2-elapsed-text');
    if (elapsedEl) elapsedEl.textContent = this.getFormattedElapsed();
    if (this.hasProgress()) this.saveProgress();
  }

  chooseCooling(optionId) {
    if (this.coolingFeedback) return; // a choice is already on the table (Next / Retry first)
    const step = this.coolingSteps[this.coolingIndex];
    if (!step) return;
    const opt = step.options.find(o => o.id === optionId);
    if (!opt) return;

    if (!opt.correct) {
      // Wrong answers cost: the clock jumps and she gets a little worse. Never a game over.
      this.coolingWrongCount += 1;
      this.elapsedSeconds += 45;
      this.severity = Math.min(1, this.severity + 0.05);
    }

    this.coolingFeedback = { optionId, correct: !!opt.correct };

    // DOM patch instead of this.render() — the card, the cast and focus all stay put.
    this.container.querySelectorAll('.act2-cool-option').forEach(btn => {
      const chosen = btn.getAttribute('data-cool-option') === optionId;
      btn.classList.toggle('is-chosen', chosen);
      btn.setAttribute('aria-pressed', chosen ? 'true' : 'false');
      btn.setAttribute('aria-disabled', 'true');
    });
    const item = this.container.querySelector(`.act2-cool-item[data-cool-item="${optionId}"]`);
    if (item) {
      item.classList.add('is-chosen', opt.correct ? 'is-correct' : 'is-wrong');
      item.querySelector('.act2-cool-feedback')?.setAttribute('aria-hidden', 'false');
      // The card scrolls; once the reply has finished opening, bring its Next / Try again
      // button into view — without moving focus off the option the learner just pressed.
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const wrap = item.querySelector('.act2-cool-reply-wrap');
      const reveal = () => {
        // Scroll the CARD only — scrollIntoView would also pan the stage behind it.
        const card = item.closest('.act2-cool-card');
        if (!card) return;
        card.scrollTo({ top: card.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
      };
      wrap?.addEventListener('transitionend', reveal, { once: true });
      window.setTimeout(reveal, 700); // fallback if the transition never fires
    }
    this.patchCoolingChrome();
  }

  retryCooling(optionId) {
    this.coolingFeedback = null;

    this.container.querySelectorAll('.act2-cool-option').forEach(btn => {
      btn.classList.remove('is-chosen');
      btn.setAttribute('aria-pressed', 'false');
      btn.removeAttribute('aria-disabled');
    });
    const item = this.container.querySelector(`.act2-cool-item[data-cool-item="${optionId}"]`);
    if (item) {
      item.classList.remove('is-chosen', 'is-correct', 'is-wrong');
      item.querySelector('.act2-cool-feedback')?.setAttribute('aria-hidden', 'true');
    }
    this.patchCoolingChrome();
    this.container.querySelector(`.act2-cool-option[data-cool-option="${optionId}"]`)?.focus();
  }

  advanceCooling() {
    this.coolingFeedback = null;
    if (this.coolingIndex < this.coolingSteps.length - 1) {
      this.coolingIndex++;
      this.render();
      return;
    }
    this.currentBeat = 'transport';
    this.render();
  }



  // =======================================================================
  // KEYBOARD (matches Act 1: ArrowRight / Space advance, Escape / ArrowLeft back out)
  // =======================================================================

  handleKeyDown(e) {
    if (this.isEditModeActive()) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Space' || e.key === 'Spacebar') {
      if (['arrival', 'call', 'payoff', 'waiting'].includes(this.currentBeat)) {
        e.preventDefault();
        this.nextSubStep();
      } else if (this.currentBeat === 'check_active') {
        e.preventDefault();
        const steps = this.buildCheckSteps(this.activeCheckId);
        if (this.checkStepIndex < steps.length - 1) {
          this.nextCheckStep();
        } else {
          this.reportCheck();
        }
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
      if (this.currentBeat === 'check_active') {
        e.preventDefault();
        this.closeCheck();
      } else if (this.currentBeat === 'gate') {
        e.preventDefault();
        this.currentBeat = 'checks';
        this.render();
      }
    }
  }
}
