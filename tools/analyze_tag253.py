#!/usr/bin/env python3
"""Analyse the non-standard SWF tag 253 (0xFD) found in Qua01.swf.

Reads the SWF from argv[1] (default ../swf/Qua01.swf), inflates it in memory and
walks the tag stream, recursing into DefineSprite. For every tag 253 it prints a
structural summary and tries to locate AVM1 action records inside the body.
"""
import sys
import zlib
import struct
from pathlib import Path

TAG_NAMES = {
    0: "End", 1: "ShowFrame", 2: "DefineShape", 3: "FreeCharacter",
    4: "PlaceObject", 5: "RemoveObject", 6: "DefineBits", 7: "DefineButton",
    8: "JPEGTables", 9: "SetBackgroundColor", 10: "DefineFont",
    11: "DefineText", 12: "DoAction", 13: "DefineFontInfo", 14: "DefineSound",
    15: "StartSound", 17: "DefineButtonSound", 18: "SoundStreamHead",
    19: "SoundStreamBlock", 20: "DefineBitsLossless", 21: "DefineBitsJPEG2",
    22: "DefineShape2", 23: "DefineButtonCxform", 24: "Protect",
    26: "PlaceObject2", 28: "RemoveObject2", 32: "DefineShape3",
    33: "DefineText2", 34: "DefineButton2", 35: "DefineBitsJPEG3",
    36: "DefineBitsLossless2", 37: "DefineEditText", 39: "DefineSprite",
    43: "FrameLabel", 45: "SoundStreamHead2", 46: "DefineMorphShape",
    48: "DefineFont2", 56: "ExportAssets", 57: "ImportAssets",
    58: "EnableDebugger", 59: "DoInitAction", 60: "DefineVideoStream",
    61: "VideoFrame", 62: "DefineFontInfo2", 64: "EnableDebugger2",
    65: "ScriptLimits", 66: "SetTabIndex", 69: "FileAttributes",
    70: "PlaceObject3", 71: "ImportAssets2", 73: "DefineFontAlignZones",
    74: "CSMTextSettings", 75: "DefineFont3", 76: "SymbolClass",
    77: "Metadata", 78: "DefineScalingGrid", 82: "DoABC", 83: "DefineShape4",
    84: "DefineMorphShape2", 86: "DefineSceneAndFrameLabelData",
    87: "DefineBinaryData", 88: "DefineFontName", 89: "StartSound2",
    90: "DefineBitsJPEG4", 91: "DefineFont4",
}

# AVM1 opcodes we care about
OP = {
    0x00: "End", 0x04: "NextFrame", 0x07: "Play", 0x08: "Stop",
    0x0A: "Add", 0x0B: "Subtract", 0x0C: "Multiply", 0x0D: "Divide",
    0x0E: "Equals", 0x0F: "Less", 0x10: "And", 0x11: "Or", 0x12: "Not",
    0x13: "StringEquals", 0x14: "StringLength", 0x15: "StringExtract",
    0x17: "Pop", 0x18: "ToInteger", 0x1C: "GetVariable", 0x1D: "SetVariable",
    0x20: "SetTarget2", 0x21: "StringAdd", 0x22: "GetProperty",
    0x23: "SetProperty", 0x24: "CloneSprite", 0x25: "RemoveSprite",
    0x26: "Trace", 0x27: "StartDrag", 0x28: "EndDrag", 0x29: "StringLess",
    0x30: "RandomNumber", 0x31: "MBStringLength", 0x32: "CharToAscii",
    0x33: "AsciiToChar", 0x34: "GetTime", 0x35: "MBStringExtract",
    0x36: "MBCharToAscii", 0x37: "MBAsciiToChar", 0x3A: "Delete",
    0x3B: "Delete2", 0x3C: "DefineLocal", 0x3D: "CallFunction",
    0x3E: "Return", 0x3F: "Modulo", 0x40: "NewObject", 0x41: "DefineLocal2",
    0x42: "InitArray", 0x43: "InitObject", 0x44: "TypeOf", 0x45: "TargetPath",
    0x46: "Enumerate", 0x47: "Add2", 0x48: "Less2", 0x49: "Equals2",
    0x4A: "ToNumber", 0x4B: "ToString", 0x4C: "PushDuplicate",
    0x4D: "StackSwap", 0x4E: "GetMember", 0x4F: "SetMember",
    0x50: "Increment", 0x51: "Decrement", 0x52: "CallMethod",
    0x53: "NewMethod", 0x54: "InstanceOf", 0x55: "Enumerate2",
    0x60: "BitAnd", 0x61: "BitOr", 0x62: "BitXor", 0x63: "BitLShift",
    0x64: "BitRShift", 0x65: "BitURShift", 0x66: "StrictEquals",
    0x67: "Greater", 0x68: "StringGreater", 0x69: "Extends",
    0x81: "GotoFrame", 0x83: "GetURL", 0x87: "StoreRegister",
    0x88: "ConstantPool", 0x8A: "WaitForFrame", 0x8B: "SetTarget",
    0x8C: "GoToLabel", 0x8D: "WaitForFrame2", 0x8E: "DefineFunction2",
    0x8F: "DefineFunction", 0x94: "With", 0x96: "Push", 0x99: "Jump",
    0x9A: "GetURL2", 0x9B: "DefineFunction2b", 0x9D: "If", 0x9E: "Call",
    0x9F: "GotoFrame2", 0xA0: "SetTabIndex", 0xA1: "UnknownA1",
    0xA2: "UnknownA2", 0xA3: "UnknownA3", 0xA4: "UnknownA4",
}

PUSH_TYPES = {
    0: "str", 1: "float", 2: "null", 3: "undef", 4: "reg",
    5: "bool", 6: "double", 7: "int", 8: "const8", 9: "const16",
}


def load(path):
    raw = Path(path).read_bytes()
    sig = raw[:3]
    body = zlib.decompress(raw[8:]) if sig == b"CWS" else raw[8:]
    return raw[:8], body


def read_rect_len(body):
    """Return bit length of the stage Rect so we can skip it."""
    nbits = body[0] >> 3
    return 5 + nbits * 4


def iter_tags(buf, start=0):
    """Yield (code, length, payload_offset, payload_len) for a tag stream."""
    i = start
    n = len(buf)
    while i + 2 <= n:
        code_len = struct.unpack_from("<H", buf, i)[0]
        code = code_len >> 6
        ln = code_len & 0x3F
        hdr = 2
        if ln == 0x3F:
            if i + 6 > n:
                return
            ln = struct.unpack_from("<I", buf, i + 2)[0]
            hdr = 6
        yield code, ln, i + hdr, hdr
        i += hdr + ln
        if code == 0:
            return


def hexs(b, n=48):
    h = b[:n].hex(" ")
    return h if len(b) <= n else h + " ..."


def scan_action_records(buf, off, end, depth=0, out=None):
    """Walk an AVM1 action stream, recording opcodes and constant pools."""
    if out is None:
        out = []
    i = off
    while i < end:
        op = buf[i]
        name = OP.get(op)
        if name is None:
            out.append((i, op, f"UNKNOWN(op=0x{op:02x})", None))
            break
        if op in (0x96,):  # Push
            if i + 3 > end:
                break
            ln = struct.unpack_from("<H", buf, i + 1)[0]
            vals = parse_push(buf[i + 3:i + 3 + ln])
            out.append((i, op, f"Push {vals}", ln))
            i += 3 + ln
        elif op == 0x88:  # ConstantPool
            if i + 3 > end:
                break
            ln = struct.unpack_from("<H", buf, i + 1)[0]
            cnt = struct.unpack_from("<H", buf, i + 3)[0]
            strings = []
            j = i + 5
            stop = i + 3 + ln
            while j < stop and len(strings) < cnt:
                k = buf.index(b"\x00", j) if b"\x00" in buf[j:stop] else stop
                strings.append(buf[j:k])
                j = k + 1
            out.append((i, op, f"ConstantPool count={cnt}", None))
            for s in strings:
                out.append((i, 0x88, None, s))
            i += 3 + ln
        else:
            if op in (0x99, 0x9D):  # Jump / If have 2-byte operand
                out.append((i, op, name, struct.unpack_from("<h", buf, i + 1)[0] if i + 3 <= end else None))
                i += 3
            elif op == 0x81:  # GotoFrame
                out.append((i, op, name, None))
                i += 5
            elif op == 0x8C:
                out.append((i, op, name, None))
                i += 3
            elif op in (0x9E,):
                out.append((i, op, name, None))
                i += 1
            elif op == 0x87:
                out.append((i, op, name, None))
                i += 2
            elif op == 0x83:
                out.append((i, op, name, None))
                j = i + 1
                for _ in range(2):
                    k = buf.index(b"\x00", j)
                    out.append((0, 0, "  url/target", buf[j:k]))
                    j = k + 1
                i = j
            elif op == 0x94:
                out.append((i, op, name, struct.unpack_from("<H", buf, i + 1)[0] if i + 3 <= end else None))
                i += 3
            else:
                out.append((i, op, name, None))
                i += 1
    return out


def parse_push(data):
    vals = []
    i = 0
    while i < len(data):
        t = data[i]
        i += 1
        kind = PUSH_TYPES.get(t, f"?{t}")
        if t == 0:
            k = data.find(b"\x00", i)
            if k < 0:
                k = len(data)
            vals.append(("str", data[i:k]))
            i = k + 1
        elif t == 1:
            vals.append(("float", struct.unpack_from("<f", data + b"\x00" * 4, i)[0]))
            i += 4
        elif t in (2, 3):
            vals.append((kind, None))
        elif t == 4:
            vals.append(("reg", data[i]))
            i += 1
        elif t == 5:
            vals.append(("bool", bool(data[i])))
            i += 1
        elif t == 6:
            vals.append(("double", struct.unpack_from("<d", data + b"\x00" * 8, i)[0]))
            i += 8
        elif t == 7:
            vals.append(("int", struct.unpack_from("<i", data + b"\x00" * 4, i)[0]))
            i += 4
        elif t == 8:
            vals.append(("c8", data[i]))
            i += 1
        elif t == 9:
            vals.append(("c16", struct.unpack_from("<H", data + b"\x00" * 2, i)[0]))
            i += 2
        else:
            break
    return vals


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "../swf/Qua01.swf"
    hdr, body = load(path)
    print(f"file: {path}")
    print(f"header: {hdr[:3]} v{hdr[3]} len={struct.unpack_from('<I', hdr, 4)[0]}")
    print(f"decompressed body: {len(body)} bytes")
    rl = read_rect_len(body)
    rect_bytes = (rl + 7) // 8
    tags_start = rect_bytes + 4  # + FrameRate(2) + FrameCount(2)
    fps_raw = struct.unpack_from("<H", body, rect_bytes)[0]
    frames = struct.unpack_from("<H", body, rect_bytes + 2)[0]
    print(f"stage rect: {rl} bits -> {rect_bytes} bytes; tags start at {tags_start}")
    print(f"frame rate: {fps_raw >> 8}.{fps_raw & 0xFF} fps   frame count: {frames}")
    print()

    tag253 = []
    top = []
    for code, ln, poff, hdr_len in iter_tags(body, tags_start):
        top.append((code, ln, poff))
        if code == 253:
            tag253.append((poff, ln))
    print(f"top-level tags: {len(top)};  tag253 found: {len(tag253)}")
    print()

    for idx, (poff, ln) in enumerate(tag253):
        payload = body[poff:poff + ln]
        print("=" * 78)
        print(f"[tag253 #{idx}] offset=0x{poff:06x} len={ln}")
        print(f"  first 48: {hexs(payload, 48)}")
        print(f"  last  64: {payload[-64:].hex(' ')}")

        # look for ActionConstantPool marker 0x88 followed by a plausible length
        found = []
        for i in range(len(payload) - 3):
            if payload[i] == 0x88:
                l2 = struct.unpack_from("<H", payload, i + 1)[0]
                if 3 + l2 <= len(payload) - i - 3 and l2 >= 2:
                    found.append(i)
        print(f"  0x88 @ {[hex(x) for x in found[:8]]}")

        # scan for a readable-suffix boundary: find first index from which the
        # remaining bytes parse as a valid AVM1 stream
        best = None
        for start in range(0, min(len(payload), 4096)):
            recs = scan_action_records(payload, start, len(payload))
            if not recs:
                continue
            ok = sum(1 for r in recs if r[2] is not None and "UNKNOWN" not in str(r[2]))
            if recs and recs[-1][2] == "End":
                best = (start, len(recs), ok)
                break
        print(f"  first offset parsing to a terminated AVM1 stream: {best}")

        if best:
            start = best[0]
            print(f"  --- plaintext region starts at +{start} (0x{start:x}) ---")
            recs = scan_action_records(payload, start, len(payload))
            ops = {}
            for r in recs:
                if r[2]:
                    key = str(r[2]).split()[0] if r[1] != 0x88 else "ConstantPool"
                    ops[key] = ops.get(key, 0) + 1
            print("  opcode histogram:", dict(sorted(ops.items(), key=lambda kv: -kv[1])[:18]))
            cps = [r for r in recs if r[1] == 0x88 and r[2] is None]
            print(f"  constant-pool strings in plaintext region: {len(cps)}")
            for r in cps[:80]:
                s = r[3]
                try:
                    txt = s.decode("ascii")
                    print(f"      {txt!r}")
                except UnicodeDecodeError:
                    print(f"      <bin {len(s)}B> {s[:24].hex(' ')}")
        print()

    # what follows each tag253
    print("=" * 78)
    print("tag253 -> following tags")
    for i, (code, ln, poff) in enumerate(top):
        if code == 253:
            nxt = top[i + 1:i + 3]
            names = ", ".join(f"{TAG_NAMES.get(c, c)}({l})" for c, l, _ in nxt)
            print(f"  #{i:3d} 253({ln:6d}) -> {names}")


if __name__ == "__main__":
    main()
