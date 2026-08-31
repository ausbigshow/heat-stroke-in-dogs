/**
 * Section Manager for Visual Edit Mode
 * Enables jumping between course sections, screens, and granular dialogue beats while authoring.
 */

export class SectionManager {
  constructor(editorState) {
    this.state = editorState;
    this.modal = null;

    this.sections = [
      {
        id: 'opening',
        title: 'Title Screen',
        badge: 'Course Intro',
        desc: 'Main course opening title screen with Callie & Tay illustration card.',
        beats: [
          { id: 'start', label: '🏠 Opening Title & Character Card', options: {} }
        ]
      },
      {
        id: 'act0',
        title: 'Act 0: Normal Day, Normal Heat',
        badge: 'Apartment & Drive',
        desc: 'Callie & Tay introduction, ambient 100°F weather alert, porch surface test, and car ride.',
        beats: [
          { id: 'intro', label: 'Step 1: Callie & Tay Intro ("Hey. I\'m Callie")', options: { stepIndex: 0 } },
          { id: 'frenchie', label: 'Step 4: French Bulldog Profile & Snacks', options: { stepIndex: 3 } },
          { id: 'alert', label: 'Step 6: 100°F Weather Alert & Porch', options: { stepIndex: 5 } },
          { id: 'car', label: 'Step 11: Suburban Car Ride to Lake', options: { stepIndex: 10 } }
        ]
      },
      {
        id: 'act1',
        title: 'Act 1: The Lake Trip',
        badge: 'Tay\'s Perspective',
        desc: 'First-person dog POV at the lake. Sniffing out food leads, nap, shade drift, and alarm.',
        beats: [
          { id: 'cold_open', label: 'Beat 1A: Monologue ("New place. Big water.")', options: { beat: 'cold_open', stepIndex: 0 } },
          { id: 'mission_card', label: 'Beat 1A: Mission Card ("Operation Real Food")', options: { beat: 'cold_open', stepIndex: 5 } },
          { id: 'hub', label: 'Beat 1B: Lake Shore Hub (4 Leads Hotspot Map)', options: { beat: 'hub' } },
          { id: 'cooler', label: '📍 POV Viewport: The Cooler ("The Vault")', options: { beat: 'lead_active', activeLeadId: 'cooler' } },
          { id: 'dock', label: '📍 POV Viewport: The Dock ("High Ground")', options: { beat: 'lead_active', activeLeadId: 'dock' } },
          { id: 'bowl', label: '📍 POV Viewport: Water Bowl ("The Water One")', options: { beat: 'lead_active', activeLeadId: 'bowl' } },
          { id: 'lake', label: '📍 POV Viewport: The Lake ("The Biggest Bowl")', options: { beat: 'lead_active', activeLeadId: 'lake' } },
          { id: 'gate', label: 'Beat 1C: The Gate ("Wait. Didn\'t check everything")', options: { beat: 'gate' } },
          { id: 'nap', label: 'Beat 1D: The Nap ("Okay. Break.")', options: { beat: 'nap', stepIndex: 0 } },
          { id: 'drift', label: 'Beat 1E: Shade Drift (2:38 PM ➔ 3:05 PM Time-lapse)', options: { beat: 'drift' } },
          { id: 'alarm', label: 'Beat 1F: Refused Scrap Alarm (Chicken & Foil Crinkle)', options: { beat: 'alarm', stepIndex: 0 } },
          { id: 'case_file', label: 'Beat 1G: Act 1 Case File Summary Card', options: { beat: 'case_file' } },
          { id: 'pov_rise', label: 'Beat 1H: POV Rise (Callie\'s Eyeline — "Tay?")', options: { beat: 'pov_rise' } }
        ]
      },
      {
        id: 'act2',
        title: 'Act 2: Emergency Response',
        badge: 'Callie\'s Action (Preview)',
        desc: 'Recognition, emergency triage, active lake cooling, and urgent veterinary transport.',
        beats: [
          { id: 'preview', label: '🚨 Act 2 Emergency Cooling Preview Modal', options: {} }
        ]
      }
    ];
  }

  jumpTo(screenKey, options = {}) {
    if (this.state.isDirty) {
      const proceed = confirm('You have unsaved changes in Edit Mode. Jump to another section without saving?');
      if (!proceed) return;
    }

    if (window.__courseApp) {
      window.__courseApp.navigateTo(screenKey, options);
    }

    this.closeModal();
  }

  showJumpModal() {
    this.closeModal();

    this.modal = document.createElement('div');
    this.modal.className = 'edit-modal-backdrop';
    this.modal.innerHTML = `
      <div class="edit-modal-window edit-modal-jumper" role="dialog" aria-modal="true" aria-labelledby="jumper-modal-title">
        <div class="edit-modal-header">
          <div id="jumper-modal-title" class="edit-modal-title">
            <span>📍</span> Jump Between Sections & Beats
          </div>
          <button class="edit-modal-close" aria-label="Close modal">&times;</button>
        </div>

        <div class="edit-modal-body">
          <div class="jumper-search-box">
            <input type="text" id="jumper-search-input" class="checkpoint-input" placeholder="🔍 Filter sections, beats, or keywords..." autofocus>
          </div>

          <div class="jumper-sections-container" id="jumper-sections-container">
            ${this.renderSectionsList()}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Event listeners
    this.modal.querySelector('.edit-modal-close').addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    const searchInput = this.modal.querySelector('#jumper-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterSections(e.target.value.trim().toLowerCase());
      });
    }

    this.bindJumperButtons(this.modal);
  }

  renderSectionsList(filterQuery = '') {
    return this.sections.map(section => {
      const matchingBeats = section.beats.filter(b => 
        !filterQuery || 
        section.title.toLowerCase().includes(filterQuery) || 
        section.desc.toLowerCase().includes(filterQuery) || 
        b.label.toLowerCase().includes(filterQuery)
      );

      if (filterQuery && matchingBeats.length === 0 && !section.title.toLowerCase().includes(filterQuery)) {
        return '';
      }

      return `
        <div class="jumper-section-card" data-section-id="${section.id}">
          <div class="jumper-section-header">
            <div class="jumper-section-title-group">
              <span class="jumper-section-badge">${section.badge}</span>
              <h3 class="jumper-section-title">${section.title}</h3>
            </div>
            <button class="edit-tool-btn btn-jump-main" data-screen="${section.id}" title="Jump to section start">
              Jump to Section ➔
            </button>
          </div>
          <p class="jumper-section-desc">${section.desc}</p>
          
          <div class="jumper-beats-grid">
            ${(matchingBeats.length > 0 ? matchingBeats : section.beats).map(beat => `
              <button 
                class="jumper-beat-btn" 
                data-screen="${section.id}" 
                data-options='${JSON.stringify(beat.options)}'
                title="Jump directly to ${beat.label}"
              >
                <span>${beat.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  filterSections(query) {
    const container = document.getElementById('jumper-sections-container');
    if (!container) return;
    const html = this.renderSectionsList(query);
    container.innerHTML = html || '<p style="color: #94a3b8; font-size: 13px; text-align: center; padding: 1.5rem;">No matching sections or beats found.</p>';
    this.bindJumperButtons(container);
  }

  bindJumperButtons(parentEl) {
    parentEl.querySelectorAll('.btn-jump-main').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const screenKey = e.currentTarget.getAttribute('data-screen');
        this.jumpTo(screenKey);
      });
    });

    parentEl.querySelectorAll('.jumper-beat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const screenKey = e.currentTarget.getAttribute('data-screen');
        const rawOptions = e.currentTarget.getAttribute('data-options');
        let options = {};
        try {
          options = JSON.parse(rawOptions || '{}');
        } catch {
          options = {};
        }
        this.jumpTo(screenKey, options);
      });
    });
  }

  closeModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}
