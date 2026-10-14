#!/usr/bin/env python3
"""CFG-following AVM1 disassembler for SWF files, with constant-pool resolution.

The SWFs in this project were run through an AS2 obfuscator that
  * renames locals/members to random binary strings (kept in an inline
    ActionConstantPool -- the names are opaque but *consistent*),
  * flattens control flow into a `while(true){ if(pc==K) ... }` dispatcher,
  * inserts 2-byte dead fillers that are jumped over.

A naive linear disassembler desyncs on those dead bytes, so this one walks the
control-flow graph: decode from an entry point, follow Jump/If targets, and treat
everything unreachable as decoration.

Usage: avm1_cfg.py <file.swf> [-o out.txt] [--sprite N] [--stats]
"""
import argparse
import struct
import zlib
from pathlib import Path

OPCODES = {
    0x00: "End", 0x04: "NextFrame", 0x05: "PrevFrame", 0x06: "Play",
    0x07: "Stop", 0x08: "ToggleQuality", 0x09: "StopSounds", 0x0A: "Add",
    0x0B: "Subtract", 0x0C: "Multiply", 0x0D: "Divide", 0x0E: "Equals",
    0x0F: "Less", 0x10: "And", 0x11: "Or", 0x12: "Not",
    0x13: "StringEquals", 0x14: "StringLength", 0x15: "StringExtract",
    0x17: "Pop", 0x18: "ToInteger", 0x1C: "GetVariable",
    0x1D: "SetVariable", 0x20: "SetTarget2", 0x21: "StringAdd",
    0x22: "GetProperty", 0x23: "SetProperty", 0x24: "CloneSprite",
    0x25: "RemoveSprite", 0x26: "Trace", 0x27: "StartDrag", 0x28: "EndDrag",
    0x29: "StringLess", 0x2A: "Throw", 0x30: "RandomNumber",
    0x31: "MBStringLength", 0x32: "CharToAscii", 0x33: "AsciiToChar",
    0x34: "GetTime", 0x35: "MBStringExtract", 0x36: "MBCharToAscii",
    0x37: "MBAsciiToChar", 0x3A: "Delete", 0x3B: "Delete2",
    0x3C: "DefineLocal", 0x3D: "CallFunction", 0x3E: "Return",
    0x3F: "Modulo", 0x40: "NewObject", 0x41: "DefineLocal2",
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
    0x9A: "GetURL2", 0x9B: "DefineFunction2", 0x9D: "If", 0x9E: "Call",
    0x9F: "GotoFrame2", 0xA0: "SetTarget2_",
}

TAG_NAMES = {
    0: "End", 1: "ShowFrame", 2: "DefineShape", 4: "PlaceObject",
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
    88: "DefineFontName",
}

BINARY = {}  # bytes -> friendly alias, filled by the name table


def load(path):
    raw = Path(path).read_bytes()
    if raw[:3] == b"CWS":
        return raw[:8], zlib.decompress(raw[8:])
    return raw[:8], raw[8:]


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


def show(b):
    """Render a pool entry / literal string."""
    if b is None:
        return "undefined"
    alias = BINARY.get(b)
    if alias:
        return alias
    if b == b"":
        return '""'
    try:
        s = b.decode("utf-8")
        if all(0x20 <= ord(c) < 0x7F for c in s):
            return '"' + s + '"'
    except UnicodeDecodeError:
        pass
    return "«" + b.hex() + "»"


class Stream:
    """Decode one AVM1 stream into a reachable-instruction map."""

    def __init__(self, buf, start, end, pool=None, label=""):
        self.buf, self.start, self.end = buf, start, end
        self.pool = list(pool or [])
        self.label = label
        self.ins = {}      # addr -> text (list of lines)
        self.order = []    # addr in ascending order
        self.pools = []    # (addr, count)

    # -- decoding ---------------------------------------------------------
    def decode(self, addr):
        """Return (length, lines) for the instruction at addr."""
        b, buf, end = self.buf, self.buf, self.end
        op = b[addr]
        name = OPCODES.get(op)
        if name is None:
            return 1, [f"@DAT 0x{op:02x}"]
        if op == 0x96:
            ln = struct.unpack_from("<H", buf, addr + 1)[0]
            vals = self.parse_push(buf[addr + 3:addr + 3 + ln])
            return 3 + ln, ["Push " + ", ".join(vals)]
        if op == 0x88:
            ln = struct.unpack_from("<H", buf, addr + 1)[0]
            cnt = struct.unpack_from("<H", buf, addr + 3)[0]
            self.pool = []
            p, stop = addr + 5, addr + 3 + ln
            while p < stop and len(self.pool) < cnt:
                k = buf.find(b"\x00", p, stop)
                k = stop if k < 0 else k
                self.pool.append(bytes(buf[p:k]))
                p = k + 1
            self.pools.append((addr, cnt))
            return 3 + ln, [f"/* ConstantPool n={cnt} */"] + [
                f"/*   [{i:3d}] {show(s)} */" for i, s in enumerate(self.pool)]
        if name in ("DefineFunction", "DefineFunction2"):
            ln = struct.unpack_from("<H", buf, addr + 1)[0]
            body = buf[addr + 3:addr + 3 + ln]
            bodyend = addr + 3 + ln
            fname, codeoff = b"", None
            try:
                if op in (0x8E, 0x9B):
                    np = struct.unpack_from("<H", body, 0)[0]
                    wide = bool(np & 0x8000)
                    np &= 0x7FFF
                    p = 2
                    for _ in range(np):
                        p += 2 if wide else 1
                        q = body.find(b"\x00", p)
                        p = q + 1 if q >= 0 else p
                    p += 2
                    q = body.find(b"\x00", p)
                    fname = body[p:q]
                    codeoff = addr + 3 + q + 1
                else:
                    q = body.find(b"\x00", 0)
                    fname = body[0:q]
                    np = struct.unpack_from("<H", body, q + 1)[0]
                    p = q + 3
                    for _ in range(np):
                        r = body.find(b"\x00", p)
                        p = r + 1 if r >= 0 else p
                    codeoff = addr + 3 + p
                if not (addr < codeoff < bodyend):
                    codeoff = None
            except Exception:  # noqa: BLE001
                codeoff = None
            lines = [f"{name} {show(fname)} {{"]
            if codeoff:
                sub = Stream(buf, codeoff, bodyend, self.pool, self.label)
                sub.walk()
                for a in sub.order:
                    for l in sub.ins[a]:
                        lines.append("  " + l)
                self.pools.extend(sub.pools)
            else:
                lines.append("  /* unparsed body */")
            lines.append("}")
            return 3 + ln, lines
        if name in ("Jump", "If", "With"):
            d = struct.unpack_from("<h", buf, addr + 1)[0]
            tgt = addr + 3 + d
            return 3, [f"{name} -> @{tgt:04x}" + (f"  ({d:+d})" if name != "If" else "")]
        if name == "GotoFrame":
            return 5, [f"GotoFrame {struct.unpack_from('<H', buf, addr+1)[0]}"]
        if name in ("WaitForFrame", "SetTabIndex"):
            return 4, [f"{name} {struct.unpack_from('<H', buf, addr+1)[0]}, {buf[addr+3]}"]
        if name == "StoreRegister":
            return 2, [f"StoreRegister r{buf[addr+1]}"]
        if name == "GetURL":
            p = addr + 1
            k = buf.find(b"\x00", p, end)
            url = buf[p:k]
            k2 = buf.find(b"\x00", k + 1, end)
            return (k2 + 1 - addr), [f'GetURL "{url.decode("latin1")}" "{buf[k+1:k2].decode("latin1")}"']
        if op == 0x9A:
            return 2, [f"GetURL2 {buf[addr+1]}"]
        if op == 0x9F:
            return 2, [f"GotoFrame2 {buf[addr+1]}"]
        if name == "GoToLabel":
            k = buf.find(b"\x00", addr + 1, end)
            return k + 1 - addr, [f'GoToLabel "{buf[addr+1:k].decode("latin1")}"']
        if name == "WaitForFrame2":
            return 2, [f"WaitForFrame2 skip={buf[addr+1]}"]
        if name == "SetTarget":
            k = buf.find(b"\x00", addr + 1, end)
            return k + 1 - addr, [f'SetTarget "{buf[addr+1:k].decode("latin1")}"']
        return 1, [name]

    def walk(self):
        """Reachability walk; fills self.ins / self.order."""
        pending = [self.start]
        seen_starts = set()
        while pending:
            a = pending.pop()
            if a in seen_starts or not (self.start <= a < self.end):
                continue
            seen_starts.add(a)
            while self.start <= a < self.end:
                if a in self.ins:
                    break
                ln, lines = self.decode(a)
                self.ins[a] = lines
                op = self.buf[a]
                if ovt := OPCODES.get(op):
                    if ovt in ("Jump", "If", "With"):
                        d = struct.unpack_from("<h", self.buf, a + 1)[0]
                        pending.append(a + 3 + d)
                    if ovt == "Jump":
                        break            # no fallthrough
                    if ovt in ("End", "Return", "Throw"):
                        break
                a += ln
        self.order = sorted(self.ins)

    # -- helpers ----------------------------------------------------------
    def parse_push(self, data):
        out, i = [], 0
        while i < len(data):
            t = data[i]
            i += 1
            if t == 0:
                k = data.find(b"\x00", i)
                k = len(data) if k < 0 else k
                out.append(show(bytes(data[i:k])))
                i = k + 1
            elif t == 1:
                out.append(f"{struct.unpack_from('<f', data, i)[0]:g}")
                i += 4
            elif t == 2:
                out.append("null")
            elif t == 3:
                out.append("undefined")
            elif t == 4:
                out.append(f"r{data[i]}")
                i += 1
            elif t == 5:
                out.append("true" if data[i] else "false")
                i += 1
            elif t == 6:
                out.append(f"{struct.unpack_from('<d', data, i)[0]:g}")
                i += 8
            elif t == 7:
                out.append(str(struct.unpack_from("<i", data, i)[0]))
                i += 4
            elif t == 8:
                out.append(show(self.pool[data[i]]) if data[i] < len(self.pool) else f"?c{data[i]}")
                i += 1
            elif t == 9:
                j = struct.unpack_from("<H", data, i)[0]
                out.append(show(self.pool[j]) if j < len(self.pool) else f"?c{j}")
                i += 2
            else:
                out.append(f"?t{t}")
                break
        return out


def collect_pool_names(body, tags_start):
    """First pass: gather every pool entry so we can alias binary names."""
    names, counts = {}, {}
    def scan(buf, start, end=None):
        for code, ln, poff in iter_tags(buf, start, end):
            if code in (12, 59):
                s = poff + (2 if code == 59 else 0)
                for code2, ln2, poff2 in iter_tags(buf, s, poff + ln):
                    pass
                st = Stream(buf, s, poff + ln)
                st.walk()
                for a, cnt in st.pools:
                    pass
                for a in st.order:
                    pass
            if code == 39:
                scan(buf, poff + 4, poff + ln)
    # simpler: brute force valid pools
    i = 0
    n = len(body)
    while i < n - 6:
        if body[i] != 0x88:
            i += 1
            continue
        ln = struct.unpack_from("<H", body, i + 1)[0]
        if ln < 3 or i + 3 + ln > n:
            i += 1
            continue
        cnt = struct.unpack_from("<H", body, i + 3)[0]
        chunk = body[i + 5:i + 3 + ln]
        parts = chunk.split(b"\x00")
        if parts and parts[-1] == b"":
            parts = parts[:-1]
        if 0 < cnt <= 4096 and len(parts) == cnt and sum(len(x) for x in parts) + cnt == len(chunk):
            for s in parts:
                if s and not _is_ascii(s):
                    counts[s] = counts.get(s, 0) + 1
            i += 3 + ln
        else:
            i += 1
    return counts


def _is_ascii(b):
    try:
        s = b.decode("utf-8")
        return all(0x20 <= ord(c) < 0x7F for c in s)
    except UnicodeDecodeError:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("-o", "--out")
    ap.add_argument("--sprite", type=int, help="only dump this sprite id")
    ap.add_argument("--stats", action="store_true")
    a = ap.parse_args()

    hdr, body = load(a.file)
    tags_start = (5 + 4 * (body[0] >> 3) + 7) // 8 + 4

    # alias binary pool names by their raw hex so output stays stable
    names = collect_pool_names(body, tags_start)
    for i, b in enumerate(sorted(names, key=lambda x: (len(x), x))):
        BINARY[b] = f"«{b.hex()}»"

    out, stats = [], {}
    out.append(f"# {a.file}  v{hdr[3]}  body={len(body)} bytes  ({len(names)} binary names seen)")

    def walk(buf, start, depth, path):
        pad = "  " * depth
        for code, ln, poff in iter_tags(buf, start):
            stats[code] = stats.get(code, 0) + 1
            if code in (12, 59):
                tag_end = poff + ln
                if code == 59:
                    sid = struct.unpack_from("<H", buf, poff)[0]
                    if a.sprite is not None and sid != a.sprite:
                        continue
                    st = Stream(buf, poff + 2, tag_end)
                    out.append(f"\n{pad}### DoInitAction spriteId={sid} @0x{poff:06x} len={ln}")
                else:
                    st = Stream(buf, poff, tag_end)
                    out.append(f"\n{pad}### DoAction @0x{poff:06x} len={ln}  [{path}]")
                st.walk()
                for addr in st.order:
                    for line in st.ins[addr]:
                        out.append(f"{pad}  {addr:6d}  {line}")
            elif code == 39:
                sid = struct.unpack_from("<H", buf, poff)[0]
                if walk(buf, poff + 4, depth + 1, f"{path}/sprite{sid}"):
                    pass
        return False

    walk(body, tags_start, 0, "root")
    text = "\n".join(out)
    Path(a.out).write_text(text) if a.out else print(text)
    if a.out:
        print(f"wrote {a.out}  ({len(out)} lines)")
    if a.stats:
        print("\n# tag census")
        for c, n in sorted(stats.items(), key=lambda kv: -kv[1]):
            print(f"  {c:4d} {TAG_NAMES.get(c, ''):22s} {n}")


if __name__ == "__main__":
    main()
