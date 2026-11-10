# HemoScan — training pipeline

Python code that trains the models HemoScan runs on the phone, and exports them into the app.

```text
images + lab Hb ──► extract_features.py ──► train.py ──► evaluate.py
                     (quality → preprocess     (XGBoost quantiles   (MAE, RMSE, R², sens/spec,
                      → ROI → CNN + color)      + Random Forest,     confusion, Bland–Altman,
                                                GroupKFold CV)       per skin tone)
                                                    │
                                                    ▼
                                               export.py ──► public/models/cnn/*  (TF.js)
                                                          └► src/ml/models/*.ts   (m2cgen JS, verified)
```

## Why the app and training can't drift

| Shared thing | Single source | Used by |
| --- | --- | --- |
| Preprocessing, feature, quality, fallback and fusion constants | `../src/config/pipeline.json` | app + `common.py` |
| WHO anemia thresholds | `../src/config/severityThresholds.json` | app + `common.py` |
| MediaPipe landmark models | `../public/mediapipe/models/*.task` | app + `roi.py` |
| Color features, ROI mosaic, fallback ROI heuristics | TypeScript in `src/`, ported line-by-line in `common.py` / `roi.py` | verified by `tests/test_parity.py` |
| Preprocessing (gray-world, CLAHE on L, denoise) | OpenCV in both (OpenCV.js in the app, `cv2` here) | `preprocess.py` |

`tests/test_parity.py` runs the Python code on fixtures produced **by the app's own TypeScript**
(`npm run parity:fixtures`) and fails if color features, ROI pixels or detection boxes differ.

## Public datasets used for the shipped models

```bash
mkdir -p data/raw && cd data/raw
# Eye — CP-AnemiC (CC BY 4.0), 710 conjunctiva cut-outs + lab Hb
curl -L -o conjunctiva.rar "https://data.mendeley.com/public-files/datasets/m53vz6b7fx/files/904a85cb-aa4b-4060-9064-3405f279ce65/file_downloaded"
# Nails — skin & fingernails, Moscow adults (CC0), 250 hand photos + venous Hb + nail boxes
curl -L -o skin_nails.zip "https://ndownloader.figshare.com/files/49504041"
mkdir -p conjunctiva skin_nails && bsdtar -xf conjunctiva.rar -C conjunctiva && bsdtar -xf skin_nails.zip -C skin_nails
cd ../.. && python prepare_public_datasets.py && python train.py && python export.py --skip-cnn
```

`prepare_public_datasets.py` writes `artifacts/features.npz` in the same format as `extract_features.py`.
`train.py` prints per-region MAE against an always-guess-the-average baseline and writes
`artifacts/calibration.json` (conformal offsets for 80 % coverage), which `export.py` bakes into the model.

## Setup

```bash
cd training
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m pytest tests/           # parity with the app
```

## Dataset format

One CSV row per **image**. Paths are relative to `--images`.

| column | type | example | notes |
| --- | --- | --- | --- |
| `image_path` | str | `p017/eye_1.jpg` | JPEG/PNG, phone photo, ideally with torch on |
| `region` | `eye` \| `nails` \| `palm` | `eye` | |
| `hb` | float | `10.8` | **lab** hemoglobin (g/dL), same day as the photo (CBC / HemoCue) |
| `age` | float | `27` | years (use decimals for young children, e.g. `2.5`) |
| `sex` | `female` \| `male` | `female` | |
| `pregnant` | 0/1 | `0` | optional, default 0 |
| `skin_tone` | Fitzpatrick `I`–`VI` or `1`–`6` | `V` | used for the fairness breakdown |
| `subject_id` | str | `p017` | **required** — CV folds are grouped by person |
| `altitude_m` | float | `3500` | optional, elevation of residence; WHO altitude adjustment is applied before WHO severity classes (as in the app) |
| `roi_boxes` | JSON | `[[120,88,64,64]]` | optional manual ROI boxes `[x,y,w,h]` in the downscaled (≤640 px) image; otherwise MediaPipe / heuristics are used |

Collect data with the consent and ethics approval your study requires. Balance skin tones and
anemia severities as much as possible — `evaluate.py` reports each Fitzpatrick group separately so
gaps are visible. Exclude (or label) photos with the confounders the app screens for: red eyes
after crying/rubbing, nail polish or mehndi, injured fingers, nails trimmed very short, cold hands.

## Run

```bash
python extract_features.py --csv data/labels.csv --images data/ --save-rois   # inspect artifacts/rois/
python train.py                     # prints CV MAE, fallback rate, interval coverage
python evaluate.py                  # artifacts/eval/: metrics.json, confusion_*.csv, bland_altman_*.png
python model_metrics.py             # accuracy / precision / F1 / AUC / R² … → artifacts/metrics.json (shown in Settings)
python export.py --version 2026.10-a
cd .. && npm run build              # then Settings → Model source → Trained
```

**Adding blood-test data collected by the app:** copy the files from *Settings → Learning from blood tests →
Export learning data* into `data/app_exports/`, then

```bash
python merge_app_exports.py         # → artifacts/features_with_app.npz (dataset "HemoScan app users (India)")
python train.py --features artifacts/features_with_app.npz
python export.py --skip-cnn --palm --version 2026.11-app
```

Only eye and nail samples with a blood test ≤ 7 days from the scan are used; duplicate exports are dropped.

`HEMOSCAN_ARTIFACTS=/other/dir` puts all outputs somewhere other than `training/artifacts/`.

## What each script does

- **`preprocess.py`**: downscale (≤640 px), then the quality gate (Laplacian variance, brightness, clipping), gray-world white balance, CLAHE on the L channel, and light 3×3 Gaussian denoising only for mild noise. It produces the same result as the app's OpenCV.js backend.
- **`roi.py`**: MediaPipe Face/Hand Landmarker. For the eye, a strip under the lower eyelid of each eye. For nails, one box per fingernail bed. For the palm, the palm centre. When no landmarks are found it uses the same color heuristics as the app, and multiple boxes are tiled into one 224×224 mosaic.
- **`extract_features.py`**: produces a **CNN embedding** (MobileNetV3-Small, ImageNet weights, global average pool, 576-d) and **55 color features** (mean/std in RGB, HSV and Lab; R/G ratio; a\* percentiles; erythema index; 8-bin R/G/B/a\* histograms).
- **`train.py`**:
  - **XGBoost** (`reg:quantileerror`): three models at α = 0.1 / 0.5 / 0.9 on `[CNN, color, region one-hot]`, giving the median estimate plus a prediction interval.
  - **Random Forest** on `[color, region one-hot]` only.
  - **Cross-validation**: GroupKFold by subject. It then applies the app's FallbackDecider rules (borderline quality, implausible value, interval wider than 3.5 g/dL) to report the error of what the phone would actually show.
- **`evaluate.py`**:
  - **Levels**: per image, and per subject, with regions fused using the app's weights.
  - **Metrics**: MAE, RMSE, R², bias, and anemia sensitivity/specificity using WHO thresholds for each person's age, sex and pregnancy status. Also a 4-class confusion matrix and a Bland–Altman plot.
  - **Breakdowns**: by skin-tone group (I–II / III–IV / V–VI) and by region.
- **`export.py`**:
  - **CNN**: exported to a TF.js graph model with uint8-quantized weights (~1.5 MB), plus `model-info.json`.
  - **Tree models**: exported to JavaScript with m2cgen and wrapped as TypeScript.
  - **Verification**: each exported model is run in **Node** and compared with the Python predictions (tolerance 1e-3).
  - **XGBoost fallback**: m2cgen 0.10 mistranslates some XGBoost ≥ 2.0 models, so if verification fails the script uses a built-in translator that works from XGBoost's own JSON dump (exact within float32).

## Optional: fine-tuning the CNN

`extract_features.py` and `export.py` automatically use `artifacts/cnn_finetuned.keras` if it exists.
It must map a 224×224×3 image (0–255) to a 576-d vector (for example, MobileNetV3-Small fine-tuned
with a regression head that is removed before saving). Keep the embedding size in sync with
`features.cnnEmbeddingSize` in `pipeline.json`.

## Limitations to state in any report

These models estimate hemoglobin from photos. Their accuracy depends on the dataset, the camera,
and the lighting. HemoScan is a **screening** tool: a positive result must be confirmed with a blood test.
