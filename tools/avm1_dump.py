#!/usr/bin/env python3
"""Minimal AVM1 (ActionScript 1/2) disassembler for SWF files.

Walks the tag stream (recursing into DefineSprite), finds DoAction / DoInitAction
tags, and disassembles them with ActionConstantPool references resolved to their
actual values. Also reports the non-standard tag 0xFD bodies.

Usage: avm1_dump.py <file.swf> [--tag-offset 0xNNNN] [--stats]
"""
import argparse
import struct
import sys
import zlib
from pathlib import Path

OPCODES = {
    0x00: ("End", 0), 0x04: ("NextFrame", 0), 0x05: ("PrevFrame", 0),
    0x06: ("Play", 0), 0x07: ("Stop", 0), 0x08: ("ToggleQuality", 0),
    0x09: ("StopSounds", 0), 0x0A: ("Add", 0), 0x0B: ("Subtract", 0),
    0x0C: ("Multiply", 0), 0x0D: ("Divide", 0), 0x0E: ("Equals", 0),
    0x0F: ("Less", 0), 0x10: ("And", 0), 0x11: ("Or", 0), 0x12: ("Not", 0),
    0x13: ("StringEquals", 0), 0x14: ("StringLength", 0),
    0x15: ("StringExtract", 0), 0x17: ("Pop", 0), 0x18: ("ToInteger", 0),
    0x1C: ("GetVariable", 0), 0x1D: ("SetVariable", 0),
    0x20: ("SetTarget2", 0), 0x21: ("StringAdd", 0),
    0x22: ("GetProperty", 0), 0x23: ("SetProperty", 0),
    0x24: ("CloneSprite", 0), 0x25: ("RemoveSprite", 0),
    0x26: ("Trace", 0), 0x27: ("StartDrag", 0), 0x28: ("EndDrag", 0),
    0x29: ("StringLess", 0), 0x2A: ("Throw", 0), 0x30: ("RandomNumber", 0),
    0x31: ("MBStringLength", 0), 0x32: ("CharToAscii", 0),
    0x33: ("AsciiToChar", 0), 0x34: ("GetTime", 0), 0x35: ("MBStringExtract", 0),
    0x36: ("MBCharToAscii", 0), 0x37: ("MBAsciiToChar", 0),
    0x3A: ("Delete", 0), 0x3B: ("Delete2", 0), 0x3C: ("DefineLocal", 0),
    0x3D: ("CallFunction", 0), 0x3E: ("Return", 0), 0x3F: ("Modulo", 0),
    0x40: ("NewObject", 0), 0x41: ("DefineLocal2", 0), 0x42: ("InitArray", 0),
    0x43: ("InitObject", 0), 0x44: ("TypeOf", 0), 0x45: ("TargetPath", 0),
    0x46: ("Enumerate", 0), 0x47: ("Add2", 0), 0x48: ("Less2", 0),
    0x49: ("Equals2", 0), 0x4A: ("ToNumber", 0), 0x4B: ("ToString", 0),
    0x4C: ("PushDuplicate", 0), 0x4D: ("StackSwap", 0), 0x4E: ("GetMember", 0),
    0x4F: ("SetMember", 0), 0x50: ("Increment", 0), 0x51: ("Decrement", 0),
    0x52: ("CallMethod", 0), 0x53: ("NewMethod", 0), 0x54: ("InstanceOf", 0),
    0x55: ("Enumerate2", 0), 0x60: ("BitAnd", 0), 0x61: ("BitOr", 0),
    0x62: ("BitXor", 0), 0x63: ("BitLShift", 0), 0x64: ("BitRShift", 0),
    0x65: ("BitURShift", 0), 0x66: ("StrictEquals", 0),
    0x67: ("Greater", 0), 0x68: ("StringGreater", 0), 0x69: ("Extends", 0),
    0x81: ("GotoFrame", 2), 0x83: ("GetURL", 0), 0x87: ("StoreRegister", 1),
    0x88: ("ConstantPool", 0), 0x8A: ("WaitForFrame", 3),
    0x8B: ("SetTarget", 0), 0x8C: ("GoToLabel", 0), 0x8D: ("WaitForFrame2", 1),
    0x8E: ("DefineFunction2", -1), 0x8F: ("DefineFunction", -1),
    0x94: ("With", 2), 0x96: ("Push", 0), 0x99: ("Jump", 2),
    0x9A: ("GetURL2", 1), 0x9B: ("DefineFunction2", -1), 0x9D: ("If", 2),
    0x9E: ("Call", 0), 0x9F: ("GotoFrame2", 1), 0xA0: ("SetTarget2", 0),
}

TAG_NAMES = {
    0: "End", 1: "ShowFrame", 2: "DefineShape", 4: "PlaceObject",
    5: "RemoveObject", 6: "DefineBits", 7: "DefineButton", 9: "SetBackgroundColor",
    10: "DefineFont", 11: "DefineText", 12: "DoAction", 13: "DefineFontInfo",
    14: "DefineSound", 15: "StartSound", 18: "SoundStreamHead",
    20: "DefineBitsLossless", 21: "DefineBitsJPEG2", 22: "DefineShape2",
    26: "PlaceObject2", 28: "RemoveObject2", 32: "DefineShape3",
    33: "DefineText2", 34: "DefineButton2", 35: "DefineBitsJPEG3",
    36: "DefineBitsLossless2", 37: "DefineEditText", 39: "DefineSprite",
    43: "FrameLabel", 45: "SoundStreamHead2", 46: "DefineMorphShape",
    48: "DefineFont2", 56: "ExportAssets", 57: "ImportAssets",
    59: "DoInitAction", 62: "DefineFontInfo2", 69: "FileAttributes",
    70: "PlaceObject3", 71: "ImportAssets2", 76: "SymbolClass",
    77: "Metadata", 88: "DefineFontName",
}

PUSH_TYPES = {0: "s", 1: "f", 2: "null", 3: "undef", 4: "reg",
              5: "bool", 6: "double", 7: "int", 8: "c8", 9: "c16"}


def load(path):
    raw = Path(path).read_bytes()
    if raw[:3] == b"CWS":
        return raw[:8], zlib.decompress(raw[8:])
    if raw[:3] == b"ZWS":
        return raw[:8], zlib.decompress(raw[8:], -15)
    return raw[:8], raw[8:]


def iter_tags(buf, start, end=None):
    i = start
    n = end if end is not None else len(buf)
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


def fmt_bytes(b, limit=60):
    try:
        s = b.decode("utf-8")
        if all(0x20 <= ord(c) <= 0x7E or c in "\t" for c in s) and s:
            return repr(s)
    except UnicodeDecodeError:
        pass
    if all(32 <= x < 127 for x in b) and b:
        return f'"{b.decode("latin1")}"'
    h = b.hex(" ")
    return f"<{len(b)}B {h if len(h) <= limit else h[:limit] + ' ...'}>"


def parse_push(payload):
    out, i = [], 0
    while i < len(payload):
        t = payload[i]
        i += 1
        if t == 0:
            k = payload.find(b"\x00", i)
            k = len(payload) if k < 0 else k
            out.append(("str", payload[i:k]))
            i = k + 1
        elif t == 1:
            out.append(("float", struct.unpack_from("<f", payload, i)[0]))
            i += 4
        elif t in (2, 3):
            out.append((PUSH_TYPES[t], None))
        elif t == 4:
            out.append(("reg", payload[i]))
            i += 1
        elif t == 5:
            out.append(("bool", bool(payload[i])))
            i += 1
        elif t == 6:
            out.append(("double", struct.unpack_from("<d", payload, i)[0]))
            i += 8
        elif t == 7:
            out.append(("int", struct.unpack_from("<i", payload, i)[0]))
            i += 4
        elif t == 8:
            out.append(("c8", payload[i]))
            i += 1
        elif t == 9:
            out.append(("c16", struct.unpack_from("<H", payload, i)[0]))
            i += 2
        else:
            out.append((f"?type{t}", None))
            break
    return out


class Dis:
    """Disassemble one action stream, tracking the constant pool."""

    def __init__(self, buf, start, end):
        self.buf, self.start, self.end = buf, start, end
        self.pool = []

    def cval(self, idx):
        if 0 <= idx < len(self.pool):
            return fmt_bytes(self.pool[idx])
        return f"c{idx}(?)"

    def run(self, out):
        buf, i, end = self.buf, self.start, self.end
        while i < end:
            op = buf[i]
            info = OPCODES.get(op)
            if info is None:
                out.append((i, f"  !! unknown opcode 0x{op:02x} - stopping"))
                return out
            name, extra = info
            if op == 0x96:  # Push
                ln = struct.unpack_from("<H", buf, i + 1)[0]
                vals = parse_push(buf[i + 3:i + 3 + ln])
                rendered = []
                for k, v in vals:
                    if k in ("c8", "c16"):
                        rendered.append(f"[{k}:{v}]={self.cval(v)}")
                    elif k == "str":
                        rendered.append(fmt_bytes(v))
                    else:
                        rendered.append(f"{k}:{v}")
                out.append((i, "Push " + ", ".join(rendered)))
                i += 3 + ln
            elif op == 0x88:  # ConstantPool
                ln = struct.unpack_from("<H", buf, i + 1)[0]
                cnt = struct.unpack_from("<H", buf, i + 3)[0]
                self.pool, j = [], i + 5
                stop = i + 3 + ln
                while j < stop and len(self.pool) < cnt:
                    k = buf.find(b"\x00", j, stop)
                    k = stop if k < 0 else k
                    self.pool.append(bytes(buf[j:k]))
                    j = k + 1
                out.append((i, f"ConstantPool n={cnt}"))
                for n, s in enumerate(self.pool):
                    out.append((i, f"    [{n:3d}] {fmt_bytes(s)}"))
                i += 3 + ln
            elif name == "DefineFunction" or name == "DefineFunction2":
                ln = struct.unpack_from("<H", buf, i + 1)[0]
                body = buf[i + 3:i + 3 + ln]
                bodyend = i + 3 + ln
                try:
                    if op in (0x8E, 0x9B):  # DefineFunction2
                        nparams = struct.unpack_from("<H", body, 0)[0]
                        wide = bool(nparams & 0x8000)
                        nparams &= 0x7FFF
                        p = 2
                        for _ in range(nparams):
                            if wide:
                                p += 2
                            p += 1
                            if p <= len(body):
                                q = body.find(b"\x00", p)
                                p = (q + 1) if q >= 0 else p
                        p += 2  # RegisterCount
                        k = body.find(b"\x00", p)
                        fname = body[p:k] if k >= 0 else b""
                        codestart = i + 3 + (k + 1)
                    else:
                        k = body.find(b"\x00", 0)
                        fname = body[0:k] if k >= 0 else b""
                        nparams = struct.unpack_from("<H", body, k + 1)[0]
                        p = k + 3
                        for _ in range(nparams):
                            q = body.find(b"\x00", p)
                            p = (q + 1) if q >= 0 else p
                        codestart = i + 3 + p
                    if not (i < codestart < bodyend):
                        raise ValueError("bad offset")
                    sub = Dis(buf, codestart, bodyend)
                    sub.pool = self.pool
                    inner = sub.run([])
                    out.append((i, f"{name} {fmt_bytes(fname)} [{len(inner)} ops] {{"))
                    for off, line in inner:
                        out.append((off, "    " + line))
                    out.append((i, "}"))
                except Exception as e:  # noqa: BLE001 - best effort disassembly
                    out.append((i, f"{name} <unparsed: {e}>"))
                i = bodyend
            elif name in ("Jump", "If", "With"):
                d = struct.unpack_from("<h", buf, i + 1)[0]
                tgt = i + 3 + d
                out.append((i, f"{name} -> loc{tgt:04x} (delta {d:+d})"))
                i += 3
            elif name == "GotoFrame":
                out.append((i, f"GotoFrame {struct.unpack_from('<H', buf, i+1)[0]}"))
                i += 5
            elif name in ("WaitForFrame", "SetTabIndex"):
                out.append((i, f"{name} {struct.unpack_from('<H', buf, i+1)[0]}, {buf[i+3]}"))
                i += 4
            elif name == "StoreRegister":
                out.append((i, f"StoreRegister r{buf[i+1]}"))
                i += 2
            elif name == "GetURL":
                j = i + 1
                k = buf.find(b"\x00", j, end)
                url = buf[j:k]
                j = k + 1
                k = buf.find(b"\x00", j, end)
                out.append((i, f'GetURL "{url.decode("latin1")}" target="{buf[j:k].decode("latin1")}"'))
                i = k + 1
            elif op == 0x9A:
                out.append((i, f"GetURL2 {buf[i+1]}"))
                i += 2
            elif op == 0x9F:
                out.append((i, f"GotoFrame2 {buf[i+1]}"))
                i += 2
            elif name == "GoToLabel":
                j = i + 1
                k = buf.find(b"\x00", j, end)
                out.append((i, f'GoToLabel "{buf[j:k].decode("latin1")}"'))
                i = k + 1
            elif name == "WaitForFrame2":
                out.append((i, f"WaitForFrame2 skip={buf[i+1]}"))
                i += 2
            elif name == "SetTarget":
                j = i + 1
                k = buf.find(b"\x00", j, end)
                out.append((i, f'SetTarget "{buf[j:k].decode("latin1")}"'))
                i = k + 1
            else:
                out.append((i, name))
                i += 1
        return out


def walk(buf, tags_start, label, out, stats, depth=0):
    pad = "  " * depth
    for code, ln, poff in iter_tags(buf, tags_start):
        stats[code] = stats.get(code, 0) + 1
        nm = TAG_NAMES.get(code, f"??{code}")
        if code in (12, 59):
            pre = ""
            if code == 59:
                pre = f" spriteId={struct.unpack_from('<H', buf, poff)[0]}"
            out.append(f"{pad}### {nm} @0x{poff:06x} len={ln}{pre}")
            d = Dis(buf, poff + (2 if code == 59 else 0), poff + ln)
            for off, line in d.run([]):
                out.append(f"{pad}  0x{off:06x}  {line}")
            out.append("")
        elif code == 39:  # DefineSprite
            sid = struct.unpack_from("<H", buf, poff)[0]
            nframes = struct.unpack_from("<H", buf, poff + 2)[0]
            out.append(f"{pad}--- DefineSprite id={sid} frames={nframes} ---")
            walk(buf, poff + 4, label, out, stats, depth + 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--stats", action="store_true")
    ap.add_argument("-o", "--out")
    a = ap.parse_args()

    hdr, body = load(a.file)
    rl = 5 + 4 * (body[0] >> 3)
    tags_start = (rl + 7) // 8 + 4
    out = [f"# {a.file}  sig={hdr[:3].decode()} v{hdr[3]} body={len(body)}"]
    stats = {}
    walk(body, tags_start, "root", out, stats)
    text = "\n".join(out)
    if a.out:
        Path(a.out).write_text(text)
        print(f"wrote {a.out} ({len(out)} lines)")
    else:
        print(text)
    if a.stats:
        print("\n# tag census:")
        for c, n in sorted(stats.items(), key=lambda kv: -kv[1]):
            print(f"  {c:4d} {TAG_NAMES.get(c, ''):22s} {n}")


if __name__ == "__main__":
    main()
