/**
 * Act 0 Screen Logic & Dialogue Player
 * - Displays CallieAndTay-Home.jpg front and center across the majority of the viewport.
 * - Shows exactly ONE speech bubble at a time in sequence.
 * - Bubble stems are angled directly toward Callie or Tay.
 * - Tay's lines formatted with dog onomatopoeias + parenthetical dialogue: Bark! (that's me!)
 */

export class Act0Screen {
  constructor(app) {
    this.app = app;
    this.currentStepIndex = 0;
    this.container = null;

    // Single-bubble sequence steps verbatim from Act 0 Dialogue Script
    // Callie is at ~39% X, 33% Y -> her bubbles sit strictly on the left wall (left: 4% - 6%)
    // Tay is at ~53% X, 54% Y -> her bubbles sit in the upper right window area (left: 58%)
    this.steps = [
      {
        id: 'step1',
        speaker: 'callie',
        name: 'Callie',
        text: "Hey. I'm Callie.",
        style: 'top: 12%; left: 6%; max-width: min(300px, 26vw);'
      },
      {
        id: 'step2',
        speaker: 'callie',
        name: 'Callie',
        text: "This is Tay.",
        style: 'top: 12%; left: 6%; max-width: min(300px, 26vw);'
      },
      {
        id: 'step3',
        speaker: 'tay',
        name: 'Tay',
        onomatopoeia: 'Bark!',
        dialogue: "that's me! that's my name!",
        style: 'top: 18%; left: 58%; max-width: min(330px, 28vw);'
      },
      {
        id: 'step4',
        speaker: 'callie',
        name: 'Callie',
        text: "She's a French Bulldog. She loves snacks, the lake, and me. In whatever order you want.",
        style: 'top: 6%; left: 5%; max-width: min(330px, 26vw);'
      },
      {
        id: 'step5',
        speaker: 'tay',
        name: 'Tay',
        onomatopoeia: 'Yip!',
        dialogue: 'snacks. definitely snacks first.',
        style: 'top: 18%; left: 58%; max-width: min(330px, 28vw);'
      },
      {
        id: 'step6',
        speaker: 'callie',
        name: 'Callie',
        text: "She's also never once known when something's wrong with her.",
        style: 'top: 8%; left: 5%; max-width: min(330px, 26vw);'
      },
      {
        id: 'step7',
        speaker: 'tay',
        name: 'Tay',
        onomatopoeia: 'Huff!',
        dialogue: 'i feel amazing! i always feel amazing!',
        style: 'top: 18%; left: 58%; max-width: min(340px, 28vw);'
      },
      {
        id: 'step8',
        speaker: 'callie',
        name: 'Callie',
        text: "A couple summers ago, we drove out to the lake. It was a good day. Right up until it wasn't.",
        style: 'top: 6%; left: 5%; max-width: min(330px, 26vw);'
      },
      {
        id: 'step9',
        speaker: 'callie',
        name: 'Callie',
        text: "Tay had heat stroke. It almost killed her.",
        style: 'top: 10%; left: 5%; max-width: min(320px, 26vw);'
      },
      {
        id: 'step10',
        speaker: 'tay',
        name: 'Tay',
        onomatopoeia: 'Woof!',
        dialogue: 'i was having such a good day!',
        style: 'top: 18%; left: 58%; max-width: min(330px, 28vw);'
      },
      {
        id: 'step11',
        speaker: 'callie',
        name: 'Callie',
        text: "You were. That was kind of the problem.",
        style: 'top: 10%; left: 5%; max-width: min(320px, 26vw);'
      },
      {
        id: 'step12',
        speaker: 'callie',
        name: 'Callie',
        text: "She felt it before I saw it. So she's telling this part.",
        style: 'top: 8%; left: 5%; max-width: min(330px, 26vw);'
      },
      {
        id: 'step13',
        speaker: 'tay',
        name: 'Tay',
        onomatopoeia: 'Bark!',
        dialogue: "i'll tell it! i'll tell it so good!",
        style: 'top: 18%; left: 58%; max-width: min(340px, 28vw);'
      }
    ];

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  mount() {
    this.container = document.getElementById('screen-act0');
    if (!this.container) return;

    this.render();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  unmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  render() {
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
          <span>${isTay ? '🐶' : '👩'}</span>
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

          <!-- Single Overlaid Speech Bubble Layer -->
          <div class="act0-speech-layer" data-editor-id="act0-speech-layer">
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
              >
                ◀ Back
              </button>
              <button 
                id="act0-btn-title" 
                class="act0-hud-btn" 
                data-editor-id="act0-btn-title"
                title="Return to Title Screen"
              >
                🏠 Title
              </button>
            </div>

            <div class="act0-progress-badge" data-editor-id="act0-progress">
              ${this.currentStepIndex + 1} / ${totalSteps}
            </div>

            <div class="act0-nav-group">
              ${!isLastStep ? `
                <button 
                  id="act0-btn-next" 
                  class="act0-hud-btn" 
                  data-editor-id="act0-btn-next"
                  title="Next Line (Space / ArrowRight / Click Image)"
                >
                  Next ▶
                </button>
              ` : `
                <button 
                  id="act0-btn-start-act1" 
                  class="act0-hud-btn btn-start" 
                  data-editor-id="act0-btn-start-act1"
                  title="Begin Act 1: The Lake Trip"
                >
                  🐾 Begin Act 1 ➔
                </button>
              `}
            </div>
          </nav>

        </div>

      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
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

    if (e.key === 'ArrowRight' || e.key === 'Space') {
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
