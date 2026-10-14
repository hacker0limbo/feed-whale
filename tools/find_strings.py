#!/usr/bin/env python3
"""Locate readable ActionScript identifiers in a SWF and report which tag holds them."""
import struct
import sys
import zlib
from pathlib import Path

TAG_NAMES = {0: "End", 1: "ShowFrame", 2: "DefineShape", 4: "PlaceObject",
             5: "RemoveObject", 6: "DefineBits", 7: "DefineButton",
             9: "SetBackgroundColor", 10: "DefineFont", 11: "DefineText",
             12: "DoAction", 13: "DefineFontInfo", 14: "DefineSound",
             15: "StartSound", 18: "SoundStreamHead", 20: "DefineBitsLossless",
             21: "DefineBitsJPEG2", 22: "DefineShape2", 26: "PlaceObject2",
             28: "RemoveObject2", 32: "DefineShape3", 33: "DefineText2",
             34: "DefineButton2", 35: "DefineBitsJPEG3", 36: "DefineBitsLossless2",
             37: "DefineEditText", 39: "DefineSprite", 43: "FrameLabel",
             45: "SoundStreamHead2", 46: "DefineMorphShape", 48: "DefineFont2",
             56: "ExportAssets", 57: "ImportAssets", 59: "DoInitAction",
             62: "DefineFontInfo2", 69: "FileAttributes", 70: "PlaceObject3",
             71: "ImportAssets2", 76: "SymbolClass", 77: "Metadata",
             88: "DefineFontName"}


def load(path):
    raw = Path(path).read_bytes()
    return raw[:8], (zlib.decompress(raw[8:]) if raw[:3] == b"CWS" else raw[8:])


def iter_tags(buf, start, end=None):
    i, n = start, (end if end is not None else len(buf))
    while i + 2 <= n:
        v = struct.unpack_from("<H", buf, i)[0]
        code, ln, hdr = v >> 6, v & 0x3F, 2
        if ln == 0x3F:
            if i + 6 > n:
                return
            ln = struct.unpack_from("<I", buf, i + 2)[0]
            hdr = 6
        yield code, ln, i + hdr
        i += hdr + ln
        if code == 0:
            return


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "swf/Qua01.swf"
    needles = sys.argv[2:] or ["hungryBar", "eatable_mc", "makeEnemy", "getEatLevel",
                               "startGame", "aqua_mc", "hitArea", "scorenum",
                               "s_eat1", "Digit", "Fish", "Player", "player"]
    hdr, body = load(path)
    tags_start = (5 + 4 * (body[0] >> 3) + 7) // 8 + 4

    # index every tag (top-level and inside sprites) with byte ranges
    records = []

    def collect(buf, start, depth=0, path_="root"):
        for code, ln, poff in iter_tags(buf, start):
            records.append((path_, code, ln, poff))
            if code == 39:
                sid = struct.unpack_from("<H", buf, poff)[0]
                collect(buf, poff + 4, depth + 1, f"{path_}/sprite{sid}")

    collect(body, tags_start)

    print(f"{path}: {len(records)} tag records (incl. sprite contents)")

    for needle in needles:
        nb = needle.encode()
        hits = []
        pos = body.find(nb)
        while pos >= 0 and len(hits) < 6:
            owner = None
            for pth, code, ln, poff in records:
                if poff <= pos < poff + ln:
                    owner = (pth, code, str(TAG_NAMES.get(code, code)), poff, ln, pos - poff)
                    break
            hits.append(owner)
            pos = body.find(nb, pos + 1)
        print(f"\n=== {needle!r} : {len(hits)} shown ===")
        for h in hits:
            if h is None:
                print("   (outside any tag payload)")
            else:
                pth, code, nm, poff, ln, rel = h
                print(f"   {pth:22s} tag {code:3d} {nm:20s} @0x{poff:06x} len={ln:6d} off_in_tag={rel}")

    # find every plausible ActionConstantPool
    print("\n=== ActionConstantPool scan (whole decompressed body) ===")
    found = 0
    for i in range(len(body) - 6):
        if body[i] != 0x88:
            continue
        ln = struct.unpack_from("<H", body, i + 1)[0]
        if ln < 3 or i + 3 + ln > len(body):
            continue
        cnt = struct.unpack_from("<H", body, i + 3)[0]
        chunk = body[i + 5:i + 3 + ln]
        parts = chunk.split(b"\x00")
        if parts and parts[-1] == b"":
            parts = parts[:-1]
        if 0 < cnt <= 4096 and len(parts) == cnt and sum(len(p) for p in parts) + cnt == len(chunk):
            found += 1
            if found <= 12:
                owner = next((f"{p}({TAG_NAMES.get(c, c)})" for p, c, l, o in records if o <= i < o + l), "?")
                print(f"  @0x{i:06x} len={ln} count={cnt} in {owner}")
                for p in parts[:10]:
                    try:
                        print(f"      {p.decode('utf-8')!r}")
                    except UnicodeDecodeError:
                        print(f"      <{len(p)}B> {p[:20].hex(' ')}")
    print(f"  total valid-looking constant pools: {found}")


if __name__ == "__main__":
    main()
