"""
Image preprocessing — identical to the app (src/imageProcessing/*.ts, OpenCV.js backend).

  1. downscale so the longest side ≤ analysisMaxSide
  2. quality gate (Laplacian variance, brightness, clipping) — same thresholds
  3. gray-world white balance (per-channel gains clamped to maxWhiteBalanceGain)
  4. CLAHE on the L channel in Lab (cv2 — the same library as OpenCV.js)
  5. light 3×3 Gaussian denoise ONLY when the estimated noise is mild

Usage (single image preview):
    python preprocess.py path/to/image.jpg --out preview.png
"""
from __future__ import annotations

import argparse
import math

import cv2
import numpy as np

from common import PRE, QUALITY, luma


def load_rgb(path: str) -> np.ndarray:
    bgr = cv2.imread(path, cv2.IMREAD_COLOR)
    if bgr is None:
        raise FileNotFoundError(path)
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def fit_within(img: np.ndarray, max_side: int = PRE["analysisMaxSide"]) -> np.ndarray:
    """The app decodes with the browser canvas (high-quality smoothing); INTER_AREA is the closest match."""
    h, w = img.shape[:2]
    s = max_side / max(h, w)
    if s >= 1:
        return img
    return cv2.resize(img, (max(1, round(w * s)), max(1, round(h * s))), interpolation=cv2.INTER_AREA)


def sharpness_score(img: np.ndarray) -> float:
    """Port of src/imageProcessing/sharpness.ts: Laplacian variance of the sharpest tiles at 320 px."""
    c = QUALITY
    s = c["sharpnessSide"] / max(img.shape[:2])
    small = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_AREA) if s < 1 else img
    g = luma(small[..., 0].astype(np.float64), small[..., 1], small[..., 2])
    lap = cv2.Laplacian(g, cv2.CV_64F, ksize=1)[1:-1, 1:-1]
    h, w = lap.shape
    grid = c["sharpnessGrid"]
    th, tw = h // grid, w // grid
    if th < 2 or tw < 2:
        return 0.0
    tiles = sorted(float(lap[y * th:(y + 1) * th, x * tw:(x + 1) * tw].var()) for y in range(grid) for x in range(grid))
    return tiles[min(len(tiles) - 1, round(c["sharpnessPercentile"] * (len(tiles) - 1)))]


def unsharp(img: np.ndarray, amount: float = PRE["unsharpAmount"], sigma: float = PRE["unsharpSigma"]) -> np.ndarray:
    """Gentle unsharp mask for slightly soft photos (port of imageUtils.ts → unsharpMask)."""
    f = img.astype(np.float64)
    blur = cv2.GaussianBlur(f, (0, 0), sigma, borderType=cv2.BORDER_REPLICATE)
    return np.clip(np.rint(f + amount * (f - blur)), 0, 255).astype(np.uint8)


# --- quality gate (port of src/imageProcessing/qualityChecker.ts) ------------
def quality_check(img: np.ndarray) -> dict:
    c = QUALITY
    y = luma(img[..., 0].astype(np.float64), img[..., 1], img[..., 2])
    blur = sharpness_score(img)
    mean = float(y.mean())
    over = float((y >= c["overexposedLevel"]).mean())
    under = float((y <= c["underexposedLevel"]).mean())
    fails, warns = [], []
    if min(img.shape[:2]) < c["minSide"]:
        fails.append("tooSmall")
    if blur < c["blurFailThreshold"]:
        fails.append("blurry")
    elif blur < c["blurGoodThreshold"]:
        warns.append("slightlyBlurry")
    if mean < c["minMeanBrightness"]:
        fails.append("tooDark")
    elif mean > c["maxMeanBrightness"]:
        fails.append("tooBright")
    elif mean < c["goodMinMeanBrightness"]:
        warns.append("tooDark")
    elif mean > c["goodMaxMeanBrightness"]:
        warns.append("tooBright")
    if over > c["maxClippedFail"]:
        fails.append("tooBright")
    if under > c["maxClippedFail"]:
        fails.append("tooDark")
    if over + under > c["maxClippedWarn"] and "tooBright" not in fails and "tooDark" not in fails:
        warns.append("unevenLight")
    clamp01 = lambda v: max(0.0, min(1.0, v))  # noqa: E731
    blur_s = clamp01((blur - c["blurFailThreshold"]) / (c["blurGoodThreshold"] - c["blurFailThreshold"]))
    if mean < c["goodMinMeanBrightness"]:
        bright_s = clamp01((mean - c["minMeanBrightness"]) / (c["goodMinMeanBrightness"] - c["minMeanBrightness"]))
    elif mean > c["goodMaxMeanBrightness"]:
        bright_s = clamp01((c["maxMeanBrightness"] - mean) / (c["maxMeanBrightness"] - c["goodMaxMeanBrightness"]))
    else:
        bright_s = 1.0
    clip_s = clamp01(1 - (over + under) / c["maxClippedFail"])
    score = round((0.5 * blur_s + 0.3 * bright_s + 0.2 * clip_s) * 1000) / 1000
    status = "fail" if fails else ("borderline" if warns or score < c["passScore"] else "pass")
    return {"score": min(score, 0.39) if fails else score, "status": status, "reasons": sorted(set(fails + warns)), "blur": blur, "brightness": mean}


# --- preprocessing (port of src/imageProcessing/preprocessor.ts) -------------
def gray_world(img: np.ndarray, max_gain: float = PRE["maxWhiteBalanceGain"]) -> np.ndarray:
    f = img.astype(np.float64)
    means = f.reshape(-1, 3).mean(axis=0)
    gray = means.mean()
    gains = np.clip(gray / np.maximum(means, 1), 1 / max_gain, max_gain)
    return np.clip(np.rint(f * gains), 0, 255).astype(np.uint8)


def clahe_on_l(img: np.ndarray, clip: float = PRE["claheClipLimit"], grid: int = PRE["claheTileGrid"]) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2Lab)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=clip, tileGridSize=(grid, grid)).apply(l)
    return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_Lab2RGB)


def estimate_noise_sigma(img: np.ndarray) -> float:
    """Immerkær (1996) fast noise estimate on luma — same as estimateNoiseSigma() in the app."""
    y = luma(img[..., 0].astype(np.float64), img[..., 1], img[..., 2])
    h, w = y.shape
    if h < 3 or w < 3:
        return 0.0
    k = np.array([[1, -2, 1], [-2, 4, -2], [1, -2, 1]], dtype=np.float64)
    conv = cv2.filter2D(y, cv2.CV_64F, k, borderType=cv2.BORDER_CONSTANT)[1:-1, 1:-1]
    return float(np.abs(conv).sum() * math.sqrt(math.pi / 2) / (6 * (w - 2) * (h - 2)))


def preprocess(img: np.ndarray, sharpen: bool = False) -> tuple[np.ndarray, dict]:
    """sharpen=True for slightly soft photos (quality reason 'slightlyBlurry'), as in the app."""
    balanced = gray_world(img)
    contrasted = clahe_on_l(balanced)
    sigma = estimate_noise_sigma(contrasted)
    denoise = PRE["denoiseNoiseThreshold"] <= sigma < PRE["denoiseMaxNoise"]
    out = cv2.GaussianBlur(contrasted, (3, 3), 0) if denoise else contrasted
    sharpened = sharpen and not denoise
    if sharpened:
        out = unsharp(out)
    return out, {"noise_sigma": sigma, "denoised": denoise, "sharpened": sharpened}


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image")
    ap.add_argument("--out", default="preprocessed.png")
    args = ap.parse_args()
    img = fit_within(load_rgb(args.image))
    q = quality_check(img)
    print("quality:", q)
    if q["status"] == "fail":
        raise SystemExit("image fails the quality gate — the app would ask for a retake")
    out, info = preprocess(img)
    print("preprocess:", info)
    cv2.imwrite(args.out, cv2.cvtColor(np.hstack([img, out]), cv2.COLOR_RGB2BGR))
    print("wrote", args.out, "(left: original, right: preprocessed)")
