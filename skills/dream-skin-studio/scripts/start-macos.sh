#!/bin/bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/common-macos.sh"

[ "$(/usr/bin/uname -s)" = "Darwin" ] || die "macOS is required."
prepare_state
find_codex

if /usr/bin/pgrep -f "^${CODEX_EXE}" >/dev/null 2>&1; then
  /usr/bin/osascript -e 'tell application id "com.openai.codex" to quit' >/dev/null 2>&1 || true
  for _ in {1..40}; do
    /usr/bin/pgrep -f "^${CODEX_EXE}" >/dev/null 2>&1 || break
    /bin/sleep 0.25
  done
  /usr/bin/pgrep -f "^${CODEX_EXE}" >/dev/null 2>&1 && die "Please close Codex once, then repeat your request."
fi

if [ -f "$STATE_ROOT/injector.pid" ]; then
  OLD_PID="$(/bin/cat "$STATE_ROOT/injector.pid" 2>/dev/null || true)"
  case "$OLD_PID" in ''|*[!0-9]*) ;; *) /bin/kill "$OLD_PID" 2>/dev/null || true ;; esac
fi

/usr/bin/open -na "$CODEX_APP" --args --remote-debugging-address=127.0.0.1 --remote-debugging-port="$PORT"
READY="false"
for _ in {1..80}; do
  if /usr/bin/curl --noproxy '*' --silent --fail --max-time 1 "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then READY="true"; break; fi
  /bin/sleep 0.25
done
[ "$READY" = "true" ] || die "Codex opened, but the local theme connection was not ready."

/usr/bin/nohup "$CODEX_NODE" "$SKILL_ROOT/scripts/inject.mjs" --state "$STATE_ROOT/selected.json" --port "$PORT" \
  >"$STATE_ROOT/injector.log" 2>&1 &
printf '%s\n' "$!" > "$STATE_ROOT/injector.pid"
/bin/chmod 600 "$STATE_ROOT/injector.pid" "$STATE_ROOT/injector.log"
