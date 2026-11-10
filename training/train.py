"""
Trains the two tree models used on the phone:

  XGBoost (primary)      input = [CNN embedding, color features, region one-hot]
                         three quantile regressors: alpha 0.1 / 0.5 / 0.9
                         → median estimate + 10–90 % prediction interval
  Random Forest (backup) input = [color features, region one-hot]

Cross-validation is GROUPED BY SUBJECT (GroupKFold) so the same person never
appears in both train and validation folds. Out-of-fold predictions — with the
same FallbackDecider logic as the app applied — go to
artifacts/oof_predictions.csv for evaluate.py. Final models are refit on all
data and saved to artifacts/ for export.py.

Usage:
    python train.py [--features artifacts/features.npz] [--folds 5]
"""
from __future__ import annotations

import argparse
import json
import time

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import GroupKFold

from common import ARTIFACTS, FALLBACK, demographics, region_one_hot

QUANTILES = {"lower": 0.1, "median": 0.5, "upper": 0.9}

# Chosen by repeated grouped cross-validation (3 different person splits): depth 6 / 600 trees
# raised anemia yes/no accuracy from 77.8 % to 80.4 % on average and lowered the error.
XGB_PARAMS = dict(
    n_estimators=600,
    max_depth=6,
    learning_rate=0.03,
    subsample=0.8,
    colsample_bytree=0.4,
    min_child_weight=3,
    reg_lambda=1.0,
    tree_method="hist",
    objective="reg:quantileerror",
)
# Kept small so the m2cgen JavaScript stays a reasonable size for low-end phones.
RF_PARAMS = dict(n_estimators=120, max_depth=10, min_samples_leaf=3, max_features=0.5, n_jobs=-1, random_state=42)


def load(path):
    d = np.load(path, allow_pickle=True)
    onehot = np.array([region_one_hot(r) for r in d["region"]])
    demo = np.array([demographics(a, s) for a, s in zip(d["age"], d["sex"])])
    # XGBoost: [CNN?, colour, region one-hot, age, sex]; the Random Forest stays colour-only.
    X_xgb = np.hstack([d["X_cnn"], d["X_color"], onehot, demo])
    X_rf = np.hstack([d["X_color"], onehot])
    keys = ["region", "hb", "age", "sex", "pregnant", "skin_tone", "subject_id", "quality_score", "quality_status", "detection_confidence"]
    meta = pd.DataFrame({k: d[k] for k in keys})
    meta["altitude_m"] = d["altitude_m"] if "altitude_m" in d.files else 0.0
    meta["dataset"] = d["dataset"] if "dataset" in d.files else ""
    return X_xgb, X_rf, d["hb"].astype(float), meta, bool(d["has_cnn"])


def fit_xgb(X, y, alpha, w=None):
    # base_score = the target quantile (a good starting point) and explicit, which keeps the JSON simple for m2cgen.
    m = xgb.XGBRegressor(**XGB_PARAMS, quantile_alpha=alpha, base_score=float(np.quantile(y, alpha)))
    m.fit(X, y, sample_weight=w)
    return m


def decide(row) -> tuple[str, list[str]]:
    """Same rules as src/ml/fallbackDecider.ts."""
    reasons = []
    if row.quality_status == "borderline":
        reasons.append("borderlineQuality")
    if not (FALLBACK["minPlausibleHb"] <= row.xgb_median <= FALLBACK["maxPlausibleHb"]):
        reasons.append("implausibleValue")
    if row.xgb_upper - row.xgb_lower > FALLBACK["maxIntervalWidth"]:
        reasons.append("wideInterval")
    return ("randomForest" if reasons else "xgboost"), reasons


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--features", default=str(ARTIFACTS / "features.npz"))
    ap.add_argument("--folds", type=int, default=5)
    ap.add_argument("--india-weight", type=float, default=3.0, help="sample weight for Indian participants")
    args = ap.parse_args()

    X_xgb, X_rf, y, meta, has_cnn = load(args.features)
    if not has_cnn:
        # Colour-only XGBoost (input = colour features + region one-hot, same as the RF).
        print("No CNN embeddings in features.npz → XGBoost uses colour features only.")
    # The app is built for Indian users: Indian samples count more (validated on held-out Indians).
    w = np.where(meta.dataset.astype(str).str.contains("India"), args.india_weight, 1.0)
    groups = meta.subject_id.to_numpy()
    n_groups = len(np.unique(groups))
    folds = min(args.folds, n_groups)
    print(f"{len(y)} samples, {n_groups} subjects, {folds}-fold GroupKFold")

    oof = meta.copy()
    for k in ["xgb_lower", "xgb_median", "xgb_upper", "rf"]:
        oof[k] = np.nan
    oof["fold"] = -1

    t0 = time.time()
    for fold, (tr, va) in enumerate(GroupKFold(n_splits=folds).split(X_xgb, y, groups)):
        for name, alpha in QUANTILES.items():
            oof.loc[oof.index[va], f"xgb_{name}"] = fit_xgb(X_xgb[tr], y[tr], alpha, w[tr]).predict(X_xgb[va])
        rf = RandomForestRegressor(**RF_PARAMS).fit(X_rf[tr], y[tr], sample_weight=w[tr])
        oof.loc[oof.index[va], "rf"] = rf.predict(X_rf[va])
        oof.loc[oof.index[va], "fold"] = fold
        print(
            f"  fold {fold}: MAE xgb={mean_absolute_error(y[va], oof.xgb_median.iloc[va]):.2f} "
            f"rf={mean_absolute_error(y[va], oof.rf.iloc[va]):.2f}  ({time.time() - t0:.0f}s)"
        )

    # Apply the app's fallback rules to get the value the phone would actually show.
    decisions = oof.apply(decide, axis=1)
    oof["model"] = [d[0] for d in decisions]
    oof["fallback_reasons"] = [";".join(d[1]) for d in decisions]
    oof["pred"] = np.where(oof.model == "xgboost", oof.xgb_median, oof.rf)
    coverage = ((y >= oof.xgb_lower) & (y <= oof.xgb_upper)).mean()
    print(
        f"CV MAE — xgboost {mean_absolute_error(y, oof.xgb_median):.2f}, random forest {mean_absolute_error(y, oof.rf):.2f}, "
        f"app (with fallback) {mean_absolute_error(y, oof.pred):.2f} g/dL; fallback used {100 * (oof.model == 'randomForest').mean():.0f}%; "
        f"10–90% interval coverage {100 * coverage:.0f}% (target ≈80%)"
    )
    # Honest per-region report, including a baseline that always predicts the training mean.
    print("\nPer dataset (out-of-fold):")
    for ds, g in oof.groupby("dataset"):
        print(f"  {str(ds):<44} n={len(g):<4} MAE {mean_absolute_error(g.hb, g.pred):.2f}  bias {(g.pred - g.hb).mean():+.2f}")
    print("\nPer region (out-of-fold, grouped by person):")
    for region, g in oof.groupby("region"):
        yy = g.hb.to_numpy()
        base = np.zeros(len(g))
        for fold in g.fold.unique():
            tr_mean = meta.loc[(oof.fold != fold) & (meta.region == region), "hb"].mean()
            base[(g.fold == fold).to_numpy()] = tr_mean
        cov = ((g.hb >= g.xgb_lower) & (g.hb <= g.xgb_upper)).mean()
        print(
            f"  {region:<6} n={len(g):<4} MAE app {mean_absolute_error(yy, g.pred):.2f} | xgb {mean_absolute_error(yy, g.xgb_median):.2f} | "
            f"rf {mean_absolute_error(yy, g.rf):.2f} | baseline(mean) {mean_absolute_error(yy, base):.2f} g/dL | "
            f"r={np.corrcoef(yy, g.pred)[0, 1]:.2f} | 10–90% coverage {100 * cov:.0f}%"
        )
    # Conformal calibration (CQR): per-region offset c so that [lower − c, upper + c] contains the
    # lab value for ≥80 % of held-out people. Quantile trees alone under-cover on small data.
    calibration = {}
    for region, g in oof.groupby("region"):
        scores = np.maximum(g.xgb_lower - g.hb, g.hb - g.xgb_upper).to_numpy()
        n = len(scores)
        c = float(max(0.0, np.quantile(scores, min(1.0, np.ceil((n + 1) * 0.8) / n))))
        calibration[region] = round(c, 3)
        oof.loc[g.index, "xgb_lower"] = g.xgb_lower - c
        oof.loc[g.index, "xgb_upper"] = g.xgb_upper + c
        cov = ((g.hb >= g.xgb_lower - c) & (g.hb <= g.xgb_upper + c)).mean()
        print(f"  calibrated {region}: +{c:.2f} g/dL each side → coverage {100 * cov:.0f}%")
    ARTIFACTS.mkdir(exist_ok=True)
    (ARTIFACTS / "calibration.json").write_text(json.dumps(calibration, indent=2))
    oof.to_csv(ARTIFACTS / "oof_predictions.csv", index=False)

    # Final models on all data.
    print("refitting final models on all data …")
    for name, alpha in QUANTILES.items():
        fit_xgb(X_xgb, y, alpha, w).save_model(ARTIFACTS / f"xgb_{name}.json")
    joblib.dump(RandomForestRegressor(**RF_PARAMS).fit(X_rf, y, sample_weight=w), ARTIFACTS / "rf.joblib")
    (ARTIFACTS / "train_info.json").write_text(
        json.dumps(
            {
                "trained_at": time.strftime("%Y-%m-%d"),
                "n_samples": int(len(y)),
                "n_subjects": int(n_groups),
                "xgb_features": int(X_xgb.shape[1]),
                "uses_cnn": has_cnn,
                "uses_demographics": True,
                "per_dataset_mae": {str(ds): float(mean_absolute_error(g.hb, g.pred)) for ds, g in oof.groupby("dataset")},
                "rf_features": int(X_rf.shape[1]),
                "cv_mae_xgb": float(mean_absolute_error(y, oof.xgb_median)),
                "cv_mae_rf": float(mean_absolute_error(y, oof.rf)),
                "cv_mae_app": float(mean_absolute_error(y, oof.pred)),
                "interval_coverage_raw": float(coverage),
                "conformal_offsets": calibration,
                "regions": sorted(meta.region.unique().tolist()),
                "per_region_mae": {r: float(mean_absolute_error(g.hb, g.pred)) for r, g in oof.groupby("region")},
                "per_region_n": {r: int(len(g)) for r, g in oof.groupby("region")},
            },
            indent=2,
        )
    )
    print("saved artifacts/xgb_{lower,median,upper}.json, artifacts/rf.joblib, artifacts/oof_predictions.csv")


if __name__ == "__main__":
    main()
