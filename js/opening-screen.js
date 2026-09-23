/**
 * Opening Screen Logic
 * - Manages 3-second delay for continue button appearance
 * - Handles navigation action to course intro
 */

import { progressStore } from './progress-store.js';

export class OpeningScreen {
  constructor(app) {
    this.app = app;
    this.continueBtn = null;
    this.resumeBtn = null;
    this.timer = null;
    this.isButtonReady = false;
  }

  mount() {
    this.continueBtn = document.getElementById('btn-continue');
    this.resumeBtn = document.getElementById('btn-resume');
    
    const saved = progressStore.load();
    if (saved && /^act[0-3]$/.test(saved.screen)) {
      // A returning learner almost always wants to pick up where they were, so Resume takes
      // the primary treatment and Start over steps down to the outline style.
      this.continueBtn?.parentElement?.classList.add('has-resume');
      if (this.resumeBtn) {
        const nStr = saved.screen.replace('act', '');
        const label = nStr === '0' ? 'Resume the intro' : `Resume Part ${nStr}`;
        this.resumeBtn.textContent = label;
        this.resumeBtn.setAttribute('aria-label', label);
        this.resumeBtn.hidden = false;
        
        this.resumeBtn.addEventListener('click', (e) => {
          if (document.body.classList.contains('edit-mode-active')) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (this.app && typeof this.app.navigateTo === 'function') {
            this.app.navigateTo(saved.screen, { resume: saved.state });
          }
        });
      }
      
      if (this.continueBtn) {
        const textEl = this.continueBtn.querySelector('.continue-text');
        if (textEl) textEl.textContent = 'Start over';
        this.continueBtn.setAttribute('aria-label', 'Start the story from the beginning');
        
        this.continueBtn.addEventListener('click', (e) => {
          if (document.body.classList.contains('edit-mode-active')) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          progressStore.clear();
          if (this.app && typeof this.app.navigateTo === 'function') {
            this.app.navigateTo('act0');
          }
        });
      }
    } else {
      if (this.continueBtn) {
        this.continueBtn.addEventListener('click', (e) => this.handleContinueClick(e));
      }
    }

    if (this.continueBtn || this.resumeBtn) {
      this.timer = setTimeout(() => {
        this.revealContinueButton();
      }, 1500);
    }
  }

  revealContinueButton() {
    if (this.continueBtn) this.continueBtn.classList.add('is-visible');
    if (this.resumeBtn && !this.resumeBtn.hidden) this.resumeBtn.classList.add('is-visible');
    this.isButtonReady = true;
  }

  handleContinueClick(e) {
    // If edit mode is active, suppress gameplay click
    if (document.body.classList.contains('edit-mode-active')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Trigger navigation / next scene (Act 0 Intro)
    if (this.app && typeof this.app.navigateTo === 'function') {
      this.app.navigateTo('act0');
    } else {
      console.log('🐶 Continue clicked -> Proceeding to Act 0: Intro Video');
      // Gentle feedback for learner
      const text = this.continueBtn.querySelector('.continue-text');
      if (text) text.textContent = 'Loading the intro...';
    }
  }

  unmount() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
