"""Model scorecard shown in the app (Settings → Model performance).

Every number comes from OUT-OF-FOLD predictions (artifacts/oof_predictions.csv, written by
train.py with person-grouped cross-validation): each person was predicted by a model that never
saw them. The value used is what the phone shows (XGBoost, or the Random Forest fallback).

Anemia yes/no uses the WHO 2011 cutoff for each person's age / sex / pregnancy
(src/config/severityThresholds.json, the same file the app uses).

    python model_metrics.py            # → artifacts/metrics.json (export.py copies it into model-info.json)
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

from common import ARTIFACTS

ROOT = Path(__file__).resolve().parent.parent
GROUPS = json.loads((ROOT / "src" / "config" / "severityThresholds.json").read_text())["groups"]


def who_group(age: float, sex: str, pregnant: bool) -> dict:
    if sex == "female" and pregnant:
        return GROUPS["pregnant"]
    if age < 5:
        return GROUPS["child_6_59m"]
    if age < 12:
        return GROUPS["child_5_11y"]
    if age < 15:
        return GROUPS["child_12_14y"]
    return GROUPS["men_15plus"] if sex == "male" else GROUPS["women_15plus"]


def severity(hb: float, g: dict) -> int:
    return 0 if hb >= g["normal"] else 1 if hb >= g["mild"] else 2 if hb >= g["moderate"] else 3


def scores(d: pd.DataFrame, offsets: dict) -> dict:
    y, p = d.hb.to_numpy(float), d.pred.to_numpy(float)
    grp = [who_group(a, s, bool(pr)) for a, s, pr in zip(d.age, d.sex.astype(str), d.pregnant)]
    thr = np.array([g["normal"] for g in grp])
    actual, flagged = y < thr, p < thr
    tp, tn = int((actual & flagged).sum()), int((~actual & ~flagged).sum())
    fp, fn = int((~actual & flagged).sum()), int((actual & ~flagged).sum())
    prec = tp / (tp + fp) if tp + fp else 0.0
    rec = tp / (tp + fn) if tp + fn else 0.0
    spec = tn / (tn + fp) if tn + fp else 0.0
    err = p - y
    lo = d.xgb_lower.to_numpy(float)
    hi = d.xgb_upper.to_numpy(float)
    off = d.region.map(offsets).fillna(0).to_numpy(float)
    both = actual.any() and (~actual).any()
    return {
        "n": int(len(d)),
        "accuracy": round((tp + tn) / len(d), 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "specificity": round(spec, 4),
        "f1": round(2 * prec * rec / (prec + rec), 4) if prec + rec else 0.0,
        "balancedAccuracy": round((rec + spec) / 2, 4),
        # How well the estimate ranks people by anemia risk (distance below their WHO cutoff).
        "auc": round(float(roc_auc_score(actual, thr - p)), 4) if both else None,
        "severityAccuracy": round(float(np.mean([severity(a, g) == severity(b, g) for a, b, g in zip(y, p, grp)])), 4),
        "mae": round(float(np.abs(err).mean()), 3),
        "rmse": round(float(np.sqrt((err**2).mean())), 3),
        "r2": round(float(1 - (err**2).sum() / ((y - y.mean()) ** 2).sum()), 4),
        "pearsonR": round(float(np.corrcoef(y, p)[0, 1]), 4),
        "within1": round(float((np.abs(err) <= 1).mean()), 4),
        "within2": round(float((np.abs(err) <= 2).mean()), 4),
        # The calibrated range the app shows (conformal offsets already applied by train.py).
        "rangeCoverage": round(float(((y >= lo) & (y <= hi)).mean()), 4) if not np.isnan(lo).all() else None,
        "confusion": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
        "_offsetsApplied": bool(off.any()),
    }


def main():
    oof = pd.read_csv(ARTIFACTS / "oof_predictions.csv")
    offsets = json.loads((ARTIFACTS / "calibration.json").read_text())
    sets = {
        "overall": oof,
        "eye": oof[oof.region == "eye"],
        "nails": oof[oof.region == "nails"],
        "indianAdults": oof[oof.dataset.astype(str).str.contains("India")],
    }
    out = {"method": "person-grouped 5-fold cross-validation (out-of-fold)", "groups": {}}
    for name, d in sets.items():
        s = scores(d, offsets)
        s.pop("_offsetsApplied")
        out["groups"][name] = s
    palm = ARTIFACTS / "palm_info.json"
    if palm.exists():
        p = json.loads(palm.read_text())
        out["palm"] = {k: p[k] for k in ("auc", "sensitivity", "specificity") if k in p}
    (ARTIFACTS / "metrics.json").write_text(json.dumps(out, indent=2))
    for name, s in out["groups"].items():
        print(
            f"{name:<13} n={s['n']:<5} acc {s['accuracy']:.1%}  prec {s['precision']:.1%}  recall {s['recall']:.1%}  "
            f"spec {s['specificity']:.1%}  F1 {s['f1']:.3f}  AUC {s['auc']}  R² {s['r2']:.3f}  MAE {s['mae']:.2f}  "
            f"±1 {s['within1']:.0%}  ±2 {s['within2']:.0%}  range {s['rangeCoverage']:.0%}"
        )
    print("wrote", ARTIFACTS / "metrics.json")


if __name__ == "__main__":
    main()
