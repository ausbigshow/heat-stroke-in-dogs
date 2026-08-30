/**
 * Act 0 Screen Logic & Dialogue Player
 * Renders the couch scene with Callie and Tay, presenting the intro dialogue
 * as distinct speech bubbles for each respective character.
 */

export class Act0Screen {
  constructor(app) {
    this.app = app;
    this.currentBeatIndex = 0;
    this.container = null;

    // Verbatim dialogue beats from Craft document (Act 0 — Dialogue Script)
    this.beats = [
      {
        id: 'beat1',
        title: 'Beat 1 — Hello',
        dialogue: [
          { speaker: 'callie', name: 'Callie', text: "Hey. I'm Callie." }
        ],
        direction: 'Wave to camera. Tay\'s tail thumping steadily beside her.'
      },
      {
        id: 'beat2',
        title: 'Beat 2 — The Name',
        dialogue: [
          { speaker: 'callie', name: 'Callie', text: "This is Tay." }
        ],
        direction: 'Callie\'s hand goes to Tay\'s back. Ears perk hard at her own name.'
      },
      {
        id: 'beat3',
        title: 'Beat 3 — Tay Introduces Herself',
        dialogue: [
          { speaker: 'tay', name: 'Tay (Subtitles)', text: "That's me! That's my name!" }
        ],
        direction: 'Two quick high excited barks. Whole body wiggling, tongue out, staring straight down the lens.'
      },
      {
        id: 'beat4',
        title: 'Beat 4 — Who She Is',
        dialogue: [
          { speaker: 'callie', name: 'Callie', text: "She's a French Bulldog. She loves snacks, the lake, and me. In whatever order you want." }
        ],
        direction: 'Callie smiling warmly, gesturing toward Tay.'
      },
      {
        id: 'beat5',
        title: 'Beat 5 — The Order',
        dialogue: [
          { speaker: 'tay', name: 'Tay (Subtitles)', text: "Snacks. Definitely snacks first." }
        ],
        direction: 'One bright, clipped yip. Sharp head tilt, ears swiveling.'
      },
      {
        id: 'beat6',
        title: 'Beat 6 — The Thesis Joke',
        dialogue: [
          { speaker: 'callie', name: 'Callie', text: "She's also never once known when something's wrong with her." },
          { speaker: 'tay', name: 'Tay (Subtitles)', text: "I feel amazing! I always feel amazing!" }
        ],
        direction: 'Happy huff-bark under Callie\'s words. Tay looking up at her, tail going, thrilled to be discussed.'
      },
      {
        id: 'beat7',
        title: 'Beat 7 — The Turn',
        dialogue: [
          { speaker: 'callie', name: 'Callie', text: "A couple summers ago, we drove out to the lake. It was a good day. Right up until it wasn't." }
        ],
        direction: 'Her smile fades to something plainer. Room tone only. Tay\'s chin lowers onto Callie\'s leg.'
      },
      {
        id: 'beat8',
        title: 'Beat 8 — The Serious Fact',
        dialogue: [
          { speaker: 'callie', name: 'Callie', text: "Tay had heat stroke. It almost killed her." }
        ],
        direction: 'Total silence under the line. Hold two full seconds.'
      },
      {
        id: 'beat9',
        title: 'Beat 9 — Handing Off',
        dialogue: [
          { speaker: 'tay', name: 'Tay (Subtitles)', text: "I was having such a good day!" },
          { speaker: 'callie', name: 'Callie', text: "You were. That was kind of the problem." },
          { speaker: 'callie', name: 'Callie', text: "She felt it before I saw it. So she's telling this part." },
          { speaker: 'tay', name: 'Tay (Subtitles)', text: "I'll tell it! I'll tell it so good!" }
        ],
        direction: 'One bright bark. Callie looks at her, then back to camera, smiling despite herself.'
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

    // Generate speech bubbles markup for current beat
    const bubblesHtml = beat.dialogue.map((item, idx) => {
      const isTay = item.speaker === 'tay';
      const bubbleClass = isTay ? 'tay-bubble' : 'callie-bubble';
      const avatarIcon = isTay ? '🐶' : '👩';
      const editorId = `act0-bubble-${beat.id}-${idx}`;

      return `
        <div class="speech-bubble ${bubbleClass}" data-editor-id="${editorId}">
          <div class="speech-bubble-speaker">
            <span>${avatarIcon}</span>
            <span>${item.name}</span>
          </div>
          <p class="speech-bubble-text">${item.text}</p>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="act0-screen" data-editor-id="act0-screen-container">
        <!-- Header -->
        <header class="act0-header" data-editor-id="act0-header">
          <div class="act0-badge" data-editor-id="act0-badge">
            <span>📖</span>
            <span>Act 0 — Introduction</span>
          </div>
          <div class="act0-progress-indicator" data-editor-id="act0-progress">
            <span>Beat ${this.currentBeatIndex + 1} of ${totalBeats}</span>
          </div>
        </header>

        <!-- Main Layout: Couch Illustration on Left, Speech Bubbles on Right -->
        <div class="act0-main-layout" data-editor-id="act0-main-layout">
          <!-- Left Media Panel -->
          <div class="act0-media-panel" data-editor-id="act0-media-panel">
            <div class="act0-couch-card" data-editor-id="act0-couch-card">
              <img 
                src="Assets/Image/CallieAndTay.jpg" 
                alt="Callie and Tay sitting together on the couch at home" 
                class="act0-couch-img"
                data-editor-id="act0-couch-image"
              />
              <div class="act0-character-tag" data-editor-id="act0-character-tag">
                <span>🛋️</span>
                <span>Callie & Tay — Living Room</span>
              </div>
            </div>
          </div>

          <!-- Right Dialogue Panel -->
          <div class="act0-dialogue-panel" data-editor-id="act0-dialogue-panel">
            <div id="act0-bubbles-container" class="act0-bubbles-container">
              ${bubblesHtml}
            </div>

            <!-- Stage Direction Note -->
            <div class="act0-stage-direction" data-editor-id="act0-direction">
              <span>🎬</span>
              <span>${beat.direction}</span>
            </div>

            <!-- Navigation Controls -->
            <div class="act0-controls" data-editor-id="act0-controls">
              <div class="act0-nav-btn-group">
                <button 
                  id="act0-prev-btn" 
                  class="act0-nav-btn" 
                  ${isFirstBeat ? 'disabled' : ''}
                  data-editor-id="act0-prev-btn"
                  title="Previous Beat (ArrowLeft)"
                >
                  ⬅ Back
                </button>
                ${!isLastBeat ? `
                  <button 
                    id="act0-next-btn" 
                    class="act0-nav-btn btn-primary" 
                    data-editor-id="act0-next-btn"
                    title="Next Beat (Space / ArrowRight)"
                  >
                    Next ➔
                  </button>
                ` : `
                  <button 
                    id="act0-start-act1-btn" 
                    class="act0-nav-btn btn-start-act1" 
                    data-editor-id="act0-start-act1-btn"
                    title="Proceed to Act 1: The Lake Trip"
                  >
                    🐾 Begin Act 1: The Lake Trip ➔
                  </button>
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="act0-footer" data-editor-id="act0-footer">
          <button id="act0-back-to-title-btn" class="btn-text-link" data-editor-id="act0-back-title">
            ⟵ Back to Title Screen
          </button>
        </footer>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const prevBtn = this.container.querySelector('#act0-prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        if (this.isEditModeActive()) return;
        this.prevBeat();
      });
    }

    const nextBtn = this.container.querySelector('#act0-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        if (this.isEditModeActive()) return;
        this.nextBeat();
      });
    }

    const startAct1Btn = this.container.querySelector('#act0-start-act1-btn');
    if (startAct1Btn) {
      startAct1Btn.addEventListener('click', (e) => {
        if (this.isEditModeActive()) return;
        this.startAct1();
      });
    }

    const backTitleBtn = this.container.querySelector('#act0-back-to-title-btn');
    if (backTitleBtn) {
      backTitleBtn.addEventListener('click', (e) => {
        if (this.isEditModeActive()) return;
        if (this.app && typeof this.app.navigateTo === 'function') {
          this.app.navigateTo('opening');
        }
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
