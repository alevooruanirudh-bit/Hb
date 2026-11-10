"""
Generates the SYNTHETIC demo images in public/demo/ (eye, nails, palm × 4 levels).

These are procedurally drawn illustrations — not real patient photographs —
whose tissue color is progressively paler to represent lower hemoglobin. They
exist only so reviewers can run the full HemoScan pipeline without a camera.

Usage:  python3 scripts/generate_demo_samples.py [--raw-dir DIR]
  --raw-dir  also dumps decoded RGBA pixels (for scripts/calibrate-demo.ts)
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 640, 480
LEVELS = {"healthy": 0.0, "mild": 0.33, "moderate": 0.62, "severe": 0.92}
SKIN = np.array([172, 118, 88], dtype=float)  # medium brown skin tone


def mix(a, b, t):
    return tuple(int(round(x * (1 - t) + y * t)) for x, y in zip(a, b))


def finish(img: Image.Image, seed: int) -> Image.Image:
    """Adds skin micro-texture, sensor-like noise and a slight blur so it looks photographic."""
    rng = np.random.default_rng(seed)
    arr = np.asarray(img.filter(ImageFilter.GaussianBlur(0.6)), dtype=float)
    # fine texture (pores / fabric weave): multiplicative high-frequency pattern
    tex = rng.normal(0, 1, (H // 2, W // 2))
    tex = np.kron(tex, np.ones((2, 2)))[:H, :W]
    arr *= (1 + 0.045 * tex)[..., None]
    arr += rng.normal(0, 3.0, arr.shape)
    # soft vignette
    yy, xx = np.mgrid[0:H, 0:W]
    v = 1 - 0.18 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    arr *= v[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def textured_background(color, seed):
    rng = np.random.default_rng(seed)
    base = np.ones((H, W, 3)) * np.array(color, dtype=float)
    low = rng.normal(0, 1, (H // 16 + 1, W // 16 + 1))
    low = np.kron(low, np.ones((16, 16)))[:H, :W]
    base += low[..., None] * 6
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))


def eye(pallor: float, seed: int) -> Image.Image:
    img = textured_background(SKIN, seed)
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, int(H * 0.42)
    # upper eyelid shadow + eye opening
    d.ellipse([cx - 190, cy - 95, cx + 190, cy + 70], fill=mix(SKIN, (90, 55, 40), 0.35))
    d.ellipse([cx - 170, cy - 70, cx + 170, cy + 55], fill=(236, 232, 226))  # sclera
    d.ellipse([cx - 62, cy - 72, cx + 62, cy + 40], fill=(92, 58, 36))  # iris (looking up)
    d.ellipse([cx - 26, cy - 44, cx + 26, cy + 8], fill=(18, 12, 10))  # pupil
    d.ellipse([cx + 8, cy - 40, cx + 24, cy - 24], fill=(250, 250, 250))  # catch light
    # pulled-down lower eyelid → palpebral conjunctiva crescent
    healthy, pale = (196, 58, 72), (226, 176, 170)
    conj = mix(healthy, pale, pallor)
    d.chord([cx - 175, cy - 5, cx + 175, cy + 150], 0, 180, fill=conj)
    rng = np.random.default_rng(seed + 1)
    vessel = mix((150, 30, 45), (205, 140, 140), pallor)
    for _ in range(14):
        x0 = cx + rng.integers(-150, 150)
        y0 = cy + 55 + rng.integers(0, 60)
        pts = [(x0 + k * rng.integers(8, 16) * rng.choice([-1, 1]), y0 + k * rng.integers(-4, 6)) for k in range(5)]
        d.line(pts, fill=vessel, width=2)
    # lower lid rim and lashes
    d.arc([cx - 178, cy - 8, cx + 178, cy + 156], 0, 180, fill=mix(SKIN, (60, 35, 25), 0.5), width=10)
    for k in range(-160, 170, 14):
        d.line([(cx + k, cy - 62 + abs(k) * 0.12), (cx + k * 1.12, cy - 96 + abs(k) * 0.1)], fill=(25, 18, 15), width=3)
    # finger pulling the lid
    d.rounded_rectangle([cx - 40, cy + 170, cx + 40, H + 20], radius=38, fill=mix(SKIN, (120, 80, 60), 0.15))
    return finish(img, seed)


def nails(pallor: float, seed: int) -> Image.Image:
    img = textured_background((200, 196, 188), seed)  # neutral table / cloth
    d = ImageDraw.Draw(img)
    healthy, pale = (214, 128, 128), (226, 196, 186)
    bed = mix(healthy, pale, pallor)
    xs = [150, 262, 374, 486]
    tops = [150, 118, 122, 168]
    for x, top in zip(xs, tops):
        d.rounded_rectangle([x - 46, top, x + 46, H + 40], radius=44, fill=tuple(int(c) for c in SKIN))
        # knuckle crease
        d.arc([x - 34, top + 170, x + 34, top + 200], 200, 340, fill=mix(SKIN, (80, 50, 35), 0.4), width=3)
        # nail plate
        d.rounded_rectangle([x - 32, top + 12, x + 32, top + 104], radius=26, fill=bed)
        d.ellipse([x - 22, top + 78, x + 22, top + 108], fill=mix(bed, (245, 235, 230), 0.55))  # lunula
        d.line([(x - 22, top + 22), (x - 18, top + 70)], fill=mix(bed, (255, 255, 255), 0.45), width=5)  # highlight
        d.arc([x - 34, top + 8, x + 34, top + 44], 190, 350, fill=(236, 224, 214), width=5)  # free edge
    return finish(img, seed)


def palm(pallor: float, seed: int) -> Image.Image:
    img = textured_background((196, 200, 204), seed)
    d = ImageDraw.Draw(img)
    healthy, pale = (208, 132, 116), (216, 178, 154)
    tone = mix(healthy, pale, pallor)
    cx = W // 2
    d.rounded_rectangle([cx - 170, 150, cx + 170, H + 60], radius=90, fill=tone)  # palm
    for i, (x, top) in enumerate([(cx - 128, 20), (cx - 44, -10), (cx + 42, 0), (cx + 124, 40)]):
        d.rounded_rectangle([x - 36, top, x + 36, 220], radius=34, fill=tone)
        d.line([(x - 24, top + 70), (x + 24, top + 70)], fill=mix(tone, (90, 50, 40), 0.35), width=3)
    d.rounded_rectangle([cx - 260, 250, cx - 150, 330], radius=38, fill=tone)  # thumb
    crease = mix(tone, (100, 55, 45), 0.4)
    d.arc([cx - 150, 190, cx + 170, 330], 190, 330, fill=crease, width=4)
    d.arc([cx - 170, 240, cx + 120, 380], 200, 320, fill=crease, width=4)
    d.arc([cx - 120, 260, cx + 60, 470], 250, 330, fill=crease, width=4)
    return finish(img, seed)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/demo")
    ap.add_argument("--raw-dir", default=None)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    if args.raw_dir:
        os.makedirs(args.raw_dir, exist_ok=True)
    for li, (name, p) in enumerate(LEVELS.items()):
        for ri, (region, fn) in enumerate([("eye", eye), ("nails", nails), ("palm", palm)]):
            img = fn(p, seed=100 * li + ri)
            path = os.path.join(args.out, f"{name}_{region}.jpg")
            img.save(path, quality=90)
            if args.raw_dir:
                dec = Image.open(path).convert("RGBA")
                with open(os.path.join(args.raw_dir, f"{name}_{region}.rgba"), "wb") as f:
                    f.write(np.array([dec.width, dec.height], dtype="<u4").tobytes())
                    f.write(dec.tobytes())
    print("demo samples written to", args.out)


if __name__ == "__main__":
    main()
