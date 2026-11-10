"""
Shared configuration and helpers for the HemoScan training pipeline.

Everything that must behave identically on the phone and in training reads
from the SAME files the app uses:

  ../src/config/pipeline.json            preprocessing, features, quality, fallback, fusion
  ../src/config/severityThresholds.json  WHO anemia thresholds

The color-space math and color-feature code below are line-by-line ports of
src/imageProcessing/colorSpace.ts and colorFeatures.ts (verified by
tests/test_parity.py against fixtures produced by the TypeScript code).
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
APP_ROOT = ROOT.parent
# Override with HEMOSCAN_ARTIFACTS=/some/dir to keep outputs elsewhere.
ARTIFACTS = Path(os.environ.get("HEMOSCAN_ARTIFACTS", ROOT / "artifacts"))

PIPELINE = json.loads((APP_ROOT / "src/config/pipeline.json").read_text())
THRESHOLDS = json.loads((APP_ROOT / "src/config/severityThresholds.json").read_text())

PRE = PIPELINE["preprocessing"]
FEAT = PIPELINE["features"]
QUALITY = PIPELINE["quality"]
FALLBACK = PIPELINE["fallback"]
FUSION = PIPELINE["fusion"]

REGIONS = ["eye", "nails", "palm"]  # order of the one-hot block (src/ml/modelProvider.ts REGION_ORDER)
SEVERITIES = ["normal", "mild", "moderate", "severe"]


def region_one_hot(region: str) -> list[float]:
    return [1.0 if r == region else 0.0 for r in REGIONS]


def demographics(age: float, sex: str) -> list[float]:
    """XGBoost demographic inputs — same as src/ml/modelProvider.ts demographicFeatures():
    [age in years, sex (male 1, female 0, unknown 0.5)]."""
    return [float(age), {"male": 1.0, "female": 0.0}.get(str(sex), 0.5)]


def js_round(x: float) -> int:
    """JavaScript Math.round (half away from zero for positives)."""
    return int(math.floor(x + 0.5))


# ---------------------------------------------------------------------------
# Color spaces — port of src/imageProcessing/colorSpace.ts
# ---------------------------------------------------------------------------
_GAMMA_LUT = np.array(
    [(i / 255) / 12.92 if (i / 255) <= 0.04045 else ((i / 255 + 0.055) / 1.055) ** 2.4 for i in range(256)],
    dtype=np.float32,  # TS uses a Float32Array
).astype(np.float64)
_XN, _ZN, _T = 0.950456, 1.088754, 0.008856


def _f(t: np.ndarray) -> np.ndarray:
    return np.where(t > _T, np.cbrt(t), 7.787 * t + 16 / 116)


def rgb_to_lab(r: np.ndarray, g: np.ndarray, b: np.ndarray):
    """8-bit RGB arrays → (L in [0,100], a, b)."""
    R, G, B = _GAMMA_LUT[r], _GAMMA_LUT[g], _GAMMA_LUT[b]
    X = (0.412453 * R + 0.35758 * G + 0.180423 * B) / _XN
    Y = 0.212671 * R + 0.71516 * G + 0.072169 * B
    Z = (0.019334 * R + 0.119193 * G + 0.950227 * B) / _ZN
    fy = _f(Y)
    L = np.where(Y > _T, 116 * fy - 16, 903.3 * Y)
    return L, 500 * (_f(X) - fy), 200 * (fy - _f(Z))


def rgb_to_hsv(r: np.ndarray, g: np.ndarray, b: np.ndarray):
    """8-bit RGB arrays → H, S, V in [0, 1] (same branch order as the TS code)."""
    R, G, B = r / 255.0, g / 255.0, b / 255.0
    mx = np.maximum(np.maximum(R, G), B)
    mn = np.minimum(np.minimum(R, G), B)
    d = mx - mn
    safe = np.where(d > 0, d, 1)
    h = np.select(
        [d == 0, mx == R, mx == G],
        [np.zeros_like(R), ((G - B) / safe) % 6, (B - R) / safe + 2],
        default=(R - G) / safe + 4,
    ) / 6
    h = np.where(h < 0, h + 1, h)
    s = np.where(mx == 0, 0, d / np.where(mx == 0, 1, mx))
    return h, s, mx


def luma(r, g, b):
    return 0.299 * r + 0.587 * g + 0.114 * b


# ---------------------------------------------------------------------------
# Color features — port of src/imageProcessing/colorFeatures.ts
# ---------------------------------------------------------------------------
BINS = FEAT["histogramBins"]
COLOR_FEATURE_NAMES = (
    [f"{c}_{s}" for c in ["r", "g", "b"] for s in ("mean", "std")]
    + [f"{c}_{s}" for c in ["h", "s", "v"] for s in ("mean", "std")]
    + [f"{c}_{s}" for c in ["L", "a", "bb"] for s in ("mean", "std")]
    + ["rg_ratio", "a_p10", "a_p50", "a_p90", "erythema_index"]
    + [f"hist_{c}_{i}" for c in ["r", "g", "b", "a"] for i in range(BINS)]
)


def _percentile_js(sorted_vals: np.ndarray, p: float) -> float:
    if len(sorted_vals) == 0:
        return 0.0
    idx = min(len(sorted_vals) - 1, max(0, js_round(p * (len(sorted_vals) - 1))))
    return float(sorted_vals[idx])


def extract_color_features(roi_rgb: np.ndarray) -> np.ndarray:
    """roi_rgb: HxWx3 uint8 (RGB). Returns the color feature vector (len = len(COLOR_FEATURE_NAMES))."""
    px = roi_rgb.reshape(-1, 3).astype(np.int64)
    r, g, b = px[:, 0], px[:, 1], px[:, 2]
    y = luma(r, g, b)
    keep = ~((y > FEAT["glareLuma"]) | (y < FEAT["shadowLuma"]))
    r, g, b = r[keep], g[keep], b[keep]
    n = len(r)
    if n == 0:
        return np.zeros(len(COLOR_FEATURE_NAMES))
    h, s, v = rgb_to_hsv(r, g, b)
    L, a, bb = rgb_to_lab(r, g, b)
    chans = [r / 255, g / 255, b / 255, h, s, v, L / 100, a / 128, bb / 128]
    feats: list[float] = []
    for c in chans:
        mean = c.mean()
        feats += [mean, math.sqrt(max(0.0, (c * c).mean() - mean * mean))]
    feats.append(r.sum() / max(1, g.sum()))
    a_sorted = np.sort(a.astype(np.float32))
    feats += [_percentile_js(a_sorted, p) / 128 for p in (0.1, 0.5, 0.9)]
    feats.append(float(np.mean(np.log10((r + 1) / (g + 1)))))

    def binned(vals):
        return np.minimum(BINS - 1, np.floor(vals / 256 * BINS)).astype(int)

    a_bins = np.minimum(BINS - 1, np.maximum(0, np.floor((a - FEAT["aHistMin"]) / (FEAT["aHistMax"] - FEAT["aHistMin"]) * BINS))).astype(int)
    for bins in (binned(r), binned(g), binned(b), a_bins):
        feats += list(np.bincount(bins, minlength=BINS)[:BINS] / n)
    return np.asarray(feats, dtype=np.float64)


# ---------------------------------------------------------------------------
# ROI mosaic — port of resize / crop / buildRoiMosaic (imageUtils.ts, regionAnalyzer.ts)
# ---------------------------------------------------------------------------
def clamp_box(box, w, h):
    x = max(0, min(w - 1, js_round(box[0])))
    y = max(0, min(h - 1, js_round(box[1])))
    bw = max(1, min(w - x, js_round(box[2])))
    bh = max(1, min(h - y, js_round(box[3])))
    return x, y, bw, bh


def crop(img: np.ndarray, box) -> np.ndarray:
    x, y, bw, bh = clamp_box(box, img.shape[1], img.shape[0])
    return img[y : y + bh, x : x + bw]


def _trunc_u8(v: np.ndarray) -> np.ndarray:
    """Uint8ClampedArray assignment: round-half-to-even and clamp."""
    return np.clip(np.rint(v), 0, 255).astype(np.uint8)


def resize(img: np.ndarray, tw: int, th: int) -> np.ndarray:
    """Exact port of the TS resize (box filter when shrinking ≥2×, else bilinear)."""
    h, w = img.shape[:2]
    sx, sy = w / tw, h / th
    src = img[..., :3].astype(np.float64)
    out = np.zeros((th, tw, 3), dtype=np.float64)
    if sx >= 2 or sy >= 2:
        for yy in range(th):
            y0 = math.floor(yy * sy)
            y1 = max(y0 + 1, math.floor((yy + 1) * sy))
            for xx in range(tw):
                x0 = math.floor(xx * sx)
                x1 = max(x0 + 1, math.floor((xx + 1) * sx))
                out[yy, xx] = src[y0 : min(h, y1), x0 : min(w, x1)].reshape(-1, 3).mean(axis=0)
        return _trunc_u8(out)
    fy = np.clip((np.arange(th) + 0.5) * sy - 0.5, 0, h - 1)
    fx = np.clip((np.arange(tw) + 0.5) * sx - 0.5, 0, w - 1)
    y0 = np.floor(fy).astype(int)
    x0 = np.floor(fx).astype(int)
    y1 = np.minimum(h - 1, y0 + 1)
    x1 = np.minimum(w - 1, x0 + 1)
    wy = (fy - y0)[:, None, None]
    wx = (fx - x0)[None, :, None]
    top = src[y0][:, x0] * (1 - wx) + src[y0][:, x1] * wx
    bot = src[y1][:, x0] * (1 - wx) + src[y1][:, x1] * wx
    return _trunc_u8(top * (1 - wy) + bot * wy)


def build_roi_mosaic(img: np.ndarray, boxes, size: int = PRE["roiSize"]) -> np.ndarray:
    if len(boxes) == 1:
        return resize(crop(img, boxes[0]), size, size)
    n = math.ceil(math.sqrt(len(boxes)))
    cell = size // n
    out = resize(crop(img, boxes[0]), size, size)
    for k, b in enumerate(boxes):
        tile = resize(crop(img, b), cell, cell)
        ox, oy = (k % n) * cell, (k // n) * cell
        out[oy : oy + cell, ox : ox + cell] = tile
    return out


# ---------------------------------------------------------------------------
# WHO severity — same JSON as src/ml/severityClassifier.ts
# ---------------------------------------------------------------------------
def who_group(age: float, sex: str, pregnant: bool):
    groups = THRESHOLDS["groups"]
    if pregnant and sex == "female":
        for k, g in groups.items():
            if g.get("pregnant"):
                return k, g
    for k, g in groups.items():
        if not g.get("pregnant") and g["minAge"] <= age < g["maxAge"] and g.get("sex") in (None, sex):
            return k, g
    raise ValueError(f"no WHO group for age={age} sex={sex}")


def altitude_adjustment(elevation_m: float | None) -> float:
    """WHO altitude adjustment (g/dL subtracted), same table as src/ml/altitude.ts."""
    if not elevation_m or elevation_m < 0 or elevation_m != elevation_m:  # None / NaN
        return 0.0
    adj = 0.0
    for b in sorted(THRESHOLDS["altitudeAdjustments"]["bands"], key=lambda b: b["minM"]):
        if elevation_m >= b["minM"]:
            adj = b["adjust"]
    return adj


def classify(hb: float, age: float, sex: str, pregnant: bool, altitude_m: float | None = None) -> str:
    """WHO severity after the altitude adjustment — mirrors SeverityClassifier.classify()."""
    _, g = who_group(age, sex, pregnant)
    v = js_round((hb - altitude_adjustment(altitude_m)) * 10) / 10
    if v >= g["normal"]:
        return "normal"
    if v >= g["mild"]:
        return "mild"
    if v >= g["moderate"]:
        return "moderate"
    return "severe"


# ---------------------------------------------------------------------------
# Conjunctiva helpers — port of src/imageProcessing/conjunctiva.ts
# ---------------------------------------------------------------------------
SCLERA_MIN_L, SCLERA_MAX_CHROMA = 70, 12


def _lab_px(px: np.ndarray):
    px = px.reshape(-1, 3).astype(np.int64)
    return rgb_to_lab(px[:, 0], px[:, 1], px[:, 2])


def drop_sclera_pixels(px: np.ndarray) -> np.ndarray:
    """Remove white-of-the-eye pixels (bright, colourless); returns N×1×3 (or the input if <50 remain)."""
    flat = px.reshape(-1, 3)
    L, a, b = _lab_px(flat)
    keep = ~((L > SCLERA_MIN_L) & (np.hypot(a, b) < SCLERA_MAX_CHROMA))
    return flat[keep].reshape(-1, 1, 3) if keep.sum() >= 50 else px


def median_hue(img: np.ndarray, box) -> float:
    x0, y0 = max(0, js_round(box[0])), max(0, js_round(box[1]))
    x1, y1 = min(img.shape[1], js_round(box[0] + box[2])), min(img.shape[0], js_round(box[1] + box[3]))
    L, a, b = _lab_px(img[y0:y1, x0:x1])
    ok = ~((L < 15) | ((L > SCLERA_MIN_L) & (np.hypot(a, b) < SCLERA_MAX_CHROMA)))
    return float(np.median(np.degrees(np.arctan2(b[ok], a[ok])))) if ok.any() else 90.0


def pick_pulled_eye(img: np.ndarray, boxes):
    """Keep only the eye with the pinker box (the pulled-down lower eyelid)."""
    return boxes if len(boxes) < 2 else [min(boxes, key=lambda bx: median_hue(img, bx))]
