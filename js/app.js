/**
 * Main Application Orchestrator
 * Callie and Tay: A Story About Heat Stroke in Dogs
 */

import { OpeningScreen } from './opening-screen.js';
import { Act0Screen } from './act0-screen.js';
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

  navigateTo(screenKey) {
    console.log(`🎬 Navigating to scene: ${screenKey}`);
    const prevScreenKey = this.currentScreen;
    if (this.screens[prevScreenKey]?.unmount) {
      this.screens[prevScreenKey].unmount();
    }

    this.currentScreen = screenKey;
    const stage = document.getElementById('stage');
    if (!stage) return;

    if (screenKey === 'act0') {
      stage.innerHTML = `<section id="screen-act0" aria-label="Act 0 Introduction Scene"></section>`;
      this.screens.act0 = new Act0Screen(this);
      this.screens.act0.mount();
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
