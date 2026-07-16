#!/bin/bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/common-macos.sh"

PACK_ID=""
PACKS_ROOT="$SKILL_ROOT/assets/packs"
START="true"
while [ "$#" -gt 0 ]; do
  case "$1" in
    --id) PACK_ID="${2:-}"; shift 2 ;;
    --packs-root) PACKS_ROOT="${2:-}"; shift 2 ;;
    --no-start) START="false"; shift ;;
    *) die "Unknown option: $1" ;;
  esac
done
[ -n "$PACK_ID" ] || die "Pass --id."

prepare_state
ensure_node
RESULT="$("$NODE" "$SKILL_ROOT/scripts/pack-tool.mjs" install --packs-root "$PACKS_ROOT" --id "$PACK_ID" --home "$HOME" --state-root "$STATE_ROOT")"
PET_ID="$("$NODE" -e 'const x=JSON.parse(process.argv[1]);process.stdout.write(x.petId)' "$RESULT")"
"$NODE" "$SKILL_ROOT/scripts/config-pet.mjs" set "$CONFIG_PATH" "$PET_BACKUP" "$PET_ID"
[ "$START" = "false" ] || "$SKILL_ROOT/scripts/start-macos.sh"
NAME="$("$NODE" -e 'const x=JSON.parse(process.argv[1]);process.stdout.write(x.name)' "$RESULT")"
printf '已换成“%s”，配套桌宠也已启用。\n' "$NAME"
