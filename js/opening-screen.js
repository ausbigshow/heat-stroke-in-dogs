/**
 * Opening Screen Logic
 * - Manages 3-second delay for continue button appearance
 * - Handles navigation action to course intro
 */

export class OpeningScreen {
  constructor(app) {
    this.app = app;
    this.continueBtn = null;
    this.timer = null;
    this.isButtonReady = false;
  }

  mount() {
    this.continueBtn = document.getElementById('btn-continue');
    
    if (this.continueBtn) {
      // 1.5-second delay before fading into view
      this.timer = setTimeout(() => {
        this.revealContinueButton();
      }, 1500);

      this.continueBtn.addEventListener('click', (e) => this.handleContinueClick(e));
    }
  }

  revealContinueButton() {
    if (!this.continueBtn) return;
    this.continueBtn.classList.add('is-visible');
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
      if (text) text.textContent = 'Loading Act 0...';
    }
  }

  unmount() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
