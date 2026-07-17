#!/bin/bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/common-macos.sh"

[ "$(/usr/bin/uname -s)" = "Darwin" ] || die "macOS is required."
prepare_state
find_codex

if [ "${DREAM_SKIN_ALLOW_PARALLEL:-false}" != "true" ] && /usr/bin/pgrep -f "^${CODEX_EXE}" >/dev/null 2>&1; then
  /usr/bin/osascript -e 'tell application id "com.openai.codex" to quit' >/dev/null 2>&1 || true
  for _ in {1..40}; do
    /usr/bin/pgrep -f "^${CODEX_EXE}" >/dev/null 2>&1 || break
    /bin/sleep 0.25
  done
  /usr/bin/pgrep -f "^${CODEX_EXE}" >/dev/null 2>&1 && die "Please close Codex once, then repeat your request."
fi

OPEN_ARGS=(--remote-debugging-address=127.0.0.1 --remote-debugging-port="$PORT")
if [ -n "${DREAM_SKIN_USER_DATA_DIR:-}" ]; then
  /bin/mkdir -p "$DREAM_SKIN_USER_DATA_DIR"
  OPEN_ARGS+=(--user-data-dir="$DREAM_SKIN_USER_DATA_DIR")
fi
/usr/bin/open -na "$CODEX_APP" --args "${OPEN_ARGS[@]}"
READY="false"
for _ in {1..80}; do
  if /usr/bin/curl --noproxy '*' --silent --fail --max-time 1 "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then READY="true"; break; fi
  /bin/sleep 0.25
done
[ "$READY" = "true" ] || die "Codex opened, but the local theme connection was not ready."

INJECTOR_LABEL="com.pingfanfan.dream-skin-studio.injector"
INJECTOR_DOMAIN="gui/$(/usr/bin/id -u)"
/bin/launchctl bootout "$INJECTOR_DOMAIN/$INJECTOR_LABEL" >/dev/null 2>&1 || true
"$CODEX_NODE" "$SKILL_ROOT/scripts/launch-injector.mjs" \
  --plist "$STATE_ROOT/injector.plist" --node "$CODEX_NODE" --script "$SKILL_ROOT/scripts/inject.mjs" \
  --state "$STATE_ROOT/selected.json" --port "$PORT" --log "$STATE_ROOT/injector.log" --label "$INJECTOR_LABEL"
/bin/chmod 600 "$STATE_ROOT/injector.plist" "$STATE_ROOT/injector.log"
/bin/launchctl bootstrap "$INJECTOR_DOMAIN" "$STATE_ROOT/injector.plist"
"$SKILL_ROOT/scripts/start-pet-macos.sh"
