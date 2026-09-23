/**
 * Act 0 Screen Logic & Dialogue Player
 * - Displays CallieAndTay-Home.jpg front and center across the majority of the viewport.
 * - Shows exactly ONE speech bubble at a time in sequence.
 * - Bubble stems are angled directly toward Callie or Tay.
 * - Tay's lines formatted with dog onomatopoeias + parenthetical dialogue: Bark! (that's me!)
 * - Each step triggers its voiceover clip via the shared audio manager (Callie = Magnific VO,
 *   Tay = CC0/public-domain dog vocalizations). See Assets/Audio/vo-manifest.json.
 */

import { audioManager } from './audio-manager.js';
import { renderPreservingFocus } from './a11y-focus.js';

export class Act0Screen {
  constructor(app) {
    this.app = app;
    this.currentStepIndex = 0;
    this.container = null;
    this.isMounted = false;

    // Single-bubble sequence steps verbatim from Act 0 Dialogue Script
    // Callie is at ~39% X, 33% Y -> her bubbles sit closely to her left/above without obstructing face/hair
    // Tay is at ~53% X, 54% Y -> her bubbles sit closely above her head/ears at left: 48%, top: 24%
    this.steps = [
      {
        id: 'step1',
        speaker: 'callie',
        name: 'Callie',
        text: "Hey. I'm Callie.",
        style: 'top: 10%; left: 20%; max-width: var(--bubble-max-w, 280px);'
      },
      {
        id: 'step2',
        speaker: 'callie',
        name: 'Callie',
        text: "This is Tay.",
        style: 'top: 11%; left: 24%; max-width: var(--bubble-max-w, 270px);'
      },
      {
        id: 'step3',
        speaker: 'tay',
        name: 'Tay',
        onomatopoeia: 'Bark!',
        dialogue: "that's me! that's my name!",
        style: 'top: 24%; left: 48%; max-width: var(--bubble-max-w, 300px);'
      },
      {
        id: 'step4',
        speaker: 'callie',
        name: 'Callie',
        text: "She's a French Bulldog. She loves snacks, the lake, and me. In whatever order you want.",
        style: 'top: 7%; left: 11%; max-width: var(--bubble-max-w, 320px);'
      },
      {
        id: 'step5',
        speaker: 'tay',
        name: 'Tay',
        onomatopoeia: 'Yip!',
        dialogue: 'snacks. definitely snacks first.',
        style: 'top: 24%; left: 48%; max-width: var(--bubble-max-w, 300px);'
      },
      {
        id: 'step6',
        speaker: 'callie',
        name: 'Callie',
        text: "She's also never once known when something's wrong with her.",
        style: 'top: 9%; left: 12%; max-width: var(--bubble-max-w, 310px);'
      },
      {
        id: 'step7',
        speaker: 'tay',
        name: 'Tay',
        onomatopoeia: 'Huff!',
        dialogue: 'i feel amazing! i always feel amazing!',
        style: 'top: 24%; left: 48%; max-width: var(--bubble-max-w, 310px);'
      },
      {
        id: 'step8',
        speaker: 'callie',
        name: 'Callie',
        text: "A couple summers ago, we drove out to the lake. It was a good day. Right up until it wasn't.",
        style: 'top: 7%; left: 11%; max-width: var(--bubble-max-w, 320px);'
      },
      {
        id: 'step9',
        speaker: 'callie',
        name: 'Callie',
        text: "Tay had heat stroke. It almost killed her.",
        style: 'top: 10%; left: 13%; max-width: var(--bubble-max-w, 300px);'
      },
      {
        id: 'step10',
        speaker: 'tay',
        name: 'Tay',
        onomatopoeia: 'Woof!',
        dialogue: 'i was having such a good day!',
        style: 'top: 24%; left: 48%; max-width: var(--bubble-max-w, 300px);'
      },
      {
        id: 'step11',
        speaker: 'callie',
        name: 'Callie',
        text: "You were. That was kind of the problem.",
        style: 'top: 10%; left: 13%; max-width: var(--bubble-max-w, 300px);'
      },
      {
        id: 'step12',
        speaker: 'callie',
        name: 'Callie',
        text: "She felt it before I saw it. So she's telling this part.",
        style: 'top: 9%; left: 12%; max-width: var(--bubble-max-w, 310px);'
      },
      {
        id: 'step13',
        speaker: 'tay',
        name: 'Tay',
        onomatopoeia: 'Bark!',
        dialogue: "i'll tell it! i'll tell it so good!",
        style: 'top: 24%; left: 48%; max-width: var(--bubble-max-w, 310px);'
      }
    ];

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  mount() {
    this.container = document.getElementById('screen-act0');
    if (!this.container) return;

    this.isMounted = true;
    // Kick off manifest load + preload; render() will request the first clip once ready.
    audioManager.init();

    this.render();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  unmount() {
    this.isMounted = false;
    audioManager.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Play the current step's voiceover clip. Waits for the manifest to be ready, then
   * re-checks that the learner hasn't already advanced past this step (rapid clicking)
   * before starting playback. playForStep() itself cuts off any clip still playing.
   */
  playStepAudio() {
    const step = this.steps[this.currentStepIndex];
    if (!step) return;
    const stepId = step.id;

    audioManager.init().then(() => {
      if (!this.isMounted) return;
      const active = this.steps[this.currentStepIndex];
      if (!active || active.id !== stepId) return;
      audioManager.playForStep(stepId);
    });
  }

  /**
   * Re-render the step, keeping the keyboard learner on the control they were using.
   * Advancing replaces the whole card, so without this every Enter on "Next" dropped
   * focus to <body> and the learner had to tab back through the HUD — thirteen times.
   */
  render() {
    renderPreservingFocus(
      this.container,
      () => this.renderNow(),
      // On the final step "Next" is replaced by "Begin Act 1"; land there instead of <body>.
      ['#act0-btn-start-act1', '#act0-btn-next', '#act0-btn-prev']
    );
  }

  renderNow() {
    if (!this.container) return;

    const step = this.steps[this.currentStepIndex];
    const totalSteps = this.steps.length;
    const isFirstStep = this.currentStepIndex === 0;
    const isLastStep = this.currentStepIndex === totalSteps - 1;
    const isTay = step.speaker === 'tay';

    // Render formatted text
    let bubbleContent = '';
    if (isTay) {
      bubbleContent = `
        <p class="speech-bubble-text">
          <span class="tay-onomatopoeia">${step.onomatopoeia}</span>
          <span class="tay-sub-dialogue">(${step.dialogue})</span>
        </p>
      `;
    } else {
      bubbleContent = `
        <p class="speech-bubble-text">${step.text}</p>
      `;
    }

    const singleBubbleHtml = `
      <div 
        id="act0-active-bubble"
        class="speech-bubble ${isTay ? 'tay-bubble' : 'callie-bubble'}" 
        style="${step.style}" 
        data-editor-id="act0-bubble-${step.id}"
      >
        <div class="speech-bubble-speaker">
          <span>${step.name}</span>
        </div>
        ${bubbleContent}
      </div>
    `;

    this.container.innerHTML = `
      <div class="act0-container" data-editor-id="act0-screen-container">
        
        <!-- Main Front-and-Center Viewport Card -->
        <div id="act0-card" class="act0-viewport-card" data-editor-id="act0-viewport-card" title="Click anywhere to continue">
          
          <!-- Background Scene Illustration -->
          <img 
            src="Assets/Image/CallieAndTay-Home.jpg" 
            alt="Callie and Tay sitting together on the living room couch" 
            class="act0-scene-img"
            data-editor-id="act0-home-img"
          />

          <!-- Single Overlaid Speech Bubble Layer. The bubble swaps in place on every
               step, so it must announce itself to screen readers — without aria-live a
               non-sighted learner hears nothing at all when the line changes. -->
          <div
            class="act0-speech-layer"
            data-editor-id="act0-speech-layer"
            aria-live="polite"
            aria-atomic="true"
          >
            ${singleBubbleHtml}
          </div>

          <!-- Bottom Navigation HUD -->
          <nav class="act0-nav-bar" data-editor-id="act0-nav-bar">
            <div class="act0-nav-group">
              <button 
                id="act0-btn-prev" 
                class="act0-hud-btn" 
                ${isFirstStep ? 'disabled' : ''}
                data-editor-id="act0-btn-prev"
                title="Previous Line (ArrowLeft)"
                aria-label="Previous line"
              >
                <span aria-hidden="true">◀</span> Back
              </button>
              <button
                id="act0-btn-title"
                class="act0-hud-btn"
                data-editor-id="act0-btn-title"
                title="Return to Title Screen"
                aria-label="Return to the title screen"
              >
                Title
              </button>
              ${audioManager.muteButtonHtml('act0-btn-mute', 'act0-hud-btn')}
            </div>

            <!-- The counter is readable on demand but NOT a live region: the speech layer
                 above is already aria-live, and a second polite region made every advance
                 announce the line and then "step 4 of 13" behind it. -->
            <div class="act0-progress-badge" data-editor-id="act0-progress">
              <span class="sr-only">Step ${this.currentStepIndex + 1} of ${totalSteps}</span>
              <span aria-hidden="true">${this.currentStepIndex + 1} / ${totalSteps}</span>
            </div>

            <div class="act0-nav-group">
              ${!isLastStep ? `
                <button 
                  id="act0-btn-next" 
                  class="act0-hud-btn" 
                  data-editor-id="act0-btn-next"
                  title="Next Line (Space / ArrowRight / Click Image)"
                  aria-label="Next line"
                >
                  Next <span aria-hidden="true">▶</span>
                </button>
              ` : `
                <button 
                  id="act0-btn-start-act1" 
                  class="act0-hud-btn btn-start" 
                  data-editor-id="act0-btn-start-act1"
                  title="Begin Act 1: The Lake Trip"
                  aria-label="Begin Act 1: The Lake Trip"
                >
                  Begin Act 1 <span aria-hidden="true">➔</span>
                </button>
              `}
            </div>
          </nav>

        </div>

      </div>
    `;

    this.bindEvents();
    this.playStepAudio();
  }

  bindEvents() {
    // Re-bind the HUD mute button; innerHTML re-render discards previous listeners.
    audioManager.bindMuteButton(this.container);

    const card = this.container.querySelector('#act0-card');
    if (card) {
      card.addEventListener('click', (e) => {
        if (this.isEditModeActive()) return;
        // Do not advance if clicking inside HUD or bubble in edit mode
        if (e.target.closest('.act0-nav-bar')) return;
        this.nextStep();
      });
    }

    const prevBtn = this.container.querySelector('#act0-btn-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.prevStep();
      });
    }

    const nextBtn = this.container.querySelector('#act0-btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.nextStep();
      });
    }

    const titleBtn = this.container.querySelector('#act0-btn-title');
    if (titleBtn) {
      titleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        if (this.app && typeof this.app.navigateTo === 'function') {
          this.app.navigateTo('opening');
        }
      });
    }

    const startAct1Btn = this.container.querySelector('#act0-btn-start-act1');
    if (startAct1Btn) {
      startAct1Btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.startAct1();
      });
    }
  }

  isEditModeActive() {
    return document.body.classList.contains('edit-mode-active');
  }

  nextStep() {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.render();
      if (this.app?.editor?.selection) {
        this.app.editor.selection.refresh();
      }
    }
  }

  prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.render();
      if (this.app?.editor?.selection) {
        this.app.editor.selection.refresh();
      }
    }
  }

  startAct1() {
    if (this.app && typeof this.app.navigateTo === 'function') {
      this.app.navigateTo('act1');
    } else {
      console.log('🐾 Act 1 starting...');
      alert('Act 1: The Lake Trip is up next!');
    }
  }

  handleKeyDown(e) {
    if (this.isEditModeActive()) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // The spacebar reports e.key === ' ', not 'Space' — the old check never matched, so
    // the Space shortcut the tooltips advertise was dead. Space is only treated as
    // "advance" when focus is NOT on a control, otherwise it would hijack the spacebar
    // from a focused button (where the browser already uses it to activate).
    const onControl = typeof e.target?.closest === 'function' &&
      e.target.closest('button, a, [role="button"], input, textarea, select, [contenteditable]');
    const isAdvanceKey = e.key === 'ArrowRight' || (e.key === ' ' && !onControl);

    if (isAdvanceKey) {
      if (this.currentStepIndex < this.steps.length - 1) {
        e.preventDefault();
        this.nextStep();
      }
    } else if (e.key === 'ArrowLeft') {
      if (this.currentStepIndex > 0) {
        e.preventDefault();
        this.prevStep();
      }
    }
  }
}
