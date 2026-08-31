/**
 * Main Application Orchestrator
 * Callie and Tay: A Story About Heat Stroke in Dogs
 */

import { OpeningScreen } from './opening-screen.js';
import { Act0Screen } from './act0-screen.js';
import { Act1Screen } from './act1-screen.js';
import { Act2Screen } from './act2-screen.js';
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
      stage.innerHTML = `<section id="screen-act2" aria-label="Act 2 Emergency Response Scene"></section>`;
      this.screens.act2 = new Act2Screen(this);
      if (options.beat) {
        this.screens.act2.currentBeat = options.beat;
      }
      if (options.stepIndex !== undefined) {
        this.screens.act2.stepIndex = options.stepIndex;
      }
      if (options.activeCheckId) {
        this.screens.act2.activeCheckId = options.activeCheckId;
      }
      this.screens.act2.mount();
    } else if (screenKey === 'act3') {
      this.renderAct3Placeholder();
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

  /**
   * Act 3 placeholder — where Act 2's transport sequence hands off.
   * (This replaces the old Act 2 placeholder, now that Act 2 is a real screen.)
   */
  renderAct3Placeholder() {
    const stage = document.getElementById('stage');
    if (!stage) return;

    stage.innerHTML = `
      <section id="screen-act3-placeholder" class="act2-container" aria-label="Act 3 Preview">
        <div class="act3-placeholder-modal" data-editor-id="act3-placeholder-modal">
          <div class="act3-placeholder-icon" aria-hidden="true">🏥</div>
          <h2 class="act3-placeholder-title">Act 3: The Clinic</h2>
          <p class="act3-placeholder-text">
            <strong>Dr. Reyes, the report card, and Tay's voice coming back</strong><br>
            You cooled her first and drove second, and you called ahead. Act 3 picks up in the
            clinic lobby — and it is where Tay starts narrating again.
          </p>
          <div class="act3-placeholder-actions">
            <button id="btn-replay-act2" class="act2-hud-btn btn-action-primary" data-editor-id="act3-btn-replay-act2">
              ⏮ Replay Act 2
            </button>
            <button id="btn-return-title" class="act2-hud-btn" data-editor-id="act3-btn-return-title">
              🏠 Return to Title
            </button>
          </div>
        </div>
      </section>
    `;

    document.getElementById('btn-replay-act2')?.addEventListener('click', () => {
      this.navigateTo('act2');
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
