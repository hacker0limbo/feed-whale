#!/usr/bin/env python3
"""De-flatten the state-machine obfuscation in FFDec's AS2 output.

The obfuscator rewrites every action stream into

    function §\\x04\\x05§() { set("\\x03", A % 511 * 5); return eval("\\x03"); }
    var §\\x01§ = -2021 + "\\x04\\x05"();
    while(true) {
       if(eval("\\x01") == K1) { set("\\x01", eval("\\x01") - D); <payload>; }
       else if(eval("\\x01") == K2) { ... }
       ...
    }

so each basic block becomes a branch keyed on a numeric program counter, and real
`if` conditions ride an explicit stack (`§§push` / `§§pop`).

This rebuilds the blocks, recovers the transition graph, orders them by state and
prints the payload statements with the dispatcher scaffolding removed.

Usage: deflatten.py <file.as> [-o out.as]
"""
import argparse
import re
from pathlib import Path

IF_STATE = re.compile(r'\(\s*eval\("\\x01"\)\s*==\s*(\d+)\s*\)')


def skip_ws(t, i):
    while i < len(t) and t[i] in " \t\r\n":
        i += 1
    return i


def match_brace(t, i):
    """i points at '{'.  Return index just past the matching '}'."""
    assert t[i] == "{"
    depth, j = 0, i
    while j < len(t):
        c = t[j]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return j + 1
        elif c == '"':
            j += 1
            while j < len(t) and t[j] != '"':
                j += 2 if t[j] == "\\" else 1
        j += 1
    return len(t)


def find_while_body(t):
    m = re.search(r"\bwhile\s*\(\s*true\s*\)", t)
    if not m:
        return None, None
    i = skip_ws(t, m.end())
    if i >= len(t) or t[i] != "{":
        return None, None
    return i, match_brace(t, i)


def split_branches(body):
    """Split a dispatcher body into [(cond_kind, state, payload_text)]."""
    branches = []
    i = 0
    n = len(body)
    cur = None
    while i < n:
        i = skip_ws(body, i)
        if i >= n:
            break
        m = re.compile(r"(else\s+if|else|if)\b").match(body, i)
        if not m:
            i += 1
            continue
        kind = m.group(1)
        j = skip_ws(body, m.end())
        cond = None
        if kind != "else":
            if j < n and body[j] == "(":
                depth = 0
                k = j
                while k < n:
                    if body[k] == "(":
                        depth += 1
                    elif body[k] == ")":
                        depth -= 1
                        if depth == 0:
                            break
                    k += 1
                cond_text = body[j:k + 1]
                mm = IF_STATE.search(cond_text)
                cond = int(mm.group(1)) if mm else "?"
                j = skip_ws(body, k + 1)
        j = skip_ws(body, j)
        if j < n and body[j] == "{":
            end = match_brace(body, j)
            payload = body[j + 1:end - 1]
        else:
            # single-statement branch
            semi = body.find(";", j)
            payload = body[j:semi + 1] if semi >= 0 else body[j:]
            end = semi + 1 if semi >= 0 else n
        branches.append((kind, cond, payload))
        i = end
    return branches


def clean_payload(payload):
    out = []
    for raw in payload.splitlines():
        line = raw.strip()
        if not line or line in ("break;", "{", "}"):
            continue
        out.append(line)
    return out


def unwrap_chain(branches):
    """The dispatcher nests its if/else chain inside the final `else` block.

    Unwrap those so all states end up in one flat list.
    """
    flat = []
    for kind, cond, payload in branches:
        stripped = payload.strip()
        if cond is None and stripped.startswith("if"):
            m = IF_STATE.search(stripped[:80])
            if m:
                flat.extend(unwrap_chain(split_branches(payload)))
                continue
        flat.append((kind, cond, payload))
    return flat


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("-o", "--out")
    a = ap.parse_args()
    text = Path(a.file).read_text(errors="replace")

    wi, wend = find_while_body(text)
    if wi is None:
        Path(a.out).write_text(text) if a.out else print(text)
        if a.out:
            print(f"wrote {a.out} (no dispatcher found, copied)")
        return

    head = text[:wi]
    tail = text[wend:]
    body = text[wi + 1:wend - 1]
    branches = unwrap_chain(split_branches(body))

    # collect nested branches that the regex missed (payloads only, no state)
    out = [head.rstrip(), "", "/* =============== de-flattened blocks =============== */"]
    state_blocks, other = [], []
    for kind, cond, payload in branches:
        lines = clean_payload(payload)
        if isinstance(cond, int):
            state_blocks.append((cond, lines))
        else:
            other.append((kind, cond, lines))

    state_blocks.sort(key=lambda kv: kv[0])
    for state, lines in state_blocks:
        out.append("")
        out.append(f"/* ----- state {state} ----- */")
        for line in lines:
            out.append("   " + line)
    if other:
        out.append("")
        out.append("/* ----- unconditional / else ----- */")
        for kind, cond, lines in other:
            for line in lines:
                out.append("   " + line)
    out.append("")
    out.append("/* ============= end de-flattened blocks ============= */")
    out.append(tail.strip())

    result = "\n".join(out)
    if a.out:
        Path(a.out).write_text(result)
        n = sum(len(l) for _, l in state_blocks)
        print(f"wrote {a.out}: {len(state_blocks)} states, {n} payload lines")
    else:
        print(result)


if __name__ == "__main__":
    main()
