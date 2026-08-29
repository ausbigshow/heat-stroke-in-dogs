/**
 * Editor Toolbar
 * Fixed top developer toolbar for Edit Mode operations.
 */

export class EditorToolbar {
  constructor(editorState, selectionManager, historyManager, saveManager, versionManager) {
    this.state = editorState;
    this.selection = selectionManager;
    this.history = historyManager;
    this.saveManager = saveManager;
    this.versionManager = versionManager;

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
          <button class="edit-tool-btn active" data-tool="select_move" title="Select and Move Elements (Drag or Arrow Keys)">
            <span>👆 Move</span>
          </button>
          <button class="edit-tool-btn" data-tool="resize" title="Resize Elements (Handles / Shift to Unlock Ratio)">
            <span>📐 Resize</span>
          </button>
          <button class="edit-tool-btn" data-tool="edit_buttons" title="Edit Buttons & Interactive Elements">
            <span>🔘 Buttons</span>
          </button>
          <button class="edit-tool-btn" data-tool="edit_containers" title="Edit Containers & Layout Sections">
            <span>📦 Containers</span>
          </button>
          <button class="edit-tool-btn" data-tool="edit_text" title="Edit Text Content In-Place">
            <span>✏️ Text</span>
          </button>

          <div class="edit-toolbar-separator"></div>

          <!-- Element Controls -->
          <button id="btn-toggle-lock" class="edit-tool-btn" title="Lock or Unlock Selected Element">
            <span id="lock-icon">🔓</span> <span id="lock-label">Lock</span>
          </button>
          <button id="btn-bring-forward" class="edit-tool-btn" title="Bring Layer Forward">
            <span>⬆️ Forward</span>
          </button>
          <button id="btn-send-backward" class="edit-tool-btn" title="Send Layer Backward">
            <span>⬇️ Backward</span>
          </button>
          <button id="btn-reset-element" class="edit-tool-btn" title="Reset Custom Position/Size Overrides on Selected Element">
            <span>🔄 Reset</span>
          </button>

          <div class="edit-toolbar-separator"></div>

          <!-- History -->
          <button id="btn-undo" class="edit-tool-btn" disabled title="Undo (Ctrl+Z)">
            <span>↩️ Undo</span>
          </button>
          <button id="btn-redo" class="edit-tool-btn" disabled title="Redo (Ctrl+Y)">
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
          <button id="btn-versions" class="edit-tool-btn" title="Version Snapshots & Checkpoints">
            <span>🛡️ Versions</span>
          </button>

          <!-- Save Button -->
          <button id="btn-save-edits" class="edit-tool-btn btn-save" title="Save Visual Changes Permanently to Source">
            <span>💾 Save</span>
          </button>

          <!-- Exit Button -->
          <button id="btn-exit-edit" class="edit-tool-btn btn-exit" title="Exit Edit Mode (Ctrl+Shift+E)">
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
      }
    });

    // Lock button
    const lockBtn = this.toolbar.querySelector('#btn-toggle-lock');
    lockBtn.addEventListener('click', () => {
      if (this.state.selectedElement) {
        this.state.toggleLock(this.state.selectedElement);
      }
    });

    this.state.on('selection_changed', () => this.updateLockBtn());
    this.state.on('lock_changed', () => this.updateLockBtn());

    // Layer buttons
    this.toolbar.querySelector('#btn-bring-forward').addEventListener('click', () => this.selection.bringForward());
    this.toolbar.querySelector('#btn-send-backward').addEventListener('click', () => this.selection.sendBackward());

    // Reset button
    this.toolbar.querySelector('#btn-reset-element').addEventListener('click', () => this.saveManager.resetSelectedElement());

    // Undo / Redo buttons
    const undoBtn = this.toolbar.querySelector('#btn-undo');
    const redoBtn = this.toolbar.querySelector('#btn-redo');

    undoBtn.addEventListener('click', () => this.history.undo());
    redoBtn.addEventListener('click', () => this.history.redo());

    this.state.on('history_changed', ({ canUndo, canRedo }) => {
      undoBtn.disabled = !canUndo;
      redoBtn.disabled = !canRedo;
    });

    // Save button
    this.toolbar.querySelector('#btn-save-edits').addEventListener('click', () => this.saveManager.saveChanges());

    // Version control button
    this.toolbar.querySelector('#btn-versions').addEventListener('click', () => this.versionManager.showVersionModal());

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

    // Global keyboard shortcut: Ctrl+Shift+E / Cmd+Shift+E
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        this.state.setActive(!this.state.isActive);
      }

      // Ctrl+Z / Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        if (this.state.isActive && !e.target.isContentEditable) {
          e.preventDefault();
          this.history.undo();
        }
      }

      // Ctrl+Y or Ctrl+Shift+Z for Redo
      if (((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
        if (this.state.isActive && !e.target.isContentEditable) {
          e.preventDefault();
          this.history.redo();
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
}
