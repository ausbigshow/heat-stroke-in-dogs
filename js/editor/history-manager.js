/**
 * History Manager
 * Manages Undo / Redo stack exclusively for visual and layout adjustments.
 */

export class HistoryManager {
  constructor(editorState) {
    this.state = editorState;
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 50;
  }

  pushAction(action) {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // clear redo on new action
    this.state.emit('history_changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return;
    const action = this.undoStack.pop();
    this.redoStack.push(action);

    this.applyActionState(action, 'prev');
    this.state.setDirty(true);
    this.state.emit('history_changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  redo() {
    if (!this.canRedo()) return;
    const action = this.redoStack.pop();
    this.undoStack.push(action);

    this.applyActionState(action, 'next');
    this.state.setDirty(true);
    this.state.emit('history_changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  applyActionState(action, targetState) {
    const el = document.querySelector(`[data-editor-id="${action.elementId}"]`);
    if (!el) return;

    const data = action[targetState];

    if (action.type === 'style') {
      for (const [prop, val] of Object.entries(data)) {
        if (val === undefined || val === '') {
          el.style.removeProperty(prop);
        } else {
          el.style[prop] = val;
        }
        this.state.recordStyleChange(action.elementId, prop, val);
      }
    } else if (action.type === 'text') {
      el.innerText = data;
    } else if (action.type === 'delete') {
      const displayVal = data.display;
      if (displayVal === undefined || displayVal === '') {
        el.style.removeProperty('display');
        this.state.recordStyleChange(action.elementId, 'display', '');
      } else {
        el.style.display = displayVal;
        this.state.recordStyleChange(action.elementId, 'display', displayVal);
      }
      if (displayVal !== 'none') {
        this.state.setSelectedElement(el);
      } else {
        this.state.setSelectedElement(null);
      }
    } else if (action.type === 'lock') {
      if (data) {
        this.state.lockedElements.add(action.elementId);
        el.setAttribute('data-editor-locked', 'true');
      } else {
        this.state.lockedElements.delete(action.elementId);
        el.removeAttribute('data-editor-locked');
      }
    }

    if (action.type !== 'delete' || data.display !== 'none') {
      this.state.setSelectedElement(el);
    }
  }
}
