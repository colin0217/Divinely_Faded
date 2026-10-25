#!/usr/bin/env python3
"""Share cards: assets/og/<photo>.jpg at 1200x630 (1.91:1) from assets/photos/<photo>-1200.webp, black and white like the site.

Usage: python3 tools/og.py name1 name2 ...   (skips cards that already exist)
The crop keeps the upper part of the photo (faces and hair sit high in Tim's portraits and cut photos).
"""
import os, sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "photos")
OUT = os.path.join(ROOT, "assets", "og")
W, H = 1200, 630


def card(name):
    out = os.path.join(OUT, f"{name}.jpg")
    if os.path.exists(out):
        return
    im = ImageOps.grayscale(Image.open(os.path.join(SRC, f"{name}-1200.webp"))).convert("RGB")
    w, h = im.size
    if w / h > W / H:  # wider than the card: crop the sides
        nw = round(h * W / H); left = (w - nw) // 2; im = im.crop((left, 0, left + nw, h))
    else:  # taller: keep the upper part
        nh = round(w * H / W); top = round((h - nh) * 0.3); im = im.crop((0, top, w, top + nh))
    im.resize((W, H), Image.LANCZOS).save(out, "JPEG", quality=82, optimize=True, progressive=True)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for n in sys.argv[1:]:
        card(n)
