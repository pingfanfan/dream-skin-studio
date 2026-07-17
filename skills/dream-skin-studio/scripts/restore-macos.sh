#!/bin/bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/common-macos.sh"

prepare_state
ensure_node
"$NODE" "$SKILL_ROOT/scripts/config-pet.mjs" restore "$CONFIG_PATH" "$PET_BACKUP"
PET_ID="$("$NODE" -e 'const fs=require("fs");try{const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));if(/^[a-z0-9][a-z0-9-]{0,63}$/.test(x.petId||""))process.stdout.write(x.petId)}catch{}' "$STATE_ROOT/selected.json")"
INJECTOR_LABEL="com.pingfanfan.dream-skin-studio.injector"
INJECTOR_DOMAIN="gui/$(/usr/bin/id -u)"
/bin/launchctl bootout "$INJECTOR_DOMAIN/$INJECTOR_LABEL" >/dev/null 2>&1 || true
"$NODE" "$SKILL_ROOT/scripts/inject.mjs" --state "$STATE_ROOT/selected.json" --port "$PORT" --remove --once >/dev/null 2>&1 || true
if [ -f "$STATE_ROOT/injector.pid" ]; then
  PID="$(/bin/cat "$STATE_ROOT/injector.pid" 2>/dev/null || true)"
  case "$PID" in ''|*[!0-9]*) ;; *) /bin/kill "$PID" 2>/dev/null || true ;; esac
fi
if [ -f "$STATE_ROOT/pet.pid" ]; then
  PID="$(/bin/cat "$STATE_ROOT/pet.pid" 2>/dev/null || true)"
  case "$PID" in ''|*[!0-9]*) ;; *) /bin/kill "$PID" 2>/dev/null || true ;; esac
fi
/bin/rm -f "$STATE_ROOT/injector.pid" "$STATE_ROOT/injector.plist" "$STATE_ROOT/pet.pid" "$STATE_ROOT/pet.ready.json" "$STATE_ROOT/selected.json"
/bin/rm -f "$STATE_ROOT/injector.log" "$STATE_ROOT/pet.log"
/bin/rm -rf "$STATE_ROOT/DreamSkinPet.app" "$STATE_ROOT/active-pack"
[ -z "$PET_ID" ] || /bin/rm -rf "$HOME/.codex/pets/$PET_ID"
printf '已恢复本项目改动的皮肤和桌宠选择。\n'
