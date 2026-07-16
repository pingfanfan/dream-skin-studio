#!/bin/bash
set -euo pipefail

SKILL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
STATE_ROOT="${DREAM_SKIN_STATE_ROOT:-$HOME/.codex/dream-skin-studio}"
CONFIG_PATH="${DREAM_SKIN_CONFIG:-$HOME/.codex/config.toml}"
PET_BACKUP="$STATE_ROOT/pet-backup.json"
PORT="${DREAM_SKIN_PORT:-9473}"

die() { printf 'Dream Skin Studio: %s\n' "$*" >&2; exit 1; }

find_codex() {
  local candidate identifier executable
  for candidate in "${CODEX_APP_BUNDLE:-}" "/Applications/ChatGPT.app" "$HOME/Applications/ChatGPT.app"; do
    [ -n "$candidate" ] || continue
    [ -f "$candidate/Contents/Info.plist" ] || continue
    identifier="$(/usr/bin/plutil -extract CFBundleIdentifier raw -o - "$candidate/Contents/Info.plist" 2>/dev/null || true)"
    [ "$identifier" = "com.openai.codex" ] || continue
    CODEX_APP="$candidate"
    executable="$(/usr/bin/plutil -extract CFBundleExecutable raw -o - "$candidate/Contents/Info.plist")"
    CODEX_EXE="$candidate/Contents/MacOS/$executable"
    CODEX_NODE="$candidate/Contents/Resources/cua_node/bin/node"
    [ -x "$CODEX_EXE" ] && [ -x "$CODEX_NODE" ] || die "The official app runtime is incomplete."
    /usr/bin/codesign --verify --deep --strict "$candidate" >/dev/null 2>&1 || die "The official app signature is invalid."
    export CODEX_APP CODEX_EXE CODEX_NODE
    return 0
  done
  die "The official Codex macOS app was not found."
}

ensure_node() {
  if [ -n "${NODE:-}" ] && [ -x "$NODE" ]; then return 0; fi
  find_codex
  NODE="$CODEX_NODE"
  export NODE
}

prepare_state() {
  /bin/mkdir -p "$STATE_ROOT"
  /bin/chmod 700 "$STATE_ROOT"
}
