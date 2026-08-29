/**
 * Save Manager
 * Handles surgical persistence of visual changes to disk & triggers Git version checkpoints.
 */

export class SaveManager {
  constructor(editorState, selectionManager) {
    this.state = editorState;
    this.selection = selectionManager;
  }

  async saveChanges() {
    const rulesMap = {};

    // Collect all elements with data-editor-id that have inline styles
    const allEditable = document.querySelectorAll('[data-editor-id]');
    allEditable.forEach(el => {
      const id = el.getAttribute('data-editor-id');
      const inline = el.style;
      const decls = {};

      const properties = ['position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'z-index', 'transform'];
      properties.forEach(p => {
        const val = inline.getPropertyValue(p);
        if (val) {
          decls[p] = val;
        }
      });

      if (Object.keys(decls).length > 0) {
        rulesMap[`[data-editor-id="${id}"]`] = decls;
      }
    });

    const targetDesc = this.state.selectedElement 
      ? `element #${this.state.selectedElement.getAttribute('data-editor-id')}` 
      : 'course visual layout';

    try {
      const response = await fetch('/api/save-visual-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: targetDesc,
          rulesMap
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        this.state.setDirty(false);
        this.showToast('Saved to source & committed to Git', 'success');
        return true;
      } else {
        throw new Error(result.message || 'Unknown save error');
      }
    } catch (err) {
      console.error('Save failed:', err);
      this.showToast('Save failed — source file was not modified', 'error');
      return false;
    }
  }

  resetSelectedElement() {
    const el = this.state.selectedElement;
    if (!el) return;

    const id = el.getAttribute('data-editor-id');
    const properties = ['position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'z-index', 'transform'];
    properties.forEach(p => el.style.removeProperty(p));

    if (id && this.state.modifiedStyles.has(id)) {
      this.state.modifiedStyles.delete(id);
      this.state.setDirty(true);
    }

    this.selection.refresh();
    this.showToast(`Reset overrides for #${id}`, 'success');
  }

  showToast(message, type = 'success') {
    let toast = document.getElementById('edit-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'edit-toast';
      toast.className = 'edit-toast';
      document.body.appendChild(toast);
    }

    toast.className = `edit-toast ${type} visible`;
    toast.textContent = message;

    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3500);
  }
}
