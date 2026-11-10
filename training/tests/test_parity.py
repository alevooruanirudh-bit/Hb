"""
App ↔ training parity tests. Fixtures are produced by the app's own TypeScript
code (scripts/export-parity-fixtures.ts). Run:

    cd training && python -m pytest tests/        (or: python tests/test_parity.py)

Checks that the Python port produces the same
  • color features (Lab / HSV / histograms / percentiles)
  • ROI mosaic pixels (crop + resize + tiling)
  • heuristic region detection boxes (used when MediaPipe finds no landmarks)
as the app, so models trained here see the same inputs as on the phone.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from common import COLOR_FEATURE_NAMES, build_roi_mosaic, extract_color_features  # noqa: E402
from roi import heuristic_detection  # noqa: E402

FIX = Path(__file__).parent / "fixtures"
NAMES = sorted(p.name[: -len(".json")] for p in FIX.glob("*.json"))


def read_rgba(path: Path) -> np.ndarray:
    buf = path.read_bytes()
    w, h = np.frombuffer(buf[:8], dtype="<u4")
    return np.frombuffer(buf[8:], dtype=np.uint8).reshape(h, w, 4)[..., :3].copy()


def load(name):
    meta = json.loads((FIX / f"{name}.json").read_text())
    return meta, read_rgba(FIX / f"{name}.orig.rgba"), read_rgba(FIX / f"{name}.pre.rgba"), read_rgba(FIX / f"{name}.roi.rgba")


def test_fixtures_exist():
    assert NAMES, "no fixtures — run scripts/export-parity-fixtures.ts (see docstring)"


def test_feature_names_match():
    for name in NAMES:
        assert load(name)[0]["featureNames"] == COLOR_FEATURE_NAMES


def test_color_features_match():
    for name in NAMES:
        meta, _, _, roi = load(name)
        py = extract_color_features(roi)
        js = np.array(meta["features"])
        diff = np.abs(py - js)
        worst = COLOR_FEATURE_NAMES[int(diff.argmax())]
        assert diff.max() < 1e-4, f"{name}: max diff {diff.max():.2e} at {worst}"


def test_roi_mosaic_matches():
    for name in NAMES:
        meta, _, pre, roi = load(name)
        py = build_roi_mosaic(pre, [(b["x"], b["y"], b["width"], b["height"]) for b in meta["detection"]["boxes"]])
        mismatch = (np.abs(py.astype(int) - roi.astype(int)) > 1).mean()
        assert mismatch < 0.001, f"{name}: {100 * mismatch:.2f}% of ROI pixels differ by >1"


def test_heuristic_detection_matches():
    for name in NAMES:
        meta, orig, _, _ = load(name)
        det = heuristic_detection(meta["region"], orig)
        assert det is not None, name
        assert det["method"] == meta["detection"]["method"], name
        js_boxes = np.array([[b["x"], b["y"], b["width"], b["height"]] for b in meta["detection"]["boxes"]])
        assert np.allclose(np.array(det["boxes"]), js_boxes, atol=1e-6), f"{name}: boxes differ"
        assert abs(det["confidence"] - meta["detection"]["confidence"]) < 1e-6, name


if __name__ == "__main__":
    for fn in [v for k, v in dict(globals()).items() if k.startswith("test_")]:
        fn()
        print("✓", fn.__name__)
