/**
 * Editor Toolbar
 * Fixed top developer toolbar for Edit Mode operations.
 */

export class EditorToolbar {
  constructor(editorState, selectionManager, historyManager, saveManager, versionManager, notesManager) {
    this.state = editorState;
    this.selection = selectionManager;
    this.history = historyManager;
    this.saveManager = saveManager;
    this.versionManager = versionManager;
    this.notesManager = notesManager;

    this.toolbar = null;
    this.initToolbar();
    this.bindEvents();
  }

  initToolbar() {
    this.toolbar = document.getElementById('edit-mode-toolbar');
    if (!this.toolbar) {
      this.toolbar = document.createElement('div');
      this.toolbar.id = 'edit-mode-toolbar';
      this.toolbar.style.display = 'none';

      this.toolbar.innerHTML = `
        <div class="edit-toolbar-section">
          <div class="edit-toolbar-brand">
            <span>🐾 Heatstroke Module</span>
            <span class="edit-mode-badge">Edit Mode</span>
          </div>
          <!-- Tools -->
          <button class="edit-tool-btn active" data-tool="select_move" title="Select and Move Elements (V)">
            <span>👆 Move</span>
          </button>
          <button class="edit-tool-btn" data-tool="resize" title="Resize Elements (R / Shift to unlock ratio)">
            <span>📐 Resize</span>
          </button>
          <button class="edit-tool-btn" data-tool="edit_buttons" title="Edit Buttons & Interactive Elements (B)">
            <span>🔘 Buttons</span>
          </button>
          <button class="edit-tool-btn" data-tool="edit_containers" title="Edit Containers & Layout Sections (C)">
            <span>📦 Containers</span>
          </button>
          <button class="edit-tool-btn" data-tool="edit_text" title="Edit Text Content In-Place (T)">
            <span>✏️ Text</span>
          </button>
          <button id="btn-add-note" class="edit-tool-btn" title="Add Sticky Note Feedback (N)">
            <span>📝 + Note</span>
          </button>

          <div class="edit-toolbar-separator"></div>

          <!-- Element Controls -->
          <button id="btn-toggle-lock" class="edit-tool-btn" title="Lock / Unlock Selected Element (L or Ctrl+L)">
            <span id="lock-icon">🔓</span> <span id="lock-label">Lock</span>
          </button>
          <button id="btn-bring-forward" class="edit-tool-btn" title="Bring Layer Forward (Ctrl + ])">
            <span>⬆️ Forward</span>
          </button>
          <button id="btn-send-backward" class="edit-tool-btn" title="Send Layer Backward (Ctrl + [)">
            <span>⬇️ Backward</span>
          </button>
          <button id="btn-reset-element" class="edit-tool-btn" title="Reset Custom Position/Size Overrides (Alt + R)">
            <span>🔄 Reset</span>
          </button>
          <button id="btn-delete-element" class="edit-tool-btn btn-delete" disabled title="Delete Selected Element (Delete / Backspace)">
            <span>🗑️ Delete</span>
          </button>

          <div class="edit-toolbar-separator"></div>

          <!-- History -->
          <button id="btn-undo" class="edit-tool-btn" disabled title="Undo (Ctrl+Z / Cmd+Z)">
            <span>↩️ Undo</span>
          </button>
          <button id="btn-redo" class="edit-tool-btn" disabled title="Redo (Ctrl+Y / Cmd+Shift+Z)">
            <span>↪️ Redo</span>
          </button>
        </div>

        <div class="edit-toolbar-section">
          <!-- Save Status Indicator -->
          <div id="save-status-indicator" class="edit-status-indicator saved">
            <span class="edit-status-dot"></span>
            <span id="save-status-text">Saved</span>
          </div>

          <!-- Version Control -->
          <button id="btn-versions" class="edit-tool-btn" title="Version Snapshots & Checkpoints (Ctrl+Shift+V)">
            <span>🛡️ Versions</span>
          </button>

          <!-- Save Button -->
          <button id="btn-save-edits" class="edit-tool-btn btn-save" title="Save Changes Permanently to Source (Ctrl+S / Cmd+S)">
            <span>💾 Save</span>
          </button>

          <!-- Exit Button -->
          <button id="btn-exit-edit" class="edit-tool-btn btn-exit" title="Exit Edit Mode (Escape / Ctrl+Shift+E)">
            <span>✕ Exit</span>
          </button>
        </div>
      `;

      document.body.appendChild(this.toolbar);
    }
  }

  bindEvents() {
    // Tool buttons
    this.toolbar.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = e.currentTarget.getAttribute('data-tool');
        this.state.setTool(tool);
      });
    });

    // Update active tool styling
    this.state.on('tool_changed', (activeTool) => {
      this.toolbar.querySelectorAll('[data-tool]').forEach(btn => {
        if (btn.getAttribute('data-tool') === activeTool) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });

    // Active state changes
    this.state.on('active_changed', (active) => {
      this.toolbar.style.display = active ? 'flex' : 'none';
      if (active) {
        this.updateLockBtn();
        this.updateDeleteBtn();
      }
    });

    // Lock button
    const lockBtn = this.toolbar.querySelector('#btn-toggle-lock');
    lockBtn.addEventListener('click', () => {
      if (this.state.selectedElement) {
        this.state.toggleLock(this.state.selectedElement);
      }
    });

    // Delete button
    const deleteBtn = this.toolbar.querySelector('#btn-delete-element');
    deleteBtn.addEventListener('click', () => {
      if (this.state.selectedElement) {
        this.selection.deleteSelectedElement();
      }
    });

    // Add Sticky Note button
    const addNoteBtn = this.toolbar.querySelector('#btn-add-note');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        if (this.notesManager) {
          this.notesManager.createNote();
        }
      });
    }

    this.state.on('selection_changed', () => {
      this.updateLockBtn();
      this.updateDeleteBtn();
    });
    this.state.on('lock_changed', () => {
      this.updateLockBtn();
      this.updateDeleteBtn();
    });

    // Bring forward
    this.toolbar.querySelector('#btn-bring-forward').addEventListener('click', () => {
      if (this.state.selectedElement) {
        this.selection.bringForward(this.state.selectedElement);
      }
    });

    // Send backward
    this.toolbar.querySelector('#btn-send-backward').addEventListener('click', () => {
      if (this.state.selectedElement) {
        this.selection.sendBackward(this.state.selectedElement);
      }
    });

    // Reset element
    this.toolbar.querySelector('#btn-reset-element').addEventListener('click', () => {
      if (this.state.selectedElement) {
        this.selection.resetElement(this.state.selectedElement);
      }
    });

    // Undo button
    const undoBtn = this.toolbar.querySelector('#btn-undo');
    undoBtn.addEventListener('click', () => this.history.undo());

    // Redo button
    const redoBtn = this.toolbar.querySelector('#btn-redo');
    redoBtn.addEventListener('click', () => this.history.redo());

    // History state updates
    this.history.on('history_changed', ({ canUndo, canRedo }) => {
      undoBtn.disabled = !canUndo;
      redoBtn.disabled = !canRedo;
    });

    // Version Manager Modal
    this.toolbar.querySelector('#btn-versions').addEventListener('click', () => {
      this.versionManager.showVersionModal();
    });

    // Save button
    this.toolbar.querySelector('#btn-save-edits').addEventListener('click', () => {
      this.saveManager.saveChanges();
    });

    // Exit button
    this.toolbar.querySelector('#btn-exit-edit').addEventListener('click', () => {
      if (this.state.isDirty) {
        if (!confirm('You have unsaved changes. Exit Edit Mode without saving?')) {
          return;
        }
      }
      this.state.setActive(false);
    });

    // Dirty state updates
    this.state.on('dirty_changed', (isDirty) => {
      const indicator = this.toolbar.querySelector('#save-status-indicator');
      const text = this.toolbar.querySelector('#save-status-text');
      if (isDirty) {
        indicator.className = 'edit-status-indicator unsaved';
        text.textContent = 'Unsaved Changes';
      } else {
        indicator.className = 'edit-status-indicator saved';
        text.textContent = 'Saved';
      }
    });

    // Global keyboard shortcuts (Conventional Standards)
    window.addEventListener('keydown', (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;

      // 1. Toggle Edit Mode: Ctrl/Cmd + Shift + E
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        this.state.setActive(!this.state.isActive);
        return;
      }

      if (!this.state.isActive) return;

      // 2. Save Changes: Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        this.saveManager.saveChanges();
        return;
      }

      // If user is currently typing in a text field, avoid intercepting text typing keys
      if (isInput) return;

      // 3. Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        this.history.undo();
        return;
      }

      // 4. Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
        e.preventDefault();
        this.history.redo();
        return;
      }

      // 5. Delete Selected Element: Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.state.selectedElement) {
        e.preventDefault();
        this.selection.deleteSelectedElement();
        return;
      }

      // 6. Tool Shortcuts: V (Move), R (Resize), B (Buttons), C (Containers), T (Text), N (Note)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'v') {
          e.preventDefault();
          this.state.setTool('select_move');
          return;
        } else if (key === 'r') {
          e.preventDefault();
          this.state.setTool('resize');
          return;
        } else if (key === 'b') {
          e.preventDefault();
          this.state.setTool('edit_buttons');
          return;
        } else if (key === 'c') {
          e.preventDefault();
          this.state.setTool('edit_containers');
          return;
        } else if (key === 't') {
          e.preventDefault();
          this.state.setTool('edit_text');
          return;
        } else if (key === 'n') {
          e.preventDefault();
          if (this.notesManager) {
            this.notesManager.createNote();
          }
          return;
        } else if (key === 'l' && this.state.selectedElement) {
          e.preventDefault();
          this.state.toggleLock(this.state.selectedElement);
          return;
        }
      }

      // 7. Lock / Unlock: Ctrl/Cmd + L
      if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        if (this.state.selectedElement) {
          this.state.toggleLock(this.state.selectedElement);
        }
        return;
      }

      // 8. Bring Layer Forward: Ctrl/Cmd + ]
      if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        if (this.state.selectedElement) {
          this.selection.bringForward(this.state.selectedElement);
        }
        return;
      }

      // 9. Send Layer Backward: Ctrl/Cmd + [
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        if (this.state.selectedElement) {
          this.selection.sendBackward(this.state.selectedElement);
        }
        return;
      }

      // 10. Reset Element: Alt + R
      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        if (this.state.selectedElement) {
          this.selection.resetElement(this.state.selectedElement);
        }
        return;
      }

      // 11. Version Snapshots Modal: Ctrl/Cmd + Shift + V
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        this.versionManager.showVersionModal();
        return;
      }

      // 12. Escape: Deselect element, cancel note linking, or close modal
      if (e.key === 'Escape') {
        if (this.notesManager && this.notesManager.activeLinkingNoteId) {
          this.notesManager.cancelLinkingMode();
          return;
        }
        const modal = document.querySelector('.edit-modal-backdrop');
        if (modal) {
          modal.remove();
          return;
        }
        if (this.state.selectedElement) {
          this.state.select(null);
          return;
        }
      }
    });

    // Prevent accidental unload if dirty
    window.addEventListener('beforeunload', (e) => {
      if (this.state.isActive && this.state.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in Edit Mode.';
      }
    });

    // Auto-activate if ?edit=true or #edit is present
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === 'true' || params.get('edit') === '1' || window.location.hash === '#edit') {
      this.state.setActive(true);
    }
  }

  updateLockBtn() {
    const el = this.state.selectedElement;
    const isLocked = el ? this.state.isElementLocked(el) : false;
    const lockIcon = this.toolbar.querySelector('#lock-icon');
    const lockLabel = this.toolbar.querySelector('#lock-label');
    const lockBtn = this.toolbar.querySelector('#btn-toggle-lock');

    if (!el) {
      lockBtn.disabled = true;
      lockIcon.textContent = '🔓';
      lockLabel.textContent = 'Lock';
    } else {
      lockBtn.disabled = false;
      lockIcon.textContent = isLocked ? '🔒' : '🔓';
      lockLabel.textContent = isLocked ? 'Unlock' : 'Lock';
    }
  }

  updateDeleteBtn() {
    const el = this.state.selectedElement;
    const isLocked = el ? this.state.isElementLocked(el) : false;
    const deleteBtn = this.toolbar.querySelector('#btn-delete-element');
    if (!deleteBtn) return;
    deleteBtn.disabled = !el || isLocked;
  }
}
