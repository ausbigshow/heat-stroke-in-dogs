/**
 * Text Editor
 * Allows live in-place editing of text elements when Edit Text tool is active.
 */

export class TextEditor {
  constructor(editorState, selectionManager, historyManager) {
    this.state = editorState;
    this.selection = selectionManager;
    this.history = historyManager;

    this.activeTextElement = null;
    this.initialText = '';

    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener('dblclick', (e) => {
      if (!this.state.isActive) return;
      this.tryEditText(e.target);
    });

    this.state.on('tool_changed', (tool) => {
      if (tool === 'edit_text' && this.state.selectedElement) {
        this.tryEditText(this.state.selectedElement);
      } else {
        this.finishEditing();
      }
    });
  }

  tryEditText(element) {
    if (!element) return;
    const editableTarget = element.closest('[data-editor-id]');
    if (!editableTarget || this.state.isElementLocked(editableTarget)) return;

    // Check if contains text node
    this.activeTextElement = editableTarget;
    this.initialText = editableTarget.innerText;

    editableTarget.contentEditable = 'true';
    editableTarget.focus();

    const onBlur = () => {
      editableTarget.contentEditable = 'false';
      editableTarget.removeEventListener('blur', onBlur);

      const newText = editableTarget.innerText;
      if (newText !== this.initialText) {
        const id = editableTarget.getAttribute('data-editor-id');
        this.state.setDirty(true);
        this.history.pushAction({
          type: 'text',
          elementId: id,
          prev: this.initialText,
          next: newText
        });
      }
      this.selection.refresh();
      this.activeTextElement = null;
    };

    editableTarget.addEventListener('blur', onBlur);
  }

  finishEditing() {
    if (this.activeTextElement) {
      this.activeTextElement.contentEditable = 'false';
      this.activeTextElement = null;
    }
  }
}
