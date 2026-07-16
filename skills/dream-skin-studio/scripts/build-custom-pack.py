#!/usr/bin/env python3
"""Turn two original local images into one validated private skin pack."""

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps

CELL = (192, 208)
GRID = (8, 9)
ROW_COUNTS = (6, 8, 8, 4, 5, 8, 6, 6, 6)


def hash_file(path):
  return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, value):
  path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_image(path):
  path = Path(path).expanduser().resolve()
  if not path.is_file() or not 0 < path.stat().st_size <= 50 * 1024 * 1024:
    raise SystemExit(f"Invalid image: {path}")
  return ImageOps.exif_transpose(Image.open(path))


def mascot_atlas(source, destination):
  mascot = load_image(source).convert("RGBA")
  box = mascot.getchannel("A").getbbox()
  if not box:
    raise SystemExit("Mascot image is fully transparent.")
  mascot = mascot.crop(box)
  mascot.thumbnail((168, 184), Image.Resampling.LANCZOS)
  atlas = Image.new("RGBA", (CELL[0] * GRID[0], CELL[1] * GRID[1]), (0, 0, 0, 0))
  for row, count in enumerate(ROW_COUNTS):
    frame = ImageOps.mirror(mascot) if row == 2 else mascot
    for column in range(count):
      x = column * CELL[0] + (CELL[0] - frame.width) // 2
      y = row * CELL[1] + (CELL[1] - frame.height) // 2
      atlas.alpha_composite(frame, (x, y))
  atlas.save(destination, "PNG", optimize=True)


def main():
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("--background", required=True)
  parser.add_argument("--pet-image", required=True)
  parser.add_argument("--output-root", required=True)
  parser.add_argument("--id", required=True)
  parser.add_argument("--name", required=True)
  parser.add_argument("--description", default="一套新生成的原创皮肤与桌宠。")
  parser.add_argument("--source-url", default="")
  parser.add_argument("--rights-basis", choices=("safe-original-generated", "user-owned-private"), required=True)
  parser.add_argument("--accent", default="#8ea7ff")
  args = parser.parse_args()

  if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", args.id):
    raise SystemExit("Invalid pack id.")
  if not re.fullmatch(r"#[0-9a-fA-F]{6}", args.accent):
    raise SystemExit("Invalid accent color.")
  output = Path(args.output_root).expanduser().resolve()
  if output.exists():
    raise SystemExit(f"Output already exists: {output}")
  pack = output / args.id
  pet_dir = pack / "pet"
  pet_dir.mkdir(parents=True)

  background = load_image(args.background).convert("RGB")
  background.thumbnail((3200, 1800), Image.Resampling.LANCZOS)
  background_path = pack / "background.png"
  background.save(background_path, "PNG", optimize=True)
  atlas_path = pet_dir / "spritesheet.png"
  mascot_atlas(args.pet_image, atlas_path)

  pet_id = f"{args.id}-pet"
  license_id = "CC0-1.0" if args.rights_basis == "safe-original-generated" else "PRIVATE-USER-ASSET"
  write_json(pack / "pack.json", {"schemaVersion": 1, "id": args.id, "license": license_id, "rights": "rights.json"})
  write_json(pack / "theme.json", {
    "schemaVersion": 1,
    "id": args.id,
    "name": args.name[:80],
    "petId": pet_id,
    "accent": args.accent.lower(),
    "panel": "#171b26",
    "text": "#f5f7fb",
    "background": "linear-gradient(rgba(8,12,20,.42),rgba(8,12,20,.76))",
    "backgroundImage": "background.png",
  })
  write_json(pet_dir / "pet.json", {"id": pet_id, "displayName": f"{args.name[:60]}搭档", "spritesheetPath": "spritesheet.png"})
  write_json(pack / "rights.json", {
    "schemaVersion": 1,
    "status": "approved",
    "basis": args.rights_basis,
    "license": license_id,
    "sourceUrl": args.source_url[:2048],
    "createdAt": datetime.now(timezone.utc).isoformat(),
    "redistributionAllowed": license_id == "CC0-1.0",
    "assets": [
      {"path": "background.png", "sha256": hash_file(background_path)},
      {"path": "pet/spritesheet.png", "sha256": hash_file(atlas_path)},
    ],
  })
  write_json(output / "catalog.json", {"schemaVersion": 1, "packs": [{
    "id": args.id, "name": args.name[:80], "description": args.description[:160],
    "moods": ["custom", "original"], "petId": pet_id,
  }]})
  print(json.dumps({"id": args.id, "packsRoot": str(output), "license": license_id}, ensure_ascii=False))


if __name__ == "__main__":
  main()
