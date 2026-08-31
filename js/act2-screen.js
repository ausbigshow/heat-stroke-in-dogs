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
 *   2A checks  — four observation checks (any order), each flashing back to its Act 1 lead.
 *   2A gate    — all four must be reported before the call moves on.
 *   2A payoff  — "How long has this been going on?" — HINTS DROPPED: 4 cashes out.
 *   2B decision— act now, or give her five minutes. NO fail state; waiting visibly costs.
 *   2C cooling — five fixed choices, real wrong answers, consequence + correction.
 *   2D transport— the towel micro-sim (it warms; re-wet it), AC, windows, call-ahead.
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

export class Act2Screen {
  constructor(app) {
    this.app = app;
    this.container = null;

    // ---- Core beat state -------------------------------------------------
    // 'arrival' | 'call' | 'checks' | 'check_active' | 'gate' | 'payoff'
    // | 'decision' | 'waiting' | 'cooling' | 'transport' | 'handoff'
    this.currentBeat = 'arrival';
    this.stepIndex = 0;

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
    this.wesOverruled = false;

    // ---- Beat 2D: the towel micro-sim ------------------------------------
    this.towelWarmth = 0; // 0 = just re-wet and cool, 100 = at body temperature
    this.towelTimer = null;
    this.rewetCount = 0;
    this.acOn = false;
    this.windowsOpen = false;
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
      { type: 'silence' },
      { speaker: 'callie', text: "You're not okay. You're not okay. Where's my phone —" }
    ];

    // Beat 2A: the call itself. The vet tech is voice-only (no visual asset needed).
    this.callSteps = [
      { speaker: 'system', text: 'Calling Lakeside Veterinary Clinic…' },
      { speaker: 'tech', text: "Lakeside Veterinary, this is Marcus." },
      { speaker: 'callie', text: "My dog's down. French Bulldog, she's four, she won't get up. We're out at the lake." },
      { speaker: 'tech', text: "Okay. I'm not going to ask you to guess at anything. I'm going to ask you to look at four things and tell me what you see." },
      { speaker: 'tech', text: "You're my eyes right now. Take them in whatever order you can get to. Start whenever you're ready." }
    ];

    // The four observation checks. Any order; gated at all four.
    // Each carries its Act 1 flashback — the learner is being shown their own playthrough.
    this.checksData = {
      gums: {
        id: 'gums',
        icon: '👄',
        label: 'Lift her lip',
        hudLabel: 'Gums + refill',
        hotspotAria: 'Lift Tay\'s lip and check her gum colour and capillary refill time',
        techPrompt: "Lift her lip for me. Two things — what colour are the gums, and when you press on them and let go, how many seconds until the colour comes back?",
        techResponse: "Both of those are outside normal. Colour on its own can fool you; the refill time is the part I actually needed.",
        flashback: {
          leadId: 'bowl',
          leadName: 'Her Water Bowl',
          tayName: 'The Water One',
          recall: "Sun-side, half empty, warm since noon. She sniffed it, filed it under boring, and walked away.",
          link: "Not a drop since the car. That is where the slow refill comes from."
        }
      },
      ears: {
        id: 'ears',
        icon: '👂',
        label: 'Hands on her ears',
        hudLabel: 'Ears',
        hotspotAria: 'Put your hands on Tay\'s ears to feel how hot they are',
        techPrompt: "Cup both her ears in your hands. Ears run hot before the rest of her does. Tell me what they feel like.",
        techResponse: "That's not sun on the outside of her. That's heat coming out of her.",
        flashback: {
          leadId: 'cooler',
          leadName: 'The Cooler',
          tayName: 'The Vault',
          recall: "Ninety minutes pressed against a cold box in open sun, because the sandwiches were inside it.",
          link: "The cooler was cold. The spot she picked was 99°F and had no shade at all."
        }
      },
      panting: {
        id: 'panting',
        icon: '💨',
        label: 'Watch her panting',
        hudLabel: 'Panting',
        hotspotAria: 'Watch the rhythm and depth of Tay\'s panting',
        techPrompt: "Don't touch her for this one. Just watch her ribs for fifteen seconds. Is it deep and even, or fast and shallow — and does she ever stop?",
        techResponse: "Panting is nearly all the cooling a dog has. When it goes fast and shallow it's moving less air, not more. She's working and losing ground.",
        flashback: {
          leadId: 'dock',
          leadName: 'The Dock',
          tayName: 'High Ground',
          recall: "She patrolled the whole length of it looking for a hot dog that was there last summer.",
          link: "137°F boards, four inches under a flat-faced dog who can't pant efficiently to begin with."
        }
      },
      name: {
        id: 'name',
        icon: '🗣️',
        label: 'Say her name',
        hudLabel: 'Name response',
        hotspotAria: 'Say Tay\'s name and count how long she takes to respond',
        techPrompt: "Last one. Say her name in your normal voice and count out loud until she reacts. I want the number, even if the number is 'she didn't'.",
        techResponse: "Okay. I have everything I need from you.",
        flashback: {
          leadId: 'shade',
          leadName: 'The Shade That Moved',
          tayName: 'The Best Spot',
          recall: "She picked the coolest spot on the grass and went to sleep in it. Then the afternoon moved the shade off her and nobody moved her back.",
          link: "Twenty-seven minutes asleep in full sun. She has been climbing since before you noticed anything."
        }
      }
    };

    // Beat 2A payoff: the four Act 1 leads, restated as a case history with times.
    this.hintsTimeline = [
      { time: '1:30 PM', icon: '🥪', title: 'The cooler, in open sun', line: 'She parked herself against it for ninety minutes. No shade.' },
      { time: '1:48 PM', icon: '☀️', title: 'The dock', line: '137°F boards. She patrolled the length of them twice.' },
      { time: '2:03 PM', icon: '🥣', title: 'The water bowl', line: 'Sun-warm, half empty, untouched. No water since the car.' },
      { time: '2:38 PM', icon: '🌳', title: 'The shade that moved', line: 'Asleep for twenty-seven minutes while the shade crept off her.' }
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
            result: "You haul the canopy over her and start fanning with your shirt. Wes drops the umbrella from his chair on the other side of her. She is out of the sun in about eight seconds.",
            stamp: {
              metric: 'Shade first, then airflow',
              line: "Stop the heat going in before you start taking heat out. Moving air over a panting dog cools her, and it costs nothing."
            }
          },
          {
            id: 'straight_water',
            label: 'Pick her up and get her into the lake right now',
            correct: false,
            consequence: "You carry her twenty feet across open sand in full sun to get there. She goes heavy in your arms halfway. The whole trip she is still absorbing heat.",
            correction: "Shade and airflow first. It costs ten seconds and it stops the heat load while you set everything else up. The water is not going anywhere."
          }
        ]
      },
      {
        id: 'water_source',
        stepLabel: 'Water source',
        smePending: true,
        techPrompt: "Now water. What have you got, and what are you using?",
        wesLine: "I've got a whole chest of ice right here. Pack it on her — cool her down fast.",
        wesPivot: "…Lake water. Yeah. Okay, I'm on it.",
        options: [
          {
            id: 'lake_water',
            label: 'Cool lake water, twenty feet away',
            correct: true,
            result: "You send Wes for the lake with the towel and the bowl. The water is 72°F — cool, not cold. It is the one thing at this lake Tay looked at four times and walked away from.",
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
            consequence: "Wes has the lid open before you finish the sentence. Ice against her skin makes the surface vessels clamp down, and heat that needs to leave her core stays in it. She feels cold to your hand and is no cooler inside.",
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
            result: "You turn her enough to get the wet towel against her belly and press cool water into her armpits and groin, then her paws. Wes keeps running the towel back to the lake.",
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
            result: "You hold the bowl under her chin. She takes three shallow laps, stops, and puts her head back down. You let her.",
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
        stepLabel: 'Covering her for the drive',
        techPrompt: "Get her in the car. What is on her when you do?",
        wesLine: "Wrap her up good and tight. Keep the cold on her the whole way in.",
        wesPivot: "Loose. Re-wet it. Got it — take my cap for the water.",
        options: [
          {
            id: 'wet_towel_rewet',
            label: 'A cool wet towel laid over her, and you plan to re-wet it',
            correct: true,
            result: "You lay the soaked towel across her belly and flank, loose, and put the bowl in the footwell to re-wet it from. Wes wrings out a second one and drops it on the passenger seat.",
            stamp: {
              metric: 'Wet towel, re-wet often',
              line: "A cool wet towel is the practical option in a car. It only works while it is still cool — the towel is a tool, not a blanket."
            }
          },
          {
            id: 'wrap_and_leave',
            label: 'Wrap her up tight in it and leave it on for the drive',
            correct: false,
            consequence: "Twelve minutes into the drive that towel is at her body temperature and wrapped around her. It has stopped taking heat away and started holding it in — you have insulated her.",
            correction: "Lay it on loose, and re-wet or swap it as it warms. A towel left in place stops cooling and starts trapping."
          }
        ]
      }
    ];

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.tickTowel = this.tickTowel.bind(this);
    this.tickElapsed = this.tickElapsed.bind(this);
  }

  // =======================================================================
  // LIFECYCLE
  // =======================================================================

  mount() {
    this.container = document.getElementById('screen-act2');
    if (!this.container) return;

    this.render();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  unmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.stopElapsedClock();
    this.stopTowelTimer();
  }

  isEditModeActive() {
    return document.body.classList.contains('edit-mode-active');
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
      ['#act2-btn-check-next', '#act2-btn-report-check', '#act2-btn-next-step', '#act2-btn-report-all']
    );
    const dialog = this.container?.querySelector('[role="dialog"]');
    if (dialog) containFocusIn(dialog);
  }

  renderNow() {
    if (!this.container) return;

    const { saturationDrop, heatOpacity, severity } = this.getEscalation();
    const isTransport = this.currentBeat === 'transport';

    this.container.innerHTML = `
      <div class="act2-container" data-editor-id="act2-screen-container">

        <!-- Main 16:9 Viewport Stage — matches Act 1's card so the product reads as one piece.
             Act 2's camera is at Callie's standing eyeline, so there is no low-cam tilt. -->
        <div
          id="act2-card"
          class="act2-viewport-card ${isTransport ? 'in-car' : 'at-lake'}"
          data-editor-id="act2-viewport-card"
          style="--act2-saturation-drop: ${saturationDrop}%; --act2-heat-opacity: ${heatOpacity}; --act2-severity: ${severity};"
        >
          ${isTransport ? this.renderCarBackdrop() : `
            <img
              src="Assets/Image/Lake-Blank.jpg"
              alt="Lakeside park landscape, late afternoon"
              class="act2-scene-img"
              data-editor-id="act2-lake-img"
            />
          `}

          <!-- Heat / palette-drain wash -->
          <div class="act2-heat-wash" data-editor-id="act2-heat-wash" aria-hidden="true"></div>

          <!-- Persistent Top HUD Bar -->
          ${this.renderHudBar()}

          <!-- In-scene layer: Tay on the ground, Callie, Wes, the observation hotspots -->
          ${this.renderSceneLayer()}

          <!-- Dialogue / modal layer -->
          <div class="act2-speech-layer" data-editor-id="act2-speech-layer">
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

    if (this.currentBeat === 'transport') {
      this.startTowelTimer();
    } else {
      this.stopTowelTimer();
    }
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
                  title="Return to Title" aria-label="Return to the title screen">🏠 Title</button>
        </div>

        <div class="act2-hud-group">
          <div class="act2-hud-pill clock-pill" data-editor-id="act2-hud-clock" title="Lake time">
            <span aria-hidden="true">🕒</span>
            <span>${timeStr}</span>
          </div>

          ${this.clockVisible ? `
            <div class="act2-hud-pill elapsed-pill" data-editor-id="act2-hud-elapsed"
                 role="timer" aria-label="Time since you decided to act">
              <span aria-hidden="true">⏱</span>
              <span>SINCE YOU DECIDED</span>
              <span id="act2-elapsed-text" class="elapsed-value">${this.getFormattedElapsed()}</span>
            </div>
          ` : ''}

          ${this.hintsCashedOut ? `
            <div class="act2-hud-pill hints-cashed-pill" data-editor-id="act2-hud-hints"
                 aria-label="Four warning signs from Act 1, all reported to the clinic">
              <span aria-hidden="true">⚠️</span>
              <span>HINTS DROPPED: ${this.hintsDropped} — REPORTED</span>
            </div>
          ` : `
            <div class="act2-hud-pill hints-pill" data-editor-id="act2-hud-hints"
                 aria-label="Four warning signs dropped during Act 1, not yet reported">
              <span aria-hidden="true">⚠️</span>
              <span>HINTS DROPPED: ${this.hintsDropped}</span>
            </div>
          `}

          ${['call', 'checks', 'check_active', 'gate', 'payoff'].includes(this.currentBeat) ? `
            <div class="act2-hud-pill checks-pill ${allReported ? 'all-done' : ''}"
                 data-editor-id="act2-hud-checks"
                 aria-label="${reported} of 4 observations reported">
              <span aria-hidden="true">👁</span>
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

  // PLACEHOLDER ART — Tay, down on the grass at Callie's eyeline (not Act 1's low cam).
  renderTayDown() {
    const still = this.prefersReducedMotion() ? 'is-still' : '';
    return `
      <svg class="act2-tay-svg ${still}" viewBox="0 0 300 150" data-editor-id="act2-art-tay"
           role="img" aria-label="Tay lying flat on her side on the grass, panting">
        <ellipse cx="150" cy="136" rx="112" ry="13" fill="rgba(30, 41, 30, 0.3)" />
        <path d="M228,116 C244,111 258,116 260,125 C262,134 248,136 232,133 Z" fill="#2C3033" />
        <path d="M246,102 C262,96 274,100 272,111 C270,118 260,116 253,109 Z" fill="#2C3033" />
        <g class="act2-tay-chest">
          <path d="M70,122 C64,92 92,72 136,72 C188,72 230,88 240,112 C245,125 236,134 218,135 L92,135 C76,135 71,130 70,122 Z" fill="#34383B" />
          <path d="M104,135 C97,121 104,105 120,101 C134,97 145,105 147,118 C148,128 142,135 133,135 Z" fill="#FFFFFF" />
        </g>
        <path d="M70,126 C54,124 38,128 36,134 C35,139 43,141 57,140 L86,138 Z" fill="#34383B" />
        <path d="M66,138 C55,138 46,139 41,140 C48,142 59,142 68,141 Z" fill="#43484B" />
        <g class="act2-tay-head">
          <path d="M44,110 C37,95 48,80 68,78 C90,76 106,87 107,104 C108,120 95,130 74,130 C56,130 48,123 44,110 Z" fill="#34383B" />
          <path d="M65,80 C60,63 67,50 76,50 C85,50 89,63 86,80 Z" fill="#34383B" />
          <path d="M70,77 C66,65 70,56 76,56 C82,56 84,65 82,77 Z" fill="#DC7F77" />
          <path d="M95,82 C95,67 102,56 110,58 C117,60 117,73 110,86 Z" fill="#2C3033" />
          <path d="M44,112 C37,104 39,93 48,89 C59,84 72,89 74,100 C76,113 65,121 54,120 C48,119 46,116 44,112 Z" fill="#FFFFFF" />
          <ellipse cx="45" cy="102" rx="7.5" ry="6" fill="#1A1D1F" />
          <ellipse cx="70" cy="96" rx="5" ry="4.4" fill="#1A1D1F" />
          <path d="M48,113 C55,120 66,120 71,114" stroke="#1A1D1F" stroke-width="2.2" fill="none" stroke-linecap="round" />
          <path class="act2-tay-tongue" d="M54,118 C60,118 64,121 62,127 C60,132 53,131 52,125 Z" fill="#DC7F77" />
        </g>
      </svg>
    `;
  }

  // PLACEHOLDER ART — Callie, crouched, phone to her ear.
  renderCallieCrouched() {
    return `
      <svg class="act2-callie-svg" viewBox="0 0 200 260" data-editor-id="act2-art-callie"
           role="img" aria-label="Callie crouched beside Tay with a phone to her ear">
        <ellipse cx="100" cy="248" rx="66" ry="11" fill="rgba(30, 41, 30, 0.28)" />
        <path d="M64,150 C58,196 62,232 70,244 L104,244 C100,214 100,182 104,158 Z" fill="#2F5D7C" />
        <path d="M104,150 C118,190 126,224 128,244 L96,244 C94,212 92,180 92,156 Z" fill="#35688A" />
        <path d="M60,86 C62,64 82,52 102,54 C124,56 138,74 136,98 L134,152 C132,166 116,172 98,171 C76,170 62,162 60,146 Z" fill="#6E93AE" />
        <path d="M78,72 C86,80 96,84 108,84 C118,84 126,80 132,74 L134,96 C122,102 96,102 78,94 Z" fill="#B5563C" opacity="0.55" />
        <path d="M60,100 C46,126 42,150 44,168 C46,178 58,180 62,170 C66,152 70,130 76,116 Z" fill="#6E93AE" />
        <path d="M136,100 C150,122 156,140 152,150 C148,158 138,156 134,148 C130,134 128,118 126,108 Z" fill="#6E93AE" />
        <circle cx="152" cy="150" r="10" fill="#8A5A3E" />
        <circle cx="52" cy="172" r="10" fill="#8A5A3E" />
        <path d="M76,26 C76,8 122,8 124,28 C126,44 122,52 116,56 C104,62 92,62 84,56 C78,52 76,42 76,26 Z" fill="#8A5A3E" />
        <path d="M72,26 C72,4 128,2 130,28 C132,50 128,64 126,86 C124,110 132,140 128,160 L136,160 C144,120 142,80 140,52 C138,20 116,-2 96,2 C80,5 70,14 72,26 Z" fill="#141013" />
        <path d="M64,30 C58,58 56,96 58,132 C59,152 56,164 52,172 L44,168 C50,140 50,96 52,62 C54,38 58,28 64,30 Z" fill="#141013" />
        <ellipse cx="97" cy="40" rx="3.4" ry="4.4" fill="#141013" />
        <ellipse cx="113" cy="40" rx="3.4" ry="4.4" fill="#141013" />
        <rect x="118" y="30" width="12" height="24" rx="4" fill="#27211E" transform="rotate(12 124 42)" />
      </svg>
    `;
  }

  // PLACEHOLDER ART — Wes, the friend at the lake. Distinct silhouette: broad, ball cap,
  // sunglasses on the forehead, sage trunks, white tank. Per the Visual Asset Brief.
  renderWesFigure(state = 'idle') {
    return `
      <svg class="act2-wes-svg wes-${state}" viewBox="0 0 160 300" data-editor-id="act2-art-wes"
           role="img" aria-label="Wes, Callie's friend at the lake, standing by the cooler">
        <ellipse cx="80" cy="288" rx="46" ry="9" fill="rgba(30, 41, 30, 0.26)" />
        <rect x="60" y="196" width="20" height="86" rx="8" fill="#9C6A4A" />
        <rect x="84" y="196" width="20" height="86" rx="8" fill="#8A5C3F" />
        <path d="M52,150 C52,178 56,196 60,204 L104,204 C108,192 110,170 110,150 Z" fill="#7C9A6B" />
        <path d="M46,92 C46,74 60,64 80,64 C100,64 116,74 116,92 L114,154 C100,160 62,160 48,154 Z" fill="#F7F4EE" />
        <path d="M44,96 C32,120 28,142 30,156 C31,166 42,168 46,158 C50,142 54,120 58,110 Z" fill="#C08A62" />
        <path d="M118,96 C132,118 138,140 136,154 C135,164 124,166 120,156 C116,140 112,118 108,108 Z" fill="#C08A62" />
        <circle cx="36" cy="162" r="10" fill="#C08A62" />
        <circle cx="128" cy="160" r="10" fill="#C08A62" />
        <path d="M58,36 C58,18 102,18 104,38 C106,56 100,66 90,68 C76,70 62,64 60,52 Z" fill="#C08A62" />
        <path d="M62,54 C68,66 96,66 102,54 C104,64 98,72 82,72 C66,72 60,64 62,54 Z" fill="#4A3428" />
        <path d="M54,32 C54,12 110,10 110,32 L110,38 L54,38 Z" fill="#3F5F49" />
        <path d="M108,34 L142,40 L142,32 L108,26 Z" fill="#3F5F49" />
        <rect x="58" y="24" width="48" height="9" rx="4" fill="#27211E" />
        <ellipse cx="72" cy="50" rx="3" ry="3.6" fill="#27211E" />
        <ellipse cx="92" cy="50" rx="3" ry="3.6" fill="#27211E" />
      </svg>
    `;
  }

  // PLACEHOLDER ART — the ice chest Wes keeps reaching for.
  renderIceChest() {
    return `
      <svg class="act2-cooler-svg" viewBox="0 0 140 100" data-editor-id="act2-art-ice-chest" aria-hidden="true">
        <ellipse cx="70" cy="90" rx="58" ry="9" fill="rgba(30, 41, 30, 0.3)" />
        <rect x="18" y="30" width="104" height="54" rx="9" fill="#3E7C93" />
        <rect x="28" y="46" width="84" height="30" rx="5" fill="#2E6274" />
        <rect x="12" y="16" width="116" height="18" rx="6" fill="#F3EDE4" />
        <rect x="62" y="26" width="16" height="12" rx="3" fill="#B5563C" />
      </svg>
    `;
  }

  // PLACEHOLDER ART — phone call UI. Used as the frame for the whole 2A triage sequence.
  renderPhoneUi(bodyHtml, { status = 'On call' } = {}) {
    return `
      <div class="act2-phone" data-editor-id="act2-art-phone">
        <div class="act2-phone-bezel" data-editor-id="act2-art-phone-bezel">
          <div class="act2-phone-header" data-editor-id="act2-phone-header">
            <span class="act2-phone-avatar" aria-hidden="true">🏥</span>
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
  // COLOURBLIND SAFETY (Craft doc, and the single most important observation in the act):
  // gum state is NEVER carried by colour alone. Every gum render pairs the swatch with
  //   (a) a written colour label,
  //   (b) an SVG fill PATTERN that differs between states,
  //   (c) the capillary refill TIME in seconds against the printed normal range,
  //   (d) a severity word ("Abnormal").
  // Remove any one of those and the check still reads. Remove the colour and it still reads.
  renderGumArt(v) {
    const patternId = `act2-gum-${v.gumPattern}`;
    return `
      <div class="act2-check-art" data-editor-id="act2-art-gums">
        <svg viewBox="0 0 320 190" class="act2-check-svg" role="img"
             aria-label="Close-up of Tay's lifted lip. Gums: ${v.gumLabel}. Capillary refill ${v.refillSeconds} seconds, normal is under 2 seconds.">
          <defs>
            <pattern id="${patternId}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              ${v.gumPattern === 'hatch'
                ? '<rect width="4" height="10" fill="rgba(255,255,255,0.34)" />'
                : '<circle cx="3" cy="3" r="2.2" fill="rgba(255,255,255,0.34)" />'}
            </pattern>
          </defs>
          <rect width="320" height="190" rx="14" fill="#F3E4DA" />
          <path d="M22,150 C40,96 100,66 162,66 C226,66 288,96 300,150 Z" fill="#4A3430" />
          <path d="M46,150 C60,108 108,86 162,86 C216,86 264,108 278,150 Z" fill="${v.gumSwatch}" />
          <path d="M46,150 C60,108 108,86 162,86 C216,86 264,108 278,150 Z" fill="url(#${patternId})" />
          <path d="M92,150 C100,124 128,112 162,112 C196,112 224,124 232,150 Z" fill="#F6F1E8" />
          <ellipse cx="162" cy="160" rx="72" ry="16" fill="#C77C74" />
          <circle class="act2-gum-press" cx="118" cy="118" r="15" fill="#F6F1E8" opacity="0.9" />
          <path d="M0,166 C60,150 118,146 162,146 C206,146 262,150 320,166 L320,190 L0,190 Z" fill="#2E2320" />
        </svg>

        <!-- The refill-time counter: the colourblind-safe half of this observation. -->
        <div class="act2-refill-counter" data-editor-id="act2-art-refill-counter"
             role="group" aria-label="Capillary refill time">
          <div class="act2-refill-head">
            <span class="act2-refill-title">Capillary refill</span>
            <span class="act2-refill-normal">normal ${v.refillNormal}</span>
          </div>
          <div class="act2-refill-track">
            <span class="act2-refill-normal-marker" aria-hidden="true"></span>
            <span class="act2-refill-fill" style="--refill-pct: ${Math.min(100, (parseFloat(v.refillSeconds) / 5) * 100)}%"></span>
          </div>
          <div class="act2-refill-readout">
            <strong class="act2-refill-value">${v.refillSeconds} s</strong>
            <span class="act2-refill-flag">${v.gumSeverityWord}</span>
          </div>
        </div>

        <dl class="act2-check-readout" data-editor-id="act2-readout-gums">
          <div><dt>Colour</dt><dd>${v.gumLabel}</dd></div>
          <div><dt>Refill</dt><dd>${v.refillSeconds} seconds (normal ${v.refillNormal})</dd></div>
        </dl>
      </div>
    `;
  }

  // PLACEHOLDER ART — ear closeup, hands cupped around it.
  renderEarArt(v) {
    return `
      <div class="act2-check-art" data-editor-id="act2-art-ears">
        <svg viewBox="0 0 320 190" class="act2-check-svg" role="img"
             aria-label="Close-up of Callie's hands cupping Tay's bat ear. ${v.earLabel}">
          <rect width="320" height="190" rx="14" fill="#F3E4DA" />
          <path d="M132,168 C118,120 128,62 160,44 C192,62 202,120 188,168 Z" fill="#34383B" />
          <path d="M144,162 C134,124 142,78 160,66 C178,78 186,124 176,162 Z" fill="#DC7F77" />
          <path d="M60,190 C56,140 84,112 122,116 C140,118 142,140 128,146 C104,156 96,172 96,190 Z" fill="#C89A78" />
          <path d="M260,190 C264,140 236,112 198,116 C180,118 178,140 192,146 C216,156 224,172 224,190 Z" fill="#C89A78" />
          <g class="act2-heat-lines" aria-hidden="true">
            <path d="M150,36 C158,22 144,14 152,2" stroke="#C2410C" stroke-width="4" fill="none" stroke-linecap="round" />
            <path d="M172,38 C180,24 166,16 174,4" stroke="#C2410C" stroke-width="4" fill="none" stroke-linecap="round" />
          </g>
        </svg>
        <dl class="act2-check-readout" data-editor-id="act2-readout-ears">
          <div><dt>Feel</dt><dd>${v.earLabel}</dd></div>
          <div><dt>Compare</dt><dd>Warmer than the back of your own neck</dd></div>
        </dl>
      </div>
    `;
  }

  // PLACEHOLDER ART — panting rhythm, as a moving trace so rhythm reads without sound.
  renderPantingArt(v) {
    const still = this.prefersReducedMotion() ? 'is-still' : '';
    return `
      <div class="act2-check-art" data-editor-id="act2-art-panting">
        <svg viewBox="0 0 320 190" class="act2-check-svg" role="img"
             aria-label="Tay's rib cage rising and falling. ${v.pantLabel} About ${v.pantRate} breaths per minute.">
          <rect width="320" height="190" rx="14" fill="#F3E4DA" />
          <path d="M20,150 C30,104 80,80 150,80 C222,80 288,106 300,150 Z" fill="#34383B" />
          <path d="M96,150 C90,124 104,104 128,100 C150,97 164,110 166,130 C168,142 160,150 150,150 Z" fill="#FFFFFF" />
          <g class="act2-pant-trace ${still}">
            <polyline points="16,58 44,40 60,58 88,40 104,58 132,40 148,58 176,40 192,58 220,40 236,58 264,40 280,58 308,40"
                      fill="none" stroke="#C2410C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
          </g>
        </svg>
        <dl class="act2-check-readout" data-editor-id="act2-readout-panting">
          <div><dt>Rhythm</dt><dd>${v.pantLabel}</dd></div>
          <div><dt>Rate</dt><dd>About ${v.pantRate} breaths per minute — she never closes her mouth</dd></div>
        </dl>
      </div>
    `;
  }

  // PLACEHOLDER ART — name response, as a counting strip. The subtitle bar is EMPTY here,
  // and that emptiness is the point: in Act 1 this space was never empty.
  renderNameArt(v) {
    const delay = Math.round(3 + Math.max(0, Math.min(1, this.severity)) * 5);
    const ticks = [1, 2, 3, 4, 5, 6, 7, 8];
    return `
      <div class="act2-check-art" data-editor-id="act2-art-name">
        <svg viewBox="0 0 320 190" class="act2-check-svg" role="img"
             aria-label="Callie says Tay's name. Response ${v.responseWord}. ${v.responseLabel}">
          <rect width="320" height="190" rx="14" fill="#F3E4DA" />
          <path d="M30,164 C44,120 96,96 160,96 C226,96 286,122 298,164 Z" fill="#34383B" />
          <path d="M56,148 C50,124 62,108 84,106 C104,104 116,116 118,132 C120,144 112,150 102,150 Z" fill="#FFFFFF" />
          <ellipse cx="86" cy="126" rx="6" ry="5" fill="#1A1D1F" />
          <rect x="40" y="24" width="240" height="42" rx="10" fill="#2E2320" opacity="0.9" />
          <text x="160" y="50" text-anchor="middle" font-family="Outfit, sans-serif" font-size="17"
                font-weight="700" fill="#8C807A">— no response —</text>
        </svg>
        <div class="act2-count-strip" data-editor-id="act2-art-name-counter"
             role="group" aria-label="Seconds counted before Tay responded: ${v.responseWord.toLowerCase()} after ${delay} seconds">
          ${ticks.map(n => `
            <span class="act2-count-tick ${n <= delay ? 'counted' : ''} ${n === delay ? 'is-final' : ''}">${n}</span>
          `).join('')}
        </div>
        <dl class="act2-check-readout" data-editor-id="act2-readout-name">
          <div><dt>Response</dt><dd>${v.responseWord} — ${delay} seconds and counting</dd></div>
          <div><dt>What you see</dt><dd>${v.responseLabel}</dd></div>
        </dl>
      </div>
    `;
  }

  // PLACEHOLDER ART — the towel, tinted by how warm it has become.
  renderTowelArt(warmth) {
    const warm = Math.max(0, Math.min(100, warmth));
    const cool = '#5E9BB0';
    const hot = '#C2410C';
    return `
      <svg class="act2-towel-svg" viewBox="0 0 220 120" data-editor-id="act2-art-towel"
           role="img" aria-label="The wet towel across Tay. Warmth ${Math.round(warm)} percent of the way to her body temperature.">
        <defs>
          <linearGradient id="act2-towel-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${cool}" />
            <stop offset="${warm}%" stop-color="${warm > 55 ? hot : cool}" />
            <stop offset="100%" stop-color="${warm > 55 ? hot : cool}" />
          </linearGradient>
        </defs>
        <path d="M16,84 C40,52 84,36 128,38 C172,40 202,56 210,82 C196,102 150,112 110,110 C70,108 32,100 16,84 Z"
              fill="url(#act2-towel-grad)" />
        <path d="M30,80 C58,58 96,50 132,52" stroke="rgba(255,255,255,0.45)" stroke-width="5" fill="none" stroke-linecap="round" />
        <path d="M46,94 C78,74 118,68 154,72" stroke="rgba(255,255,255,0.28)" stroke-width="5" fill="none" stroke-linecap="round" />
      </svg>
    `;
  }

  // PLACEHOLDER ART — car interior backdrop for Beat 2D.
  renderCarBackdrop() {
    return `
      <svg class="act2-car-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"
           data-editor-id="act2-art-car-interior" aria-hidden="true">
        <rect width="1600" height="900" fill="#2A2320" />
        <rect x="120" y="70" width="1360" height="380" rx="26" fill="#8FB6C4" />
        <path d="M120,300 C420,240 900,232 1480,300 L1480,450 L120,450 Z" fill="#7CA294" />
        <rect x="120" y="430" width="1360" height="70" rx="14" fill="#3A302B" />
        <rect x="80" y="500" width="1440" height="120" rx="24" fill="#4A3D36" />
        <rect x="180" y="530" width="360" height="60" rx="14" fill="#3A302B" />
        <rect x="1060" y="530" width="360" height="60" rx="14" fill="#3A302B" />
        <rect x="0" y="620" width="1600" height="280" fill="#5A4A41" />
        <rect x="120" y="660" width="1360" height="200" rx="30" fill="#6B584D" />
      </svg>
    `;
  }

  // =======================================================================
  // RENDER — SCENE LAYER
  // =======================================================================

  renderSceneLayer() {
    if (this.currentBeat === 'transport') return '';

    // The four observation hotspots are live only while the checks hub is on screen.
    const hotspotsLive = this.currentBeat === 'checks';
    const showWes = ['cooling', 'checks', 'gate', 'payoff', 'decision', 'waiting'].includes(this.currentBeat);
    const wesActive = this.currentBeat === 'cooling'
      && this.coolingSteps[this.coolingIndex]?.wesLine
      && !this.coolingFeedback;

    return `
      <div class="act2-scene-layer" data-editor-id="act2-scene-layer">

        <!-- Wes and his cooler, planted at the edge of frame. He is never an obstacle. -->
        ${showWes ? `
          <div class="act2-wes-group ${wesActive ? 'is-speaking' : ''}" data-editor-id="act2-wes-group">
            ${this.renderWesFigure(wesActive ? 'speaking' : 'idle')}
            <div class="act2-cooler-prop" data-editor-id="act2-cooler-prop">${this.renderIceChest()}</div>
          </div>
        ` : ''}

        <div class="act2-callie-group" data-editor-id="act2-callie-group">
          ${this.renderCallieCrouched()}
        </div>

        <div class="act2-tay-group" data-editor-id="act2-tay-group">
          ${this.renderTayDown()}
          ${hotspotsLive ? this.renderCheckHotspots() : ''}
        </div>

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
              <span class="act2-hotspot-icon" aria-hidden="true">${done ? '✓' : check.icon}</span>
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

    if (step.type === 'silence') {
      return `
        <div class="act2-silence-card" data-editor-id="act2-silence-card" role="note">
          <span class="act2-silence-mark" aria-hidden="true">—</span>
          <p class="act2-silence-line">Tay stops narrating.</p>
          <p class="act2-silence-sub">
            You will not hear from her again until the clinic. From here you only have
            what you can see, touch, and count.
          </p>
        </div>
      `;
    }

    if (step.speaker === 'tay_final') {
      return `
        <div class="speech-bubble tay-bubble act2-tay-final-bubble"
             style="top: 46%; left: 12%; max-width: min(300px, 24vw);"
             data-editor-id="act2-tay-final-bubble">
          <div class="speech-bubble-speaker">
            <span aria-hidden="true">🐶</span>
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
      <div class="speech-bubble callie-bubble act2-callie-bubble"
           style="top: 20%; left: 40%; max-width: min(360px, 28vw);"
           data-editor-id="act2-arrival-callie-bubble">
        <div class="speech-bubble-speaker">
          <span aria-hidden="true">👩</span>
          <span>Callie</span>
        </div>
        <p class="speech-bubble-text">
          <span class="callie-dialogue">"${step.text}"</span>
        </p>
      </div>
    `;
  }

  // ---- Beat 2A: the call ------------------------------------------------
  renderCall() {
    const step = this.callSteps[this.stepIndex];
    if (!step) return '';

    const isDialing = step.speaker === 'system';
    const body = isDialing
      ? `<p class="act2-phone-dialing">${step.text}</p>`
      : `
        <div class="act2-phone-line line-${step.speaker}">
          <span class="act2-phone-line-who">${step.speaker === 'tech' ? 'Marcus · Vet Tech' : 'Callie'}</span>
          <p class="act2-phone-line-text">"${step.text}"</p>
        </div>
      `;

    return `
      <div class="act2-call-panel" data-editor-id="act2-call-panel">
        ${this.renderPhoneUi(body, { status: isDialing ? 'Dialling…' : 'On call' })}
      </div>
    `;
  }

  // ---- Beat 2A: the checks hub -----------------------------------------
  renderChecksHub() {
    const remaining = Object.values(this.checksData).filter(c => !this.checksDone.has(c.id));
    const nextPrompt = remaining.length
      ? remaining[0].techPrompt
      : "That's all four. Stay on the line with me.";

    const body = `
      <div class="act2-phone-line line-tech">
        <span class="act2-phone-line-who">Marcus · Vet Tech</span>
        <p class="act2-phone-line-text">"${remaining.length
          ? "Whichever one you can get to. I'll take them in any order."
          : "That's all four. Stay on the line."}"</p>
      </div>
      <ul class="act2-triage-list" data-editor-id="act2-triage-list">
        ${Object.values(this.checksData).map(c => {
          const done = this.checksDone.has(c.id);
          return `
            <li class="act2-triage-item ${done ? 'is-done' : ''}">
              <span class="act2-triage-mark" aria-hidden="true">${done ? '✓' : '○'}</span>
              <span class="act2-triage-label">${c.hudLabel}</span>
              <span class="act2-triage-state">${done ? 'reported' : 'not yet'}</span>
            </li>
          `;
        }).join('')}
      </ul>
      <p class="act2-phone-hint">${remaining.length
        ? 'Click on Tay to take an observation.'
        : 'Tell him you have everything.'}</p>
      <p class="sr-only">${nextPrompt}</p>
    `;

    return `
      <div class="act2-call-panel is-docked" data-editor-id="act2-call-panel">
        ${this.renderPhoneUi(body)}
      </div>
    `;
  }

  // ---- Beat 2A: one check, opened ---------------------------------------
  buildCheckSteps(checkId) {
    const check = this.checksData[checkId];
    if (!check) return [];
    return [
      { type: 'prompt', text: check.techPrompt },
      { type: 'observe' },
      { type: 'flashback' },
      { type: 'response', text: check.techResponse }
    ];
  }

  renderCheckActive() {
    const check = this.checksData[this.activeCheckId];
    if (!check) return '';

    const v = this.getVitals();
    const steps = this.buildCheckSteps(this.activeCheckId);
    const idx = Math.min(this.checkStepIndex, steps.length - 1);
    const step = steps[idx];
    const isLast = idx === steps.length - 1;

    const artByCheck = {
      gums: () => this.renderGumArt(v),
      ears: () => this.renderEarArt(v),
      panting: () => this.renderPantingArt(v),
      name: () => this.renderNameArt(v)
    };

    let bodyHtml = '';
    if (step.type === 'prompt' || step.type === 'response') {
      bodyHtml = `
        <div class="act2-check-tech-line" data-editor-id="act2-check-tech-line">
          <span class="act2-phone-line-who">Marcus · Vet Tech</span>
          <p class="act2-phone-line-text">"${step.text}"</p>
        </div>
        ${step.type === 'response' ? artByCheck[this.activeCheckId]() : ''}
      `;
    } else if (step.type === 'observe') {
      bodyHtml = artByCheck[this.activeCheckId]();
    } else if (step.type === 'flashback') {
      bodyHtml = this.renderFlashback(check.flashback);
    }

    // Modal semantics per docs/design-language.md §7.4: role="dialog", aria-modal,
    // aria-labelledby pointing at the title, Escape closes (see handleKeyDown), and focus
    // is moved in on open / restored to the opening hotspot on close (see openCheck/closeCheck).
    return `
      <div class="act2-check-modal" data-editor-id="act2-check-modal" role="dialog"
           aria-modal="true" aria-labelledby="act2-check-title">
        <div class="act2-check-card" data-editor-id="act2-check-card">

          <div class="act2-check-header">
            <div class="act2-check-badge" id="act2-check-title">
              <span aria-hidden="true">${check.icon}</span>
              <span>${check.label.toUpperCase()}</span>
            </div>
            <button id="act2-btn-check-close" class="act2-check-close"
                    data-editor-id="act2-btn-check-close"
                    aria-label="Close this observation and go back to Tay">✕ Back to Tay</button>
          </div>

          <div class="act2-check-body" data-editor-id="act2-check-body">
            ${bodyHtml}
          </div>

          <nav class="act2-check-nav">
            <div class="act2-beat-dots" aria-hidden="true">
              ${steps.map((s, i) => `
                <span class="act2-beat-dot ${i === idx ? 'current' : ''} ${i < idx ? 'seen' : ''}"></span>
              `).join('')}
            </div>
            ${isLast ? `
              <button id="act2-btn-report-check" class="act2-hud-btn btn-action-primary pulse-btn"
                      data-editor-id="act2-btn-report-check">Report it ➔</button>
            ` : `
              <button id="act2-btn-check-next" class="act2-hud-btn btn-action-primary"
                      data-editor-id="act2-btn-check-next">Next ▶</button>
            `}
          </nav>

        </div>
      </div>
    `;
  }

  // Each check flashes back to the Act 1 lead the learner clicked themselves.
  renderFlashback(fb) {
    return `
      <div class="act2-flashback" data-editor-id="act2-flashback-${fb.leadId}">
        <div class="act2-flashback-header">
          <span class="act2-flashback-tag">Act 1 · you clicked this</span>
          <span class="act2-flashback-name">${fb.leadName}</span>
        </div>
        <div class="act2-flashback-body">
          ${this.renderFlashbackArt(fb.leadId)}
          <div class="act2-flashback-copy">
            <p class="act2-flashback-tay">She called it “${fb.tayName}”.</p>
            <p class="act2-flashback-recall">${fb.recall}</p>
            <p class="act2-flashback-link">${fb.link}</p>
          </div>
        </div>
      </div>
    `;
  }

  // PLACEHOLDER ART — thumbnail recalls of the four Act 1 leads.
  renderFlashbackArt(leadId) {
    const art = {
      cooler: `
        <rect x="10" y="34" width="100" height="46" rx="8" fill="#3E7C93" />
        <rect x="6" y="22" width="108" height="16" rx="5" fill="#F3EDE4" />
        <circle cx="92" cy="18" r="14" fill="#F2C879" />`,
      dock: `
        <rect width="120" height="46" y="0" fill="#8FB6C4" />
        <rect y="46" width="120" height="54" fill="#3E7C93" />
        <polygon points="42,20 78,20 106,96 14,96" fill="#8A5C3F" />
        <polygon points="46,30 74,30 78,46 42,46" fill="#C98A4B" />
        <polygon points="42,50 78,50 84,70 36,70" fill="#A9702F" />`,
      bowl: `
        <ellipse cx="60" cy="86" rx="42" ry="10" fill="rgba(30,41,30,0.28)" />
        <path d="M20,40 L28,76 C31,82 89,82 92,76 L100,40 Z" fill="#94A3B8" />
        <ellipse cx="60" cy="40" rx="40" ry="13" fill="#CBD5E1" />
        <ellipse cx="60" cy="62" rx="20" ry="6" fill="#5E9BB0" />`,
      shade: `
        <rect width="120" height="100" fill="#C8D9A8" />
        <polygon points="18,44 102,44 110,30 10,30" fill="#E2D4C3" />
        <rect x="16" y="44" width="6" height="46" fill="#7A5236" />
        <rect x="98" y="44" width="6" height="46" fill="#7A5236" />
        <ellipse cx="86" cy="82" rx="30" ry="10" fill="rgba(36,52,36,0.3)" />
        <circle cx="26" cy="16" r="12" fill="#F2C879" />`
    };
    return `
      <svg class="act2-flashback-art" viewBox="0 0 120 100" data-editor-id="act2-flashback-art-${leadId}" aria-hidden="true">
        ${art[leadId] || ''}
      </svg>
    `;
  }

  // ---- Beat 2A: gate ----------------------------------------------------
  renderGate() {
    const missing = Object.values(this.checksData)
      .filter(c => !this.checksDone.has(c.id))
      .map(c => c.hudLabel);

    const body = `
      <div class="act2-phone-line line-tech">
        <span class="act2-phone-line-who">Marcus · Vet Tech</span>
        <p class="act2-phone-line-text">"Not yet. I still need ${missing.length === 1
          ? 'one more thing'
          : `${missing.length} more`} before I can tell you anything useful."</p>
      </div>
      <ul class="act2-triage-list" data-editor-id="act2-gate-list">
        ${missing.map(m => `
          <li class="act2-triage-item is-missing">
            <span class="act2-triage-mark" aria-hidden="true">○</span>
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
          <span class="act2-phone-line-who">Marcus · Vet Tech</span>
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
          <span class="act2-payoff-badge">Hints Dropped · 4 / 4</span>
          <h2 class="act2-payoff-title">It has been going on since 1:30 this afternoon.</h2>
        </div>
        <ol class="act2-payoff-timeline" data-editor-id="act2-payoff-timeline">
          ${this.hintsTimeline.map(item => `
            <li class="act2-payoff-item">
              <span class="act2-payoff-time">${item.time}</span>
              <span class="act2-payoff-icon" aria-hidden="true">${item.icon}</span>
              <span class="act2-payoff-copy">
                <strong>${item.title}</strong>
                <span>${item.line}</span>
              </span>
            </li>
          `).join('')}
        </ol>
        <p class="act2-payoff-tech">
          <span class="act2-phone-line-who">Marcus · Vet Tech</span>
          "Ninety-five minutes of build-up, and everything you just described to me. I'm not
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
           aria-label="The decision: act now, or give her five minutes">
        <span class="act2-decision-badge">Beat 2B · Your call</span>
        <h2 class="act2-decision-title">She's flat on the grass and she isn't answering you.</h2>
        <p class="act2-decision-sub">
          The lake is twenty feet away. The car is forty. Marcus is still on the line.
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
                  aria-label="Give her five minutes to settle">
            <span class="act2-decision-option-title">Give her five minutes to settle</span>
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
            You sit down next to her and put your hand on her side. Wes goes quiet.
            Nothing about the five minutes feels like it's helping, and you watch all of it.
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
            every single thing you were going to do. It is just five minutes worse.
          </p>
        </div>
      `;
    }

    return `
      <div class="act2-call-panel" data-editor-id="act2-call-panel">
        ${this.renderPhoneUi(`
          <div class="act2-phone-line line-tech">
            <span class="act2-phone-line-who">Marcus · Vet Tech</span>
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

    // Feedback panel: consequence + correction for a wrong pick, confirmation for a right one.
    if (this.coolingFeedback) {
      const opt = step.options.find(o => o.id === this.coolingFeedback.optionId);
      if (!opt) return '';
      const correct = !!opt.correct;
      const isLastStep = this.coolingIndex === this.coolingSteps.length - 1;

      return `
        <div class="act2-cool-feedback ${correct ? 'is-right' : 'is-wrong'}"
             data-editor-id="act2-cool-feedback" role="status">
          <div class="act2-cool-feedback-head">
            <span class="act2-cool-feedback-tag">${correct ? '✓ That works' : '✕ That costs her'}</span>
            <span class="act2-cool-step-label">${step.stepLabel}</span>
          </div>

          <p class="act2-cool-feedback-body">${correct ? opt.result : opt.consequence}</p>

          ${correct ? `
            <div class="act2-truth-stamp" data-editor-id="act2-cool-stamp">
              <span class="act2-truth-stamp-metric">${opt.stamp.metric}</span>
              <span class="act2-truth-stamp-line">${opt.stamp.line}</span>
            </div>
            ${step.wesLine && this.wesOverruled ? `
              <p class="act2-wes-line is-pivot" data-editor-id="act2-wes-pivot">
                <span class="act2-wes-who">Wes</span>"${step.wesPivot}"
              </p>
            ` : ''}
          ` : `
            <div class="act2-cool-correction" data-editor-id="act2-cool-correction">
              <span class="act2-cool-correction-tag">What to do instead</span>
              <p>${opt.correction}</p>
            </div>
            <p class="act2-cool-nofail">She is still here. Fix it and keep going.</p>
          `}

          <div class="act2-cool-feedback-footer">
            ${correct ? `
              <button id="act2-btn-cool-next" class="act2-hud-btn btn-action-primary pulse-btn"
                      data-editor-id="act2-btn-cool-next">
                ${isLastStep ? 'Get her in the car ➔' : 'Next ▶'}
              </button>
            ` : `
              <button id="act2-btn-cool-retry" class="act2-hud-btn btn-action-primary"
                      data-editor-id="act2-btn-cool-retry">Try that again ◀</button>
            `}
          </div>
        </div>
      `;
    }

    return `
      <div class="act2-cool-card" data-editor-id="act2-cool-card" role="group"
           aria-label="Cooling step ${this.coolingIndex + 1} of ${this.coolingSteps.length}: ${step.stepLabel}">
        <div class="act2-cool-head">
          <span class="act2-cool-badge">Cooling · ${this.coolingIndex + 1} of ${this.coolingSteps.length}</span>
          <span class="act2-cool-step-label">${step.stepLabel}</span>
        </div>

        <p class="act2-cool-prompt">
          <span class="act2-phone-line-who">Marcus · Vet Tech</span>
          "${step.techPrompt}"
        </p>

        ${step.wesLine ? `
          <p class="act2-wes-line" data-editor-id="act2-wes-line">
            <span class="act2-wes-who">Wes</span>"${step.wesLine}"
          </p>
        ` : ''}

        <div class="act2-cool-options">
          ${step.options.map(opt => `
            <button class="act2-cool-option" data-cool-option="${opt.id}"
                    data-editor-id="act2-cool-option-${opt.id}"
                    aria-label="${opt.label}">
              <span class="act2-cool-option-label">${opt.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ---- Beat 2D: transport micro-sim -------------------------------------
  renderTransport() {
    const warm = Math.round(this.towelWarmth);
    const warmState = warm >= 70 ? 'critical' : warm >= 40 ? 'warming' : 'cool';
    const warmWord = warm >= 70 ? 'Trapping heat' : warm >= 40 ? 'Warming up' : 'Cool and working';
    const ready = this.rewetCount >= 2 && this.acOn && this.windowsOpen;

    return `
      <div class="act2-transport-panel" data-editor-id="act2-transport-panel">
        <div class="act2-transport-head">
          <span class="act2-transport-badge">Beat 2D · The drive in</span>
          <h2 class="act2-transport-title">Cool her on the way. Don't just drive.</h2>
        </div>

        <div class="act2-transport-grid">

          <!-- The towel micro-sim -->
          <section class="act2-towel-sim state-${warmState}" data-editor-id="act2-towel-sim"
                   aria-label="Wet towel temperature">
            <div class="act2-towel-art-wrap" data-editor-id="act2-towel-art-wrap">
              ${this.renderTowelArt(this.towelWarmth)}
            </div>
            <div class="act2-towel-meter">
              <div class="act2-towel-meter-head">
                <span>Towel</span>
                <span id="act2-towel-word" class="act2-towel-word">${warmWord}</span>
              </div>
              <div class="act2-towel-track">
                <span id="act2-towel-fill" class="act2-towel-fill" style="width: ${warm}%"></span>
                <span class="act2-towel-limit" aria-hidden="true"></span>
              </div>
              <p class="act2-towel-note">
                A towel only cools while it is cooler than she is. Once it reaches her
                temperature it starts holding heat in.
              </p>
              <button id="act2-btn-rewet" class="act2-hud-btn btn-action-primary"
                      data-editor-id="act2-btn-rewet"
                      aria-label="Re-wet the towel with cool water. Re-wet ${this.rewetCount} times so far.">
                💧 Re-wet the towel <span class="act2-rewet-count">(${this.rewetCount})</span>
              </button>
            </div>
          </section>

          <!-- Airflow + the call-ahead that Beat 2A already paid for -->
          <section class="act2-transport-controls" data-editor-id="act2-transport-controls">
            <button id="act2-toggle-ac" class="act2-toggle ${this.acOn ? 'is-on' : ''}"
                    data-editor-id="act2-toggle-ac" role="switch"
                    aria-checked="${this.acOn ? 'true' : 'false'}"
                    aria-label="Air conditioning">
              <span class="act2-toggle-icon" aria-hidden="true">❄️</span>
              <span class="act2-toggle-copy">
                <strong>Air conditioning</strong>
                <span>${this.acOn ? 'On, aimed low at the back seat' : 'Off'}</span>
              </span>
              <span class="act2-toggle-state">${this.acOn ? 'ON' : 'OFF'}</span>
            </button>

            <button id="act2-toggle-windows" class="act2-toggle ${this.windowsOpen ? 'is-on' : ''}"
                    data-editor-id="act2-toggle-windows" role="switch"
                    aria-checked="${this.windowsOpen ? 'true' : 'false'}"
                    aria-label="Rear windows">
              <span class="act2-toggle-icon" aria-hidden="true">🪟</span>
              <span class="act2-toggle-copy">
                <strong>Rear windows</strong>
                <span>${this.windowsOpen ? 'Cracked — air moving across her' : 'Shut'}</span>
              </span>
              <span class="act2-toggle-state">${this.windowsOpen ? 'OPEN' : 'SHUT'}</span>
            </button>

            <div class="act2-toggle is-prepaid" data-editor-id="act2-callahead-row">
              <span class="act2-toggle-icon" aria-hidden="true">📞</span>
              <span class="act2-toggle-copy">
                <strong>Clinic called ahead</strong>
                <span>Already done — Marcus has been on the line since the lake.</span>
              </span>
              <span class="act2-toggle-state is-done">✓ DONE</span>
            </div>

            <p class="act2-transport-hint" data-editor-id="act2-transport-hint">
              ${ready
                ? 'Airflow is on her, the towel is cool, and they are expecting you.'
                : 'Keep the towel cool and get air moving before you pull in.'}
            </p>
          </section>

        </div>

        <div class="act2-transport-footer">
          <button id="act2-btn-arrive" class="act2-hud-btn btn-action-primary ${ready ? 'pulse-btn' : ''}"
                  data-editor-id="act2-btn-arrive" ${ready ? '' : 'disabled'}
                  aria-label="Arrive at the clinic">🏥 Pull in at the clinic ➔</button>
        </div>
      </div>
    `;
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
        <div class="act2-hud-pill act2-nudge-pill" data-editor-id="act2-nudge-pill">
          <span aria-hidden="true">👆</span>
          <span>Click Tay to take the next observation</span>
        </div>
      `;
    }
    if (this.currentBeat === 'cooling' && !this.coolingFeedback) {
      return `
        <div class="act2-hud-pill act2-nudge-pill" data-editor-id="act2-nudge-pill">
          <span aria-hidden="true">🐾</span>
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
                  data-editor-id="act2-btn-start-call">📞 Call the clinic ➔</button>
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
            ${all ? "That's everything ➔" : "Tell him that's everything ▶"}
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
          <button id="act2-btn-next-step" class="act2-hud-btn btn-action-primary"
                  data-editor-id="act2-btn-next-step">Tell him ▶</button>
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
    on('#act2-btn-back-act1', () => this.app?.navigateTo('act1', { beat: 'pov_rise' }));
    on('#act2-btn-title', () => this.app?.navigateTo('opening'));

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
    on('#act2-btn-check-next', () => this.nextCheckStep());
    on('#act2-btn-report-check', () => this.reportCheck());

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
    on('#act2-btn-cool-next', () => this.advanceCooling());
    on('#act2-btn-cool-retry', () => {
      this.coolingFeedback = null;
      this.render();
    });

    // --- Beat 2D: transport ---
    on('#act2-btn-rewet', () => this.rewetTowel());
    on('#act2-toggle-ac', () => { this.acOn = !this.acOn; this.render(); });
    on('#act2-toggle-windows', () => { this.windowsOpen = !this.windowsOpen; this.render(); });
    on('#act2-btn-arrive', () => {
      this.currentBeat = 'handoff';
      this.stopTowelTimer();
      this.render();
    });
    on('#act2-btn-act3', () => this.app?.navigateTo('act3'));
  }

  // =======================================================================
  // BEAT TRANSITIONS
  // =======================================================================

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

  openCheck(checkId) {
    if (!this.checksData[checkId]) return;
    // Remember which hotspot opened the modal so focus can be returned to it on close
    // (no keyboard trap — design-language.md §7.5).
    this.returnFocusCheckId = checkId;
    this.activeCheckId = checkId;
    this.checkStepIndex = 0;
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
    focusInto(this.container, ['#act2-btn-check-next', '#act2-btn-report-check', '#act2-btn-check-close']);
  }

  nextCheckStep() {
    const steps = this.buildCheckSteps(this.activeCheckId);
    if (this.checkStepIndex < steps.length - 1) {
      this.checkStepIndex++;
      this.render();
      this.focusInModal();
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

  chooseCooling(optionId) {
    const step = this.coolingSteps[this.coolingIndex];
    if (!step) return;
    const opt = step.options.find(o => o.id === optionId);
    if (!opt) return;

    if (!opt.correct) {
      // Wrong answers cost: the clock jumps and she gets a little worse. Never a game over.
      this.coolingWrongCount += 1;
      this.elapsedSeconds += 45;
      this.severity = Math.min(1, this.severity + 0.05);
    } else if (step.wesLine) {
      // Wes was pushing the other option and has just been overruled. He pivots instantly.
      this.wesOverruled = true;
    }

    this.coolingFeedback = { optionId, correct: !!opt.correct };
    this.render();
  }

  advanceCooling() {
    this.coolingFeedback = null;
    this.wesOverruled = false;
    if (this.coolingIndex < this.coolingSteps.length - 1) {
      this.coolingIndex++;
      this.render();
      return;
    }
    this.currentBeat = 'transport';
    this.towelWarmth = 0;
    this.render();
  }

  // ---- Towel micro-sim --------------------------------------------------

  startTowelTimer() {
    if (this.towelTimer) return;
    this.towelTimer = window.setInterval(this.tickTowel, 900);
  }

  stopTowelTimer() {
    if (this.towelTimer) {
      window.clearInterval(this.towelTimer);
      this.towelTimer = null;
    }
  }

  // Like the elapsed clock, this mutates only the meter's own nodes — a full re-render on
  // an interval would fight Edit Mode's drag/selection state.
  tickTowel() {
    if (this.isEditModeActive() || this.currentBeat !== 'transport') return;
    this.towelWarmth = Math.min(100, this.towelWarmth + 6);
    this.paintTowel();
  }

  paintTowel() {
    const warm = Math.round(this.towelWarmth);
    const sim = this.container?.querySelector('.act2-towel-sim');
    const fill = this.container?.querySelector('#act2-towel-fill');
    const word = this.container?.querySelector('#act2-towel-word');
    const wrap = this.container?.querySelector('.act2-towel-art-wrap');
    if (fill) fill.style.width = `${warm}%`;
    if (word) word.textContent = warm >= 70 ? 'Trapping heat' : warm >= 40 ? 'Warming up' : 'Cool and working';
    if (sim) {
      sim.classList.remove('state-cool', 'state-warming', 'state-critical');
      sim.classList.add(warm >= 70 ? 'state-critical' : warm >= 40 ? 'state-warming' : 'state-cool');
    }
    if (wrap) wrap.innerHTML = this.renderTowelArt(this.towelWarmth);
  }

  rewetTowel() {
    this.towelWarmth = 0;
    this.rewetCount += 1;
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
