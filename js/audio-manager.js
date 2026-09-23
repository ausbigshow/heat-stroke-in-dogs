/**
 * Audio Manager — Act 0 voiceover & character vocalizations
 *
 * Responsibilities:
 *  - Load Assets/Audio/vo-manifest.json (single source of truth for clip -> step mapping).
 *  - Preload every clip as a detached HTMLAudioElement.
 *  - playForStep(): play the clip for a dialogue step, interrupting whatever was playing.
 *  - Mute toggle, persisted to localStorage, rendered as a speaker button in the Act 0 HUD.
 *  - Autoplay-policy safe: primes on the first user gesture; a blocked play() never
 *    surfaces as an unhandled promise rejection.
 *  - Never plays while Edit Mode is active.
 *
 * Deliberately dependency-free and side-effect-free on import: nothing touches the DOM or
 * the network until init() is called by the screen that owns it.
 */

const MANIFEST_URL = 'Assets/Audio/vo-manifest.json';
const MUTE_STORAGE_KEY = 'callie-tay:vo-muted';

/** localStorage can throw (private mode, disabled storage). Never let that break playback. */
function safeReadMuted() {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function safeWriteMuted(value) {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    /* storage unavailable — mute state simply won't persist this session */
  }
}

// Mute toggle glyphs. Inline SVG rather than emoji (design-language.md §3.3).
const ICON_UNMUTED = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
const ICON_MUTED = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

export class AudioManager {
  constructor(options = {}) {
    this.manifestUrl = options.manifestUrl || MANIFEST_URL;
    this.basePath = 'Assets/Audio/';

    /** @type {Map<string, HTMLAudioElement>} stepId -> audio element */
    this.clipsByStepId = new Map();
    /** @type {Map<string, object>} stepId -> manifest entry */
    this.metaByStepId = new Map();

    this.currentAudio = null;
    this.currentStepId = null;

    this.muted = safeReadMuted();
    this.primed = false;
    this.ready = false;
    this.loadError = null;

    /** Resolves once the manifest has been fetched and clips constructed. */
    this.readyPromise = null;

    this._onFirstGesture = this._onFirstGesture.bind(this);
    this._gestureBound = false;
  }

  /* ------------------------------------------------------------------ *
   * Lifecycle
   * ------------------------------------------------------------------ */

  /**
   * Fetch the manifest and preload clips. Safe to call repeatedly — the work
   * happens once and every caller awaits the same promise.
   * Resolves even on failure (audio is an enhancement, never a hard dependency).
   */
  init() {
    if (this.readyPromise) return this.readyPromise;

    this._bindFirstGesture();

    this.readyPromise = fetch(this.manifestUrl, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
        return res.json();
      })
      .then((manifest) => {
        this.basePath = manifest.basePath || this.basePath;
        const clips = Array.isArray(manifest.clips) ? manifest.clips : [];
        clips.forEach((entry) => this._registerClip(entry));
        this.ready = true;
      })
      .catch((err) => {
        // Degrade silently to "no audio" rather than breaking the screen.
        this.loadError = err;
        this.ready = false;
        console.warn('[audio-manager] voiceover manifest unavailable, continuing without audio:', err.message);
      });

    return this.readyPromise;
  }

  _registerClip(entry) {
    if (!entry || !entry.file || !entry.stepId) return;

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = this.basePath + entry.file;
    audio.muted = this.muted;
    // A missing/corrupt file must not produce an uncaught error event.
    audio.addEventListener('error', () => {
      console.warn(`[audio-manager] could not load clip for ${entry.stepId}: ${entry.file}`);
    });

    this.clipsByStepId.set(entry.stepId, audio);
    this.metaByStepId.set(entry.stepId, entry);
  }

  /** Detach listeners and stop playback. */
  destroy() {
    this.stop();
    if (this._gestureBound) {
      document.removeEventListener('pointerdown', this._onFirstGesture, true);
      document.removeEventListener('keydown', this._onFirstGesture, true);
      this._gestureBound = false;
    }
  }

  /* ------------------------------------------------------------------ *
   * Autoplay priming
   * ------------------------------------------------------------------ */

  _bindFirstGesture() {
    if (this._gestureBound || this.primed) return;
    document.addEventListener('pointerdown', this._onFirstGesture, true);
    document.addEventListener('keydown', this._onFirstGesture, true);
    this._gestureBound = true;
  }

  _onFirstGesture() {
    this.prime();
  }

  /**
   * Unlock audio playback inside a user gesture. Browsers grant the whole
   * document playback permission once one element has played during a gesture,
   * so we play-and-immediately-pause one muted clip.
   */
  prime() {
    if (this.primed) return;
    this.primed = true;

    if (this._gestureBound) {
      document.removeEventListener('pointerdown', this._onFirstGesture, true);
      document.removeEventListener('keydown', this._onFirstGesture, true);
      this._gestureBound = false;
    }

    const first = this.clipsByStepId.values().next().value;
    if (!first) return;

    const wasMuted = first.muted;
    first.muted = true;
    const p = first.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        first.pause();
        first.currentTime = 0;
        first.muted = wasMuted;
      }).catch(() => {
        // Autoplay still blocked — playback will work from the next real gesture.
        first.muted = wasMuted;
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Playback
   * ------------------------------------------------------------------ */

  isEditModeActive() {
    return document.body.classList.contains('edit-mode-active');
  }

  /**
   * Play the clip mapped to a dialogue step, cutting off any clip still playing.
   * @param {string} stepId - the `id` of the Act 0 step (e.g. 'step4').
   * @returns {boolean} whether playback was attempted.
   */
  playForStep(stepId) {
    // Advancing always cuts the previous line, even if the new step has no clip
    // and even while muted — otherwise a long line bleeds over the next bubble.
    this.stop();

    if (!stepId) return false;
    if (this.isEditModeActive()) return false;
    if (this.muted) return false;

    const audio = this.clipsByStepId.get(stepId);
    if (!audio) return false;

    this.currentAudio = audio;
    this.currentStepId = stepId;

    try {
      audio.currentTime = 0;
    } catch {
      /* currentTime can throw if metadata isn't loaded yet; play() still works */
    }

    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      // Swallow NotAllowedError/AbortError — expected when autoplay is blocked
      // or when a rapid advance interrupts a pending play().
      p.catch(() => {});
    }
    return true;
  }

  /** Stop and rewind whatever is currently playing. */
  stop() {
    if (!this.currentAudio) return;
    try {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
    this.currentAudio = null;
    this.currentStepId = null;
  }

  /* ------------------------------------------------------------------ *
   * Mute
   * ------------------------------------------------------------------ */

  isMuted() {
    return this.muted;
  }

  setMuted(muted) {
    this.muted = !!muted;
    safeWriteMuted(this.muted);
    this.clipsByStepId.forEach((audio) => {
      audio.muted = this.muted;
    });
    if (this.muted) this.stop();
    this._syncMuteButtons();
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  /* ------------------------------------------------------------------ *
   * Mute button (rendered into the host screen's HUD)
   * ------------------------------------------------------------------ */

  /**
   * HTML for the HUD speaker button. Reuses the screen's existing button class so
   * it inherits HUD styling without this module owning any CSS.
   * @param {string} editorId - value for data-editor-id (Edit Mode target).
   * @param {string} className - existing HUD button class to inherit styling from.
   */
  muteButtonHtml(editorId = 'act0-btn-mute', className = 'act0-hud-btn') {
    const muted = this.muted;
    return `
      <button
        type="button"
        class="${className} vo-mute-btn"
        data-vo-mute-btn="true"
        data-editor-id="${editorId}"
        aria-pressed="${muted ? 'true' : 'false'}"
        aria-label="${muted ? 'Unmute voiceover' : 'Mute voiceover'}"
        title="${muted ? 'Unmute voiceover' : 'Mute voiceover'}"
      >${muted ? ICON_MUTED : ICON_UNMUTED}</button>
    `;
  }

  /**
   * Wire up any mute buttons inside `root`. Call after each re-render, since
   * screens that rebuild innerHTML discard the previous listeners.
   */
  bindMuteButton(root, onToggle) {
    if (!root) return;
    const buttons = root.querySelectorAll('[data-vo-mute-btn]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Edit Mode owns clicks on elements — don't hijack them.
        if (this.isEditModeActive()) return;
        this.prime();
        this.toggleMute();
        if (typeof onToggle === 'function') onToggle(this.muted);
      });
    });
    this._muteButtonRoot = root;
    this._syncMuteButtons();
  }

  /** Update button glyph/labels in place, without forcing a screen re-render. */
  _syncMuteButtons() {
    const root = this._muteButtonRoot;
    if (!root || !root.querySelectorAll) return;
    const muted = this.muted;
    root.querySelectorAll('[data-vo-mute-btn]').forEach((btn) => {
      btn.innerHTML = muted ? ICON_MUTED : ICON_UNMUTED;
      btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
      btn.setAttribute('aria-label', muted ? 'Unmute voiceover' : 'Mute voiceover');
      btn.setAttribute('title', muted ? 'Unmute voiceover' : 'Mute voiceover');
    });
  }
}

/** Shared instance — Act 0 (and later acts) use the same manager and mute state. */
export const audioManager = new AudioManager();

export default audioManager;
