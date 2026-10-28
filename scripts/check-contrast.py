#!/usr/bin/env python3
"""WCAG 2.x contrast check for the three brand directions in docs/BRAND.md.

Usage:
  python3 scripts/check-contrast.py            # markdown report for all directions
  python3 scripts/check-contrast.py --strict   # exit 1 if any required pair fails

Direction A (recommended) is read from docs/design-tokens.json so the shipped
tokens and this report can never drift. B and C are defined below.

The chaos-to-calm shift is modeled the way the browser composites it: the cool
backdrop layer sits over the warm one with opacity t, blended in gamma-encoded
sRGB. Every text token that can sit on the backdrop is checked at t = 0.0, 0.1,
... 1.0 and the minimum is reported.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Shared across every direction: the NEEDED FROM TRAVIS placeholder callout.
PLACEHOLDER = {"needed-bg": "#FFD60A", "needed-ink": "#111111", "needed-stripe": "#111111"}

B = {
    "name": "B. Signal",
    "light": {
        "bg-warm": "#E9E4DA", "bg-cool": "#DDE4E7", "surface": "#FFFFFF", "surface-2": "#F3F1EC",
        "ink": "#121417", "ink-2": "#383D44", "ink-3": "#545A63", "link": "#0F5557",
        "accent": "#0F4C4E", "on-accent": "#FFFFFF", "bug": "#C42B1C", "on-bug": "#FFFFFF",
        "bug-text": "#AE2618", "merged": "#0E7A43", "merged-text": "#0B6A3A", "verifier": "#1F5FAD",
        "focus": "#0F4C4E", "track": "#2B2F35", "band": "#121417", "on-band": "#FFFFFF",
    },
    "dark": {
        "bg-warm": "#17140F", "bg-cool": "#0E1416", "surface": "#1B1D20", "surface-2": "#24272B",
        "ink": "#F1F0EC", "ink-2": "#C9CCD1", "ink-3": "#A0A6AE", "link": "#6FD0CB",
        "accent": "#6FD0CB", "on-accent": "#0A1516", "bug": "#CC3324", "on-bug": "#FFFFFF",
        "bug-text": "#FF8073", "merged": "#34D27F", "merged-text": "#5BE39A", "verifier": "#86B4FF",
        "focus": "#6FD0CB", "track": "#C9CCD1", "band": "#08090A", "on-band": "#F1F0EC",
    },
}

C = {
    "name": "C. Drafting",
    "light": {
        "bg-warm": "#F6ECE0", "bg-cool": "#EEF4F8", "surface": "#FFFFFF", "surface-2": "#F6F8FA",
        "ink": "#0D1B2A", "ink-2": "#33465C", "ink-3": "#4F6276", "link": "#17587A",
        "accent": "#17587A", "on-accent": "#FFFFFF", "bug": "#BF3A2B", "on-bug": "#FFFFFF",
        "bug-text": "#AD3324", "merged": "#12805C", "merged-text": "#0E6E4F", "verifier": "#9A5208",
        "focus": "#17587A", "track": "#33465C",
    },
    "dark": {
        "bg-warm": "#1A1612", "bg-cool": "#0D141B", "surface": "#161D25", "surface-2": "#1D2631",
        "ink": "#EAF0F6", "ink-2": "#BFCBD8", "ink-3": "#97A7B8", "link": "#86CBEA",
        "accent": "#86CBEA", "on-accent": "#0D1B2A", "bug": "#BF3A2B", "on-bug": "#FFFFFF",
        "bug-text": "#FF8A7A", "merged": "#3CCB95", "merged-text": "#63DCAD", "verifier": "#E9A75C",
        "focus": "#86CBEA", "track": "#97A7B8",
    },
}


def load_a():
    tokens = json.loads((ROOT / "docs" / "design-tokens.json").read_text())
    color = tokens["color"]
    out = {"name": "A. Workbench (recommended)", "light": {}, "dark": {}}
    for key, val in color.items():
        if key.startswith("$"):
            continue
        out["light"][key] = val["$value"]["light"]
        out["dark"][key] = val["$value"]["dark"]
    return out


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return "#" + "".join(f"{round(c * 255):02X}" for c in rgb)


def lum(h):
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in hex_to_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def mix(warm, cool, t):
    w, c = hex_to_rgb(warm), hex_to_rgb(cool)
    return rgb_to_hex(tuple(w[i] * (1 - t) + c[i] * t for i in range(3)))


# (foreground, background, minimum, note)
TEXT_ON_SHEETS = [
    ("ink", "surface", 4.5), ("ink-2", "surface", 4.5), ("ink-3", "surface", 4.5),
    ("ink", "surface-2", 4.5), ("ink-2", "surface-2", 4.5), ("ink-3", "surface-2", 4.5),
    ("link", "surface", 4.5), ("bug-text", "surface", 4.5), ("merged-text", "surface", 4.5),
    ("on-accent", "accent", 4.5), ("on-bug", "bug", 4.5),
]
NON_TEXT = [
    ("bug", "surface", 3.0), ("merged", "surface", 3.0), ("verifier", "surface", 3.0),
    ("focus", "surface", 3.0), ("accent", "surface", 3.0),
]
SHIFT_TEXT = ["ink", "ink-2", "ink-3", "link", "bug-text"]
SHIFT_NON_TEXT = ["bug", "merged", "focus", "accent", "track"]
STEPS = [i / 10 for i in range(11)]


def check(direction):
    rows, fails = [], []
    for mode in ("light", "dark"):
        p = direction[mode]
        extra = [("on-band", "band", 4.5)] if "band" in p else []
        for fg, bg, need in TEXT_ON_SHEETS + NON_TEXT + extra:
            r = ratio(p[fg], p[bg])
            ok = r >= need
            rows.append((mode, fg, bg, p[fg], p[bg], r, need, ok))
            if not ok:
                fails.append((mode, fg, bg, r, need))
        for fg in SHIFT_TEXT + SHIFT_NON_TEXT:
            need = 4.5 if fg in SHIFT_TEXT else 3.0
            worst_t, worst = None, 99
            for t in STEPS:
                r = ratio(p[fg], mix(p["bg-warm"], p["bg-cool"], t))
                if r < worst:
                    worst, worst_t = r, t
            ok = worst >= need
            label = f"backdrop shift (worst at t={worst_t:.1f})"
            rows.append((mode, fg, label, p[fg], mix(p["bg-warm"], p["bg-cool"], worst_t), worst, need, ok))
            if not ok:
                fails.append((mode, fg, label, worst, need))
    return rows, fails


def placeholder_rows():
    r = ratio(PLACEHOLDER["needed-ink"], PLACEHOLDER["needed-bg"])
    return [("both", "needed-ink", "needed-bg", PLACEHOLDER["needed-ink"], PLACEHOLDER["needed-bg"], r, 4.5, r >= 4.5)]


def main():
    strict = "--strict" in sys.argv
    all_fails = []
    for d in (load_a(), B, C):
        rows, fails = check(d)
        all_fails += [(d["name"],) + f for f in fails]
        print(f"\n### {d['name']}\n")
        print("| Mode | Foreground | Background | FG | BG | Ratio | Needs | Pass |")
        print("|---|---|---|---|---|---|---|---|")
        for mode, fg, bg, fh, bh, r, need, ok in rows:
            print(f"| {mode} | {fg} | {bg} | `{fh}` | `{bh}` | {r:.2f} | {need} | {'yes' if ok else 'NO'} |")
    print("\n### Shared placeholder callout\n")
    print("| Mode | Foreground | Background | FG | BG | Ratio | Needs | Pass |")
    print("|---|---|---|---|---|---|---|---|")
    for mode, fg, bg, fh, bh, r, need, ok in placeholder_rows():
        print(f"| {mode} | {fg} | {bg} | `{fh}` | `{bh}` | {r:.2f} | {need} | {'yes' if ok else 'NO'} |")
    print(f"\nFailures: {len(all_fails)}")
    for f in all_fails:
        print("  FAIL", f)
    if strict and all_fails:
        sys.exit(1)


if __name__ == "__main__":
    main()
