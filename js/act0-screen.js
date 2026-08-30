/**
 * Act 0 Screen Logic & Dialogue Player
 * - Displays CallieAndTay-Home.jpg front and center, taking up the majority of the viewport.
 * - Overlays authentic character speech bubbles with directional tails atop the image.
 * - Dialogue-only presentation verbatim from the Act 0 script.
 */

export class Act0Screen {
  constructor(app) {
    this.app = app;
    this.currentBeatIndex = 0;
    this.container = null;

    // Verbatim dialogue lines from Craft document (Act 0 — Dialogue Script)
    // Pure dialogue only, positioned dynamically over Callie and Tay
    this.beats = [
      {
        id: 'beat1',
        bubbles: [
          {
            speaker: 'callie',
            name: 'Callie',
            text: "Hey. I'm Callie.",
            style: 'top: 14%; left: 24%;'
          }
        ]
      },
      {
        id: 'beat2',
        bubbles: [
          {
            speaker: 'callie',
            name: 'Callie',
            text: "This is Tay.",
            style: 'top: 14%; left: 26%;'
          }
        ]
      },
      {
        id: 'beat3',
        bubbles: [
          {
            speaker: 'tay',
            name: 'Tay',
            text: "That's me! That's my name!",
            style: 'top: 22%; left: 54%;'
          }
        ]
      },
      {
        id: 'beat4',
        bubbles: [
          {
            speaker: 'callie',
            name: 'Callie',
            text: "She's a French Bulldog. She loves snacks, the lake, and me. In whatever order you want.",
            style: 'top: 8%; left: 16%; max-width: 380px;'
          }
        ]
      },
      {
        id: 'beat5',
        bubbles: [
          {
            speaker: 'tay',
            name: 'Tay',
            text: "Snacks. Definitely snacks first.",
            style: 'top: 22%; left: 54%;'
          }
        ]
      },
      {
        id: 'beat6',
        bubbles: [
          {
            speaker: 'callie',
            name: 'Callie',
            text: "She's also never once known when something's wrong with her.",
            style: 'top: 10%; left: 14%; max-width: 340px;'
          },
          {
            speaker: 'tay',
            name: 'Tay',
            text: "I feel amazing! I always feel amazing!",
            style: 'top: 26%; left: 54%; max-width: 320px;'
          }
        ]
      },
      {
        id: 'beat7',
        bubbles: [
          {
            speaker: 'callie',
            name: 'Callie',
            text: "A couple summers ago, we drove out to the lake. It was a good day. Right up until it wasn't.",
            style: 'top: 8%; left: 16%; max-width: 400px;'
          }
        ]
      },
      {
        id: 'beat8',
        bubbles: [
          {
            speaker: 'callie',
            name: 'Callie',
            text: "Tay had heat stroke. It almost killed her.",
            style: 'top: 12%; left: 22%; max-width: 360px;'
          }
        ]
      },
      {
        id: 'beat9',
        bubbles: [
          {
            speaker: 'tay',
            name: 'Tay',
            text: "I was having such a good day!",
            style: 'top: 16%; left: 54%; max-width: 280px;'
          },
          {
            speaker: 'callie',
            name: 'Callie',
            text: "She felt it before I saw it. So she's telling this part.",
            style: 'top: 10%; left: 14%; max-width: 340px;'
          },
          {
            speaker: 'tay',
            name: 'Tay',
            text: "I'll tell it! I'll tell it so good!",
            style: 'top: 36%; left: 56%; max-width: 300px;'
          }
        ]
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

    const beat = this.beats[this.currentBeatIndex];
    const totalBeats = this.beats.length;
    const isFirstBeat = this.currentBeatIndex === 0;
    const isLastBeat = this.currentBeatIndex === totalBeats - 1;

    // Generate speech bubbles overlaid directly on top of the image
    const bubblesHtml = beat.bubbles.map((bubble, idx) => {
      const isTay = bubble.speaker === 'tay';
      const bubbleClass = isTay ? 'tay-bubble' : 'callie-bubble';
      const editorId = `act0-bubble-${beat.id}-${idx}`;

      return `
        <div 
          class="speech-bubble ${bubbleClass}" 
          style="${bubble.style}" 
          data-editor-id="${editorId}"
        >
          <div class="speech-bubble-speaker">
            <span>${isTay ? '🐶' : '👩'}</span>
            <span>${bubble.name}</span>
          </div>
          <p class="speech-bubble-text">${bubble.text}</p>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="act0-container" data-editor-id="act0-screen-container">
        
        <!-- Main Front-and-Center Viewport Card -->
        <div id="act0-card" class="act0-viewport-card" data-editor-id="act0-viewport-card">
          
          <!-- Background Scene Illustration -->
          <img 
            src="Assets/Image/CallieAndTay-Home.jpg" 
            alt="Callie and Tay sitting on the living room couch" 
            class="act0-scene-img"
            data-editor-id="act0-home-img"
          />

          <!-- Overlaid Speech Bubbles Layer -->
          <div class="act0-speech-layer" data-editor-id="act0-speech-layer">
            ${bubblesHtml}
          </div>

          <!-- Bottom Navigation HUD -->
          <nav class="act0-nav-bar" data-editor-id="act0-nav-bar">
            <div class="act0-nav-group">
              <button 
                id="act0-btn-prev" 
                class="act0-hud-btn" 
                ${isFirstBeat ? 'disabled' : ''}
                data-editor-id="act0-btn-prev"
                title="Previous Beat (ArrowLeft)"
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
              ${this.currentBeatIndex + 1} / ${totalBeats}
            </div>

            <div class="act0-nav-group">
              ${!isLastBeat ? `
                <button 
                  id="act0-btn-next" 
                  class="act0-hud-btn" 
                  data-editor-id="act0-btn-next"
                  title="Next Beat (Space / ArrowRight / Click Image)"
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
        // If clicking on HUD buttons or speech bubbles, do not auto-advance from the background click
        if (e.target.closest('.act0-nav-bar') || e.target.closest('.speech-bubble')) return;
        this.nextBeat();
      });
    }

    const prevBtn = this.container.querySelector('#act0-btn-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.prevBeat();
      });
    }

    const nextBtn = this.container.querySelector('#act0-btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isEditModeActive()) return;
        this.nextBeat();
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

  nextBeat() {
    if (this.currentBeatIndex < this.beats.length - 1) {
      this.currentBeatIndex++;
      this.render();
      if (this.app?.editor?.selection) {
        this.app.editor.selection.refresh();
      }
    }
  }

  prevBeat() {
    if (this.currentBeatIndex > 0) {
      this.currentBeatIndex--;
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
      if (this.currentBeatIndex < this.beats.length - 1) {
        e.preventDefault();
        this.nextBeat();
      }
    } else if (e.key === 'ArrowLeft') {
      if (this.currentBeatIndex > 0) {
        e.preventDefault();
        this.prevBeat();
      }
    }
  }
}
