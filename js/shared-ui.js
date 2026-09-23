let activeLeaveGuard = null;

export function confirmLeave({ title, message, stayLabel = 'Keep going', leaveLabel = 'Leave anyway' }) {
  if (document.body.classList.contains('edit-mode-active')) {
    return Promise.resolve(true);
  }
  if (activeLeaveGuard) return activeLeaveGuard;

  activeLeaveGuard = new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const stage = document.getElementById('stage');

    const scrim = document.createElement('div');
    scrim.className = 'leave-guard-scrim';
    scrim.dataset.editorId = 'shared-leave-guard';

    const card = document.createElement('div');
    card.className = 'leave-guard-card';
    card.setAttribute('role', 'alertdialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-labelledby', 'leave-guard-title');
    card.setAttribute('aria-describedby', 'leave-guard-desc');
    
    const titleEl = document.createElement('h2');
    titleEl.id = 'leave-guard-title';
    titleEl.className = 'leave-guard-title';
    titleEl.textContent = title;

    const descEl = document.createElement('p');
    descEl.id = 'leave-guard-desc';
    descEl.className = 'leave-guard-desc';
    descEl.textContent = message;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'leave-guard-buttons';

    const leaveBtn = document.createElement('button');
    leaveBtn.type = 'button';
    leaveBtn.className = 'shared-btn';
    leaveBtn.textContent = leaveLabel;

    const stayBtn = document.createElement('button');
    stayBtn.type = 'button';
    stayBtn.className = 'shared-btn is-primary';
    stayBtn.textContent = stayLabel;

    btnContainer.appendChild(leaveBtn);
    btnContainer.appendChild(stayBtn);
    card.appendChild(titleEl);
    card.appendChild(descEl);
    card.appendChild(btnContainer);
    scrim.appendChild(card);
    stage.appendChild(scrim);

    function closeAndResolve(result) {
      scrim.remove();
      activeLeaveGuard = null;
      if (prevFocus && typeof prevFocus.focus === 'function') {
        prevFocus.focus();
      }
      resolve(result);
    }

    stayBtn.addEventListener('click', () => closeAndResolve(false));
    leaveBtn.addEventListener('click', () => closeAndResolve(true));
    scrim.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === scrim) closeAndResolve(false);
    });

    // The acts bind Space / Enter / arrows at document level to advance the story. Nothing
    // typed inside this dialog may reach them.
    scrim.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        closeAndResolve(false);
      } else if (e.key === 'Tab') {
        const isShift = e.shiftKey;
        if (isShift && document.activeElement === leaveBtn) {
          e.preventDefault();
          stayBtn.focus();
        } else if (!isShift && document.activeElement === stayBtn) {
          e.preventDefault();
          leaveBtn.focus();
        }
      }
    });

    // Stay is the default and the primary -> gets focus on open
    stayBtn.focus();
  });

  return activeLeaveGuard;
}

export function actMarkerHtml(actNumber) {
  const text = actNumber === 0 ? 'Intro' : `Part ${actNumber} of 3`;
  const label = actNumber === 0 ? 'Introduction' : `Part ${actNumber} of 3`;
  return `<div class="act-marker-pill" data-editor-id="act${actNumber}-hud-act-marker" aria-label="${label}">${text}</div>`;
}
