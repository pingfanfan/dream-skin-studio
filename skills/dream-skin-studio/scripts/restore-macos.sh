#!/bin/bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/common-macos.sh"

prepare_state
ensure_node
"$NODE" "$SKILL_ROOT/scripts/config-pet.mjs" restore "$CONFIG_PATH" "$PET_BACKUP"
"$NODE" "$SKILL_ROOT/scripts/inject.mjs" --state "$STATE_ROOT/selected.json" --port "$PORT" --remove --once >/dev/null 2>&1 || true
if [ -f "$STATE_ROOT/injector.pid" ]; then
  PID="$(/bin/cat "$STATE_ROOT/injector.pid" 2>/dev/null || true)"
  case "$PID" in ''|*[!0-9]*) ;; *) /bin/kill "$PID" 2>/dev/null || true ;; esac
fi
/bin/rm -f "$STATE_ROOT/injector.pid" "$STATE_ROOT/selected.json"
printf '已恢复本项目改动的皮肤和桌宠选择。\n'
