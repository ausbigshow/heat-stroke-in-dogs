#!/usr/bin/env bash
# PreToolUse hook (Edit|Write): css/visual-overrides.css is normally written only by
# the in-app Edit Mode save system (dev-server.js POST /api/save-visual-edits). A later
# Edit Mode save can silently overwrite a manual edit here, so ask before hand-editing it.
set -euo pipefail

input="$(cat)"
file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"

if [[ "$file_path" == *css/visual-overrides.css ]]; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: "css/visual-overrides.css is normally written only by the in-app Edit Mode save system (dev-server.js POST /api/save-visual-edits). Hand-editing it here risks a later Edit Mode save silently overwriting this change. Continue anyway?"
    }
  }'
fi
