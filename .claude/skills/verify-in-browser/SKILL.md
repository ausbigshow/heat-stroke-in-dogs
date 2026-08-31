---
name: verify-in-browser
description: Launch this project's dev server and drive it with the Playwright MCP to confirm a UI change actually works — screen navigation, Edit Mode (drag/resize/notes/version restore), or quiz/dialogue logic. Use after any change to js/, css/, index.html, or before reporting such a change as done.
---

# Verify in Browser

This project has no test suite — the dev server ([dev-server.js](../../../dev-server.js))
is plain static file serving plus a few JSON APIs for the in-app Edit Mode
(`/api/versions`, `/api/checkpoint`, `/api/notes`, `/api/save-notes`,
`/api/save-visual-edits`, `/api/revert-save`, `/api/restore-version`). The only way to
confirm a change works is to actually load it. Use the `playwright` MCP server
(`mcp__playwright__*` tools) for this rather than eyeballing source.

## Steps

1. **Start the dev server** if it isn't already running:
   ```bash
   npm start
   ```
   It listens on `http://localhost:3000` (or `$PORT`). Run it in the background — it's a long-lived `http.createServer`, it never exits on its own.

2. **Navigate** with the Playwright MCP:
   - `mcp__playwright__browser_navigate` to `http://localhost:3000` for the normal course flow (opening → act0 → act1 → …).
   - Append `?edit=true` to the URL, or navigate normally and send the `Ctrl+Shift+E` key combo, to enter the visual Edit Mode when the change touches `js/editor/` or `css/visual-overrides.css`.

3. **Exercise the actual change**, not just the landing screen:
   - New/changed act screen: click through to it (via the Continue button or whatever triggers `app.navigateTo(...)`), step through its dialogue/beats, and navigate away to confirm `unmount()` doesn't throw.
   - Edit Mode change: select an element, drag/resize it, open the notes panel, and use Save — then confirm via `mcp__playwright__browser_console_messages` that the save call succeeded (or check `git log --oneline -1` for the resulting `visual-save:`/`notes:` autosave commit dev-server.js creates).
   - Quiz/interactive logic: click through the actual choices/branches, not just the first one.

4. **Check for problems**:
   - `mcp__playwright__browser_console_messages` — this project has no error boundary; a thrown exception in a screen's `render()`/`mount()` shows up here, not visibly on screen.
   - `mcp__playwright__browser_take_screenshot` — take one after the interaction so you have visual confirmation, not just "it didn't throw."
   - `mcp__playwright__browser_network_requests` — useful when the change touches an Edit Mode save/restore call, to confirm the API request actually returned `success: true`.

5. **Report what you saw**, not what you expect — e.g. "navigated to Act 1, clicked through all 4 beats, no console errors, screenshot attached" rather than "should work now."

## Notes

- This is a plain ES-module app with no build step — a stale browser cache after an edit is a common false negative. If behavior looks unchanged, do a hard navigate (not just re-screenshot) before concluding the fix didn't work.
- Don't leave the dev server running indefinitely across unrelated tasks — stop it when verification is done unless the user is actively iterating in the browser too.
