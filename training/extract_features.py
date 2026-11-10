"""
Feature extraction: quality gate → preprocessing → ROI → CNN embedding + color features.

Input: a CSV described in README.md (image_path, region, hb, age, sex, pregnant,
skin_tone, subject_id [, roi_boxes]).

Output: artifacts/features.npz with
    X_cnn   (N × 576)  MobileNetV3-Small global-average-pool embedding
    X_color (N × 55)   color features (same layout as the app)
    region, hb, age, sex, pregnant, skin_tone, subject_id, quality_score, quality_status, detection_method

Usage:
    python extract_features.py --csv data/labels.csv --images data/ [--no-cnn] [--limit 50]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from common import ARTIFACTS, COLOR_FEATURE_NAMES, FEAT, PRE, build_roi_mosaic, extract_color_features
from preprocess import fit_within, load_rgb, preprocess, quality_check
from roi import LandmarkDetector, detect_region


class CnnEmbedder:
    """MobileNetV3-Small (ImageNet) without the classifier head, global-average pooled → 576-d.

    Keras' MobileNetV3 has its preprocessing built in and expects raw 0–255
    pixels, which is what the app feeds TF.js ("normalization": "0_255").
    If artifacts/cnn_finetuned.keras exists (optional fine-tuning), it is used instead.
    """

    def __init__(self, size: int = PRE["roiSize"]):
        import tensorflow as tf

        finetuned = ARTIFACTS / "cnn_finetuned.keras"
        if finetuned.exists():
            self.model = tf.keras.models.load_model(finetuned)
        else:
            self.model = tf.keras.applications.MobileNetV3Small(
                input_shape=(size, size, 3), include_top=False, pooling="avg", weights="imagenet", include_preprocessing=True
            )
        assert self.model.output_shape[-1] == FEAT["cnnEmbeddingSize"], (
            f"embedding size {self.model.output_shape[-1]} != pipeline.json features.cnnEmbeddingSize"
        )

    def __call__(self, rois: list[np.ndarray]) -> np.ndarray:
        batch = np.stack(rois).astype(np.float32)
        return self.model.predict(batch, verbose=0)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--csv", required=True)
    ap.add_argument("--images", default=".", help="base folder for relative image paths")
    ap.add_argument("--out", default=str(ARTIFACTS / "features.npz"))
    ap.add_argument("--no-cnn", action="store_true", help="skip CNN (color features only; XGBoost cannot be trained)")
    ap.add_argument("--no-landmarks", action="store_true", help="skip MediaPipe (heuristic ROI only)")
    ap.add_argument("--keep-fails", action="store_true", help="keep images that fail the quality gate")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--save-rois", action="store_true", help="write ROI mosaics to artifacts/rois/ for inspection")
    args = ap.parse_args()

    df = pd.read_csv(args.csv)
    required = {"image_path", "region", "hb", "age", "sex", "skin_tone", "subject_id"}
    missing = required - set(df.columns)
    if missing:
        raise SystemExit(f"CSV missing columns: {sorted(missing)}")
    if "pregnant" not in df.columns:
        df["pregnant"] = 0
    if "altitude_m" not in df.columns:
        df["altitude_m"] = 0.0
    if args.limit:
        df = df.head(args.limit)

    ARTIFACTS.mkdir(exist_ok=True)
    if args.save_rois:
        (ARTIFACTS / "rois").mkdir(exist_ok=True)
    detector = None if args.no_landmarks else LandmarkDetector()
    embedder = None if args.no_cnn else CnnEmbedder()

    rows, colors, rois = [], [], []
    skipped = {"quality": 0, "roi": 0, "read": 0}
    for i, r in df.iterrows():
        try:
            img = fit_within(load_rgb(str(Path(args.images) / r.image_path)))
        except FileNotFoundError:
            skipped["read"] += 1
            continue
        q = quality_check(img)
        if q["status"] == "fail" and not args.keep_fails:
            skipped["quality"] += 1
            continue
        if isinstance(r.get("roi_boxes"), str) and r.roi_boxes.strip():
            det = {"boxes": [tuple(b) for b in json.loads(r.roi_boxes)], "confidence": 1.0, "method": "annotated"}
        else:
            det = detect_region(r.region, img, detector)
        if det is None:
            skipped["roi"] += 1
            continue
        pre, _ = preprocess(img)
        roi = build_roi_mosaic(pre, det["boxes"])
        colors.append(extract_color_features(roi))
        rois.append(roi)
        rows.append(
            dict(
                region=r.region, hb=float(r.hb), age=float(r.age), sex=r.sex, pregnant=int(r.pregnant),
                skin_tone=str(r.skin_tone), subject_id=str(r.subject_id), image_path=r.image_path,
                altitude_m=float(r.altitude_m) if r.altitude_m == r.altitude_m else 0.0,
                quality_score=q["score"], quality_status=q["status"], detection_method=det["method"],
                detection_confidence=det["confidence"],
            )
        )
        if args.save_rois:
            import cv2
            cv2.imwrite(str(ARTIFACTS / "rois" / f"{i:06d}_{r.region}.png"), cv2.cvtColor(roi, cv2.COLOR_RGB2BGR))
        if (len(rows)) % 100 == 0:
            print(f"  {len(rows)} processed …")

    if not rows:
        raise SystemExit(f"No usable images. Skipped: {skipped}")

    X_cnn = np.zeros((len(rois), FEAT["cnnEmbeddingSize"]), dtype=np.float32)
    if embedder:
        for s in range(0, len(rois), 32):
            X_cnn[s : s + 32] = embedder(rois[s : s + 32])

    meta = pd.DataFrame(rows)
    np.savez_compressed(
        args.out,
        X_cnn=X_cnn,
        X_color=np.stack(colors),
        has_cnn=np.array(embedder is not None),
        color_feature_names=np.array(COLOR_FEATURE_NAMES),
        **{c: meta[c].to_numpy() for c in meta.columns},
    )
    print(f"wrote {args.out}: {len(rows)} samples, skipped {skipped}")
    print(meta.groupby("region").size().to_string())


if __name__ == "__main__":
    main()
