/**
 * Version Manager
 * Connects the Edit Mode UI to the continuous Git version control backend.
 */

export class VersionManager {
  constructor(editorState, saveManager) {
    this.state = editorState;
    this.saveManager = saveManager;
    this.modal = null;
  }

  showVersionModal() {
    this.closeModal();

    this.modal = document.createElement('div');
    this.modal.className = 'edit-modal-backdrop';
    this.modal.innerHTML = `
      <div class="edit-modal-window" role="dialog" aria-modal="true" aria-labelledby="version-modal-title">
        <div class="edit-modal-header">
          <div id="version-modal-title" class="edit-modal-title">
            <span>🛡️</span> Version Control & Safety Snapshots
          </div>
          <button class="edit-modal-close" aria-label="Close modal">&times;</button>
        </div>

        <div class="edit-modal-body">
          <!-- Create Checkpoint Section -->
          <div class="edit-modal-section">
            <h4>Create Named Checkpoint</h4>
            <div class="checkpoint-input-group">
              <input type="text" id="checkpoint-name-input" class="checkpoint-input" placeholder="e.g. before opening screen redesign">
              <button id="btn-create-checkpoint" class="edit-tool-btn active">Create Checkpoint</button>
            </div>
          </div>

          <!-- Quick Revert Section -->
          <div class="edit-modal-section">
            <h4>Quick Recovery</h4>
            <button id="btn-revert-last-save" class="edit-tool-btn btn-exit" style="width: 100%; justify-content: center; padding: 8px;">
              ⏮️ Revert Last Visual Save
            </button>
          </div>

          <!-- Recent Versions Section -->
          <div class="edit-modal-section">
            <h4>Recent Snapshots</h4>
            <div id="version-list-container">
              <p style="color: #94a3b8; font-size: 12px;">Loading version history...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Event listeners
    this.modal.querySelector('.edit-modal-close').addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    this.modal.querySelector('#btn-create-checkpoint').addEventListener('click', () => this.handleCreateCheckpoint());
    this.modal.querySelector('#btn-revert-last-save').addEventListener('click', () => this.handleRevertLastSave());

    this.fetchAndRenderVersions();
  }

  closeModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  async fetchAndRenderVersions() {
    const container = document.getElementById('version-list-container');
    if (!container) return;

    try {
      const response = await fetch('/api/versions');
      if (!response.ok) throw new Error('Failed to load versions');
      const data = await response.json();

      if (!data.versions || data.versions.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; font-size: 12px;">No versions found.</p>';
        return;
      }

      const listHtml = data.versions.map((v, i) => `
        <li class="version-item">
          <div class="version-info">
            <div class="version-message">${i + 1}. ${this.escapeHtml(v.message)}</div>
            <div class="version-meta">
              <span class="version-hash">${v.shortHash}</span>
              <span>•</span>
              <span>${v.relative} (${v.date})</span>
            </div>
          </div>
          <button class="edit-tool-btn btn-restore-item" data-hash="${v.hash}" style="font-size: 11px; padding: 4px 8px;">
            Restore
          </button>
        </li>
      `).join('');

      container.innerHTML = `<ul class="version-list">${listHtml}</ul>`;

      container.querySelectorAll('.btn-restore-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const hash = e.currentTarget.getAttribute('data-hash');
          this.handleRestoreVersion(hash);
        });
      });
    } catch (err) {
      container.innerHTML = `<p style="color: #f87171; font-size: 12px;">Error loading versions: ${err.message}</p>`;
    }
  }

  async handleCreateCheckpoint() {
    const input = document.getElementById('checkpoint-name-input');
    const name = input ? input.value.trim() : '';
    if (!name) {
      alert('Please enter a checkpoint name');
      return;
    }

    try {
      const res = await fetch('/api/checkpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        this.saveManager.showToast(`Created checkpoint: ${name}`, 'success');
        input.value = '';
        this.fetchAndRenderVersions();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert(`Checkpoint creation failed: ${err.message}`);
    }
  }

  async handleRevertLastSave() {
    if (!confirm('Revert the latest visual save? A safety backup will be created first.')) {
      return;
    }

    try {
      const res = await fetch('/api/revert-save', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        this.saveManager.showToast('Reverted last visual save. Reloading...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert(`Revert failed: ${data.message}`);
      }
    } catch (err) {
      alert(`Revert failed: ${err.message}`);
    }
  }

  async handleRestoreVersion(hash) {
    if (!confirm(`Restore project to version ${hash.substring(0, 7)}? A safety backup of your current state will be created first.`)) {
      return;
    }

    try {
      const res = await fetch('/api/restore-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash })
      });
      const data = await res.json();
      if (data.success) {
        this.saveManager.showToast(`Restored version ${hash.substring(0, 7)}. Reloading...`, 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert(`Restore failed: ${data.message}`);
      }
    } catch (err) {
      alert(`Restore failed: ${err.message}`);
    }
  }

  escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }
}
