#!/usr/bin/env bash
# PreToolUse hook (Edit|Write): best-effort git safety snapshot before Claude edits
# js/**, css/** or index.html, per .agents/rules/version-control.md ("before any
# meaningful change, create a recoverable version snapshot"). Mirrors the autosave
# commits dev-server.js already makes for its own in-browser save endpoints.
# Silent and non-blocking: never fails the tool call, never prompts the user.
set -uo pipefail

input="$(cat)"
file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"
[[ -z "$file_path" ]] && exit 0

root_dir="$(git -C "$(dirname "$file_path")" rev-parse --show-toplevel 2>/dev/null)"
[[ -z "$root_dir" ]] && exit 0

rel_path="${file_path#"$root_dir"/}"

# css/visual-overrides.css is covered by warn-visual-overrides.sh instead.
case "$rel_path" in
  css/visual-overrides.css)
    exit 0
    ;;
  js/*|css/*|index.html)
    ;;
  *)
    exit 0
    ;;
esac

cd "$root_dir" || exit 0

if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  git add -A >/dev/null 2>&1
  git commit -m "autosave: before Claude edit to ${rel_path}" >/dev/null 2>&1
fi

exit 0
