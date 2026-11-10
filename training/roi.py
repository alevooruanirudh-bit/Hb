"""
Region-of-interest extraction — mirrors src/ml/regionExtractor.ts and
src/imageProcessing/roiHeuristics.ts so models are trained on the same crops
the phone produces.

  eye   → MediaPipe Face Landmarker → strip under the lower eyelid (both eyes)
  nails → MediaPipe Hand Landmarker → box per fingernail bed (index..pinky)
  palm  → MediaPipe Hand Landmarker → square at the palm centre
  fallback (no landmarks): reddest window (eye) / bright skin cells (nails) / guide box

Uses the same .task models the app bundles (../public/mediapipe/models/).
"""
from __future__ import annotations

import math

import numpy as np

from common import APP_ROOT, PIPELINE, js_round, luma, pick_pulled_eye, rgb_to_lab

GUIDES = PIPELINE["guideBoxes"]
MODELS = APP_ROOT / "public/mediapipe/models"

EYES = [((33, 133), (145, 153, 144, 163, 7)), ((263, 362), (374, 380, 373, 390, 249))]
NAILS = [(8, 7), (12, 11), (16, 15), (20, 19)]
PALM = [0, 5, 9, 13, 17]


class LandmarkDetector:
    """Lazy MediaPipe Tasks landmarkers (IMAGE mode), same models as the app."""

    def __init__(self):
        self._hand = None
        self._face = None

    def _load(self):
        if self._hand is not None:
            return
        import mediapipe as mp
        from mediapipe.tasks.python import BaseOptions, vision

        self._mp = mp
        self._hand = vision.HandLandmarker.create_from_options(
            vision.HandLandmarkerOptions(base_options=BaseOptions(model_asset_path=str(MODELS / "hand_landmarker.task")), num_hands=1)
        )
        self._face = vision.FaceLandmarker.create_from_options(
            vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=str(MODELS / "face_landmarker.task")), num_faces=1)
        )

    def detect(self, region: str, img: np.ndarray):
        try:
            self._load()
        except Exception as e:  # mediapipe not installed / models missing
            print("[roi] MediaPipe unavailable, heuristics only:", e)
            return None
        h, w = img.shape[:2]
        mp_img = self._mp.Image(image_format=self._mp.ImageFormat.SRGB, data=np.ascontiguousarray(img))
        if region == "eye":
            res = self._face.detect(mp_img)
            if not res.face_landmarks:
                return None
            lm = res.face_landmarks[0]
            boxes = []
            for corners, lower in EYES:
                xs = [lm[i].x * w for i in corners]
                eye_w = abs(xs[0] - xs[1])
                lid_y = max(lm[i].y * h for i in lower)
                if eye_w > 12:
                    boxes.append((min(xs), lid_y - eye_w * 0.04, eye_w, eye_w * 0.28))
            return {"boxes": boxes, "confidence": 0.9, "method": "landmarks"} if boxes else None
        res = self._hand.detect(mp_img)
        if not res.hand_landmarks:
            return None
        lm = res.hand_landmarks[0]
        score = min(0.95, res.handedness[0][0].score) if res.handedness else 0.8
        dist = lambda a, b: math.hypot((a.x - b.x) * w, (a.y - b.y) * h)  # noqa: E731
        if region == "nails":
            boxes = []
            for tip, dip in NAILS:
                t, d = lm[tip], lm[dip]
                size = dist(t, d) * 0.95
                cx, cy = (t.x + (d.x - t.x) * 0.4) * w, (t.y + (d.y - t.y) * 0.4) * h
                if size > 8:
                    boxes.append((cx - size / 2, cy - size / 2, size, size))
            return {"boxes": boxes, "confidence": score, "method": "landmarks"} if boxes else None
        cx = sum(lm[i].x for i in PALM) / len(PALM) * w
        cy = sum(lm[i].y for i in PALM) / len(PALM) * h
        size = dist(lm[0], lm[9]) * 0.45
        return {"boxes": [(cx - size / 2, cy - size / 2, size, size)], "confidence": min(0.9, score), "method": "landmarks"}


# --- heuristics (port of roiHeuristics.ts) ----------------------------------
def guide_box_px(region, w, h):
    g = GUIDES[region]
    return (g["x"] * w, g["y"] * h, g["width"] * w, g["height"] * h)


def _is_skin(r, g, b):
    cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    return (cr >= 133) & (cr <= 180) & (cb >= 77) & (cb <= 135)


def skin_fraction(img, box, step=2):
    x0, y0 = max(0, js_round(box[0])), max(0, js_round(box[1]))
    x1, y1 = min(img.shape[1], js_round(box[0] + box[2])), min(img.shape[0], js_round(box[1] + box[3]))
    patch = img[y0:y1:step, x0:x1:step].astype(np.float64)
    if patch.size == 0:
        return 0.0
    return float(_is_skin(patch[..., 0], patch[..., 1], patch[..., 2]).mean())


def reddest_window(img, search, win_frac=0.35):
    cells = 16
    sx, sy, sw, sh = search
    cw, ch = sw / cells, sh / cells
    grid = np.zeros((cells, cells))
    for gy in range(cells):
        for gx in range(cells):
            vals = []
            for yy in range(3):
                for xx in range(3):
                    x = min(img.shape[1] - 1, math.floor(sx + (gx + (xx + 0.5) / 3) * cw))
                    y = min(img.shape[0] - 1, math.floor(sy + (gy + (yy + 0.5) / 3) * ch))
                    p = img[y, x].astype(np.int64)
                    vals.append(rgb_to_lab(np.array([p[0]]), np.array([p[1]]), np.array([p[2]]))[1][0])
            grid[gy, gx] = np.mean(vals)
    wc = max(2, js_round(cells * win_frac))
    hc = max(2, js_round(cells * win_frac * 0.6))
    best, bx, by = -np.inf, 0, 0
    for gy in range(cells - hc + 1):
        for gx in range(cells - wc + 1):
            s = grid[gy : gy + hc, gx : gx + wc].sum()
            if s > best:
                best, bx, by = s, gx, gy
    win_mean = best / (wc * hc)
    conf = max(0.0, min(0.7, (win_mean - grid.mean()) / 25 + (0.25 if win_mean > 12 else 0)))
    return (sx + bx * cw, sy + by * ch, wc * cw, hc * ch), conf


def nail_bed_windows(img, search, n=8):
    cols = 14
    cell = search[2] / cols
    rows = max(1, math.floor(search[3] / cell))
    cells = []
    for gy in range(rows):
        for gx in range(cols):
            box = (search[0] + gx * cell, search[1] + gy * cell, cell, cell)
            if skin_fraction(img, box, 2) < 0.85:
                continue
            y0, x0 = js_round(box[1]), js_round(box[0])
            patch = img[y0 : min(img.shape[0], math.ceil(box[1] + cell)) : 2, x0 : min(img.shape[1], math.ceil(box[0] + cell)) : 2].astype(np.float64)
            cells.append((gx, gy, float(luma(patch[..., 0], patch[..., 1], patch[..., 2]).mean())))
    if len(cells) < 3:
        return [], 0.0
    ordered = sorted(cells, key=lambda c: -c[2])
    median = ordered[len(ordered) // 2][2]
    picked = []
    for c in ordered:
        if len(picked) >= n or c[2] < median + 8:
            break
        if any(abs(p[0] - c[0]) + abs(p[1] - c[1]) <= 1 for p in picked):
            continue
        picked.append(c)
    boxes = [(search[0] + c[0] * cell, search[1] + c[1] * cell, cell, cell) for c in picked]
    return boxes, (0.45 if len(boxes) >= 3 else 0.3 if boxes else 0.0)


def heuristic_detection(region, img):
    h, w = img.shape[:2]
    search = (w * 0.08, h * 0.08, w * 0.84, h * 0.84)
    if region == "eye":
        box, conf = reddest_window(img, search)
        return {"boxes": [box], "confidence": conf, "method": "colorHeuristic"} if conf >= 0.25 else None
    g = guide_box_px(region, w, h)
    if region == "nails":
        boxes, conf = nail_bed_windows(img, search)
        if boxes:
            return {"boxes": boxes, "confidence": conf, "method": "colorHeuristic"}
    skin = skin_fraction(img, g)
    if skin < 0.3:
        return None
    inset = 0.2 if region == "palm" else 0.1
    box = (g[0] + g[2] * inset, g[1] + g[3] * inset, g[2] * (1 - 2 * inset), g[3] * (1 - 2 * inset))
    return {"boxes": [box], "confidence": min(0.55, 0.25 + skin * 0.35), "method": "guideBox"}


def detect_region(region: str, img: np.ndarray, detector: LandmarkDetector | None):
    """Landmarks first (on the ORIGINAL image, like the app), then heuristics."""
    det = detector.detect(region, img) if detector else None
    det = det or heuristic_detection(region, img)
    if det and region == "eye":
        det["boxes"] = pick_pulled_eye(img, det["boxes"])
    return det
