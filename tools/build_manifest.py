#!/usr/bin/env python3
"""Build an asset manifest for the HTML5 port.

For every exported sprite frame we need to know where the sprite's registration
point (0,0 in Flash coordinates) sits inside the exported PNG, otherwise the art
would be positioned wrongly in the port.

Source of truth: FFDec's SVG frame export, whose outer
`<g transform="matrix(a,b,c,d,tx,ty)">` places the *sprite* inside the canvas,
so (tx, ty) is exactly the origin offset.  The PNG dimensions are the SVG canvas
rounded up.

Usage: build_manifest.py <svg-dir> <png-dir> <out.json>
"""
import json
import math
import re
import sys
from pathlib import Path

SVG_TAG = re.compile(r"<svg\b[^>]*>")
WH = re.compile(r'\b(width|height)="([\d.]+)px"')
GROUP = re.compile(r'<g\s+transform="matrix\(([^)]*)\)"')
IDENT = re.compile(r'ffdec:characterId="(\d+)"\s+(?:height="[\d.]+"\s+)?id="([^"]*)"')


def png_size(p):
    """Read width/height straight out of the PNG IHDR."""
    with open(p, "rb") as f:
        head = f.read(33)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    w = int.from_bytes(head[16:20], "big")
    h = int.from_bytes(head[20:24], "big")
    return w, h


def parse_frame(svg_path):
    text = svg_path.read_text(errors="replace")
    tag = SVG_TAG.search(text)
    if not tag:
        return None
    dims = dict(WH.findall(tag.group(0)))
    if "width" not in dims or "height" not in dims:
        return None
    sw, sh = float(dims["width"]), float(dims["height"])
    g = GROUP.search(text)
    tx = ty = 0.0
    if g:
        parts = [float(x) for x in g.group(1).split(",")]
        if len(parts) == 6:
            tx, ty = parts[4], parts[5]
    children = {}
    for cid, name in IDENT.findall(text):
        children[name or f"char{cid}"] = int(cid)
    return {"svgW": sw, "svgH": sh, "originX": tx, "originY": ty, "children": children}


def main():
    svg_root = Path(sys.argv[1])
    png_root = Path(sys.argv[2])
    out_path = Path(sys.argv[3])

    manifest = {"sprites": {}, "images": {}, "shapes": {}, "sounds": {}}

    if svg_root.exists():
        for sprite_dir in sorted(p for p in svg_root.iterdir() if p.is_dir()):
            name = sprite_dir.name
            frames = []
            for svg in sorted(sprite_dir.glob("*.svg"),
                              key=lambda p: int(p.stem) if p.stem.isdigit() else 0):
                info = parse_frame(svg)
                if not info:
                    continue
                png = png_root / name / f"{svg.stem}.png"
                size = png_size(png) if png.exists() else None
                frames.append({
                    "frame": int(svg.stem) if svg.stem.isdigit() else svg.stem,
                    "originX": round(info["originX"], 3),
                    "originY": round(info["originY"], 3),
                    "w": size[0] if size else math.ceil(info["svgW"]),
                    "h": size[1] if size else math.ceil(info["svgH"]),
                    "hasArt": png.exists(),
                    "children": info["children"],
                })
            if frames:
                manifest["sprites"][name] = frames

    m = re.match(r"DefineSprite_(\d+)(?:_(.*))?$", "DefineSprite_204_x")
    for name in manifest["sprites"]:
        mm = re.match(r"DefineSprite_(\d+)(?:_(.*))?", name)
        if mm:
            manifest["sprites"][name] = {"id": int(mm.group(1)),
                                         "exportName": mm.group(2) or None,
                                         "frames": manifest["sprites"][name]}

    img_dir = png_root.parent / "images"
    if img_dir.exists():
        for p in sorted(img_dir.glob("*.png")):
            size = png_size(p)
            if size:
                manifest["images"][p.stem] = {"w": size[0], "h": size[1]}

    snd_dir = png_root.parent / "sounds"
    if snd_dir.exists():
        for p in sorted(snd_dir.iterdir()):
            manifest["sounds"][p.stem] = {"file": p.name,
                                          "bytes": p.stat().st_size}

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(manifest, indent=1))
    n = sum(len(v["frames"]) for v in manifest["sprites"].values())
    print(f"wrote {out_path}: {len(manifest['sprites'])} sprites, {n} frames, "
          f"{len(manifest['images'])} images, {len(manifest['sounds'])} sounds")


if __name__ == "__main__":
    main()
