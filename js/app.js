/**
 * Main Application Orchestrator
 * Callie and Tay: A Story About Heat Stroke in Dogs
 */

import { OpeningScreen } from './opening-screen.js';
import { Act0Screen } from './act0-screen.js';
import { Act1Screen } from './act1-screen.js';
import { Act2Screen } from './act2-screen.js';
import { Act3Screen } from './act3-screen.js';
import { progressStore } from './progress-store.js';
import { initRotatePrompt } from './rotate-prompt.js';

/**
 * Edit Mode is the AUTHORING tool, not part of the course.
 *
 * It talks to the Node dev server in dev-server.js over /api/* — reviewer notes,
 * version history, and writing css/visual-overrides.css back to disk. None of that
 * exists on a static host, so loading it there would 404 on every visit and hand
 * learners a toolbar whose Save button cannot work.
 *
 * So it loads only where the backend actually is: a localhost origin, or an explicit
 * ?edit=1 for testing the authoring build elsewhere. The import is dynamic, so on a
 * static host the eleven editor modules are never fetched at all.
 */
function isAuthoringEnvironment() {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '';
  return isLocal || new URLSearchParams(window.location.search).has('edit');
}

class CourseApp {
  constructor() {
    this.currentScreen = 'opening';
    this.screens = {};
    this.editor = null;
  }

  async init() {
    console.log('🐾 Initializing Heatstroke in Dogs eLearning Module...');

    // 1. Initialize Scene Engine
    const urlParams = new URLSearchParams(window.location.search);
    const initialScreen = urlParams.get('screen') || urlParams.get('act');
    if (initialScreen) {
      const key = initialScreen.startsWith('act') ? initialScreen : `act${initialScreen}`;
      const beat = urlParams.get('beat');
      const stepIndex = urlParams.has('step') ? parseInt(urlParams.get('step'), 10) : undefined;
      const check = urlParams.get('check');
      const checkStep = urlParams.get('checkStep');
      const options = {};
      if (beat) options.beat = beat;
      if (stepIndex !== undefined) options.stepIndex = stepIndex;
      if (check) options.activeCheckId = check;
      if (checkStep !== null && checkStep !== undefined) options.checkStepIndex = parseInt(checkStep, 10);
      this.navigateTo(key, options);
    } else {
      this.screens.opening = new OpeningScreen(this);
      this.screens.opening.mount();
    }

    console.log('✅ Course Ready.');

    // 2. Visual Edit Mode — authoring environments only. The course above is already
    // interactive by this point, so a slow or failed editor load never blocks a learner.
    if (isAuthoringEnvironment()) {
      try {
        const { initEditMode } = await import('./editor/index.js');
        this.editor = initEditMode();
      } catch (err) {
        console.warn('Edit Mode failed to load — continuing without it.', err);
      }
    } else {
      console.log('📖 Learner build — Edit Mode is not loaded on this host.');
    }
  }

  navigateTo(screenKey, options = {}) {
    console.log(`🎬 Navigating to scene: ${screenKey}`, options);
    const prevScreenKey = this.currentScreen;
    if (this.screens[prevScreenKey]?.unmount) {
      this.screens[prevScreenKey].unmount();
    }

    this.currentScreen = screenKey;
    const stage = document.getElementById('stage');
    if (!stage) return;

    if (screenKey === 'act1') {
      stage.innerHTML = `<section id="screen-act1" aria-label="Part 1: The Lake Trip"></section>`;
      this.screens.act1 = new Act1Screen(this);
      if (options.beat) {
        this.screens.act1.currentBeat = options.beat;
      }
      if (options.stepIndex !== undefined) {
        this.screens.act1.stepIndex = options.stepIndex;
      }
      if (options.activeLeadId) {
        this.screens.act1.activeLeadId = options.activeLeadId;
      }
      if (options.resume) {
        try { this.screens.act1.applyResumeState?.(options.resume); }
        catch(e) { progressStore.clear(); }
      }
      this.screens.act1.mount();
    } else if (screenKey === 'act0') {
      stage.innerHTML = `<section id="screen-act0" aria-label="Introduction"></section>`;
      this.screens.act0 = new Act0Screen(this);
      if (options.stepIndex !== undefined) {
        this.screens.act0.currentStepIndex = options.stepIndex;
      }
      if (options.resume) {
        try { this.screens.act0.applyResumeState?.(options.resume); }
        catch(e) { progressStore.clear(); }
      }
      this.screens.act0.mount();
    } else if (screenKey === 'act2') {
      stage.innerHTML = `<section id="screen-act2" aria-label="Part 2: Emergency Response"></section>`;
      this.screens.act2 = new Act2Screen(this);
      // Restore a playthrough handed back from Act 3, so stepping back and forward does not
      // rebuild this screen from defaults. Options applied after, so they win.
      if (options.handoff) {
        this.screens.act2.applyHandoff(options.handoff);
      }
      if (options.beat) {
        this.screens.act2.currentBeat = options.beat;
      }
      if (options.stepIndex !== undefined) {
        this.screens.act2.stepIndex = options.stepIndex;
      }
      if (options.activeCheckId) {
        this.screens.act2.activeCheckId = options.activeCheckId;
      }
      if (options.resume) {
        try { this.screens.act2.applyResumeState?.(options.resume); }
        catch(e) { progressStore.clear(); }
      }
      this.screens.act2.mount(options);
    } else if (screenKey === 'act3') {
      stage.innerHTML = `<section id="screen-act3" aria-label="Part 3: At the Clinic, Then Home"></section>`;
      this.screens.act3 = new Act3Screen(this);
      // Act 2 hands its playthrough forward so every number Dr. Reyes says lands on a
      // decision the learner actually made. Absent state degrades to a neutral variant.
      if (options.handoff) {
        this.screens.act3.applyHandoff(options.handoff);
      }
      if (options.beat) {
        this.screens.act3.currentBeat = options.beat;
      }
      if (options.stepIndex !== undefined) {
        this.screens.act3.stepIndex = options.stepIndex;
      }
      if (options.resume) {
        try { this.screens.act3.applyResumeState?.(options.resume); }
        catch(e) { progressStore.clear(); }
      }
      this.screens.act3.mount();
    } else if (screenKey === 'opening') {
      this.renderOpeningScreen();
      this.screens.opening = new OpeningScreen(this);
      this.screens.opening.mount();
    }

    if (this.editor && this.editor.state) {
      this.editor.state.emit('screen_changed', screenKey);
      this.editor.state.setSelectedElement(null);
    }
  }

  renderOpeningScreen() {
    const stage = document.getElementById('stage');
    if (!stage) return;

    stage.innerHTML = `
      <section id="screen-opening" class="opening-screen" aria-label="Course Opening Screen">
        <!-- Header & Title Container at Top -->
        <header class="opening-title-container" data-editor-id="opening-title-box">
          <div class="opening-title-badge" data-editor-id="opening-badge">An Interactive Veterinary Story</div>
          <h1 class="opening-title" data-editor-id="opening-title-text">
            Callie and Tay:
            <span class="subtitle-part">a story about heat stroke in dogs.</span>
          </h1>
        </header>

        <!-- Main Body Area -->
        <div class="opening-body">
          <!-- Characters Container (Placed off-center to the left third of viewport) -->
          <div class="characters-container" data-editor-id="opening-characters" aria-label="Illustration of Callie and her French bulldog, Tay">
            <div class="character-card">
              <img 
                src="Assets/Image/CallieAndTay.jpg" 
                alt="Callie sitting on a couch with her French bulldog, Tay" 
                class="character-image"
                data-editor-id="opening-character-img"
              >
              <div class="character-label-pill" data-editor-id="opening-character-pill">
                <span class="dot" aria-hidden="true"></span>
                <span>Callie & Tay</span>
              </div>
            </div>
          </div>

          <!-- What the learner is about to do: who they'll meet and what they'll be able to do after -->
          <aside class="opening-blurb" data-editor-id="opening-blurb" aria-labelledby="opening-blurb-cast">
            <h2 id="opening-blurb-cast" class="opening-blurb-heading">Who you'll meet</h2>
            <ul class="opening-cast">
              <li class="opening-cast-item is-callie">
                <span class="opening-cast-name">Callie</span>
                <span class="opening-cast-line">Tay's person. She planned a perfect lake day and learned about heat stroke the hard way.</span>
              </li>
              <li class="opening-cast-item is-tay">
                <span class="opening-cast-name">Tay</span>
                <span class="opening-cast-line">A 4-year-old French bulldog who loves snacks, the lake, and Callie. Her flat face makes heat hit her harder.</span>
              </li>
            </ul>
            <h2 class="opening-blurb-heading">By the end, you'll be able to</h2>
            <ol class="opening-objectives">
              <li>Spot the everyday things that put a dog at risk on a hot day.</li>
              <li>Check four warning signs and tell how serious they are.</li>
              <li>Cool a dog safely, starting before the drive to the vet.</li>
              <li>Plan your next hot day out so it doesn't happen at all.</li>
            </ol>
            <p class="opening-blurb-note">An intro and three parts. You make the calls, and every choice shows you what it does.</p>
          </aside>
        </div>

        <!-- Lower Right Continue Button Container -->
        <div class="continue-btn-container" data-editor-id="opening-continue-container">
          <button id="btn-resume" class="resume-btn" data-editor-id="opening-resume-btn" hidden>Resume Part N</button>
          <button 
            id="btn-continue" 
            class="continue-btn is-visible" 
            data-editor-id="opening-continue-btn"
            aria-label="Continue to introduction"
          >
            <span class="continue-text">Continue</span>
            <span class="continue-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </span>
          </button>
        </div>
      </section>
    `;
  }
}

// Bootstrap on DOM loaded or immediately if already ready
function bootstrap() {
  if (window.__courseApp) return;
  const app = new CourseApp();
  app.init();
  window.__courseApp = app;
  initRotatePrompt();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
