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

      document.body.appendChild(this.box);
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

    this.label.innerHTML = `
      <span class="badge-id">#${id}</span>
      <span class="badge-dims">${w}×${h} (${x}, ${y})</span>
      ${isLocked ? '<span class="badge-locked">🔒 LOCKED</span>' : ''}
    `;

    // Render distinct visible handles on the bounding box whenever selected (unless element is locked)
    const handles = this.box.querySelectorAll('.edit-resize-handle');
    const showHandles = !isLocked;
    handles.forEach(h => {
      h.style.display = showHandles ? 'block' : 'none';
    });
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
