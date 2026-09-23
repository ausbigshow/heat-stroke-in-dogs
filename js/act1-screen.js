/**
 * Act 1 Screen Logic & Interactive Investigation Hub
 * Callie & Tay — Heat Stroke in Dogs
 * 
 * Implements:
 * - Beat 1A: Cold Open (Low camera angle, Tay's food detective monologue)
 * - Beat 1B: Lake Hub (4 interactive hotspots, narration decay engine, truth stamps)
 * - Lake Revisits: Gag dialogues
 * - Beat 1C: Gatekeeper validation
 * - Beat 1D: The Nap
 * - Beat 1E: Silent Shade Drift time-lapse (2:38 PM -> 3:05 PM)
 * - Beat 1F: The Refused Scrap (The Alarm: silence from Tay)
 * - Beat 1G: Case File Card (Comparison table)
 * - Beat 1H: POV Rise transition to Callie's eyeline & HINTS DROPPED HUD
 */

import { renderPreservingFocus, focusInto, containFocusIn, releaseFocusContainment } from './a11y-focus.js';

export class Act1Screen {
  constructor(app) {
    this.app = app;
    this.container = null;

    // Core State Variables
    this.currentBeat = 'cold_open'; // 'cold_open' | 'hub' | 'lead_active' | 'gate' | 'nap' | 'drift' | 'alarm' | 'case_file' | 'pov_rise'
    this.clockMinutes = 90; // 1:30 PM (90 mins from 12:00 PM)
    this.visitedLeads = new Set();
    this.leadVisitOrder = []; // Stores order of leads visited for narration decay
    this.leadVisitCounts = { cooler: 0, dock: 0, bowl: 0, lake: 0 };
    // 1 to 4. Per the Craft user-flow doc this is an audio-mix variable ("felt, not
    // shown") — it is tracked here for that mix and for Act 2, and is no longer surfaced
    // in the HUD now that the body-temperature gauge reports Tay's state visually.
    this.pantingLevel = 1;
    
    // Sub-step index for multi-step beats
    this.stepIndex = 0;
    this._enteredBeat = null;
    this._renderedStep = null;
    this.activeLeadId = null;
    this.returnFocusLeadId = null; // interactable to hand focus back to when the POV dialog closes
    this.povStepIndex = 0;        // position within the active lead's dialogue
    this.tayHasEnteredScene = false; // gates Tay's one-shot settle animation in the nap

    // Tay in-scene avatar positioning and walk state
    this.tayPosition = { top: 72, left: 52 };
    this.tayFacingLeft = true;
    this.isTayWalking = false;
    this.walkTimeout = null;

    // Cold Open Steps (Beat 1A)
    this.coldOpenSteps = [
      { speaker: 'tay', onomatopoeia: 'Sniff!', dialogue: "Okay. New place. Big water.", pos: 'top: 24%; left: 45%; max-width: var(--bubble-max-w, 320px);' },
      { speaker: 'tay', onomatopoeia: 'Huff!', dialogue: "There is food here somewhere.", pos: 'top: 24%; left: 45%; max-width: var(--bubble-max-w, 320px);' },
      { speaker: 'tay', onomatopoeia: 'Snort!', dialogue: "I can feel it in my face.", pos: 'top: 24%; left: 45%; max-width: var(--bubble-max-w, 320px);' },
      { speaker: 'callie_offscreen', text: "Stay where I can see you, ma'am.", pos: 'top: 24%; left: 45%; max-width: var(--bubble-max-w, 320px);' },
      { speaker: 'tay', onomatopoeia: 'Yip!', dialogue: "She said my name. Basically.", pos: 'top: 24%; left: 45%; max-width: var(--bubble-max-w, 320px);' },
      { type: 'mission_card' }
    ];

    // Leads Data with Dialogue Lines & Decay Alternates.
    //
    // NAMING: Act 1 is inside Tay's head, so every learner-facing label uses HER name for
    // the object ("The Vault", not "The Cooler"). Per the Craft user-flow doc, Beat 1G is
    // where "the four hotspot icons redraw with their real labels" — the Case File table is
    // the reveal, so the real names must not leak before it. `realName` is used there only.
    //
    // TRUTH STAMPS: the flat, factual third voice. Deliberately terse — one metric and one
    // sentence, no headers or lesson footers. They land after Tay's riff has played, so the
    // contradiction reads instantly instead of becoming a wall of text to wade through.
    this.leadsData = {
      cooler: {
        id: 'cooler',
        tayName: 'The Vault',
        realName: 'The Cooler',
        clockAdvance: 18,
        lines: [
          "The vault. I know the vault.",
          "Sandwiches live in the vault.",
          "It has a lid. Not a lock.",
          "I'll just wait right here."
        ],
        fourthSlotLine: "Vault. Waiting. Good plan.",
        // Beat plays as one exchange: Tay's riff, Callie's line over the top, Tay's reply.
        callieLine: "You're not gonna get in there, baby.",
        tayFollowUp: "I might.",
        exitLine: "…Okay. The vault wins. For now.",
        stamp: {
          metric: '99°F, full sun',
          line: "The cooler is cold. The spot she picked is not. She'll take food over shade every time."
        }
      },
      dock: {
        id: 'dock',
        tayName: 'High Ground',
        realName: 'The Dock',
        clockAdvance: 15,
        lines: [
          "High ground. Good for seeing.",
          "Smells like hot dogs used to be here.",
          "Historically. A hot dog was here.",
          "I should patrol it. For clues."
        ],
        fourthSlotLine: "Hot dog. Somewhere. Probably.",
        // She abandons the dock because the SCENT is old — never because it's hot.
        // Tay never clocks the heat; that's the whole engine of the act.
        exitLine: "Old clues. No hot dog now. Moving on.",
        stamp: {
          metric: '137°F deck, 96°F air',
          line: "Her paws are four inches off that board. If your hand can't take seven seconds on it, neither can she."
        }
      },
      bowl: {
        id: 'bowl',
        tayName: 'The Water One',
        realName: 'Her Water Bowl',
        clockAdvance: 20,
        lines: [
          "My bowl! …It's the water one.",
          "No meat in there. Never is.",
          "I checked yesterday. Same result.",
          "Water is not a lead. Filed under boring."
        ],
        fourthSlotLine: "Water. Later. Not now.",
        exitLine: "Maybe later. Not a priority.",
        stamp: {
          metric: 'Warm since noon',
          line: "Not a drop since the car. Sun-warm water goes undrunk — a full bowl in the sun is not water access."
        }
      },
      lake: {
        id: 'lake',
        tayName: 'The Biggest Bowl',
        realName: 'The Lake',
        clockAdvance: 15,
        lines: [
          "That's the biggest bowl ever.",
          "Still water, though. No meat.",
          "Nothing in there wants me.",
          "Enormous. Useless. Hard pass."
        ],
        fourthSlotLine: "Just water. Pass.",
        exitLine: "Biggest bowl. Zero snacks. Next.",
        // The Craft script originally left the lake uncorrected ("the silence is the
        // point"), but it now carries a stamp like the other three, by author's call.
        stamp: {
          metric: '72°F water',
          line: "The one thing here that could have cooled her down. She looked straight at it and walked away."
        },
        revisitGags: [
          "Still water. Confirmed again.",
          "Nope. Checked it twice.",
          "…It does look cool. No. Focus."
        ]
      }
    };

    // Terminal Beats Data (Pure Dialogue)
    this.napSteps = [
      { speaker: 'tay', onomatopoeia: 'Huff!', dialogue: "Okay. Break.", pos: 'top: 25%; left: 46%;' },
      { speaker: 'tay', onomatopoeia: 'Yip!', dialogue: "Short one. Then more looking.", pos: 'top: 25%; left: 46%;' },
      { speaker: 'tay', onomatopoeia: 'Woof!', dialogue: "Best spot. Coolest spot.", pos: 'top: 25%; left: 46%;' },
      { speaker: 'tay', onomatopoeia: 'Huff...', dialogue: "…food.", pos: 'top: 25%; left: 46%;' }
    ];

    this.alarmSteps = [
      { speaker: 'callie', text: "Tay. Hey. Chicken." },
      { speaker: 'callie', text: "Tay-Tay. Chicken." },
      { speaker: 'callie', text: "…Tay?" }
    ];

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.initAudio();
  }

  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    } catch {
      this.audioCtx = null;
    }
  }

  playBeep(freq = 440, type = 'sine', duration = 0.12) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playCrinkleSound() {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const bufferSize = this.audioCtx.sampleRate * 0.25;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioCtx.sampleRate * 0.08));
      }
      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3500;
      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.08;
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      whiteNoise.start();
    } catch {
      // Audio fallback
    }
  }

  mount() {
    this.container = document.getElementById('screen-act1');
    if (!this.container) return;

    this._enteredBeat = null;
    this._renderedStep = null;
    this._mounted = false;
    this.render();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  unmount() {
    clearTimeout(this.walkTimeout);
    window.removeEventListener('keydown', this.handleKeyDown);
    if (this.container && this.handleClick) {
      this.container.removeEventListener('click', this.handleClick);
    }
    this._mounted = false;
  }

  getFormattedTime() {
    const startHour = 1;
    const totalMinutes = this.clockMinutes;
    const hour = startHour + Math.floor(totalMinutes / 60) - 1;
    const min = totalMinutes % 60;
    const paddedMin = min < 10 ? `0${min}` : `${min}`;
    return `${hour}:${paddedMin} PM`;
  }

  getEscalation() {
    const t = Math.max(0, Math.min(1, (this.clockMinutes - 90) / (185 - 90)));
    let driftOpacity = t;
    let saturationDrop = Math.round(t * 28);

    if (this.currentBeat === 'nap') {
      driftOpacity = Math.max(driftOpacity, 0.55);
    } else if (this.currentBeat === 'drift') {
      driftOpacity = 1;
      saturationDrop = Math.max(saturationDrop, 34);
    } else if (this.currentBeat === 'alarm' || this.currentBeat === 'case_file' || this.currentBeat === 'pov_rise') {
      driftOpacity = 1;
      saturationDrop = Math.max(saturationDrop, 40);
    }

    // 0% shift starts perfectly under footprint, 25% shift slides off Tay securely
    const shadeShiftX = 0 + t * 25;
    const shadeScaleY = 1 - t * 0.34;

    return { driftOpacity, saturationDrop, shadeShiftX, shadeScaleY };
  }

  getBodyTemp() {
    const t = Math.max(0, Math.min(1, (this.clockMinutes - 90) / (185 - 90)));
    let temp = 101.8 + t * 4.6;
    if (this.currentBeat === 'pov_rise') temp = Math.max(temp, 106.8);

    let stage = 'normal';
    let label = 'Normal';
    if (temp >= 106.5) { stage = 'critical'; label = 'Critical'; }
    else if (temp >= 105) { stage = 'danger'; label = 'Heat stroke range'; }
    else if (temp >= 103) { stage = 'elevated'; label = 'Hyperthermic'; }

    const fillPct = Math.max(0, Math.min(100, ((temp - 100.5) / (108 - 100.5)) * 100));

    return { value: temp.toFixed(1), stage, label, fillPct: fillPct.toFixed(1) };
  }

  render() {
    if (!this.container) return;
    
    releaseFocusContainment(this.container || document);
    
    if (!this._mounted) {
      this.mountScene();
    }
    
    renderPreservingFocus(
      this.container,
      () => {
        this._enteredBeat = this.currentBeat;
        this.syncSceneState();
        this.syncHud();
        this.renderBeatContent();
        this.renderNav();
        
        if (this.currentBeat === 'nap' || this.currentBeat === 'drift') {
          this.tayHasEnteredScene = true;
        }
        
        this._renderedStep = this.currentBeat === 'lead_active' 
          ? `${this.currentBeat}-${this.activeLeadId}-${this.povStepIndex}`
          : `${this.currentBeat}-${this.stepIndex}`;
      },
      ['#act1-btn-pov-next', '#act1-btn-finish-lead', '#act1-btn-next-step', '#act1-btn-check-gate']
    );
    
    const dialog = this.container.querySelector('[role="dialog"]');
    if (dialog) containFocusIn(dialog);
  }

  mountScene() {
    if (!this.container || this._mounted) return;

    this.container.innerHTML = `
      <div class="act1-container" data-editor-id="act1-screen-container">
        <div id="act1-card" class="act1-viewport-card" data-beat="" data-editor-id="act1-viewport-card">
          <img src="Assets/Image/Lake-Blank.jpg" alt="Lakeside park landscape" class="act1-scene-img" data-editor-id="act1-lake-img" />

          <header class="act1-hud-bar" data-editor-id="act1-hud-bar">
            <div class="act1-hud-group">
              <button id="act1-btn-back-act0" class="act1-hud-btn" data-editor-id="act1-btn-back-act0" title="Return to Act 0" aria-label="Return to Act 0">◀ Act 0</button>
              <button id="act1-btn-title" class="act1-hud-btn" data-editor-id="act1-btn-title" title="Return to Title" aria-label="Return to the title screen">Title</button>
            </div>

            <div class="act1-hud-group">
              <div class="act1-hud-pill clock-pill" data-editor-id="act1-hud-clock" title="Lake Time" role="status" aria-live="polite">
                <span id="act1-clock-text"></span>
              </div>
              
              <div class="act1-hud-pill hints-dropped-pill" id="act1-hud-hints-pill" data-editor-id="act1-hud-hints" role="status" aria-live="polite" hidden>
                <span class="hud-label-full">HINTS DROPPED: 4</span>
                <span class="hud-label-short">HINTS: 4</span>
              </div>
              <div class="act1-hud-pill leads-pill" id="act1-hud-leads-pill" data-editor-id="act1-hud-leads">
                <span class="hud-label-full"></span>
                <span class="hud-label-short"></span>
              </div>

              <div class="act1-temp-gauge" data-editor-id="act1-hud-panting" role="img">
                <div class="temp-gauge-readout">
                  <span class="temp-gauge-value"></span>
                  <span class="temp-gauge-label"></span>
                </div>
                <div class="temp-gauge-track"><span class="temp-gauge-fill"></span></div>
              </div>
            </div>
          </header>

          <div class="act1-scene-layer" data-editor-id="act1-scene-layer">
            <div class="act1-water-layer" data-editor-id="act1-water-layer" aria-hidden="true">
              <svg class="act1-water-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <path id="act1-shore-wave" d="M-2,65.6 C9,63.3 19.3,61.3 29.5,58.1 C39.8,54 50,51.7 57.2,50.6" />
                </defs>
                <g fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.1" stroke-linecap="round" vector-effect="non-scaling-stroke">
                  <use href="#act1-shore-wave" class="lake-wave lake-wave-1" />
                  <use href="#act1-shore-wave" class="lake-wave lake-wave-2" />
                  <use href="#act1-shore-wave" class="lake-wave lake-wave-3" />
                  <use href="#act1-shore-wave" class="lake-wave lake-wave-4" />
                </g>
              </svg>
            </div>
            <div class="shade-drift-overlay" data-editor-id="act1-shade-drift-overlay"></div>
            
            <div class="lake-scene-canopy" data-editor-id="act1-asset-canopy">
              <!-- Hidden until the correct 900x400 transparent asset lands. -->
              <img class="canopy-shade-layer" src="Assets/Image/Lake-Prop-Canopy-Shadow.png" alt="" draggable="false" aria-hidden="true" />
              <img class="canopy-frame-layer" src="Assets/Image/Lake-Prop-Canopy.png" alt="" draggable="false" />
            </div>

            <div class="act1-avatar-tay" data-editor-id="act1-avatar-tay" aria-hidden="true">
              <div class="act1-avatar-tay-sprite" data-editor-id="act1-avatar-tay-sprite">
                <div class="tay-ground-shadow"></div>
                <img class="tay-avatar-img tay-standing-img" draggable="false" />
                <img class="tay-avatar-img tay-sniffing-img" draggable="false" />
              </div>
            </div>

            <div class="lake-scene-tay" data-editor-id="act1-tay-sleeping" hidden>
              ${this.renderTayLyingDown()}
            </div>

            ${this.renderInteractable('cooler', `<img class="interactable-img" src="Assets/Image/Lake-Prop-Cooler.png" alt="" draggable="false" />`)}
            ${this.renderInteractable('dock', `<img class="interactable-img" src="Assets/Image/Lake-Prop-Dock.png" alt="" draggable="false" />`)}
            ${this.renderInteractable('bowl', `<img class="interactable-img" src="Assets/Image/Lake-Prop-Bowl.png" alt="" draggable="false" />`)}
            ${this.renderInteractable('lake', `
              <svg class="lake-touch-svg" viewBox="0 0 100 100" aria-hidden="true">
                <g class="lake-touch-rings">
                  <ellipse class="lake-touch-ring ring-1" cx="50" cy="50" rx="38" ry="13.3" />
                  <ellipse class="lake-touch-ring ring-2" cx="50" cy="50" rx="38" ry="13.3" />
                  <ellipse class="lake-touch-ring ring-3" cx="50" cy="50" rx="38" ry="13.3" />
                </g>
              </svg>
            `)}
          </div>

          <div class="act1-speech-layer" data-editor-id="act1-speech-layer"></div>

          <nav class="act1-nav-bar" data-editor-id="act1-nav-bar">
            <div class="act1-hud-group" id="act1-nav-left"></div>
            <div class="act1-hud-group" id="act1-nav-right"></div>
          </nav>
        </div>
      </div>
    `;

    this.bindEvents();
    this._mounted = true;
  }

  renderInteractable(leadId, artHtml) {
    const lead = this.leadsData[leadId];
    return `
      <button
        class="act1-interactable interactable-${leadId}"
        data-lead="${leadId}"
        data-editor-id="act1-asset-${leadId}"
        aria-label="Investigate ${lead.tayName}"
        aria-pressed="false"
      >
        <span class="interactable-art">
        ${leadId !== 'lake' ? '<div class="prop-ground-shadow"></div><div class="prop-affordance-ring"></div>' : ''}${artHtml}</span>
        <span class="interactable-tooltip" aria-hidden="true">${lead.tayName}</span>
      </button>
    `;
  }

  getTayStageInfo() {
    const visitedCount = this.visitedLeads ? this.visitedLeads.size : 0;
    if (visitedCount === 0) {
      return {
        stageNum: 0,
        label: 'Neutral',
        standingSrc: 'Assets/Image/Tay-StandingSideProfile.png',
        sniffingSrc: 'Assets/Image/Tay-SniffingGround.png'
      };
    } else if (visitedCount === 1) {
      return {
        stageNum: 1,
        label: 'Stage 1: Alert',
        standingSrc: 'Assets/Image/Tay-StandingStage1-Alert.png',
        sniffingSrc: 'Assets/Image/Tay-SniffingGround.png'
      };
    } else if (visitedCount === 2) {
      return {
        stageNum: 2,
        label: 'Stage 2: Warm',
        standingSrc: 'Assets/Image/Tay-StandingStage2-Warm.png',
        sniffingSrc: 'Assets/Image/Tay-SniffingGround.png'
      };
    } else if (visitedCount === 3) {
      return {
        stageNum: 3,
        label: 'Stage 3: Panting',
        standingSrc: 'Assets/Image/Tay-StandingStage3-Panting.png',
        sniffingSrc: 'Assets/Image/Tay-SniffingGround.png'
      };
    } else {
      return {
        stageNum: 4,
        label: 'Stage 4: Distressed',
        standingSrc: 'Assets/Image/Tay-StandingStage4-Distressed.png',
        sniffingSrc: 'Assets/Image/Tay-SniffingGround.png'
      };
    }
  }

  // Calculate perspective scale factor based on vertical depth in scene
  // top: 50% (distant shoreline) -> 0.72x
  // top: 82% (close foreground) -> 1.18x
  getDepthScale(top = 70) {
    const minTop = 50;
    const maxTop = 82;
    const minScale = 0.72;
    const maxScale = 1.18;
    const t = Math.max(0, Math.min(1, (top - minTop) / (maxTop - minTop)));
    return Number((minScale + t * (maxScale - minScale)).toFixed(3));
  }

  // Tay, lying flat in lateral recumbency under the shade canopy (Beats 1D/1E).
  // Uses the transparent PNG asset (facing left) with an animated swelling abdomen representing labored breathing.
  renderTayLyingDown() {
    return `
      <div class="tay-lateral-wrapper" data-editor-id="act1-asset-tay">
        <svg class="tay-lateral-svg" viewBox="0 0 1376 768" aria-label="Tay lying in lateral recumbency, facing left, panting heavily with labored breathing">
          <defs>
            <!-- Ground shadow under the lateral dog -->
            <radialGradient id="tay-lateral-ground-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(24, 36, 24, 0.45)" />
              <stop offset="70%" stop-color="rgba(24, 36, 24, 0.2)" />
              <stop offset="100%" stop-color="rgba(24, 36, 24, 0)" />
            </radialGradient>
            <!-- Smooth clip path enclosing the ribcage, flank, and abdomen for labored swelling (facing left) -->
            <clipPath id="tay-abdomen-clip">
              <path d="M936,245 C856,215 696,215 616,220 C606,300 616,420 626,560 C696,565 856,565 926,545 C936,460 941,330 936,245 Z" />
            </clipPath>
          </defs>
          <!-- Ground Shadow -->
          <ellipse cx="686" cy="585" rx="540" ry="42" fill="url(#tay-lateral-ground-shadow)" />
          <!-- Base full dog image (facing left) -->
          <image href="Assets/Image/Tay-LayingLateralPanting.png" xlink:href="Assets/Image/Tay-LayingLateralPanting.png" x="0" y="0" width="1376" height="768" />
          <!-- Swelling abdomen layer for labored panting respiration -->
          <g class="tay-labored-abdomen">
            <image href="Assets/Image/Tay-LayingLateralPanting.png" xlink:href="Assets/Image/Tay-LayingLateralPanting.png" x="0" y="0" width="1376" height="768" clip-path="url(#tay-abdomen-clip)" />
          </g>
        </svg>
      </div>
    `;
  }

  // Tay, standing & trotting in the lake scene during investigation (Beats 1A, 1B, 1C).
  // Renders the flat-vector PNG assets with sequential exhaustion stages and ground sniffing while walking.


  triggerWalkToLead(leadId) {
    if (this.isEditModeActive()) return;
    if (this.isTayWalking) return;

    const targetCoords = {
      cooler: { top: 71, left: 47 },
      dock: { top: 60, left: 22 },
      bowl: { top: 76, left: 48 },
      lake: { top: 56, left: 11 },
      canopy: { top: 70, left: 74 }
    }[leadId] || { top: 70, left: 50 };

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const movingLeft = targetCoords.left < this.tayPosition.left;
    this.tayFacingLeft = movingLeft;
    this.tayPosition = targetCoords;

    if (isReducedMotion) {
      if (leadId === 'canopy') {
        this.startNap();
      } else {
        this.selectLead(leadId);
      }
      return;
    }

    this.isTayWalking = true;
    this.playBeep(320, 'triangle', 0.08);
    this.syncSceneState();

    clearTimeout(this.walkTimeout);
    this.walkTimeout = setTimeout(() => {
      this.isTayWalking = false;
      this.syncSceneState();
      if (leadId === 'canopy') {
        this.startNap();
      } else {
        this.selectLead(leadId);
      }
    }, 3200);
  }

  syncSceneState() {
    const card = this.container.querySelector('#act1-card');
    if (!card) return;
    
    const isPovRaised = this.currentBeat === 'pov_rise';
    const isCanopyFocus = this.currentBeat === 'nap' || this.currentBeat === 'drift' || this.currentBeat === 'alarm';
    const isColdOpenClickable = this.currentBeat === 'cold_open' && this.coldOpenSteps[this.stepIndex]?.type !== 'mission_card';
    const escalation = this.getEscalation();
    const entering = this._enteredBeat !== this.currentBeat;
    
    card.setAttribute('data-beat', this.currentBeat);
    card.classList.toggle('pov-raised', isPovRaised);
    card.classList.toggle('low-cam', !isPovRaised);
    card.classList.toggle('canopy-focus', isCanopyFocus);
    card.classList.toggle('is-cold-open-active', isColdOpenClickable);
    card.classList.toggle('is-entering', entering);
    // The scene is mounted once and persists across beats, so the leads are on screen during
    // the cold open, the nap and the alarm too. Only the hub acts on a click; everywhere else
    // they must stop inviting one (no ring, no cursor, out of the tab order).
    const leadsLive = this.currentBeat === 'hub';
    card.classList.toggle('leads-live', leadsLive);
    
    card.style.setProperty('--act1-drift-opacity', escalation.driftOpacity);
    card.style.setProperty('--act1-saturation-drop', `${escalation.saturationDrop}%`);
    card.style.setProperty('--act1-shade-shift', `${escalation.shadeShiftX}%`);
    card.style.setProperty('--act1-shade-scale-y', escalation.shadeScaleY);
    if (isColdOpenClickable) {
      card.setAttribute('title', 'Click anywhere to continue (or press Space)');
    } else {
      card.removeAttribute('title');
    }

    ['cooler', 'dock', 'bowl', 'lake'].forEach(leadId => {
      const el = this.container.querySelector(`.interactable-${leadId}`);
      if (el) {
        // Exact ground line = top + height from CSS
        const depths = { cooler: 73, dock: 64.4, bowl: 79.6, lake: 63 };
        el.style.zIndex = 10 + Math.round(depths[leadId]);
        const visited = this.visitedLeads.has(leadId);
        const lead = this.leadsData[leadId];
        el.classList.toggle('visited', visited);
        el.setAttribute('aria-pressed', visited.toString());
        el.tabIndex = leadsLive ? 0 : -1;
        if (leadsLive) el.removeAttribute('aria-disabled');
        else el.setAttribute('aria-disabled', 'true');
        el.setAttribute('aria-label', `Investigate ${lead.tayName}${visited ? ' (already investigated)' : ''}`);
        
        let checkSpan = el.querySelector('.interactable-check');
        if (visited && !checkSpan) {
          el.insertAdjacentHTML('beforeend', '<span class="interactable-check" aria-hidden="true">✓</span>');
        } else if (!visited && checkSpan) {
          checkSpan.remove();
        }
      }
    });

    const canopyArmed = this.currentBeat === 'hub' && this.visitedLeads.size === 4;
    const canopyEl = this.container.querySelector('.lake-scene-canopy');
    if (canopyEl) {
      canopyEl.style.zIndex = 10 + 78;
      canopyEl.classList.toggle('canopy-armed', canopyArmed);
      if (canopyArmed) {
        canopyEl.setAttribute('role', 'button');
        canopyEl.setAttribute('tabindex', '0');
        canopyEl.setAttribute('aria-label', 'Rest in the shade');
        if (!canopyEl.querySelector('.canopy-tooltip')) {
          canopyEl.insertAdjacentHTML('beforeend', '<span class="canopy-tooltip">Rest in the shade</span>');
        }
      } else {
        canopyEl.removeAttribute('role');
        canopyEl.removeAttribute('tabindex');
        canopyEl.removeAttribute('aria-label');
        const tooltip = canopyEl.querySelector('.canopy-tooltip');
        if (tooltip) tooltip.remove();
      }
    }

    const showStandingTay = this.currentBeat === 'hub' || this.currentBeat === 'cold_open' || this.currentBeat === 'gate';
    const tayEl = this.container.querySelector('.act1-avatar-tay');
    if (tayEl) {
      tayEl.hidden = !showStandingTay;
      if (showStandingTay) {
        const info = this.getTayStageInfo();
        tayEl.className = `act1-avatar-tay stage-${info.stageNum} ${this.isTayWalking ? 'is-walking' : ''} ${this.tayFacingLeft ? 'facing-left' : 'facing-right'}`;
        tayEl.style.top = `${this.tayPosition.top}%`;
        tayEl.style.left = `${this.tayPosition.left}%`;
        // Tay's ground line is offset from her bounding box `top` due to `translate: -73.2%`.
        // Base offset = (0.985 ground contact - 0.732 translate) * 18.58 (height in container %) = 4.7%
        const baseOffset = 4.7;
        const tayScale = this.getDepthScale(this.tayPosition.top);
        const tayGroundLine = this.tayPosition.top + (baseOffset * tayScale);
        tayEl.style.zIndex = 10 + Math.round(tayGroundLine);
        tayEl.style.setProperty('--tay-scale', this.getDepthScale(this.tayPosition.top));
        
        const standingImg = tayEl.querySelector('.tay-standing-img');
        if (standingImg && standingImg.getAttribute('src') !== info.standingSrc) {
          standingImg.setAttribute('src', info.standingSrc);
          standingImg.setAttribute('alt', `Tay standing (${info.label})`);
        }
        const sniffingImg = tayEl.querySelector('.tay-sniffing-img');
        if (sniffingImg && sniffingImg.getAttribute('src') !== info.sniffingSrc) {
          sniffingImg.setAttribute('src', info.sniffingSrc);
        }
      }
    }

    const isNapping = this.currentBeat === 'nap' || this.currentBeat === 'drift' || this.currentBeat === 'alarm' || this.currentBeat === 'case_file' || this.currentBeat === 'pov_rise';
    const taySleepEl = this.container.querySelector('.lake-scene-tay');
    if (taySleepEl) {
      taySleepEl.style.zIndex = 10 + 75;
      taySleepEl.hidden = !isNapping;
      if (isNapping) {
        taySleepEl.classList.toggle('tay-entering', !this.tayHasEnteredScene);
        taySleepEl.classList.toggle('tay-drifting', this.currentBeat !== 'nap');
      }
    }
  }

  syncHud() {
    const timeStr = this.getFormattedTime();
    const clockText = this.container.querySelector('#act1-clock-text');
    if (clockText) clockText.textContent = timeStr;
    const clockPill = this.container.querySelector('.clock-pill');
    if (clockPill) clockPill.setAttribute('aria-label', `Lake time ${timeStr}`);

    const isPovRaised = this.currentBeat === 'pov_rise';
    const hintsPill = this.container.querySelector('#act1-hud-hints-pill');
    const leadsPill = this.container.querySelector('#act1-hud-leads-pill');
    
    if (hintsPill) hintsPill.hidden = !isPovRaised;
    if (leadsPill) {
      leadsPill.hidden = isPovRaised;
      if (!isPovRaised) {
        const leadsCount = this.visitedLeads.size;
        const allLeadsVisited = leadsCount === 4;
        leadsPill.classList.toggle('all-done', allLeadsVisited);
        const full = leadsPill.querySelector('.hud-label-full');
        const short = leadsPill.querySelector('.hud-label-short');
        if (full) full.textContent = `LEADS INVESTIGATED: ${leadsCount}/4`;
        if (short) short.textContent = `LEADS: ${leadsCount}/4`;
      }
    }

    const t = this.getBodyTemp();
    const gauge = this.container.querySelector('.act1-temp-gauge');
    if (gauge) {
      gauge.className = `act1-temp-gauge stage-${t.stage}`;
      gauge.style.setProperty('--temp-fill', `${t.fillPct}%`);
      gauge.setAttribute('aria-label', `Tay's body temperature ${t.value} degrees Fahrenheit, ${t.label}`);
      
      const valEl = gauge.querySelector('.temp-gauge-value');
      const labelEl = gauge.querySelector('.temp-gauge-label');
      if (valEl) valEl.textContent = `${t.value}°F`;
      if (labelEl) labelEl.textContent = t.label;
    }
  }

  renderBeatContent() {
    const speechLayer = this.container.querySelector('.act1-speech-layer');
    if (speechLayer) {
      speechLayer.innerHTML = this.renderActiveBeatContent();
    }
  }

  renderNav() {
    const leftNav = this.container.querySelector('#act1-nav-left');
    const rightNav = this.container.querySelector('#act1-nav-right');
    if (leftNav) leftNav.innerHTML = this.renderBottomLeftControls();
    if (rightNav) rightNav.innerHTML = this.renderBottomRightControls();
  }

  renderActiveBeatContent() {
    switch (this.currentBeat) {
      case 'cold_open':
        return this.renderColdOpen();
      case 'hub':
        return this.renderHubIntro();
      case 'lead_active':
        return this.renderLeadActive();
      case 'gate':
        return this.renderGate();
      case 'nap':
        return this.renderNap();
      case 'drift':
        return this.renderShadeDrift();
      case 'alarm':
        return this.renderAlarm();
      case 'case_file':
        return this.renderCaseFile();
      case 'pov_rise':
        return this.renderPovRise();
      default:
        return '';
    }
  }

  renderColdOpen() {
    const step = this.coldOpenSteps[this.stepIndex];
    if (!step) return '';

    const stepKey = `${this.currentBeat}-${this.stepIndex}`;
    const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';

    if (step.type === 'mission_card') {
      return `
        <div class="act1-mission-card ${isNewLineClass}" data-editor-id="act1-mission-card"
             role="dialog" aria-modal="true" aria-labelledby="act1-mission-card-title">
          <div class="mission-card-header">
            <span class="mission-card-badge">Tay's Detective Mission</span>
            <span style="font-size: 0.85rem; color: var(--text-on-dark-dim); font-weight: 700;">Lake Shore Hub</span>
          </div>
          <h2 class="mission-card-title" id="act1-mission-card-title">Mission: Find Real Food (No Kibble)</h2>
          <div class="mission-card-body">
            <p style="margin-bottom: 0.5rem;">Look, kibble is fine at home when there are zero other options. But we are at the lake! There are sandwiches, grilled meats, and dropped snacks out here somewhere.</p>
            <p>I've sniffed out <strong>four promising leads</strong> in the immediate area. Time to work the case and track down the food!</p>
            <!-- Tay's names only. The real labels are the Case File's reveal (Beat 1G). -->
            <div class="mission-leads-grid">
              ${Object.values(this.leadsData).map(l => `
                <div class="mission-lead-item"><span>${l.tayName}</span></div>
              `).join('')}
            </div>
          </div>
          <div class="mission-card-footer">
            <button id="act1-btn-start-hub-modal" class="act1-hud-btn btn-action-primary pulse-btn" data-editor-id="act1-btn-start-hub-modal" aria-label="Start the investigation">
              Start Investigation ➔
            </button>
          </div>
        </div>
      `;
    }

    if (step.speaker === 'callie_offscreen') {
      return `
        <div 
          class="speech-bubble callie-bubble act1-callie-offscreen-bubble ${isNewLineClass}" 
          style="${step.pos || 'top: 24%; left: 45%; max-width: var(--bubble-max-w, 320px);'}" 
          data-editor-id="act1-coldopen-callie"
        >
          <div class="speech-bubble-speaker">
            <span>Callie (Off-screen)</span>
          </div>
          <p class="speech-bubble-text">
            "${step.text}"
          </p>
          <div class="bubble-click-hint" aria-hidden="true">
            <span>Click anywhere to continue</span>
            <span class="hint-arrow">▶</span>
          </div>
        </div>
      `;
    }

    return `
      <div 
        class="speech-bubble tay-bubble act1-coldopen-tay-bubble ${isNewLineClass}" 
        style="${step.pos}" 
        data-editor-id="act1-coldopen-bubble-${this.stepIndex}"
      >
        <div class="speech-bubble-speaker">
          <span>Tay</span>
        </div>
        <p class="speech-bubble-text">
          <span class="tay-onomatopoeia">${step.onomatopoeia}</span>
          <span class="tay-sub-dialogue">(${step.dialogue})</span>
        </p>
        <div class="bubble-click-hint" aria-hidden="true">
          <span>Click anywhere to continue</span>
          <span class="hint-arrow">▶</span>
        </div>
      </div>
    `;
  }

  renderHubIntro() {
    const allVisited = this.visitedLeads.size === 4;
    const stepKey = `${this.currentBeat}-${this.stepIndex}`;
    const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';
    return `
      <div 
        class="speech-bubble tay-bubble ${isNewLineClass}" 
        style="top: 24%; left: 45%; max-width: var(--bubble-max-w, 320px);" 
        data-editor-id="act1-hub-speech"
      >
        <div class="speech-bubble-speaker">
          <span>Tay</span>
        </div>
        <p class="speech-bubble-text">
          ${allVisited 
            ? `<span class="tay-onomatopoeia">Woof!</span> <span class="tay-sub-dialogue">(That's all four leads checked! Ready for a break.)</span>`
            : `<span class="tay-onomatopoeia">Bark!</span> <span class="tay-sub-dialogue">(Four leads. Let's work the case.)</span>`
          }
        </p>
      </div>
    `;
  }

  // Each lead's close-up. These were four hand-coded SVG scenes — roughly 16 flat
  // primitives apiece, which made them the lowest-fidelity art anywhere in the module
  // while also being full-bleed and on screen for the whole investigation beat. They are
  // rendered plates now, at the same 1376x768 as every other background in the project.
  renderPovScene(leadId) {
    const scenes = {
      cooler: { src: 'Lake-POV-Cooler.png', alt: 'A closed cooler standing in open grass in full sun' },
      dock:   { src: 'Lake-POV-Dock.png',   alt: 'Sun-bleached planks running out over still water' },
      bowl:   { src: 'Lake-POV-Bowl.png',   alt: 'A steel water bowl in the grass, well below half full' },
      lake:   { src: 'Lake-POV-Lake.png',   alt: 'Flat, glaring open water running to a far shore' }
    };
    const scene = scenes[leadId];
    if (!scene) return '';
    return `
      <img
        class="pov-scene-illustration"
        src="Assets/Image/${scene.src}"
        alt="${scene.alt}"
        data-editor-id="act1-pov-scene-${leadId}"
        draggable="false"
      />
    `;
  }

  buildPovSteps() {
    const lead = this.leadsData[this.activeLeadId];
    if (!lead) return [];

    const isLake = this.activeLeadId === 'lake';
    const visitCount = this.leadVisitCounts[this.activeLeadId] || 1;
    const leadSlotIndex = this.leadVisitOrder.indexOf(this.activeLeadId);
    const slotN = leadSlotIndex >= 0 ? leadSlotIndex + 1 : (this.visitedLeads.size || 1);
    const isFourthSlot = slotN >= 4;

    // Lake revisits are gag-only: no decay, no exchange, no exit line.
    if (isLake && visitCount > 1) {
      const gagIndex = Math.min(visitCount - 2, lead.revisitGags.length - 1);
      return [{ speaker: 'tay', text: lead.revisitGags[gagIndex], onomatopoeia: 'Splash!' }];
    }

    const steps = [];
    const riff = isFourthSlot ? [lead.fourthSlotLine] : lead.lines.slice(0, Math.max(1, 5 - slotN));
    riff.forEach((text, i) => {
      steps.push({ speaker: 'tay', text, onomatopoeia: i === 0 ? 'Snort!' : null });
    });

    // Callie's line lands over the top of the riff, then Tay answers her.
    if (lead.callieLine) {
      steps.push({ speaker: 'callie', text: lead.callieLine });
      if (lead.tayFollowUp) {
        steps.push({ speaker: 'tay', text: lead.tayFollowUp, onomatopoeia: 'Yip!' });
      }
    }

    // She gives up on the lead. Skipped at the 4th slot, where narration has decayed
    // to a single muddled line.
    if (!isFourthSlot && lead.exitLine) {
      steps.push({ speaker: 'tay', text: lead.exitLine, isExit: true });
    }

    return steps;
  }

  renderLeadActive() {
    const lead = this.leadsData[this.activeLeadId];
    if (!lead) return '';

    const isLake = this.activeLeadId === 'lake';
    const steps = this.buildPovSteps();
    const stepIdx = Math.min(this.povStepIndex, steps.length - 1);
    const step = steps[stepIdx];
    if (!step) return '';

    const isLastStep = stepIdx === steps.length - 1;
    // The stamp lands with the final beat, once she has had her say. Lake revisits are
    // gag-only, so they don't re-run the correction.
    const isLakeRevisit = isLake && (this.leadVisitCounts[this.activeLeadId] || 1) > 1;
    const stamp = (isLastStep && !isLakeRevisit) ? lead.stamp : null;

    const stepKey = `${this.currentBeat}-${this.activeLeadId}-${this.povStepIndex}`;
    const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';

    return `
      <div class="act1-pov-viewport-modal" data-editor-id="act1-pov-viewport-modal"
           role="dialog" aria-modal="true" aria-label="Tay's point of view: ${lead.tayName}">
        <div class="pov-viewport-card" data-editor-id="act1-pov-card">

          <!-- Top Header with Location Tag & Return Button -->
          <div class="pov-viewport-header">
            <div class="pov-tag-badge">
              <span>TAY'S POV: ${lead.tayName.toUpperCase()}</span>
            </div>
            <button id="pov-btn-close" class="pov-close-btn" data-editor-id="act1-pov-close" title="Return to Lake Hub" aria-label="Close this close-up and return to the lake hub">
              ✕ Lake Hub
            </button>
          </div>

          <!-- Close-Up Vector Scene from Tay's POV -->
          ${this.renderPovScene(this.activeLeadId)}

          <!-- Dialogue Layer: one beat at a time, advanced by the learner -->
          <div class="pov-overlay-speech">
            ${step.speaker === 'tay' ? `
              <div
                class="speech-bubble tay-bubble pov-dialogue-bubble ${step.isExit ? 'is-exit-line' : ''} ${isNewLineClass}"
                data-editor-id="act1-lead-tay-speech"
              >
                <div class="speech-bubble-speaker">
                  <span>Tay</span>
                </div>
                <p class="speech-bubble-text">
                  ${step.onomatopoeia ? `<span class="tay-onomatopoeia">${step.onomatopoeia}</span>` : ''}
                  <span class="tay-sub-dialogue">(${step.text})</span>
                </p>
              </div>
            ` : `
              <div
                class="speech-bubble callie-bubble pov-callie-bubble ${isNewLineClass}"
                data-editor-id="act1-lead-callie-speech"
              >
                <div class="speech-bubble-speaker">
                  <span>Callie</span>
                </div>
                <p class="speech-bubble-text">
                  <span class="callie-dialogue">"${step.text}"</span>
                </p>
              </div>
            `}

            ${stamp ? `
              <div class="act1-truth-stamp ${isNewLineClass}" data-editor-id="act1-truth-stamp">
                <span class="truth-stamp-metric">${stamp.metric}</span>
                <span class="truth-stamp-line">${stamp.line}</span>
              </div>
            ` : ''}
          </div>

          <!-- Beat counter + advance / finish -->
          <nav class="act1-nav-bar" style="bottom: 0.9rem; left: 1.1rem; right: 1.1rem; justify-content: space-between;">
            <div class="pov-beat-dots" aria-hidden="true">
              ${steps.map((s, i) => `
                <span class="pov-beat-dot ${i === stepIdx ? 'current' : ''} ${i < stepIdx ? 'seen' : ''}"></span>
              `).join('')}
            </div>
            ${isLastStep ? `
              <button id="act1-btn-finish-lead" class="act1-hud-btn btn-action-primary pulse-btn" data-editor-id="act1-btn-finish-lead" aria-label="Done investigating this lead">
                Done Investigating ➔
              </button>
            ` : `
              <button id="act1-btn-pov-next" class="act1-hud-btn" data-editor-id="act1-btn-pov-next" aria-label="Next">
                Next ▶
              </button>
            `}
          </nav>

        </div>
      </div>
    `;
  }

  renderGate() {
    const remaining = 4 - this.visitedLeads.size;
    const stepKey = `${this.currentBeat}-${this.stepIndex}`;
    const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';
    return `
      <div 
        class="speech-bubble tay-bubble ${isNewLineClass}" 
        style="top: 24%; left: 45%; max-width: var(--bubble-max-w, 340px);" 
        data-editor-id="act1-gate-bubble"
      >
        <div class="speech-bubble-speaker">
          <span>Tay</span>
        </div>
        <p class="speech-bubble-text">
          <span class="tay-onomatopoeia">Wait!</span>
          <span class="tay-sub-dialogue">(Wait. Didn't check everything.${remaining >= 2 ? ' A good detective is thorough.' : ''})</span>
        </p>
      </div>
    `;
  }

  renderNap() {
    const step = this.napSteps[this.stepIndex];
    if (!step) return '';

    const stepKey = `${this.currentBeat}-${this.stepIndex}`;
    const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';

    return `
      <div 
        class="speech-bubble tay-bubble ${isNewLineClass}" 
        style="${step.pos}" 
        data-editor-id="act1-nap-tay-bubble"
      >
        <div class="speech-bubble-speaker">
          <span>Tay</span>
        </div>
        <p class="speech-bubble-text">
          <span class="tay-onomatopoeia">${step.onomatopoeia}</span>
          <span class="tay-sub-dialogue">(${step.dialogue})</span>
        </p>
      </div>
    `;
  }

  renderShadeDrift() {
    // Pure silence beat per Craft script: no dialogue, no subtitle, no stamp.
    // The shade wash itself lives in renderSceneLayer() so it can drift continuously
    // through the whole act instead of snapping on only for this beat.
    return `
      <div class="shade-drift-timelapse-banner" data-editor-id="act1-drift-timelapse">
        2:38 PM ➔ 3:05 PM
      </div>
    `;
  }

  renderAlarm() {
    const step = this.alarmSteps[this.stepIndex];
    if (!step) return '';

    const isLast = this.stepIndex === this.alarmSteps.length - 1;
    return `
      <div class="callie-offscreen-banner" style="top: 4.5rem; right: 2rem; border-color: ${isLast ? 'var(--color-danger)' : 'var(--palette-teal-dark)'};" data-editor-id="act1-alarm-callie">
        <div class="callie-offscreen-label" style="color: ${isLast ? 'var(--color-danger)' : 'var(--palette-teal-dark)'};">Callie</div>
        <div style="font-size: 1.15rem; font-weight: 800;">"${step.text}"</div>
      </div>
    `;
  }

  renderCaseFile() {
    return `
      <div class="case-file-card" data-editor-id="act1-case-file-card"
           role="dialog" aria-modal="true" aria-labelledby="act1-case-file-title">
        <div class="case-file-header">
          <div class="case-file-title-group">
            <span class="case-file-badge">Act 1 Case File</span>
            <h2 class="case-file-title" id="act1-case-file-title">The Four Leads vs. Heat Stroke Reality</h2>
          </div>
          <div class="stamp-temp-badge" style="background: var(--color-info-strong); border-color: var(--color-info);">3:05 PM</div>
        </div>

        <table class="case-file-table" data-editor-id="act1-case-file-table">
          <thead>
            <tr>
              <th>What Tay Called It</th>
              <th>What It Actually Was (Risk Factor)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="tay-term">The Vault</td>
              <td>Full sun, no shade, 90 minutes — extreme trapped heat</td>
            </tr>
            <tr>
              <td class="tay-term">High Ground</td>
              <td>137°F dock wood surface — radiant heat at 4 inches</td>
            </tr>
            <tr>
              <td class="tay-term">The Water One</td>
              <td>Warm sun-baked water — zero hydration since car ride</td>
            </tr>
            <tr class="lake-row">
              <td class="tay-term">The Biggest Bowl</td>
              <td class="reality-term">The immediate cooling source she never used</td>
            </tr>
          </tbody>
        </table>

        <div class="case-file-footer">
          <button 
            id="act1-btn-proceed-pov" 
            class="act1-hud-btn btn-action-primary pulse-btn" 
            data-editor-id="act1-btn-proceed-pov" aria-label="See what Callie sees"
          >
            See What Callie Sees ➔
          </button>
        </div>
      </div>
    `;
  }

  renderPovRise() {
    const stepKey = `${this.currentBeat}-${this.stepIndex}`;
    const isNewLineClass = this._renderedStep !== stepKey ? 'is-new-line' : '';
    return `
      <div 
        class="speech-bubble callie-bubble ${isNewLineClass}" 
        style="top: 18%; left: 35%; max-width: var(--bubble-max-w, 340px);" 
        data-editor-id="act1-pov-callie-bubble"
      >
        <div class="speech-bubble-speaker">
          <span>Callie</span>
        </div>
        <p class="speech-bubble-text" style="font-size: 1.35rem; font-weight: 800; color: var(--color-danger);">
          "Tay?"
        </p>
      </div>
    `;
  }

  renderBottomLeftControls() {
    if (this.currentBeat === 'cold_open') {
      const isMissionCardStep = this.coldOpenSteps[this.stepIndex]?.type === 'mission_card';
      if (isMissionCardStep) return '';
      return `
        <div class="act1-hud-pill act1-nudge-pill" data-editor-id="act1-coldopen-prompt">
          <span>Click anywhere or press Space to continue</span>
        </div>
      `;
    }

    if (this.currentBeat === 'hub') {
      return `
        <button 
          id="act1-btn-recap-coldopen" 
          class="act1-hud-btn" 
          data-editor-id="act1-btn-recap-coldopen"
          title="Review Cold Open"
          aria-label="Replay the intro"
        >
          Replay Intro
        </button>
      `;
    }

    if (this.currentBeat === 'lead_active') {
      return `
        <button 
          id="act1-btn-return-hub" 
          class="act1-hud-btn" 
          data-editor-id="act1-btn-return-hub"
          title="Return to Lake Hub"
          aria-label="Back to the lake hub"
        >
          ◀ Back to Hub
        </button>
      `;
    }

    return '';
  }

  renderBottomRightControls() {
    switch (this.currentBeat) {
      case 'cold_open':
        const isLastColdOpen = this.stepIndex === this.coldOpenSteps.length - 1;
        const isMissionCardStep = this.coldOpenSteps[this.stepIndex]?.type === 'mission_card';
        // The mission card modal carries its own "Start Investigation" button — showing
        // a second, identical one in the bottom nav underneath it is a redundant control
        // that isn't meant to be clicked from here, so hide it while the card is up.
        if (isMissionCardStep) return '';
        return isLastColdOpen ? `
          <button
            id="act1-btn-start-hub"
            class="act1-hud-btn btn-action-primary pulse-btn"
            data-editor-id="act1-btn-start-hub" aria-label="Start the investigation"
          >
            Start Investigation ➔
          </button>
        ` : `
          <button
            id="act1-btn-next-step"
            class="act1-hud-btn"
            data-editor-id="act1-btn-next-step" aria-label="Next line"
          >
            Next ▶
          </button>
        `;

      case 'hub':
        const allVisited = this.visitedLeads.size === 4;
        // Once every lead is worked, the canopy itself becomes the break trigger — so this
        // shows a prompt pointing at it rather than a second button that does the same job.
        return allVisited ? `
          <div class="act1-hud-pill canopy-prompt-pill" data-editor-id="act1-canopy-prompt"
               role="status" aria-live="polite">
            <span>All four leads worked — click the canopy to rest</span>
          </div>
        ` : `
          <button
            id="act1-btn-check-gate"
            class="act1-hud-btn"
            data-editor-id="act1-btn-check-gate" aria-label="Check whether all leads are finished"
          >
            Check Finished ▶
          </button>
        `;

      case 'lead_active':
        return '';

      case 'gate':
        return `
          <button 
            id="act1-btn-return-hub" 
            class="act1-hud-btn btn-action-primary" 
            data-editor-id="act1-btn-return-hub"
            aria-label="Keep searching for leads"
          >
            Keep Searching ➔
          </button>
        `;

      case 'nap':
        const isLastNapStep = this.stepIndex === this.napSteps.length - 1;
        return isLastNapStep ? `
          <button 
            id="act1-btn-start-drift" 
            class="act1-hud-btn btn-action-primary" 
            data-editor-id="act1-btn-start-drift" aria-label="Rest in the shade"
          >
            Rest in Shade ➔
          </button>
        ` : `
          <button 
            id="act1-btn-next-step" 
            class="act1-hud-btn" 
            data-editor-id="act1-btn-next-step" aria-label="Next"
          >
            Next ▶
          </button>
        `;

      case 'drift':
        return `
          <button 
            id="act1-btn-start-alarm" 
            class="act1-hud-btn btn-action-primary pulse-btn" 
            data-editor-id="act1-btn-start-alarm" aria-label="Continue: later that afternoon"
          >
            Later That Afternoon ➔
          </button>
        `;

      case 'alarm':
        const isLastAlarmStep = this.stepIndex === this.alarmSteps.length - 1;
        return isLastAlarmStep ? `
          <button 
            id="act1-btn-start-case-file" 
            class="act1-hud-btn btn-action-primary pulse-btn" 
            data-editor-id="act1-btn-start-case-file" aria-label="Review the case file"
          >
            Review Case File ➔
          </button>
        ` : `
          <button 
            id="act1-btn-next-step" 
            class="act1-hud-btn" 
            data-editor-id="act1-btn-next-step" aria-label="Next"
          >
            Next ▶
          </button>
        `;

      case 'case_file':
        return '';

      case 'pov_rise':
        return `
          <button 
            id="act1-btn-start-act2" 
            class="act1-hud-btn btn-action-primary pulse-btn" 
            data-editor-id="act1-btn-start-act2" aria-label="Continue to Act 2: Emergency Response"
          >
            Act 2: Emergency Response ➔
          </button>
        `;

      default:
        return '';
    }
  }

  bindEvents() {
    this.handleClick = this.handleClick || ((e) => {
      if (this.isEditModeActive()) return;

      const target = e.target;

      if (target.closest('#act1-btn-back-act0')) {
        e.stopPropagation();
        this.app?.navigateTo('act0');
        return;
      }
      if (target.closest('#act1-btn-title')) {
        e.stopPropagation();
        this.app?.navigateTo('opening');
        return;
      }

      const interactable = target.closest('.act1-interactable');
      if (interactable) {
        e.stopPropagation();
        if (this.currentBeat !== 'hub' || this.isTayWalking) return;
        this.triggerWalkToLead(interactable.getAttribute('data-lead'));
        return;
      }

      const canopyEl = target.closest('.lake-scene-canopy.canopy-armed');
      if (canopyEl) {
        e.stopPropagation();
        if (this.currentBeat !== 'hub' || this.isTayWalking) return;
        if (this.visitedLeads.size < 4) return;
        this.triggerWalkToLead('canopy');
        return;
      }

      if (this.currentBeat === 'cold_open') {
        const isMissionCardStep = this.coldOpenSteps[this.stepIndex]?.type === 'mission_card';
        if (!isMissionCardStep && !target.closest('.act1-nav-bar, .act1-hud-bar, .act1-mission-card, .act1-interactable, .act1-pov-card')) {
          this.nextSubStep();
          return;
        }
      }

      const buttonMap = {
        '#act1-btn-next-step': () => this.nextSubStep(),
        '#act1-btn-start-hub': () => {
          this.currentBeat = 'hub';
          this.stepIndex = 0;
          this.playBeep(520, 'triangle', 0.15);
          this.render();
        },
        '#act1-btn-start-hub-modal': () => {
          this.currentBeat = 'hub';
          this.stepIndex = 0;
          this.playBeep(520, 'triangle', 0.15);
          this.render();
        },
        '#pov-btn-close': () => this.returnToHub(),
        '#act1-btn-pov-next': () => this.nextPovStep(),
        '#act1-btn-finish-lead': () => this.returnToHub(),
        '#act1-btn-return-hub': () => this.returnToHub(),
        '#act1-btn-check-gate': () => {
          this.currentBeat = 'gate';
          this.render();
        },
        '#act1-btn-start-drift': () => this.startShadeDrift(),
        '#act1-btn-start-alarm': () => this.startAlarm(),
        '#act1-btn-start-case-file': () => {
          this.currentBeat = 'case_file';
          this.render();
        },
        '#act1-btn-proceed-pov': () => {
          this.currentBeat = 'pov_rise';
          this.pantingLevel = 4;
          this.render();
        },
        '#act1-btn-start-act2': () => this.proceedToAct2(),
        '#act1-btn-recap-coldopen': () => {
          this.currentBeat = 'cold_open';
          this.stepIndex = 0;
          this.render();
        }
      };

      for (const [selector, handler] of Object.entries(buttonMap)) {
        if (target.closest(selector)) {
          e.stopPropagation();
          handler();
          return;
        }
      }
    });

    this.container.addEventListener('click', this.handleClick);
  }

  isEditModeActive() {
    return document.body.classList.contains('edit-mode-active');
  }

  selectLead(leadId) {
    const lead = this.leadsData[leadId];
    if (!lead) return;

    this.activeLeadId = leadId;
    this.currentBeat = 'lead_active';
    this.povStepIndex = 0;

    const isFirstVisit = !this.visitedLeads.has(leadId);

    if (isFirstVisit) {
      this.visitedLeads.add(leadId);
      this.leadVisitOrder.push(leadId);
      this.clockMinutes += lead.clockAdvance;
      this.pantingLevel = Math.min(4, 1 + this.visitedLeads.size * 0.75);
    }

    this.leadVisitCounts[leadId] = (this.leadVisitCounts[leadId] || 0) + 1;

    // Remember which interactable opened the POV dialog so focus can be handed back to it
    // on close — design-language.md §7.5, and the pattern Act 2 already follows.
    this.returnFocusLeadId = leadId;

    this.playBeep(440, 'sine', 0.1);
    this.render();
    this.focusInPovDialog();
  }

  returnToHub() {
    const returnTo = this.returnFocusLeadId;
    this.currentBeat = 'hub';
    this.activeLeadId = null;
    this.povStepIndex = 0;
    this.render();

    // Restore focus to the interactable that opened the dialog.
    const hotspot = this.container?.querySelector(`.act1-interactable[data-lead="${returnTo}"]`);
    if (hotspot && !this.isEditModeActive()) hotspot.focus();
    this.returnFocusLeadId = null;
  }

  /**
   * Move focus into the POV dialog on open and on every step advance, so the control that
   * moves the beat forward is where the keyboard lands. Required by design-language.md §7.4.
   */
  focusInPovDialog() {
    focusInto(this.container, ['#act1-btn-pov-next', '#act1-btn-finish-lead', '#pov-btn-close']);
  }

  nextPovStep() {
    const steps = this.buildPovSteps();
    if (this.povStepIndex < steps.length - 1) {
      this.povStepIndex++;
      this.playBeep(500, 'sine', 0.08);
      this.render();
      this.focusInPovDialog();
    }
  }

  nextSubStep() {
    if (this.currentBeat === 'cold_open') {
      if (this.stepIndex < this.coldOpenSteps.length - 1) {
        this.stepIndex++;
        this.playBeep(520, 'sine', 0.1);
        this.render();
      }
    } else if (this.currentBeat === 'nap') {
      if (this.stepIndex < this.napSteps.length - 1) {
        this.stepIndex++;
        this.render();
      }
    } else if (this.currentBeat === 'alarm') {
      if (this.stepIndex < this.alarmSteps.length - 1) {
        this.stepIndex++;
        if (this.stepIndex === 1) {
          this.playCrinkleSound();
        }
        this.render();
      }
    }
  }

  startNap() {
    this.currentBeat = 'nap';
    this.stepIndex = 0;
    this.tayHasEnteredScene = false;
    this.clockMinutes = 158; // 2:38 PM
    this.pantingLevel = 3;
    this.render();
  }

  startShadeDrift() {
    this.currentBeat = 'drift';
    this.stepIndex = 0;
    this.clockMinutes = 185; // 3:05 PM
    this.pantingLevel = 4;
    this.render();
  }

  startAlarm() {
    this.currentBeat = 'alarm';
    this.stepIndex = 0;
    this.render();
  }

  proceedToAct2() {
    if (this.app && typeof this.app.navigateTo === 'function') {
      this.app.navigateTo('act2');
    }
  }

  handleKeyDown(e) {
    if (this.isEditModeActive()) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // The spacebar reports e.key === ' ', not 'Space' — the old check never matched, so
    // the Space shortcut was dead. Space only advances when focus is NOT on a control,
    // otherwise it would hijack the spacebar from a focused button (where the browser
    // already uses it to activate).
    const onControl = typeof e.target?.closest === 'function' &&
      e.target.closest('button, a, [role="button"], input, textarea, select, [contenteditable]');
    const isAdvanceKey = e.key === 'ArrowRight' || (e.key === ' ' && !onControl);

    if (isAdvanceKey) {
      if (this.currentBeat === 'cold_open' || this.currentBeat === 'nap' || this.currentBeat === 'alarm') {
        e.preventDefault();
        this.nextSubStep();
      } else if (this.currentBeat === 'lead_active') {
        e.preventDefault();
        if (this.povStepIndex < this.buildPovSteps().length - 1) {
          this.nextPovStep();
        } else {
          this.returnToHub();
        }
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
      if (this.currentBeat === 'lead_active' || this.currentBeat === 'gate') {
        e.preventDefault();
        this.returnToHub();
      }
    }
  }
}
