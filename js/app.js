/**
 * Main Application Orchestrator
 * Callie and Tay: A Story About Heat Stroke in Dogs
 */

import { OpeningScreen } from './opening-screen.js';
import { Act0Screen } from './act0-screen.js';
import { Act1Screen } from './act1-screen.js';
import { initEditMode } from './editor/index.js';

class CourseApp {
  constructor() {
    this.currentScreen = 'opening';
    this.screens = {};
    this.editor = null;
  }

  init() {
    console.log('🐾 Initializing Heatstroke in Dogs eLearning Module...');

    // 1. Initialize Scene Engine
    this.screens.opening = new OpeningScreen(this);
    this.screens.opening.mount();

    // 2. Initialize Visual Edit Mode System
    this.editor = initEditMode();

    console.log('✅ Course Ready.');
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
      stage.innerHTML = `<section id="screen-act1" aria-label="Act 1 Scene"></section>`;
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
      this.screens.act1.mount();
    } else if (screenKey === 'act0') {
      stage.innerHTML = `<section id="screen-act0" aria-label="Act 0 Introduction Scene"></section>`;
      this.screens.act0 = new Act0Screen(this);
      if (options.stepIndex !== undefined) {
        this.screens.act0.currentStepIndex = options.stepIndex;
      }
      this.screens.act0.mount();
    } else if (screenKey === 'act2') {
      this.renderAct2Placeholder();
    } else if (screenKey === 'opening') {
      this.renderOpeningScreen();
      this.screens.opening = new OpeningScreen(this);
      this.screens.opening.mount();
    }

    if (this.editor && this.editor.state) {
      this.editor.state.emit('screen_changed', screenKey);
      if (this.editor.selection) {
        this.editor.selection.setSelectedElement(null);
      }
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
          <div class="characters-container" data-editor-id="opening-characters" aria-label="Illustration of Callie and her French Bulldog, Tay">
            <div class="character-card">
              <img 
                src="Assets/Image/CallieAndTay.jpg" 
                alt="Callie sitting on a couch with her French Bulldog Tay" 
                class="character-image"
                data-editor-id="opening-character-img"
              >
              <div class="character-label-pill" data-editor-id="opening-character-pill">
                <span class="dot" aria-hidden="true"></span>
                <span>Callie & Tay</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Lower Right Continue Button Container -->
        <div class="continue-btn-container" data-editor-id="opening-continue-container">
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

  renderAct2Placeholder() {
    const stage = document.getElementById('stage');
    if (!stage) return;

    stage.innerHTML = `
      <section id="screen-act2-placeholder" class="act1-container" aria-label="Act 2 Preview">
        <div class="act2-placeholder-modal" data-editor-id="act2-placeholder-modal">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🚨</div>
          <h2 class="act2-placeholder-title">Act 2: Callie's Response</h2>
          <p class="act2-placeholder-text">
            <strong>Recognition, Triage & Active Lake Cooling</strong><br>
            Act 1 is complete! Tay has refused the chicken scrap, the alarm has sounded, and the perspective has shifted to Callie's standing eyeline. Act 2 will guide emergency cooling and clinic transport.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <button id="btn-replay-act1" class="act1-hud-btn btn-action-primary" style="font-size: 0.9rem;">
              ⏮ Replay Act 1
            </button>
            <button id="btn-return-title" class="act1-hud-btn" style="font-size: 0.9rem;">
              🏠 Return to Title
            </button>
          </div>
        </div>
      </section>
    `;

    document.getElementById('btn-replay-act1')?.addEventListener('click', () => {
      this.navigateTo('act1');
    });
    document.getElementById('btn-return-title')?.addEventListener('click', () => {
      this.navigateTo('opening');
    });
  }
}

// Bootstrap on DOM loaded or immediately if already ready
function bootstrap() {
  if (window.__courseApp) return;
  const app = new CourseApp();
  app.init();
  window.__courseApp = app;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
