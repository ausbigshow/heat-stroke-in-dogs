/**
 * Act 3 Screen Logic — At the Clinic, Then Home
 * Callie & Tay — Heat Stroke in Dogs
 *
 * Built from the Craft docs "Act 3 — Story Beats" (fefb2d16-bf73-211b-a328-3a63b2524ae3)
 * and "Act 3 — Dialogue Script" (269a5e42-96a0-8d94-8709-0a30ba75eb3f).
 *
 * THE PROBLEM THIS ACT HAS TO SOLVE (quoting the beats doc): "Act 1 was a hunt. Act 2 was an
 * emergency. Act 3 is a waiting room, and waiting rooms have no momentum. This is the act most
 * likely to become a slide deck with a dog in it."
 *
 * Two structural defences, and every decision in this file serves one of them:
 *
 *   1. THE LEARNER STILL DOESN'T KNOW IF TAY IS OKAY. That is the engine. Beat 3A is a real,
 *      unresolved wait with no stats and nothing to click that matters. The HUD status pill
 *      reads TAY — IN BACK, not a temperature. Nothing resolves until 3B.
 *   2. EVERY NUMBER LANDS ON A DECISION THE LEARNER ALREADY MADE. Act 2's `decisionChoice` and
 *      its four reported checks are handed forward (see `applyHandoff`) so the 95/43 line is a
 *      verdict on their playthrough, not a fact delivered at them. If Act 3 is entered without
 *      that state (dev nav, a direct jump), the act-or-wait line degrades to the neutral
 *      variant — Reyes states the range and lets the learner locate themselves in it.
 *
 * DR. REYES TALKS TO CALLIE, NEVER TO CAMERA. The moment she addresses the learner the story
 * frame collapses and she becomes a narrator. No line in this file begins "studies show" or
 * "remember that". Every statistic is attached to something Callie did. She is also always
 * doing something with her hands — the `business` field on her steps carries that stage
 * direction into the UI as her byline, because a vet who stands still and recites is a slide
 * deck with a face.
 *
 * TAY'S VOICE RETURNS IN 3D AND NOWHERE EARLIER. She has had one line since the start of Act 2.
 * That absence is the entire mechanism of the joke — do not seed her anywhere above `tayReturn`.
 *
 * SATURATION: the Visual Asset Brief drains the palette from the collapse through Act 2 and
 * restores it "at recovery in Act 3". `--act3-saturation` carries that as one continuous ramp
 * (see `getRecovery()`), not a state swap.
 *
 * SME PENDING: the Texas A&M cool-down attribution is flagged in the dialogue script as not
 * present in the Research Notes. It carries `smePending: true` and ships with its own
 * unattributed fallback string, so sourcing it (or cutting the attribution) is a one-field
 * swap. See `getSmePendingCopy()` — same pattern as Act 2's ice-chest copy.
 */

import { renderPreservingFocus, focusInto, containFocusIn, releaseFocusContainment } from './a11y-focus.js';

export class Act3Screen {
  constructor(app) {
    this.app = app;
    this.container = null;

    // ---- Core beat state -------------------------------------------------
    // 'wait' | 'verdict' | 'report' | 'tayReturn' | 'nextTime' | 'recheck' | 'home' | 'end'
    this.currentBeat = 'wait';
    this.stepIndex = 0;

    // ---- Beat 3A: the wait ----------------------------------------------
    // Twelve seconds of nothing, which is what makes the vet's entrance land. It is a real
    // wait, not a loading bar — but it is never a trap: `#act3-btn-skip-wait` is present and
    // focusable from the first frame (H3, user control and freedom).
    this.WAIT_SECONDS = 12;
    this.waitSeconds = 0;
    this.waitTimer = null;
    this.waitOver = false;

    // ---- Handed forward from Act 2 (see applyHandoff) --------------------
    // null means "we were not told" — the act-or-wait payoff falls back to its neutral variant
    // rather than accusing a learner of a choice they may not have made.
    this.decisionChoice = null;   // 'act_now' | 'wait' | null
    this.checkReportOrder = [];   // the four Act 2 checks, in the order the learner took them
    this.hintsDropped = 4;        // carried from Act 1's HUD
    this.rewetCount = 0;          // Act 2's towel micro-sim
    this.coolingWrongCount = 0;
    // The raw payload Act 2 sent, carried unmodified so it can be handed straight back.
    this.handoff = {};

    // ---- Beat 3C: the report card ---------------------------------------
    this.reportStep = 0;
    this.reportTableExpanded = false;

    // ---- Beat 3E: prevention ---------------------------------------------
    this.preventionChosen = new Set();
    this.activePrevention = null;

    // Clinic clock. Act 2 hands off mid-drive at ~3:15 PM; twelve minutes of driving, a
    // handover at the door, and the wait puts the verdict at 4:02.
    this.clockMinutes = 242; // minutes past noon = 4:02 PM

    // Silent visual pauses (stage / hold steps) auto-advance on this timer.
    this._autoAdvanceTimer = null;

    // =====================================================================
    // CONTENT DATA
    // Every string a reviewer might want to change lives in these arrays, never inside a
    // template literal in a render method.
    // =====================================================================

    // ---- Beat 3B — The verdict --------------------------------------------
    // `business` is Reyes's stage direction, surfaced as her byline. She never stands still.
    this.verdictSteps = [
      { speaker: 'reyes', business: 'chart in hand, already talking', text: "She's stable." },
      { type: 'stage', text: 'Callie stands up too fast.', sceneCue: 'Callie stands up too fast.' },
      { speaker: 'callie', text: "She's okay?" },
      { speaker: 'reyes', business: 'reading the chart', text: "She's going to be. She came in at 105.8. She was higher than that out at the lake." },
      { speaker: 'callie', text: "But she's okay." },
      { speaker: 'reyes', business: 'finally looking up from the chart', text: "Yeah. She's okay." },
      {
        type: 'hold',
        sceneCue: 'Two seconds. Nobody says anything.'
      },
      { speaker: 'reyes', business: 'clipping the chart under her arm', text: "You cooled her before you drove." },
      { speaker: 'callie', text: "They told me to on the phone." },
      {
        speaker: 'reyes',
        business: 'washing her hands at the lobby sink',
        text: "Good. That's the difference. Dogs whose owners cool them before they get in the car are about two and a half times more likely to make it than the ones who don't. You didn't drive her here. You started treating her and then you drove her here.",
        stamp: {
          metric: '2.5× more likely',
          line: 'Cooling started before the drive, not after it. That is the single thing on this chart you controlled.'
        }
      }
    ];

    // ---- Beat 3C — The report card ----------------------------------------
    // The four Act 2 checks and the Act 1 counter on one screen for the first and only time.
    // Three stages, four signs — which is Reyes's whole point.
    this.reportRows = [
      {
        id: 'panting',
        icon: '💨',
        sign: 'Panting',
        reported: 'Fast, shallow, never pausing',
        stageNo: 1,
        stage: 'Early',
        note: 'The easiest one in the world to explain away as a hot day.'
      },
      {
        id: 'ears',
        icon: '👂',
        sign: 'Ears',
        reported: 'Hot right through, no cool spot',
        stageNo: 2,
        stage: 'Building',
        note: 'Heat coming out of her, not sun landing on her.'
      },
      {
        id: 'gums',
        icon: '👄',
        sign: 'Gums + capillary refill',
        reported: 'Brick red · refill over 2 seconds',
        stageNo: 3,
        stage: 'Advanced',
        note: 'Refill time is the measurement. Colour on its own can fool you.'
      },
      {
        id: 'name',
        icon: '🗣️',
        sign: 'Response to her name',
        reported: 'Delayed, then absent',
        stageNo: 3,
        stage: 'Advanced',
        note: 'By here the window is closing, not open.'
      }
    ];

    // How often each early sign actually gets logged. Bar length AND the numeral carry the
    // value — never the colour (§7.3).
    this.prevalence = [
      { id: 'panting', label: 'Panting', pct: 67, said: 'about two-thirds of cases' },
      { id: 'lethargy', label: 'Lethargy', pct: 50, said: 'about half' }
    ];

    // The Act 1 timeline, restated one last time. Times match Act 2's `hintsTimeline` exactly —
    // if one changes, change both.
    this.hintsTimeline = [
      { time: '1:30 PM', icon: '🥪', title: 'The cooler, in open sun', line: 'Ninety minutes against a cold box with no shade.' },
      { time: '1:48 PM', icon: '☀️', title: 'The dock', line: '137°F boards, patrolled twice.', widest: true },
      { time: '2:03 PM', icon: '🥣', title: 'The water bowl', line: 'Sun-warm, half empty, untouched.' },
      { time: '2:38 PM', icon: '🌳', title: 'The shade that moved', line: 'Twenty-seven minutes asleep in full sun.' }
    ];

    // Reyes walks the timeline while she works. Each step reveals one panel of the report,
    // which is what keeps a waiting room moving.
    this.reportSteps = [
      {
        reveals: 'table',
        lines: [
          { speaker: 'reyes', business: 'writing', text: "What you described on the phone — the panting, the gums, her not answering to her name. Those aren't four separate problems. That's one thing at three different stages." }
        ]
      },
      {
        reveals: 'prevalence',
        lines: [
          { speaker: 'reyes', business: 'still writing', text: "Panting and lethargy are what we log most. Panting in about two-thirds of cases, lethargy in about half. They're the earliest signs and they're the easiest ones to explain away as a hot day." },
          { speaker: 'callie', text: "I thought she was just tired." },
          { speaker: 'reyes', business: 'not unkindly', text: "Everyone does. That's the whole problem with the early stage — it looks like a normal afternoon." }
        ]
      },
      {
        reveals: 'timeline',
        lines: [
          { speaker: 'reyes', business: 'turning the chart around so Callie can see it', text: "This is her afternoon. Every one of these is a place it was still early." }
        ]
      },
      {
        reveals: 'survival',
        // The act-or-wait payoff. Variants are selected in renderReportDialogue().
        lines: [
          {
            speaker: 'reyes',
            business: 'flat, not warning',
            text: "Caught while it's still mild, dogs come through about ninety-five percent of the time. Once it's severe before anyone treats it, that drops to about forty-three.",
            stamp: {
              metric: '95% → 43%',
              line: 'Treated while it is still mild against treated once it is already severe. The gap is not the illness. The gap is the delay.'
            }
          }
        ],
        // No fail state, no scolding. Reyes states the range and lets the learner locate
        // themselves in it.
        variants: {
          act_now: [
            { speaker: 'reyes', business: 'glancing at the chart', text: "She was on the good side of that when she got here. Barely, but she was." }
          ],
          wait: [
            { speaker: 'reyes', business: 'glancing at the chart', text: "You waited a few minutes out there." },
            { speaker: 'callie', text: "I thought she'd settle." },
            { speaker: 'reyes', business: 'no edge in it at all', text: "I know. That gap between ninety-five and forty-three — that's where those minutes live." }
          ],
          unknown: [
            { speaker: 'reyes', business: 'letting it sit', text: "Where a dog lands in that range is mostly about how long anybody took to start." }
          ]
        }
      },
      {
        reveals: 'breed',
        lines: [
          {
            speaker: 'reyes',
            business: 'assuming Callie already knew this',
            text: "And she was never running the same odds as other dogs. Flat-faced breeds — Frenchies, bulldogs, pugs — get heat illness about four times as often.",
            stamp: {
              metric: '4× the risk',
              line: 'Brachycephalic breeds are diagnosed with heat illness roughly four times as often. Tay has been playing this hand her whole life.'
            }
          },
          { speaker: 'callie', text: "Four times." },
          { speaker: 'reyes', business: 'gentler now', text: "That face is adorable and it's a compromise. She's working with a shorter airway than the dog next to her, and panting is the only cooling she's got." }
        ]
      }
    ];

    // ---- Beat 3D — Tay's return -------------------------------------------
    // HER VOICE HAS BEEN GONE SINCE ONE LINE IN ACT 2. Text is verbatim from the dialogue
    // script. Lines flagged `trimCandidate` are the small-room pair the script names as the
    // first cut if the run drags in review — the thermometer and the cone carry it.
    this.tayReturnSteps = [
      { type: 'stage', text: 'A tech walks her out on a leash. Cone. Tail going like nothing happened.', sceneCue: 'A tech walks her out on a leash. Cone. Tail going like nothing happened.' },
      { speaker: 'tay', onomatopoeia: 'YIP YIP YIP.', text: 'CALLIE. CALLIE. CALLIE.' },
      { speaker: 'tay', text: 'They took my temperature. Wrong end. WRONG END.' },
      { type: 'stage', text: 'Callie is on the floor. Tay is climbing her.', sceneCue: 'Callie is on the floor. Tay is climbing her.' },
      { speaker: 'tay', text: "This collar is an insult. I'd like to file something." },
      { speaker: 'callie', business: 'laughing, wrecked', text: "Okay. Okay." },
      {
        speaker: 'tay',
        onomatopoeia: 'HUFF.',
        text: 'But I feel amazing! I always feel amazing!',
        callback: 'She said this in the living room, before any of it.'
      },
      { type: 'stage', text: 'Callie looks up at Dr. Reyes.', sceneCue: 'Callie looks up at Dr. Reyes.' },
      { speaker: 'reyes', business: 'watching the dog, not the owner', text: "Yeah. That's the part that'll get you." }
    ];

    // ---- Beat 3E — Next time ----------------------------------------------
    // Prevention framed forward, never corrective. There are no wrong answers here; every
    // option is a real change and each one gets a real reply.
    this.preventionOptions = [
      {
        id: 'setup_first',
        icon: '⛱️',
        label: 'Shade and water set up before anything else',
        reply: "Before you unpack the cooler, not after. Shade she can actually reach, water in the shade with it."
      },
      {
        id: 'timing',
        icon: '🌅',
        label: 'Go early or late, not one in the afternoon',
        reply: "Morning or evening. One o'clock in July is the worst hour of the day and it's the hour everybody picks."
      },
      {
        id: 'temp_humidity',
        icon: '🌡️',
        label: 'Watch the temperature, not just the sun',
        reply: "Past eighty I'd think hard about it. And check the humidity — that's the part people miss. Panting doesn't work as well when the air's already wet."
      },
      {
        id: 'stay_in',
        icon: '🏠',
        label: 'Some days she just stays inside',
        reply: "Puzzle toy and the AC. She'll act betrayed. She'll live."
      }
    ];

    // Ten seconds, then move on. Handed to Callie as ammunition for somebody else — Texas
    // learners already know this and being taught it insults them.
    this.hotCarSteps = [
      { speaker: 'reyes', business: 'drying her hands', text: "And you already know about cars." },
      { speaker: 'callie', text: "Nobody leaves a dog in a car." },
      {
        speaker: 'reyes',
        business: 'hanging up the towel',
        text: "You'd think. Twenty degrees inside in the first ten minutes. And cracking the windows takes it from about three and a half degrees every five minutes down to about three. It buys you nothing. You don't need that. Somebody you know does.",
        stamp: {
          metric: '+20°F in 10 min',
          line: 'Cracked windows move it from about 3.4°F every five minutes to about 3.1°F. That is the entire benefit.'
        }
      },
      {
        speaker: 'reyes',
        business: 'on her way to the door',
        smePending: true,
        text: "And if you're out in it anyway — fifteen, twenty minutes of cooling off between anything active. That's what A&M recommends for heat like ours. Same number I'd give you.",
        textUnattributed: "And if you're out in it anyway — fifteen, twenty minutes of cooling off between anything active. That's the number I'd give you.",
        stamp: {
          metric: '15–20 min',
          line: 'Cooling off between bouts of anything active, once it is past eighty. Shade, water, and stillness — not a shorter walk.'
        }
      }
    ];

    // ---- Beat 3F — The recheck --------------------------------------------
    this.recheckSteps = [
      { type: 'stage', text: 'Tay is standing, tail going, obviously herself. Callie picks up her keys.', sceneCue: 'Tay is standing, tail going, obviously herself. Callie picks up her keys.' },
      { speaker: 'reyes', business: 'not moving out of the doorway', text: "One more thing." },
      { speaker: 'callie', text: "She's fine, though." },
      { speaker: 'reyes', business: 'chart back out', text: "Her bloodwork today is normal. That's good and it's not the whole story. Kidneys and clotting can go sideways twelve to forty-eight hours after something like this. It doesn't show up while you're standing here." },
      {
        speaker: 'reyes',
        business: 'nodding at Tay, who is currently trying to eat the cone',
        text: "She looks great right now. That's exactly why people skip this part."
      },
      { speaker: 'callie', text: "…Okay." },
      {
        speaker: 'reyes',
        business: 'tearing off the sheet and handing it over',
        text: "Bring her back in a day or two. Sooner if she throws up, if her urine goes dark, if you see any bleeding, or if she goes flat on you again.",
        revealsSheet: true
      },
      { speaker: 'reyes', business: 'already holding the door', text: "And watch her tonight." },
      { speaker: 'callie', text: "I'm gonna watch her tonight." }
    ];

    // The discharge sheet. Deliberately an IN-WORLD object — the thing Reyes has been writing
    // on all act and tears off here. The beats doc cuts the glovebox card: no printable
    // artifact, no takeaway PDF. The module ends on story.
    this.dischargeSheet = {
      title: 'Discharge instructions',
      patient: 'TAY · French Bulldog · 4 yr · F/S',
      items: [
        { glyph: '🩸', label: "Bloodwork today: normal", sub: "Good. Not the whole story — this is a snapshot of right now." },
        { glyph: '📅', label: 'Recheck in 24–48 hours', sub: 'Kidney and clotting problems surface late. Book it before you leave.' },
        { glyph: '🚨', label: 'Come back sooner if you see any of these', sub: 'Vomiting · dark urine · any bleeding · going flat again' },
        { glyph: '🌙', label: 'Watch her tonight', sub: 'Not a figure of speech. Somebody in the room with her.' }
      ]
    };

    // ---- Beat 3G — Home that evening --------------------------------------
    // The living room from Act 0. Same couch, same lake painting, same photo on the wall.
    // Evening light instead of afternoon. The frame closes itself.
    this.homeSteps = [
      { type: 'stage', text: 'Tay asleep on the cushion. Callie sitting next to her, not watching TV, watching the dog.', sceneCue: 'Tay asleep on the cushion. Callie sitting next to her, not watching TV, watching the dog.' },
      { type: 'stage', text: 'She puts a hand on Tay’s side. Feels it rise. Leaves it there.', sceneCue: 'She puts a hand on Tay’s side. Feels it rise. Leaves it there.' },
      { speaker: 'callie', business: 'quiet', text: "You're okay." },
      { type: 'stage', text: 'Tay’s ear moves. She doesn’t wake up. One sleepy exhale.', sceneCue: 'Tay’s ear moves. She doesn’t wake up. One sleepy exhale.' },
      { speaker: 'tay', onomatopoeia: 'Hhhff…', text: '…good day.' },
      { speaker: 'callie', business: 'a beat', text: "Next one'll be better." }
    ];

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.tickWait = this.tickWait.bind(this);
  }

  // =======================================================================
  // LIFECYCLE
  // =======================================================================

  mount() {
    this.container = document.getElementById('screen-act3');
    if (!this.container) return;

    this.render();
    if (this.currentBeat === 'wait' && !this.waitOver) this.startWaitTimer();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  unmount() {
    if (this._autoAdvanceTimer) clearTimeout(this._autoAdvanceTimer);
    window.removeEventListener('keydown', this.handleKeyDown);
    this.stopWaitTimer();
    releaseFocusContainment(this.container || document);
  }

  /**
   * Accept Act 2's playthrough so every number in this act lands on a decision the learner
   * actually made. Called by app.navigateTo('act3', { handoff }). Absent or partial state is
   * fine — the survival payoff falls back to its neutral variant rather than guessing.
   */
  applyHandoff(handoff = {}) {
    // Kept verbatim as well as unpacked, so anything Act 2 tracks that this screen does not
    // read still survives the round trip back to it (see getHandoff()).
    this.handoff = { ...handoff };
    if (handoff.decisionChoice === 'act_now' || handoff.decisionChoice === 'wait') {
      this.decisionChoice = handoff.decisionChoice;
    }
    if (Array.isArray(handoff.checkReportOrder)) this.checkReportOrder = [...handoff.checkReportOrder];
    if (Number.isFinite(handoff.hintsDropped)) this.hintsDropped = handoff.hintsDropped;
    if (Number.isFinite(handoff.rewetCount)) this.rewetCount = handoff.rewetCount;
    if (Number.isFinite(handoff.coolingWrongCount)) this.coolingWrongCount = handoff.coolingWrongCount;
  }

  isEditModeActive() {
    return document.body.classList.contains('edit-mode-active');
  }

  prefersReducedMotion() {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Every string still waiting on a subject-matter expert, reachable from one place so the
   * confirmation lands as a targeted swap rather than a hunt. Same contract as Act 2's
   * getSmePendingCopy(). Currently: the Texas A&M cool-down attribution (dialogue-script flag).
   */
  getSmePendingCopy() {
    return this.hotCarSteps
      .filter(step => step.smePending)
      .map(step => ({
        path: `hotCarSteps.${this.hotCarSteps.indexOf(step)}`,
        issue: 'A&M attribution is not in the Research Notes — source it or use textUnattributed.',
        current: step.text,
        fallback: step.textUnattributed,
        step
      }));
  }

  // =======================================================================
  // CLOCK & RECOVERY
  // =======================================================================

  getFormattedTime() {
    const hour = Math.floor(this.clockMinutes / 60) % 12 || 12;
    const min = this.clockMinutes % 60;
    return `${hour}:${min < 10 ? '0' : ''}${min} PM`;
  }

  /**
   * The palette-drain from Act 2, running backwards. The Visual Asset Brief drains saturation
   * from the collapse and restores it "at recovery in Act 3", so this is one continuous ramp
   * across the act rather than a state swap at the door.
   */
  getRecovery() {
    const byBeat = {
      wait: 0.0,
      verdict: 0.25,
      report: 0.35,
      tayReturn: 0.85,
      nextTime: 1.0,
      recheck: 1.0,
      home: 1.0,
      end: 1.0
    };
    const r = byBeat[this.currentBeat] ?? 1;
    return {
      recovery: r.toFixed(3),
      // 46% drained at the door, fully saturated by the time she is climbing Callie.
      saturation: (54 + r * 46).toFixed(1),
      // The clinical cool wash over the lobby, gone by the time the room warms up.
      coolOpacity: (0.42 * (1 - r)).toFixed(3)
    };
  }

  /**
   * Tay's status, as the lobby knows it. Text carries the state; colour only reinforces (§6.1).
   *
   * It must not resolve one frame early. The pill flips on the step where Reyes actually says
   * "She's stable" — not when the beat changes, which is while she is still coming through the
   * door. Beat 3A's engine is that the learner does not know, and a HUD that knows first
   * spends it for them.
   */
  getTayStatus() {
    const verdictSpoken = this.currentBeat === 'verdict' && this.stepIndex >= 1;
    if (this.currentBeat === 'wait' || (this.currentBeat === 'verdict' && !verdictSpoken)) {
      return { word: 'IN BACK', tone: 'unknown', aria: 'Tay is in the back. You have not been told anything yet.' };
    }
    // STABLE holds all the way through her return and the prevention talk. GOING HOME only
    // once Reyes has actually discharged her — announcing it earlier would spend Beat 3F's
    // "one more thing" before she says it.
    if (['verdict', 'report', 'tayReturn', 'nextTime'].includes(this.currentBeat)) {
      return { word: 'STABLE', tone: 'stable', aria: 'Tay is stable.' };
    }
    return { word: 'GOING HOME', tone: 'home', aria: 'Tay is stable and going home today, with a recheck booked.' };
  }

  // =======================================================================
  // BEAT 3A — THE WAIT
  // =======================================================================

  startWaitTimer() {
    if (this.waitTimer) return;
    this.waitTimer = window.setInterval(this.tickWait, 1000);
  }

  stopWaitTimer() {
    if (this.waitTimer) {
      window.clearInterval(this.waitTimer);
      this.waitTimer = null;
    }
  }

  /**
   * Ticks touch one text node and one custom property. A full re-render on a 1s interval would
   * fight Edit Mode's selection and drag state — same reasoning as Act 2's tickElapsed(). The
   * timer is not suppressed while editing (§8.4), it just does not advance.
   */
  tickWait() {
    if (this.isEditModeActive()) return;
    this.waitSeconds += 1;

    const remaining = Math.max(0, this.WAIT_SECONDS - this.waitSeconds);
    const bar = this.container?.querySelector('#act3-wait-bar');
    if (bar) {
      bar.style.setProperty('--act3-wait-progress', `${Math.min(100, (this.waitSeconds / this.WAIT_SECONDS) * 100)}%`);
      bar.setAttribute('aria-valuenow', String(this.waitSeconds));
      bar.setAttribute('aria-label', `Waiting for clinic staff: approximately ${remaining} seconds remaining`);
    }

    const srStatus = this.container?.querySelector('#act3-wait-sr-status');
    if (srStatus) {
      if (remaining === 6) {
        srStatus.textContent = 'Waiting for clinic staff: approximately 6 seconds remaining.';
      } else if (remaining === 0) {
        srStatus.textContent = 'The door to the back opens.';
      }
    }

    if (this.waitSeconds >= this.WAIT_SECONDS) {
      this.endWait();
    }
  }

  endWait() {
    this.stopWaitTimer();
    this.waitOver = true;
    this.currentBeat = 'verdict';
    this.stepIndex = 0;
    this.render();
  }

  
  // =======================================================================
  // RENDER — SHELL
  // =======================================================================

  render() {
    releaseFocusContainment(this.container || document);
    if (this._autoAdvanceTimer) {
      clearTimeout(this._autoAdvanceTimer);
      this._autoAdvanceTimer = null;
    }
    renderPreservingFocus(
      this.container,
      () => this.renderNow(),
      ['#act3-btn-next-step', '#act3-btn-report-next', '#act3-btn-report-done',
       '#act3-btn-beat-advance', '#act3-btn-skip-wait', '#act3-btn-report-table']
    );
    const dialog = this.container?.querySelector('[role="dialog"]');
    if (dialog) containFocusIn(dialog);

    const steps = this.stepsForBeat();
    if (steps && steps[this.stepIndex]) {
      const step = steps[this.stepIndex];
      if (step.type === 'stage' || step.type === 'hold') {
        let delay = step.type === 'hold' ? 2000 : 1400;
        if (this.prefersReducedMotion()) delay = 0;
        this._autoAdvanceTimer = setTimeout(() => {
          this.nextSubStep();
        }, delay);
      }
    }
  }

  renderNow() {
    if (!this.container) return;

    const { recovery, saturation, coolOpacity } = this.getRecovery();
    const scene = this.getScene();

    this.container.innerHTML = `
      <div class="act3-container" data-editor-id="act3-screen-container">

        <!-- 16:9 viewport card — geometry matched to Act 1 and Act 2 so the product reads
             as one piece. §9 of docs/design-language.md. -->
        <div
          id="act3-card"
          class="act3-viewport-card scene-${scene.key}"
          data-editor-id="act3-viewport-card"
          style="--act3-saturation: ${saturation}%; --act3-cool-opacity: ${coolOpacity}; --act3-recovery: ${recovery};"
        >
          ${scene.html}

          <!-- Light wash. Cool and clinical in the lobby, warm and low in the evening. -->
          <div class="act3-wash ${scene.wash}" data-editor-id="act3-wash" aria-hidden="true"></div>

          ${this.renderHudBar()}

          <div class="act3-speech-layer ${this.beatHasModal() ? 'has-modal' : ''}"
               data-editor-id="act3-speech-layer">
            ${this.renderActiveBeatContent()}
          </div>

          <nav class="act3-nav-bar" data-editor-id="act3-nav-bar">
            <div class="act3-hud-group">${this.renderBottomLeftControls()}</div>
            <div class="act3-hud-group">${this.renderBottomRightControls()}</div>
          </nav>

          <p class="sr-only" role="status" aria-live="polite" data-editor-id="act3-sr-status">
            ${this.renderSrStatusText()}
          </p>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  /**
   * Whether this beat renders a scrimmed dialog. Those beats lift the speech layer above the
   * HUD so the scrim actually covers the chrome — which is what makes the inert-behind-the-
   * dialog state honest rather than a row of buttons that look live and are not.
   */
  beatHasModal() {
    return this.currentBeat === 'report' || this.currentBeat === 'end';
  }

  renderSrStatusText() {
    const status = this.getTayStatus();
    switch (this.currentBeat) {
      case 'wait':
        return `Clinic lobby. ${status.aria} Callie is waiting.`;
      case 'verdict':
        return `${status.aria} Dr. Reyes is explaining what made the difference.`;
      case 'report':
        return `${status.aria} Dr. Reyes is walking through the four signs you reported and the timeline they came from.`;
      case 'tayReturn':
        return 'Tay is back on her feet, wearing a cone, and talking again for the first time since the lake.';
      case 'nextTime':
        return `${this.preventionChosen.size} of ${this.preventionOptions.length} changes chosen for the next lake day.`;
      case 'recheck':
        return 'Dr. Reyes is giving discharge instructions: recheck in 24 to 48 hours, and watch her tonight.';
      case 'home':
        return 'That evening, at home. Tay is asleep on the couch and Callie is sitting with her.';
      default:
        return 'The story is over. You can replay an act or return to the title screen.';
    }
  }

  /** Which room we are in. Lobby is drawn; the exam room and the living room are painted. */
  getScene() {
    if (['wait', 'verdict', 'report'].includes(this.currentBeat)) {
      return { key: 'lobby', wash: 'wash-clinical', html: this.renderLobbyArt() };
    }
    if (['tayReturn', 'nextTime', 'recheck'].includes(this.currentBeat)) {
      return {
        key: 'exam',
        wash: 'wash-clear',
        html: `
          <img
            src="Assets/Image/CallieAndTay-Vet.jpg"
            alt="Callie and Dr. Reyes either side of an exam table, with Tay sitting up on it"
            class="act3-scene-img"
            data-editor-id="act3-exam-img"
          />
        `
      };
    }
    return {
      key: 'home',
      wash: 'wash-evening',
      html: `
        <img
          src="Assets/Image/CallieAndTay-Home.jpg"
          alt="Callie and Tay on the living room couch, the same room the story opened in"
          class="act3-scene-img"
          data-editor-id="act3-home-img"
        />
      `
    };
  }

  renderHudBar() {
    const status = this.getTayStatus();
    const order = ['wait', 'verdict', 'report', 'tayReturn', 'nextTime', 'recheck', 'home', 'end'];
    const currentBeatNum = Math.max(1, order.indexOf(this.currentBeat) + 1);
    const totalBeats = order.length;

    return `
      <header class="act3-hud-bar" data-editor-id="act3-hud-bar">
        <div class="act3-hud-group">
          <button id="act3-btn-back-act2" class="act3-hud-btn" data-editor-id="act3-btn-back-act2"
                  title="Return to Act 2" aria-label="Return to Act 2">◀ Act 2</button>
          <button id="act3-btn-title" class="act3-hud-btn" data-editor-id="act3-btn-title"
                  title="Return to Title" aria-label="Return to the title screen">🏠 Title</button>
        </div>

        <div class="act3-hud-group">
          <div class="act3-hud-pill progress-pill" data-editor-id="act3-hud-progress"
               aria-label="Act 3 progress: Beat ${currentBeatNum} of ${totalBeats}">
            <span class="act3-hud-label" aria-hidden="true">BEAT</span>
            <span class="act3-hud-count">${currentBeatNum}/${totalBeats}</span>
          </div>

          <div class="act3-hud-pill clock-pill" data-editor-id="act3-hud-clock" title="Clinic time">
            <span aria-hidden="true">🕒</span>
            <span>${this.getFormattedTime()}</span>
          </div>

          <!-- The engine of Beat 3A. It says IN BACK, and it keeps saying IN BACK. -->
          <div class="act3-hud-pill status-pill tone-${status.tone}" data-editor-id="act3-hud-status"
               aria-label="${status.aria}">
            <span aria-hidden="true">🐶</span>
            <span>TAY — ${status.word}</span>
          </div>
        </div>
      </header>
    `;
  }

  // =======================================================================
  // RENDER — PLACEHOLDER ART
  // Flat vector, no outlines, no gradients on characters, limited warm palette, eyes as a
  // single unbroken flat black shape with no catchlight — per the Visual Asset Brief and
  // §1.1 / §2.3 of docs/design-language.md. Each piece is its own helper with its own
  // data-editor-id so a final illustration can replace it without touching beat logic.
  // =======================================================================

  /** The lobby: reception, a row of chairs, the door Reyes will come through. */
  renderLobbyArt() {
    const reyesIn = this.currentBeat !== 'wait';

    return `
      <svg class="act3-lobby-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"
           data-editor-id="act3-art-lobby" role="img"
           aria-label="A veterinary clinic waiting room: reception desk, a row of chairs, and a door to the back">
        <rect x="0" y="0" width="1600" height="640" fill="#DDE3EC" />
        <rect x="0" y="640" width="1600" height="260" fill="#B9C2CF" />
        <rect x="0" y="628" width="1600" height="14" fill="#CBD3DE" />

        <!-- reception counter, left -->
        <rect x="60" y="392" width="430" height="248" rx="10" fill="#F1F4F8" />
        <rect x="60" y="380" width="430" height="26" rx="8" fill="#94A3B8" />
        <rect x="108" y="336" width="106" height="46" rx="6" fill="#CBD3DE" />
        <rect x="120" y="348" width="82" height="22" rx="3" fill="#8B97A8" />
        <rect x="250" y="356" width="60" height="26" rx="4" fill="#E2E8F0" />

        <!-- wall board, centre -->
        <rect x="618" y="150" width="330" height="200" rx="10" fill="#F8FAFC" />
        <rect x="646" y="182" width="180" height="16" rx="6" fill="#B4BECD" />
        <rect x="646" y="216" width="252" height="10" rx="5" fill="#CBD3DE" />
        <rect x="646" y="238" width="220" height="10" rx="5" fill="#CBD3DE" />
        <rect x="646" y="260" width="240" height="10" rx="5" fill="#CBD3DE" />
        <circle cx="880" cy="212" r="34" fill="#BFD8DE" />

        <!-- the door to the back -->
        <g data-editor-id="act3-art-door">
          <rect x="1120" y="196" width="270" height="444" rx="8" fill="#E6EBF2" />
          <rect x="1140" y="216" width="230" height="404" rx="6" fill="#F5F8FB" />
          <rect x="1160" y="248" width="190" height="120" rx="6" fill="#C6DDE4" />
          <circle cx="1352" cy="430" r="9" fill="#8B97A8" />
        </g>

        <!-- the empty chair beside her. One, not a row: the lobby is not busy, it is just
             somewhere she is stuck. -->
        <g data-editor-id="act3-art-chairs">
          <rect x="900" y="470" width="150" height="26" rx="8" fill="#8FA3B6" />
          <rect x="906" y="392" width="138" height="82" rx="10" fill="#A6B8C9" />
          <rect x="916" y="496" width="14" height="90" rx="6" fill="#7C8CA0" />
          <rect x="1020" y="496" width="14" height="90" rx="6" fill="#7C8CA0" />
        </g>

        ${this.renderCallieWaiting()}
        ${reyesIn ? this.renderReyesFigure() : ''}
      </svg>
    `;
  }

  /** Callie in a lobby chair, still damp, still holding the towel. Tay is not in this shot. */
  renderCallieWaiting() {
    const still = this.prefersReducedMotion() ? 'is-still' : '';
    return `
      <g class="act3-callie-waiting ${still}" data-editor-id="act3-art-callie-waiting"
         transform="translate(-170, 0)">
        <!-- chair she is sitting in -->
        <rect x="730" y="470" width="150" height="26" rx="8" fill="#8FA3B6" />
        <rect x="736" y="392" width="138" height="82" rx="10" fill="#A6B8C9" />
        <rect x="746" y="496" width="14" height="90" rx="6" fill="#7C8CA0" />
        <rect x="850" y="496" width="14" height="90" rx="6" fill="#7C8CA0" />

        <!-- legs -->
        <rect x="778" y="470" width="26" height="112" rx="13" fill="#8A5A3B" />
        <rect x="812" y="470" width="26" height="112" rx="13" fill="#8A5A3B" />
        <rect x="770" y="576" width="44" height="16" rx="8" fill="#E8DCC8" />
        <rect x="804" y="576" width="44" height="16" rx="8" fill="#E8DCC8" />

        <!-- torso: the dusty-blue top with the rust leaf motif -->
        <path d="M760,470 L760,352 Q760,330 786,330 L840,330 Q866,330 866,352 L866,470 Z" fill="#7C93B4" />
        <path d="M800,364 q16,18 4,44 q-16,-14 -4,-44 Z" fill="#B4663C" />

        <!-- arms, holding the towel in her lap -->
        <path d="M762,368 q-24,44 -8,84 l30,-8 q-10,-38 6,-70 Z" fill="#8A5A3B" />
        <path d="M864,368 q24,44 8,84 l-30,-8 q10,-38 -6,-70 Z" fill="#8A5A3B" />

        <!-- head, very long straight black hair -->
        <path d="M776,318 q-16,-92 37,-92 q53,0 37,92 q10,74 -37,74 q-47,0 -37,-74 Z" fill="#0E0D0F" />
        <ellipse cx="813" cy="292" rx="34" ry="40" fill="#96633F" />
        <path d="M779,268 q34,-30 68,0 q6,-52 -34,-52 q-40,0 -34,52 Z" fill="#0E0D0F" />
        <!-- eyes: single unbroken flat black shape, no catchlight (§2.3) -->
        <ellipse cx="800" cy="292" rx="4.5" ry="5.5" fill="#000000" />
        <ellipse cx="826" cy="292" rx="4.5" ry="5.5" fill="#000000" />
        <path d="M804,312 q9,5 18,0" stroke="#5E3D2A" stroke-width="3" stroke-linecap="round" fill="none" />

        <!-- the towel she has no use for -->
        <g class="act3-towel-held" data-editor-id="act3-art-towel">
          <rect x="768" y="436" width="90" height="42" rx="8" fill="#CBD8E4" />
          <rect x="768" y="450" width="90" height="6" fill="#AFC1D2" />
          <rect x="768" y="464" width="90" height="6" fill="#AFC1D2" />
        </g>
      </g>
    `;
  }

  /** Dr. Reyes. Blonde, teal scrubs, stethoscope, chart — the vet from the exam-room art. */
  renderReyesFigure() {
    return `
      <g class="act3-reyes-figure" data-editor-id="act3-art-reyes">
        <rect x="1218" y="470" width="26" height="140" rx="13" fill="#5FA9BE" />
        <rect x="1254" y="470" width="26" height="140" rx="13" fill="#5FA9BE" />
        <rect x="1208" y="600" width="46" height="18" rx="9" fill="#FFFFFF" />
        <rect x="1248" y="600" width="46" height="18" rx="9" fill="#FFFFFF" />

        <path d="M1204,478 L1204,344 Q1204,322 1230,322 L1272,322 Q1298,322 1298,344 L1298,478 Z" fill="#67B4C6" />
        <path d="M1226,322 q25,34 50,0" stroke="#4E93A5" stroke-width="6" fill="none" />
        <path d="M1224,336 q-6,54 14,72" stroke="#2F5C68" stroke-width="6" fill="none" stroke-linecap="round" />
        <circle cx="1240" cy="412" r="9" fill="#2F5C68" />

        <path d="M1204,352 q-26,50 -10,92 l28,-10 q-10,-40 6,-72 Z" fill="#67B4C6" />
        <path d="M1298,352 q26,50 10,92 l-28,-10 q10,-40 -6,-72 Z" fill="#67B4C6" />

        <!-- the chart. She is never not holding it. -->
        <g data-editor-id="act3-art-chart">
          <rect x="1274" y="428" width="62" height="80" rx="5" fill="#F8FAFC" transform="rotate(-8 1305 468)" />
          <rect x="1284" y="446" width="42" height="6" rx="3" fill="#B4BECD" transform="rotate(-8 1305 468)" />
          <rect x="1284" y="462" width="42" height="6" rx="3" fill="#B4BECD" transform="rotate(-8 1305 468)" />
          <rect x="1284" y="478" width="28" height="6" rx="3" fill="#B4BECD" transform="rotate(-8 1305 468)" />
        </g>

        <ellipse cx="1251" cy="286" rx="32" ry="38" fill="#E8B98F" />
        <path d="M1215,282 q-14,-80 36,-80 q50,0 36,80 q6,-16 2,-40 q-12,-30 -38,-30 q-26,0 -38,30 q-4,24 2,40 Z" fill="#E9C978" />
        <path d="M1219,266 q32,-26 64,0 q6,-48 -32,-48 q-38,0 -32,48 Z" fill="#E9C978" />
        <ellipse cx="1239" cy="286" rx="4.5" ry="5.5" fill="#000000" />
        <ellipse cx="1263" cy="286" rx="4.5" ry="5.5" fill="#000000" />
        <path d="M1242,304 q9,6 18,0" stroke="#8A5A3B" stroke-width="3" stroke-linecap="round" fill="none" />
      </g>
    `;
  }

  // =======================================================================
  // RENDER — SHARED DIALOGUE COMPONENTS
  // =======================================================================

  /**
   * One dialogue step → one bubble, stage card, or hold card.
   *
   * Dr. Reyes gets a third bubble variant. §1.3 of the design language reserves warm/ember for
   * Tay and white/brown-ink for Callie; Reyes is the clinical human voice, so she keeps
   * Callie's white ground (both are people talking in a room) and takes the cool/ink family's
   * teal border and info-blue speaker label. The dark-slate-and-amber treatment stays reserved
   * for the truth stamp, which is a voice with no person attached.
   *
   * Stem side matters: Edit Mode writes `--stem-right` for `.callie-bubble` and `--stem-left`
   * for every other bubble (§8.2), so Reyes and Tay are positioned to sit right of the speaker
   * they belong to, and Callie left of hers.
   */
  renderDialogueStep(step, editorId) {
    if (!step) return '';

    if (step.type === 'stage' || step.type === 'hold') { return ''; }

    if (step.speaker === 'tay') {
      return `
        <div class="speech-bubble tay-bubble act3-tay-bubble" data-editor-id="${editorId}-tay">
          <div class="speech-bubble-speaker">
            <span aria-hidden="true">🐶</span>
            <span>Tay</span>
          </div>
          <p class="speech-bubble-text">
            ${step.onomatopoeia ? `<span class="tay-onomatopoeia">${step.onomatopoeia}</span> ` : ''}<span class="tay-sub-dialogue">${step.text}</span>
          </p>
          ${step.callback ? `<span class="act3-callback-tag">${step.callback}</span>` : ''}
        </div>
      `;
    }

    if (step.speaker === 'reyes') {
      return `
        <div class="speech-bubble reyes-bubble act3-reyes-bubble" data-editor-id="${editorId}-reyes">
          <div class="speech-bubble-speaker">
            <span aria-hidden="true">🩺</span>
            <span>Dr. Reyes</span>
            
          </div>
          <p class="speech-bubble-text">
            <span class="act3-reyes-dialogue">“${step.text}”</span>
          </p>
        </div>
      `;
    }

    return `
      <div class="speech-bubble callie-bubble act3-callie-bubble" data-editor-id="${editorId}-callie">
        <div class="speech-bubble-speaker">
          <span aria-hidden="true">👩</span>
          <span>Callie</span>
          
        </div>
        <p class="speech-bubble-text">
          <span class="callie-dialogue">“${step.text}”</span>
        </p>
      </div>
    `;
  }

  /**
   * The flat third voice. §6.5: the metric is a MEASUREMENT, not a label — if you cannot put a
   * number in the chip you have a caption, not a truth stamp. All four stamps in this act
   * clear that bar.
   */
  renderTruthStamp(stamp, editorId) {
    if (!stamp) return '';
    return `
      <div class="act3-truth-stamp" data-editor-id="${editorId}" role="note">
        <span class="act3-truth-stamp-metric">${stamp.metric}</span>
        <span class="act3-truth-stamp-line">${stamp.line}</span>
      </div>
    `;
  }

  // =======================================================================
  // RENDER — BEATS
  // =======================================================================

  renderActiveBeatContent() {
    switch (this.currentBeat) {
      case 'wait': return this.renderWait();
      case 'verdict': return this.renderVerdict();
      case 'report': return this.renderReport();
      case 'tayReturn': return this.renderTayReturn();
      case 'nextTime': return this.renderNextTime();
      case 'recheck': return this.renderRecheck();
      case 'home': return this.renderHome();
      case 'end': return this.renderEnd();
      default: return '';
    }
  }

  // ---- Beat 3A — the wait -----------------------------------------------
  renderWait() {
    const pct = Math.min(100, (this.waitSeconds / this.WAIT_SECONDS) * 100);
    const remaining = Math.max(0, this.WAIT_SECONDS - this.waitSeconds);

    return `
      <div class="act3-wait-panel" data-editor-id="act3-wait-panel">
        <span class="act3-wait-badge">4:02 PM · Lakeside Veterinary</span>
        <p class="act3-wait-line" id="act3-wait-line">You keep holding the towel. It is still damp and it is still cold.</p>
        <p class="act3-wait-sub">Nobody has told you anything.</p>

        <!-- A finite wait with accessible progress. The skip control in the nav bar is present from the first frame. -->
        <div id="act3-wait-bar" class="act3-wait-bar" style="--act3-wait-progress: ${pct}%;"
             data-editor-id="act3-wait-bar"
             role="progressbar"
             aria-valuemin="0"
             aria-valuemax="${this.WAIT_SECONDS}"
             aria-valuenow="${this.waitSeconds}"
             aria-label="Waiting for clinic staff: approximately ${remaining} seconds remaining">
          <span class="act3-wait-bar-fill"></span>
        </div>

        <div id="act3-wait-sr-status" class="sr-only" aria-live="polite">
          ${this.waitSeconds === 0 ? 'Waiting for clinic staff. The doctor will appear in approximately 12 seconds, or you can skip the wait.' : ''}
        </div>
      </div>
    `;
  }

  /**
   * The last stamp revealed at or before `index` in `steps`. A truth stamp is not a flash — it
   * is the flat third voice landing on the beat, so once it arrives it stays up for the rest
   * of that beat rather than vanishing on the speaker's next line.
   */
  activeStamp(steps, index) {
    for (let i = Math.min(index, steps.length - 1); i >= 0; i--) {
      if (steps[i]?.stamp) return steps[i].stamp;
    }
    return null;
  }

  // ---- Beat 3B — the verdict --------------------------------------------
  renderVerdict() {
    const step = this.verdictSteps[this.stepIndex];
    if (!step) return '';
    const stamp = this.activeStamp(this.verdictSteps, this.stepIndex);

    return `
      ${this.renderDialogueStep(step, `act3-verdict-${this.stepIndex}`)}
      ${stamp ? this.renderTruthStamp(stamp, 'act3-stamp-survival-cooled') : ''}
    `;
  }

  // ---- Beat 3C — the report card ----------------------------------------
  // A dark case-file modal (§6.4). It is the only screen in the module where Act 1's counter
  // and Act 2's four checks appear together, and it builds one panel at a time so the beat
  // keeps moving instead of dumping a table.
  renderReport() {
    const step = this.reportSteps[this.reportStep];
    const revealed = new Set(this.reportSteps.slice(0, this.reportStep + 1).map(s => s.reveals));

    return `
      <div class="act3-report-modal" data-editor-id="act3-report-modal" role="dialog"
           aria-modal="true" aria-labelledby="act3-report-title">
        <div class="act3-report-card" data-editor-id="act3-report-card">

          <header class="act3-report-header">
            <span class="act3-report-badge" aria-hidden="true">CASE FILE</span>
            <h2 class="act3-report-title" id="act3-report-title">
              Tay · French Bulldog · 4 yr
              <span class="act3-report-subtitle">Presented 3:41 PM · 105.8°F on arrival</span>
            </h2>
            <span class="act3-report-hints" data-editor-id="act3-report-hints">
              <span aria-hidden="true">⚠️</span>
              <span>Warning signs at the lake: ${this.hintsDropped} · all ${this.hintsDropped} reported</span>
            </span>
          </header>

          <div class="act3-report-body" data-editor-id="act3-report-body">
            ${revealed.has('table') ? this.renderReportTable() : ''}
            ${revealed.has('prevalence') ? this.renderPrevalence() : ''}
            ${revealed.has('timeline') ? this.renderReportTimeline() : ''}
            ${revealed.has('survival') ? this.renderTruthStamp(
              this.reportSteps.find(s => s.reveals === 'survival').lines[0].stamp,
              'act3-stamp-survival-range'
            ) : ''}
            ${revealed.has('breed') ? this.renderTruthStamp(
              this.reportSteps.find(s => s.reveals === 'breed').lines[0].stamp,
              'act3-stamp-breed'
            ) : ''}
          </div>

          <footer class="act3-report-footer" data-editor-id="act3-report-footer">
            <div class="act3-report-dialogue">
              ${this.renderReportDialogue(step)}
            </div>
            <div class="act3-report-nav">
              <div class="act3-report-nav-left">
                ${this.reportStep > 0 ? `
                  <button id="act3-btn-report-prev" class="act3-hud-btn act3-btn-quiet"
                          data-editor-id="act3-btn-report-prev"
                          aria-label="Go back one step in the case file">◀ Back</button>
                ` : ''}
                <div class="act3-beat-dots" aria-hidden="true">
                  ${this.reportSteps.map((_, i) => `
                    <span class="act3-beat-dot ${i === this.reportStep ? 'current' : ''} ${i < this.reportStep ? 'seen' : ''}"></span>
                  `).join('')}
                </div>
              </div>
              ${this.reportStep < this.reportSteps.length - 1 ? `
                <button id="act3-btn-report-next" class="act3-hud-btn btn-action-primary"
                        data-editor-id="act3-btn-report-next">Next ▶</button>
              ` : `
                <button id="act3-btn-report-done" class="act3-hud-btn btn-action-primary"
                        data-editor-id="act3-btn-report-done">Close the file ➔</button>
              `}
            </div>
          </footer>

        </div>
      </div>
    `;
  }

  renderReportTable() {
    const collapseTable = this.reportStep >= 2 && !this.reportTableExpanded;

    if (collapseTable) {
      return `
        <div class="act3-report-panel collapsed-table" data-editor-id="act3-report-panel-table">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h3 class="act3-panel-title" style="margin: 0;">What you reported</h3>
            <button id="act3-btn-report-table" class="act3-hud-btn act3-btn-quiet" aria-expanded="false" style="height: 30px; font-size: 0.75rem; padding: 0 0.8rem;">
              Show table
            </button>
          </div>
          <div class="act3-report-chips" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${this.reportRows.map(row => `
              <span class="act3-stage-chip stage-${row.stageNo}" style="display: inline-flex; align-items: center; gap: 0.3rem;">
                <span aria-hidden="true">${row.icon}</span>
                <span class="act3-stage-no">${row.stageNo}</span>
                <span>${row.stage}</span>
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="act3-report-panel" data-editor-id="act3-report-panel-table">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h3 class="act3-panel-title" style="margin: 0;">What you reported, and when it started</h3>
          ${this.reportStep >= 2 ? `
            <button id="act3-btn-report-table" class="act3-hud-btn act3-btn-quiet" aria-expanded="true" style="height: 30px; font-size: 0.75rem; padding: 0 0.8rem;">
              Hide table
            </button>
          ` : ''}
        </div>
        <table class="act3-report-table">
          <caption class="sr-only">The four signs reported to the clinic, and the stage of heat illness each belongs to</caption>
          <thead>
            <tr>
              <th scope="col">Sign</th>
              <th scope="col">What you told the clinic</th>
              <th scope="col">Stage</th>
            </tr>
          </thead>
          <tbody>
            ${this.reportRows.map(row => `
              <tr>
                <th scope="row" class="act3-cell-sign">
                  <span aria-hidden="true">${row.icon}</span> ${row.sign}
                </th>
                <td class="act3-cell-reported">
                  ${row.reported}
                  <span class="act3-cell-note">${row.note}</span>
                </td>
                <td class="act3-cell-stage">
                  <span class="act3-stage-chip stage-${row.stageNo}">
                    <span class="act3-stage-no">${row.stageNo}</span>
                    <span>${row.stage}</span>
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="act3-panel-foot">Four signs. Three stages. One thing.</p>
      </div>
    `;
  }

  renderPrevalence() {
    return `
      <div class="act3-report-panel" data-editor-id="act3-report-panel-prevalence">
        <h3 class="act3-panel-title">The two signs that get logged the most</h3>
        <ul class="act3-prevalence-list">
          ${this.prevalence.map(p => `
            <li class="act3-prevalence-row" data-editor-id="act3-prevalence-${p.id}">
              <span class="act3-prevalence-label">${p.label}</span>
              <span class="act3-prevalence-track" aria-hidden="true">
                <span class="act3-prevalence-fill" style="width: ${p.pct}%;"></span>
              </span>
              <span class="act3-prevalence-value">${p.pct}%</span>
              <span class="sr-only">${p.label} is recorded in ${p.said} of heat illness cases.</span>
            </li>
          `).join('')}
        </ul>
        <p class="act3-panel-foot">Both are early. Both look like a hot afternoon.</p>
      </div>
    `;
  }

  renderReportTimeline() {
    return `
      <div class="act3-report-panel" data-editor-id="act3-report-panel-timeline">
        <h3 class="act3-panel-title">Her afternoon, from Act 1</h3>
        <ol class="act3-report-timeline">
          ${this.hintsTimeline.map(item => `
            <li class="act3-timeline-item ${item.widest ? 'is-widest' : ''}">
              <span class="act3-timeline-time">${item.time}</span>
              <span class="act3-timeline-icon" aria-hidden="true">${item.icon}</span>
              <span class="act3-timeline-copy">
                <strong>${item.title}</strong>
                <span>${item.line}</span>
              </span>
              ${item.widest ? '<span class="act3-timeline-flag">Window was widest here</span>' : ''}
            </li>
          `).join('')}
        </ol>
      </div>
    `;
  }

  /**
   * The dialogue under the chart. On the survival step the variant is chosen from Act 2's
   * decision — and when we were not handed one, the neutral variant runs. Reyes never scolds
   * in any branch.
   */
  renderReportDialogue(step) {
    if (!step) return '';
    let lines = [...step.lines];
    if (step.variants) {
      lines = lines.concat(step.variants[this.decisionChoice || 'unknown'] || step.variants.unknown);
    }
    return lines.map((line, i) => `
      <div class="act3-report-line line-${line.speaker}" data-editor-id="act3-report-line-${this.reportStep}-${i}">
        <span class="act3-report-who">
          ${line.speaker === 'reyes' ? 'Dr. Reyes' : 'Callie'}
          
        </span>
        <p class="act3-report-text">“${line.text}”</p>
      </div>
    `).join('');
  }

  // ---- Beat 3D — Tay's return -------------------------------------------
  renderTayReturn() {
    const step = this.tayReturnSteps[this.stepIndex];
    if (!step) return '';

    // Her first line gets a marker. Nine minutes of story have gone by without her.
    const isFirstTayLine = this.stepIndex === 1;

    return `
      ${isFirstTayLine ? `
        <div class="act3-voice-return-banner" data-editor-id="act3-voice-return-banner" role="note">
          <span class="act3-voice-return-mark" aria-hidden="true">🔊</span>
          <span>She has not said a word since the lake.</span>
        </div>
      ` : ''}
      ${this.renderDialogueStep(step, `act3-return-${this.stepIndex}`)}
    `;
  }

  // ---- Beat 3E — next time ----------------------------------------------
  // Prevention framed forward. Every option is correct — this is not a quiz, it is Callie
  // deciding what changes. The learner picks as many as they like and each one gets a reply.
  renderNextTime() {
    // Sub-beat 0 = the choices; 1+ = the hot-car ten seconds and the 80°F line.
    if (this.stepIndex === 0) {
      const chosen = this.preventionChosen.size;
      const total = this.preventionOptions.length;

      return `
        <div class="act3-prevention-card" data-editor-id="act3-prevention-card" role="group"
             aria-label="What changes about the next lake day">
          <span class="act3-prevention-badge">Beat 3E · Dr. Reyes, washing her hands</span>
          <h2 class="act3-prevention-title">“So what's different about the next lake day?”</h2>
          <p class="act3-prevention-sub">
            Pick as many as you mean. There is no wrong answer in this list —
            <span class="act3-prevention-count">${chosen} of ${total} chosen</span>.
          </p>

          <ul class="act3-prevention-options">
            ${this.preventionOptions.map(opt => {
              const isChosen = this.preventionChosen.has(opt.id);
              return `
                <li class="act3-prevention-item ${isChosen ? 'is-chosen' : ''}">
                  <button class="act3-prevention-option ${isChosen ? 'is-chosen' : ''}"
                          data-prevention="${opt.id}"
                          data-editor-id="act3-prevention-${opt.id}"
                          aria-pressed="${isChosen}"
                          ${isChosen ? `aria-describedby="act3-prevention-reply-${opt.id}"` : ''}>
                    <span class="act3-prevention-icon" aria-hidden="true">${opt.icon}</span>
                    <span class="act3-prevention-label">${opt.label}</span>
                    <!-- Chosen is a glyph and a word, never the green alone (§7.3). -->
                    <span class="act3-prevention-state">
                      ${isChosen ? '<span aria-hidden="true">✓</span> Chosen' : 'Choose'}
                    </span>
                  </button>

                  <!-- Reyes's answer stays attached to the choice that earned it. Showing only
                       the most recent one meant a learner who picked all four could read one,
                       and had to remember the other three. -->
                  ${isChosen ? `
                    <div class="act3-prevention-reply" id="act3-prevention-reply-${opt.id}"
                         data-editor-id="act3-prevention-reply-${opt.id}"
                         ${this.activePrevention === opt.id ? 'role="status"' : ''}>
                      <span class="act3-report-who">Dr. Reyes</span>
                      <p class="act3-report-text">“${opt.reply}”</p>
                    </div>
                  ` : ''}
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      `;
    }

    const step = this.hotCarSteps[this.stepIndex - 1];
    if (!step) return '';
    const stamp = this.activeStamp(this.hotCarSteps, this.stepIndex - 1);

    return `
      ${this.renderDialogueStep(step, `act3-hotcar-${this.stepIndex}`)}
      ${stamp ? this.renderTruthStamp(stamp, `act3-stamp-${stamp.metric.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`) : ''}
    `;
  }

  // ---- Beat 3F — the recheck --------------------------------------------
  renderRecheck() {
    const step = this.recheckSteps[this.stepIndex];
    if (!step) return '';

    // The sheet appears when she tears it off, and stays for the rest of the beat.
    const sheetOut = this.recheckSteps
      .slice(0, this.stepIndex + 1)
      .some(s => s.revealsSheet);

    return `
      <div class="act3-recheck-layer ${sheetOut ? 'has-sheet' : ''}">
        ${sheetOut ? this.renderDischargeSheet() : ''}
        ${this.renderDialogueStep(step, `act3-recheck-${this.stepIndex}`)}
      </div>
    `;
  }

  /**
   * The discharge sheet. An IN-WORLD object — the chart Reyes has been writing on all act,
   * torn off and handed over. Deliberately NOT a printable job aid: the beats doc cuts the
   * glovebox card ("a printable artifact nobody prints is a weak final screen"), so this
   * exists inside the story and leaves with Callie, not with the learner.
   */
  renderDischargeSheet() {
    return `
      <aside class="act3-discharge-sheet" data-editor-id="act3-discharge-sheet"
             aria-label="Tay's discharge instructions">
        <header class="act3-discharge-header">
          <span class="act3-discharge-badge">${this.dischargeSheet.title}</span>
          <span class="act3-discharge-patient">${this.dischargeSheet.patient}</span>
        </header>
        <ul class="act3-discharge-list">
          ${this.dischargeSheet.items.map((item, i) => `
            <li class="act3-discharge-item" data-editor-id="act3-discharge-item-${i}">
              <span class="act3-discharge-glyph" aria-hidden="true">${item.glyph}</span>
              <span class="act3-discharge-copy">
                <strong>${item.label}</strong>
                <span>${item.sub}</span>
              </span>
            </li>
          `).join('')}
        </ul>
      </aside>
    `;
  }

  // ---- Beat 3G — home that evening --------------------------------------
  renderHome() {
    const step = this.homeSteps[this.stepIndex];
    if (!step) return '';
    return this.renderDialogueStep(step, `act3-home-${this.stepIndex}`);
  }

  // ---- The close ---------------------------------------------------------
  // Not a score. The act's whole claim is that every number is a verdict on this playthrough,
  // so the last screen says what this learner actually did and then gets out of the way.
  renderEnd() {
    const waited = this.decisionChoice === 'wait';
    const known = this.decisionChoice !== null;

    return `
      <div class="act3-end-modal" data-editor-id="act3-end-modal" role="dialog"
           aria-modal="true" aria-labelledby="act3-end-title">
      <div class="act3-end-card" data-editor-id="act3-end-card">
        <span class="act3-end-badge">The end</span>
        <h2 class="act3-end-title" id="act3-end-title">Callie and Tay</h2>
        <p class="act3-end-line">
          Tay went home the same day, with a recheck booked for Thursday and somebody
          sitting up with her.
        </p>

        <ul class="act3-end-recap" data-editor-id="act3-end-recap">
          <li>
            <span class="act3-end-recap-label">Signs you found at the lake</span>
            <span class="act3-end-recap-value">${this.hintsDropped} of ${this.hintsDropped}</span>
          </li>
          <li>
            <span class="act3-end-recap-label">Signs you reported to the clinic</span>
            <span class="act3-end-recap-value">4 of 4</span>
          </li>
          ${known ? `
            <li>
              <span class="act3-end-recap-label">When you started cooling her</span>
              <span class="act3-end-recap-value">${waited ? 'After five minutes' : 'Immediately'}</span>
            </li>
          ` : ''}
          <li>
            <span class="act3-end-recap-label">Cooled before the drive</span>
            <span class="act3-end-recap-value">Yes — 2.5× more likely</span>
          </li>
        </ul>

        <p class="act3-end-close">
          Tay never knew anything was wrong. She still doesn't.
          <strong>That part is always going to be your job.</strong>
        </p>

        <div class="act3-end-actions">
          <button id="act3-btn-replay-act3" class="act3-hud-btn btn-action-primary"
                  data-editor-id="act3-btn-replay-act3">⏮ Replay Act 3</button>
          <button id="act3-btn-replay-act1" class="act3-hud-btn" data-editor-id="act3-btn-replay-act1">🐾 Replay Act 1</button>
          <button id="act3-btn-end-title" class="act3-hud-btn" data-editor-id="act3-btn-end-title">🏠 Title</button>
        </div>
      </div>
      </div>
    `;
  }

  // =======================================================================
  // RENDER — NAV CONTROLS
  // =======================================================================

  renderBottomLeftControls() {
    if (this.currentBeat === 'wait') {
      return `
        <button id="act3-btn-skip-wait" class="act3-hud-btn act3-btn-quiet"
                data-editor-id="act3-btn-skip-wait"
                aria-label="Skip the wait and go straight to the verdict (or wait approximately 12 seconds for the doctor to appear)">Skip the wait ▶</button>
      `;
    }
    const back = this.canStepBack() ? `
      <button id="act3-btn-prev-step" class="act3-hud-btn act3-btn-quiet"
                data-editor-id="act3-btn-prev-step"
                aria-label="Go back one step">◀ Back</button>
    ` : '';

    if (this.currentBeat === 'nextTime' && this.stepIndex === 0 && this.preventionChosen.size === 0) {
      return `
        ${back}
        <div class="act3-hud-pill act3-nudge-pill" data-editor-id="act3-nudge-pill">
          <span aria-hidden="true">👆</span>
          <span>Pick the ones you'd actually do</span>
        </div>
      `;
    }
    return back;
  }

  renderBottomRightControls() {
    const steps = this.stepsForBeat();
    if (steps && steps[this.stepIndex]) {
      const step = steps[this.stepIndex];
      if (step.type === 'stage' || step.type === 'hold') return '';
    }
    switch (this.currentBeat) {
      case 'wait':
        return '';

      case 'verdict':
        return this.stepIndex < this.verdictSteps.length - 1 ? `
          <button id="act3-btn-next-step" class="act3-hud-btn" data-editor-id="act3-btn-next-step">Next ▶</button>
        ` : `
          <button id="act3-btn-beat-advance" class="act3-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act3-btn-beat-advance">📋 Look at the chart ➔</button>
        `;

      case 'report':
        return ''; // The modal owns its own navigation.

      case 'tayReturn':
        return this.stepIndex < this.tayReturnSteps.length - 1 ? `
          <button id="act3-btn-next-step" class="act3-hud-btn" data-editor-id="act3-btn-next-step">Next ▶</button>
        ` : `
          <button id="act3-btn-beat-advance" class="act3-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act3-btn-beat-advance">Next time ➔</button>
        `;

      case 'nextTime': {
        if (this.stepIndex === 0) {
          const all = this.preventionChosen.size === this.preventionOptions.length;
          const some = this.preventionChosen.size > 0;
          return `
            <button id="act3-btn-next-step" class="act3-hud-btn ${all ? 'btn-action-primary pulse-btn' : ''}"
                    data-editor-id="act3-btn-next-step">
              ${all ? "That's all of them ➔" : some ? "That's what changes ▶" : 'Nothing changes ▶'}
            </button>
          `;
        }
        return this.stepIndex < this.hotCarSteps.length ? `
          <button id="act3-btn-next-step" class="act3-hud-btn" data-editor-id="act3-btn-next-step">Next ▶</button>
        ` : `
          <button id="act3-btn-beat-advance" class="act3-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act3-btn-beat-advance">Pick up your keys ➔</button>
        `;
      }

      case 'recheck':
        return this.stepIndex < this.recheckSteps.length - 1 ? `
          <button id="act3-btn-next-step" class="act3-hud-btn" data-editor-id="act3-btn-next-step">Next ▶</button>
        ` : `
          <button id="act3-btn-beat-advance" class="act3-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act3-btn-beat-advance">🚗 Take her home ➔</button>
        `;

      case 'home':
        return this.stepIndex < this.homeSteps.length - 1 ? `
          <button id="act3-btn-next-step" class="act3-hud-btn" data-editor-id="act3-btn-next-step">Next ▶</button>
        ` : `
          <button id="act3-btn-beat-advance" class="act3-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act3-btn-beat-advance">Fade ➔</button>
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

    // Every gameplay handler is guarded so that clicking a control to SELECT it in Edit Mode
    // does not also fire its lesson action (§8.3).
    const on = (sel, handler) => {
      const el = q(sel);
      if (!el) return;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        handler(e);
      });
    };

    on('#act3-btn-back-act2', () => this.app?.navigateTo('act2', {
      beat: 'transport',
      handoff: this.getHandoff()
    }));
    on('#act3-btn-title', () => this.app?.navigateTo('opening'));

    on('#act3-btn-next-step', () => this.nextSubStep());
    on('#act3-btn-prev-step', () => this.prevSubStep());
    on('#act3-btn-beat-advance', () => this.nextBeat());

    // --- Beat 3A ---
    on('#act3-btn-skip-wait', () => this.endWait());

    // --- Beat 3C ---
    on('#act3-btn-report-next', () => this.nextReportStep());
    on('#act3-btn-report-prev', () => this.prevSubStep());
    on('#act3-btn-report-done', () => this.nextBeat());
    on('#act3-btn-report-table', () => { this.reportTableExpanded = !this.reportTableExpanded; this.render(); });

    // --- Beat 3E ---
    this.container.querySelectorAll('.act3-prevention-option').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.togglePrevention(el.getAttribute('data-prevention'));
      });
    });

    // --- The close ---
    on('#act3-btn-replay-act3', () => this.app?.navigateTo('act3', { handoff: this.getHandoff() }));
    on('#act3-btn-replay-act1', () => this.app?.navigateTo('act1'));
    on('#act3-btn-end-title', () => this.app?.navigateTo('opening'));
  }

  /**
   * The playthrough state, in the shape applyHandoff() accepts. Used by Replay Act 3 and by
   * the "◀ Act 2" button — Act 2 rebuilds itself from defaults otherwise, which silently
   * throws away the decision this whole act is a verdict on.
   */
  getHandoff() {
    return {
      ...this.handoff,
      decisionChoice: this.decisionChoice,
      checkReportOrder: [...this.checkReportOrder],
      hintsDropped: this.hintsDropped,
      rewetCount: this.rewetCount,
      coolingWrongCount: this.coolingWrongCount
    };
  }

  /**
   * Advance the case file and bring the panel that just appeared into view. Revealing a panel
   * below the fold and leaving the learner looking at the previous one is the failure mode of
   * a progressive reveal.
   */
  nextReportStep() {
    if (this.reportStep >= this.reportSteps.length - 1) return;
    this.reportStep++;
    this.render();
    const body = this.container?.querySelector('.act3-report-body');
    if (!body) return;
    const revealed = body.lastElementChild;
    revealed?.scrollIntoView({
      block: 'end',
      behavior: this.prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }

  togglePrevention(id) {
    if (!id) return;
    if (this.preventionChosen.has(id)) {
      this.preventionChosen.delete(id);
      this.activePrevention = this.activePrevention === id ? null : this.activePrevention;
    } else {
      this.preventionChosen.add(id);
      this.activePrevention = id;
    }
    this.render();
  }

  // =======================================================================
  // BEAT TRANSITIONS
  // =======================================================================

  /** The step arrays each beat advances through, so nextSubStep has one shape to reason about. */
  stepsForBeat() {
    switch (this.currentBeat) {
      case 'verdict': return this.verdictSteps;
      case 'tayReturn': return this.tayReturnSteps;
      case 'recheck': return this.recheckSteps;
      case 'home': return this.homeSteps;
      // 3E runs one selection screen and then the hot-car lines, so its length is offset by 1.
      case 'nextTime': return [null, ...this.hotCarSteps];
      default: return null;
    }
  }

  nextSubStep() {
    const steps = this.stepsForBeat();
    if (!steps) return;
    if (this.stepIndex < steps.length - 1) {
      this.stepIndex++;
      this.render();
    }
  }

  nextBeat() {
    const order = ['wait', 'verdict', 'report', 'tayReturn', 'nextTime', 'recheck', 'home', 'end'];
    const i = order.indexOf(this.currentBeat);
    if (i === -1 || i === order.length - 1) return;

    this.currentBeat = order[i + 1];
    this.stepIndex = 0;
    this.stopWaitTimer();

    // Time passes between beats, not only inside them.
    const jump = { verdict: 0, report: 3, tayReturn: 6, nextTime: 4, recheck: 3, home: 214, end: 0 };
    this.clockMinutes += jump[this.currentBeat] ?? 0;

    this.render();

    // A newly opened dialog takes focus (§7.4). renderPreservingFocus keeps the learner on
    // their control everywhere else.
    if (this.currentBeat === 'report') {
      focusInto(this.container, ['#act3-btn-report-next', '#act3-btn-report-done']);
    } else if (this.currentBeat === 'end') {
      focusInto(this.container, ['#act3-btn-replay-act3']);
    }
  }

  /**
   * Step back within the current beat. Advancing past a line the learner was still reading is
   * the single most common thing to want undone in a dialogue screen, and Acts 1 and 2 both
   * bind ArrowLeft for it — Act 3 did not, which made the same key mean three things across
   * the module.
   *
   * Beat boundaries are not crossed. Going back into a finished beat would mean rewinding the
   * clock, the recovery ramp and Tay's status; the HUD's "◀ Act 2" is the honest way out of
   * an act you want to leave.
   */
  prevSubStep() {
    if (this.currentBeat === 'report') {
      if (this.reportStep === 0) return false;
      this.reportStep--;
    } else {
      if (this.stepIndex === 0 || !this.stepsForBeat()) return false;
      const steps = this.stepsForBeat();
      this.stepIndex--;
      while (this.stepIndex > 0 && steps[this.stepIndex] && (steps[this.stepIndex].type === 'stage' || steps[this.stepIndex].type === 'hold')) {
        this.stepIndex--;
      }
    }
    this.render();
    return true;
  }

  /** Back is only offered where there is something to go back to — never a dead control. */
  canStepBack() {
    if (this.currentBeat === 'report') return this.reportStep > 0;
    if (this.currentBeat === 'end') return false;
    return this.stepIndex > 0 && !!this.stepsForBeat();
  }

  // =======================================================================
  // KEYBOARD — matches Act 1 and Act 2: ArrowRight / Space advance,
  // ArrowLeft steps back, Escape closes an open dialog.
  // =======================================================================

  handleKeyDown(e) {
    if (this.isEditModeActive()) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Escape closes the case file, per docs/design-language.md §7.4. It closes it FORWARD —
    // the file is a beat the story passes through, not an optional overlay, and dropping the
    // learner back into an empty lobby would be a dead end rather than an exit.
    if (e.key === 'Escape') {
      if (this.currentBeat === 'report') {
        e.preventDefault();
        this.nextBeat();
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prevSubStep();
      return;
    }

    const isAdvance = e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Space' || e.key === 'Spacebar';
    if (!isAdvance) return;

    // Space on a focused button is the button's own job — do not double-fire it.
    if (e.key !== 'ArrowRight' && e.target.tagName === 'BUTTON') return;

    if (this.currentBeat === 'report') {
      e.preventDefault();
      if (this.reportStep < this.reportSteps.length - 1) this.nextReportStep();
      else this.nextBeat();
      return;
    }

    if (this.currentBeat === 'wait') {
      e.preventDefault();
      this.endWait();
      return;
    }

    const steps = this.stepsForBeat();
    if (!steps) return;

    e.preventDefault();
    if (this.stepIndex < steps.length - 1) this.nextSubStep();
    else this.nextBeat();
  }
}
