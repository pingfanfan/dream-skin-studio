#!/usr/bin/env python3
"""Generate the repository's original geometric pet atlases and pack records."""

import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PACKS = ROOT / "skills" / "dream-skin-studio" / "assets" / "packs"
CELL_W, CELL_H = 192, 208
ROWS = (6, 8, 8, 4, 5, 8, 6, 6, 6)

THEMES = [
  {"id": "morning-bubbles", "name": "晨雾气泡", "description": "明亮、柔和、有空气感。", "moods": ["bright", "soft", "calm"], "pet": "mist-orb", "accent": "#84a9ff", "panel": "#eff5ff", "text": "#17233d", "background": "radial-gradient(circle at 18% 22%, #ffffff 0 7%, transparent 24%), radial-gradient(circle at 78% 28%, #ffd9c5 0 8%, transparent 25%), linear-gradient(135deg, #b9e7ff 0%, #e6dcff 48%, #ffe7d0 100%)", "kind": "orb"},
  {"id": "luminous-tundra", "name": "夜光苔原", "description": "深色、安静、适合专注。", "moods": ["dark", "focused", "glow"], "pet": "lumen-critter", "accent": "#55e6c1", "panel": "#121b27", "text": "#edfaff", "background": "radial-gradient(circle at 74% 28%, #4e2a75 0 4%, transparent 24%), radial-gradient(circle at 25% 80%, #0e816f 0 2%, transparent 28%), linear-gradient(145deg, #07121a 0%, #102838 52%, #171127 100%)", "kind": "critter"},
  {"id": "paper-orbit", "name": "纸片轨道站", "description": "温暖、手作、带一点好奇心。", "moods": ["warm", "paper", "playful"], "pet": "paper-bot", "accent": "#d66f45", "panel": "#fff2db", "text": "#38281f", "background": "radial-gradient(circle at 78% 25%, #d66f45 0 6%, transparent 6.5%), radial-gradient(circle at 76% 25%, transparent 0 12%, #6d9b8d 12.5% 13.5%, transparent 14%), linear-gradient(150deg, #f5e4be 0%, #e9c99d 52%, #9bb5a6 100%)", "kind": "bot"},
  {"id": "dialup-chatroom", "name": "拨号聊天室", "description": "银灰窗口、蓝绿高光和早期桌面通讯软件的怀旧感。", "moods": ["retro", "messenger", "dialup", "pixel"], "pet": "signal-bubble", "accent": "#1689c9", "panel": "#dce8ef", "text": "#102b3b", "background": "repeating-linear-gradient(0deg, rgba(255,255,255,.18) 0 1px, transparent 1px 4px), radial-gradient(circle at 82% 18%, #f4ff9a 0 3%, transparent 16%), linear-gradient(145deg, #9fdcff 0%, #d8f5ff 42%, #d9d8c8 73%, #8db6c9 100%)", "kind": "signal", "mode": "retro-messenger"},
]


def write_json(path, value):
  path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha(path):
  return hashlib.sha256(path.read_bytes()).hexdigest()


def draw_pet(draw, kind, ox, oy, frame):
  bob = round(math.sin(frame * math.pi / 3) * 3)
  x, y = ox + 48, oy + 42 + bob
  if kind == "orb":
    draw.ellipse((x + 8, y + 42, x + 104, y + 132), fill=(240, 249, 255, 255), outline=(82, 117, 176, 255), width=5)
    draw.polygon(((x + 24, y + 52), (x + 38, y + 18), (x + 54, y + 52)), fill=(240, 249, 255, 255), outline=(82, 117, 176, 255))
    draw.polygon(((x + 66, y + 52), (x + 84, y + 18), (x + 94, y + 57)), fill=(240, 249, 255, 255), outline=(82, 117, 176, 255))
    draw.ellipse((x + 35, y + 78, x + 44, y + 88), fill=(35, 49, 74, 255)); draw.ellipse((x + 70, y + 78, x + 79, y + 88), fill=(35, 49, 74, 255))
    draw.arc((x + 48, y + 84, x + 66, y + 103), 10, 170, fill=(35, 49, 74, 255), width=3)
    draw.ellipse((x + 83, y + 99, x + 130, y + 130), fill=(207, 232, 255, 255), outline=(82, 117, 176, 255), width=4)
  elif kind == "critter":
    draw.ellipse((x + 18, y + 45, x + 96, y + 126), fill=(38, 230, 190, 255), outline=(13, 76, 86, 255), width=5)
    draw.ellipse((x + 32, y + 28, x + 52, y + 54), fill=(110, 255, 214, 255)); draw.ellipse((x + 67, y + 28, x + 87, y + 54), fill=(110, 255, 214, 255))
    for dx, dy in ((5, 70), (91, 70), (8, 106), (88, 106)):
      draw.line((x + 30, y + 82, x + dx, y + dy), fill=(86, 202, 200, 255), width=7)
    draw.ellipse((x + 40, y + 69, x + 48, y + 78), fill=(8, 24, 38, 255)); draw.ellipse((x + 68, y + 69, x + 76, y + 78), fill=(8, 24, 38, 255))
    draw.arc((x + 82, y + 80, x + 135, y + 130), 220, 480, fill=(103, 91, 220, 255), width=8)
  elif kind == "bot":
    draw.rounded_rectangle((x + 15, y + 38, x + 102, y + 126), radius=15, fill=(255, 236, 194, 255), outline=(108, 75, 53, 255), width=5)
    draw.line((x + 58, y + 38, x + 58, y + 18), fill=(108, 75, 53, 255), width=5); draw.ellipse((x + 51, y + 10, x + 65, y + 24), fill=(214, 111, 69, 255))
    draw.ellipse((x + 35, y + 67, x + 45, y + 78), fill=(54, 45, 40, 255)); draw.ellipse((x + 72, y + 67, x + 82, y + 78), fill=(54, 45, 40, 255))
    draw.arc((x + 43, y + 77, x + 76, y + 101), 15, 165, fill=(54, 45, 40, 255), width=4)
    draw.ellipse((x - 2, y + 55, x + 120, y + 118), outline=(109, 155, 141, 255), width=6)
  else:
    # Original signal-bubble mascot: a tiny message window with an antenna.
    draw.rounded_rectangle((x + 8, y + 40, x + 110, y + 122), radius=14, fill=(225, 245, 252, 255), outline=(29, 105, 151, 255), width=5)
    draw.rectangle((x + 14, y + 47, x + 104, y + 66), fill=(33, 143, 202, 255))
    draw.polygon(((x + 28, y + 121), (x + 20, y + 142), (x + 48, y + 121)), fill=(225, 245, 252, 255), outline=(29, 105, 151, 255))
    draw.line((x + 82, y + 40, x + 96, y + 18), fill=(57, 76, 87, 255), width=4)
    draw.ellipse((x + 90, y + 10, x + 102, y + 22), fill=(147, 210, 68, 255), outline=(57, 76, 87, 255), width=2)
    draw.ellipse((x + 35, y + 82, x + 44, y + 92), fill=(16, 43, 59, 255)); draw.ellipse((x + 72, y + 82, x + 81, y + 92), fill=(16, 43, 59, 255))
    draw.arc((x + 45, y + 88, x + 72, y + 108), 10, 170, fill=(16, 43, 59, 255), width=3)
    for px in range(3):
      draw.rectangle((x + 119 + px * 8, y + 61 - px * 8, x + 124 + px * 8, y + 66 - px * 8), fill=(147, 210, 68, 255))


def atlas(theme, destination):
  image = Image.new("RGBA", (CELL_W * 8, CELL_H * 9), (0, 0, 0, 0))
  draw = ImageDraw.Draw(image)
  for row, count in enumerate(ROWS):
    for column in range(count):
      draw_pet(draw, theme["kind"], column * CELL_W, row * CELL_H, column + row)
  image.save(destination, "PNG", optimize=True)


def main():
  PACKS.mkdir(parents=True, exist_ok=True)
  catalog = []
  for theme in THEMES:
    pack = PACKS / theme["id"]
    pet_dir = pack / "pet"
    pet_dir.mkdir(parents=True, exist_ok=True)
    sprite = pet_dir / "spritesheet.png"
    atlas(theme, sprite)
    write_json(pet_dir / "pet.json", {"id": theme["pet"], "displayName": theme["name"] + "搭档", "spritesheetPath": "spritesheet.png"})
    write_json(pack / "theme.json", {"schemaVersion": 1, "id": theme["id"], "name": theme["name"], "petId": theme["pet"], "accent": theme["accent"], "panel": theme["panel"], "text": theme["text"], "background": theme["background"], "mode": theme.get("mode", "default")})
    write_json(pack / "pack.json", {"schemaVersion": 1, "id": theme["id"], "license": "CC0-1.0", "rights": "rights.json"})
    write_json(pack / "rights.json", {"schemaVersion": 1, "status": "approved", "basis": "procedurally-generated-original", "license": "CC0-1.0", "source": "Generated by tools/build_bundled_assets.py from basic geometric primitives.", "assets": [{"path": "pet/spritesheet.png", "sha256": sha(sprite)}]})
    catalog.append({"id": theme["id"], "name": theme["name"], "description": theme["description"], "moods": theme["moods"], "petId": theme["pet"]})
  write_json(PACKS / "catalog.json", {"schemaVersion": 1, "packs": catalog})


if __name__ == "__main__":
  main()
