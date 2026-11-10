"""
Evaluates predictions (default: the out-of-fold predictions from train.py).

Per image AND per subject (regions fused exactly like the app: weights from
pipeline.json → fusion), reports:

  • MAE, RMSE, R², bias
  • Anemia sensitivity / specificity (WHO thresholds from severityThresholds.json,
    using each subject's age / sex / pregnancy)
  • 4-class severity confusion matrix
  • Bland–Altman plot (+ scatter plot)
  • Breakdown by skin tone (Fitzpatrick group) and by region

Usage:
    python evaluate.py [--pred artifacts/oof_predictions.csv] [--out artifacts/eval]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from sklearn.metrics import confusion_matrix, mean_absolute_error, mean_squared_error, r2_score  # noqa: E402

from common import ARTIFACTS, FUSION, SEVERITIES, classify  # noqa: E402


def fitz_group(v) -> str:
    """Maps Fitzpatrick I–VI (or 1–6) to I–II / III–IV / V–VI; passes through other labels."""
    s = str(v).strip().upper()
    roman = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6}
    n = roman.get(s) or (int(float(s)) if s.replace(".", "", 1).isdigit() else None)
    if n is None:
        return s
    return "I–II" if n <= 2 else "III–IV" if n <= 4 else "V–VI"


def metrics(y, p, anemic_true, anemic_pred) -> dict:
    tp = int((anemic_true & anemic_pred).sum())
    tn = int((~anemic_true & ~anemic_pred).sum())
    fp = int((~anemic_true & anemic_pred).sum())
    fn = int((anemic_true & ~anemic_pred).sum())
    return {
        "n": int(len(y)),
        "mae": float(mean_absolute_error(y, p)),
        "rmse": float(np.sqrt(mean_squared_error(y, p))),
        "r2": float(r2_score(y, p)) if len(y) > 1 else float("nan"),
        "bias": float(np.mean(p - y)),
        "sensitivity": tp / (tp + fn) if tp + fn else float("nan"),
        "specificity": tn / (tn + fp) if tn + fp else float("nan"),
    }


def fuse_subjects(df: pd.DataFrame) -> pd.DataFrame:
    """Per-subject fusion identical to src/ml/fusion.ts (weight = region × quality × detection × fallback penalty)."""
    w = df.region.map(FUSION["regionWeights"]) * df.quality_score * df.detection_confidence
    w = w * np.where(df.model == "randomForest", FUSION["fallbackPenalty"], 1.0)
    df = df.assign(_w=np.maximum(w, 1e-3))
    g = df.groupby("subject_id")
    fused = g.apply(lambda s: pd.Series({"pred": np.round((s.pred * s._w).sum() / s._w.sum(), 1), "hb": s.hb.mean()}), include_groups=False)
    first = g[[c for c in ["age", "sex", "pregnant", "skin_tone", "altitude_m"] if c in df]].first()
    return fused.join(first).reset_index()


def add_classes(df):
    """WHO severity for lab and predicted Hb, after the same altitude adjustment as the app."""
    alt = df["altitude_m"] if "altitude_m" in df else pd.Series(0.0, index=df.index)
    rows = list(zip(df.age, df.sex, df.pregnant, alt))
    df["true_sev"] = [classify(h, a, s, bool(p), m) for h, (a, s, p, m) in zip(df.hb, rows)]
    df["pred_sev"] = [classify(h, a, s, bool(p), m) for h, (a, s, p, m) in zip(df.pred, rows)]
    df["skin_group"] = df.skin_tone.map(fitz_group)
    return df


def plots(df, out: Path, title: str):
    mean = (df.hb + df.pred) / 2
    diff = df.pred - df.hb
    md, sd = diff.mean(), diff.std()
    fig, ax = plt.subplots(1, 2, figsize=(12, 5))
    ax[0].scatter(mean, diff, s=14, alpha=0.6, color="#B23A48")
    for v, ls in [(md, "-"), (md + 1.96 * sd, "--"), (md - 1.96 * sd, "--")]:
        ax[0].axhline(v, color="#2B2B2B", ls=ls, lw=1)
    ax[0].set(title=f"Bland–Altman ({title})", xlabel="Mean of lab and predicted Hb (g/dL)", ylabel="Predicted − lab (g/dL)")
    ax[0].text(0.02, 0.95, f"bias {md:+.2f}\nLoA {md - 1.96 * sd:+.2f} … {md + 1.96 * sd:+.2f}", transform=ax[0].transAxes, va="top")
    lo, hi = min(df.hb.min(), df.pred.min()) - 0.5, max(df.hb.max(), df.pred.max()) + 0.5
    ax[1].scatter(df.hb, df.pred, s=14, alpha=0.6, color="#2A7F7F")
    ax[1].plot([lo, hi], [lo, hi], color="#6B6B6B", lw=1)
    ax[1].set(title=f"Predicted vs lab ({title})", xlabel="Lab Hb (g/dL)", ylabel="Predicted Hb (g/dL)", xlim=(lo, hi), ylim=(lo, hi))
    fig.tight_layout()
    fig.savefig(out / f"bland_altman_{title.replace(' ', '_')}.png", dpi=130)
    plt.close(fig)


def report(df, out: Path, level: str) -> dict:
    df = add_classes(df)
    res = {"overall": metrics(df.hb, df.pred, df.true_sev != "normal", df.pred_sev != "normal")}
    res["by_skin_tone"] = {k: metrics(g.hb, g.pred, g.true_sev != "normal", g.pred_sev != "normal") for k, g in df.groupby("skin_group")}
    if "region" in df:
        res["by_region"] = {k: metrics(g.hb, g.pred, g.true_sev != "normal", g.pred_sev != "normal") for k, g in df.groupby("region")}
    cm = confusion_matrix(df.true_sev, df.pred_sev, labels=SEVERITIES)
    res["confusion_matrix"] = {"labels": SEVERITIES, "matrix": cm.tolist()}
    pd.DataFrame(cm, index=[f"true_{s}" for s in SEVERITIES], columns=[f"pred_{s}" for s in SEVERITIES]).to_csv(out / f"confusion_{level}.csv")
    plots(df, out, level)
    return res


def fmt(m):
    return f"n={m['n']:<5} MAE {m['mae']:.2f}  RMSE {m['rmse']:.2f}  R² {m['r2']:.2f}  bias {m['bias']:+.2f}  sens {m['sensitivity']:.2f}  spec {m['specificity']:.2f}"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pred", default=str(ARTIFACTS / "oof_predictions.csv"))
    ap.add_argument("--out", default=str(ARTIFACTS / "eval"))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(args.pred)
    if "pred" not in df:
        raise SystemExit("prediction CSV needs a 'pred' column (train.py writes one)")
    results = {"per_image": report(df.copy(), out, "per image"), "per_subject": report(fuse_subjects(df), out, "per subject")}
    (out / "metrics.json").write_text(json.dumps(results, indent=2))

    for level, res in results.items():
        print(f"\n=== {level} ===\n  overall        {fmt(res['overall'])}")
        for k, m in res["by_skin_tone"].items():
            print(f"  skin {k:<9} {fmt(m)}")
        for k, m in res.get("by_region", {}).items():
            print(f"  region {k:<7} {fmt(m)}")
        print("  confusion (rows = true, cols = predicted):", SEVERITIES)
        for s, row in zip(SEVERITIES, res["confusion_matrix"]["matrix"]):
            print(f"    {s:<9} {row}")
    print(f"\nplots + metrics.json written to {out}")


if __name__ == "__main__":
    main()
