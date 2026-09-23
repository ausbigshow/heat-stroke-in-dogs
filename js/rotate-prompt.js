/**
 * "Turn your phone sideways" — shown on a phone held upright.
 *
 * The course is drawn as a 16:9 stage. On a 375px-wide phone in portrait it shrinks to about
 * 350x260, and dialogue and cards crowd every scene. Landscape gives it room. This is a
 * suggestion, never a lock: WCAG 2.1 SC 1.3.4 (Orientation) forbids restricting content to
 * one orientation, and some learners can't rotate (a mounted phone, a rotation lock they
 * need). "Continue anyway" dismisses it for the rest of the session.
 *
 * While it is up, the course behind it is inert, so keyboard and screen-reader users land in
 * the prompt rather than behind it. It hides itself the moment the phone is turned.
 */
const PORTRAIT_PHONE = '(orientation: portrait) and (max-width: 600px)';
const DISMISSED_KEY = 'callie-tay.rotate-dismissed';

function isDismissed() {
  try { return sessionStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
}

function rememberDismissed() {
  try { sessionStorage.setItem(DISMISSED_KEY, '1'); } catch { /* storage blocked: it just returns next load */ }
}

export function initRotatePrompt() {
  const prompt = document.getElementById('rotate-prompt');
  const app = document.getElementById('app');
  const btn = document.getElementById('rotate-prompt-continue');
  if (!prompt || !app || !btn || typeof window.matchMedia !== 'function') return;

  const query = window.matchMedia(PORTRAIT_PHONE);
  let returnFocusTo = null;

  const show = () => {
    if (!prompt.hidden) return;
    returnFocusTo = document.activeElement;
    prompt.hidden = false;
    if (!app.hasAttribute('inert')) {
      app.setAttribute('inert', '');
      app.setAttribute('data-inert-by-rotate', '');
    }
    btn.focus();
  };

  const hide = () => {
    if (prompt.hidden) return;
    prompt.hidden = true;
    if (app.hasAttribute('data-inert-by-rotate')) {
      app.removeAttribute('inert');
      app.removeAttribute('data-inert-by-rotate');
    }
    if (returnFocusTo && document.contains(returnFocusTo)) returnFocusTo.focus();
    returnFocusTo = null;
  };

  const sync = () => {
    if (query.matches && !isDismissed()) show();
    else hide();
  };

  btn.addEventListener('click', () => {
    rememberDismissed();
    hide();
  });
  prompt.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      rememberDismissed();
      hide();
    } else if (e.key === 'Tab') {
      // One control: keep focus on it.
      e.preventDefault();
      btn.focus();
    }
  });

  if (typeof query.addEventListener === 'function') query.addEventListener('change', sync);
  else if (typeof query.addListener === 'function') query.addListener(sync);
  // Some browsers (and device emulators) resize without firing the query's change event.
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', sync);
  sync();
}
