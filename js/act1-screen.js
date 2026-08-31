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
    this.pantingLevel = 1; // 1 to 4
    
    // Sub-step index for multi-step beats
    this.stepIndex = 0;
    this.activeLeadId = null;

    // Cold Open Steps (Beat 1A)
    this.coldOpenSteps = [
      { speaker: 'tay', onomatopoeia: 'Sniff!', dialogue: "Okay. New place. Big water.", pos: 'top: 24%; left: 45%; max-width: min(290px, 22vw);' },
      { speaker: 'tay', onomatopoeia: 'Huff!', dialogue: "There is food here somewhere.", pos: 'top: 24%; left: 45%; max-width: min(290px, 22vw);' },
      { speaker: 'tay', onomatopoeia: 'Snort!', dialogue: "I can feel it in my face.", pos: 'top: 24%; left: 45%; max-width: min(290px, 22vw);' },
      { speaker: 'callie_offscreen', text: "Stay where I can see you, ma'am." },
      { speaker: 'tay', onomatopoeia: 'Yip!', dialogue: "She said my name. Basically.", pos: 'top: 24%; left: 45%; max-width: min(290px, 22vw);' },
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
        icon: '🥪',
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
        icon: '☀️',
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
        icon: '🥣',
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
        icon: '🌊',
        clockAdvance: 15,
        lines: [
          "That's the biggest bowl ever.",
          "Still water, though. No meat.",
          "Nothing in there wants me.",
          "Enormous. Useless. Hard pass."
        ],
        fourthSlotLine: "Just water. Pass.",
        exitLine: "Biggest bowl. Zero snacks. Next.",
        // The lake is the one lead the screen never corrects — no stamp, by design.
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

    this.render();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  unmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  getFormattedTime() {
    // 90 mins -> 1:30 PM, 108 mins -> 1:48 PM, etc.
    const startHour = 1;
    const totalMinutes = this.clockMinutes;
    const hour = startHour + Math.floor(totalMinutes / 60) - 1;
    const min = totalMinutes % 60;
    const paddedMin = min < 10 ? `0${min}` : `${min}`;
    return `${hour}:${paddedMin} PM`;
  }

  // Visual Escalation System (per Craft doc "Visual Asset Brief"): time of day and
  // learner clicking continuously drain the palette and drift the shade off Tay.
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

    // The canopy's cast shadow tracks the sun: it starts west of the poles at 1:30 PM and
    // slides east/short as the afternoon runs on, so by the Shade Drift beat it has crept
    // off the spot Tay picked. Percentages are of the canopy's own box.
    const shadeShiftX = -14 + t * 46;
    const shadeScaleY = 1 - t * 0.34;

    return { driftOpacity, saturationDrop, shadeShiftX, shadeScaleY };
  }

  render() {
    if (!this.container) return;

    const timeStr = this.getFormattedTime();
    const leadsCount = this.visitedLeads.size;
    const allLeadsVisited = leadsCount === 4;
    const isPovRaised = this.currentBeat === 'pov_rise';
    const { driftOpacity, saturationDrop, shadeShiftX, shadeScaleY } = this.getEscalation();
    // Beats 1D/1E push in on the canopy so the nap and the shade drift read at close range.
    const isCanopyFocus = this.currentBeat === 'nap' || this.currentBeat === 'drift';

    this.container.innerHTML = `
      <div class="act1-container" data-editor-id="act1-screen-container">

        <!-- Main 16:9 Viewport Stage -->
        <div
          id="act1-card"
          class="act1-viewport-card ${isPovRaised ? 'pov-raised' : 'low-cam'} ${isCanopyFocus ? 'canopy-focus' : ''}"
          data-editor-id="act1-viewport-card"
          style="--act1-drift-opacity: ${driftOpacity}; --act1-saturation-drop: ${saturationDrop}%; --act1-shade-shift: ${shadeShiftX}%; --act1-shade-scale-y: ${shadeScaleY};"
        >
          <!-- Background Scene Illustration -->
          <img
            src="Assets/Image/Lake-Blank.jpg"
            alt="Lakeside park landscape"
            class="act1-scene-img"
            data-editor-id="act1-lake-img"
          />

          <!-- Persistent Top HUD Bar -->
          <header class="act1-hud-bar" data-editor-id="act1-hud-bar">
            <div class="act1-hud-group">
              <button 
                id="act1-btn-back-act0" 
                class="act1-hud-btn" 
                data-editor-id="act1-btn-back-act0"
                title="Return to Act 0"
              >
                ◀ Act 0
              </button>
              <button 
                id="act1-btn-title" 
                class="act1-hud-btn" 
                data-editor-id="act1-btn-title"
                title="Return to Title"
              >
                🏠 Title
              </button>
            </div>

            <div class="act1-hud-group">
              <!-- Clock HUD -->
              <div class="act1-hud-pill clock-pill" data-editor-id="act1-hud-clock" title="Lake Time">
                <span>🕒</span>
                <span id="act1-clock-text">${timeStr}</span>
              </div>

              <!-- Leads Counter or Relabeled Hints Dropped (Beat 1H) -->
              ${isPovRaised ? `
                <div class="act1-hud-pill hints-dropped-pill" data-editor-id="act1-hud-hints">
                  <span>⚠️</span>
                  <span>HINTS DROPPED: 4</span>
                </div>
              ` : `
                <div class="act1-hud-pill leads-pill ${allLeadsVisited ? 'all-done' : ''}" data-editor-id="act1-hud-leads">
                  <span>🐾</span>
                  <span>LEADS INVESTIGATED: ${leadsCount}/4</span>
                </div>
              `}

              <!-- Panting Audio/Breath Indicator -->
              <div class="act1-hud-pill" data-editor-id="act1-hud-panting" title="Tay's Panting Rhythm">
                <span style="font-size: 0.8rem;">💨</span>
                <div class="act1-panting-meter">
                  <span class="panting-bar ${this.pantingLevel >= 1 ? 'active' : ''}"></span>
                  <span class="panting-bar ${this.pantingLevel >= 2 ? 'active' : ''}"></span>
                  <span class="panting-bar ${this.pantingLevel >= 3 ? 'active' : ''}"></span>
                  <span class="panting-bar ${this.pantingLevel >= 4 ? 'active danger' : ''}"></span>
                </div>
              </div>
            </div>
          </header>

          <!-- Redrawn In-Scene Layer with Objects & Interactive Pins -->
          ${this.renderSceneLayer()}

          <!-- Speech Bubble & Dialogue Layer -->
          <div class="act1-speech-layer" data-editor-id="act1-speech-layer">
            ${this.renderActiveBeatContent()}
          </div>

          <!-- Bottom Navigation HUD -->
          <nav class="act1-nav-bar" data-editor-id="act1-nav-bar">
            <div class="act1-hud-group">
              ${this.renderBottomLeftControls()}
            </div>
            <div class="act1-hud-group">
              ${this.renderBottomRightControls()}
            </div>
          </nav>

        </div>

      </div>
    `;

    this.bindEvents();
  }

  // A single interactive lead object: no separate floating pin/badge — the drawn
  // object itself glows to invite the click, and shows a checkmark once visited.
  // Hover/focus reveals a small name tooltip anchored to the object.
  renderInteractable(leadId, artHtml) {
    const lead = this.leadsData[leadId];
    const visited = this.visitedLeads.has(leadId);
    return `
      <button
        class="act1-interactable interactable-${leadId} ${visited ? 'visited' : ''}"
        data-lead="${leadId}"
        data-editor-id="act1-asset-${leadId}"
        aria-label="Investigate ${lead.tayName}"
      >
        <span class="interactable-art">${artHtml}</span>
        <span class="interactable-tooltip">${lead.icon} ${lead.tayName}</span>
        ${visited ? '<span class="interactable-check">✓</span>' : ''}
      </button>
    `;
  }

  // Tay, drawn to the character model sheet (coat #34383B, white blaze/chest, ear pink
  // #DC7F77, pads #43484B). Rigged as named groups so beats can animate her independently:
  // `tay-rig-chest` breathes, `tay-rig-ear` twitches, `tay-rig-head` settles for the nap.
  renderTayLyingDown() {
    return `
      <svg class="tay-lying-svg" viewBox="0 0 260 150" data-editor-id="act1-asset-tay">
        <ellipse cx="130" cy="136" rx="96" ry="12" fill="rgba(30, 41, 30, 0.32)" />

        <!-- Hind leg (far) -->
        <path d="M196,116 C210,112 222,116 224,124 C226,132 214,134 200,132 Z" fill="#2C3033" />

        <!-- Tail -->
        <path d="M212,104 C226,98 236,102 234,112 C232,118 224,116 218,110 Z" fill="#2C3033" />

        <!-- Body, lying flat -->
        <g class="tay-rig-chest">
          <path d="M64,120 C60,92 84,74 122,74 C166,74 202,88 210,110 C214,122 206,132 190,133 L84,133 C70,133 65,128 64,120 Z" fill="#34383B" />
          <!-- White chest/belly blaze -->
          <path d="M92,133 C86,120 92,106 106,102 C118,99 128,106 130,118 C131,127 126,133 118,133 Z" fill="#FFFFFF" />
        </g>

        <!-- Front paws stretched forward -->
        <path d="M64,124 C50,122 36,126 34,132 C33,137 40,139 52,138 L78,136 Z" fill="#34383B" />
        <path d="M60,136 C50,136 42,137 38,138 C44,140 54,140 62,139 Z" fill="#43484B" />

        <g class="tay-rig-head">
          <!-- Head resting on the paws -->
          <path d="M40,110 C34,96 44,82 62,80 C82,78 96,88 97,104 C98,118 86,128 68,128 C52,128 44,122 40,110 Z" fill="#34383B" />

          <!-- Ears -->
          <g class="tay-rig-ear">
            <path d="M60,82 C56,66 62,54 70,54 C78,54 82,66 79,82 Z" fill="#34383B" />
            <path d="M64,79 C61,68 65,60 70,60 C75,60 77,68 75,79 Z" fill="#DC7F77" />
          </g>
          <path d="M86,84 C86,70 92,60 99,62 C105,64 105,76 99,88 Z" fill="#2C3033" />

          <!-- Muzzle & white blaze -->
          <path d="M40,112 C34,104 36,94 44,90 C54,85 66,90 68,100 C70,112 60,120 50,119 C45,118 42,116 40,112 Z" fill="#FFFFFF" />
          <ellipse cx="41" cy="103" rx="7" ry="5.5" fill="#1A1D1F" />
          <!-- Closed, sleepy eye -->
          <path d="M62,97 C66,94 72,94 76,97" stroke="#1A1D1F" stroke-width="2.6" fill="none" stroke-linecap="round" />
          <!-- Mouth, slightly open panting -->
          <path d="M45,113 C50,117 57,117 61,114" stroke="#1A1D1F" stroke-width="2" fill="none" stroke-linecap="round" />
          <path class="tay-rig-tongue" d="M50,116 C54,116 57,118 56,122 C55,125 50,125 49,121 Z" fill="#DC7F77" />
        </g>
      </svg>
    `;
  }

  renderSceneLayer() {
    // The canopy becomes the "take a break" trigger once every lead has been worked.
    const canopyArmed = this.currentBeat === 'hub' && this.visitedLeads.size === 4;
    const isNapping = this.currentBeat === 'nap' || this.currentBeat === 'drift';

    return `
      <!-- Redrawn Scene Layer on Lake-Blank.jpg from Tay's Low First-Person Dog Eyeline -->
      <div class="act1-scene-layer" data-editor-id="act1-scene-layer">

        <!-- Persistent shade-drift wash: opacity driven by --act1-drift-opacity (see getEscalation()) -->
        <div class="shade-drift-overlay" data-editor-id="act1-shade-drift-overlay"></div>

        <!-- Pop-Up Shade Canopy. Scenery until all four leads are worked, then it becomes
             the break trigger. Its cast shadow is a separate element so it can slide as the
             sun moves (--act1-shade-shift), independently of the canopy structure. -->
        <div
          class="lake-scene-canopy ${canopyArmed ? 'canopy-armed' : ''}"
          data-editor-id="act1-asset-canopy"
          ${canopyArmed ? 'role="button" tabindex="0" aria-label="Rest in the shade"' : ''}
        >
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
          ${canopyArmed ? '<span class="canopy-tooltip">😴 Rest in the shade</span>' : ''}
        </div>

        <!-- Tay, asleep under the canopy (Beats 1D/1E) -->
        ${isNapping ? `
          <div class="lake-scene-tay ${this.currentBeat === 'drift' ? 'tay-drifting' : ''}" data-editor-id="act1-tay-sleeping">
            ${this.renderTayLyingDown()}
          </div>
        ` : ''}

        <!-- 1. The Cooler ("The Vault") — out in open sun, off the tree roots -->
        ${this.renderInteractable('cooler', `
          <svg viewBox="0 0 130 90">
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
        `)}

        <!-- 2. The Wooden Dock ("High Ground") — drawn in receding perspective so it runs
             out from the beach into the water; the near (short) end meets the shoreline
             square-on, and the whole asset is rotated to the shore normal in CSS. -->
        ${this.renderInteractable('dock', `
          <svg viewBox="0 0 200 150">
            <!-- Pilings, far pair first -->
            <rect x="80" y="44" width="7" height="30" rx="2" fill="#452A1D" />
            <rect x="114" y="44" width="7" height="30" rx="2" fill="#452A1D" />
            <ellipse cx="83" cy="74" rx="9" ry="3" fill="rgba(24, 62, 74, 0.5)" />
            <ellipse cx="118" cy="74" rx="9" ry="3" fill="rgba(24, 62, 74, 0.5)" />
            <rect x="52" y="96" width="9" height="42" rx="2" fill="#3A2317" />
            <rect x="140" y="96" width="9" height="42" rx="2" fill="#3A2317" />

            <!-- Deck: wide near end, narrow far end -->
            <polygon points="78,40 122,40 160,140 40,140" fill="#5E3D2A" />
            <!-- Cross planks, alternating, converging with perspective -->
            <polygon points="79,44 121,44 123,58 77,58" fill="#D97706" />
            <polygon points="77,60 123,60 126,76 74,76" fill="#B45309" />
            <polygon points="74,78 126,78 130,95 70,95" fill="#D97706" />
            <polygon points="70,97 130,97 134,115 66,115" fill="#B45309" />
            <polygon points="66,117 134,117 139,136 61,136" fill="#D97706" />
            <!-- Side rails -->
            <polygon points="78,40 82,40 44,140 38,140" fill="#4A2E1E" />
            <polygon points="118,40 122,40 162,140 156,140" fill="#4A2E1E" />
          </svg>
        `)}

        <!-- 3. Her Water Bowl ("The Water One") — larger, and well down from full:
             it has been evaporating in the sun since noon. -->
        ${this.renderInteractable('bowl', `
          <svg viewBox="0 0 80 60">
            <ellipse cx="40" cy="48" rx="35" ry="11" fill="rgba(36, 52, 36, 0.45)" />
            <path d="M12,22 L20,46 C22,50 58,50 60,46 L68,22 Z" fill="#94A3B8" />
            <ellipse cx="40" cy="22" rx="28" ry="11" fill="#CBD5E1" />
            <!-- Dry inner wall above the waterline -->
            <ellipse cx="40" cy="23" rx="24" ry="9.5" fill="#64748B" />
            <path d="M18,26 C20,36 24,40 40,40 C56,40 60,36 62,26 C58,32 52,35 40,35 C28,35 22,32 18,26 Z" fill="#556173" />
            <!-- Low, warm waterline sitting well below the rim -->
            <ellipse cx="40" cy="37" rx="15" ry="4.6" fill="#38BDF8" opacity="0.85" />
            <ellipse cx="45" cy="36.2" rx="5" ry="1.5" fill="rgba(255, 255, 255, 0.7)" />
          </svg>
        `)}

        <!-- 4. The Lake ("The Biggest Bowl") — open water is already painted in the
             background plate, so the affordance is a set of shore-parallel wavefronts. -->
        ${this.renderInteractable('lake', `
          <svg class="lake-ripple-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <!-- Wavefront traced from the actual sand/water boundary of Lake-Blank.jpg,
                   so the ripples run parallel to the shore instead of radiating. -->
              <path id="act1-shore-wave" d="M-8,99 C18,97 38,91 60,85 S86,80 108,77" />
            </defs>
            <g fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="1.6" stroke-linecap="round">
              <use href="#act1-shore-wave" class="lake-wave lake-wave-1" />
              <use href="#act1-shore-wave" class="lake-wave lake-wave-2" />
              <use href="#act1-shore-wave" class="lake-wave lake-wave-3" />
            </g>
          </svg>
        `)}

      </div>
    `;
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

    if (step.type === 'mission_card') {
      return `
        <div class="act1-mission-card" data-editor-id="act1-mission-card">
          <div class="mission-card-header">
            <span class="mission-card-badge">🐾 Tay's Detective Mission</span>
            <span style="font-size: 0.85rem; color: #94A3B8; font-weight: 700;">Lake Shore Hub</span>
          </div>
          <h2 class="mission-card-title">Mission: Find Real Food (No Kibble)</h2>
          <div class="mission-card-body">
            <p style="margin-bottom: 0.5rem;">Look, kibble is fine at home when there are zero other options. But we are at the lake! There are sandwiches, grilled meats, and dropped snacks out here somewhere.</p>
            <p>I've sniffed out <strong>four promising leads</strong> in the immediate area. Time to work the case and track down the food!</p>
            <!-- Tay's names only. The real labels are the Case File's reveal (Beat 1G). -->
            <div class="mission-leads-grid">
              ${Object.values(this.leadsData).map(l => `
                <div class="mission-lead-item"><span>${l.icon}</span> <span>${l.tayName}</span></div>
              `).join('')}
            </div>
          </div>
          <div class="mission-card-footer">
            <button id="act1-btn-start-hub-modal" class="act1-hud-btn btn-action-primary pulse-btn" data-editor-id="act1-btn-start-hub-modal">
              Start Investigation ➔
            </button>
          </div>
        </div>
      `;
    }

    if (step.speaker === 'callie_offscreen') {
      return `
        <div class="callie-offscreen-banner" data-editor-id="act1-coldopen-callie">
          <div class="callie-offscreen-label">👩 Callie</div>
          <div>"${step.text}"</div>
        </div>
      `;
    }

    return `
      <div 
        class="speech-bubble tay-bubble" 
        style="${step.pos}" 
        data-editor-id="act1-coldopen-bubble-${this.stepIndex}"
      >
        <div class="speech-bubble-speaker">
          <span>🐶</span>
          <span>Tay</span>
        </div>
        <p class="speech-bubble-text">
          <span class="tay-onomatopoeia">${step.onomatopoeia}</span>
          <span class="tay-sub-dialogue">(${step.dialogue})</span>
        </p>
      </div>
    `;
  }

  renderHubIntro() {
    const allVisited = this.visitedLeads.size === 4;
    return `
      <div 
        class="speech-bubble tay-bubble" 
        style="top: 24%; left: 45%; max-width: min(320px, 25vw);" 
        data-editor-id="act1-hub-speech"
      >
        <div class="speech-bubble-speaker">
          <span>🐶</span>
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

  renderPovScene(leadId) {
    if (leadId === 'cooler') {
      return `
        <svg class="pov-scene-illustration" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" data-editor-id="act1-pov-scene-cooler">
          <!-- Sky -->
          <rect width="800" height="450" fill="#BAE6FD" />
          <circle cx="680" cy="80" r="70" fill="#FEF08A" opacity="0.9" />
          <circle cx="680" cy="80" r="130" fill="#FEF08A" opacity="0.3" />
          <polygon points="680,80 0,450 800,450" fill="rgba(254, 240, 138, 0.15)" />
          <!-- Canopy frame -->
          <polygon points="400,0 800,0 800,140 460,80" fill="#E2D4C3" opacity="0.8" />
          <rect x="760" y="80" width="14" height="280" fill="#78350F" opacity="0.7" />
          <!-- Grass ground -->
          <polygon points="0,220 800,240 800,450 0,450" fill="#65A30D" />
          <ellipse cx="400" cy="380" rx="300" ry="60" fill="#4D7C0F" />
          <!-- Giant Cooler (Low 4-inch vantage) -->
          <ellipse cx="400" cy="395" rx="220" ry="35" fill="rgba(30, 41, 59, 0.5)" />
          <rect x="220" y="200" width="360" height="180" rx="16" fill="#0284C7" />
          <rect x="240" y="220" width="320" height="140" rx="8" fill="#0369A1" />
          <circle cx="250" cy="380" r="28" fill="#1E293B" />
          <circle cx="250" cy="380" r="14" fill="#64748B" />
          <circle cx="550" cy="380" r="28" fill="#1E293B" />
          <circle cx="550" cy="380" r="14" fill="#64748B" />
          <rect x="200" y="165" width="400" height="48" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="3" />
          <rect x="380" y="195" width="40" height="35" rx="6" fill="#DC2626" />
          <rect x="388" y="202" width="24" height="14" rx="3" fill="#FFFFFF" />
          <!-- Heat wave lines -->
          <path d="M180,320 Q190,290 180,260" stroke="#F59E0B" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round" />
          <path d="M620,320 Q630,290 620,260" stroke="#F59E0B" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round" />
        </svg>
      `;
    }

    if (leadId === 'dock') {
      return `
        <svg class="pov-scene-illustration" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" data-editor-id="act1-pov-scene-dock">
          <rect width="800" height="450" fill="#0284C7" />
          <rect width="800" height="160" fill="#BAE6FD" />
          <circle cx="400" cy="50" r="50" fill="#FDE047" opacity="0.85" />
          <polygon points="0,160 800,160 800,130 500,100 200,120 0,140" fill="#15803D" />
          <ellipse cx="140" cy="240" rx="120" ry="12" fill="#0369A1" />
          <ellipse cx="660" cy="250" rx="120" ry="12" fill="#0369A1" />
          <!-- Scorching dock planks in 4-inch perspective -->
          <polygon points="120,450 680,450 490,160 310,160" fill="#78350F" />
          <polygon points="125,445 675,445 650,400 150,400" fill="#B45309" />
          <polygon points="155,395 645,395 620,355 180,355" fill="#D97706" />
          <polygon points="185,350 615,350 590,315 210,315" fill="#B45309" />
          <polygon points="215,310 585,310 565,280 235,280" fill="#D97706" />
          <polygon points="240,275 560,275 540,245 260,245" fill="#B45309" />
          <polygon points="265,240 535,240 520,215 280,215" fill="#D97706" />
          <polygon points="285,210 515,210 500,185 300,185" fill="#B45309" />
          <polygon points="305,180 495,180 485,160 315,160" fill="#D97706" />
          <line x1="280" y1="450" x2="360" y2="160" stroke="#451A03" stroke-width="3" />
          <line x1="520" y1="450" x2="440" y2="160" stroke="#451A03" stroke-width="3" />
        </svg>
        <div class="heat-haze-layer"></div>
      `;
    }

    if (leadId === 'bowl') {
      return `
        <svg class="pov-scene-illustration" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" data-editor-id="act1-pov-scene-bowl">
          <rect width="800" height="450" fill="#BAE6FD" />
          <circle cx="700" cy="70" r="80" fill="#FEF08A" />
          <rect y="120" width="800" height="330" fill="#65A30D" />
          <ellipse cx="400" cy="360" rx="280" ry="70" fill="rgba(30, 41, 59, 0.45)" />
          <path d="M160,220 L220,360 C240,390 560,390 580,360 L640,220 Z" fill="#94A3B8" />
          <ellipse cx="400" cy="220" rx="240" ry="70" fill="#E2E8F0" />
          <ellipse cx="400" cy="225" rx="210" ry="58" fill="#64748B" />
          <ellipse cx="400" cy="240" rx="180" ry="46" fill="#38BDF8" />
          <ellipse cx="470" cy="235" rx="55" ry="14" fill="rgba(255, 255, 255, 0.75)" />
          <path d="M300,180 Q310,150 300,120" stroke="#F59E0B" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round" />
          <path d="M500,180 Q510,150 500,120" stroke="#F59E0B" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round" />
        </svg>
      `;
    }

    if (leadId === 'lake') {
      return `
        <svg class="pov-scene-illustration" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" data-editor-id="act1-pov-scene-lake">
          <rect width="800" height="450" fill="#BAE6FD" />
          <circle cx="150" cy="70" r="55" fill="#FEF08A" />
          <polygon points="0,180 250,130 500,160 800,120 800,220 0,220" fill="#15803D" />
          <polygon points="120,190 380,150 650,180 800,160 800,230 0,230" fill="#166534" />
          <rect y="210" width="800" height="240" fill="#0284C7" />
          <ellipse cx="400" cy="250" rx="380" ry="25" fill="#0369A1" />
          <ellipse cx="400" cy="300" rx="420" ry="30" fill="#0284C7" />
          <ellipse cx="400" cy="360" rx="450" ry="35" fill="#0369A1" />
          <polygon points="0,420 800,410 800,450 0,450" fill="#D97706" opacity="0.8" />
          <path d="M0,418 Q200,408 400,418 T800,418" stroke="#E0F2FE" stroke-width="6" fill="none" />
          <circle cx="120" cy="435" r="8" fill="#78350F" />
          <circle cx="280" cy="438" r="6" fill="#78350F" />
          <circle cx="560" cy="436" r="10" fill="#78350F" />
          <circle cx="710" cy="437" r="7" fill="#78350F" />
        </svg>
      `;
    }

    return '';
  }

  renderLeadActive() {
    const lead = this.leadsData[this.activeLeadId];
    if (!lead) return '';

    const isLake = this.activeLeadId === 'lake';
    const visitCount = this.leadVisitCounts[this.activeLeadId] || 1;

    // Narration decay (Craft rule): at lead slot N, play the first (5 − N) lines.
    // The 4th lead investigated drops to its single short, muddled alternate.
    const leadSlotIndex = this.leadVisitOrder.indexOf(this.activeLeadId);
    const slotN = leadSlotIndex >= 0 ? leadSlotIndex + 1 : (this.visitedLeads.size || 1);
    const isFourthSlot = slotN >= 4;

    // The whole exchange plays on ONE screen — Tay's riff, Callie over the top, Tay's
    // reply, then the line where she gives up on the lead. No per-visit line stepping.
    let tayLines = [];
    let showCallie = false;
    let showExit = false;
    // The lake is the one lead the screen never corrects — its silence is the point.
    let stamp = isLake ? null : lead.stamp;

    if (isLake && visitCount > 1) {
      // Lake revisits are gag-only: no decay, no exit line, one throwaway line.
      const gagIndex = Math.min(visitCount - 2, lead.revisitGags.length - 1);
      tayLines = [lead.revisitGags[gagIndex]];
    } else if (isFourthSlot) {
      tayLines = [lead.fourthSlotLine];
      showCallie = !!lead.callieLine;
    } else {
      tayLines = lead.lines.slice(0, Math.max(1, 5 - slotN));
      showCallie = !!lead.callieLine;
      showExit = !!lead.exitLine;
    }

    const onomatopoeia = isLake && visitCount > 1 ? 'Splash!' : 'Snort!';

    return `
      <div class="act1-pov-viewport-modal" data-editor-id="act1-pov-viewport-modal">
        <div class="pov-viewport-card" data-editor-id="act1-pov-card">

          <!-- Top Header with Location Tag & Return Button -->
          <div class="pov-viewport-header">
            <div class="pov-tag-badge">
              <span>📍 TAY'S POV: ${lead.tayName.toUpperCase()}</span>
            </div>
            <button id="pov-btn-close" class="pov-close-btn" data-editor-id="act1-pov-close" title="Return to Lake Hub">
              ✕ Lake Hub
            </button>
          </div>

          <!-- Close-Up Vector Scene from Tay's POV -->
          ${this.renderPovScene(this.activeLeadId)}

          <!-- Dialogue Layer: the full exchange, all at once -->
          <div class="pov-overlay-speech">
            <div
              class="speech-bubble tay-bubble pov-dialogue-bubble"
              data-editor-id="act1-lead-tay-speech"
            >
              <div class="speech-bubble-speaker">
                <span>🐶</span>
                <span>Tay</span>
              </div>
              <p class="speech-bubble-text">
                <span class="tay-onomatopoeia">${onomatopoeia}</span>
              </p>
              <div class="pov-dialogue-run">
                ${tayLines.map(line => `
                  <span class="tay-sub-dialogue pov-dialogue-line">"${line}"</span>
                `).join('')}
              </div>
            </div>

            ${showCallie ? `
              <div class="callie-offscreen-banner pov-callie-banner" data-editor-id="act1-lead-callie-banner">
                <div class="callie-offscreen-label">👩 Callie <span class="callie-offscreen-hint">(offscreen)</span></div>
                <div>"${lead.callieLine}"</div>
                ${lead.tayFollowUp ? `
                  <div class="pov-tay-retort">
                    <span class="pov-tay-retort-label">🐶 Tay</span>
                    <span class="tay-sub-dialogue">"${lead.tayFollowUp}"</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Bottom stack: her exit line, then the screen's correction. Flowed rather
                 than individually pinned, so longer stamp copy can never collide. -->
            ${(showExit || stamp) ? `
              <div class="pov-bottom-stack">
                ${showExit ? `
                  <div class="pov-exit-line" data-editor-id="act1-lead-exit-line">
                    <span class="tay-sub-dialogue">"${lead.exitLine}"</span>
                  </div>
                ` : ''}
                ${stamp ? `
                  <div class="act1-truth-stamp" data-editor-id="act1-truth-stamp">
                    <span class="truth-stamp-metric">${stamp.metric}</span>
                    <span class="truth-stamp-line">${stamp.line}</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>

          <!-- Navigation inside POV Viewport: ONLY "Done Investigating" -->
          <nav class="act1-nav-bar" style="bottom: 0.9rem; left: 1.1rem; right: 1.1rem; justify-content: flex-end;">
            <button id="act1-btn-finish-lead" class="act1-hud-btn btn-action-primary pulse-btn" data-editor-id="act1-btn-finish-lead">
              Done Investigating ➔
            </button>
          </nav>

        </div>
      </div>
    `;
  }

  renderGate() {
    const remaining = 4 - this.visitedLeads.size;
    return `
      <div 
        class="speech-bubble tay-bubble" 
        style="top: 24%; left: 45%; max-width: min(340px, 26vw);" 
        data-editor-id="act1-gate-bubble"
      >
        <div class="speech-bubble-speaker">
          <span>🐶</span>
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

    return `
      <div 
        class="speech-bubble tay-bubble" 
        style="${step.pos}" 
        data-editor-id="act1-nap-tay-bubble"
      >
        <div class="speech-bubble-speaker">
          <span>🐶</span>
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
        ☀️ 2:38 PM ➔ 3:05 PM
      </div>
    `;
  }

  renderAlarm() {
    const step = this.alarmSteps[this.stepIndex];
    if (!step) return '';

    const isLast = this.stepIndex === this.alarmSteps.length - 1;
    return `
      <div class="callie-offscreen-banner" style="top: 4.5rem; right: 2rem; border-color: ${isLast ? '#DC2626' : 'var(--palette-teal-dark)'};" data-editor-id="act1-alarm-callie">
        <div class="callie-offscreen-label" style="color: ${isLast ? '#DC2626' : 'var(--palette-teal-dark)'};">👩 Callie</div>
        <div style="font-size: 1.15rem; font-weight: 800;">"${step.text}"</div>
      </div>
    `;
  }

  renderCaseFile() {
    return `
      <div class="case-file-card" data-editor-id="act1-case-file-card">
        <div class="case-file-header">
          <div class="case-file-title-group">
            <span class="case-file-badge">Act 1 Case File</span>
            <h2 class="case-file-title">The Four Leads vs. Heat Stroke Reality</h2>
          </div>
          <div class="stamp-temp-badge" style="background: #0284C7; border-color: #38BDF8;">3:05 PM</div>
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
              <td class="tay-term">🥪 The Vault</td>
              <td>Full sun, no shade, 90 minutes — extreme trapped heat</td>
            </tr>
            <tr>
              <td class="tay-term">☀️ High Ground</td>
              <td>137°F dock wood surface — radiant heat at 4 inches</td>
            </tr>
            <tr>
              <td class="tay-term">🥣 The Water One</td>
              <td>Warm sun-baked water — zero hydration since car ride</td>
            </tr>
            <tr class="lake-row">
              <td class="tay-term">🌊 The Biggest Bowl</td>
              <td class="reality-term">⭐ The immediate cooling source she never used</td>
            </tr>
          </tbody>
        </table>

        <div class="case-file-footer">
          <button 
            id="act1-btn-proceed-pov" 
            class="act1-hud-btn btn-action-primary pulse-btn" 
            data-editor-id="act1-btn-proceed-pov"
          >
            See What Callie Sees ➔
          </button>
        </div>
      </div>
    `;
  }

  renderPovRise() {
    return `
      <div 
        class="speech-bubble callie-bubble" 
        style="top: 18%; left: 35%; max-width: min(340px, 28vw);" 
        data-editor-id="act1-pov-callie-bubble"
      >
        <div class="speech-bubble-speaker">
          <span>👩</span>
          <span>Callie</span>
        </div>
        <p class="speech-bubble-text" style="font-size: 1.35rem; font-weight: 800; color: #DC2626;">
          "Tay?"
        </p>
      </div>
    `;
  }

  renderBottomLeftControls() {
    if (this.currentBeat === 'hub') {
      return `
        <button 
          id="act1-btn-recap-coldopen" 
          class="act1-hud-btn" 
          data-editor-id="act1-btn-recap-coldopen"
          title="Review Cold Open"
        >
          ⏮ Replay Intro
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
            data-editor-id="act1-btn-start-hub"
          >
            Start Investigation ➔
          </button>
        ` : `
          <button 
            id="act1-btn-next-step" 
            class="act1-hud-btn" 
            data-editor-id="act1-btn-next-step"
          >
            Next ▶
          </button>
        `;

      case 'hub':
        const allVisited = this.visitedLeads.size === 4;
        // Once every lead is worked, the canopy itself becomes the break trigger — so this
        // shows a prompt pointing at it rather than a second button that does the same job.
        return allVisited ? `
          <div class="act1-hud-pill canopy-prompt-pill" data-editor-id="act1-canopy-prompt">
            <span>😴</span>
            <span>All four leads worked — click the canopy to rest</span>
          </div>
        ` : `
          <button
            id="act1-btn-check-gate"
            class="act1-hud-btn"
            data-editor-id="act1-btn-check-gate"
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
            data-editor-id="act1-btn-start-drift"
          >
            Rest in Shade ➔
          </button>
        ` : `
          <button 
            id="act1-btn-next-step" 
            class="act1-hud-btn" 
            data-editor-id="act1-btn-next-step"
          >
            Next ▶
          </button>
        `;

      case 'drift':
        return `
          <button 
            id="act1-btn-start-alarm" 
            class="act1-hud-btn btn-action-primary pulse-btn" 
            data-editor-id="act1-btn-start-alarm"
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
            data-editor-id="act1-btn-start-case-file"
          >
            Review Case File ➔
          </button>
        ` : `
          <button 
            id="act1-btn-next-step" 
            class="act1-hud-btn" 
            data-editor-id="act1-btn-next-step"
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
            data-editor-id="act1-btn-start-act2"
          >
            🚨 Act 2: Emergency Response ➔
          </button>
        `;

      default:
        return '';
    }
  }

  bindEvents() {
    if (!this.container) return;

    // 1. Navigation Buttons (Back & Title)
    const backAct0Btn = this.container.querySelector('#act1-btn-back-act0');
    if (backAct0Btn) {
      backAct0Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.app?.navigateTo('act0');
      });
    }

    const titleBtn = this.container.querySelector('#act1-btn-title');
    if (titleBtn) {
      titleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.app?.navigateTo('opening');
      });
    }

    // 2. Generic "Next Step" Button
    const nextStepBtn = this.container.querySelector('#act1-btn-next-step');
    if (nextStepBtn) {
      nextStepBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.nextSubStep();
      });
    }

    // 3. Start Hub from Cold Open
    const startHubBtn = this.container.querySelector('#act1-btn-start-hub');
    if (startHubBtn) {
      startHubBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.currentBeat = 'hub';
        this.stepIndex = 0;
        this.playBeep(520, 'triangle', 0.15);
        this.render();
      });
    }

    const startHubModalBtn = this.container.querySelector('#act1-btn-start-hub-modal');
    if (startHubModalBtn) {
      startHubModalBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.currentBeat = 'hub';
        this.stepIndex = 0;
        this.playBeep(520, 'triangle', 0.15);
        this.render();
      });
    }

    // 4. In-Scene Interactable Clicks (cooler, dock, bowl, lake) — only live during the hub
    this.container.querySelectorAll('.act1-interactable').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive() || this.currentBeat !== 'hub') return;
        this.selectLead(el.getAttribute('data-lead'));
      });
    });

    // 4b. The canopy is the break trigger once all four leads are worked
    const canopyEl = this.container.querySelector('.lake-scene-canopy.canopy-armed');
    if (canopyEl) {
      const triggerBreak = (e) => {
        e.stopPropagation();
        if (this.isEditModeActive() || this.currentBeat !== 'hub') return;
        if (this.visitedLeads.size < 4) return;
        this.startNap();
      };
      canopyEl.addEventListener('click', triggerBreak);
      canopyEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerBreak(e);
        }
      });
    }

    // 5. POV Viewport Close / Done Investigating Button
    const povCloseBtn = this.container.querySelector('#pov-btn-close');
    if (povCloseBtn) {
      povCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.returnToHub();
      });
    }

    const finishLeadBtn = this.container.querySelector('#act1-btn-finish-lead');
    if (finishLeadBtn) {
      finishLeadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.returnToHub();
      });
    }

    const returnHubBtn = this.container.querySelector('#act1-btn-return-hub');
    if (returnHubBtn) {
      returnHubBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.returnToHub();
      });
    }

    // 6. Gate Check — only rendered while leads remain, so it always shows the gate beat.
    //    (Starting the nap is the canopy's job now; see 4b.)
    const checkGateBtn = this.container.querySelector('#act1-btn-check-gate');
    if (checkGateBtn) {
      checkGateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.currentBeat = 'gate';
        this.render();
      });
    }

    // 7. Start Shade Drift
    const startDriftBtn = this.container.querySelector('#act1-btn-start-drift');
    if (startDriftBtn) {
      startDriftBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.startShadeDrift();
      });
    }

    // 9. Start Alarm from Drift
    const startAlarmBtn = this.container.querySelector('#act1-btn-start-alarm');
    if (startAlarmBtn) {
      startAlarmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.startAlarm();
      });
    }

    // 10. Start Case File
    const startCaseFileBtn = this.container.querySelector('#act1-btn-start-case-file');
    if (startCaseFileBtn) {
      startCaseFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.currentBeat = 'case_file';
        this.render();
      });
    }

    // 11. Proceed to POV Rise
    const proceedPovBtn = this.container.querySelector('#act1-btn-proceed-pov');
    if (proceedPovBtn) {
      proceedPovBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.currentBeat = 'pov_rise';
        this.pantingLevel = 4;
        this.render();
      });
    }

    // 12. Proceed to Act 2
    const startAct2Btn = this.container.querySelector('#act1-btn-start-act2');
    if (startAct2Btn) {
      startAct2Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.proceedToAct2();
      });
    }

    // 13. Replay Intro
    const recapColdOpenBtn = this.container.querySelector('#act1-btn-recap-coldopen');
    if (recapColdOpenBtn) {
      recapColdOpenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.currentBeat = 'cold_open';
        this.stepIndex = 0;
        this.render();
      });
    }
  }

  isEditModeActive() {
    return document.body.classList.contains('edit-mode-active');
  }

  selectLead(leadId) {
    const lead = this.leadsData[leadId];
    if (!lead) return;

    this.activeLeadId = leadId;
    this.currentBeat = 'lead_active';

    const isFirstVisit = !this.visitedLeads.has(leadId);

    if (isFirstVisit) {
      this.visitedLeads.add(leadId);
      this.leadVisitOrder.push(leadId);
      this.clockMinutes += lead.clockAdvance;
      this.pantingLevel = Math.min(4, 1 + this.visitedLeads.size * 0.75);
    }

    this.leadVisitCounts[leadId] = (this.leadVisitCounts[leadId] || 0) + 1;

    this.playBeep(440, 'sine', 0.1);
    this.render();
  }

  returnToHub() {
    this.currentBeat = 'hub';
    this.activeLeadId = null;
    this.activeLeadStep = 0;
    this.render();
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

    if (e.key === 'ArrowRight' || e.key === 'Space') {
      if (this.currentBeat === 'cold_open' || this.currentBeat === 'nap' || this.currentBeat === 'alarm') {
        e.preventDefault();
        this.nextSubStep();
      } else if (this.currentBeat === 'lead_active') {
        e.preventDefault();
        if (this.activeLeadStep < this.activeLeadTotalSteps - 1) {
          this.nextLeadStep();
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
