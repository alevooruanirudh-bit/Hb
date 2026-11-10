"""Writes HemoScan launcher icons into the Capacitor Android project (legacy + adaptive)."""
import os
import sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from generate_icons import droplet  # noqa: E402

RES = "android/app/src/main/res"
LEGACY = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
for density, size in LEGACY.items():
    d = os.path.join(RES, f"mipmap-{density}")
    os.makedirs(d, exist_ok=True)
    icon = droplet(size)
    icon.save(os.path.join(d, "ic_launcher.png"))
    mask = Image.new("L", (size, size), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    rnd = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rnd.paste(icon, (0, 0), mask)
    rnd.save(os.path.join(d, "ic_launcher_round.png"))
    # Adaptive foreground: 108dp canvas, artwork inside the 66dp safe zone.
    fg_size = int(size * 108 / 48)
    fg = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    art = droplet(int(fg_size * 0.62), pad_bg=False)
    off = (fg_size - art.width) // 2
    fg.paste(art, (off, off), art)
    fg.save(os.path.join(d, "ic_launcher_foreground.png"))
bg = os.path.join(RES, "values", "ic_launcher_background.xml")
with open(bg, "w") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFF8F5</color>\n</resources>\n')
print("android icons written")

# Splash screens: droplet centered on the app background color, same sizes as Capacitor's defaults.
import glob  # noqa: E402
for path in glob.glob(os.path.join(RES, "drawable*", "splash.png")):
    w, h = Image.open(path).size
    splash = Image.new("RGB", (w, h), (255, 248, 245))
    art = droplet(int(min(w, h) * 0.32), pad_bg=False)
    splash.paste(art, ((w - art.width) // 2, (h - art.height) // 2), art)
    splash.save(path)
print("android splash screens written")
