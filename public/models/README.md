# Trained model files go here

HemoScan runs with **simulated models** (`MockModelProvider`) until trained models are installed.

| File(s)                                    | Where                | Produced by                                                                                           |
| ------------------------------------------ | -------------------- | ----------------------------------------------------------------------------------------------------- |
| `cnn/model.json` + `cnn/group1-shard*.bin` | `public/models/cnn/` | `training/export.py` (TF.js graph model, uint8-quantized MobileNetV3-Small, 224×224, 576-d embedding) |
| `model-info.json`                          | `public/models/`     | `training/export.py` (version, input size, normalization, embedding size)                             |
| `xgboostModel.ts`                          | `src/ml/models/`     | `training/export.py` (3 XGBoost quantile models → JavaScript, verified in Node)                       |
| `randomForestModel.ts`                     | `src/ml/models/`     | `training/export.py` (Random Forest → JavaScript via m2cgen, verified in Node)                        |

`export.py` writes all of these into place. Then rebuild (`npm run build`) and either set
`VITE_USE_MOCK_MODELS=false` in `.env.local` or choose **Settings → Model source → Trained**.

If the CNN files are missing but the tree models are installed, the app still works: every
region falls back to the color-only Random Forest (`fallbackReasons: ["cnnFailed"]`).
