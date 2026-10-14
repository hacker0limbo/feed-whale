#!/usr/bin/env python3
"""Copy the ffdec exports into the Vite project and emit a typed asset index.

Re-runnable: wipes and rebuilds game/public/assets.
"""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPORT = ROOT / "re" / "export"
SVG = ROOT / "re" / "tmp_svg"
PUBLIC = ROOT / "game" / "public" / "assets"

# sprite id -> the role it plays in the game (from re/REPORT.md)
ROLES = {
    204: "player",            # the whale, 10 frames = growth level 1..10
    30: "enemy",              # fish, 4 frames = species/size 1..4
    10: "shark",
    33: "item",
    56: "boggle",             # bubble
    54: "scorenum",           # digit glyphs
    230: "hungryBar",         # 68 frames: full .. empty
    229: "hungryBarWater",
    226: "hungryBarBack",
    9: "hitArea",
    89: "eatable",
    104: "light",             # level-up sparkle, 65 frames
    103: "bubble",
    17: "fishAni2",
    24: "fishAni3",
    29: "fishAni4",
    7: "sharkAni",
    6: "wave",
    64: "wave2",
    78: "wave3",
}
WHALE_ANI = {1: 101, 2: 115, 3: 126, 4: 137, 5: 148,
             6: 159, 7: 170, 8: 181, 9: 192, 10: 203}


def copy_tree(src, dst):
    if not src.exists():
        return 0
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    return sum(1 for _ in dst.rglob("*") if _.is_file())


def main():
    if SVG.exists():
        shutil.rmtree(SVG)
    PUBLIC.mkdir(parents=True, exist_ok=True)

    n_sprites = copy_tree(EXPORT / "Qua01" / "sprites", PUBLIC / "sprites")
    n_images = copy_tree(EXPORT / "Qua01" / "images", PUBLIC / "images")
    n_shapes = 0  # vector shapes are kept only in re/export, the port blits PNGs
    n_sounds = copy_tree(EXPORT / "Qua01" / "sounds", PUBLIC / "sounds")

    # only the pieces the port references: the card/button art and the two
    # copyright sprites; the RES shapes, fonts and sounds are unused
    res = PUBLIC / "res"
    res.mkdir(parents=True, exist_ok=True)
    # drop anything a previous run left behind that is no longer wanted
    shutil.rmtree(res / "sprites", ignore_errors=True)
    for sub in ("images", "buttons"):
        copy_tree(EXPORT / "Qua_RES" / sub, res / sub)
    # The @coryright_mc strip (Ourgame branding + the redirect component's own
    # documentation) is deliberately not copied: the port does not show it.

    # The runtime index needs three things: each sprite's per-frame origin offset
    # (taken from ffdec's SVG export via build_manifest.py), the real filename of
    # every bitmap, and the sound linkage names the game refers to.
    manifest = json.loads((ROOT / "re" / "manifest.json").read_text())

    images = {}
    for png in sorted((EXPORT / "Qua01" / "images").iterdir()):
        images[png.stem] = f"assets/images/{png.name}"

    sounds = {}
    for stem, info in manifest["sounds"].items():
        m = re.match(r"^(\d+)(?:_(.*))?$", stem)
        if m:
            sounds[m.group(2) or m.group(1)] = f"assets/sounds/{info['file']}"

    index = {"sprites": manifest["sprites"], "images": images, "sounds": sounds}
    out = ROOT / "game" / "src" / "assets-index.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(index, indent=1))
    print(f"wrote {out} ({len(index['sprites'])} sprites, "
          f"{len(images)} images, {len(sounds)} sounds)")

    print(f"assets copied: {n_sprites} sprite files, {n_images} images, "
          f"{n_shapes} shapes, {n_sounds} sounds")
    print(f"wrote {out}")
    print("sounds:", ", ".join(sorted(sounds)))


if __name__ == "__main__":
    main()
