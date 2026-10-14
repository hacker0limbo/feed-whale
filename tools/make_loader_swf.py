#!/usr/bin/env python3
"""Generate a tiny loader SWF that pulls in the game and its resource file.

Qua01.swf reaches its UI through `ImportAssets("game/lang/Qua_RES.swf", ...)`,
and Flash resolves those symbols from movies already loaded in the *same* player,
so the two files cannot simply be opened one after the other — a loader has to
stack them into levels of one player instance.

The loader it writes:
    frame 1   : loadMovieNum("game/lang/Qua_RES.swf", 1)
    frame 2..61: idle (about two seconds at 30 fps, enough for a local file)
    frame 62  : loadMovieNum("Qua01.swf", 2)
    frame 63  : stop()

Usage: make_loader_swf.py <out.swf> [stage_w stage_h]
"""
import struct
import sys
import zlib
from pathlib import Path

STAGE_W, STAGE_H = 550, 450
FPS = 30
WAIT_FRAMES = 60


def rect(x1, y1, x2, y2):
    """Encode an SWF RECT of whole-twip coordinates."""
    vals = [x1 * 20, x2 * 20, y1 * 20, y2 * 20]
    nbits = max(v.bit_length() + (1 if v < 0 else 0) for v in vals) or 1
    bits = format(nbits, "05b")
    for v in vals:
        if v < 0:
            v += 1 << nbits
        bits += format(v, f"0{nbits}b")
    bits += "0" * ((8 - len(bits) % 8) % 8)
    return bytes(int(bits[i:i + 8], 2) for i in range(0, len(bits), 8))


def push_string(s):
    b = s.encode("utf-8") + b"\x00"
    return b"\x96" + struct.pack("<H", len(b) + 1) + b"\x00" + b


def push_int(v):
    return b"\x96" + struct.pack("<H", 5) + b"\x07" + struct.pack("<i", v)


def load_movie_num(url, level):
    """`loadMovieNum(url, level)` compiles to Push url, Push target, GetURL2 0x80.

    GetURL2 pops the target first and the url second, so the url has to be pushed
    first; verified by decompiling the generated loader with ffdec.
    """
    return push_string(url) + push_string(f"_level{level}") + b"\x9a\x80"


def tag(code, payload=b""):
    if len(payload) < 0x3F:
        return struct.pack("<H", (code << 6) | len(payload)) + payload
    return struct.pack("<H", (code << 6) | 0x3F) + struct.pack("<I", len(payload)) + payload


def action(payload):
    return tag(12, payload)


def main():
    out = Path(sys.argv[1])
    w = int(sys.argv[2]) if len(sys.argv) > 2 else STAGE_W
    h = int(sys.argv[3]) if len(sys.argv) > 3 else STAGE_H

    body = b""
    body += rect(0, 0, w, h)
    body += struct.pack("<H", (FPS << 8) | 0)          # 8.8 fixed: fraction, integer
    body += struct.pack("<H", WAIT_FRAMES + 3)         # frame count

    body += tag(9, bytes((0x00, 0x33, 0x66)))          # SetBackgroundColor

    # frame 1 — start the resource movie
    body += action(load_movie_num("game/lang/Qua_RES.swf", 1))
    body += tag(1)

    # idle frames so the 165 KB resource file finishes loading
    body += tag(1) * WAIT_FRAMES

    # frame 62 — now start the game itself
    body += action(load_movie_num("Qua01.swf", 2) + b"\x07")   # trailing Stop
    body += tag(1)
    body += tag(0)                                     # End

    header = b"FWS" + bytes((7,)) + struct.pack("<I", 8 + len(body))
    raw = header + body
    out.write_bytes(raw)
    print(f"wrote {out} ({len(raw)} bytes, {WAIT_FRAMES + 3} frames, {w}x{h}@{FPS})")


if __name__ == "__main__":
    main()
