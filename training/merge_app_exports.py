"""Adds blood-test data collected by the app ("Export learning data") to the training features.

Each export file (Settings → Learning from blood tests → Export) holds, per scan with a real
blood test: the colour features of each scanned area (computed by the app with the SAME code as
training — see tests/test_parity.py), the lab hemoglobin, age, sex and state. No photos, no names.

    python merge_app_exports.py                         # data/app_exports/*.json → artifacts/features_with_app.npz
    python train.py --features artifacts/features_with_app.npz
    python export.py --skip-cnn --palm --version <new-version>

App users are Indian, so these rows get the Indian sample weight in train.py.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from common import ARTIFACTS, COLOR_FEATURE_NAMES

HERE = Path(__file__).resolve().parent
DATASET_NAME = "HemoScan app users (India)"
MAX_DAYS_APART = 7
HB_REGIONS = {"eye", "nails"}  # the palm is a yes/no check, not a hemoglobin regressor


def load_exports(folder: Path) -> list[dict]:
    rows: list[dict] = []
    seen: set[tuple] = set()
    for f in sorted(folder.glob("*.json")):
        d = json.loads(f.read_text())
        if d.get("format") != "hemoscan-learning-v1":
            print(f"  skip {f.name}: not a HemoScan learning export")
            continue
        if list(d.get("colorFeatureNames", [])) != list(COLOR_FEATURE_NAMES):
            print(f"  skip {f.name}: colour features differ from this training code (app version {d.get('appVersion')})")
            continue
        kept = 0
        for s in d["samples"]:
            if s["region"] not in HB_REGIONS or s.get("labHb") is None:
                continue
            if s.get("daysBetweenScanAndTest", 99) > MAX_DAYS_APART or not (3 <= s["labHb"] <= 22):
                continue
            # The same phone may be exported twice — drop exact duplicates.
            key = (s["scanDate"], s["region"], round(s["labHb"], 1), tuple(np.round(s["colorFeatures"][:5], 4)))
            if key in seen:
                continue
            seen.add(key)
            rows.append({**s, "subject_id": f"app-{f.stem}-{s['person']}", "source_file": f.name})
            kept += 1
        print(f"  {f.name}: {kept} usable samples from {d.get('people')} people")
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--exports", default=str(HERE / "data" / "app_exports"))
    ap.add_argument("--features", default=str(ARTIFACTS / "features.npz"))
    ap.add_argument("--out", default=str(ARTIFACTS / "features_with_app.npz"))
    args = ap.parse_args()

    rows = load_exports(Path(args.exports))
    if not rows:
        raise SystemExit(f"No usable app samples in {args.exports}")
    base = dict(np.load(args.features, allow_pickle=True))
    n = len(rows)

    new = {
        "X_color": np.array([r["colorFeatures"] for r in rows], dtype=np.float64),
        "region": np.array([r["region"] for r in rows], dtype=object),
        "hb": np.array([r["labHb"] for r in rows], dtype=np.float64),
        "age": np.array([r["ageYears"] if r.get("ageYears") is not None else 30.0 for r in rows], dtype=np.float64),
        "sex": np.array([r.get("sex") or "unknown" for r in rows], dtype=object),
        "pregnant": np.array([int(bool(r.get("pregnant"))) for r in rows], dtype=np.int64),
        "skin_tone": np.array([r.get("skinTone") or "unknown" for r in rows], dtype=object),
        "subject_id": np.array([r["subject_id"] for r in rows], dtype=object),
        "image_path": np.array([r["source_file"] for r in rows], dtype=object),
        "quality_score": np.array([r.get("quality") or 1.0 for r in rows], dtype=np.float64),
        "quality_status": np.array(["pass"] * n, dtype=object),
        "detection_method": np.array(["app"] * n, dtype=object),
        "detection_confidence": np.ones(n),
        "altitude_m": np.array([r.get("altitudeM") or 0.0 for r in rows], dtype=np.float64),
        "dataset": np.array([DATASET_NAME] * n, dtype=object),
    }
    out = {}
    for k, v in base.items():
        if k in new:
            out[k] = np.concatenate([v, new[k]])
        elif k == "X_cnn":  # app exports carry no CNN embedding
            out[k] = np.concatenate([v, np.zeros((n, v.shape[1]), dtype=v.dtype)])
        else:
            out[k] = v
    np.savez_compressed(args.out, **out)
    people = len({r["subject_id"] for r in rows})
    print(f"wrote {args.out}: {len(base['hb'])} existing + {n} app samples ({people} people)")


if __name__ == "__main__":
    main()
