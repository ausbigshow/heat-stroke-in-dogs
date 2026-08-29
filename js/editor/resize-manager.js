/**
 * Resize Manager
 * Implements 8-handle resizing on selected elements with aspect ratio preservation and Shift override.
 */

export class ResizeManager {
  constructor(editorState, selectionManager, historyManager) {
    this.state = editorState;
    this.selection = selectionManager;
    this.history = historyManager;

    this.isResizing = false;
    this.activeHandle = null;
    this.startX = 0;
    this.startY = 0;
    this.initialWidth = 0;
    this.initialHeight = 0;
    this.initialLeft = 0;
    this.initialTop = 0;
    this.aspectRatio = 1;

    this.initHandles();
    this.bindEvents();

    this.state.on('tool_changed', () => this.selection.refresh());
  }

  initHandles() {
    const box = this.selection.box;
    if (!box) return;

    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    handles.forEach(h => {
      const handleEl = document.createElement('div');
      handleEl.className = `edit-resize-handle handle-${h}`;
      handleEl.setAttribute('data-handle', h);
      box.appendChild(handleEl);
    });
  }

  bindEvents() {
    document.addEventListener('mousedown', (e) => {
      if (!this.state.isActive || this.state.activeTool !== 'resize') return;
      
      const handle = e.target.closest('.edit-resize-handle');
      if (!handle) return;

      const target = this.state.selectedElement;
      if (!target || this.state.isElementLocked(target)) return;

      e.preventDefault();
      e.stopPropagation();

      this.isResizing = true;
      this.activeHandle = handle.getAttribute('data-handle');
      this.startX = e.clientX;
      this.startY = e.clientY;

      const rect = target.getBoundingClientRect();
      const parentRect = target.offsetParent ? target.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };

      this.initialWidth = rect.width;
      this.initialHeight = rect.height;
      this.initialLeft = rect.left - parentRect.left;
      this.initialTop = rect.top - parentRect.top;
      this.aspectRatio = this.initialWidth / this.initialHeight;

      this.initialStyles = {
        width: target.style.width || `${rect.width}px`,
        height: target.style.height || `${rect.height}px`,
        left: target.style.left,
        top: target.style.top
      };
    }, true);

    document.addEventListener('mousemove', (e) => {
      if (!this.isResizing || !this.state.selectedElement) return;

      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      const target = this.state.selectedElement;
      const isMedia = target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.querySelector('img, video');
      
      // Preserve aspect ratio by default for media; holding Shift allows free-form resizing
      const preserveAspect = isMedia ? !e.shiftKey : e.shiftKey;

      let newW = this.initialWidth;
      let newH = this.initialHeight;
      let newLeft = this.initialLeft;
      let newTop = this.initialTop;

      const h = this.activeHandle;

      if (h.includes('e')) newW = Math.max(30, this.initialWidth + dx);
      if (h.includes('s')) newH = Math.max(30, this.initialHeight + dy);
      if (h.includes('w')) {
        const potentialW = Math.max(30, this.initialWidth - dx);
        newLeft = this.initialLeft + (this.initialWidth - potentialW);
        newW = potentialW;
      }
      if (h.includes('n')) {
        const potentialH = Math.max(30, this.initialHeight - dy);
        newTop = this.initialTop + (this.initialHeight - potentialH);
        newH = potentialH;
      }

      if (preserveAspect) {
        if (h === 'e' || h === 'w') {
          newH = newW / this.aspectRatio;
        } else if (h === 'n' || h === 's') {
          newW = newH * this.aspectRatio;
        } else {
          newH = newW / this.aspectRatio;
        }
      }

      target.style.width = `${Math.round(newW)}px`;
      target.style.height = `${Math.round(newH)}px`;
      if (h.includes('w') || h.includes('n')) {
        target.style.left = `${Math.round(newLeft)}px`;
        target.style.top = `${Math.round(newTop)}px`;
      }

      this.selection.refresh();
    }, true);

    document.addEventListener('mouseup', () => {
      if (!this.isResizing || !this.state.selectedElement) return;

      const target = this.state.selectedElement;
      const id = target.getAttribute('data-editor-id');

      if (id) {
        this.state.recordStyleChange(id, 'width', target.style.width);
        this.state.recordStyleChange(id, 'height', target.style.height);
        if (target.style.left) this.state.recordStyleChange(id, 'left', target.style.left);
        if (target.style.top) this.state.recordStyleChange(id, 'top', target.style.top);

        this.history.pushAction({
          type: 'style',
          elementId: id,
          prev: this.initialStyles,
          next: {
            width: target.style.width,
            height: target.style.height,
            left: target.style.left,
            top: target.style.top
          }
        });
      }

      this.isResizing = false;
      this.activeHandle = null;
      this.selection.refresh();
    }, true);
  }
}
