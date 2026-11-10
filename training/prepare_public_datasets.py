"""
Builds artifacts/features.npz from two PUBLIC datasets with lab-measured hemoglobin:

  EYE   — CP-AnemiC (Asare et al. 2023), Mendeley Data doi:10.17632/m53vz6b7fx.1, CC BY 4.0
          710 children aged 6–59 months, 10 hospitals in Ghana. Images are segmented
          palpebral-conjunctiva cut-outs (transparent background); Hb from lab blood count.
  NAILS — Dataset of human skin and fingernails images for non-invasive haemoglobin level
          assessment (Moscow), figshare doi:10.6084/m9.figshare.c.6760179, CC0.
          250 adults aged 18–95; hand photos under a white LED with nail bounding boxes;
          Hb from venous blood (haematology analyser).

No public dataset with PALM photos + hemoglobin VALUES was found (the Ghana palm set has
only anemic / non-anemic labels), so no palm model is trained.

Processing mirrors the app wherever the data allows:
  nails: full photo → fit_within(640) → quality gate → gray-world + CLAHE (preprocess.py)
         → ROI mosaic of the annotated nail boxes → color features
  eye:   the cut-outs contain ONLY conjunctiva pixels (no surrounding scene), so a
         whole-image white balance is impossible; features are computed on the masked
         conjunctiva pixels directly (the tablet camera's own white balance applies).

Usage:
    python prepare_public_datasets.py --raw data/raw
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
import pandas as pd

from common import ARTIFACTS, COLOR_FEATURE_NAMES, FEAT, build_roi_mosaic, drop_sclera_pixels, extract_color_features
from preprocess import fit_within, load_rgb, preprocess, quality_check
from roi import LandmarkDetector, detect_region


def eye_rows(raw: Path):
    sheet = pd.read_excel(raw / "conjunctiva/Anemia_Data_Collection_Sheet.xlsx")
    rows, feats = [], []
    for r in sheet.itertuples():
        sub = "Anemic" if str(r.REMARK).strip().lower() == "anemic" else "Non-anemic"
        path = raw / "conjunctiva" / sub / f"{r.IMAGE_ID}.png"
        if not path.exists():
            continue
        rgba = cv2.cvtColor(cv2.imread(str(path), cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA)
        mask = rgba[..., 3] > 200
        if mask.sum() < 200:
            continue
        px = rgba[..., :3][mask].reshape(-1, 1, 3)  # conjunctiva pixels only
        feats.append(extract_color_features(drop_sclera_pixels(px)))  # same filter as the app
        rows.append(
            dict(
                region="eye", hb=float(r.HB_LEVEL), age=float(r._4) / 12.0, sex=str(r.GENDER).lower(),
                pregnant=0, skin_tone="unknown", subject_id=f"ghana-{r.IMAGE_ID}", image_path=str(path.relative_to(raw)),
                quality_score=1.0, quality_status="pass", detection_method="annotated", detection_confidence=1.0,
                altitude_m=0.0, dataset="CP-AnemiC (Ghana, children)",
            )
        )
    return rows, feats


EDA_DEFAULT = Path.home() / ".cache/kagglehub/datasets/harshwardhanfartale/eyes-defy-anemia/versions/1/dataset anemia"


def eyes_defy_rows(root: Path):
    """Eyes-defy-anemia (Dimauro et al.): adult conjunctiva photos from India (95) and Italy (123)
    with lab Hb, age and sex. The *_palpebral.png files are palpebral-conjunctiva cut-outs — the
    same tissue and format as CP-AnemiC — so features come from the masked pixels the same way."""
    rows, feats = [], []
    if not root.exists():
        print(f"  eyes-defy-anemia not found at {root} — skipped (download with kagglehub)")
        return rows, feats
    for country in ("India", "Italy"):
        sheet = pd.read_excel(root / country / f"{country}.xlsx")
        for r in sheet.itertuples():
            if any(isinstance(v, str) and "ELIMINATO" in v.upper() for v in r[1:]):
                continue  # rows the authors marked as removed
            try:
                hb = float(str(r.Hgb).replace(",", "."))
            except ValueError:
                continue
            folder = root / country / str(int(r.Number))
            masks = sorted(folder.glob("*_palpebral.png"))
            masks = [m for m in masks if "forniceal" not in m.name]
            if not masks:
                continue
            rgba = cv2.imread(str(masks[0]), cv2.IMREAD_UNCHANGED)
            if rgba is None or rgba.ndim != 3 or rgba.shape[2] != 4:
                continue
            if rgba.dtype == np.uint16:  # some masks are 16-bit PNGs
                rgba = (rgba / 257).round().astype(np.uint8)
            rgba = cv2.cvtColor(rgba, cv2.COLOR_BGRA2RGBA)
            mask = rgba[..., 3] > 200
            if mask.sum() < 200:
                continue
            feats.append(extract_color_features(drop_sclera_pixels(rgba[..., :3][mask].reshape(-1, 1, 3))))
            rows.append(
                dict(
                    region="eye", hb=hb, age=float(r.Age), sex="female" if str(r.Gender).upper().startswith("F") else "male",
                    pregnant=0, skin_tone="unknown", subject_id=f"eda-{country}-{int(r.Number)}",
                    image_path=str(masks[0]), quality_score=1.0, quality_status="pass", detection_method="annotated",
                    detection_confidence=1.0, altitude_m=0.0, dataset=f"Eyes-defy-anemia ({country}, adults)",
                )
            )
    return rows, feats


def nail_rows(raw: Path, detector: LandmarkDetector | None):
    meta = pd.read_csv(raw / "skin_nails/metadata.csv")
    rows, feats = [], []
    skipped = 0
    methods: dict[str, int] = {}
    for r in meta.itertuples():
        path = raw / "skin_nails/photo" / f"{r.PATIENT_ID}.jpg"
        if not path.exists():
            continue
        img0 = load_rgb(str(path))
        img = fit_within(img0)
        s = img.shape[1] / img0.shape[1]
        # These studio photos are mostly a flat white card, which would fail a whole-frame
        # blur/brightness check; judge quality on the hand area around the annotated boxes
        # (in the app the guide box makes the hand fill the frame instead).
        allb = np.array(json.loads(r.NAIL_BOUNDING_BOXES) + json.loads(r.SKIN_BOUNDING_BOXES), dtype=float) * s
        x0, y0 = allb[:, 0].min(), allb[:, 1].min()
        x1, y1 = allb[:, 2].max(), allb[:, 3].max()
        mx, my = (x1 - x0) * 0.25, (y1 - y0) * 0.25
        hand = img[max(0, int(y0 - my)) : int(y1 + my), max(0, int(x0 - mx)) : int(x1 + mx)]
        q = quality_check(hand)
        boxes = [(x1 * s, y1 * s, (x2 - x1) * s, (y2 - y1) * s) for x1, y1, x2, y2 in json.loads(r.NAIL_BOUNDING_BOXES)]
        # Reject genuinely blurry photos, and photos whose NAIL pixels are clipped (the white
        # card is always bright; that alone is not a problem for the nail colour).
        raw_roi = build_roi_mosaic(img, boxes)
        clipped = float((raw_roi.max(axis=2) >= 250).mean())
        if "blurry" in q["reasons"] or clipped > 0.35:  # glare pixels are excluded from features anyway
            skipped += 1
            continue
        # Default: expert-annotated nail boxes (tight nail-plate boxes, like the app's MediaPipe
        # landmark crops on a normal phone photo). --app-detector uses the app's detector instead.
        det = detect_region("nails", img, detector) if detector else None
        method = det["method"] if det else "annotated"
        det_boxes = det["boxes"] if det else boxes
        methods[method] = methods.get(method, 0) + 1
        pre, _ = preprocess(img, sharpen="slightlyBlurry" in q["reasons"])
        roi = build_roi_mosaic(pre, det_boxes)
        feats.append(extract_color_features(roi))
        rows.append(
            dict(
                region="nails", hb=float(r.HB_LEVEL_GperL) / 10.0, age=56.0, sex="unknown", pregnant=0,
                skin_tone="unknown", subject_id=f"moscow-{r.PATIENT_ID}", image_path=str(path.relative_to(raw)),
                quality_score=q["score"], quality_status=q["status"], detection_method=method,
                detection_confidence=det["confidence"] if det else 1.0, altitude_m=0.0,
                dataset="Skin & fingernails (Moscow, adults)",
            )
        )
    print(f"  nails: {len(rows)} used, {skipped} failed the quality gate; ROI method: {methods}")
    return rows, feats


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--raw", default=str(Path(__file__).parent / "data/raw"))
    ap.add_argument("--out", default=str(ARTIFACTS / "features.npz"))
    ap.add_argument("--eyes-defy", default=str(EDA_DEFAULT), help="folder containing India/ and Italy/ of Eyes-defy-anemia")
    ap.add_argument(
        "--app-detector",
        action="store_true",
        help="crop nails with the app's detector instead of the expert-annotated boxes. On this dataset "
        "(hands enter the frame sideways) MediaPipe finds 1/196 hands and the heuristic crops give a much "
        "weaker model (r 0.29 vs 0.42), so annotated boxes are the default.",
    )
    args = ap.parse_args()
    raw = Path(args.raw)

    er, ef = eye_rows(raw)
    print(f"  eye (Ghana children): {len(er)} used")
    n_ghana = len(er)
    dr, df_ = eyes_defy_rows(Path(args.eyes_defy))
    print(f"  eye (Eyes-defy-anemia adults): {len(dr)} used — India {sum('India' in r['dataset'] for r in dr)}, Italy {sum('Italy' in r['dataset'] for r in dr)}")
    er, ef = er + dr, ef + df_
    nr, nf = nail_rows(raw, LandmarkDetector() if args.app_detector else None)
    meta = pd.DataFrame(er + nr)
    X_color = np.stack(ef + nf)
    ARTIFACTS.mkdir(exist_ok=True)
    np.savez_compressed(
        args.out,
        X_cnn=np.zeros((len(meta), 0), dtype=np.float32),
        X_color=X_color,
        has_cnn=np.array(False),
        color_feature_names=np.array(COLOR_FEATURE_NAMES),
        **{c: meta[c].to_numpy() for c in meta.columns},
    )
    print(f"wrote {args.out}: {len(meta)} samples")
    (ARTIFACTS / "datasets.json").write_text(json.dumps([
        {"region": "eye", "name": "CP-AnemiC (A Conjunctival Pallor) Dataset from Ghana", "doi": "10.17632/m53vz6b7fx.1",
         "license": "CC BY 4.0", "population": "710 children aged 6–59 months, Ghana", "n": n_ghana,
         "minAge": 0.5, "maxAge": 5},
        {"region": "eye", "name": "Eyes-defy-anemia (India + Italy)", "doi": "Kaggle harshwardhanfartale/eyes-defy-anemia; IEEE DataPort",
         "license": "see dataset page", "population": "adults aged 18–90: 95 from India, 123 from Italy", "n": len(dr),
         "minAge": 18, "maxAge": 90},
        {"region": "nails", "name": "Dataset of human skin and fingernails images for non-invasive haemoglobin level assessment",
         "doi": "10.6084/m9.figshare.c.6760179", "license": "CC0", "population": "250 adults aged 18–95, Moscow (Russia)", "n": len(nr),
         "minAge": 18, "maxAge": 95},
    ], indent=2, ensure_ascii=False))
    print(meta.groupby("region").hb.describe().round(2).to_string())
    assert X_color.shape[1] == len(COLOR_FEATURE_NAMES), "feature layout mismatch"
    _ = FEAT


if __name__ == "__main__":
    main()
