#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
SKILL="$ROOT/skills/dream-skin-studio"
NODE="${NODE:-$(command -v node)}"
[ -x "$NODE" ] || { printf 'Node.js 20+ is required.\n' >&2; exit 1; }

while IFS= read -r file; do /bin/bash -n "$file"; done < <(/usr/bin/find "$ROOT" -type f \( -name '*.sh' -o -name '*.command' \) -print)
while IFS= read -r file; do "$NODE" --check "$file" >/dev/null; done < <(/usr/bin/find "$ROOT" -type f \( -name '*.mjs' -o -name '*.js' \) -print)
python3 -c 'import ast,sys; [ast.parse(open(p, encoding="utf-8").read(), filename=p) for p in sys.argv[1:]]' \
  "$SKILL/scripts/build-custom-pack.py" "$ROOT/tools/build_bundled_assets.py"
"$NODE" "$ROOT/tools/audit.mjs" "$ROOT" >/dev/null

TMP="$(/usr/bin/mktemp -d /tmp/dream-skin-studio-test.XXXXXX)"
trap '/bin/rm -rf "$TMP"' EXIT
HOME_TEST="$TMP/home"
STATE="$HOME_TEST/.codex/dream-skin-studio"
/bin/mkdir -p "$HOME_TEST/.codex"
/usr/bin/printf '%s\n' 'model = "gpt-5"' 'pet = "original-pet"' > "$HOME_TEST/.codex/config.toml"
/bin/cp "$HOME_TEST/.codex/config.toml" "$TMP/original.toml"

LIST="$("$NODE" "$SKILL/scripts/pack-tool.mjs" list --packs-root "$SKILL/assets/packs")"
"$NODE" -e 'const x=JSON.parse(process.argv[1]);if(x.length!==4||!x.some(p=>p.id==="dialup-chatroom"))process.exit(1)' "$LIST"

HOME="$HOME_TEST" NODE="$NODE" "$SKILL/scripts/apply-macos.sh" --id morning-bubbles --no-start >/dev/null
/usr/bin/grep -q '^pet = "mist-orb"$' "$HOME_TEST/.codex/config.toml"
[ -f "$HOME_TEST/.codex/pets/mist-orb/spritesheet.png" ]
[ -f "$STATE/selected.json" ]
CSS="$("$NODE" "$SKILL/scripts/inject.mjs" --state "$STATE/selected.json" --print-css)"
case "$CSS" in *'--dream-accent: #84a9ff'*) ;; *) printf 'Theme CSS was not generated.\n' >&2; exit 1 ;; esac

HOME="$HOME_TEST" NODE="$NODE" "$SKILL/scripts/apply-macos.sh" --id dialup-chatroom --no-start >/dev/null
RETRO_CSS="$("$NODE" "$SKILL/scripts/inject.mjs" --state "$STATE/selected.json" --print-css)"
case "$RETRO_CSS" in *'font-family: Tahoma'*'border-radius: 3px'*) ;; *) printf 'Retro messenger styling was not generated.\n' >&2; exit 1 ;; esac

HOME="$HOME_TEST" NODE="$NODE" "$SKILL/scripts/restore-macos.sh" >/dev/null
/usr/bin/cmp -s "$HOME_TEST/.codex/config.toml" "$TMP/original.toml"

/bin/cp -R "$SKILL/assets/packs" "$TMP/tampered-packs"
/usr/bin/printf 'x' >> "$TMP/tampered-packs/morning-bubbles/pet/spritesheet.png"
if "$NODE" "$SKILL/scripts/pack-tool.mjs" install --packs-root "$TMP/tampered-packs" --id morning-bubbles --home "$HOME_TEST" --state-root "$STATE" >/dev/null 2>&1; then
  printf 'Tampered public asset unexpectedly installed.\n' >&2
  exit 1
fi

printf 'PASS: independent source audit, rights fingerprints, pack install, CSS generation, pet selection, restore, and tamper rejection.\n'
