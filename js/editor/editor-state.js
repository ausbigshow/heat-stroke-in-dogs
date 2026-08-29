/**
 * Edit Mode State Manager
 */

export class EditorState {
  constructor() {
    this.isActive = false;
    this.activeTool = 'select_move'; // 'select_move' | 'resize' | 'edit_buttons' | 'edit_containers' | 'edit_text'
    this.selectedElement = null;
    this.lockedElements = new Set();
    this.isDirty = false;
    this.modifiedStyles = new Map(); // editorId -> { prop: value }
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const cbs = this.listeners.get(event) || [];
    cbs.forEach(cb => cb(data));
  }

  setActive(active) {
    if (this.isActive === active) return;
    this.isActive = active;
    if (active) {
      document.body.classList.add('edit-mode-active');
    } else {
      document.body.classList.remove('edit-mode-active');
      this.setSelectedElement(null);
    }
    this.emit('active_changed', this.isActive);
  }

  setTool(tool) {
    if (this.activeTool === tool) return;
    this.activeTool = tool;
    this.emit('tool_changed', this.activeTool);
  }

  setSelectedElement(el) {
    this.selectedElement = el;
    this.emit('selection_changed', this.selectedElement);
  }

  toggleLock(el) {
    const target = el || this.selectedElement;
    if (!target) return;
    const id = target.getAttribute('data-editor-id');
    if (!id) return;

    if (this.lockedElements.has(id)) {
      this.lockedElements.delete(id);
      target.removeAttribute('data-editor-locked');
    } else {
      this.lockedElements.add(id);
      target.setAttribute('data-editor-locked', 'true');
    }
    this.emit('lock_changed', { id, isLocked: this.lockedElements.has(id) });
  }

  isElementLocked(el) {
    if (!el) return false;
    const id = el.getAttribute('data-editor-id');
    return id ? this.lockedElements.has(id) : false;
  }

  setDirty(dirty) {
    this.isDirty = dirty;
    this.emit('dirty_changed', this.isDirty);
  }

  recordStyleChange(editorId, property, value) {
    if (!this.modifiedStyles.has(editorId)) {
      this.modifiedStyles.set(editorId, {});
    }
    this.modifiedStyles.get(editorId)[property] = value;
    this.setDirty(true);
  }
}
