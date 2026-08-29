/**
 * Visual Comments & Sticky Notes Manager
 * Provides draggable, resizable, color-coded feedback notes with status tracking
 * (Open / Feedback -> Implemented -> Resolved) for AI collaboration.
 */

export class NotesManager {
  constructor(editorState, saveManager) {
    this.state = editorState;
    this.saveManager = saveManager;
    this.notes = [];
    this.container = null;
    this.saveDebounceTimer = null;

    this.initContainer();
    this.loadNotes();

    this.state.on('active_changed', (active) => {
      if (this.container) {
        this.container.style.display = active ? 'block' : 'none';
      }
    });
  }

  initContainer() {
    this.container = document.getElementById('notes-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notes-container';
      document.body.appendChild(this.container);
    }
  }

  async loadNotes() {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        this.notes = data.notes || [];
        this.renderAllNotes();
      }
    } catch (err) {
      console.warn('Could not load sticky notes from server:', err);
    }
  }

  renderAllNotes() {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.notes.forEach(note => this.renderNote(note));
  }

  createNote(x = 120, y = 120) {
    const note = {
      id: `note_${Date.now()}`,
      x: Math.max(20, Math.min(window.innerWidth - 300, x)),
      y: Math.max(60, Math.min(window.innerHeight - 220, y)),
      width: 260,
      height: 160,
      color: 'yellow',
      status: 'open', // 'open' | 'implemented' | 'resolved'
      text: '',
      createdAt: new Date().toISOString()
    };

    this.notes.push(note);
    const el = this.renderNote(note);
    this.saveNotes();

    // Focus newly created note's text area
    const textarea = el.querySelector('.note-body');
    if (textarea) textarea.focus();

    return note;
  }

  renderNote(note) {
    const el = document.createElement('div');
    el.id = note.id;
    el.className = `sticky-note color-${note.color || 'yellow'} status-${note.status || 'open'}`;
    el.style.left = `${note.x}px`;
    el.style.top = `${note.y}px`;
    el.style.width = `${note.width || 260}px`;
    el.style.height = `${note.height || 160}px`;

    const statusOptions = [
      { value: 'open', label: '🟡 Feedback', badge: 'OPEN' },
      { value: 'implemented', label: '🔵 Implemented', badge: 'IMPLEMENTED' },
      { value: 'resolved', label: '🟢 Resolved', badge: 'RESOLVED' }
    ];

    const colors = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];
    const colorDots = colors.map(c => `
      <span class="color-dot dot-${c}" data-color="${c}" title="${c.toUpperCase()}"></span>
    `).join('');

    el.innerHTML = `
      <div class="note-header">
        <div class="note-header-left">
          <select class="note-status-select" title="Change note status">
            ${statusOptions.map(opt => `
              <option value="${opt.value}" ${note.status === opt.value ? 'selected' : ''}>${opt.label}</option>
            `).join('')}
          </select>
        </div>
        <div class="note-header-actions">
          <div class="note-color-picker">
            ${colorDots}
          </div>
          <button class="note-delete-btn" title="Delete note">&times;</button>
        </div>
      </div>
      <textarea class="note-body" placeholder="Add your feedback or change request here...">${this.escapeHtml(note.text || '')}</textarea>
      <div class="note-resize-corner" title="Drag to resize"></div>
    `;

    this.container.appendChild(el);

    // Event Bindings
    this.bindNoteEvents(el, note);
    return el;
  }

  bindNoteEvents(el, note) {
    const header = el.querySelector('.note-header');
    const textarea = el.querySelector('.note-body');
    const deleteBtn = el.querySelector('.note-delete-btn');
    const statusSelect = el.querySelector('.note-status-select');
    const resizeCorner = el.querySelector('.note-resize-corner');
    const colorDots = el.querySelectorAll('.color-dot');

    // 1. Drag to move
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('select') || e.target.closest('button') || e.target.closest('.color-dot')) return;
      e.preventDefault();
      el.classList.add('is-dragging');

      const startX = e.clientX;
      const startY = e.clientY;
      const initialLeft = note.x;
      const initialTop = note.y;

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        note.x = Math.max(0, Math.min(window.innerWidth - 60, initialLeft + dx));
        note.y = Math.max(50, Math.min(window.innerHeight - 60, initialTop + dy));
        el.style.left = `${note.x}px`;
        el.style.top = `${note.y}px`;
      };

      const onMouseUp = () => {
        el.classList.remove('is-dragging');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        this.saveNotes();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // 2. Corner Resize
    resizeCorner.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const initialW = el.offsetWidth;
      const initialH = el.offsetHeight;

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        note.width = Math.max(180, initialW + dx);
        note.height = Math.max(120, initialH + dy);
        el.style.width = `${note.width}px`;
        el.style.height = `${note.height}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        this.saveNotes();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // 3. Text Edit
    textarea.addEventListener('input', () => {
      note.text = textarea.value;
      this.debouncedSaveNotes();
    });

    // 4. Color Picker
    colorDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const newColor = e.currentTarget.getAttribute('data-color');
        el.classList.remove(`color-${note.color}`);
        note.color = newColor;
        el.classList.add(`color-${newColor}`);
        this.saveNotes();
      });
    });

    // 5. Status Switcher
    statusSelect.addEventListener('change', (e) => {
      const newStatus = e.target.value;
      el.classList.remove(`status-${note.status}`);
      note.status = newStatus;
      el.classList.add(`status-${newStatus}`);
      this.saveNotes();
      this.saveManager.showToast(`Note marked as ${newStatus.toUpperCase()}`, 'success');
    });

    // 6. Delete Note
    deleteBtn.addEventListener('click', () => {
      this.deleteNote(note.id);
    });
  }

  deleteNote(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    const el = document.getElementById(id);
    if (el) el.remove();
    this.saveNotes();
    this.saveManager.showToast('Note removed', 'success');
  }

  debouncedSaveNotes() {
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(() => {
      this.saveNotes();
    }, 600);
  }

  async saveNotes() {
    try {
      await fetch('/api/save-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: this.notes })
      });
    } catch (err) {
      console.error('Failed to save sticky notes to server:', err);
    }
  }

  escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
