#!/usr/bin/env python3
"""Copy the ffdec exports into the Vite project and emit a typed asset index.

Re-runnable: wipes and rebuilds game/public/assets.

Only the assets the port actually draws are copied.  ffdec exports the whole
library, but the port touches a small part of it: the lists below are the result
of instrumenting `CanvasRenderingContext2D.drawImage` and driving the game
through every state (title, help, all 10 whale levels, every fish species, shark,
item, level-up, game over, all clear), recording what each frame really drew.
Anything that never appeared is dropped — that alone is ~1.4 MB of the 3.6 MB.
"""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPORT = ROOT / "re" / "export"
PUBLIC = ROOT / "game" / "public" / "assets"

# sprite id -> why it is kept (ids and roles cross-checked against re/REPORT.md)
KEEP_SPRITES = {
    101: "whale ani, level 1",  115: "whale ani, level 2",
    126: "whale ani, level 3",  137: "whale ani, level 4",
    148: "whale ani, level 5",  159: "whale ani, level 6",
    170: "whale ani, level 7",  181: "whale ani, level 8",
    192: "whale ani, level 9",  203: "whale ani, level 10",
    7:   "shark swim loop",
    17:  "fish swim loop, species 2",
    24:  "fish swim loop, species 3",
    29:  "fish swim loop, species 4",
    30:  "fish body (frame 1 is what a species-1 fish draws; frame 4 is the "
         "shark body, which the port never shows because it animates sprite 7)",
    33:  "invisibility item",
    54:  "score/mission digit glyphs",
    56:  "bubble",
    89:  "eatable-size indicator",
    104: "level-up sparkle",
    206: "level-up text",
    221: "all-clear card",
    230: "hunger bar (one frame per fill level)",
}

# bitmap id -> the three the port blits directly; everything else in
# Qua01/images/ is a constituent of a sprite the exporter already flattened,
# so shipping it twice would be pure waste
KEEP_IMAGES = {"79", "222", "224"}          # background, left plant, right plant

# sound linkage -> the port only ever plays these; `s_bomb1` sits at index 7 of
# SoundMaster's table but is never started, and 63 / s_over1 have no entry at all
KEEP_SOUNDS = {
    "s_bg", "s_over2", "s_ending", "s_level", "s_item",
    "s_eat1", "s_eat2", "s_eat3", "s_bomb2", "s_sharkstage1", "s_shark1",
}

# Qua_RES: the card/button art assets.ts lists by name
KEEP_RES_IMAGES = {"1_@qua_intro.jpg", "2_@howto.png", "3_@gameover02.png"}
KEEP_RES_BUTTONS = {27: "@b_qhowto01", 29: "@b_qstart01",
                    33: "@b_qgototop01", 35: "@b_qagain01"}
# only the up state is drawn; the over/down/hittest frames cost another 17 KB
BUTTON_STATE = "1_up.png"


def sprite_id(folder_name):
    m = re.match(r"^DefineSprite_(\d+)", folder_name)
    return int(m.group(1)) if m else -1


def copy_file(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    return 1


def main():
    if PUBLIC.exists():
        shutil.rmtree(PUBLIC)

    manifest = json.loads((ROOT / "re" / "manifest.json").read_text())

    # ---- sprites ----------------------------------------------------------
    n_sprites = 0
    keep_sprite_names = {}
    for src in sorted((EXPORT / "Qua01" / "sprites").iterdir()):
        sid = sprite_id(src.name)
        if sid not in KEEP_SPRITES:
            continue
        keep_sprite_names[src.name] = sid
        for f in src.iterdir():
            n_sprites += copy_file(f, PUBLIC / "sprites" / src.name / f.name)

    # ---- bitmaps ----------------------------------------------------------
    n_images = 0
    images = {}
    for src in sorted((EXPORT / "Qua01" / "images").iterdir()):
        if src.stem not in KEEP_IMAGES:
            continue
        n_images += copy_file(src, PUBLIC / "images" / src.name)
        images[src.stem] = f"assets/images/{src.name}"

    # ---- sounds -----------------------------------------------------------
    n_sounds = 0
    sounds = {}
    for stem, info in manifest["sounds"].items():
        m = re.match(r"^(\d+)(?:_(.*))?$", stem)
        if not m:
            continue
        linkage = m.group(2) or m.group(1)
        if linkage not in KEEP_SOUNDS:
            continue
        n_sounds += copy_file(EXPORT / "Qua01" / "sounds" / info["file"],
                              PUBLIC / "sounds" / info["file"])
        sounds[linkage] = f"assets/sounds/{info['file']}"

    # ---- Qua_RES: cards and buttons --------------------------------------
    # The @coryright_mc strip (Ourgame branding + the redirect component's own
    # documentation) is deliberately not copied: the port does not show it.
    n_res = 0
    for name in sorted(KEEP_RES_IMAGES):
        n_res += copy_file(EXPORT / "Qua_RES" / "images" / name,
                           PUBLIC / "res" / "images" / name)
    for bid, name in KEEP_RES_BUTTONS.items():
        src = EXPORT / "Qua_RES" / "buttons" / f"DefineButton2_{bid}_{name}" / BUTTON_STATE
        n_res += copy_file(src, PUBLIC / "res" / "buttons" /
                           f"DefineButton2_{bid}_{name}" / BUTTON_STATE)

    # ---- index ------------------------------------------------------------
    # Per-frame origin offsets come from ffdec's SVG export via build_manifest.py;
    # the port needs them because drawing at (x, y) has to put the sprite's
    # registration point there, not its top-left corner.
    sprites = {name: rec for name, rec in manifest["sprites"].items()
               if name in keep_sprite_names}
    index = {"sprites": sprites, "images": images, "sounds": sounds}
    out = ROOT / "game" / "src" / "assets-index.json"
    out.write_text(json.dumps(index, indent=1))

    print(f"sprites: {len(sprites)}/{len(manifest['sprites'])} dirs, {n_sprites} files")
    print(f"images:  {len(images)} kept, {n_images} files")
    print(f"sounds:  {len(sounds)} kept, {n_sounds} files")
    print(f"res:     {n_res} files")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
