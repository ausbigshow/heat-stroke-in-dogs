/**
 * Drag Manager
 * Supports mouse drag, trackpad, arrow-key nudging (1px), and Shift+arrow nudging (10px).
 */

export class DragManager {
  constructor(editorState, selectionManager, historyManager) {
    this.state = editorState;
    this.selection = selectionManager;
    this.history = historyManager;

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.initialLeft = 0;
    this.initialTop = 0;
    this.initialTransform = '';
    this.draggedElement = null;

    this.bindEvents();
  }

  bindEvents() {
    // Mouse down on selected element or selection box
    document.addEventListener('mousedown', (e) => this.onMouseDown(e), true);
    document.addEventListener('mousemove', (e) => this.onMouseMove(e), true);
    document.addEventListener('mouseup', (e) => this.onMouseUp(e), true);

    // Keyboard arrow nudging
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  canDrag() {
    if (!this.state.isActive) return false;
    const tool = this.state.activeTool;
    return tool === 'select_move' || tool === 'edit_buttons' || tool === 'edit_containers';
  }

  onMouseDown(e) {
    if (!this.canDrag()) return;
    if (e.target.closest('#edit-mode-toolbar') || e.target.closest('.edit-modal-backdrop') || e.target.closest('.edit-resize-handle')) {
      return;
    }

    const target = e.target.closest('[data-editor-id]');
    if (!target) return;

    if (this.state.isElementLocked(target)) return;

    // Check if target matches tool
    if (!this.selection.isTargetValidForTool(target)) return;

    this.isDragging = true;
    this.draggedElement = target;
    this.state.setSelectedElement(target);

    this.startX = e.clientX;
    this.startY = e.clientY;

    const computed = window.getComputedStyle(target);
    const parentRect = target.offsetParent ? target.offsetParent.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const targetRect = target.getBoundingClientRect();

    this.initialLeft = targetRect.left - parentRect.left;
    this.initialTop = targetRect.top - parentRect.top;
    this.initialStyles = {
      position: computed.position,
      left: target.style.left || computed.left,
      top: target.style.top || computed.top,
      right: target.style.right || computed.right,
      bottom: target.style.bottom || computed.bottom
    };

    e.preventDefault();
  }

  onMouseMove(e) {
    if (!this.isDragging || !this.draggedElement) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    const target = this.draggedElement;
    
    // Maintain positioned layout model
    const currentPosition = window.getComputedStyle(target).position;
    if (currentPosition === 'static') {
      target.style.position = 'relative';
    }

    const newLeft = Math.round(this.initialLeft + dx);
    const newTop = Math.round(this.initialTop + dy);

    // Apply pixel coordinates during drag
    target.style.left = `${newLeft}px`;
    target.style.top = `${newTop}px`;
    target.style.right = 'auto';
    target.style.bottom = 'auto';

    this.selection.refresh();
  }

  onMouseUp(e) {
    if (!this.isDragging || !this.draggedElement) return;

    const target = this.draggedElement;
    const id = target.getAttribute('data-editor-id');

    if (id) {
      // Persist the position the element ACTUALLY uses. `target.style.position` is only
      // set when we promoted a static element above, so falling back to 'relative' would
      // silently rewrite absolute/fixed elements into normal flow — which re-lays them out
      // (and, inside an overflow:hidden stage, can clip them out of the scene entirely).
      const effectivePosition = target.style.position || window.getComputedStyle(target).position;

      this.state.recordStyleChange(id, 'position', effectivePosition);
      this.state.recordStyleChange(id, 'left', target.style.left);
      this.state.recordStyleChange(id, 'top', target.style.top);
      this.state.recordStyleChange(id, 'right', 'auto');
      this.state.recordStyleChange(id, 'bottom', 'auto');

      this.history.pushAction({
        type: 'style',
        elementId: id,
        prev: this.initialStyles,
        next: {
          position: effectivePosition,
          left: target.style.left,
          top: target.style.top,
          right: 'auto',
          bottom: 'auto'
        }
      });
    }

    this.isDragging = false;
    this.draggedElement = null;
    this.selection.refresh();
  }

  onKeyDown(e) {
    if (!this.state.isActive || !this.state.selectedElement) return;
    if (this.state.isElementLocked(this.state.selectedElement)) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) === -1) return;
    
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    e.preventDefault();

    const target = this.state.selectedElement;
    const id = target.getAttribute('data-editor-id');
    const step = e.shiftKey ? 10 : 1;

    const targetRect = target.getBoundingClientRect();
    const parentRect = target.offsetParent ? target.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
    
    const computed = window.getComputedStyle(target);
    // Same rule as drag: only promote a static element; never demote a positioned one.
    if (computed.position === 'static') {
      target.style.position = 'relative';
    }
    const effectivePosition = target.style.position || computed.position;

    const currentLeft = targetRect.left - parentRect.left;
    const currentTop = targetRect.top - parentRect.top;

    let nextLeft = currentLeft;
    let nextTop = currentTop;

    if (e.key === 'ArrowLeft') nextLeft -= step;
    if (e.key === 'ArrowRight') nextLeft += step;
    if (e.key === 'ArrowUp') nextTop -= step;
    if (e.key === 'ArrowDown') nextTop += step;

    const prevStyles = {
      position: target.style.position || computed.position,
      left: target.style.left || computed.left,
      top: target.style.top || computed.top,
      right: target.style.right || computed.right,
      bottom: target.style.bottom || computed.bottom
    };

    target.style.left = `${Math.round(nextLeft)}px`;
    target.style.top = `${Math.round(nextTop)}px`;
    target.style.right = 'auto';
    target.style.bottom = 'auto';

    if (id) {
      this.state.recordStyleChange(id, 'position', effectivePosition);
      this.state.recordStyleChange(id, 'left', target.style.left);
      this.state.recordStyleChange(id, 'top', target.style.top);
      this.state.recordStyleChange(id, 'right', 'auto');
      this.state.recordStyleChange(id, 'bottom', 'auto');

      this.history.pushAction({
        type: 'style',
        elementId: id,
        prev: prevStyles,
        next: {
          position: effectivePosition,
          left: target.style.left,
          top: target.style.top,
          right: 'auto',
          bottom: 'auto'
        }
      });
    }

    this.selection.refresh();
  }
}
