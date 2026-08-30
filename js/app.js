/**
 * Main Application Orchestrator
 * Callie and Tay: A Story About Heat Stroke in Dogs
 */

import { OpeningScreen } from './opening-screen.js';
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
    this.currentScreen = screenKey;

    if (screenKey === 'act0') {
      this.renderAct0Placeholder();
    }

    if (this.editor && this.editor.state) {
      this.editor.state.emit('screen_changed', screenKey);
    }
  }

  renderAct0Placeholder() {
    const stage = document.getElementById('stage');
    if (!stage) return;

    stage.innerHTML = `
      <section id="screen-act0" class="opening-screen" aria-label="Act 0 Introduction Scene" style="justify-content: center; align-items: center; text-align: center;">
        <div style="max-width: 700px; background: rgba(255,255,255,0.9); padding: 3rem; border-radius: 24px; box-shadow: 0 20px 40px rgba(56,36,24,0.1);" data-editor-id="act0-intro-box">
          <div class="opening-title-badge" data-editor-id="act0-badge">Act 0 — Introduction</div>
          <h2 style="font-family: var(--font-family-display); font-size: 2rem; color: var(--palette-brown-dark); margin: 1rem 0;" data-editor-id="act0-title">
            "Hey. I'm Callie. This is Tay."
          </h2>
          <p style="color: var(--palette-text-muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;" data-editor-id="act0-desc">
            Act 0 video sequence ready to load. Callie and Tay introduce themselves on the couch at home before setting out for the lake.
          </p>
          <button id="btn-back-opening" class="continue-btn is-visible" style="opacity: 1; pointer-events: auto;" data-editor-id="act0-back-btn">
            <span class="continue-text">Back to Title</span>
          </button>
        </div>
      </section>
    `;

    document.getElementById('btn-back-opening')?.addEventListener('click', () => {
      window.location.reload();
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
