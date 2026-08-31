/**
 * Keyboard focus continuity across re-renders.
 *
 * Every screen re-renders by replacing `container.innerHTML`, which destroys the focused
 * element. The browser then drops focus to `<body>`, so a keyboard learner who presses
 * Enter on "Next" is thrown back to the top of the tab order on every single step.
 *
 * These helpers restore the invariant docs/design-language.md §7.5 already asks for:
 * tab order follows visual order, and nothing silently loses the user's place.
 */

const isEditing = () => document.body.classList.contains('edit-mode-active');

/**
 * Identify the focused element durably enough to find it again in the next render.
 * Prefers `id`, falls back to `data-editor-id` (every positioned element carries one,
 * per §8), and finally to a positional selector within the container.
 */
function focusKey(container) {
  const el = document.activeElement;
  if (!el || el === document.body || !container.contains(el)) return null;
  if (el.id) return `#${CSS.escape(el.id)}`;
  const editorId = el.getAttribute('data-editor-id');
  if (editorId) return `[data-editor-id="${CSS.escape(editorId)}"]`;
  return null;
}

/**
 * Re-render `container` via `renderFn` while keeping the keyboard user's place.
 *
 * If focus was inside the container beforehand, it is restored to the same control
 * afterwards. When that control no longer exists (it was the last step's "Next", now
 * replaced by "Begin Act 1"), focus falls through to the first candidate in
 * `fallbackSelectors` so the user lands on the control that continues the story
 * rather than on `<body>`.
 *
 * No-ops while Edit Mode is active: the editor owns selection and focus there.
 */
export function renderPreservingFocus(container, renderFn, fallbackSelectors = []) {
  if (!container) return;
  const hadFocus = !isEditing() && focusKey(container);

  renderFn();

  if (!hadFocus || isEditing()) return;

  const restore = container.querySelector(hadFocus);
  if (restore && !restore.disabled) {
    restore.focus();
    return;
  }
  for (const sel of fallbackSelectors) {
    const el = container.querySelector(sel);
    if (el && !el.disabled) {
      el.focus();
      return;
    }
  }
}

/**
 * Move focus to the first available control inside a just-opened dialog.
 * Required by design-language.md §7.4 ("focus moved in on open").
 */
export function focusInto(container, selectors) {
  if (!container || isEditing()) return false;
  for (const sel of selectors) {
    const el = container.querySelector(sel);
    if (el && !el.disabled) {
      el.focus();
      return true;
    }
  }
  return false;
}

/**
 * Contain the tab sequence inside an open dialog.
 *
 * `aria-modal="true"` tells assistive tech the rest of the page is unavailable, but it
 * does not enforce anything: without this, 30-odd scene and HUD controls stay tabbable
 * behind the dialog, which is exactly the trap §7.5 forbids. Marking the dialog's
 * siblings `inert` makes the promise true for keyboard and screen-reader users alike.
 *
 * Skipped in Edit Mode, where the author must still reach the toolbar behind a dialog.
 */
export function containFocusIn(dialog) {
  if (!dialog || isEditing()) return;

  // Walk up only as far as #stage. Above it sits #editor-root, which holds the Edit Mode
  // toolbar: `inert` blocks pointer events as well as tabbing, so inerting it would lock
  // the author out of Edit Mode for as long as a dialog is open.
  const stage = document.getElementById('stage');
  if (!stage || !stage.contains(dialog)) return;

  let node = dialog;
  while (node && node !== stage && node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling !== node && !sibling.hasAttribute('inert')) {
        sibling.setAttribute('inert', '');
        sibling.setAttribute('data-inert-by-dialog', '');
      }
    }
    node = node.parentElement;
  }
}

/** Undo containFocusIn(). Safe to call when nothing is inert. */
export function releaseFocusContainment(root = document) {
  root.querySelectorAll('[data-inert-by-dialog]').forEach((el) => {
    el.removeAttribute('inert');
    el.removeAttribute('data-inert-by-dialog');
  });
}
