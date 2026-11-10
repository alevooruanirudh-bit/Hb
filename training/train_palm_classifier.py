"""
Palm pallor CLASSIFIER (anemic vs non-anemic) from the Ghana palm dataset.

  Data: "Anemia Detection using Palpable Palm Image Datasets from Ghana" (Asare et al.),
        Mendeley Data doi:10.17632/ccr8cm22vz.1, CC BY 4.0. Children aged 6–59 months,
        labelled anemic / non-anemic (Hb < 11 g/dL) by lab blood count.
        The files carry NO per-image hemoglobin value, so no Hb regression is possible —
        the app uses this model only as an "anemia-looking?" check next to the Hb estimate.

  The set is augmented (~6 copies per photo: rotations, flips, "FV"/"RA" variants).
  All copies of one original photo are kept in the same fold (StratifiedGroupKFold),
  and metrics are computed once per original photo — otherwise results are inflated.

Features: the same colour features the app computes (common.extract_color_features) on the
raw palm crop (as with the eye model, the crops have no surrounding scene to white-balance).

Outputs: artifacts/palm_clf.json (XGBoost), artifacts/palm_info.json (metrics, threshold).
Export: python export.py --palm   → src/ml/models/palmClassifier.ts

Usage:
    python train_palm_classifier.py --raw data/raw
"""
from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path

import cv2
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import balanced_accuracy_score, roc_auc_score
from sklearn.model_selection import StratifiedGroupKFold

from common import ARTIFACTS, extract_color_features

PARAMS = dict(n_estimators=300, max_depth=3, learning_rate=0.05, subsample=0.8, colsample_bytree=0.6, base_score=0.5)


def load(raw: Path):
    folder = raw / "palm/Palm"
    X, y, groups = [], [], []
    for f in sorted(os.listdir(folder)):
        m = re.match(r"(?i)(non-?anemic|anemic)\D*?(\d+)", f)
        if not f.endswith(".png") or not m:
            continue
        cls = 0 if m.group(1).lower().startswith("non") else 1
        img = cv2.imread(str(folder / f), cv2.IMREAD_UNCHANGED)
        if img is None:
            continue
        if img.ndim == 3 and img.shape[2] == 4:
            px = cv2.cvtColor(img, cv2.COLOR_BGRA2RGB)[img[..., 3] > 200].reshape(-1, 1, 3)
        else:
            px = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        if px.size < 300:
            continue
        X.append(extract_color_features(px))
        y.append(cls)
        groups.append(f"{cls}-{int(m.group(2))}")  # every augmented copy of one photo shares a group
    return np.array(X), np.array(y), np.array(groups)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--raw", default=str(Path(__file__).parent / "data/raw"))
    args = ap.parse_args()
    X, y, g = load(Path(args.raw))
    print(f"{len(y)} images from {len(set(g))} original photos; anemic share {y.mean():.2f}")

    oof = np.zeros(len(y))
    for tr, va in StratifiedGroupKFold(5, shuffle=True, random_state=0).split(X, y, g):
        oof[va] = xgb.XGBClassifier(**PARAMS).fit(X[tr], y[tr]).predict_proba(X[va])[:, 1]
    per_photo = pd.DataFrame({"g": g, "y": y, "p": oof}).groupby("g").mean()
    auc = roc_auc_score(per_photo.y, per_photo.p)
    # Threshold: maximise balanced accuracy (Youden) on held-out photos.
    ths = np.linspace(0.2, 0.8, 61)
    bal = [balanced_accuracy_score(per_photo.y, per_photo.p >= t) for t in ths]
    t_best = float(ths[int(np.argmax(bal))])
    pred = per_photo.p >= t_best
    sens = float((pred & (per_photo.y == 1)).sum() / (per_photo.y == 1).sum())
    spec = float((~pred & (per_photo.y == 0)).sum() / (per_photo.y == 0).sum())
    print(f"held-out per photo: AUC {auc:.3f} | threshold {t_best:.2f} → sensitivity {sens:.2f}, specificity {spec:.2f}")

    ARTIFACTS.mkdir(exist_ok=True)
    xgb.XGBClassifier(**PARAMS).fit(X, y).save_model(ARTIFACTS / "palm_clf.json")
    np.savez_compressed(ARTIFACTS / "palm_features.npz", X=X, y=y)
    info = {
        "task": "anemic vs non-anemic (Hb < 11 g/dL, children 6–59 months)",
        "dataset": {
            "name": "Anemia Detection using Palpable Palm Image Datasets from Ghana",
            "doi": "10.17632/ccr8cm22vz.1",
            "license": "CC BY 4.0",
            "population": "children aged 6–59 months, Ghana",
            "photos": int(len(set(g))),
            "minAge": 0.5,
            "maxAge": 5,
        },
        "auc": round(float(auc), 3),
        "threshold": round(t_best, 2),
        "sensitivity": round(sens, 2),
        "specificity": round(spec, 2),
    }
    (ARTIFACTS / "palm_info.json").write_text(json.dumps(info, indent=2, ensure_ascii=False))
    print("saved artifacts/palm_clf.json, palm_info.json")


if __name__ == "__main__":
    main()
