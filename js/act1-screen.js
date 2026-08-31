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

    // Leads Data with Dialogue Lines & Decay Alternates
    this.leadsData = {
      cooler: {
        id: 'cooler',
        name: 'The Cooler',
        tayName: 'The Vault',
        icon: '🥪',
        class: 'hotspot-cooler',
        clockAdvance: 18,
        lines: [
          "The vault. I know the vault.",
          "Sandwiches live in the vault.",
          "It has a lid. Not a lock.",
          "I'll just wait right here."
        ],
        fourthSlotLine: "Vault. Waiting. Good plan.",
        stamp: {
          tag: 'Risk Factor: Conductive & Direct Radiant Heat',
          temp: '99°F Direct Sun',
          text: "She has been pressed against it for eleven minutes. Full sun, no shade within six feet. The cooler is cold. The spot she picked is not.",
          lesson: "Dogs choose food over comfort, every single time."
        },
        callieLine: "You're not gonna get in there, baby.",
        tayFollowUp: "I might."
      },
      dock: {
        id: 'dock',
        name: 'The Dock',
        tayName: 'High Ground',
        icon: '☀️',
        class: 'hotspot-dock',
        clockAdvance: 15,
        lines: [
          "High ground. Good for seeing.",
          "Smells like hot dogs used to be here.",
          "Historically. A hot dog was here.",
          "I should patrol it. For clues."
        ],
        fourthSlotLine: "Hot dog. Somewhere. Probably.",
        stamps: [
          {
            tag: 'Risk Factor: Ground Surface Radiation',
            temp: '137°F Dock Surface',
            text: "Dock surface: 137°F. Ambient air: 96°F. Her paws are four inches off that board. Yours are not.",
            lesson: "Pavement and dock wood absorb and radiate extreme heat directly onto short dogs."
          },
          {
            tag: 'Veterinary Prevention: The Hand Test',
            temp: '7-Second Test',
            text: "Press the back of your hand firmly to the ground for seven seconds. If you cannot comfortably hold it there, she shouldn't stand or walk on it.",
            lesson: "Paw pads burn easily and dogs cannot sweat to dissipate trapped ground heat."
          }
        ]
      },
      bowl: {
        id: 'bowl',
        name: 'Her Water Bowl',
        tayName: 'The Water One',
        icon: '🥣',
        class: 'hotspot-bowl',
        clockAdvance: 20,
        lines: [
          "My bowl! …It's the water one.",
          "No meat in there. Never is.",
          "I checked yesterday. Same result.",
          "Maybe later. Not a priority."
        ],
        fourthSlotLine: "Water. Later. Not now.",
        stamp: {
          tag: 'Risk Factor: Dehydration & Heat Stagnation',
          temp: 'Warm Water Since Noon',
          text: "Half full. Sun-side. Warm since noon. She has not had a single drink of water since getting out of the car.",
          lesson: "Water bowls placed in direct sunlight become unpalatable, leaving dogs dehydrated."
        }
      },
      lake: {
        id: 'lake',
        name: 'The Lake',
        tayName: 'The Biggest Bowl',
        icon: '🌊',
        class: 'hotspot-lake',
        clockAdvance: 15,
        lines: [
          "That's the biggest bowl ever.",
          "Still water, though. No meat.",
          "Nothing in there wants me.",
          "Hard pass."
        ],
        fourthSlotLine: "Just water. Pass.",
        // The lake has NO truth stamp per the Craft script!
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

    return { driftOpacity, saturationDrop };
  }

  render() {
    if (!this.container) return;

    const timeStr = this.getFormattedTime();
    const leadsCount = this.visitedLeads.size;
    const allLeadsVisited = leadsCount === 4;
    const isPovRaised = this.currentBeat === 'pov_rise';
    const { driftOpacity, saturationDrop } = this.getEscalation();

    this.container.innerHTML = `
      <div class="act1-container" data-editor-id="act1-screen-container">

        <!-- Main 16:9 Viewport Stage -->
        <div
          id="act1-card"
          class="act1-viewport-card ${isPovRaised ? 'pov-raised' : 'low-cam'}"
          data-editor-id="act1-viewport-card"
          style="--act1-drift-opacity: ${driftOpacity}; --act1-saturation-drop: ${saturationDrop}%;"
        >
          <!-- Background Scene Illustration -->
          <img
            src="Assets/Image/CallieAndTay-Lakeside.jpg"
            alt="Callie and Tay at the lake shore, under a pop-up shade canopy beside a cooler"
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

  renderSceneLayer() {
    const isHub = this.currentBeat === 'hub';

    return `
      <!-- Scene Layer over the illustrated lakeside plate (Callie, Tay & the cooler are baked into the art) -->
      <div class="act1-scene-layer" data-editor-id="act1-scene-layer">

        <!-- Persistent shade-drift wash: opacity driven by --act1-drift-opacity (see getEscalation()) -->
        <div class="shade-drift-overlay" data-editor-id="act1-shade-drift-overlay"></div>

        <!-- 1. The Cooler Hotzone ("The Vault") — cooler itself is already drawn in the scene photo -->
        <div class="lake-scene-cooler" data-lead="cooler" data-editor-id="act1-asset-cooler" title="Investigate The Cooler"></div>

        <!-- 2. The Wooden Dock Asset ("High Ground") -->
        <svg class="lake-scene-dock" viewBox="0 0 180 110" data-lead="dock" data-editor-id="act1-asset-dock" title="Investigate The Dock">
          <rect x="30" y="38" width="12" height="55" rx="3" fill="#452a1d" />
          <rect x="85" y="44" width="12" height="52" rx="3" fill="#452a1d" />
          <rect x="140" y="48" width="12" height="48" rx="3" fill="#452a1d" />
          <ellipse cx="36" cy="93" rx="16" ry="4.5" fill="rgba(36, 73, 82, 0.45)" />
          <ellipse cx="91" cy="96" rx="16" ry="4.5" fill="rgba(36, 73, 82, 0.45)" />
          <ellipse cx="146" cy="96" rx="16" ry="4.5" fill="rgba(36, 73, 82, 0.45)" />
          <polygon points="10,40 170,45 165,56 5,51" fill="#5E3D2A" />
          <polygon points="12,38 30,39 26,50 8,49" fill="#B45309" />
          <polygon points="33,39 51,40 47,51 29,50" fill="#D97706" />
          <polygon points="54,40 72,41 68,52 50,51" fill="#B45309" />
          <polygon points="75,41 93,42 89,53 71,52" fill="#D97706" />
          <polygon points="96,42 114,43 110,54 92,53" fill="#B45309" />
          <polygon points="117,43 135,44 131,55 113,54" fill="#D97706" />
          <polygon points="138,44 156,45 152,56 134,55" fill="#B45309" />
        </svg>

        <!-- 3. The Water Bowl Asset ("The Water One") -->
        <svg class="lake-scene-bowl" viewBox="0 0 80 60" data-lead="bowl" data-editor-id="act1-asset-bowl" title="Investigate Water Bowl">
          <ellipse cx="40" cy="46" rx="34" ry="12" fill="rgba(36, 52, 36, 0.45)" />
          <path d="M12,24 L20,44 C22,48 58,48 60,44 L68,24 Z" fill="#94A3B8" />
          <ellipse cx="40" cy="24" rx="28" ry="11" fill="#CBD5E1" />
          <ellipse cx="40" cy="25" rx="24" ry="9" fill="#64748B" />
          <ellipse cx="40" cy="27" rx="20" ry="7" fill="#38BDF8" />
          <ellipse cx="48" cy="26" rx="8" ry="2.5" fill="rgba(255, 255, 255, 0.85)" />
        </svg>

        <!-- 4. The Lake Interaction Zone ("The Biggest Bowl") -->
        <div class="lake-scene-lake" data-lead="lake" data-editor-id="act1-asset-lake" title="Investigate The Lake"></div>

        <!-- Hotspot Pins Overlay (Active during Lake Hub) -->
        ${isHub ? `
          <!-- 1. The Cooler Pin -->
          <button 
            class="act1-hotspot-pin hotspot-cooler ${this.visitedLeads.has('cooler') ? 'visited' : ''}" 
            data-lead="cooler"
            data-editor-id="act1-pin-cooler"
            aria-label="Investigate The Cooler"
          >
            <div class="hotspot-badge-circle">
              <span>🥪</span>
              ${this.visitedLeads.has('cooler') ? '<span class="hotspot-check-icon">✓</span>' : ''}
            </div>
            <span class="hotspot-label-pill">The Cooler</span>
          </button>

          <!-- 2. The Dock Pin -->
          <button 
            class="act1-hotspot-pin hotspot-dock ${this.visitedLeads.has('dock') ? 'visited' : ''}" 
            data-lead="dock"
            data-editor-id="act1-pin-dock"
            aria-label="Investigate The Dock"
          >
            <div class="hotspot-badge-circle">
              <span>☀️</span>
              ${this.visitedLeads.has('dock') ? '<span class="hotspot-check-icon">✓</span>' : ''}
            </div>
            <span class="hotspot-label-pill">The Dock</span>
          </button>

          <!-- 3. Her Water Bowl Pin -->
          <button 
            class="act1-hotspot-pin hotspot-bowl ${this.visitedLeads.has('bowl') ? 'visited' : ''}" 
            data-lead="bowl"
            data-editor-id="act1-pin-bowl"
            aria-label="Investigate Her Water Bowl"
          >
            <div class="hotspot-badge-circle">
              <span>🥣</span>
              ${this.visitedLeads.has('bowl') ? '<span class="hotspot-check-icon">✓</span>' : ''}
            </div>
            <span class="hotspot-label-pill">Water Bowl</span>
          </button>

          <!-- 4. The Lake Pin -->
          <button 
            class="act1-hotspot-pin hotspot-lake ${this.visitedLeads.has('lake') ? 'visited' : ''}" 
            data-lead="lake"
            data-editor-id="act1-pin-lake"
            aria-label="Investigate The Lake"
          >
            <div class="hotspot-badge-circle">
              <span>🌊</span>
              ${this.visitedLeads.has('lake') ? '<span class="hotspot-check-icon">✓</span>' : ''}
            </div>
            <span class="hotspot-label-pill">The Lake</span>
          </button>
        ` : ''}

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
            <div class="mission-leads-grid">
              <div class="mission-lead-item"><span>🥪</span> <span>The Cooler ("The Vault")</span></div>
              <div class="mission-lead-item"><span>☀️</span> <span>The Dock ("High Ground")</span></div>
              <div class="mission-lead-item"><span>🥣</span> <span>Water Bowl ("The Water One")</span></div>
              <div class="mission-lead-item"><span>🌊</span> <span>The Lake ("The Biggest Bowl")</span></div>
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

    // Determine current line from narration decay
    const leadSlotIndex = this.leadVisitOrder.indexOf(this.activeLeadId);
    const slotN = leadSlotIndex >= 0 ? leadSlotIndex + 1 : (this.visitedLeads.size || 1);
    
    let leadLines = [];
    if (slotN >= 4) {
      leadLines = [lead.fourthSlotLine];
    } else {
      const linesCount = Math.max(1, 5 - slotN);
      leadLines = lead.lines.slice(0, linesCount);
    }

    let currentDialogueLine = '';
    let isTaySpeaking = true;
    let isCallieSpeaking = false;
    let isTruthStampShowing = false;
    let activeStamp = null;

    if (isLake) {
      if (visitCount === 1) {
        currentDialogueLine = leadLines[0];
      } else {
        const gagIndex = Math.min(visitCount - 2, lead.revisitGags.length - 1);
        currentDialogueLine = lead.revisitGags[gagIndex];
      }
    } else {
      if (slotN >= 4) {
        currentDialogueLine = lead.fourthSlotLine;
        isTruthStampShowing = true;
        activeStamp = lead.stamp || (lead.stamps ? lead.stamps[0] : null);
        if (lead.callieLine) isCallieSpeaking = true;
      } else {
        const lineIdx = Math.min(visitCount - 1, leadLines.length - 1);
        currentDialogueLine = leadLines[lineIdx];

        // On the final dialogue line of this lead (or subsequent visits), show Callie line and Truth Stamp
        if (visitCount >= leadLines.length) {
          if (lead.callieLine) isCallieSpeaking = true;
          isTruthStampShowing = true;
          if (lead.stamps) {
            const stampIdx = Math.min(visitCount - leadLines.length, lead.stamps.length - 1);
            activeStamp = lead.stamps[stampIdx];
          } else if (lead.stamp) {
            activeStamp = lead.stamp;
          }
        }
      }
    }

    return `
      <div class="act1-pov-viewport-modal" data-editor-id="act1-pov-viewport-modal">
        <div class="pov-viewport-card" data-editor-id="act1-pov-card">
          
          <!-- Top Header with Location Tag & Return Button -->
          <div class="pov-viewport-header">
            <div class="pov-tag-badge">
              <span>📍 TAY'S POV: ${lead.name.toUpperCase()} (${lead.tayName.toUpperCase()})</span>
            </div>
            <button id="pov-btn-close" class="pov-close-btn" data-editor-id="act1-pov-close" title="Return to Lake Hub">
              ✕ Lake Hub
            </button>
          </div>

          <!-- Close-Up Vector Scene from Tay's POV -->
          ${this.renderPovScene(this.activeLeadId)}

          <!-- Dialogue & Overlays Layer inside Viewport -->
          <div class="pov-overlay-speech">
            ${isTaySpeaking ? `
              <div 
                class="speech-bubble tay-bubble" 
                style="top: 20%; left: 36%; max-width: min(350px, 32vw);" 
                data-editor-id="act1-lead-tay-speech"
              >
                <div class="speech-bubble-speaker">
                  <span>🐶</span>
                  <span>Tay</span>
                </div>
                <p class="speech-bubble-text">
                  <span class="tay-onomatopoeia">${isLake && visitCount > 1 ? 'Splash!' : 'Snort!'}</span>
                  <span class="tay-sub-dialogue">("${currentDialogueLine}")</span>
                </p>
              </div>
            ` : ''}

            ${isCallieSpeaking ? `
              <div class="callie-offscreen-banner" style="top: 3.8rem; right: 1.5rem;" data-editor-id="act1-lead-callie-banner">
                <div class="callie-offscreen-label">👩 Callie</div>
                <div>"${lead.callieLine}"</div>
              </div>
            ` : ''}

            ${isTruthStampShowing && activeStamp ? `
              <div class="act1-truth-stamp-overlay" style="bottom: 4.6rem;" data-editor-id="act1-truth-stamp">
                <div class="stamp-header">
                  <span class="stamp-tag">📋 ${activeStamp.tag}</span>
                  <span class="stamp-temp-badge">${activeStamp.temp}</span>
                </div>
                <div class="stamp-body-text">${activeStamp.text}</div>
                <div class="stamp-lesson-badge">${activeStamp.lesson}</div>
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
        return allVisited ? `
          <button 
            id="act1-btn-start-nap" 
            class="act1-hud-btn btn-action-primary pulse-btn" 
            data-editor-id="act1-btn-start-nap"
          >
            🐾 Time for a Break ➔
          </button>
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

    // 4. Hotspot Pins & In-Scene Asset Clicks
    this.container.querySelectorAll('.act1-hotspot-pin').forEach(pin => {
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        const leadId = pin.getAttribute('data-lead');
        this.selectLead(leadId);
      });
    });

    const coolerAsset = this.container.querySelector('.lake-scene-cooler');
    if (coolerAsset) {
      coolerAsset.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive() || this.currentBeat !== 'hub') return;
        this.selectLead('cooler');
      });
    }

    const dockAsset = this.container.querySelector('.lake-scene-dock');
    if (dockAsset) {
      dockAsset.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive() || this.currentBeat !== 'hub') return;
        this.selectLead('dock');
      });
    }

    const bowlAsset = this.container.querySelector('.lake-scene-bowl');
    if (bowlAsset) {
      bowlAsset.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive() || this.currentBeat !== 'hub') return;
        this.selectLead('bowl');
      });
    }

    const lakeAsset = this.container.querySelector('.lake-scene-lake');
    if (lakeAsset) {
      lakeAsset.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive() || this.currentBeat !== 'hub') return;
        this.selectLead('lake');
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

    // 6. Gate Check
    const checkGateBtn = this.container.querySelector('#act1-btn-check-gate');
    if (checkGateBtn) {
      checkGateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        if (this.visitedLeads.size < 4) {
          this.currentBeat = 'gate';
          this.render();
        } else {
          this.startNap();
        }
      });
    }

    // 7. Start Nap
    const startNapBtn = this.container.querySelector('#act1-btn-start-nap');
    if (startNapBtn) {
      startNapBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.startNap();
      });
    }

    // 8. Start Shade Drift
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
