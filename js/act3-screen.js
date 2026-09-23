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
 * SME PENDING: No items are currently pending SME review in this act.
 * (The pattern remains in getSmePendingCopy() for future use).
 */

import { renderPreservingFocus, focusInto, containFocusIn, releaseFocusContainment } from './a11y-focus.js';

export class Act3Screen {
  constructor(app) {
    this.app = app;
    this.container = null;

    // ---- Core beat state -------------------------------------------------
    // 'wait' | 'verdict' | 'report' | 'tayReturn' | 'nextTime' | 'recheck' | 'home' | 'recap' | 'end'
    this.currentBeat = 'wait';
    this.stepIndex = 0;
    this._enteredBeat = null;
    this._renderedStep = null;

    // ---- Beat 3A: the wait ----------------------------------------------
    // Twelve seconds of nothing, which is what makes the vet's entrance land. It is a real
    // wait, not a loading bar — but it is never a trap: `#act3-btn-skip-wait` is present and
    // focusable from the first frame (H3, user control and freedom).
    this.waitOver = false;
    this.castState = { callie: 'waiting', reyes: 'absent', tay: 'absent' };

    // ---- Handed forward from Act 2 (see applyHandoff) --------------------
    // null means "we were not told" — the act-or-wait payoff falls back to its neutral variant
    // rather than accusing a learner of a choice they may not have made.
    this.decisionChoice = null;   // 'act_now' | 'wait' | null
    this.checkReportOrder = [];   // the four Act 2 checks, in the order the learner took them
    this.hintsDropped = 4;        // carried from Act 1's HUD
    this.coolingWrongCount = 0;
    // The raw payload Act 2 sent, carried unmodified so it can be handed straight back.
    this.handoff = {};

    // ---- Beat 3C: the report card ---------------------------------------
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

    this.sources = [
      'Beard, Sian, et al. "Epidemiology of Heat-Related Illness in Dogs under UK Emergency Veterinary Care in 2022." <i>Veterinary Record</i>, vol. 194, no. 11, 2024, article e4153, https://doi.org/10.1002/vetr.4153.',
      'Hall, Emily J., et al. "Incidence and Risk Factors for Heat-Related Illness (Heatstroke) in UK Dogs under Primary Veterinary Care in 2016." <i>Scientific Reports</i>, vol. 10, no. 1, 2020, article 9128, https://doi.org/10.1038/s41598-020-66015-8.',
      '"Heat Stroke in Dogs." <i>Vets Now</i>, www.vets-now.com/pet-care-advice/heat-stroke-in-dogs/. Accessed 21 Sept. 2026.',
      '"Heatstroke: A Medical Emergency." <i>Riney Canine Health Center</i>, Cornell University College of Veterinary Medicine, www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center/canine-health-information/heatstroke-medical-emergency. Accessed 21 Sept. 2026.',
      '"Hot Dogs." <i>VetCompass</i>, Royal Veterinary College, www.rvc.ac.uk/vetcompass/research-projects-and-facilities/hot-dogs. Accessed 21 Sept. 2026.',
      'Hunter, Tammy, and Ernest Ward. "Heat Stroke in Dogs." <i>VCA Animal Hospitals</i>, vcahospitals.com/know-your-pet/heat-stroke-in-dogs. Accessed 21 Sept. 2026.',
      '"Keep Pets Cool in the Summer Heat." <i>Pet Talk</i>, Texas A&amp;M College of Veterinary Medicine &amp; Biomedical Sciences, 6 June 2019, vetmed.tamu.edu/news/pet-talk/keep-pets-cool-in-the-summer-heat/.',
      'McLaren, Catherine, et al. "Heat Stress from Enclosed Vehicles: Moderate Ambient Temperatures Cause Significant Temperature Rise in Enclosed Vehicles." <i>Pediatrics</i>, vol. 116, no. 1, 2005, pp. e109–12, https://doi.org/10.1542/peds.2004-2368.',
      'Null, Jan. "Heatstroke Deaths of Children in Vehicles." <i>No Heat Stroke</i>, San Francisco State University, www.noheatstroke.org. Accessed 21 Sept. 2026.'
    ];

    // ---- Beat 3B — The verdict --------------------------------------------
    // `business` is Reyes's stage direction, surfaced as her byline. She never stands still.
    this.verdictSteps = [
      { speaker: 'reyes', business: 'chart in hand, already talking', text: "She's stable." },
      { type: 'stage', text: 'Callie stands up too fast.', sceneCue: 'Callie stands up too fast.', cast: { callie: 'relief' } },
      { speaker: 'callie', text: "She's — okay? She's okay?" },
      { speaker: 'reyes', business: 'reading the chart', text: "She's going to be. She came in at 105.8, and she was hotter than that out at the lake. So yes — she's earned the word <em>stable</em>." },
      { speaker: 'callie', text: "But she's okay." },
      { speaker: 'reyes', business: 'finally looking up from the chart', text: "Yeah. She's okay.", cast: { reyes: 'warm' } },
      {
        type: 'hold',
        sceneCue: 'Two seconds. Nobody says anything.'
      },
      { speaker: 'reyes', business: 'clipping the chart under her arm', text: "You cooled her before you drove.", cast: { reyes: 'chart' } },
      { speaker: 'callie', text: "The tech on the phone talked me through it. I just did exactly what she said." },
      {
        speaker: 'reyes',
        business: 'washing her hands at the clinic sink',
        text: "Good. That's the whole difference. Dogs that get cooled before the car are about <strong>2.5 times</strong> more likely to make it than dogs that don't. You didn't just drive her here, Callie. You started treating her — and <em>then</em> you drove.",
        cast: { reyes: 'warm' },
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
        sign: 'Panting',
        reported: 'Fast, shallow, never pausing',
        stageNo: 1,
        stage: 'Early',
        note: 'The easiest one in the world to explain away as a hot day.'
      },
      {
        id: 'ears',
        sign: 'Ears',
        reported: 'Hot right through, no cool spot',
        stageNo: 2,
        stage: 'Building',
        note: 'Heat coming out of her, not sun landing on her.'
      },
      {
        id: 'gums',
        sign: 'Gums + capillary refill',
        short: 'Gums',
        reported: 'Brick red · refill over 2 seconds',
        stageNo: 3,
        stage: 'Advanced',
        note: 'Refill time is the measurement. Colour on its own can fool you.'
      },
      {
        id: 'name',
        sign: 'Response to her name',
        short: 'Her name',
        reported: 'Delayed, then absent',
        stageNo: 3,
        stage: 'Advanced',
        note: 'By here the window is closing, not open.'
      }
    ];

    // How often each early sign actually gets logged. Bar length AND the numeral carry the
    // value — never the colour (§7.3).
    this.prevalence = [
      { id: 'panting', label: 'Panting', pct: 69, said: 'about 69% of cases' },
      { id: 'lethargy', label: 'Lethargy', pct: 48, said: 'about 48%' }
    ];

    // The Act 1 timeline, restated one last time. Times match Act 2's `hintsTimeline` exactly —
    // if one changes, change both.
    this.hintsTimeline = [
      { time: '1:30 PM', title: 'The cooler, in open sun', line: '90 minutes against a cold box.', nextTime: 'Put the cooler in the shade and keep her with it. Cold on the outside is still an oven on the inside.' },
      { time: '1:48 PM', title: 'The dock', line: '137°F boards, patrolled twice.', widest: true, nextTime: "Press your palm on the boards for 5 seconds before she walks them. If you can't hold it there, she can't stand on it." },
      { time: '2:03 PM', title: 'The water bowl', line: 'Sun-warm, half empty, untouched.', nextTime: "Bowl in the shade, refilled every time you refill your own. Warm water in the sun doesn't get drunk." },
      { time: '2:38 PM', title: 'The shade that moved', line: '27 minutes asleep in full sun.', nextTime: "Look at where the shadow is every 30 minutes. It moves. A sleeping dog doesn't." }
    ];

    // Reyes walks the timeline while she works. Each step reveals one panel of the report,
    // which is what keeps a waiting room moving.
    this.reportSteps = [
      {
        reveals: 'table',
        lines: [
          { speaker: 'reyes', business: 'writing', text: "What you told them on the phone — the panting, the gums, her not coming when you called. You said it like 4 separate problems. It's not. It's one thing, at 3 different stages." },
          { speaker: 'callie', text: "One thing." }
        ]
      },
      {
        reveals: 'prevalence',
        lines: [
          { speaker: 'reyes', business: 'still writing', text: "Heat. Panting is the early stage — we see it in about 69% of cases. Lethargy in about 48%. They're the first signs, and the easiest ones to wave off, because —" },
          { speaker: 'callie', text: "— because she just looked tired. I thought she was tired." },
          { speaker: 'reyes', business: 'not unkindly', text: "Everyone does. That's the trap. The early stage looks like a normal afternoon." }
        ]
      },
      {
        reveals: 'survival',
        lines: [
          {
            speaker: 'reyes',
            business: 'flat, not warning',
            text: "Caught while it's still mild, dogs come through about 95% of the time. Once it's severe before anyone starts cooling, that drops to about 43%.",
            stamp: {
              metric: '95% → 43%',
              line: 'Treated while it is still mild against treated once it is already severe. The gap is not the illness. The gap is the delay.'
            }
          }
        ],
        variants: {
          act_now: [
            { speaker: 'reyes', business: 'glancing at the chart', text: "She was on the good side of that when she came through the door. Barely — but she was. That's your <em>right away</em> at the lake." }
          ],
          wait: [
            { speaker: 'reyes', business: 'glancing at the chart', text: "You waited a few minutes out there before you started." },
            { speaker: 'callie', text: "I thought she'd settle." },
            { speaker: 'reyes', business: 'no edge in it at all', text: "I know. Everybody thinks that. That gap between 95 and 43 — that's where those few minutes live." }
          ],
          unknown: [
            { speaker: 'reyes', business: 'letting it sit', text: "Where a dog lands in that range mostly comes down to one thing: how long it took for somebody to start cooling her." }
          ]
        }
      },
      {
        reveals: 'breed',
        lines: [
          {
            speaker: 'reyes',
            business: 'assuming Callie already knew this',
            text: "And she was never running the same odds as other dogs. Brachycephalic breeds — the flat-faced ones, Frenchies, bulldogs, pugs — get heat illness about <strong>4 times</strong> as often.",
            stamp: {
              metric: '4× the risk',
              line: 'Brachycephalic (flat-faced) breeds are diagnosed with heat illness roughly 4× as often. Tay has been playing this hand her whole life.'
            }
          },
          { speaker: 'callie', text: "4 times?" },
          { speaker: 'reyes', business: 'gentler now', text: "4 times. That face is adorable, and it's a compromise. She's got a shorter airway than the dog next to her, and panting is the only cooling she's got." },
          { speaker: 'callie', text: "Can I see her?" },
          { speaker: 'reyes', business: 'gentler now', text: "She's just in the back. Give me one second.", cast: { reyes: 'warm' } }
        ]
      }
    ];

    // ---- Beat 3D — Tay's return -------------------------------------------
    // HER VOICE HAS BEEN GONE SINCE ONE LINE IN ACT 2. Text is verbatim from the dialogue
    // script. Lines flagged `trimCandidate` are the small-room pair the script names as the
    // first cut if the run drags in review — the thermometer and the cone carry it.
    this.tayReturnSteps = [
      { type: 'stage', text: 'A tech walks her out on a leash. Tail going like nothing happened.', sceneCue: 'A tech walks her out on a leash. Tail going like nothing happened.' },
      { speaker: 'tay', onomatopoeia: 'YIP YIP YIP!', text: 'CALLIE. CALLIE. CALLIE.' },
      { speaker: 'tay', onomatopoeia: 'AROOO.', text: 'They took my temperature. From the WRONG END.' },
      { type: 'stage', text: 'Callie is on the floor. Tay is climbing her.', sceneCue: 'Callie is on the floor. Tay is climbing her.', cast: { callie: 'floor' } },
      { speaker: 'callie', text: "I know, baby. I know. Come here." },
      { speaker: 'tay', onomatopoeia: 'HRMPH.', text: "There was a small room. It had no snacks. I'd like to file something." },
      { speaker: 'callie', business: 'laughing, wrecked', text: "Okay… okay. We'll file something." },
      {
        speaker: 'tay',
        onomatopoeia: 'HUFF.',
        // Verbatim Act 0 callback. Recognition is the payoff; nothing on screen points at it.
        text: 'But I feel amazing! I always feel amazing!'
      },
      { type: 'stage', text: 'Callie looks up at Dr. Reyes.', sceneCue: 'Callie looks up at Dr. Reyes.' },
      { speaker: 'callie', text: "She says she feels amazing." },
      { speaker: 'reyes', business: 'watching the dog, not the owner', text: "Yeah. <em>That's</em> the part that'll get you.", cast: { reyes: 'serious' } }
    ];

    // ---- Beat 3E — Next time ----------------------------------------------
    // Prevention framed forward, never corrective. There are no wrong answers here; every
    // option is a real change and each one gets a real reply.
    this.preventionOptions = [
      {
        id: 'setup_first',
        icon: '1',
        label: 'Shade and water set up before anything else',
        reply: "Set it up before you even touch the cooler. Real shade she can reach, and her water sitting in it."
      },
      {
        id: 'timing',
        icon: '2',
        label: 'Go early or late, not one in the afternoon',
        reply: "Mornings or evenings. 1 PM in July is the worst hour of the day, and it's the one everybody picks."
      },
      {
        id: 'temp_humidity',
        icon: '3',
        label: 'Watch the temperature, not just the sun',
        reply: "Past 80°F I'd think twice. And check the humidity — that's the part people miss. Panting barely works when the air's already wet."
      },
      {
        id: 'stay_in',
        icon: '4',
        label: 'Some days she just stays inside',
        reply: "AC and a puzzle toy. She'll act completely betrayed. She'll live."
      }
    ];

    // Ten seconds, then move on. Handed to Callie as ammunition for somebody else — Texas
    // learners already know this and being taught it insults them.
    this.hotCarSteps = [
      { speaker: 'reyes', business: 'drying her hands', text: "And I know you already know about cars.", cast: { reyes: 'warm' } },
      { speaker: 'callie', text: "Nobody leaves a dog in a car." },
      {
        speaker: 'reyes',
        business: 'washing her hands',
        cast: { reyes: 'serious' },
        text: "You'd think. It's 20 degrees hotter inside within the first 10 minutes. And cracking the windows? That takes it from about 3.5 degrees every 5 minutes to about 3. It does <strong>next to nothing</strong>.",
        stamp: {
          metric: '+20°F in 10 min',
          line: 'Cracking the windows barely moves it: about 3.4°F every 5 minutes becomes about 3.1°F. It does next to nothing.'
        }
      },
      { speaker: 'callie', text: "That's — that's it? Half a degree?" },
      { speaker: 'reyes', business: 'handing it over, not lecturing', cast: { reyes: 'warm' }, text: "That's it. You don't need this lecture. Somebody you know does — so now you've got the number." },
            {
        speaker: 'reyes',
        business: 'on her way to the door',
        text: "And if you're out in it anyway — every 15 or 20 minutes of anything active, stop for 10 or 15 in the shade. That's Texas A&M's number for heat like ours, and it's the one I'd give you.",
        cast: { reyes: 'serious' },
        stamp: {
          metric: '10–15 min break every 15–20',
          line: 'Past 80°F: every 15–20 minutes of activity, 10–15 minutes of shade, water and stillness. Not a shorter walk — more stops.'
        }
      }
    ];

    // ---- Beat 3F — The recheck --------------------------------------------
    this.recheckSteps = [
      { type: 'stage', text: 'Tay is standing, tail going, obviously herself. Callie picks up her keys.', sceneCue: 'Tay is standing, tail going, obviously herself. Callie picks up her keys.', cast: { callie: 'leaving', tay: 'leading', reyes: 'aside' } },
      { speaker: 'reyes', business: 'not moving out of the doorway', text: "One more thing.", cast: { callie: 'turned', tay: 'turned' } },
      { speaker: 'callie', text: "She's fine, though. You said she's fine." },
      { speaker: 'reyes', business: 'chart back out', text: "She is, today. Her bloodwork's normal — that's good, and it's not the whole story. Kidneys and clotting can go sideways 12–48 hours after something like this. It doesn't show up while you're standing here." },
      {
        speaker: 'reyes',
        business: 'nodding at Tay',
        text: "She looks great right now. Which is <em>exactly</em> why people skip this part."
      },
      { speaker: 'callie', text: "…Okay. Okay, what do I do?" },
      {
        speaker: 'reyes',
        business: 'tearing off the sheet and handing it over',
        text: "Bring her back in a day or two. Sooner if she throws up, if her urine goes dark, if you see any bleeding, or if she goes flat on you again. It's all on here.",
        revealsSheet: true,
        cast: { callie: 'handover', reyes: 'absent' }
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
        { glyph: '1', label: "Bloodwork today: normal", sub: "Good. Not the whole story — this is a snapshot of right now." },
        { glyph: '2', label: 'Recheck in 24–48 hours', sub: 'Kidney and clotting problems surface late. Book it before you leave.' },
        { glyph: '3', label: 'Come back sooner if you see any of these', sub: 'Vomiting · dark urine · any bleeding · going flat again' },
        { glyph: '4', label: 'Watch her tonight', sub: 'Not a figure of speech. Somebody in the room with her.' }
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
      { speaker: 'callie', business: 'a beat', text: "Yeah. Next one'll be better." }
    ];

    this.handleKeyDown = this.handleKeyDown.bind(this);
      }


  getPreventionButtonState() {
    const all = this.preventionChosen.size === this.preventionOptions.length;
    const some = this.preventionChosen.size > 0;
    return {
      className: `act3-hud-btn ${all ? 'btn-action-primary pulse-btn' : (some ? '' : 'act3-btn-quiet')}`,
      html: all ? "That's all of them ➔" : some ? "That's what changes ▶" : 'Nothing changes ▶'
    };
  }

  getPreventionStateHtml(isChosen) {
    return isChosen ? '<span aria-hidden="true">✓</span> Chosen' : 'Choose';
  }

  // =======================================================================
  // LIFECYCLE
  // =======================================================================

  mount() {
    this.container = document.getElementById('screen-act3');
    if (!this.container) return;

    this._enteredBeat = null;
    this._renderedStep = null;
    this.render();
        window.addEventListener('keydown', this.handleKeyDown);
  }

  unmount() {
    if (this._autoAdvanceTimer) clearTimeout(this._autoAdvanceTimer);
    window.removeEventListener('keydown', this.handleKeyDown);
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
    this._enteredBeat = null;
    this._renderedStep = null;
    if (handoff.decisionChoice === 'act_now' || handoff.decisionChoice === 'wait') {
      this.decisionChoice = handoff.decisionChoice;
    }
    if (Array.isArray(handoff.checkReportOrder)) this.checkReportOrder = [...handoff.checkReportOrder];
    if (Number.isFinite(handoff.hintsDropped)) this.hintsDropped = handoff.hintsDropped;
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
   * getSmePendingCopy(). Currently: no items pending.
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
      recap: 1.0,
      end: 1.0
    };
    const r = byBeat[this.currentBeat] ?? 1;
    return {
      recovery: r.toFixed(3),
      // 46% drained at the door, fully saturated by the time she is climbing Callie.
      saturation: (54 + r * 46).toFixed(1),
      // The clinical cool wash over the clinic, gone by the time the room warms up.
      coolOpacity: (0.42 * (1 - r)).toFixed(3)
    };
  }

  /**
   * Tay's status, as the clinic knows it. Text carries the state; colour only reinforces (§6.1).
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

  endWait() {
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
        if (!this.isEditModeActive()) {
          const active = document.activeElement;
          const shouldRefocus = active === document.body || (this.container && this.container.contains(active));
          this._autoAdvanceTimer = setTimeout(() => {
            this.nextSubStep();
            if (shouldRefocus) {
              focusInto(this.container, ['#act3-btn-next-step', '#act3-btn-beat-advance', '#act3-btn-report-next']);
            }
          }, delay);
        }
      }
    }
  }

  renderNow() {
    if (!this.container) return;

    const { recovery, saturation, coolOpacity } = this.getRecovery();
    const scene = this.getScene();

    const entering = this._enteredBeat !== this.currentBeat;
    this._enteredBeat = this.currentBeat;

    this.container.innerHTML = `
      <div class="act3-container" data-editor-id="act3-screen-container">

        <!-- 16:9 viewport card — geometry matched to Act 1 and Act 2 so the product reads
             as one piece. §9 of docs/design-language.md. -->
        <div
          id="act3-card"
          class="act3-viewport-card scene-${scene.key} ${entering ? 'is-entering' : ''}"
          data-callie="${this.castState?.callie || ''}"
          data-reyes="${this.castState?.reyes || ''}"
          data-beat="${this.currentBeat}"
          data-editor-id="act3-viewport-card"
          style="--act3-saturation: ${saturation}%; --act3-cool-opacity: ${coolOpacity}; --act3-recovery: ${recovery};"
        >
          ${scene.html}

          <!-- Light wash. Cool and clinical in the clinic, warm and low in the evening. -->
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
          <p class="sr-only" role="status" aria-live="polite" id="act3-sr-dialogue" data-editor-id="act3-sr-dialogue">
            ${this.getSrDialogueText()}
          </p>
        </div>
      </div>
    `;

    this.bindEvents();
    this._renderedStep = `${this.currentBeat}-${this.stepIndex}`;
  }

  /**
   * Whether this beat renders a scrimmed dialog. Those beats lift the speech layer above the
   * HUD so the scrim actually covers the chrome — which is what makes the inert-behind-the-
   * dialog state honest rather than a row of buttons that look live and are not.
   */
  beatHasModal() {
    return this.currentBeat === 'recap' || this.currentBeat === 'end';
  }


  renderSrStatusText() {
    const status = this.getTayStatus();
    switch (this.currentBeat) {
      case 'wait':
        return `The treatment room. ${status.aria} Callie is waiting.`;
      case 'verdict':
        return `${status.aria} Dr. Reyes is explaining what made the difference.`;
      case 'report':
        return `${status.aria} Dr. Reyes is discussing the signs.`;
      case 'tayReturn':
        return 'Tay is back on her feet, wearing a cone, and talking again for the first time since the lake.';
      case 'nextTime':
        return `${this.preventionChosen.size} of ${this.preventionOptions.length} changes chosen for the next lake day.`;
      case 'recheck':
        return 'Dr. Reyes is giving discharge instructions: recheck in 24 to 48 hours, and watch her tonight.';
      case 'home':
        return 'That evening, at home. Tay is asleep on the couch and Callie is sitting with her.';
      case 'recap':
        return 'A summary of what happened to Tay this afternoon.';
      default:
        return 'The story is over. You can replay an act or return to the title screen.';
    }
  }

  getSrDialogueText() {
    const steps = this.stepsForBeat();
    if (!steps || !steps[this.stepIndex]) return '';
    const step = steps[this.stepIndex];
    if (step.type === 'stage' || step.type === 'hold') return '';
    
    let speaker = step.speaker;
    if (speaker === 'reyes') speaker = 'Dr. Reyes';
    if (speaker === 'callie') speaker = 'Callie';
    if (speaker === 'tay') speaker = 'Tay';
    
    return `${speaker}: ${step.text}`;
  }

  /** Which room we are in. Clinic is drawn; the exam room and the living room are painted. */

  /**
   * Who is on stage and with what face. Derived, never accumulated: the beat's default is
   * folded with every `cast` change on the steps up to and including the current one, so
   * Back, deep links and replays all land on the same picture the story would have shown.
   */
  getCastState() {
    const defaults = {
      wait:      { callie: 'waiting', reyes: 'absent',  tay: 'absent' },
      verdict:   { callie: 'waiting', reyes: 'chart',   tay: 'absent' },
      report:    { callie: 'relief',  reyes: 'chart',   tay: 'absent' },
      tayReturn: { callie: 'relief',  reyes: 'warm',    tay: 'happy' },
      nextTime:  { callie: 'relief',  reyes: 'warm',    tay: 'sniffing' },
      recheck:   { callie: 'leaving', reyes: 'aside',   tay: 'leading' }
    };
    let state = { ...(defaults[this.currentBeat] || defaults.recheck) };
    const steps = this.stepsForBeat();
    const upTo = this.stepIndex;
    if (Array.isArray(steps)) {
      for (let i = 0; i <= upTo && i < steps.length; i++) {
        if (steps[i] && steps[i].cast) state = { ...state, ...steps[i].cast };
      }
    }
    return state;
  }

  getScene() {
    this.castState = this.getCastState();

    // Generate cast HTML
    const getCastImg = (char, activeState) => {
      const srcMap = {
        'callie': {
          'waiting': 'Callie-Clinic-Seated.png',
          'relief': 'Callie-Clinic-Relief.png',
          'floor': 'Callie-Clinic-FloorLaughing.png',
          'leaving': 'Callie-Clinic-Leaving.png',
          'turned': 'Callie-Clinic-Leaving.png',   // same still, mirrored in CSS: she has turned to face Reyes
          'handover': 'Callie-Reyes-Handover.png'
        },
        'reyes': {
          'chart': 'Reyes-Chart.png',
          'warm': 'Reyes-Warm.png',
          'serious': 'Reyes-Serious.png',
          'sheet': 'Reyes-HandingSheet.png',
          'aside': 'Reyes-Warm.png'
        },
        'tay': {
          'happy': 'Tay-StandingStage2-Warm.png',
          'sniffing': 'Tay-SniffingGround.png',
          'leading': 'Tay-StandingSideProfile.png',
          'turned': 'Tay-StandingStage1-Alert.png'
        }
      };
      
      const altMap = {
        callie: {
          waiting: 'Callie in a clinic chair, drained, hands empty',
          relief: 'Callie standing, hands to her chest, relief breaking through',
          floor: 'Callie on the treatment room floor, laughing, eyes shut',
          leaving: 'Callie gathering her things to leave',
          turned: 'Callie pausing halfway out the door',
          handover: 'Dr. Reyes handing Callie the discharge sheet'
        },
        reyes: {
          chart: 'Dr. Reyes reading the chart',
          warm: 'Dr. Reyes looking up from the chart with a small, kind smile',
          serious: 'Dr. Reyes, level and plain',
          sheet: 'Dr. Reyes holding out the discharge sheet',
          aside: 'Dr. Reyes leaning in the doorway'
        },
        tay: {
          happy: 'Tay, tail up, tongue out, obviously herself',
          sniffing: 'Tay nosing around the treatment room floor',
          leading: 'Tay pulling on the leash, ready to go',
          turned: 'Tay stopped at the door, looking back at Dr. Reyes'
        }
      };

      let html = '';
      if (activeState === 'absent') return html;
      for (const [stateName, src] of Object.entries(srcMap[char])) {
        const isActive = activeState === stateName;
        const activeClass = isActive ? 'is-active' : '';
        const stateClass = `is-state-${stateName}`;
        const ariaHidden = isActive ? '' : ' aria-hidden="true"';
        html += `<img id="act3-cast-${char}-${stateName}" src="Assets/Image/${src}" data-editor-id="act3-art-${char}-${stateName}" alt="${altMap[char][stateName]}" class="act3-cast-img act3-cast-${char} ${activeClass} ${stateClass}"${ariaHidden}>\n`;
      }
      return html;
    };

    const castHtml = `
      <div class="act3-cast">
        ${getCastImg('callie', this.castState.callie)}
        ${getCastImg('tay', this.castState.tay)}
        ${getCastImg('reyes', this.castState.reyes)}
      </div>
    `;

    if (['wait', 'verdict', 'report', 'tayReturn', 'nextTime', 'recheck'].includes(this.currentBeat)) {
      return { 
        key: 'clinic', 
        wash: 'wash-clinical', 
        html: `
          <img class="act3-scene-img" src="Assets/Image/Clinic-TreatmentRoom-BG.jpg" data-editor-id="act3-art-clinic" alt="The treatment room">
          ${castHtml}
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
    const order = ['wait', 'verdict', 'report', 'tayReturn', 'nextTime', 'recheck', 'home', 'recap', 'end'];
    const currentBeatNum = Math.max(1, order.indexOf(this.currentBeat) + 1);
    const totalBeats = order.length;

    return `
      <header class="act3-hud-bar" data-editor-id="act3-hud-bar">
        <div class="act3-hud-group">
          <button id="act3-btn-back-act2" class="act3-hud-btn" data-editor-id="act3-btn-back-act2"
                  title="Return to Act 2" aria-label="Return to Act 2">◀ Act 2</button>
          <button id="act3-btn-title" class="act3-hud-btn" data-editor-id="act3-btn-title"
                  title="Return to Title" aria-label="Return to the title screen">Title</button>
        </div>

        <div class="act3-hud-group">
          <div class="act3-hud-pill progress-pill" data-editor-id="act3-hud-progress"
               aria-label="Act 3 progress: Beat ${currentBeatNum} of ${totalBeats}">
            <span class="act3-hud-label" aria-hidden="true">BEAT</span>
            <span class="act3-hud-count">${currentBeatNum}/${totalBeats}</span>
          </div>

          <div class="act3-hud-pill clock-pill" data-editor-id="act3-hud-clock" title="Clinic time">
            <span>${this.getFormattedTime()}</span>
          </div>

          <!-- The engine of Beat 3A. It says IN BACK, and it keeps saying IN BACK. -->
          <div class="act3-hud-pill status-pill tone-${status.tone}" data-editor-id="act3-hud-status"
               aria-label="${status.aria}">
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

    const stepKey = `${this.currentBeat}-${this.stepIndex}`;
    const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';

    if (step.speaker === 'tay') {
      return `
        <div class="speech-bubble tay-bubble act3-tay-bubble ${isNewLineClass}" data-step="${stepKey}" data-editor-id="${editorId}-tay">
          <div class="speech-bubble-speaker">
            <span>Tay</span>
          </div>
          <p class="speech-bubble-text">
            ${step.onomatopoeia ? `<span class="tay-onomatopoeia">${step.onomatopoeia}</span> ` : ''}<span class="tay-sub-dialogue">(${step.text})</span>
          </p>
        </div>
      `;
    }

    if (step.speaker === 'reyes') {
      const textProp = step.smePending ? step.textUnattributed || step.text : step.text;
      return `
        <div class="speech-bubble reyes-bubble act3-reyes-bubble ${isNewLineClass}" data-step="${stepKey}" data-editor-id="${editorId}-reyes">
          <div class="speech-bubble-speaker">
            <span>Dr. Reyes</span>
            
          </div>
          <p class="speech-bubble-text">
            <span class="act3-reyes-dialogue">“${textProp}”</span>
          </p>
        </div>
      `;
    }

    return `
      <div class="speech-bubble callie-bubble act3-callie-bubble ${isNewLineClass}" data-step="${stepKey}" data-editor-id="${editorId}-callie">
        <div class="speech-bubble-speaker">
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
      case 'report':
        const rSteps = this.stepsForBeat();
        const rStep = rSteps[this.stepIndex];
        if (!rStep) return '';
        const rStamp = this.activeStamp(rSteps, this.stepIndex);
        return `
          ${this.renderDialogueStep(rStep, `act3-report-${this.stepIndex}`)}
          
        `;
      case 'recap': return this.renderRecap();
      case 'tayReturn': return this.renderTayReturn();
      case 'nextTime': return this.renderNextTime();
      case 'recheck': return this.renderRecheck();
      case 'home': return this.renderHome();
      case 'end': return this.renderEnd();
      default: return '';
    }
  }

  // ---- Beat 3A — the wait -----------------------------------------------
  renderWait() { return ''; }

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
      
    `;
  }

  // ---- Beat 3C — the report card ----------------------------------------
  // A dark case-file modal (§6.4). It is the only screen in the module where Act 1's counter
  // and Act 2's four checks appear together, and it builds one panel at a time so the beat
  // keeps moving instead of dumping a table.
  renderRecap() {
    return `
      <div class="act3-recap-modal" data-editor-id="act3-recap-modal" role="dialog" aria-modal="true" aria-labelledby="act3-recap-title">
        <div class="act3-recap-card" data-editor-id="act3-recap-card">
          <header class="act3-recap-header">
            <h2 class="act3-recap-title" id="act3-recap-title">What happened to Tay</h2>
            <p class="act3-recap-subtitle">The afternoon, in one place.</p>
          </header>
          <div class="act3-recap-content">
            <div class="act3-recap-body act3-recap-left">
              ${this.renderReportTable()}
              ${this.renderPrevalence()}
              ${this.renderReportTimeline()}
            </div>
            <div class="act3-recap-right">
              ${this.renderTruthStamp(
                this.reportSteps.find(s => s.reveals === 'survival').lines[0].stamp,
                'act3-stamp-survival-range'
              )}
              ${this.renderTruthStamp(
                this.reportSteps.find(s => s.reveals === 'breed').lines[0].stamp,
                'act3-stamp-breed'
              )}
              ${this.renderDischargeSheet()}
            </div>
          </div>
          <footer class="act3-recap-footer">
            <div class="act3-recap-nav">
              <button id="act3-btn-prev-step" class="act3-hud-btn act3-btn-quiet" data-editor-id="act3-btn-prev-step">◀ Back</button>
              <button id="act3-btn-beat-advance" class="act3-hud-btn btn-action-primary" data-editor-id="act3-btn-beat-advance">Finish ➔</button>
            </div>
          </footer>
        </div>
      </div>
    `;
  }

  renderReportTable() {
    const collapseTable = !this.reportTableExpanded;
    if (collapseTable) {
      return `
        <div class="act3-recap-panel collapsed-table" id="act3-recap-table-container">
          <div class="act3-recap-panel-head">
            <h3 class="act3-panel-title">What you reported</h3>
            <button id="act3-btn-report-table" class="act3-hud-btn act3-btn-quiet act3-btn-table-toggle" aria-expanded="false" aria-controls="act3-recap-table-container">
              Show table
            </button>
          </div>
          <div class="act3-recap-chips">
            ${this.reportRows.map(row => `
              <span class="act3-stage-chip stage-${row.stageNo}">
                ${row.short || row.sign} &middot; <span class="act3-stage-no">${row.stageNo}</span>
                <span>${row.stage}</span>
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }
    return `
      <div class="act3-recap-panel" id="act3-recap-table-container">
        <div class="act3-recap-panel-head">
          <h3 class="act3-panel-title">What you reported, and when it started</h3>
          <button id="act3-btn-report-table" class="act3-hud-btn act3-btn-quiet act3-btn-table-toggle" aria-expanded="true" aria-controls="act3-recap-table-container">
            Hide table
          </button>
        </div>
        <table class="act3-recap-table">
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
                  ${row.sign}
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
      <div class="act3-recap-panel">
        <h3 class="act3-panel-title">The two signs that get logged the most</h3>
        <ul class="act3-prevalence-list">
          ${this.prevalence.map(p => `
            <li class="act3-prevalence-row">
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
      <div class="act3-recap-panel">
        <h3 class="act3-panel-title">Her afternoon, from Act 1</h3>
        <ol class="act3-recap-timeline">
          ${this.hintsTimeline.map(item => `
            <li class="act3-timeline-item ${item.widest ? 'is-widest' : ''}">
              <span class="act3-timeline-time">${item.time}</span>
              <span class="act3-timeline-copy">
                <strong>${item.title}</strong>
                <span>${item.line}</span>
                <span class="act3-timeline-next-time-row">
                  <span class="act3-timeline-flag">NEXT TIME</span>
                  ${item.nextTime}
                </span>
              </span>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
  }

  renderTayReturn() {
    const step = this.tayReturnSteps[this.stepIndex];
    if (!step) return '';

    return `
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
          <span class="act3-prevention-badge">Dr. Reyes</span>
          <h2 class="act3-prevention-title">“So what's different about the next lake day?”</h2>
          <p class="act3-prevention-sub">
            Choose every change you'd actually make. Each one opens Dr. Reyes's answer and stays
            open — there's no wrong pick here.
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
                          ${isChosen ? 'aria-disabled="true"' : ''}
                          ${isChosen ? `aria-describedby="act3-prevention-reply-${opt.id}"` : ''}>
                    <span class="act3-prevention-icon act3-icon-badge" aria-hidden="true">${opt.icon}</span>
                    <span class="act3-prevention-label">${opt.label}</span>
                    <!-- Chosen is a glyph and a word, never the green alone (§7.3). -->
                    <span class="act3-prevention-state">
                      ${this.getPreventionStateHtml(isChosen)}
                    </span>
                  </button>

                  <!-- Reyes's answer stays attached to the choice that earned it. Showing only
                       the most recent one meant a learner who picked all four could read one,
                       and had to remember the other three. -->
                  <div class="act3-prevention-reply-wrap">
                    <div class="act3-prevention-reply-clip">
                      <div class="act3-prevention-reply" id="act3-prevention-reply-${opt.id}"
                           data-editor-id="act3-prevention-reply-${opt.id}"
                           aria-hidden="${!isChosen}"
                           ${this.activePrevention === opt.id ? 'role="status"' : ''}>
                        <span class="act3-report-who">Dr. Reyes</span>
                        <p class="act3-report-text">“${opt.reply}”</p>
                      </div>
                    </div>
                  </div>
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
              <span class="act3-discharge-glyph act3-icon-badge" aria-hidden="true">${item.glyph}</span>
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
            <button id="act3-btn-replay-act3" class="act3-hud-btn"
                    data-editor-id="act3-btn-replay-act3">Replay Act 3</button>
            <button id="act3-btn-replay-act1" class="act3-hud-btn" data-editor-id="act3-btn-replay-act1">Replay Act 1</button>
            <button id="act3-btn-end-title" class="act3-hud-btn" data-editor-id="act3-btn-end-title">Title</button>
          </div>
        </div>

        <div class="act3-sources-card">
          <span class="act3-sources-badge">Works cited</span>
          <h2 class="act3-sources-title">Sources</h2>
          <ul class="act3-mla-list" aria-label="Sources">
            ${this.sources.map(src => `<li>${src}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  // =======================================================================
  // RENDER — NAV CONTROLS
  // =======================================================================

  renderBottomLeftControls() {
    if (this.currentBeat === 'wait') { return ''; }
    const back = this.canStepBack() ? `
      <button id="act3-btn-prev-step" class="act3-hud-btn act3-btn-quiet"
                data-editor-id="act3-btn-prev-step"
                aria-label="Go back one step">◀ Back</button>
    ` : '';

    if (this.currentBeat === 'nextTime' && this.stepIndex === 0 && this.preventionChosen.size === 0) {
      return `
        ${back}
        <div class="act3-hud-pill act3-nudge-pill" data-editor-id="act3-nudge-pill">
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
      if ((step.type === 'stage' || step.type === 'hold') && !this.isEditModeActive()) return '';
    }
    switch (this.currentBeat) {
      case 'wait':
        return `
          <button id="act3-btn-beat-advance" class="act3-hud-btn"
                  data-editor-id="act3-btn-beat-advance">Next ▶</button>
        `;

      case 'verdict':
        return this.stepIndex < this.verdictSteps.length - 1 ? `
          <button id="act3-btn-next-step" class="act3-hud-btn" data-editor-id="act3-btn-next-step">Next ▶</button>
        ` : `
          <button id="act3-btn-beat-advance" class="act3-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act3-btn-beat-advance">Look at the chart ➔</button>
        `;

      case 'report':
        return this.stepIndex < this.stepsForBeat().length - 1 ? `
          <button id="act3-btn-next-step" class="act3-hud-btn" data-editor-id="act3-btn-next-step">Next ▶</button>
        ` : `
          <button id="act3-btn-beat-advance" class="act3-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act3-btn-beat-advance">Where's Tay? ➔</button>
        `;

      case 'tayReturn':
        return this.stepIndex < this.tayReturnSteps.length - 1 ? `
          <button id="act3-btn-next-step" class="act3-hud-btn" data-editor-id="act3-btn-next-step">Next ▶</button>
        ` : `
          <button id="act3-btn-beat-advance" class="act3-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act3-btn-beat-advance">Next time ➔</button>
        `;

      case 'nextTime': {
        if (this.stepIndex === 0) {
          const state = this.getPreventionButtonState();
          return `
            <button id="act3-btn-next-step" class="${state.className}"
                    data-editor-id="act3-btn-next-step">
              ${state.html}
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
                  data-editor-id="act3-btn-beat-advance">Take her home ➔</button>
        `;

      case 'home':
        return this.stepIndex < this.homeSteps.length - 1 ? `
          <button id="act3-btn-next-step" class="act3-hud-btn" data-editor-id="act3-btn-next-step">Next ▶</button>
        ` : `
          <button id="act3-btn-beat-advance" class="act3-hud-btn btn-action-primary pulse-btn"
                  data-editor-id="act3-btn-beat-advance">Fade ➔</button>
        `;

      case 'recap':
        return '';

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
    

    // --- Beat 3C ---
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
      coolingWrongCount: this.coolingWrongCount
    };
  }

  /**
   * Advance the case file and bring the panel that just appeared into view. Revealing a panel
   * below the fold and leaving the learner looking at the previous one is the failure mode of
   * a progressive reveal.
   */
  togglePrevention(id) {
    if (!id) return;
    // A choice is final: once Reyes has answered, the answer stays on the table.
    if (this.preventionChosen.has(id)) return;

    // Mutate state
    const isNowChosen = true;
    if (isNowChosen) {
      this.preventionChosen.add(id);
      this.activePrevention = id;
    } else {
      this.preventionChosen.delete(id);
      if (this.activePrevention === id) {
        this.activePrevention = null;
      }
    }
    
    // Patch DOM
    const li = this.container.querySelector(`.act3-prevention-item:has(.act3-prevention-option[data-prevention="${id}"])`);
    const btn = li?.querySelector('.act3-prevention-option');
    if (li && btn) {
      li.classList.toggle('is-chosen', isNowChosen);
      btn.classList.toggle('is-chosen', isNowChosen);
      btn.setAttribute('aria-pressed', isNowChosen);
      btn.setAttribute('aria-disabled', 'true');
      if (isNowChosen) {
        btn.setAttribute('aria-describedby', `act3-prevention-reply-${id}`);
      } else {
        btn.removeAttribute('aria-describedby');
      }
      const stateEl = btn.querySelector('.act3-prevention-state');
      if (stateEl) {
        stateEl.innerHTML = this.getPreventionStateHtml(isNowChosen);
      }
    }
    
    // Update aria-hidden and role="status" on all replies
    this.container.querySelectorAll('.act3-prevention-reply').forEach(reply => {
      const replyId = reply.getAttribute('id').replace('act3-prevention-reply-', '');
      const replyChosen = this.preventionChosen.has(replyId);
      reply.setAttribute('aria-hidden', !replyChosen);
      if (this.activePrevention === replyId) {
        reply.setAttribute('role', 'status');
      } else {
        reply.removeAttribute('role');
      }
    });

    // Update count text
    const countEl = this.container.querySelector('.act3-prevention-count');
    if (countEl) {
      countEl.textContent = `${this.preventionChosen.size} of ${this.preventionOptions.length} chosen`;
    }

    // Update advance button
    const nextBtn = this.container.querySelector('#act3-btn-next-step');
    if (nextBtn) {
      const state = this.getPreventionButtonState();
      nextBtn.className = state.className;
      nextBtn.innerHTML = state.html;
    }
  }

  // =======================================================================
  // BEAT TRANSITIONS
  // =======================================================================

  /** The step arrays each beat advances through, so nextSubStep has one shape to reason about. */
  get reportDialogueSteps() {
    const steps = [];
    for (const entry of this.reportSteps) {
      for (const line of entry.lines) {
        const step = { ...line };
        step.cast = line.stamp ? { reyes: 'serious' } : { reyes: 'chart' };
        steps.push(step);
      }
      if (entry.reveals === 'survival' && entry.variants) {
        const variants = entry.variants[this.decisionChoice || 'unknown'] || entry.variants.unknown;
        for (const line of variants) { const step = { ...line }; step.cast = line.stamp ? { reyes: 'serious' } : { reyes: 'chart' }; steps.push(step); }
      }
    }
    return steps;
  }

  stepsForBeat() {
    switch (this.currentBeat) {
      case 'verdict': return this.verdictSteps;
      case 'report': return this.reportDialogueSteps;
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
    const order = ['wait', 'verdict', 'report', 'tayReturn', 'nextTime', 'recheck', 'home', 'recap', 'end'];
    const i = order.indexOf(this.currentBeat);
    if (i === -1 || i === order.length - 1) return;

    this.currentBeat = order[i + 1];
    this.stepIndex = 0;

    // Time passes between beats, not only inside them.
    const jump = { verdict: 0, report: 3, tayReturn: 6, nextTime: 4, recheck: 3, home: 214, recap: 0, end: 0 };
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
    if (this.currentBeat === 'recap') {
      this.currentBeat = 'home';
      this.stepIndex = this.homeSteps.length - 1;
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
    // learner back into an empty clinic would be a dead end rather than an exit.
    if (e.key === 'Escape') {
      if (this.currentBeat === 'recap') {
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

    if (this.currentBeat === 'recap') {
      e.preventDefault();
      this.nextBeat();
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
