"""Renders the HemoScan PWA / launcher icons (droplet + heartbeat) as PNGs."""
from PIL import Image, ImageDraw
import math, sys, os

def droplet(size: int, pad_bg: bool = True) -> Image.Image:
    s = 4  # supersample
    W = size * s
    img = Image.new("RGBA", (W, W), (255, 248, 245, 255) if pad_bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, r = W / 2, W * 0.27
    cy = W * 0.60
    top = W * 0.12
    pts = []
    for i in range(0, 361):
        a = math.radians(i)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    # tangent lines from tip to circle
    d.polygon([(cx, top), (cx - r * 0.93, cy - r * 0.37), (cx + r * 0.93, cy - r * 0.37)], fill=(178, 58, 72, 255))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(178, 58, 72, 255))
    u = W / 64
    line = [(19, 42), (27, 42), (30, 35), (34, 48), (37, 42), (45, 42)]
    line = [(x * u * 0.9 + W * 0.05 + 0.5 * u, (y - 3) * u * 0.9 + W * 0.1) for x, y in line]
    d.line(line, fill=(255, 255, 255, 255), width=int(3.2 * u * 0.9), joint="curve")
    return img.resize((size, size), Image.LANCZOS)

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "public/icons"
    os.makedirs(out, exist_ok=True)
    for sz in (192, 512):
        droplet(sz).save(os.path.join(out, f"icon-{sz}.png"))
    print("icons written")
