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

    // Surgical save: only persist properties the editor itself recorded as an actual
    // visual edit (drag/resize/lock/z-index/stem/delete), via state.modifiedStyles.
    // Do NOT scan every [data-editor-id] element's live inline style — screens set
    // their own transient inline styles for unrelated runtime state (e.g. Act 1's CSS
    // custom properties driving the palette/shade-drift animation), and sweeping those
    // up here would freeze them as permanent overrides on every unrelated Save.
    this.state.modifiedStyles.forEach((decls, id) => {
      if (decls && Object.keys(decls).length > 0) {
        rulesMap[`[data-editor-id="${id}"]`] = { ...decls };
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
    for (let i = el.style.length - 1; i >= 0; i--) {
      el.style.removeProperty(el.style[i]);
    }

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
