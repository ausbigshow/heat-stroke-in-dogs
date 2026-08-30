/**
 * Selection Manager
 * Handles visual element selection, bounding box rendering, dimension badges, and layer controls.
 */

export class SelectionManager {
  constructor(editorState, historyManager) {
    this.state = editorState;
    this.history = historyManager;
    this.box = null;
    this.label = null;
    this.stemHandle = null;

    this.initOverlay();
    this.bindEvents();

    this.state.on('selection_changed', (el) => this.updateSelectionBox(el));
    this.state.on('active_changed', (active) => {
      if (!active) this.hideSelectionBox();
    });
  }

  initOverlay() {
    this.box = document.getElementById('edit-selection-box');
    if (!this.box) {
      this.box = document.createElement('div');
      this.box.id = 'edit-selection-box';
      
      this.label = document.createElement('div');
      this.label.className = 'edit-selection-label';
      this.box.appendChild(this.label);

      // Dedicated Stem Drag Handle
      this.stemHandle = document.createElement('div');
      this.stemHandle.className = 'edit-stem-handle';
      this.stemHandle.title = 'Drag to reposition Speech Bubble Stem';
      this.stemHandle.innerHTML = '📍';
      this.box.appendChild(this.stemHandle);

      document.body.appendChild(this.box);
    } else {
      this.stemHandle = this.box.querySelector('.edit-stem-handle');
      if (!this.stemHandle) {
        this.stemHandle = document.createElement('div');
        this.stemHandle.className = 'edit-stem-handle';
        this.stemHandle.title = 'Drag to reposition Speech Bubble Stem';
        this.stemHandle.innerHTML = '📍';
        this.box.appendChild(this.stemHandle);
      }
    }
  }

  bindEvents() {
    // Intercept clicks on editable elements
    document.addEventListener('click', (e) => {
      if (!this.state.isActive) return;

      // Ignore clicks inside editor UI
      if (e.target.closest('#edit-mode-toolbar') || e.target.closest('.edit-modal-backdrop')) {
        return;
      }

      const editableTarget = e.target.closest('[data-editor-id]');
      if (editableTarget) {
        e.preventDefault();
        e.stopPropagation();

        // Check if tool filters apply
        if (this.isTargetValidForTool(editableTarget)) {
          this.state.setSelectedElement(editableTarget);
        }
      } else if (!e.target.closest('#edit-selection-box')) {
        this.state.setSelectedElement(null);
      }
    }, true);

    // Stem Handle Drag Interaction
    if (this.stemHandle) {
      this.stemHandle.addEventListener('mousedown', (e) => {
        const bubble = this.state.selectedElement;
        if (!bubble || this.state.isElementLocked(bubble)) return;

        e.preventDefault();
        e.stopPropagation();

        const initialStemLeft = bubble.style.getPropertyValue('--stem-left');
        const initialStemRight = bubble.style.getPropertyValue('--stem-right');

        const onMouseMove = (ev) => {
          const rect = bubble.getBoundingClientRect();
          const rawX = ev.clientX - rect.left;
          const clampedX = Math.max(16, Math.min(rect.width - 16, rawX));

          if (bubble.classList.contains('callie-bubble')) {
            const fromRight = Math.round(rect.width - clampedX);
            bubble.style.setProperty('--stem-right', `${fromRight}px`);
            bubble.style.removeProperty('--stem-left');
            this.state.recordStyleChange(bubble.getAttribute('data-editor-id'), '--stem-right', `${fromRight}px`);
          } else {
            const fromLeft = Math.round(clampedX);
            bubble.style.setProperty('--stem-left', `${fromLeft}px`);
            bubble.style.removeProperty('--stem-right');
            this.state.recordStyleChange(bubble.getAttribute('data-editor-id'), '--stem-left', `${fromLeft}px`);
          }
          this.refresh();
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          const id = bubble.getAttribute('data-editor-id');
          if (id) {
            this.state.setDirty(true);
            this.history.pushAction({
              type: 'style',
              elementId: id,
              prev: { '--stem-left': initialStemLeft, '--stem-right': initialStemRight },
              next: { 
                '--stem-left': bubble.style.getPropertyValue('--stem-left'),
                '--stem-right': bubble.style.getPropertyValue('--stem-right')
              }
            });
          }
          this.refresh();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    }

    // Reposition bounding box on window resize / scroll
    window.addEventListener('resize', () => this.refresh());
    window.addEventListener('scroll', () => this.refresh(), true);
  }

  isTargetValidForTool(el) {
    const tool = this.state.activeTool;
    if (tool === 'edit_buttons') {
      return el.tagName === 'BUTTON' || el.tagName === 'A' || el.classList.contains('continue-btn') || el.hasAttribute('role');
    }
    if (tool === 'edit_containers') {
      return el.classList.contains('characters-container') || el.classList.contains('opening-body') || el.tagName === 'SECTION' || el.tagName === 'DIV';
    }
    if (tool === 'edit_text') {
      return /^H[1-6]$/.test(el.tagName) || el.tagName === 'P' || el.tagName === 'SPAN' || el.hasAttribute('data-text-editable');
    }
    return true;
  }

  updateSelectionBox(el) {
    if (!el || !this.state.isActive) {
      this.hideSelectionBox();
      return;
    }

    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    this.box.style.display = 'block';
    this.box.style.left = `${rect.left + scrollX}px`;
    this.box.style.top = `${rect.top + scrollY}px`;
    this.box.style.width = `${rect.width}px`;
    this.box.style.height = `${rect.height}px`;

    const id = el.getAttribute('data-editor-id') || el.id || el.tagName.toLowerCase();
    const isLocked = this.state.isElementLocked(el);

    const x = Math.round(rect.left);
    const y = Math.round(rect.top);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    const isBubble = el.classList.contains('speech-bubble') || el.closest('.speech-bubble');
    const bubble = isBubble ? (el.classList.contains('speech-bubble') ? el : el.closest('.speech-bubble')) : null;

    let stemControls = '';
    if (bubble && !isLocked) {
      stemControls = `
        <span class="edit-selection-stem-controls">
          <span style="color:#F59E0B;font-weight:700;">📍 Stem:</span>
          <button class="stem-btn" data-stem-pos="left" title="Move stem to left">◀</button>
          <button class="stem-btn" data-stem-pos="center" title="Center stem">⯀</button>
          <button class="stem-btn" data-stem-pos="right" title="Move stem to right">▶</button>
        </span>
      `;
    }

    this.label.innerHTML = `
      <span class="badge-id">#${id}</span>
      <span class="badge-dims">${w}×${h}</span>
      ${stemControls}
      ${isLocked ? '<span class="badge-locked">🔒 LOCKED</span>' : ''}
    `;

    // Bind preset buttons if present
    if (bubble && !isLocked) {
      this.label.querySelectorAll('[data-stem-pos]').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const pos = btn.getAttribute('data-stem-pos');
          this.applyStemPreset(bubble, pos);
        });
      });

      // Update Stem Handle position
      if (this.stemHandle) {
        this.stemHandle.style.display = 'flex';
        const computed = window.getComputedStyle(bubble);
        const stemLeft = bubble.style.getPropertyValue('--stem-left') || computed.getPropertyValue('--stem-left');
        const stemRight = bubble.style.getPropertyValue('--stem-right') || computed.getPropertyValue('--stem-right');

        let handleX = 24;
        if (stemLeft && stemLeft.trim() !== '' && stemLeft !== 'auto') {
          handleX = parseFloat(stemLeft);
        } else if (stemRight && stemRight.trim() !== '' && stemRight !== 'auto') {
          handleX = rect.width - parseFloat(stemRight);
        } else if (bubble.classList.contains('callie-bubble')) {
          handleX = rect.width - 28;
        } else {
          handleX = 24;
        }

        this.stemHandle.style.bottom = '-24px';
        this.stemHandle.style.left = `${Math.round(handleX - 9)}px`;
      }
    } else if (this.stemHandle) {
      this.stemHandle.style.display = 'none';
    }

    // Render distinct visible handles on the bounding box whenever selected (unless element is locked)
    const handles = this.box.querySelectorAll('.edit-resize-handle');
    const showHandles = !isLocked;
    handles.forEach(h => {
      h.style.display = showHandles ? 'block' : 'none';
    });
  }

  applyStemPreset(bubble, pos) {
    const id = bubble.getAttribute('data-editor-id');
    const prevLeft = bubble.style.getPropertyValue('--stem-left');
    const prevRight = bubble.style.getPropertyValue('--stem-right');

    if (pos === 'left') {
      bubble.style.setProperty('--stem-left', '24px');
      bubble.style.removeProperty('--stem-right');
      if (id) this.state.recordStyleChange(id, '--stem-left', '24px');
    } else if (pos === 'center') {
      bubble.style.setProperty('--stem-left', 'calc(50% - 10px)');
      bubble.style.removeProperty('--stem-right');
      if (id) this.state.recordStyleChange(id, '--stem-left', 'calc(50% - 10px)');
    } else if (pos === 'right') {
      bubble.style.setProperty('--stem-right', '28px');
      bubble.style.removeProperty('--stem-left');
      if (id) this.state.recordStyleChange(id, '--stem-right', '28px');
    }

    if (id) {
      this.state.setDirty(true);
      this.history.pushAction({
        type: 'style',
        elementId: id,
        prev: { '--stem-left': prevLeft, '--stem-right': prevRight },
        next: {
          '--stem-left': bubble.style.getPropertyValue('--stem-left'),
          '--stem-right': bubble.style.getPropertyValue('--stem-right')
        }
      });
    }

    this.refresh();
  }

  hideSelectionBox() {
    if (this.box) {
      this.box.style.display = 'none';
    }
  }

  refresh() {
    if (this.state.selectedElement) {
      this.updateSelectionBox(this.state.selectedElement);
    }
    this.state.emit('element_moved');
  }

  // Deleting / Removing Element
  deleteSelectedElement() {
    const el = this.state.selectedElement;
    if (!el) return;

    if (this.state.isElementLocked(el)) {
      alert('Cannot delete a locked element. Unlock it first.');
      return;
    }

    const id = el.getAttribute('data-editor-id');
    if (!id) return;

    const prevDisplay = el.style.display;
    el.style.display = 'none';

    this.state.recordStyleChange(id, 'display', 'none');
    this.history.pushAction({
      type: 'delete',
      elementId: id,
      prev: { display: prevDisplay },
      next: { display: 'none' }
    });

    this.state.setSelectedElement(null);
    this.hideSelectionBox();
  }

  // Layer Management (Bring Forward / Send Backward)
  bringForward() {
    const el = this.state.selectedElement;
    if (!el || this.state.isElementLocked(el)) return;
    const currentZ = parseInt(window.getComputedStyle(el).zIndex, 10) || 0;
    const newZ = currentZ + 1;
    this.setZIndex(el, newZ);
  }

  sendBackward() {
    const el = this.state.selectedElement;
    if (!el || this.state.isElementLocked(el)) return;
    const currentZ = parseInt(window.getComputedStyle(el).zIndex, 10) || 0;
    const newZ = Math.max(0, currentZ - 1);
    this.setZIndex(el, newZ);
  }

  setZIndex(el, zIndex) {
    const id = el.getAttribute('data-editor-id');
    const oldZ = el.style.zIndex;
    el.style.zIndex = zIndex;
    if (id) {
      this.state.recordStyleChange(id, 'z-index', zIndex);
      this.history.pushAction({
        type: 'style',
        elementId: id,
        prev: { 'z-index': oldZ },
        next: { 'z-index': zIndex }
      });
    }
    this.refresh();
  }
}
