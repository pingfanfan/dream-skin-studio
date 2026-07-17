#!/bin/bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd -P)/common-macos.sh"

[ "$(/usr/bin/uname -s)" = "Darwin" ] || die "macOS is required."
prepare_state
ensure_node
[ -f "$STATE_ROOT/selected.json" ] || die "No selected skin pack was found."

PET_INFO="$("$NODE" -e '
  const fs=require("fs"), path=require("path");
  const selected=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  const petRoot=path.resolve(selected.assetRoot,"pet");
  const pet=JSON.parse(fs.readFileSync(path.join(petRoot,"pet.json"),"utf8"));
  if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(pet.id||"") || path.basename(pet.animationPath||"")!==pet.animationPath || !/\.gif$/i.test(pet.animationPath||"")) throw new Error("Invalid pet animation.");
  const animation=path.resolve(petRoot,pet.animationPath);
  if(!animation.startsWith(petRoot+path.sep) || !fs.statSync(animation).isFile()) throw new Error("Pet animation is unavailable.");
  process.stdout.write(JSON.stringify({animation,name:String(pet.displayName||pet.id).slice(0,80)}));
' "$STATE_ROOT/selected.json")"
ANIMATION="$("$NODE" -e 'const x=JSON.parse(process.argv[1]);process.stdout.write(x.animation)' "$PET_INFO")"
PET_NAME="$("$NODE" -e 'const x=JSON.parse(process.argv[1]);process.stdout.write(x.name)' "$PET_INFO")"

if [ -f "$STATE_ROOT/pet.pid" ]; then
  OLD_PID="$(/bin/cat "$STATE_ROOT/pet.pid" 2>/dev/null || true)"
  case "$OLD_PID" in ''|*[!0-9]*) ;; *) /bin/kill "$OLD_PID" 2>/dev/null || true ;; esac
fi
/bin/rm -f "$STATE_ROOT/pet.ready.json" "$STATE_ROOT/pet.log"
PET_APP="$STATE_ROOT/DreamSkinPet.app"
if [ -x "$PET_APP/Contents/MacOS/applet" ]; then
  /usr/bin/pkill -f "^${PET_APP}/Contents/MacOS/applet" >/dev/null 2>&1 || true
fi
/bin/rm -rf "$PET_APP"
if ! /usr/bin/osacompile -l JavaScript -s -o "$PET_APP" "$SKILL_ROOT/scripts/desktop-pet-macos.js" >"$STATE_ROOT/pet.log" 2>&1; then
  die "The desktop pet helper could not be prepared. See $STATE_ROOT/pet.log"
fi
/usr/bin/open -na "$PET_APP" --args --animation "$ANIMATION" --name "$PET_NAME" --ready-file "$STATE_ROOT/pet.ready.json"

READY="false"
for _ in {1..40}; do
  if [ -f "$STATE_ROOT/pet.ready.json" ]; then
    PET_PID="$("$NODE" -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));if(!Number.isInteger(x.pid)||x.pid<2)process.exit(1);process.stdout.write(String(x.pid))' "$STATE_ROOT/pet.ready.json" 2>/dev/null || true)"
    case "$PET_PID" in ''|*[!0-9]*) ;; *) if /bin/kill -0 "$PET_PID" 2>/dev/null; then READY="true"; break; fi ;; esac
  fi
  /bin/sleep 0.25
done
if [ "$READY" != "true" ]; then
  die "The desktop pet window did not start. See $STATE_ROOT/pet.log"
fi
printf '%s\n' "$PET_PID" > "$STATE_ROOT/pet.pid"
/bin/chmod 600 "$STATE_ROOT/pet.pid" "$STATE_ROOT/pet.log"
/bin/chmod 600 "$STATE_ROOT/pet.ready.json"
