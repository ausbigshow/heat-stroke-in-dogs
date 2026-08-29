/**
 * Visual Comments & Sticky Notes Manager
 * Provides draggable, resizable, color-coded feedback notes with status tracking
 * (Open / Feedback -> Implemented -> Resolved) and directional arrow pointing for AI collaboration.
 */

export class NotesManager {
  constructor(editorState, saveManager) {
    this.state = editorState;
    this.saveManager = saveManager;
    this.notes = [];
    this.container = null;
    this.svg = null;
    this.activeLinkingNoteId = null;
    this.saveDebounceTimer = null;

    this.colorHexMap = {
      yellow: '#EAB308',
      pink: '#F43F5E',
      blue: '#38BDF8',
      green: '#4ADE80',
      purple: '#C084FC',
      orange: '#FB923C'
    };

    this.initContainer();
    this.initSvgLayer();
    this.bindGlobalEvents();
    this.loadNotes();

    this.state.on('active_changed', (active) => {
      if (this.container) {
        this.container.style.display = active ? 'block' : 'none';
      }
      if (this.svg) {
        this.svg.style.display = active ? 'block' : 'none';
      }
      if (active) {
        this.renderArrows();
      } else {
        this.cancelLinkingMode();
      }
    });

    this.state.on('selection_changed', () => this.renderArrows());
  }

  initContainer() {
    this.container = document.getElementById('notes-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notes-container';
      document.body.appendChild(this.container);
    }
  }

  initSvgLayer() {
    this.svg = document.getElementById('notes-arrows-svg');
    if (!this.svg) {
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svg.id = 'notes-arrows-svg';

      // Define arrowhead markers
      let markers = '<defs>';
      for (const [color, hex] of Object.entries(this.colorHexMap)) {
        markers += `
          <marker id="arrowhead-${color}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="${hex}" />
          </marker>
        `;
      }
      markers += '</defs>';
      this.svg.innerHTML = markers;

      document.body.appendChild(this.svg);
    }
  }

  bindGlobalEvents() {
    // Reposition arrows on window resize and scroll
    window.addEventListener('resize', () => this.renderArrows());
    window.addEventListener('scroll', () => this.renderArrows(), true);

    // Document click listener for Target Linking Mode
    document.addEventListener('click', (e) => {
      if (!this.activeLinkingNoteId) return;

      // Ignore clicks on the linking button itself
      if (e.target.closest('.note-pin-btn')) return;

      e.preventDefault();
      e.stopPropagation();

      const note = this.notes.find(n => n.id === this.activeLinkingNoteId);
      if (!note) {
        this.cancelLinkingMode();
        return;
      }

      const targetEl = e.target.closest('[data-editor-id]') || e.target.closest('button, h1, h2, h3, p, img, .character-card');
      if (targetEl && !targetEl.closest('.sticky-note') && !targetEl.closest('#edit-mode-toolbar')) {
        const id = targetEl.getAttribute('data-editor-id') || targetEl.id || targetEl.tagName.toLowerCase();
        note.targetElementId = targetEl.getAttribute('data-editor-id') || id;
        delete note.targetPoint;
        this.saveManager.showToast(`Arrow linked to #${note.targetElementId}`, 'success');
      } else if (!e.target.closest('.sticky-note') && !e.target.closest('#edit-mode-toolbar')) {
        // Point to click coordinate
        note.targetPoint = { x: Math.round(e.clientX), y: Math.round(e.clientY) };
        delete note.targetElementId;
        this.saveManager.showToast(`Arrow linked to (${note.targetPoint.x}, ${note.targetPoint.y})`, 'success');
      }

      this.cancelLinkingMode();
      this.renderAllNotes();
      this.saveNotes();
    }, true);
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
    this.renderArrows();
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
      targetElementId: null,
      createdAt: new Date().toISOString()
    };

    this.notes.push(note);
    const el = this.renderNote(note);
    this.renderArrows();
    this.saveNotes();

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

    const hasTarget = Boolean(note.targetElementId || note.targetPoint);
    const pinLabel = note.targetElementId ? `🎯 #${note.targetElementId}` : (note.targetPoint ? '🎯 Coords' : '🎯 Pin');

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
          <button class="note-pin-btn ${hasTarget ? 'has-target' : ''}" title="${hasTarget ? 'Target linked (Click to change or unlink)' : 'Draw arrow pointing to element'}">
            ${pinLabel}
          </button>
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
    this.bindNoteEvents(el, note);
    return el;
  }

  bindNoteEvents(el, note) {
    const header = el.querySelector('.note-header');
    const textarea = el.querySelector('.note-body');
    const deleteBtn = el.querySelector('.note-delete-btn');
    const pinBtn = el.querySelector('.note-pin-btn');
    const statusSelect = el.querySelector('.note-status-select');
    const resizeCorner = el.querySelector('.note-resize-corner');
    const colorDots = el.querySelectorAll('.color-dot');

    // 1. Drag to move note
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
        this.renderArrows();
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
        note.width = Math.max(200, initialW + dx);
        note.height = Math.max(120, initialH + dy);
        el.style.width = `${note.width}px`;
        el.style.height = `${note.height}px`;
        this.renderArrows();
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        this.saveNotes();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // 3. Pin / Arrow Target Linking
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.activeLinkingNoteId === note.id) {
        this.cancelLinkingMode();
        return;
      }

      if (note.targetElementId || note.targetPoint) {
        if (confirm('Unlink the current arrow target?')) {
          delete note.targetElementId;
          delete note.targetPoint;
          this.renderAllNotes();
          this.saveNotes();
          return;
        }
      }

      this.startLinkingMode(note.id, pinBtn);
    });

    // 4. Text Edit
    textarea.addEventListener('input', () => {
      note.text = textarea.value;
      this.debouncedSaveNotes();
    });

    // 5. Color Picker
    colorDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const newColor = e.currentTarget.getAttribute('data-color');
        el.classList.remove(`color-${note.color}`);
        note.color = newColor;
        el.classList.add(`color-${newColor}`);
        this.renderArrows();
        this.saveNotes();
      });
    });

    // 6. Status Switcher
    statusSelect.addEventListener('change', (e) => {
      const newStatus = e.target.value;
      el.classList.remove(`status-${note.status}`);
      note.status = newStatus;
      el.classList.add(`status-${newStatus}`);
      this.saveNotes();
      this.saveManager.showToast(`Note marked as ${newStatus.toUpperCase()}`, 'success');
    });

    // 7. Delete Note
    deleteBtn.addEventListener('click', () => {
      this.deleteNote(note.id);
    });
  }

  startLinkingMode(noteId, pinBtn) {
    this.activeLinkingNoteId = noteId;
    pinBtn.classList.add('is-linking');
    pinBtn.textContent = '🎯 Click Target...';
    document.body.style.cursor = 'crosshair';
    this.saveManager.showToast('Click any element to connect arrow (or click Pin to cancel)', 'success');
  }

  cancelLinkingMode() {
    this.activeLinkingNoteId = null;
    document.body.style.cursor = '';
    const pinBtns = this.container ? this.container.querySelectorAll('.note-pin-btn.is-linking') : [];
    pinBtns.forEach(btn => btn.classList.remove('is-linking'));
  }

  deleteNote(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    const el = document.getElementById(id);
    if (el) el.remove();
    this.renderArrows();
    this.saveNotes();
    this.saveManager.showToast('Note removed', 'success');
  }

  renderArrows() {
    if (!this.svg) return;

    // Keep defs, remove all dynamic paths and circles
    const paths = this.svg.querySelectorAll('.note-arrow-path, .note-arrow-start-dot');
    paths.forEach(p => p.remove());

    this.notes.forEach(note => {
      if (!note.targetElementId && !note.targetPoint) return;

      const noteEl = document.getElementById(note.id);
      if (!noteEl) return;

      const noteRect = noteEl.getBoundingClientRect();
      let targetX = 0;
      let targetY = 0;

      if (note.targetElementId) {
        const targetEl = document.querySelector(`[data-editor-id="${note.targetElementId}"]`) || document.getElementById(note.targetElementId);
        if (!targetEl || targetEl.offsetParent === null) return;
        const targetRect = targetEl.getBoundingClientRect();
        targetX = targetRect.left + targetRect.width / 2;
        targetY = targetRect.top + targetRect.height / 2;
      } else if (note.targetPoint) {
        targetX = note.targetPoint.x;
        targetY = note.targetPoint.y;
      }

      // Calculate origin anchor on sticky note perimeter closest to target
      const noteCenterX = noteRect.left + noteRect.width / 2;
      const noteCenterY = noteRect.top + noteRect.height / 2;

      let startX = noteCenterX;
      let startY = noteCenterY;

      if (targetX < noteRect.left) {
        startX = noteRect.left;
        startY = Math.max(noteRect.top + 10, Math.min(noteRect.bottom - 10, targetY));
      } else if (targetX > noteRect.right) {
        startX = noteRect.right;
        startY = Math.max(noteRect.top + 10, Math.min(noteRect.bottom - 10, targetY));
      } else if (targetY < noteRect.top) {
        startX = Math.max(noteRect.left + 10, Math.min(noteRect.right - 10, targetX));
        startY = noteRect.top;
      } else {
        startX = Math.max(noteRect.left + 10, Math.min(noteRect.right - 10, targetX));
        startY = noteRect.bottom;
      }

      // Compute smooth cubic bezier control points
      const dx = targetX - startX;
      const dy = targetY - startY;
      const curvature = 0.4;
      const cx1 = startX + dx * curvature;
      const cy1 = startY;
      const cx2 = startX + dx * (1 - curvature);
      const cy2 = targetY;

      const color = note.color || 'yellow';
      const hex = this.colorHexMap[color] || '#EAB308';

      // Start circle dot
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', startX);
      circle.setAttribute('cy', startY);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', hex);
      circle.setAttribute('class', 'note-arrow-start-dot');
      this.svg.appendChild(circle);

      // Curved arrow path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetX} ${targetY}`);
      path.setAttribute('stroke', hex);
      path.setAttribute('class', 'note-arrow-path');
      path.setAttribute('marker-end', `url(#arrowhead-${color})`);
      this.svg.appendChild(path);
    });
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
