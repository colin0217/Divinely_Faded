#!/usr/bin/env python3
"""Pull Tim's real photos into assets/photos/ as EXIF-free WebP (640w + 1200w) and write a manifest.

Usage: python3 tools/photos.py name1 name2 ...   (no names = every name used in content/**.json)
Source: https://divinely-faded.vercel.app/gbp-media/<name>.jpg (owner-approved, client faces OK 2026-10-24).
"""
import io, json, os, re, sys, glob, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "photos")
MAN = os.path.join(OUT, "manifest.json")
SRC = "https://divinely-faded.vercel.app/gbp-media/{}.jpg"
WIDTHS = (640, 1200)


def used_names():
    names = set()
    for f in glob.glob(os.path.join(ROOT, "content", "**", "*.json"), recursive=True):
        if f.endswith("facts.json"):
            continue
        txt = open(f, encoding="utf-8").read()
        names.update(re.findall(r'"photos"\s*:\s*\[([^\]]*)\]', txt) and
                     [n for grp in re.findall(r'"photos"\s*:\s*\[([^\]]*)\]', txt) for n in re.findall(r'"([a-z0-9-]+)"', grp)])
        names.update(re.findall(r'"(?:photo|og_photo|hero)"\s*:\s*"([a-z0-9-]+)"', txt))
    return sorted(n for n in names if not n.startswith(("pexels-", "ai-")))


def main():
    os.makedirs(OUT, exist_ok=True)
    man = json.load(open(MAN)) if os.path.exists(MAN) else {}
    names = sys.argv[1:] or used_names()
    for name in names:
        if name in man and all(os.path.exists(os.path.join(OUT, f"{name}-{w}.webp")) for w in WIDTHS):
            continue
        raw = urllib.request.urlopen(urllib.request.Request(SRC.format(name), headers={"User-Agent": "df-build"}), timeout=60).read()
        im = Image.open(io.BytesIO(raw)).convert("RGB")  # convert() drops EXIF/GPS
        w0, h0 = im.size
        for w in WIDTHS:
            ww = min(w, w0)
            hh = round(h0 * ww / w0)
            im.resize((ww, hh), Image.LANCZOS).save(os.path.join(OUT, f"{name}-{w}.webp"), "WEBP", quality=80, method=6)
        man[name] = {"w": w0, "h": h0, "source": SRC.format(name)}
        print("ok", name, w0, h0)
    json.dump(dict(sorted(man.items())), open(MAN, "w"), indent=1)
    print(len(man), "photos in manifest")


if __name__ == "__main__":
    main()
