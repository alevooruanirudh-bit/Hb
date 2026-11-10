# HemoScan: The Complete Training Guide

**Everything about this project, explained from zero.**

This guide describes HemoScan app version 1.0.0 with trained model version `2026.10-india-v4`.

## Table of contents

- [Part 0: Read this first](#part-0-read-this-first)
  - [What this book is](#what-this-book-is)
  - [How to read it](#how-to-read-it)
  - [Signs used in this book](#signs-used-in-this-book)
  - [What was checked](#what-was-checked)
  - [One important warning](#one-important-warning)
- [Part 1: The big picture](#part-1-the-big-picture)
  - [1.1 The problem](#11-the-problem)
  - [1.2 The idea](#12-the-idea)
  - [1.3 What HemoScan does, in one picture](#13-what-hemoscan-does-in-one-picture)
  - [1.4 What the app offers](#14-what-the-app-offers)
  - [1.5 The two halves of the project](#15-the-two-halves-of-the-project)
  - [1.6 There is no backend server](#16-there-is-no-backend-server)
  - [1.7 The tools at a glance](#17-the-tools-at-a-glance)
- [Part 2: Computers from absolute zero](#part-2-computers-from-absolute-zero)
  - [2.1 What a computer does](#21-what-a-computer-does)
  - [2.2 Program and code](#22-program-and-code)
  - [2.3 Files and folders](#23-files-and-folders)
  - [2.4 Paths](#24-paths)
  - [2.5 The terminal](#25-the-terminal)
  - [2.6 Bits, bytes and numbers](#26-bits-bytes-and-numbers)
  - [2.7 How a photo is stored](#27-how-a-photo-is-stored)
  - [2.8 Memory and storage](#28-memory-and-storage)
  - [2.9 The internet, browsers and servers](#29-the-internet-browsers-and-servers)
  - [2.10 Library, package, framework](#210-library-package-framework)
  - [2.11 App, operating system, APK](#211-app-operating-system-apk)
  - [2.12 Compiling and building](#212-compiling-and-building)
  - [2.13 Bugs, errors and tests](#213-bugs-errors-and-tests)
- [Part 3: The medical background](#part-3-the-medical-background)
  - [3.1 Blood and hemoglobin](#31-blood-and-hemoglobin)
  - [3.2 Anemia](#32-anemia)
  - [3.3 The WHO cutoffs](#33-the-who-cutoffs)
  - [3.4 The altitude adjustment](#34-the-altitude-adjustment)
  - [3.5 Why these three body parts](#35-why-these-three-body-parts)
  - [3.6 What can fool a photo](#36-what-can-fool-a-photo)
  - [3.7 Screening versus diagnosis](#37-screening-versus-diagnosis)
- [Part 4: Install every tool](#part-4-install-every-tool)
  - [4.1 What you need](#41-what-you-need)
  - [4.2 Install VS Code](#42-install-vs-code)
  - [4.3 Install Node.js and npm](#43-install-nodejs-and-npm)
  - [4.4 Install a browser](#44-install-a-browser)
  - [4.5 Install Python 3.11 (only for retraining)](#45-install-python-311-only-for-retraining)
  - [4.6 Install JDK 17 (only for the APK)](#46-install-jdk-17-only-for-the-apk)
  - [4.7 Install Android Studio (only for the APK)](#47-install-android-studio-only-for-the-apk)
  - [4.8 Optional: 7-Zip (Windows, only for retraining)](#48-optional-7-zip-windows-only-for-retraining)
  - [4.9 Checklist](#49-checklist)
- [Part 5: Get the project running](#part-5-get-the-project-running)
  - [5.1 If someone gave you a zip file](#51-if-someone-gave-you-a-zip-file)
  - [5.2 How to create the zip (for the person sharing)](#52-how-to-create-the-zip-for-the-person-sharing)
  - [5.3 Open the project in VS Code](#53-open-the-project-in-vs-code)
  - [5.4 Install the packages](#54-install-the-packages)
  - [5.5 Run the app](#55-run-the-app)
  - [5.6 Using the app for the first time](#56-using-the-app-for-the-first-time)
  - [5.7 Using it on a phone over Wi-Fi](#57-using-it-on-a-phone-over-wi-fi)
  - [5.8 Run the tests](#58-run-the-tests)
  - [5.9 Check for mistakes](#59-check-for-mistakes)
  - [5.10 Make the production version](#510-make-the-production-version)
  - [5.11 Build the Android APK](#511-build-the-android-apk)
  - [5.12 Install the APK on a phone](#512-install-the-apk-on-a-phone)
  - [5.13 Put the web version on the internet (optional)](#513-put-the-web-version-on-the-internet-optional)
  - [5.14 Set up Python for training (optional)](#514-set-up-python-for-training-optional)
  - [5.15 Daily routine](#515-daily-routine)
- [Part 6: Web basics, JavaScript and TypeScript](#part-6-web-basics-javascript-and-typescript)
  - [6.1 HTML](#61-html)
  - [6.2 CSS](#62-css)
  - [6.3 Tailwind CSS](#63-tailwind-css)
  - [6.4 JavaScript: the basics](#64-javascript-the-basics)
  - [6.5 Asynchronous code](#65-asynchronous-code)
  - [6.6 JSON](#66-json)
  - [6.7 TypeScript](#67-typescript)
  - [6.8 npm and package.json](#68-npm-and-packagejson)
  - [6.9 Vite](#69-vite)
  - [6.10 Web features this app relies on](#610-web-features-this-app-relies-on)
- [Part 7: React from zero](#part-7-react-from-zero)
  - [7.1 Why React exists](#71-why-react-exists)
  - [7.2 Components](#72-components)
  - [7.3 JSX](#73-jsx)
  - [7.4 Props](#74-props)
  - [7.5 State](#75-state)
  - [7.6 Hooks](#76-hooks)
  - [7.7 Events](#77-events)
  - [7.8 Entry point](#78-entry-point)
  - [7.9 How React decides what to redraw](#79-how-react-decides-what-to-redraw)
- [Part 8: The libraries used in the app](#part-8-the-libraries-used-in-the-app)
  - [8.1 React Router: moving between screens](#81-react-router-moving-between-screens)
  - [8.2 Zustand: shared memory](#82-zustand-shared-memory)
  - [8.3 Dexie: the database](#83-dexie-the-database)
  - [8.4 i18next: languages](#84-i18next-languages)
  - [8.5 Framer Motion: animation](#85-framer-motion-animation)
  - [8.6 lucide-react: icons](#86-lucide-react-icons)
  - [8.7 Recharts: charts](#87-recharts-charts)
  - [8.8 jsPDF: PDF reports](#88-jspdf-pdf-reports)
  - [8.9 OpenCV.js and MediaPipe](#89-opencvjs-and-mediapipe)
  - [8.10 TensorFlow.js](#810-tensorflowjs)
  - [8.11 vite-plugin-pwa: installable and offline](#811-vite-plugin-pwa-installable-and-offline)
  - [8.12 Vitest: tests](#812-vitest-tests)
  - [8.13 ESLint and Prettier](#813-eslint-and-prettier)
- [Part 9: Capacitor and Android](#part-9-capacitor-and-android)
  - [9.1 The problem](#91-the-problem)
  - [9.2 What Capacitor does](#92-what-capacitor-does)
  - [9.3 The commands](#93-the-commands)
  - [9.4 Android project files](#94-android-project-files)
  - [9.5 Can it work on iPhone?](#95-can-it-work-on-iphone)
- [Part 10: Python and its libraries from zero](#part-10-python-and-its-libraries-from-zero)
  - [10.1 Python basics](#101-python-basics)
  - [10.2 pip and virtual environments](#102-pip-and-virtual-environments)
  - [10.3 NumPy: arrays of numbers](#103-numpy-arrays-of-numbers)
  - [10.4 pandas: tables](#104-pandas-tables)
  - [10.5 OpenCV (cv2): images](#105-opencv-cv2-images)
  - [10.6 scikit-learn: machine learning tools](#106-scikit-learn-machine-learning-tools)
  - [10.7 XGBoost: the main model](#107-xgboost-the-main-model)
  - [10.8 joblib, m2cgen, matplotlib, pytest](#108-joblib-m2cgen-matplotlib-pytest)
  - [10.9 TensorFlow and MediaPipe in Python](#109-tensorflow-and-mediapipe-in-python)
- [Part 11: How images are processed](#part-11-how-images-are-processed)
  - [11.1 Colour spaces: different ways of describing a colour](#111-colour-spaces-different-ways-of-describing-a-colour)
  - [11.2 Measuring blur with the Laplacian](#112-measuring-blur-with-the-laplacian)
  - [11.3 Gray-world white balance](#113-gray-world-white-balance)
  - [11.4 CLAHE: fixing contrast](#114-clahe-fixing-contrast)
  - [11.5 Noise and denoising](#115-noise-and-denoising)
  - [11.6 Unsharp mask: gentle sharpening](#116-unsharp-mask-gentle-sharpening)
  - [11.7 Finding the region: landmarks](#117-finding-the-region-landmarks)
  - [11.8 Finding the region without landmarks: heuristics](#118-finding-the-region-without-landmarks-heuristics)
  - [11.9 ROI mosaic](#119-roi-mosaic)
  - [11.10 The 55 colour features](#1110-the-55-colour-features)
  - [11.11 Skin tone: the ITA angle](#1111-skin-tone-the-ita-angle)
  - [11.12 Spotting confounders automatically](#1112-spotting-confounders-automatically)
  - [11.13 Should the photo be trusted at all? The out-of-range check](#1113-should-the-photo-be-trusted-at-all-the-out-of-range-check)
- [Part 12: How the AI works](#part-12-how-the-ai-works)
  - [12.1 Normal programming versus machine learning](#121-normal-programming-versus-machine-learning)
  - [12.2 Vocabulary](#122-vocabulary)
  - [12.3 Decision trees](#123-decision-trees)
  - [12.4 Random Forest](#124-random-forest)
  - [12.5 Gradient boosting and XGBoost](#125-gradient-boosting-and-xgboost)
  - [12.6 Quantile regression: a range, not just a number](#126-quantile-regression-a-range-not-just-a-number)
  - [12.7 Conformal calibration: making the range dependable](#127-conformal-calibration-making-the-range-dependable)
  - [12.8 How a model is tested on unseen people](#128-how-a-model-is-tested-on-unseen-people)
  - [12.9 The scores, with real numbers](#129-the-scores-with-real-numbers)
  - [12.10 The datasets](#1210-the-datasets)
  - [12.11 The palm classifier](#1211-the-palm-classifier)
  - [12.12 Turning models into code](#1212-turning-models-into-code)
  - [12.13 The fallback decider](#1213-the-fallback-decider)
  - [12.14 Fusion: combining the regions](#1214-fusion-combining-the-regions)
  - [12.15 Personal calibration](#1215-personal-calibration)
  - [12.16 Device learning](#1216-device-learning)
  - [12.17 The guidance engine is not AI](#1217-the-guidance-engine-is-not-ai)
- [Part 13: Following one scan from start to finish](#part-13-following-one-scan-from-start-to-finish)
  - [13.1 Before the camera](#131-before-the-camera)
  - [13.2 At the camera](#132-at-the-camera)
  - [13.3 Quick check](#133-quick-check)
  - [13.4 Processing](#134-processing)
  - [13.5 After all regions](#135-after-all-regions)
  - [13.6 Results](#136-results)
  - [13.7 Later](#137-later)
- [Part 14: The map of every folder and file](#part-14-the-map-of-every-folder-and-file)
  - [14.1 The top level](#141-the-top-level)
  - [14.2 src/, the app](#142-src-the-app)
  - [14.3 Every file in src/](#143-every-file-in-src)
  - [14.4 public/](#144-public)
  - [14.5 scripts/](#145-scripts)
  - [14.6 training/](#146-training)
  - [14.7 How the pieces connect](#147-how-the-pieces-connect)
- [Part 15: Code walkthrough: starting up](#part-15-code-walkthrough-starting-up)
  - [15.1 index.html](#151-indexhtml)
  - [15.2 src/main.tsx](#152-srcmaintsx)
  - [15.3 src/App.tsx](#153-srcapptsx)
  - [15.4 vite.config.ts](#154-viteconfigts)
  - [15.5 scripts/setup-assets.mjs](#155-scriptssetup-assetsmjs)
  - [15.6 tailwind.config.ts and src/index.css](#156-tailwindconfigts-and-srcindexcss)
- [Part 16: Code walkthrough: settings, memory, database, languages](#part-16-code-walkthrough-settings-memory-database-languages)
  - [16.1 config/pipeline.json](#161-configpipelinejson)
  - [16.2 store/settingsStore.ts](#162-storesettingsstorets)
  - [16.3 store/scanStore.ts](#163-storescanstorets)
  - [16.4 db/db.ts](#164-dbdbts)
  - [16.5 db/repositories.ts](#165-dbrepositoriests)
  - [16.6 i18n/index.ts](#166-i18nindexts)
  - [16.7 config/locations.ts](#167-configlocationsts)
- [Part 17: Code walkthrough: image processing](#part-17-code-walkthrough-image-processing)
  - [17.1 imageProcessing/types.ts](#171-imageprocessingtypests)
  - [17.2 colorSpace.ts](#172-colorspacets)
  - [17.3 colorFeatures.ts](#173-colorfeaturests)
  - [17.4 qualityChecker.ts](#174-qualitycheckerts)
  - [17.5 preprocessor.ts](#175-preprocessorts)
  - [17.6 opencvOps.ts](#176-opencvopsts)
  - [17.7 loadOpenCv.ts](#177-loadopencvts)
  - [17.8 roiHeuristics.ts, conjunctiva.ts, skinTone.ts, confounderDetection.ts](#178-roiheuristicsts-conjunctivats-skintonets-confounderdetectionts)
- [Part 18: Code walkthrough: estimating and the worker](#part-18-code-walkthrough-estimating-and-the-worker)
  - [18.1 ml/types.ts](#181-mltypests)
  - [18.2 ml/modelProvider.ts](#182-mlmodelproviderts)
  - [18.3 ml/realModelProvider.ts](#183-mlrealmodelproviderts)
  - [18.4 ml/mockModelProvider.ts](#184-mlmockmodelproviderts)
  - [18.5 ml/regionExtractor.ts](#185-mlregionextractorts)
  - [18.6 ml/regionAnalyzer.ts](#186-mlregionanalyzerts)
  - [18.7 ml/fallbackDecider.ts](#187-mlfallbackdeciderts)
  - [18.8 ml/fusion.ts](#188-mlfusionts)
  - [18.9 ml/severityClassifier.ts](#189-mlseverityclassifierts)
  - [18.10 ml/altitude.ts and ml/confounders.ts](#1810-mlaltitudets-and-mlconfoundersts)
  - [18.11 ml/personalCalibration.ts and ml/deviceLearning.ts](#1811-mlpersonalcalibrationts-and-mldevicelearningts)
  - [18.12 The worker: three files](#1812-the-worker-three-files)
  - [18.13 features/scan/runPipeline.ts](#1813-featuresscanrunpipelinets)
- [Part 19: Code walkthrough: features, guidance, utilities](#part-19-code-walkthrough-features-guidance-utilities)
  - [19.1 features/scan/useCaptureFlow.ts](#191-featuresscanusecaptureflowts)
  - [19.2 features/scan/saveScan.ts](#192-featuresscansavescants)
  - [19.3 features/camera/useCamera.ts](#193-featurescamerausecamerats)
  - [19.4 features/camera/useLiveQuality.ts](#194-featurescamerauselivequalityts)
  - [19.5 features/voice/](#195-featuresvoice)
  - [19.6 features/report/pdfReport.ts](#196-featuresreportpdfreportts)
  - [19.7 features/learning/](#197-featureslearning)
  - [19.8 features/sync/syncService.ts](#198-featuressyncsyncservicets)
  - [19.9 guidance/guidanceEngine.ts](#199-guidanceguidanceenginets)
  - [19.10 utils/](#1910-utils)
- [Part 20: Code walkthrough: screens and tests](#part-20-code-walkthrough-screens-and-tests)
  - [20.1 Common pattern](#201-common-pattern)
  - [20.2 Setup pages](#202-setup-pages)
  - [20.3 HomePage](#203-homepage)
  - [20.4 Scan pages](#204-scan-pages)
  - [20.5 ResultsPage](#205-resultspage)
  - [20.6 CalibrationCard](#206-calibrationcard)
  - [20.7 QuestionnairePage and GuidancePage](#207-questionnairepage-and-guidancepage)
  - [20.8 HistoryPage](#208-historypage)
  - [20.9 SettingsPage](#209-settingspage)
  - [20.10 Charts and the gauge](#2010-charts-and-the-gauge)
  - [20.11 Accessibility features to notice](#2011-accessibility-features-to-notice)
  - [20.12 The tests](#2012-the-tests)
- [Part 21: Retraining the models](#part-21-retraining-the-models)
  - [21.1 The whole process](#211-the-whole-process)
  - [21.2 Shortcut: retrain without downloading anything](#212-shortcut-retrain-without-downloading-anything)
  - [21.3 Full retrain from raw data](#213-full-retrain-from-raw-data)
  - [21.4 Reading the code: common.py](#214-reading-the-code-commonpy)
  - [21.5 Reading the code: preprocess.py and roi.py](#215-reading-the-code-preprocesspy-and-roipy)
  - [21.6 Reading the code: prepare_public_datasets.py](#216-reading-the-code-prepare_public_datasetspy)
  - [21.7 Reading the code: train.py](#217-reading-the-code-trainpy)
  - [21.8 Reading the code: model_metrics.py](#218-reading-the-code-model_metricspy)
  - [21.9 Reading the code: export.py](#219-reading-the-code-exportpy)
  - [21.10 Adding your own data](#2110-adding-your-own-data)
  - [21.11 Parity tests](#2111-parity-tests)
  - [21.12 Choosing settings correctly](#2112-choosing-settings-correctly)
- [Part 22: Common changes, step by step](#part-22-common-changes-step-by-step)
  - [22.1 Change some on-screen text](#221-change-some-on-screen-text)
  - [22.2 Change the brand colour](#222-change-the-brand-colour)
  - [22.3 Change a threshold or weight](#223-change-a-threshold-or-weight)
  - [22.4 Update WHO cutoffs](#224-update-who-cutoffs)
  - [22.5 Add a new screen](#225-add-a-new-screen)
  - [22.6 Add a language, for example Tamil](#226-add-a-language-for-example-tamil)
  - [22.7 Change the app version](#227-change-the-app-version)
  - [22.8 Change the app name or icon](#228-change-the-app-name-or-icon)
  - [22.9 Replace the sample images](#229-replace-the-sample-images)
  - [22.10 Update the phone after any change](#2210-update-the-phone-after-any-change)
- [Part 23: When something goes wrong](#part-23-when-something-goes-wrong)
  - [23.1 How to approach any error](#231-how-to-approach-any-error)
  - [23.2 Installing and running](#232-installing-and-running)
  - [23.3 Camera and voice](#233-camera-and-voice)
  - [23.4 Scans](#234-scans)
  - [23.5 Android](#235-android)
  - [23.6 Python](#236-python)
- [Part 24: How the data keeps growing and the model keeps improving](#part-24-how-the-data-keeps-growing-and-the-model-keeps-improving)
  - [24.1 Built on the data, and built to grow](#241-built-on-the-data-and-built-to-grow)
  - [24.2 What "use-generated data" means](#242-what-use-generated-data-means)
  - [24.3 The life of one data point](#243-the-life-of-one-data-point)
  - [24.4 The three levels of learning](#244-the-three-levels-of-learning)
  - [24.5 Level 1 in detail: personal correction](#245-level-1-in-detail-personal-correction)
  - [24.6 Level 2 in detail: phone correction](#246-level-2-in-detail-phone-correction)
  - [24.7 Level 3 in detail: growing the main model](#247-level-3-in-detail-growing-the-main-model)
  - [24.8 Built-in quality protection](#248-built-in-quality-protection)
  - [24.9 Widening the data further](#249-widening-the-data-further)
  - [24.10 Making Level 3 fully automatic](#2410-making-level-3-fully-automatic)
  - [24.11 Intended use](#2411-intended-use)
  - [24.12 Privacy](#2412-privacy)
  - [24.13 Maintenance notes for developers](#2413-maintenance-notes-for-developers)
- [Part 25: Glossary](#part-25-glossary)
- [Part 26: Command cheat sheet](#part-26-command-cheat-sheet)
  - [App](#app)
  - [Android](#android)
  - [Training (inside training/, with .venv active)](#training-inside-training-with-venv-active)
  - [Where things end up](#where-things-end-up)
  - [First-day path for a complete beginner](#first-day-path-for-a-complete-beginner)

---

## Part 0: Read this first

### What this book is

This book explains the HemoScan project completely, starting from nothing.

You do **not** need to know anything about computers, coding, medicine or artificial intelligence. If you can read this sentence and use a mouse, you can follow it.

By the end you will be able to:

1. Install every tool on an empty computer.
2. Take the project from a zip file and run it.
3. Build the Android app (the APK).
4. Retrain the AI models yourself.
5. Understand what every folder and every file does.
6. Understand how a photo of an eye becomes a hemoglobin number.
7. Change the project safely.

### How to read it

| If you want to... | Go to |
| --- | --- |
| Understand the idea of the project | Part 1 |
| Learn computers from zero | Part 2 |
| Learn the medical background | Part 3 |
| Install tools and run the project now | Part 4 and Part 5 |
| Learn the web, JavaScript and TypeScript | Part 6 |
| Learn React and the libraries used | Part 7 and Part 8 |
| Learn how the Android app is made | Part 9 |
| Learn Python and its libraries | Part 10 |
| Learn how images are processed | Part 11 |
| Learn how the AI works | Part 12 |
| Follow one scan from start to finish | Part 13 |
| See what every file does | Part 14 |
| Read the code explained section by section | Parts 15 to 20 |
| Retrain the models | Part 21 |
| Make common changes | Part 22 |
| Fix a problem | Part 23 |
| See how the data keeps growing | Part 24 |
| Look up a word | Part 25 |
| Find a command quickly | Part 26 |

If you are completely new, read in order. It is long because nothing is skipped. Take it one part at a time.

### Signs used in this book

- `text like this` is something you type, a file name, or a piece of code.
- A grey block is either a command to run or code to read. The text above it tells you which.
- **Try it** means you should do this now on your computer.
- **Remember** marks an idea that comes back later.

### What was checked

The install and run steps in this book were actually carried out on a clean copy of the project, made the same way a zip is made. On a Mac with Node 24.13.1, npm 11.8.0, Python 3.11.16 and Temurin JDK 17:

- `npm install` finished successfully.
- All 136 app tests passed.
- The production build finished.
- The development server and preview server both started.
- The debug APK was built.
- The 5 Python parity tests passed.
- The training scripts ran and reproduced the published accuracy figures.

The Windows instructions are the standard steps for each tool, but they were **not** run on a Windows computer for this book. If a Windows step behaves differently, Part 23 lists the usual fixes.

### One important warning

HemoScan is a **screening tool**. It estimates the chance of anemia from photos. It is not a medical test and it does not give a diagnosis. A person who is told they may have anemia must get a blood test. Section 12.9 gives its accuracy figures.

---

## Part 1: The big picture

### 1.1 The problem

Inside your blood is a red substance called **hemoglobin**. It carries oxygen around your body. If you do not have enough of it, you have **anemia**. You feel tired and weak, and it can be dangerous, especially for pregnant women and young children. Anemia is very common in India.

The normal way to measure hemoglobin is a **blood test**. A needle takes blood, and a lab machine measures it. This needs a lab, money and travel. In a village, a person may never get tested.

### 1.2 The idea

Some body parts have very thin skin with blood just underneath:

- the inside of the lower eyelid,
- the bed of the fingernail,
- the palm of the hand.

When a person has less hemoglobin, these places look paler. Doctors have used this for a very long time: a doctor gently pulls down your lower eyelid and looks at the colour.

HemoScan does the same thing with a phone camera and a computer program that has learned from real examples. It looks at the colour and gives an estimate.

### 1.3 What HemoScan does, in one picture

```text
    Person takes photos            Phone does all the work            Person sees
  ┌────────────────────┐      ┌────────────────────────────┐     ┌────────────────────┐
  │  inner eyelid      │      │ 1. Is the photo good?      │     │ Likely 11.0 to     │
  │  fingernails       │ ───► │ 2. Fix the lighting        │ ──► │ 15.8 g/dL          │
  │  palm              │      │ 3. Find the right area     │     │ Result: Normal     │
  │                    │      │ 4. Measure the colours     │     │ What to do next    │
  └────────────────────┘      │ 5. AI turns colour to a    │     └────────────────────┘
                              │    hemoglobin number       │
                              │ 6. Combine and judge       │
                              └────────────────────────────┘
```

Nothing is sent to the internet. The whole process happens on the phone or laptop.

### 1.4 What the app offers

| Feature | What it means |
| --- | --- |
| Three languages | English, Telugu and Hindi. All screens and voice. |
| Scan the eye, nails, palm | Or "Scan All" for all three. |
| Camera or upload | Take a photo live or pick one from the gallery. |
| Live checks | While the camera is open, it shows Focus, Lighting and Position. The capture button only works when all are good. |
| Quality gate | Blurry or badly lit photos are rejected, with friendly advice. |
| Auto-enhance | A slightly soft photo is sharpened gently. |
| Likely range | The app shows a range, such as 11.0 to 15.8, not just one number. |
| Indian standards | Uses WHO cutoffs, the same ones India's Anemia Mukt Bharat programme uses. |
| Altitude | People living high in the mountains naturally have more hemoglobin. The app adjusts for this. |
| Confounders | Crying, nail polish, mehndi, injuries and cold hands are taken into account. |
| Skin tone | Used only to decide how much to trust the palm. Never to guess a person's race. |
| Guidance | Possible causes, what to do, diet tips, when to see a doctor. |
| History | Saved results and a chart over time. |
| PDF report | One page to share on WhatsApp or show a doctor. |
| Voice | Reads instructions and results aloud. |
| Blood test entry | A person can type their real lab value, now or later. |
| Learning | Each real value entered corrects later readings, and adds to the data used to retrain the model. |
| Model performance | A chart and table of accuracy in Settings. |
| Offline | Works without internet. |
| Privacy | Photos are never saved. Data stays on the device. |

### 1.5 The two halves of the project

The project has two very different halves. Understanding this split is the most useful thing you can learn early.

```text
 HALF 1: THE APP (runs on phones and laptops)          HALF 2: TRAINING (runs on one developer's computer)
 ─────────────────────────────────────────             ─────────────────────────────────────────────────
 Languages: TypeScript, HTML, CSS                       Language: Python
 Folder: src/, public/, android/                        Folder: training/
 Used by: everyone who scans                            Used by: only the developer
 Job: take photos, show results                         Job: learn from thousands of real examples

                 ▲                                                      │
                 │             the trained AI is exported               │
                 └──────────  as ordinary code into the app  ◄──────────┘
```

Think of a school. **Training** is like the years a student spends studying. **The app** is like the student working after graduation. The student does not need the textbooks any more. The app does not need Python, datasets or the internet.

**Remember:** the app and the training code are separate. You can run the app without ever touching Python.

### 1.6 There is no backend server

Most apps send your data to a big computer on the internet, called a **server** or **backend**. HemoScan does not have one. There is nothing to start except the app itself. If someone asks you to "run the backend", the answer is that this project has no backend.

(There is an optional "sync" feature in the code, but it has no server to talk to unless someone builds one. It is off by default.)

### 1.7 The tools at a glance

Do not worry if these words mean nothing yet. Each one is explained later.

| Tool | One-line job |
| --- | --- |
| VS Code | The program you read and edit code in. |
| Node.js | Runs JavaScript tools on your computer. |
| npm | Downloads code libraries. |
| TypeScript | JavaScript with safety checks. |
| React | Builds the screens. |
| Vite | Runs the app while developing and packs it for release. |
| Tailwind CSS | Makes it look good. |
| Zustand | Remembers settings and the current scan. |
| Dexie | Saves history in the browser's database. |
| i18next | Handles the three languages. |
| Framer Motion | Animations. |
| Recharts | Charts. |
| jsPDF | Makes the PDF report. |
| OpenCV.js | Image processing. |
| MediaPipe | Finds the hand and the face in a photo. |
| Capacitor | Turns the web app into an Android app. |
| Android Studio and JDK | Tools that build the APK. |
| Python | Language used for training. |
| NumPy, pandas | Handle numbers and tables. |
| OpenCV (Python) | Image processing during training. |
| scikit-learn | Random Forest and evaluation tools. |
| XGBoost | The main AI model. |
| m2cgen | Converts trained models into code. |

---

## Part 2: Computers from absolute zero

### 2.1 What a computer does

A computer is a machine that follows instructions very fast. It does not think. It only does exactly what it is told, one tiny step at a time.

Imagine a very obedient helper who cannot guess anything. If you say "make tea", the helper is confused. You must say: "Walk to the kitchen. Pick up the pot. Pour in water. Light the stove." A computer needs instructions at that level.

### 2.2 Program and code

A list of instructions for a computer is called a **program**. Programs are written as text in a special language. That text is called **code**. Writing it is called **programming** or **coding**.

Here is a very small piece of code:

```js
const age = 30;
console.log(age + 5);
```

It says: remember the number 30 under the name `age`, then show `age + 5`. The computer shows `35`.

### 2.3 Files and folders

Everything on a computer is stored in **files**. A photo is a file. A song is a file. A piece of code is a file.

**Folders** (also called directories) hold files and other folders, just like cardboard folders hold paper.

The last part of a file name after the dot is the **extension**. It says what kind of file it is.

| Extension | What it is |
| --- | --- |
| `.txt` | Plain text |
| `.jpg`, `.png` | Pictures |
| `.md` | Markdown, formatted text (this book) |
| `.json` | Data in a simple format |
| `.js` | JavaScript code |
| `.ts` | TypeScript code |
| `.tsx` | TypeScript code that contains screen layout |
| `.css` | Styling rules |
| `.html` | Web page structure |
| `.py` | Python code |
| `.java` | Java code |
| `.apk` | An Android app, ready to install |
| `.zip` | A compressed bundle of files |

### 2.4 Paths

A **path** is the address of a file.

- Mac or Linux example: `/Users/asha/Projects/hemoscan/src/App.tsx`
- Windows example: `C:\Users\asha\Projects\hemoscan\src\App.tsx`

Read it left to right, like directions: go to Users, then asha, then Projects, and so on.

A **relative path** starts from where you are now. If you are inside `hemoscan`, then `src/App.tsx` is enough.

Two special names:

- `.` means "this folder".
- `..` means "the folder above this one".

### 2.5 The terminal

Normally you click icons. A **terminal** (also called command line, shell or console) is a window where you **type** commands instead. It looks old but it is powerful, and almost every developer tool uses it.

To open one:

- **Windows:** press the Windows key, type `PowerShell`, press Enter.
- **Mac:** press Command + Space, type `Terminal`, press Enter.
- **In VS Code:** menu Terminal, then New Terminal. This is the easiest. Use this one most of the time.

The commands you will use most:

| Command | Meaning | Example |
| --- | --- | --- |
| `cd` | Change directory (move to a folder) | `cd hemoscan` |
| `cd ..` | Go up one folder | `cd ..` |
| `pwd` | Show where you are (Mac, PowerShell) | `pwd` |
| `ls` | List files (Mac, PowerShell) | `ls` |
| `dir` | List files (Windows) | `dir` |
| `clear` | Clean the screen | `clear` |

**Try it.** Open a terminal and type `pwd`, then press Enter. The computer tells you where you are.

Useful terminal habits:

- Press **Tab** to finish a file name automatically.
- Press the **up arrow** to bring back your last command.
- Press **Ctrl + C** to stop a program that is running.
- If a folder name has a space, wrap it in quotes: `cd "Hb finder"`.

### 2.6 Bits, bytes and numbers

Inside, a computer stores only two states: on and off. We write them as 1 and 0. One of these is a **bit**.

Eight bits make a **byte**. One byte can hold a whole number from 0 to 255. That range comes up constantly in this project, because each colour value in a photo is one byte.

| Name | Size |
| --- | --- |
| KB (kilobyte) | about 1,000 bytes |
| MB (megabyte) | about 1,000 KB |
| GB (gigabyte) | about 1,000 MB |

### 2.7 How a photo is stored

A photo is a grid of tiny coloured squares called **pixels**. A 640 by 480 photo has 640 columns and 480 rows of pixels, which is 307,200 pixels.

Each pixel stores three numbers: how much **R**ed, **G**reen and **B**lue light it has. Each is from 0 (none) to 255 (full).

| R | G | B | Colour |
| --- | --- | --- | --- |
| 0 | 0 | 0 | Black |
| 255 | 255 | 255 | White |
| 255 | 0 | 0 | Pure red |
| 200 | 100 | 100 | Dusty pink-red, like a healthy inner eyelid |
| 230 | 170 | 170 | Pale pink, like a pale inner eyelid |

So to a computer, a photo is just a long list of numbers. **That is the key idea of this whole project: pale tissue and red tissue are simply different numbers.**

A fourth number, **A** (alpha), says how see-through the pixel is. That is why the code calls images "RGBA".

### 2.8 Memory and storage

- **Storage** (hard disk, phone storage) keeps things after you switch off. It is slower.
- **Memory** (RAM) is the short-term desk the computer works on. It is fast, but it empties when you switch off.

HemoScan keeps photos only in memory. That is how it promises photos are never saved.

### 2.9 The internet, browsers and servers

- A **browser** (Chrome, Edge, Safari) is a program that opens web pages.
- A **server** is a computer that sends web pages to browsers.
- A **URL** is the address of a page, such as `https://example.com/page`.
- **localhost** means "this same computer". When you see `http://localhost:5173`, your own computer is acting as the server.
- **5173** is a **port**. A computer can run many servers at once, so each one uses a different numbered door.
- **HTTP** and **HTTPS** are the rules browsers and servers use to talk. HTTPS is the encrypted version. Browsers only allow camera access on HTTPS or localhost. You will meet this rule again.

### 2.10 Library, package, framework

Nobody writes everything from scratch.

- A **library** or **package** is code someone else wrote that you can reuse. It is like buying ready-made bricks.
- A **framework** is a larger library that also gives you the overall plan of how to build. It is like buying a house kit.
- A **dependency** is a package your project needs.

### 2.11 App, operating system, APK

The **operating system** (Windows, macOS, Android, iOS) is the main program that runs the computer or phone. Apps run on top of it.

An **APK** is the file format for an Android app. It stands for Android Package. Installing an APK is how an app gets onto an Android phone without the Play Store.

### 2.12 Compiling and building

Humans write code that is easy to read. Computers and browsers often want something different: smaller, combined, translated. The process of turning your source code into the final form is called **building** or **compiling**.

**Source code** is what you write. A **build** is what comes out.

### 2.13 Bugs, errors and tests

A **bug** is a mistake in code. An **error message** is the computer telling you something went wrong. It looks scary but it is helpful. Read it calmly, especially the first lines.

A **test** is small code that checks other code works. For example: "if hemoglobin is 11.6 for a 30-year-old woman, the result must be mild anemia." This project has 136 such tests.

---

## Part 3: The medical background

You must understand this to understand the code. It is short.

### 3.1 Blood and hemoglobin

Blood contains red blood cells. Each red cell is packed with **hemoglobin**, a protein containing iron. Hemoglobin picks up oxygen in the lungs and delivers it everywhere else. It is also what makes blood red.

More hemoglobin means redder blood. Less hemoglobin means paler blood.

Hemoglobin is measured in **grams per decilitre**, written **g/dL**. This means how many grams of hemoglobin are in one tenth of a litre of blood. A typical healthy adult is around 12 to 17 g/dL.

The short form for hemoglobin is **Hb**. The code uses `hb` everywhere.

### 3.2 Anemia

**Anemia** means too little hemoglobin. Common causes in India are too little iron in food, heavy periods, pregnancy, worm infections and low vitamin B12.

### 3.3 The WHO cutoffs

The World Health Organization (WHO) published the numbers doctors use to decide. The app uses the WHO 2011 values, which are also the ones used by India's Anemia Mukt Bharat programme.

The cutoff depends on who you are. These are the exact values in the file `src/config/severityThresholds.json`:

| Group | Normal is at or above | Mild from | Moderate from | Below that is severe | Typical upper limit |
| --- | --- | --- | --- | --- | --- |
| Child, 6 to 59 months | 11.0 | 10.0 | 7.0 | under 7.0 | 13.5 |
| Child, 5 to 11 years | 11.5 | 11.0 | 8.0 | under 8.0 | 15.5 |
| Child, 12 to 14 years | 12.0 | 11.0 | 8.0 | under 8.0 | 16.0 |
| Woman, 15 and older | 12.0 | 11.0 | 8.0 | under 8.0 | 15.5 |
| Pregnant woman | 11.0 | 10.0 | 7.0 | under 7.0 | 14.5 |
| Man, 15 and older | 13.0 | 11.0 | 8.0 | under 8.0 | 17.0 |

Example: a 30-year-old woman with 11.6 g/dL. Normal needs 12.0, so she is below it. Mild starts at 11.0, and 11.6 is above that. Result: **mild anemia**.

WHO only defines the low end. The "typical upper limit" comes from common lab reference ranges, and the app uses it to say "this is higher than usual".

### 3.4 The altitude adjustment

There is less oxygen high in the mountains, so people living there naturally make more hemoglobin. A value that is fine at sea level may be low for someone living at 3,500 metres.

So WHO says: subtract an amount before comparing with the cutoffs.

| Lives at or above (metres) | Subtract (g/dL) |
| --- | --- |
| 1,000 | 0.2 |
| 1,500 | 0.5 |
| 2,000 | 0.8 |
| 2,500 | 1.3 |
| 3,000 | 1.9 |
| 3,500 | 2.7 |
| 4,000 | 3.5 |
| 4,500 | 4.5 |

Example: a man in Ladakh at 3,500 m shows 13.0. Subtract 2.7 to get 10.3. Compare with men's cutoffs: mild starts at 11.0 and moderate at 8.0, so he is **moderate**. The same 13.0 in the plains would be normal.

### 3.5 Why these three body parts

| Place | Name doctors use | Why it works |
| --- | --- | --- |
| Inside of the lower eyelid | Palpebral conjunctiva | Thin, no skin pigment, many small blood vessels. Works on every skin tone. This is the most reliable place. |
| Under the fingernail | Nail bed | The nail is a clear window. Nail thickness and lighting affect it. |
| Palm | Palmar creases and skin | Easy to photograph. The app adjusts how much it counts according to skin tone. |

### 3.6 What can fool a photo

Some things change how red a part looks **without** changing the blood. These are called **confounders**.

| Thing | Effect |
| --- | --- |
| Crying or rubbing the eyes | Eyelid looks redder. An anemic person may look healthy. |
| Eye infection or allergy | Same. |
| Nail polish or mehndi on nails | Hides the nail bed completely. |
| Injured or bruised finger | Colour is wrong. |
| Nails cut very short | Looks paler. |
| Cold hands | Less blood reaches the skin, so it looks paler. |
| Mehndi on the palm | Hides the palm. |
| Hot water or exercise | Palm looks redder. |

The app asks about these before scanning and also looks for some automatically.

### 3.7 Screening versus diagnosis

A **diagnosis** is a doctor's confirmed conclusion. A **screening** test is a quick first check that says "you should get properly tested". HemoScan is only a screening tool, which is why every result tells the person to confirm with a blood test.

The real test is a **CBC** (complete blood count) done in a lab, or a **HemoCue**, a small portable blood meter.

---

## Part 4: Install every tool

Do this once per computer. It takes about an hour, mostly waiting for downloads.

### 4.1 What you need

| Tool | Needed for | Version to get |
| --- | --- | --- |
| VS Code | Reading and editing code | Latest |
| Node.js (includes npm) | Running and building the app | Current LTS. Tested with 24.13.1. Must be 18 or newer. |
| A web browser | Using the app | Chrome or Edge |
| Python | Only for retraining models | **3.11** (3.10 also works). Do not use 3.12 or newer. |
| JDK | Only for building the APK | **17 exactly**. Not 21. |
| Android Studio | Only for building the APK | Latest |

So:

- **Just want to run the app in a browser?** You need only VS Code, Node.js and a browser.
- **Want the APK?** Add JDK 17 and Android Studio.
- **Want to retrain?** Add Python 3.11.

Your computer needs about 8 GB of RAM, and about 15 GB of free disk space if you install everything.

### 4.2 Install VS Code

**What it is:** Visual Studio Code is a free program for reading and writing code. Think of it as a notebook designed for code. It colours the text, spots mistakes, and has a terminal built in.

1. Go to <https://code.visualstudio.com>.
2. Click the download button for your computer.
3. **Windows:** run the installer. On the options screen, tick **Add "Open with Code" action** and **Add to PATH**.
4. **Mac:** open the downloaded zip, and drag Visual Studio Code into Applications.
5. Open VS Code.

**Add helpful extensions.** An extension is an add-on. Click the icon of four squares on the left side, search, and click Install on each:

| Extension | Why |
| --- | --- |
| ESLint | Shows code problems |
| Prettier | Tidies code format |
| Tailwind CSS IntelliSense | Helps with styling names |
| Python (by Microsoft) | Python support |

**Open the terminal inside VS Code:** menu **Terminal**, then **New Terminal**. A panel opens at the bottom.

### 4.3 Install Node.js and npm

**What it is:** JavaScript normally only runs inside browsers. **Node.js** lets it run on your computer directly, and all the tools in this project are JavaScript programs. **npm** comes with Node and downloads packages.

1. Go to <https://nodejs.org>.
2. Download the version marked **LTS**. LTS means Long Term Support, the stable one.
3. Run the installer and accept the defaults.
4. **Close and reopen** any terminal.
5. Check it worked:

```bash
node -v
npm -v
```

You should see version numbers, such as `v24.13.1` and `11.8.0`. If you see "command not found" or "not recognized", restart the computer and try again.

**Windows PowerShell note.** If npm says "running scripts is disabled on this system", run this once, then answer `Y`:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 4.4 Install a browser

Install Google Chrome or use Microsoft Edge. The app uses modern browser features, and these two support them all. On a Mac, Safari works for most things, but use Chrome for development.

### 4.5 Install Python 3.11 (only for retraining)

**What it is:** Python is the programming language used to train the models.

**Why not the newest version?** The training packages are pinned to specific versions which only work with Python 3.10 or 3.11. A newer Python will fail during installation.

**Windows:**

1. Go to <https://www.python.org/downloads/windows/>.
2. Find a **Python 3.11** release with an installer, and download the **Windows installer (64-bit)**.
3. Run it. **Tick "Add python.exe to PATH"** at the bottom of the first screen.
4. Click Install Now.
5. Check in a new terminal:

```powershell
py -3.11 --version
```

**Mac:**

The easiest way uses Homebrew, a tool that installs developer software. Install it from <https://brew.sh> if you do not have it. Then:

```bash
brew install python@3.11
python3.11 --version
```

### 4.6 Install JDK 17 (only for the APK)

**What it is:** Android apps are built with tools written in Java. The **JDK** (Java Development Kit) lets those tools run. The Android build system this project uses needs version 17.

1. Go to <https://adoptium.net/temurin/releases/?version=17>.
2. Choose your operating system and download the `.msi` (Windows) or `.pkg` (Mac).
3. Run the installer.
   - **On Windows:** on the feature screen, turn on **Set JAVA_HOME variable**.
4. Check in a new terminal:

```bash
java -version
```

It should mention `17`.

**JAVA_HOME** is an **environment variable**: a named setting that programs can read. It tells tools where Java lives. On a Mac, set it for the current terminal like this:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

To make it permanent on a Mac, add that same line to the file `~/.zshrc`.

### 4.7 Install Android Studio (only for the APK)

**What it is:** Google's program for building Android apps. We mainly need the **Android SDK** it installs. SDK means Software Development Kit, the libraries and tools for making Android apps.

1. Go to <https://developer.android.com/studio> and download it.
2. Install and open it. Choose the **Standard** setup and accept the licences. It downloads the SDK.
3. On the welcome screen, click **More Actions**, then **SDK Manager**.
4. On **SDK Platforms**, tick **Android 14.0 (API 34)**.
5. On **SDK Tools**, make sure these are ticked: **Android SDK Build-Tools**, **Android SDK Platform-Tools**.
6. Click Apply.

Note the **Android SDK Location** shown at the top of that screen. You need it later. Usually:

- Windows: `C:\Users\YOUR-NAME\AppData\Local\Android\Sdk`
- Mac: `/Users/YOUR-NAME/Library/Android/sdk`

### 4.8 Optional: 7-Zip (Windows, only for retraining)

The training datasets arrive as `.rar` files. On Windows, install 7-Zip from <https://www.7-zip.org> to open them. On a Mac, the built-in `bsdtar` command handles them.

### 4.9 Checklist

Run these in a new terminal. Skip any tool you did not install.

```bash
node -v
npm -v
java -version
python3.11 --version
```

On Windows, use `py -3.11 --version` for the last one.

---

## Part 5: Get the project running

### 5.1 If someone gave you a zip file

A **zip** is many files squeezed into one.

**Windows:**

1. Do not double-click and work inside the zip. You must extract it.
2. Create a folder with a short path, such as `C:\Projects`.
3. Move the zip file into it.
4. Right-click the zip, choose **Extract All**, click Extract.
5. Check you now have `C:\Projects\hemoscan`, and inside it a file named `package.json`.

If the extraction makes a double folder like `hemoscan\hemoscan`, use the inner one, which contains `package.json`.

Short paths matter on Windows, because very long paths can cause strange errors with packages.

**Mac:**

1. Move the zip into a folder such as `Projects` in your home folder.
2. Double-click the zip. It creates a `hemoscan` folder.

### 5.2 How to create the zip (for the person sharing)

The project folder is huge because of downloaded and generated files. They can all be rebuilt, so leave them out.

| Leave out | Size | Why it is safe |
| --- | --- | --- |
| `node_modules/` | About 635 MB | `npm install` recreates it |
| `dist/` | About 50 MB | `npm run build` recreates it |
| `dev-dist/` | Small | Generated |
| `android/app/build/`, `android/build/`, `android/.gradle/` | About 190 MB | Android build recreates them |
| `android/local.properties` | Tiny | Contains a path that only works on your computer |
| `android/app/src/main/assets/public/` | About 50 MB | `npx cap sync` recreates it |
| `training/data/` | About 745 MB | Downloaded datasets |
| `training/.venv/`, `__pycache__/`, `.pytest_cache/` | Large | Recreated |
| `shots/` | Small | Old test screenshots |
| `*.keystore`, `android/keystore.properties` | Tiny | **Secret**. Never share these. |

**Keep** `training/artifacts/`. It contains the extracted features, so someone can retrain without downloading the datasets.

On a Mac, from the folder **above** `hemoscan`:

```bash
zip -r hemoscan.zip hemoscan \
  -x 'hemoscan/node_modules/*' 'hemoscan/dist/*' 'hemoscan/dev-dist/*' \
     'hemoscan/android/app/build/*' 'hemoscan/android/build/*' 'hemoscan/android/.gradle/*' \
     'hemoscan/android/local.properties' 'hemoscan/android/keystore.properties' \
     'hemoscan/android/app/src/main/assets/public/*' \
     'hemoscan/training/data/*' 'hemoscan/training/.venv/*' 'hemoscan/training/.pytest_cache/*' \
     'hemoscan/shots/*' '*/.DS_Store' '*/__pycache__/*' '*.keystore' 'hemoscan/.cache/*'
```

This produces a zip of about 28 MB that unpacks to about 62 MB.

On Windows, make a copy of the `hemoscan` folder, delete the items in the table from the copy, then right-click the copy and choose **Send to**, then **Compressed (zipped) folder**.

### 5.3 Open the project in VS Code

1. Open VS Code.
2. Menu **File**, then **Open Folder**.
3. Select the `hemoscan` folder, the one that directly contains `package.json`.
4. If asked "Do you trust the authors?", click Yes.

On the left you see the file tree. Open the terminal with **Terminal**, then **New Terminal**. It already points at the project folder.

Confirm it:

```bash
ls package.json
```

If the file is found, you are in the right place.

### 5.4 Install the packages

```bash
npm install
```

**What happens:**

1. npm reads `package.json`, the project's shopping list.
2. It downloads every package into a new folder called `node_modules`. About 635 MB.
3. After that, it automatically runs a small script called `postinstall`, which runs `scripts/setup-assets.mjs`. This copies OpenCV.js and the MediaPipe program files into `public/`, and downloads the two MediaPipe model files if they are missing.

**This needs the internet.** It took under a minute in testing on a fast connection.

**Normal messages you can ignore:**

- `npm warn deprecated ...`
- `28 vulnerabilities (3 low, 17 moderate, 4 high, 4 critical)`. This is npm's automatic list of known issues in packages. Do **not** run `npm audit fix --force`. It upgrades packages to incompatible versions and breaks the project.

### 5.5 Run the app

```bash
npm run dev
```

You will see something like:

```text
  VITE v5.4.21  ready in 137 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Hold **Ctrl** (Command on a Mac) and click the link, or open Chrome and type `http://localhost:5173`.

**Keep this terminal open.** Closing it stops the app. To stop it deliberately, click in the terminal and press **Ctrl + C**.

### 5.6 Using the app for the first time

1. Wait for the droplet splash screen.
2. Pick a language.
3. Read or skip the three intro screens.
4. Tick the consent box and agree.
5. Create a profile: age and sex are required.
6. Press **Start Scan**, then choose **Scan All**, or the eye alone.
7. Press **Upload Image** and pick a photo, or use the camera.

**To try it without photos:** on the home screen, press **Try Demo** and pick a sample. These sample images are drawings that show how the app works. Use real photos to judge results.

### 5.7 Using it on a phone over Wi-Fi

To open the development version from a phone:

```bash
npx vite --host
```

It prints a Network address such as `http://192.168.1.5:5173`. Open that on a phone connected to the same Wi-Fi.

**Note:** browsers only allow the camera on HTTPS or localhost. A plain `http://192...` address is neither. The camera shows an error, but **Upload Image** still works. For the camera on a phone, use the APK (5.11) or a hosted HTTPS version (5.13).

### 5.8 Run the tests

```bash
npm test
```

Expected final lines:

```text
 Test Files  12 passed (12)
      Tests  136 passed (136)
```

### 5.9 Check for mistakes

```bash
npm run typecheck
npm run lint
```

`typecheck` runs TypeScript's safety check. `lint` runs ESLint, which looks for suspicious code. Neither should print errors.

### 5.10 Make the production version

The development version is not the version you give to people. This creates the real, compressed one:

```bash
npm run build
```

The result goes into a `dist/` folder, about 50 MB.

To try it:

```bash
npm run preview
```

It prints an address such as `http://localhost:4173`.

### 5.11 Build the Android APK

You need JDK 17 and Android Studio (Part 4).

**Step 1. Tell Android tools where the SDK is.** Create a file `android/local.properties` containing one line.

Mac:

```properties
sdk.dir=/Users/YOUR-NAME/Library/Android/sdk
```

Windows (note the doubled backslashes and the backslash before the colon):

```properties
sdk.dir=C\:\\Users\\YOUR-NAME\\AppData\\Local\\Android\\Sdk
```

If you received a zip that still has this file from another computer, replace its contents.

**Step 2. Build the web app and copy it into the Android project:**

```bash
npm run build
npx cap sync android
```

**Step 3. Build the APK.**

Mac:

```bash
cd android
./gradlew assembleDebug
cd ..
```

Windows PowerShell:

```powershell
cd android
.\gradlew.bat assembleDebug
cd ..
```

The first run downloads Gradle and other tools, and can take 10 minutes or more. Later runs take under a minute.

On a Mac, `npm run android:build` does steps 2 and 3 at once. On Windows it does not work, because that script uses `./gradlew`, so follow the steps above.

**Normal messages you can ignore:**

- `Warning: SDK processing. This version only understands SDK XML versions up to 3...`
- `Note: Recompile with -Xlint:unchecked for details.`

**The APK is here:**

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

It is about 32 MB.

### 5.12 Install the APK on a phone

**Method A: copy the file.**

1. Send `app-debug.apk` to the phone, by WhatsApp, Google Drive or USB.
2. Uninstall any older HemoScan first. This deletes the data saved inside it.
3. Tap the file on the phone.
4. If asked, allow **Install unknown apps** for that app.

**Method B: USB cable, with adb.** adb (Android Debug Bridge) is a tool that controls a connected phone.

1. On the phone, open Settings, About phone, and tap **Build number** 7 times. Developer options appear.
2. Open Developer options and turn on **USB debugging**.
3. Connect the cable and tap **Allow** on the phone.

```bash
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

`adb` lives in `platform-tools` inside the SDK folder. If "adb" is not found, use the full path, such as `~/Library/Android/sdk/platform-tools/adb`.

**Why a "debug" APK?** It is signed with an automatic test key. It is fine for testing and sharing directly. To publish on the Google Play Store, you need a **release** build signed with your own key, as described in `README.md`.

### 5.13 Put the web version on the internet (optional)

The camera needs HTTPS, and free hosts give you that automatically. The project already includes settings for two of them, in `vercel.json` and `netlify.toml`.

**Netlify:**

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

**Vercel:**

```bash
npx vercel --prod
```

Each asks you to log in first.

### 5.14 Set up Python for training (optional)

Open a terminal in the project, then go into the training folder.

**Step 1. Create a virtual environment.** A virtual environment (venv) is a private box of Python packages for one project, so it cannot clash with anything else.

Mac:

```bash
cd training
python3.11 -m venv .venv
source .venv/bin/activate
```

Windows PowerShell:

```powershell
cd training
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
```

Your terminal line now starts with `(.venv)`. You must do the "activate" step every time you open a new terminal for training.

**Step 2. Install the packages:**

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install openpyxl kagglehub
```

It uses about 2.3 GB of disk space and took around 2 minutes in testing.

`openpyxl` reads Excel files. `kagglehub` downloads a dataset. Both are needed by the dataset preparation step, but they are not listed in `requirements.txt`, which is why you install them separately.

**Step 3. Check it:**

```bash
python -m pytest tests/ -q
```

Expected: `5 passed`.

To leave the virtual environment, type `deactivate`.

Part 21 explains how to retrain.

### 5.15 Daily routine

```bash
# In VS Code's terminal, inside the hemoscan folder:
npm run dev          # start working
# ...open http://localhost:5173, change code, the page updates by itself...
# Ctrl + C to stop

npm test             # before you finish
npm run typecheck
npm run lint
```

---

## Part 6: Web basics, JavaScript and TypeScript

A web page is made of three languages working together.

| Language | Job | Like in a house |
| --- | --- | --- |
| HTML | What is on the page | Walls and rooms |
| CSS | How it looks | Paint and furniture |
| JavaScript | What it does | Electricity and plumbing |

### 6.1 HTML

HTML describes content using **tags** in angle brackets.

```html
<h1>HemoScan</h1>
<p>Check your hemoglobin.</p>
<button>Start Scan</button>
<img src="logo.png" alt="HemoScan logo" />
```

- `<h1>` is a main heading, `<p>` a paragraph, `<button>` a button, `<img>` a picture.
- `src` and `alt` are **attributes**, extra information on a tag.
- `<div>` is a plain box, and `<span>` is a plain piece of text. They are used for layout.

Tags nest inside each other like boxes:

```html
<div>
  <h2>Result</h2>
  <p>Normal</p>
</div>
```

The browser turns HTML into a tree of objects called the **DOM** (Document Object Model). Code changes the page by changing the DOM.

This project has only one HTML file, `index.html`, which is nearly empty. React creates everything else.

Some attributes help people who use screen readers, such as `aria-label="Close"` or `role="alert"`. You will see these often in this code, because the app is built for people of all abilities.

### 6.2 CSS

CSS sets the appearance.

```css
button {
  background: red;
  color: white;
  padding: 12px;
  border-radius: 8px;
}
```

This says: every button has a red background, white text, some inner space and rounded corners.

Key ideas:

- **Selector:** what to style (`button`).
- **Property and value:** what to change (`color: white`).
- **Responsive design:** the layout changes with the screen width. A phone shows one column, while a laptop shows two.
- **Variables:** named values, such as `--primary: 178 58 72;`. This project keeps its colours in variables, so dark mode simply swaps them.

### 6.3 Tailwind CSS

Writing separate CSS files gets messy. **Tailwind** gives you ready-made small class names that you put straight on the element.

```html
<button class="rounded-2xl bg-primary p-4 font-semibold text-white">Start</button>
```

| Class | Meaning |
| --- | --- |
| `rounded-2xl` | Very rounded corners |
| `bg-primary` | Background is the brand colour |
| `p-4` | Inner padding |
| `font-semibold` | Fairly bold text |
| `text-white` | White text |
| `md:flex` | On medium or wider screens, use flexible layout |
| `mt-6` | Margin on top |
| `hidden` | Do not show |
| `bg-primary/10` | Brand colour at 10% strength |

Tailwind scans the code and generates only the classes actually used. Its settings are in `tailwind.config.ts`.

### 6.4 JavaScript: the basics

JavaScript is the language browsers run. TypeScript, which this project uses, is JavaScript with extras, so learn JavaScript first.

**Try it.** In Chrome, press F12, click **Console**, and type these lines one at a time.

**Showing something:**

```js
console.log('hello');
```

**Variables** are named boxes.

```js
const hb = 12.5;     // const: this name will not be given a new value
let count = 0;       // let: this can change
count = count + 1;
```

Text after `//` is a **comment**. The computer ignores it. It is a note for humans.

**Value types:**

```js
const age = 30;              // number
const name = 'Asha';         // string (text)
const pregnant = false;      // boolean (true or false)
const nothing = null;        // deliberately empty
let unset;                   // undefined: no value yet
```

**Maths and comparing:**

```js
12 + 3      // 15
12 > 11     // true
12 === 12   // true (exactly equal)
12 !== 11   // true (not equal)
true && false  // false: "and", both must be true
true || false  // true: "or", either may be true
!true          // false: "not"
```

**Decisions:**

```js
if (hb >= 12) {
  console.log('Normal');
} else if (hb >= 11) {
  console.log('Mild');
} else {
  console.log('Lower');
}
```

There is a short form, the **ternary**: `condition ? ifTrue : ifFalse`.

```js
const label = hb >= 12 ? 'Normal' : 'Low';
```

**Functions** are named, reusable blocks of steps.

```js
function add(a, b) {
  return a + b;
}
add(2, 3);   // 5
```

`a` and `b` are **parameters**. `return` gives back the answer. Calling it as `add(2, 3)` passes **arguments**.

The **arrow function** is a shorter way to write the same thing, and you will see it everywhere:

```js
const add = (a, b) => a + b;
```

**Arrays** are lists. Counting starts at 0.

```js
const regions = ['eye', 'nails', 'palm'];
regions[0];         // 'eye'
regions.length;     // 3
```

These built-in array operations are used constantly:

```js
const n = [1, 2, 3, 4];
n.map((x) => x * 2);          // [2, 4, 6, 8]    make a new list by changing each item
n.filter((x) => x > 2);       // [3, 4]          keep only some items
n.find((x) => x > 2);         // 3               first item that matches
n.reduce((s, x) => s + x, 0); // 10              combine all into one value
n.includes(3);                // true            is it in the list?
n.some((x) => x > 3);         // true            does any item match?
n.every((x) => x > 0);        // true            do all items match?
```

**Objects** group named values.

```js
const profile = { name: 'Asha', age: 30, sex: 'female' };
profile.name;      // 'Asha'
profile['age'];    // 30
```

**Destructuring** pulls values out:

```js
const { name, age } = profile;
const [first, second] = regions;
```

**Spread** (`...`) copies items in:

```js
const updated = { ...profile, age: 31 };   // copy, then change age
const more = [...regions, 'tongue'];
```

**Handling missing values:**

```js
profile.address?.city;   // safely undefined if address is missing
profile.city ?? 'Unknown';   // use 'Unknown' if the left side is null or undefined
```

**Template strings** use backticks and can include values:

```js
const msg = `Your Hb is ${hb} g/dL`;
```

**Loops** repeat:

```js
for (const r of regions) console.log(r);
for (let i = 0; i < 3; i++) console.log(i);
```

**Classes** are blueprints for objects that have both data and functions:

```js
class Counter {
  value = 0;
  add() { this.value++; }
}
const c = new Counter();
c.add();
```

**Modules** split code across files. `export` makes something available, and `import` uses it.

```js
// math.js
export function add(a, b) { return a + b; }

// app.js
import { add } from './math.js';
```

**The DOM and events.** A click is an **event**. Code can respond to it. In React you write this as `onClick`.

**Errors** can be caught:

```js
try {
  riskyThing();
} catch (e) {
  console.warn('It failed', e);
}
```

### 6.5 Asynchronous code

Some tasks take time, such as loading a file or analysing a photo. The program must not freeze while waiting.

Imagine ordering food. You get a **token**. You do not stand frozen at the counter. You do other things, and when your number is called you collect your food.

A **Promise** is that token: "a value that will arrive later".

`async` and `await` make this easy to read:

```js
async function loadInfo() {
  const response = await fetch('models/model-info.json');
  const info = await response.json();
  return info;
}
```

`await` means "wait here for this result, while letting other work continue". Anywhere you see `await`, something slow is happening.

You may also see `.then()`, which is the older way of saying the same thing:

```js
loadInfo().then((info) => console.log(info)).catch((e) => console.warn(e));
```

### 6.6 JSON

**JSON** is a simple text format for data. It looks like JavaScript objects:

```json
{
  "normal": 12.0,
  "name": "Women",
  "groups": [1, 2, 3],
  "active": true
}
```

Rules: names and text need double quotes, and comments are not allowed. This project uses JSON for settings and translations, and both the JavaScript and the Python code read the same JSON files.

### 6.7 TypeScript

In plain JavaScript, a mistake like this only fails when the program runs:

```js
add('hello', 5);   // gives 'hello5', probably a bug
```

**TypeScript** lets you say what kind of value each thing is. It finds mistakes before running. Those `: type` parts are removed when the code is built, so the browser only ever sees JavaScript.

```ts
function add(a: number, b: number): number {
  return a + b;
}
add('hello', 5);   // red error while you type
```

**Things you will see often:**

```ts
type Region = 'eye' | 'nails' | 'palm';          // only these three values allowed

interface Profile {                              // the shape of an object
  name: string;
  ageYears: number;
  city?: string;                                 // ? means optional
}

const list: number[] = [1, 2];                   // array of numbers
const scores: Record<string, number> = {};       // object with string keys and number values
function first<T>(items: T[]): T { return items[0]; }  // generic: works for any type T
const x = value as number;                       // "trust me, this is a number"
```

Other useful words: `Partial<X>` means all fields of X become optional. `Pick<X, 'a' | 'b'>` means only those fields. `Omit<X, 'a'>` means all but that one.

`.tsx` files are TypeScript files that may contain screen layout.

The settings for TypeScript are in `tsconfig.json`. Note `"strict": true`, which turns on all the strong checks. The line `"paths": { "@/*": ["./src/*"] }` means that `@/utils/cn` is a short way of saying `src/utils/cn`. You will see `@/` on nearly every import.

### 6.8 npm and package.json

`package.json` is the project's identity card and shopping list.

```json
{
  "name": "hemoscan",
  "scripts": { "dev": "vite", "test": "vitest run" },
  "dependencies": { "react": "^18.3.1" },
  "devDependencies": { "typescript": "~5.6.3" }
}
```

- **scripts:** shortcuts. `npm run dev` runs `vite`.
- **dependencies:** packages needed for the app to work.
- **devDependencies:** packages needed only while building.
- **Version signs:** `^18.3.1` allows newer 18.x versions. `~5.6.3` allows only newer 5.6.x. `0.10.18` means exactly that one.
- **`package-lock.json`:** records the exact version of every package installed, so everyone gets the same set. Do not edit it by hand.
- **`node_modules/`:** where packages are stored. Never edit it, and never share it.
- **`npx`:** runs a tool from `node_modules` without installing it globally.

### 6.9 Vite

Your code is in hundreds of files, and uses TypeScript, which browsers cannot read directly. **Vite** handles this.

In development (`npm run dev`) it:

- starts a local server,
- translates each file when the browser asks,
- updates the page the moment you save. This is called **Hot Module Replacement**.

In a build (`npm run build`) it:

- combines files into a few large ones, called **bundles**,
- removes unused code,
- shortens code to make it smaller,
- gives files names containing a fingerprint, so browsers fetch new versions.

The settings are in `vite.config.ts`, which is explained in Part 15.

### 6.10 Web features this app relies on

| Feature | What it does | Used for |
| --- | --- | --- |
| **Canvas** | A drawing surface whose pixels code can read and write | Reading photo pixels, making the PDF page |
| **getUserMedia** | Access to the camera | Live capture |
| **File input** | Choose a file | Upload Image |
| **localStorage** | Small saved text, kept between visits | Settings such as language |
| **IndexedDB** | A real database inside the browser | Profiles and history |
| **Web Worker** | A background thread | Heavy maths without freezing the screen |
| **WebAssembly (WASM)** | Very fast compiled code in the browser | OpenCV and MediaPipe |
| **Service Worker** | A background script that can serve files offline | Offline use |
| **Web Speech API** | Text to speech | Voice guidance |
| **Blob** | A chunk of binary data, such as a photo in memory | Passing photos around |

**A thread** is one line of work. A browser page has one main thread, which draws the screen and responds to taps. If heavy maths runs on it, the app freezes. A **Web Worker** is a second thread for the heavy work.

---

## Part 7: React from zero

### 7.1 Why React exists

Imagine changing the page by hand each time something happens: find the number, change it, find the colour, change it, show this, hide that. With dozens of screens, this becomes chaos.

**React** changes the approach. You describe what the screen **should look like for the current data**. When the data changes, React updates the screen for you.

### 7.2 Components

A **component** is a reusable piece of screen, written as a function that returns what to display.

```tsx
function Greeting() {
  return <h1>Hello</h1>;
}
```

You use it like a tag: `<Greeting />`. Component names start with a capital letter. The whole app is components inside components.

```text
App
└── AppShell (navigation + page area)
    └── HomePage
        ├── Card
        │   └── Button
        └── HbTrendChart
```

### 7.3 JSX

That HTML-like text inside code is **JSX**. A few differences from HTML:

```tsx
<div className="card">          {/* class becomes className */}
  <p>{2 + 3}</p>                {/* curly braces put in any value: shows 5 */}
  <img src={url} alt="" />      {/* every tag must be closed */}
</div>
```

Common patterns you will see:

```tsx
{isSaved && <p>Saved</p>}                         {/* show only if true */}
{hb >= 12 ? <p>Normal</p> : <p>Low</p>}           {/* one or the other */}
{regions.map((r) => <li key={r}>{r}</li>)}        {/* one item per list entry */}
```

`key` gives each list item a unique label so React can track it.

`<>...</>` is a **fragment**, an invisible wrapper.

### 7.4 Props

**Props** are inputs to a component, like function arguments.

```tsx
function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ color }}>{label}</span>;
}

<Badge label="Normal" color="green" />
```

`children` is a special prop: whatever you put between the tags.

```tsx
<Card>
  <p>This paragraph is the children of Card.</p>
</Card>
```

### 7.5 State

**State** is data a component remembers, and which changes the screen when it changes.

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}
```

`useState(0)` gives you the current value and a function for changing it. Calling `setCount` makes React run the component again and update the screen.

**Never change state directly**, as in `count = 5`. React would not notice. Always use the setter.

### 7.6 Hooks

Functions starting with `use` are **hooks**. They give a component extra abilities. Two rules: call them only at the top of a component, and never inside an `if` or a loop.

| Hook | Purpose |
| --- | --- |
| `useState` | Remember changing data |
| `useEffect` | Do something outside drawing, such as load data |
| `useRef` | Keep a value or point to a real element, without redrawing |
| `useMemo` | Remember a calculated result until its inputs change |
| `useCallback` | Keep the same function between redraws |

**useEffect** runs code after the screen draws:

```tsx
useEffect(() => {
  const timer = setTimeout(goNext, 1800);
  return () => clearTimeout(timer);      // cleanup when leaving
}, []);                                  // the list says when to rerun
```

The last part is the **dependency list**. `[]` means once, at the start. `[id]` means again whenever `id` changes. The returned function is the cleanup.

**useRef** often points at a real element, such as the `<video>` showing the camera:

```tsx
const videoRef = useRef(null);
<video ref={videoRef} />
```

**A custom hook** is your own function that uses other hooks. This project has several, such as `useCamera` and `useVoice`. They package behaviour so any screen can reuse it.

### 7.7 Events

```tsx
<button onClick={() => doSomething()}>Go</button>
<input value={name} onChange={(e) => setName(e.target.value)} />
```

Connecting an input to state like this is called a **controlled input**.

### 7.8 Entry point

Every React app starts somewhere. Here, `src/main.tsx` finds the empty `<div id="root">` in `index.html` and tells React to draw `<App />` inside it.

### 7.9 How React decides what to redraw

When state changes, React runs that component again and compares the new result with the old one. It then changes only what is different. You never write the "find and change" code yourself.

`<StrictMode>` in `main.tsx` is a development helper that runs some things twice, to expose bugs. It is why the effect in `ProcessingPage` uses a `started` ref to make sure the pipeline runs only once.

---

## Part 8: The libraries used in the app

### 8.1 React Router: moving between screens

Normally the URL decides the page. **React Router** does this inside a single-page app, without reloading.

```tsx
<Routes>
  <Route path="/home" element={<HomePage />} />
  <Route path="/history/:id" element={<ResultsPage />} />
</Routes>
```

- `:id` is a variable part. `useParams()` reads it.
- `useNavigate()` gives a function for going elsewhere: `navigate('/home')`.
- `useSearchParams()` reads `?focus=causes` from the address.

**Why HashRouter?** Addresses look like `http://site/#/home`. Everything after `#` is handled by the app, so it works on any simple host and inside the Android wrapper without any server setup.

### 8.2 Zustand: shared memory

Some data is needed by many screens. Passing it through props from screen to screen is painful. A **store** is a central place any component can read.

```ts
const useSettings = create((set) => ({
  language: 'en',
  set: (patch) => set(patch),
}));

// in any component
const language = useSettings((s) => s.language);
```

The `persist` middleware saves a store to localStorage automatically. This project has two stores:

| Store | Saved? | Contents |
| --- | --- | --- |
| `useSettings` | Yes, in localStorage | Language, theme, voice, active profile |
| `useScanSession` | **No**, memory only | The scan in progress, including photos |

Keeping photos only in the non-saved store is how the privacy promise is enforced.

### 8.3 Dexie: the database

**IndexedDB** is a database built into the browser, but its raw form is awkward. **Dexie** makes it pleasant.

```ts
const profiles = await db.profiles.toArray();
await db.scanResults.add(record);
```

`useLiveQuery` from `dexie-react-hooks` re-runs a query and refreshes the component whenever the data changes.

### 8.4 i18next: languages

**i18n** is short for "internationalization": there are 18 letters between the i and the n. Instead of writing text in code, you write a key.

```tsx
const { t } = useTranslation();
<h1>{t('home.startScan')}</h1>
```

The real text lives in JSON files, one per language:

```json
{ "home": { "startScan": "Start Scan" } }
```

Values can be filled in: `t('results.likelyRange', { low: '11.0', high: '13.2' })` with the text `"Likely between {{low}} and {{high}} g/dL"`.

Files are split into two **namespaces**: `common` (screens) and `guidance` (health advice). `t('guidance:diet.title')` reads from the second one.

A test (`i18n.test.ts`) makes sure Telugu and Hindi have exactly the same keys as English, so a missing translation fails the tests.

### 8.5 Framer Motion: animation

Replaces a normal tag with an animated one.

```tsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
```

`AnimatePresence` animates things as they leave. `<MotionConfig reducedMotion="user">` respects people who ask their device to reduce motion.

### 8.6 lucide-react: icons

A set of drawn icons used as components: `<Camera size={24} />`. Important buttons have both an icon and text, which helps people who read less easily.

### 8.7 Recharts: charts

Builds charts from components: `HbTrendChart` (history line chart) and `ModelPerformanceCard` (bar chart).

### 8.8 jsPDF: PDF reports

Creates PDF files in the browser. jsPDF cannot handle Telugu or Hindi lettering itself, so the app draws the whole page on a canvas first, where the browser shapes the letters correctly, and then places that image in the PDF.

### 8.9 OpenCV.js and MediaPipe

- **OpenCV** is a famous image-processing library. `OpenCV.js` is a version compiled to WebAssembly so it runs in a browser.
- **MediaPipe** is Google's library that finds hands and faces, and returns the positions of points such as fingertips.

These are explained properly in Part 11.

### 8.10 TensorFlow.js

A library for running neural networks in the browser. It is included so that a CNN model could be used, but **the current trained models do not use a CNN**, so it does not run. The code is ready if one is added later.

### 8.11 vite-plugin-pwa: installable and offline

**PWA** means Progressive Web App: a website that can be installed and can work offline.

This plugin creates a **service worker**, a small background program that saves all the app's files on first load, then serves them even without internet. On the phone, in the APK, this is skipped, as the files are already inside the app.

### 8.12 Vitest: tests

The test runner.

```ts
describe('adding', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

`describe` groups tests, `it` is one test, and `expect` states what must be true.

### 8.13 ESLint and Prettier

- **ESLint** finds suspicious code.
- **Prettier** formats code consistently. Settings are in `.prettierrc`.

---

## Part 9: Capacitor and Android

### 9.1 The problem

HemoScan is a website. But people want an app on their phone that works without a browser or internet.

Writing a whole second app in Android's own language would double the work. **Capacitor** solves this.

### 9.2 What Capacitor does

A **WebView** is a browser window inside an app, with no address bar. Capacitor makes a small native Android app whose entire screen is a WebView, and that WebView shows your website, loaded from files inside the app.

```text
 ┌──────────────── Android phone ─────────────────┐
 │  HemoScan.apk                                  │
 │  ┌──────────────────────────────────────────┐  │
 │  │ Small Android shell (MainActivity)       │  │
 │  │  ┌────────────────────────────────────┐  │  │
 │  │  │ WebView                            │  │  │
 │  │  │   your React app (the dist folder) │  │  │
 │  │  └───────────────▲────────────────────┘  │  │
 │  │       Capacitor bridge│                  │  │
 │  │  ┌───────────────▼────────────────────┐  │  │
 │  │  │ Plugins: Camera, Filesystem,       │  │  │
 │  │  │ Share, Text-to-Speech              │  │  │
 │  │  └────────────────────────────────────┘  │  │
 │  └──────────────────────────────────────────┘  │
 └────────────────────────────────────────────────┘
```

A **plugin** is the bridge between web code and real phone features.

| Plugin | Used for |
| --- | --- |
| `@capacitor/camera` | Opening the gallery picker |
| `@capacitor/filesystem` | Saving a file to share |
| `@capacitor/share` | The Android share sheet (WhatsApp and so on) |
| `@capacitor-community/text-to-speech` | The phone's speech engine, because Android's WebView has no Web Speech API |

Your code checks where it is running:

```ts
if (Capacitor.isNativePlatform()) {
  // running as the Android app
} else {
  // running in a browser
}
```

### 9.3 The commands

| Command | What it does |
| --- | --- |
| `npm run build` | Makes the `dist/` folder |
| `npx cap sync android` | Copies `dist/` into the Android project, and connects plugins |
| `npx cap open android` | Opens the project in Android Studio |
| `./gradlew assembleDebug` | Builds the APK |

**Remember:** change code, then `npm run build`, then `npx cap sync android`, then build again. If you forget, the phone shows the old version.

### 9.4 Android project files

Android projects have a standard layout. Most of it is generated. These matter:

| File | Purpose |
| --- | --- |
| `capacitor.config.ts` | App id `com.hemoscan.app`, app name, and where the web files are |
| `android/app/src/main/AndroidManifest.xml` | App information and permissions (camera, gallery, internet) |
| `android/app/build.gradle` | Build rules, including the version number |
| `android/variables.gradle` | Android versions: minimum 24 (Android 7), target 34 (Android 14) |
| `android/build.gradle` | Android Gradle Plugin 8.2.1 |
| `android/gradle/wrapper/gradle-wrapper.properties` | Gradle 8.2.1 |
| `android/local.properties` | Where the SDK is on this computer |
| `android/app/src/main/java/com/hemoscan/app/MainActivity.java` | The app's start point. It has one line, because Capacitor does the work. |
| `android/app/src/main/res/` | Icons, splash screen, and app name |
| `android/capacitor.settings.gradle` | Generated plugin list. Do not edit. |

**Gradle** is the build system for Android. `gradlew` (Gradle Wrapper) is a small script that downloads the right version of Gradle, so you do not have to install it.

**Permissions** are things an app must declare. In `AndroidManifest.xml`:

- `CAMERA` for live capture.
- `READ_MEDIA_IMAGES` to choose a photo.
- `INTERNET` is only for the optional sync. Screening itself works offline.

### 9.5 Can it work on iPhone?

React and Capacitor can target iOS too, but this project only contains the Android folder, and building for iPhone requires a Mac, Xcode and an Apple developer account. It would need some testing and adjustment.

---

## Part 10: Python and its libraries from zero

Python is used only in the `training/` folder.

### 10.1 Python basics

Python is known for looking almost like English. Blocks are marked by **indentation** (spaces at the start of a line), not curly braces.

```python
hb = 12.5                      # a variable; text after # is a comment
name = "Asha"
is_ok = True

if hb >= 12:
    print("Normal")
elif hb >= 11:
    print("Mild")
else:
    print("Lower")

def add(a, b):                 # define a function
    return a + b

print(add(2, 3))               # 5
```

**Lists and dictionaries:**

```python
regions = ["eye", "nails", "palm"]     # list
regions[0]                             # "eye"
len(regions)                           # 3

profile = {"name": "Asha", "age": 30}  # dictionary
profile["age"]                         # 30
```

**Loops and list comprehensions:**

```python
for r in regions:
    print(r)

double = [x * 2 for x in [1, 2, 3]]    # [2, 4, 6]
```

**f-strings** fill values into text:

```python
print(f"Hb is {hb} g/dL")
```

**Importing:**

```python
import numpy as np
from common import ARTIFACTS
```

**Slicing** takes part of a list. `items[1:3]` gives items 1 and 2. `items[-1]` gives the last one.

**Classes:** like JavaScript classes. `__init__` is the setup function, and `self` means this object.

```python
class Detector:
    def __init__(self):
        self.ready = False
```

**Running a script:** `python train.py`.

**Type hints** are optional notes such as `def f(x: float) -> str:`. They help readers.

**Decorators and `lambda`:** `lambda x: x + 1` is a tiny unnamed function. `@something` above a function wraps it.

**`if __name__ == "__main__":`** means "run this only when this file is started directly, not when another file imports it".

**`argparse`** reads command options, such as `--version 2026.10`.

### 10.2 pip and virtual environments

- **pip** installs Python packages, like npm does for JavaScript.
- **`requirements.txt`** is the shopping list.
- A **venv** is a private folder of packages for one project.

### 10.3 NumPy: arrays of numbers

A **NumPy array** is a grid of numbers that can be processed all at once, extremely fast.

```python
import numpy as np

a = np.array([1, 2, 3])
a * 2          # [2, 4, 6]   no loop needed
a.mean()       # 2.0
a > 1          # [False, True, True]
a[a > 1]       # [2, 3]      keep only those
```

An image is a NumPy array of shape `(height, width, 3)`. The **shape** is its size in each direction. Most of `common.py` is NumPy maths on pixels.

### 10.4 pandas: tables

A **DataFrame** is a table with named columns, like a spreadsheet.

```python
import pandas as pd

df = pd.read_csv("labels.csv")
df.hb.mean()
df[df.region == "eye"]            # only eye rows
df.groupby("region").hb.mean()    # average per group
```

### 10.5 OpenCV (cv2): images

```python
import cv2

img = cv2.imread("photo.jpg")     # note: cv2 uses BGR order, not RGB
rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
```

The same operations as OpenCV.js in the app, which is why training and the app can match.

### 10.6 scikit-learn: machine learning tools

Provides the Random Forest, cross-validation splitters such as `GroupKFold`, and scoring functions such as `roc_auc_score`. Every model follows the same pattern:

```python
model.fit(X, y)         # learn
model.predict(X_new)    # use
```

### 10.7 XGBoost: the main model

A very strong tree-based library. Part 12 explains how it works.

### 10.8 joblib, m2cgen, matplotlib, pytest

| Library | Job |
| --- | --- |
| `joblib` | Saves a trained model to a file (`rf.joblib`) |
| `m2cgen` | "Model to code generator". Turns a trained model into plain code |
| `matplotlib` | Draws charts in `evaluate.py` |
| `pytest` | Runs Python tests |

### 10.9 TensorFlow and MediaPipe in Python

- **TensorFlow** is listed for the optional CNN route. The current shipped models do not use a CNN.
- **MediaPipe** is the same hand and face finder as the app, used by `roi.py` when images need automatic detection.

---

## Part 11: How images are processed

This part explains every image technique in the project. They are mostly simple once you see the idea.

### 11.1 Colour spaces: different ways of describing a colour

RGB is how screens work, but it is not how humans think about colour. Depending on the task, other descriptions are more useful.

**RGB:** how much red, green and blue. Each is 0 to 255.

**HSV:** closer to how people describe colour.

| Part | Meaning |
| --- | --- |
| Hue | Which colour (red, green, blue...) |
| Saturation | How vivid or how grey |
| Value | How bright |

**CIE Lab:** designed so that equal number changes look like equal colour changes to the human eye.

| Part | Range | Meaning |
| --- | --- | --- |
| L | 0 to 100 | Lightness |
| a | negative to positive | Green (negative) to **red** (positive) |
| b | negative to positive | Blue (negative) to yellow (positive) |

The `a` channel is especially important here, as it measures **how red something is, regardless of how bright it is**. Exactly what anemia affects.

From the real code, with the pixels used earlier:

| Pixel (R, G, B) | L | a | b |
| --- | --- | --- | --- |
| 200, 100, 100 (healthy pink-red) | 54.4 | 39.7 | 18.6 |
| 230, 170, 170 (pale pink) | 75.1 | 22.0 | 8.7 |

The pale pixel has a much lower `a`. This difference is what the AI learns from.

**Luma** (brightness as one number) is computed as `0.299 R + 0.587 G + 0.114 B`. Green counts most because human eyes are most sensitive to it. Pixel (200, 100, 100) has a luma of 129.9.

### 11.2 Measuring blur with the Laplacian

A sharp photo has sudden changes between neighbouring pixels. A blurry one has only gradual changes.

The **Laplacian** compares each pixel with its four neighbours:

```text
value = top + bottom + left + right - 4 × centre
```

- In a smooth area, all pixels are about equal, so the result is near 0.
- At a sharp edge, the result is large, positive or negative.

The **variance** measures how spread out numbers are. A large variance of the Laplacian means many sharp edges, so the photo is sharp.

**Worked example.** Take four pixel patches:

Patch A (smooth): centre 100, neighbours 100, 100, 100, 100. Value = 400 - 400 = **0**.

Patch B (edge): centre 100, neighbours 200, 100, 100, 100. Value = 500 - 400 = **100**.

**The problem and this project's fix.** The plain method measures the whole picture. But a sharp close-up of smooth skin has few edges, and gets wrongly called "blurry". So `sharpnessScore` in `sharpness.ts` does this:

1. Shrink the image so its longest side is 320 pixels. This also hides camera noise and WhatsApp compression.
2. Divide it into a 6 by 6 grid, making 36 tiles.
3. Compute the Laplacian variance for each tile.
4. Sort the 36 numbers and take the one 90% of the way up.

So it asks "how sharp are the sharpest parts?". The thresholds: below 60 means blurry (rejected), 60 to 140 means slightly soft (accepted and sharpened), and 140 or above means good.

### 11.3 Gray-world white balance

Indoor light is yellowish, and shade is bluish. Skin looks different under each. The same person's eyelid can give different numbers purely because of the lamp.

**The gray-world idea:** on average, a typical scene should come out as neutral grey. If the average red is too high, the light must be reddish, so reduce red.

```text
1. Compute average R, G and B over the whole photo.
2. gray = (avgR + avgG + avgB) / 3
3. Multiply each channel by gray / its average.
```

**Worked example.** Averages are R = 150, G = 100, B = 80. Gray = 110. Gains: R × 0.73, G × 1.10, B × 1.375.

The gains are limited to between 1/1.8 and 1.8, so that a photo with one dominant colour is not ruined.

### 11.4 CLAHE: fixing contrast

**Histogram equalization** spreads out brightness levels so that dull images gain contrast. Doing that to a whole image can make some regions too bright, so **CLAHE** (Contrast Limited Adaptive Histogram Equalization) improves on it:

- **Adaptive:** it splits the image into tiles (8 by 8 here) and works on each.
- **Contrast limited:** it stops any brightness level from dominating too much (clip limit 2.0), which avoids amplifying noise.

Key detail: it is applied only to the **L** channel of Lab. Lightness changes, but the colour channels `a` and `b` do not. So the redness measurement stays accurate.

### 11.5 Noise and denoising

**Noise** is random speckle, especially in dim light. `estimateNoiseSigma` estimates it using a small grid pattern that cancels out smooth areas and edges, leaving only noise (a method from Immerkær, 1996).

A **Gaussian blur** replaces each pixel with a weighted average of its neighbours. The weights here:

```text
1 2 1
2 4 2     divided by 16
1 2 1
```

It is used only when noise is mild (sigma from 4 up to 14). A very noisy photo is left alone. The system does not pretend to repair it.

### 11.6 Unsharp mask: gentle sharpening

Strangely, you sharpen by blurring first:

```text
sharp = original + amount × (original - blurred)
```

`original - blurred` contains just the edges. Adding some back makes edges crisper. Since it only changes things around edges, average colour stays about the same.

It is applied only to photos marked "slightly soft", with amount 0.8. Very blurry photos are rejected instead.

### 11.7 Finding the region: landmarks

We need the exact part of the photo that matters.

**MediaPipe Face Landmarker** returns 478 numbered points on a face. **Hand Landmarker** returns 21 numbered points on a hand. Each comes with x and y, given as fractions of the image.

The app uses these:

| Part | Landmark numbers | Box |
| --- | --- | --- |
| Eye | Corners 33, 133 and 263, 362. Lower lid 145, 153, 144, 163, 7 and 374, 380, 373, 390, 249 | A strip under the lower lid, as wide as the eye and 0.28 times that high |
| Nails | Fingertip and last joint pairs: 8 and 7, 12 and 11, 16 and 15, 20 and 19 | A square at each nail, for four fingers |
| Palm | Wrist 0, and knuckles 5, 9, 13, 17 | A square at the centre |

**Picking the correct eye.** Usually only one eyelid is pulled down. If both eyes are found, `pickPulledEye` measures the hue of each box and keeps the pinker one, so plain skin under the other eye is not measured.

**Removing the white of the eye.** `dropScleraPixels` removes pixels that are very bright and almost colourless (L above 70 and chroma below 12), because the model learned from eyelid tissue only.

### 11.8 Finding the region without landmarks: heuristics

A close-up of an eyelid has no complete face, so MediaPipe finds nothing. A **heuristic** is a practical rule of thumb. `roiHeuristics.ts` has three:

- **Eye:** `reddestWindow` splits the area into a 16 by 16 grid, and finds the rectangle with the highest average `a`, the reddest place.
- **Nails:** `nailBedWindows` finds grid cells that are mostly skin-coloured, and brighter than typical skin. Nail plates reflect more light.
- **Palm:** checks that the guide box has enough skin in it (at least 30%).

These get lower confidence scores (at most 0.7) than landmarks (0.9), so they count less later.

**Skin detection** uses a colour system called **YCrCb**, where skin falls inside a known range: Cr between 133 and 180, and Cb between 77 and 135.

### 11.9 ROI mosaic

**ROI** means Region Of Interest. When there are four nail boxes, they are shrunk and placed in one square picture, of 224 by 224 pixels. Then there is one image to measure.

### 11.10 The 55 colour features

A **feature** is a single measured number that describes something. The model does not look at a picture. It looks at a list of 55 numbers computed from the ROI.

Before computing, pixels that are extremely bright (glare, luma above 250) or extremely dark (shadow, luma under 12) are skipped.

| Numbers | Names | Meaning |
| --- | --- | --- |
| 6 | `r_mean`, `r_std`, `g_mean`, `g_std`, `b_mean`, `b_std` | Average and spread in RGB |
| 6 | `h_mean`, `h_std`, `s_mean`, `s_std`, `v_mean`, `v_std` | Same in HSV |
| 6 | `L_mean`, `L_std`, `a_mean`, `a_std`, `bb_mean`, `bb_std` | Same in Lab |
| 1 | `rg_ratio` | Total red divided by total green |
| 3 | `a_p10`, `a_p50`, `a_p90` | Redness at the 10th, 50th, 90th percentiles |
| 1 | `erythema_index` | A medical redness measure: average of log10(R/G) |
| 8 | `hist_r_0` to `hist_r_7` | Histogram of red |
| 8 | `hist_g_0` to `hist_g_7` | Histogram of green |
| 8 | `hist_b_0` to `hist_b_7` | Histogram of blue |
| 8 | `hist_a_0` to `hist_a_7` | Histogram of `a` |
| **55** | | |

A **mean** is an average. **Std** (standard deviation) measures how much values vary. A **percentile** is the value that a given share of values lie below. A **histogram** counts how many pixels fall in each range of values.

The final input to the main model has 60 numbers:

```text
[ 55 colour features, eye?, nails?, palm?, age, sex ]
```

- `eye?, nails?, palm?` is a **one-hot** encoding, where exactly one is 1 and the others are 0. For an eye: `1, 0, 0`.
- `sex` is male 1, female 0, unknown 0.5.

The backup model uses just 58: the colour features plus the one-hot.

### 11.11 Skin tone: the ITA angle

Pallor is harder to see on darker skin, so the palm should be trusted less there. The **Individual Typology Angle** is a standard dermatology measure:

```text
ITA = arctan( (L - 50) / b ) × 180 / π
```

Worked example: L = 60, b = 20. (60 − 50) / 20 = 0.5, and arctan(0.5) is about 26.6 degrees.

| ITA above | Category | How much the palm counts |
| --- | --- | --- |
| 55 | veryLight | 1.0 |
| 41 | light | 1.0 |
| 28 | intermediate | 0.9 |
| 10 | tan | 0.75 |
| -30 | brown | 0.55 |
| otherwise | dark | 0.35 |

So 26.6 is **tan**, and the palm counts at 0.75.

**Important:** skin tone is measured only from finger skin around the nails, or from an optional arm photo, and never from the palm, because anemia itself makes the palm paler. It is used only for the palm's weight. It is never used to guess ethnicity, and it does not change the eye or nail estimates.

### 11.12 Spotting confounders automatically

| Flag | How it is detected |
| --- | --- |
| `scleraRed` | In a band above the eyelid, find bright, low-colour pixels (the white of the eye). If their median `a` is over 10, it is pink. |
| `nailCoating` | Over 35% of the ROI is highly saturated, or over 30% has hues that skin never has. |
| `hennaDetected` | Same test, on the palm. |
| `nailDarkSpot` | Over 8% of the ROI is very dark, which may be a bruise. |

### 11.13 Should the photo be trusted at all? The out-of-range check

The app checks whether a photo's colours are similar to those the model learned from. If they differ, for example because of an unusual camera or light, it shows a wider range and suggests adding a blood test.

During export, the training code records the 1st and 99th percentile of six key features for the training photos, separately for adults and children. The features are `a_p50`, `a_mean`, `rg_ratio`, `erythema_index`, `s_mean` and `L_mean`.

In the app, if two or more features are outside that range, the photo is marked `outOfRange`. That region then counts half as much, its range becomes 1.5 times wider, and the result cannot be labelled high confidence.

---

## Part 12: How the AI works

### 12.1 Normal programming versus machine learning

In **normal programming**, a human writes the rules:

```text
Rules + Data → Answers
```

In **machine learning**, the human provides data and known answers, and the computer finds the rules:

```text
Data + Answers → Rules (a "model")
```

Then the model is used on new data to give answers.

Imagine teaching a child what a ripe mango is. You do not give a formula. You show many mangoes and say "ripe" or "not ripe". Eventually the child can judge a new mango alone. That is machine learning.

### 12.2 Vocabulary

| Word | Meaning | In this project |
| --- | --- | --- |
| Sample | One example | One person's photo measurements |
| Feature | One measured input | `a_mean`, age, etc. |
| Label or target | The right answer | The lab hemoglobin |
| Training | Learning from examples | `train.py` |
| Model | The learned rules | XGBoost files |
| Prediction or inference | Using the model | Done on the phone |
| Regression | Predict a number | Hemoglobin value |
| Classification | Predict a category | Anemic or not (palm) |
| Dataset | The collection of examples | 1,119 people |

"X" usually means the features, and "y" means the answers.

### 12.3 Decision trees

A **decision tree** is a flowchart of yes or no questions.

```text
                 Is a_mean above 0.25?
                 /                   \
               no                    yes
               /                       \
    Is erythema below 0.15?       Is age under 5?
       /         \                 /         \
     yes         no              yes         no
     8.5         10.6           11.2        13.4   ← predictions in g/dL
```

(The numbers in this picture are made up to show the idea.)

To predict, start at the top and follow the answers. The number at the bottom, called a **leaf**, is the answer.

**How does it learn?** For each possible question, it tries splitting the examples into two groups, and asks: "does this split make the numbers within each group more similar?" It chooses the best question, then repeats inside each group.

A single tree is simple, but not very accurate.

### 12.4 Random Forest

Ask one person the weight of a cow, and they may be far off. Ask 500 people and take the average, and you get remarkably close. This is the "wisdom of crowds".

A **Random Forest** builds many different trees, and averages them. Each tree differs because it gets a random subset of the samples, and considers a random subset of the features.

This project's backup forest: 120 trees, depth up to 10, with at least 3 samples per leaf, using 50% of features at each split.

### 12.5 Gradient boosting and XGBoost

**Boosting** builds trees one after another, where **each new tree tries to fix the mistakes of the trees before it**.

Think of a student correcting a test:

```text
Start: guess the average                              → 11.0
Tree 1 learns the remaining error for each person     → adds +1.2 for some
Tree 2 learns what error is still left                → adds −0.3 for some
Tree 3 ...
Final answer = starting guess + sum of all tree outputs
```

**XGBoost** (Extreme Gradient Boosting) is a very efficient and popular way of doing this.

The settings actually used in `train.py`:

| Setting | Value | Meaning |
| --- | --- | --- |
| `n_estimators` | 600 | Number of trees |
| `max_depth` | 6 | Maximum questions per path |
| `learning_rate` | 0.03 | Each tree's output is scaled down to 3%, so learning is slow and careful |
| `subsample` | 0.8 | Each tree sees 80% of the people |
| `colsample_bytree` | 0.4 | Each tree sees 40% of the features |
| `min_child_weight` | 3 | Do not make groups that are too small |
| `reg_lambda` | 1.0 | Penalty that discourages extreme values |

These settings are called **hyperparameters**. Humans choose them, as opposed to the values the model learns.

### 12.6 Quantile regression: a range, not just a number

Normal regression predicts one best value. But the app needs to say how sure it is.

**Quantile regression** predicts a chosen percentile instead.

| Model | Alpha | Meaning |
| --- | --- | --- |
| Lower | 0.1 | The true value should be below this only about 10% of the time |
| Median | 0.5 | The middle estimate |
| Upper | 0.9 | The true value should be above this only about 10% of the time |

So three XGBoost models are trained, and together they give an estimate and a range.

It uses a special error measure called the **pinball loss**, which penalizes errors unequally depending on the percentile.

### 12.7 Conformal calibration: making the range dependable

The app promises that the shown range holds the real value about 80% of the time. **Conformal calibration** is what makes that promise true, by tuning the range on data the model has not seen. It raised coverage from 61% to the promised 80%.

For each held-out person, measure how far outside the range the true value was:

```text
score = max(lower - true, true - upper)
```

Then find the number `c` such that the range widened by `c` on each side contains 80% of people.

The real result: eye `c` is 0.80 g/dL, and nails `c` is 0.82 g/dL. After calibration, coverage is 80%.

### 12.8 How a model is tested on unseen people

If you test a student with the exact questions they practised, they get full marks without understanding. Models are the same. A model must be tested on **people it has never seen**.

**Train/test split:** hide some people from training, and test on them.

**K-fold cross-validation:** a fairer version that uses everyone. With 5 folds:

```text
Fold 1:  TEST train train train train
Fold 2:  train TEST train train train
Fold 3:  train train TEST train train
Fold 4:  train train train TEST train
Fold 5:  train train train train TEST
```

Each person is tested exactly once, by a model trained without them. Those are **out-of-fold** predictions, and they are saved in `artifacts/oof_predictions.csv`.

**Group k-fold:** the same person must never be in both training and testing, or the score is inflated. This is called **data leakage**. `GroupKFold` guarantees this.

The palm dataset is a good example of the danger. It contains about 9 augmented copies of each original photo: 4,260 images from 475 photos. All copies of one photo are kept in the same fold using `StratifiedGroupKFold`.

### 12.9 The scores, with real numbers

These are the actual figures for the shipped model, version `2026.10-india-v4`, tested on 1,119 people.

**Confusion matrix.** Compare what the model said with what was true. "Positive" here means anemic.

|  | Really anemic | Really not anemic |
| --- | --- | --- |
| **App said anemic** | 489 (true positive, TP) | 121 (false positive, FP) |
| **App said not anemic** | 78 (false negative, FN) | 431 (true negative, TN) |

Every score below comes from those four numbers:

| Score | Formula | Calculation | Result | Plain meaning |
| --- | --- | --- | --- | --- |
| Accuracy | (TP + TN) / all | (489 + 431) / 1119 | **82.2%** | How often it was right |
| Precision | TP / (TP + FP) | 489 / 610 | **80.2%** | When it says anemic, how often that is true |
| Recall (sensitivity) | TP / (TP + FN) | 489 / 567 | **86.2%** | Of the anemic people, how many it caught |
| Specificity | TN / (TN + FP) | 431 / 552 | **78.1%** | Of the healthy people, how many it cleared |
| F1 score | 2 × P × R / (P + R) | 2 × .802 × .862 / 1.664 | **0.83** | A balance of precision and recall |
| Balanced accuracy | (Recall + Specificity) / 2 | | **82.2%** | Fair when groups differ in size |

**AUC** (Area Under the ROC Curve) is **0.88**. It measures how well the estimates rank people. It answers: if you pick one anemic person and one healthy person at random, how often does the model give the anemic one the higher risk? 1.0 is perfect, and 0.5 is a coin toss.

**Number accuracy:**

| Score | Result | Meaning |
| --- | --- | --- |
| MAE (mean absolute error) | **1.42 g/dL** | On average, the estimate is off by this much |
| RMSE (root mean squared error) | **1.89 g/dL** | Like MAE, but punishes big misses more |
| R² | **0.48** | Share of differences between people that the model explains. 1.0 is perfect, 0 is no better than always guessing the average. |
| Pearson r | **0.69** | How strongly estimates and truth rise together |
| Within ±1 g/dL | **47.7%** | |
| Within ±2 g/dL | **74.4%** | |
| Range contains lab value | **80.2%** | |
| Severity level exactly right | **61.7%** | Normal, mild, moderate, severe |

**Understanding these figures:**

- They were measured by person-grouped cross-validation on lab-verified research datasets, so every person was tested by a model that had never seen them.
- Averaged across different ways of splitting people into groups, accuracy is **about 80 to 82%**.
- The full scorecard, with separate columns for each scanned area and group, is in the app under **Settings → Model performance**.
- The figures are recalculated each time the model is retrained with new data (Part 24).

### 12.10 The datasets

| Dataset | Used for | People | Hemoglobin source | Notes |
| --- | --- | --- | --- | --- |
| CP-AnemiC (Ghana) | Eye | 710 children, 6 to 59 months | Lab | Cut-outs of the eyelid. CC BY 4.0 |
| Eyes-defy-anemia | Eye | 94 Indian and 120 Italian adults | Lab | Indian samples count 3 times in training |
| Moscow skin and nails | Nails | 195 adults used (55 failed the quality check) | Venous blood | CC0. No age or sex per person is used. |
| Ghana palm | Palm check | 475 original photos of children | Anemic or not only | No hemoglobin values, so it can only be a yes or no check |

### 12.11 The palm classifier

Because the palm dataset only says anemic or not, a **classification** model is used. It is XGBoost with 300 trees of depth 3, and it outputs a probability from 0 to 1.

The cutoff is 0.61. Probability at or above that means "looks anemic". The cutoff was picked to balance recall and specificity.

**The palm never changes the hemoglobin number.** It appears as a separate check, and if it disagrees with the main result the app says so.

### 12.12 Turning models into code

Python cannot run on the phone. So the trained trees are converted into ordinary JavaScript `if` statements. A tree becomes nested conditions:

```js
s += (x[18] < 0.94 ? (x[7] < 0.3 ? 0.21 : -0.14) : 0.33);
```

The file `src/ml/models/xgboostModel.ts` holds 1,800 trees in total (three models of 600), in about 2.6 MB. It starts with these lines, and they are generated, not hand-written:

```ts
export const MODEL_VERSION: string = '2026.10-india-v4';
export const FEATURE_COUNT: number = 60;
export const USES_CNN: boolean = false;
export const REGIONS: string[] = ["eye", "nails"];
```

Advantages: no special AI runtime is needed, it is tiny, and a prediction takes a fraction of a millisecond.

`export.py` **checks** the result. It runs the JavaScript on 50 samples in Node and compares with Python. If they differ by more than 0.001, the export stops.

**A technical detail:** `m2cgen` mistranslates some newer XGBoost models. The script detects that through this check, and uses its own translator built from XGBoost's raw dump. That is what the "VERIFICATION FAILED ... using the built-in translator" line means. It is expected.

### 12.13 The fallback decider

Sometimes the main model should not be trusted, and the Random Forest is used instead. `FallbackDecider` switches if **any** of these is true:

| Trigger | Value |
| --- | --- |
| Photo quality is borderline | |
| XGBoost's value is implausible | below 4 or above 20 g/dL |
| XGBoost's range is too wide | more than 8.0 g/dL |
| CNN failed | Only relevant if a CNN is used |

### 12.14 Fusion: combining the regions

If you scanned the eye and the nails, you have two estimates. Each gets a weight, and the final answer is the weighted average.

```text
trust  = base × quality × detection × fallback penalty × confounder × skin × population × out-of-range
weight = trust × (0.6 / halfWidth)²
result = Σ(hb × weight) / Σ(weight)
```

| Factor | Value |
| --- | --- |
| Base | Eye 1.0, nails 0.9, palm 0.55 |
| Fallback penalty | 0.8 if the backup model was used |
| Confounder | From the checklist and image flags. 0 removes the region. |
| Population mismatch | 0.7 if the person's age is outside the training range |
| Out of range | 0.5 |
| Inverse variance | (0.6 / halfWidth)². A less certain region counts less. |

**Half-width** is how far the range extends on each side:

```text
base  = (upper - lower) / 2, or 1.2 if the backup model gave no range
trust = max(0.15, quality × detection × confounder)
width = base × (1 + 0.8 × (1 - trust))
```

It is multiplied by 1.3 for a population mismatch, and 1.5 for out-of-range. Then it is kept within 0.6 and 4.0.

**Full worked example, verified by running the real code.**

| | Eye | Nails |
| --- | --- | --- |
| Estimate | 12.0 | 13.0 |
| Range | 9.8 to 14.2 | 10.0 to 16.0 |
| Quality | 1.0 | 0.8 |
| Detection | 0.9 | 0.9 |

**Eye:**

```text
base half-width = (14.2 - 9.8) / 2 = 2.2
trust for width = 1.0 × 0.9 = 0.9
half-width      = 2.2 × (1 + 0.8 × 0.1) = 2.376
trust           = 1.0 × 1.0 × 0.9 = 0.9
weight          = 0.9 × (0.6 / 2.376)² = 0.0574
```

**Nails:**

```text
base half-width = (16 - 10) / 2 = 3
trust for width = 0.8 × 0.9 = 0.72
half-width      = 3 × (1 + 0.8 × 0.28) = 3.672
trust           = 0.9 × 0.8 × 0.9 = 0.648
weight          = 0.648 × (0.6 / 3.672)² = 0.0173
```

**Combined:**

```text
Hb = (12.0 × 0.0574 + 13.0 × 0.0173) / (0.0574 + 0.0173) = 12.2
half = (2.376 × 0.0574 + 3.672 × 0.0173) / 0.0747 = 2.68
range = 12.2 ± 2.68 = 9.5 to 14.9
```

The eye counts far more because it is more certain.

**Confidence:**

```text
confidence = (0.9 + 0.648) / (1.0 + 0.9) = 0.81
```

At 0.6 or above, with no disagreement or out-of-range photo, it is labelled **high confidence**.

If the regions disagree by more than 2.5 g/dL, confidence is multiplied by 0.7 and can never be high.

**A confounder example:** tick "cried or rubbed eyes" for the same scan. The eye's factor becomes 0.3, so its weight falls, the nails matter more, and the result moves up to 12.7.

If every region has a factor of 0, a plain average is shown and marked as unreliable.

### 12.15 Personal calibration

If one person's estimate is consistently off, their own blood test can correct it.

```text
offset = average(lab - estimate) × n / (n + 0.5)
```

`n` is the number of tests. The `n / (n + 0.5)` part is **shrinkage**: with little evidence, do not fully believe it.

Example: lab 14.5, photo estimate 11.9, one test. Difference is 2.6. Times 1 / 1.5, the offset is **+1.7**.

Rules: capped at ±4, ignores tests older than a year, and a test only counts if taken within 7 days of the scan.

### 12.16 Device learning

The biggest source of error is often the phone's camera and the lighting. Those are shared by everyone scanned on the same phone.

So each blood test entered on the phone teaches a correction for that phone:

```text
correction(estimate) = a + c × (estimate - center)
```

- `center` is the average estimate.
- `a` is the average error, shrunk by n / (n + 3).
- `c` is a gentle slope, held back by a penalty called `slopeRidge`.

It is used only if **all** of these hold:

1. At least 5 blood tests.
2. From at least 2 different people.
3. A leave-one-person-out check shows it reduces the error by at least 0.1 g/dL.

**Leave-one-person-out** means: for each person, fit the correction on everyone else, and see if it would have helped that person. A correction that does not help people it did not see stays off. This also protects against mistyped values.

A person's own calibration takes priority. The phone-level correction is used only for people who have none.

**Example, verified by running the code.** Six people, whose lab values are about 2 g/dL higher than the estimates. Without correction, the average error was 2.02 g/dL. With it, on held-out people, it was 0.77 g/dL. So it switches on, and for an estimate of 11 it adds +1.4.

Levels of learning, including retraining the main model with this new data, are explained in full in Part 24.

### 12.17 The guidance engine is not AI

`guidanceEngine.ts` uses plain rules: for example, "if there has been blood loss, list that cause first". There is no machine learning in the advice. That is deliberate, because medical advice should be predictable and reviewable.

---

## Part 13: Following one scan from start to finish

This part ties everything together. Follow it with the code open if you can.

**The story:** Asha, a 30-year-old woman, presses **Start Scan** and chooses **Scan All**.

### 13.1 Before the camera

1. `RegionSelectPage` calls `start(['eye', 'nails', 'palm'])` on the `useScanSession` store. This sets the **queue**, the list of regions to capture.
2. The app moves to `/scan/method`, which shows `InputMethodPage` for the first region, the eye.
3. `ConditionChecklist` shows "Before you scan" items. Asha ticks nothing today. Any ticks go into `conditions` in the store.
4. She presses **Use Camera**, and the app moves to `/scan/capture`.

### 13.2 At the camera

`CapturePage` uses three hooks:

| Hook | What it does |
| --- | --- |
| `useCamera` | Opens the rear camera, turns on the torch if available |
| `useLiveQuality` | Every 450 ms, shrinks one frame to 240 px and checks focus, light and position |
| `useVoice` | Speaks the instruction |

The capture button is disabled until `live.allOk` is true. Asha presses it. `cam.capture()` draws the video frame on a canvas and creates a JPEG **Blob** in memory.

### 13.3 Quick check

`useCaptureFlow.submit` runs. It:

1. Calls `pipelineWorker.init(...)`, which loads OpenCV.js and the models the first time.
2. Calls `quickCheck`, which decodes the photo to at most 640 px, runs the quality gate, and tries to find the eyelid.
3. If that fails, it goes to `RetakePage`, with a friendly reason.
4. If it passes, it stores the photo in the session, and moves to the next region without a photo.

She repeats this for nails and palm. Once every region has a photo, the app goes to `/scan/processing`.

### 13.4 Processing

`ProcessingPage` first calls `loadDeviceModel()` to get the phone-level correction. Then it calls `runScanPipeline`, the heart of the app.

**For each region, in order:**

```text
 Main thread                                Web Worker
 ───────────                                ──────────
 decodeImage (≤ 640 px)
       │ pixels
       ├──────── prepare(pixels) ─────────► QualityChecker.check
       │                                    Preprocessor.process
       │                                      gray-world → CLAHE on L
       │                                      → denoise OR sharpen
       │ ◄───── quality + preprocessed ─────┤
       │
 regionExtractor.detect
   (MediaPipe, then heuristics)
       │ boxes
       ├──────── analyze(image, boxes) ───► analyzeRegion
       │                                      build ROI mosaic (224 px)
       │                                      drop sclera (eye)
       │                                      55 colour features
       │                                      XGBoost or Random Forest
       │ ◄───────── estimate + features ────┤
       │
 detect confounders (on original pixels)
 measure skin tone (nails only)
```

Why two threads? MediaPipe's WebAssembly loader cannot run in a module worker, so it stays on the main thread. Everything else heavy goes to the worker, so the screen stays smooth.

**A subtle choice.** Which image does the model get?

- **Eye and palm:** the original pixels. Their models learned from cut-outs where no whole-scene white balance was possible.
- **Nails:** the preprocessed pixels, as that model trained on those.

**Train and use must match.** This is one of the most important rules in machine learning.

### 13.5 After all regions

1. The palm is separated out. It only has a probability, so it does not enter the number.
2. `fuseEstimates` combines the eye and nails into one value and a range.
3. A correction is applied: Asha's personal offset if she has one, otherwise the device correction, if active.
4. `severityClassifier.classify` selects her WHO group, `women_15plus`, subtracts any altitude adjustment, and compares.
5. It also classifies the low and high ends of the range. If those differ, the result says so.
6. It compares the palm's opinion and records any disagreement.
7. The whole thing is packed into one `ScanOutcome` object.

### 13.6 Results

Say the eye and nails combine to 11.6, with a range of 9.7 to 13.5:

- Asha's group says normal starts at 12.0, and mild at 11.0, so 11.6 is **Mild anemia**.
- `severityRange` is moderate at 9.7 and normal at 13.5, so the app adds: "Your result falls between ... A blood test will confirm which one."
- `HbGauge` animates, the region breakdown lists each part, and the voice reads the summary.

She can then press **Save**, which calls `saveCurrentScan`. It stores the numbers, the colour measurements and her age and sex at that moment. **The photo is not stored.**

### 13.7 Later

A week later Asha gets a CBC showing 12.4. She opens History, presses **Add blood test result**, and types it.

`scanRepo.setBloodTest` then:

1. Writes it on that scan.
2. Adds a calibration point to her profile.

The next time she scans, `personalOffset` uses it. It also counts towards the phone-level correction, and it can be exported for retraining.

---

## Part 14: The map of every folder and file

### 14.1 The top level

```text
hemoscan/
├── index.html              The single HTML page
├── package.json            Project card and package list
├── package-lock.json       Exact package versions
├── vite.config.ts          Build tool settings and PWA
├── tsconfig.json           TypeScript settings
├── tailwind.config.ts      Colours, fonts, sizes
├── postcss.config.js       CSS processing
├── eslint.config.js        Code-check rules
├── .prettierrc             Code format rules
├── .prettierignore         Files Prettier skips
├── .gitignore              Files version control skips
├── .env.example            Template of optional settings
├── capacitor.config.ts     Android wrapper settings
├── vercel.json             Hosting settings
├── netlify.toml            Hosting settings
├── README.md               Short project reference
├── TRAINING_GUIDE.md       This book
├── src/                    The app's source code
├── public/                 Files copied as they are
├── android/                The Android project
├── training/               Python training code
├── scripts/                Helper scripts
├── docs/screenshots/       Pictures for the README
├── shots/                  Old test screenshots (can be deleted)
├── node_modules/           Downloaded packages (generated)
└── dist/                   The production build (generated)
```

### 14.2 `src/`, the app

| Folder | What is in it |
| --- | --- |
| `src/main.tsx`, `App.tsx`, `index.css` | Start of the app, routes, global styles |
| `src/config/` | Settings and constants |
| `src/store/` | Zustand stores |
| `src/db/` | Database |
| `src/i18n/` | Translations |
| `src/imageProcessing/` | Image maths |
| `src/ml/` | Everything about estimating |
| `src/ml/models/` | Generated model code. Never edit by hand. |
| `src/workers/` | Background thread |
| `src/features/` | Larger behaviours (camera, scan, voice, report, learning, demo, sync) |
| `src/guidance/` | Advice rules |
| `src/components/` | Reusable screen pieces |
| `src/pages/` | Full screens |
| `src/utils/` | Small helpers |
| `src/test/` | Fake images for tests |

### 14.3 Every file in `src/`

**Top level**

| File | Purpose |
| --- | --- |
| `main.tsx` | Loads fonts, styles and translations, then draws the app |
| `App.tsx` | Lists every route |
| `index.css` | Colour variables for light and dark, base styles |

**`config/`**

| File | Purpose |
| --- | --- |
| `pipeline.json` | **All tunable numbers.** Shared with Python. |
| `pipelineConfig.ts` | Typed access to `pipeline.json` |
| `severityThresholds.json` | WHO cutoffs and altitude table. Shared with Python. |
| `appConfig.ts` | App version, file locations, environment settings |
| `guideConfig.ts` | The on-screen guide shapes |
| `languages.ts` | The three languages |
| `locations.ts` | Countries, Indian states, hill states |

**`store/`**

| File | Purpose |
| --- | --- |
| `settingsStore.ts` | Saved user preferences |
| `scanStore.ts` | The scan in progress, memory only |
| `useActiveProfile.ts` | Hook returning all profiles and the active one |

**`db/`**

| File | Purpose |
| --- | --- |
| `db.ts` | Tables and their shapes |
| `repositories.ts` | Functions for reading and writing |

**`i18n/`**

| File | Purpose |
| --- | --- |
| `index.ts` | Sets up i18next |
| `locales/{en,te,hi}/common.json` | Screen text |
| `locales/{en,te,hi}/guidance.json` | Health advice text |
| `i18n.test.ts` | Checks all languages have the same keys |

**`imageProcessing/`**

| File | Purpose |
| --- | --- |
| `types.ts` | Image type and the `ImageOps` interface |
| `colorSpace.ts` | RGB to Lab and HSV, luma |
| `colorFeatures.ts` | The 55 features |
| `imageUtils.ts` | Resize, crop, noise estimate, sharpen |
| `jsOps.ts` | Image operations in plain TypeScript |
| `opencvOps.ts` | The same operations using OpenCV.js |
| `loadOpenCv.ts` | Loads OpenCV.js into the worker |
| `preprocessor.ts` | The lighting clean-up sequence |
| `qualityChecker.ts` | The quality gate |
| `sharpness.ts` | The tile-based sharpness score |
| `roiHeuristics.ts` | Finding regions without landmarks |
| `conjunctiva.ts` | Eyelid helpers |
| `skinTone.ts` | ITA measurement |
| `confounderDetection.ts` | Automatic flags |
| `qualityChecker.test.ts` | Tests |

**`ml/`**

| File | Purpose |
| --- | --- |
| `types.ts` | Shared type definitions |
| `modelProvider.ts` | The interface all model providers follow, and input layout |
| `realModelProvider.ts` | Uses the trained models |
| `mockModelProvider.ts` | A stand-in formula for development only |
| `regionExtractor.ts` | MediaPipe landmarks to boxes |
| `regionAnalyzer.ts` | One region: features to estimate |
| `fallbackDecider.ts` | When to use the backup model |
| `fusion.ts` | Combining regions |
| `severityClassifier.ts` | WHO categories |
| `altitude.ts` | Altitude adjustment |
| `confounders.ts` | Confounder weights |
| `personalCalibration.ts` | A person's own correction |
| `deviceLearning.ts` | Phone-level correction |
| `models/xgboostModel.ts` | Generated: 3 × 600 trees |
| `models/randomForestModel.ts` | Generated: 120 trees |
| `models/palmClassifier.ts` | Generated: 300 trees |
| `*.test.ts` | Tests |

**`workers/`**

| File | Purpose |
| --- | --- |
| `pipeline.worker.ts` | Code that runs on the background thread |
| `protocol.ts` | The message formats |
| `workerClient.ts` | Friendly way of calling the worker |

**`features/`**

| File | Purpose |
| --- | --- |
| `scan/runPipeline.ts` | The full process |
| `scan/useCaptureFlow.ts` | What happens when a photo arrives, and the file picker |
| `scan/saveScan.ts` | Saving a result |
| `scan/useSupportedRegions.ts` | Which regions the models cover |
| `scan/useModelInfo.ts` | Loads `model-info.json` |
| `camera/useCamera.ts` | Camera control |
| `camera/useLiveQuality.ts` | Live checks |
| `voice/useVoice.ts` | Speaking |
| `voice/speechText.ts` | Makes text easy to pronounce |
| `voice/voiceSelect.ts` | Chooses the best voice |
| `report/pdfReport.ts` | Makes the PDF |
| `learning/learningData.ts` | Turns saved scans into learning pairs |
| `learning/learningExport.ts` | Creates the anonymous export file |
| `demo/demoSamples.ts` | The sample image sets |
| `sync/syncService.ts` | Optional upload, unused without a server |

**`guidance/`**

| File | Purpose |
| --- | --- |
| `guidanceEngine.ts` | Rules for causes, actions and referrals |

**`components/ui/`** are general pieces:

| File | Purpose |
| --- | --- |
| `Button.tsx` | Button with variants and sizes |
| `Card.tsx` | Rounded surface |
| `Badge.tsx` | Small coloured label |
| `Toggle.tsx` | On/off switch |
| `PageHeader.tsx` | Title and back button |
| `Logo.tsx` | Droplet logo |
| `PulsingDroplet.tsx` | Loading animation |
| `SeverityChip.tsx` | Severity label |
| `StatusPill.tsx` | Focus, Lighting and Position indicators |
| `StepProgress.tsx` | "1 of 3" |
| `HbGauge.tsx` | Round gauge |
| `HbTrendChart.tsx` | History chart |
| `Disclaimer.tsx` | Screening message |

**`components/` other folders:**

| File | Purpose |
| --- | --- |
| `layout/AppShell.tsx` | Page frame with navigation |
| `illustrations/OnboardingIllustration.tsx` | Drawings for the intro |
| `illustrations/RegionIllustration.tsx` | Eye, nail and palm drawings |
| `profile/SkinTonePicker.tsx` | Measure or pick skin tone |
| `scan/ConditionChecklist.tsx` | "Before you scan" |
| `scan/AdjustmentsCard.tsx` | "What we took into account" |
| `scan/CalibrationCard.tsx` | Blood test entry |
| `scan/LearningCard.tsx` | Learning status and export |
| `scan/ModelInfoNote.tsx` | What the estimate is based on |
| `scan/ModelPerformanceCard.tsx` | Accuracy chart and table |
| `scan/SimulatedBanner.tsx` | Label for old test scans |

**`pages/`**

| File | Route | Purpose |
| --- | --- | --- |
| `SplashPage.tsx` | `/` | Logo, then decides where to go |
| `LanguagePage.tsx` | `/language` | Choose language |
| `OnboardingPage.tsx` | `/onboarding` | Three intro steps |
| `ConsentPage.tsx` | `/consent` | Agreement |
| `ProfileFormPage.tsx` | `/profile/new`, `/profile/:id` | Create or edit a person |
| `ProfilesPage.tsx` | `/profiles` | Switch between people |
| `HomePage.tsx` | `/home` | Dashboard |
| `RegionSelectPage.tsx` | `/scan` | What to scan |
| `InputMethodPage.tsx` | `/scan/method` | Camera, upload or sample |
| `CapturePage.tsx` | `/scan/capture` | Live camera |
| `RetakePage.tsx` | `/scan/retake` | Why a photo was rejected |
| `ProcessingPage.tsx` | `/scan/processing` | Runs the pipeline |
| `ResultsPage.tsx` | `/scan/results`, `/history/:id` | The result |
| `QuestionnairePage.tsx` | `/scan/questionnaire` | Symptom questions |
| `GuidancePage.tsx` | `/scan/guidance`, `/history/:id/guidance` | Causes and advice |
| `HistoryPage.tsx` | `/history` | Past scans |
| `DietTipsPage.tsx` | `/tips` | Food advice |
| `SettingsPage.tsx` | `/settings` | Preferences, learning, accuracy |
| `AboutPage.tsx` | `/about` | About and disclaimer |
| `DemoPage.tsx` | `/demo` | Sample scans |

**`utils/`**

| File | Purpose |
| --- | --- |
| `assetUrl.ts` | Finds files under `public/` |
| `cn.ts` | Joins class names |
| `hbDisplay.ts` | The value and range to display |
| `image.ts` | Decode, copy, encode images |
| `profileText.ts` | Names and dates as text |
| `pwa.ts` | Registers offline support |
| `severity.ts` | Severity colours |
| `shareFile.ts` | Share or download a file |
| `theme.ts` | Light and dark mode |

### 14.4 `public/`

Files here are copied to the build unchanged.

| Path | What it is |
| --- | --- |
| `icons/` | App icons |
| `demo/` | 12 sample images |
| `models/model-info.json` | Model version, datasets, accuracy, colour ranges |
| `models/cnn/` | Empty place for an optional CNN |
| `vendor/opencv/opencv.js` | OpenCV (copied at install) |
| `mediapipe/wasm/` | MediaPipe program (copied at install) |
| `mediapipe/models/` | `face_landmarker.task`, `hand_landmarker.task` |

### 14.5 `scripts/`

| File | Purpose | Normally needed? |
| --- | --- | --- |
| `setup-assets.mjs` | Runs after `npm install`, prepares `public/` | Automatic |
| `generate_demo_samples.py` | Draws the sample images | No |
| `calibrate-demo.ts` | Tunes the development stand-in formula | No |
| `export-parity-fixtures.ts` | Creates test data for Python parity tests | Only if features change |
| `generate_icons.py` | Draws web app icons | No |
| `generate_android_icons.py` | Draws Android icons | No |

### 14.6 `training/`

| File or folder | Purpose |
| --- | --- |
| `common.py` | Shared settings and Python copies of app maths |
| `preprocess.py` | Python copy of the image clean-up |
| `roi.py` | Python copy of region finding |
| `prepare_public_datasets.py` | Builds features from the public datasets |
| `extract_features.py` | Builds features from your own dataset CSV |
| `merge_app_exports.py` | Adds data exported from the app |
| `train.py` | Trains and tests eye and nail models |
| `train_palm_classifier.py` | Trains the palm check |
| `model_metrics.py` | Calculates the scorecard |
| `evaluate.py` | More detailed evaluation (see section 24.13) |
| `export.py` | Puts models into the app |
| `requirements.txt` | Python packages |
| `tests/test_parity.py` | Checks Python matches the app |
| `tests/fixtures/` | Test data made by the app |
| `artifacts/` | Output: features, models, metrics |
| `data/raw/` | Downloaded datasets |
| `data/app_exports/` | Drop exported files here |

### 14.7 How the pieces connect

```text
 pages/ ──use──► components/ ──use──► utils/
   │
   ├──use──► store/ (Zustand) ── settings saved in localStorage
   ├──use──► db/ (Dexie)      ── history saved in IndexedDB
   └──use──► features/scan/runPipeline
                 │
                 ├──► ml/regionExtractor ──► MediaPipe (main thread)
                 └──► workers/workerClient
                          │  messages
                          ▼
                      workers/pipeline.worker
                          ├──► imageProcessing/*
                          └──► ml/regionAnalyzer ──► ml/models/*

 config/pipeline.json          ◄── read by both ──►  training/common.py
 config/severityThresholds.json
```

---

## Part 15: Code walkthrough: starting up

### 15.1 `index.html`

The page contains almost nothing:

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

React fills the `root` div. There is also a small script in the head, which applies dark mode **before** the page draws, to avoid a white flash:

```js
var s = JSON.parse(localStorage.getItem('hemoscan-settings') || '{}');
var mode = (s.state && s.state.theme) || 'system';
var dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
if (dark) document.documentElement.classList.add('dark');
```

### 15.2 `src/main.tsx`

```tsx
import '@fontsource/noto-sans/400.css';      // fonts are bundled, so they work offline
import './index.css';                        // global styles
import './i18n';                             // sets up translations
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();    // offline support
startSyncListener();        // optional sync (does nothing without a server)
```

The `!` after `getElementById('root')` tells TypeScript "this will exist".

### 15.3 `src/App.tsx`

The route table. Two page frames are used:

- `BareShell` is a full screen with no menu (splash, language, onboarding, consent, camera, processing).
- `AppShell` has navigation: side menu on wide screens, and a bottom bar on phones.

```tsx
<Routes>
  <Route element={<BareShell />}>
    <Route path="/" element={<SplashPage />} />
    ...
  </Route>
  <Route element={<AppShell />}>
    <Route path="/home" element={<HomePage />} />
    ...
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

- The `*` route catches any unknown address.
- `CapturePage` is loaded with `lazy(...)`, so that its code is fetched only when needed. `<Suspense>` shows a spinner meanwhile.

### 15.4 `vite.config.ts`

| Setting | Meaning |
| --- | --- |
| `base: './'` | File links are relative, so the same build works on any host and in Android |
| `alias: { '@': ... }` | `@/` means `src/` |
| `VitePWA({...})` | Creates the offline service worker and install information |
| `globPatterns` | Which file types are stored for offline use, including `.wasm` and `.task` |
| `maximumFileSizeToCacheInBytes` | 30 MB, since OpenCV and MediaPipe files are big |
| `optimizeDeps.include` | Prepares big libraries at startup. Without it, the dev server may find them mid-scan and reload the page. |
| `server.watch.ignored` | Do not watch `android`, `training` or `dist` |
| `worker.format: 'es'` | The worker uses modern modules |
| `test` | Vitest settings: only `src/**/*.test.ts`, in a Node environment |

### 15.5 `scripts/setup-assets.mjs`

Runs after `npm install`.

1. Copies `opencv.js` from `node_modules` to `public/vendor/opencv/`.
2. Copies the MediaPipe program files to `public/mediapipe/wasm/`.
3. Downloads `hand_landmarker.task` and `face_landmarker.task`, but only if they are missing.

If a download fails, it prints a warning and carries on. Region finding will then rely on the simpler heuristics.

### 15.6 `tailwind.config.ts` and `src/index.css`

Colours are defined once as variables in `index.css`:

```css
:root { --primary: 178 58 72; ... }
.dark { --primary: 232 110 124; ... }
```

`tailwind.config.ts` connects those to class names:

```ts
const withVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
colors: { primary: { DEFAULT: withVar('primary') } }
```

So `bg-primary` automatically changes colour in dark mode, and `bg-primary/10` still works.

Text sizes never go below 16 px, and buttons are at least 48 px tall. These choices help low-literacy and older users.

---

## Part 16: Code walkthrough: settings, memory, database, languages

### 16.1 `config/pipeline.json`

**This file is one of the most important in the project.** It holds every tunable number, and it is read by both the TypeScript app and the Python training code. They cannot disagree.

| Section | Controls |
| --- | --- |
| `uncertainty` | Width of the shown range |
| `preprocessing` | Image clean-up values |
| `features` | Histogram bins, glare and shadow limits |
| `quality` | Blur and brightness thresholds |
| `fallback` | When to use the backup model |
| `fusion` | Region weights and penalties |
| `guideBoxes` | Where the on-screen guide is |
| `skinTone` | ITA categories |
| `confounders` | Effect of crying, polish and so on |
| `outOfRange` | "Photo looks different" rule |
| `personalCalibration` | Rules for a person's own correction |
| `deviceLearning` | Rules for the phone-level correction |

**Warning.** Changing `preprocessing` or `features` means the model was trained on different inputs, so you must re-extract features and retrain. Changing weights in `fusion`, or the confounders, does not need retraining.

`pipelineConfig.ts` simply gives typed names to these sections.

### 16.2 `store/settingsStore.ts`

```ts
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({ ...defaults, set: (patch) => set(patch), reset: () => set(defaults) }),
    { name: 'hemoscan-settings', version: 1 },
  ),
);
```

- `persist` saves it to localStorage under the name `hemoscan-settings`.
- Defaults include `voiceEnabled: true`, `voiceRate: 0.9`, `demoMode: false`.

Using it:

```ts
const language = useSettings((s) => s.language);   // in a component
useSettings.getState().language;                   // outside a component
useSettings.getState().set({ language: 'te' });    // change it
```

### 16.3 `store/scanStore.ts`

Holds the current scan: `queue`, `index`, `captures` (the photos), `outcome`, `samples`, `answers` and `conditions`. It has no `persist`, deliberately, so photos exist only in memory.

The key function:

```ts
advance: () => {
  const { index, queue } = get();
  if (index + 1 < queue.length) { set({ index: index + 1 }); return true; }
  return false;
},
```

### 16.4 `db/db.ts`

Declares four tables:

```ts
this.version(1).stores({
  profiles: '++id, name, createdAt',
  scanResults: '++id, profileId, timestamp, severity',
  questionnaireResponses: '++id, scanId, profileId, timestamp',
  contributions: '++id, scanId, uploaded, createdAt',
});
```

`++id` means an automatically increasing id. The other names are **indexes**, fields that can be searched quickly. Other fields can still be stored, without being listed.

| Table | Contents |
| --- | --- |
| `profiles` | Each person: age, sex, pregnancy, location, diet, skin tone, calibrations |
| `scanResults` | Each saved result: value, range, severity, regions, colour measurements, blood test |
| `questionnaireResponses` | Answers to symptom questions |
| `contributions` | Only if the person opts in: small cropped images and features |

### 16.5 `db/repositories.ts`

Groups the database operations.

`scanRepo.setBloodTest` is a good example. It uses a **transaction**, so both changes succeed together or neither does:

```ts
async setBloodTest(scanId, labHb, labDate) {
  await db.transaction('rw', [db.scanResults, db.profiles], async () => {
    const r = await db.scanResults.get(scanId);
    if (!r) return;
    await db.scanResults.update(scanId, { bloodTest: { labHb, labDate, enteredAt: Date.now() } });
    const p = await db.profiles.get(r.profileId);
    if (!p) return;
    const point = { labHb, labDate, estimateHb: r.hbUncalibrated ?? r.hb, scanId, createdAt: Date.now() };
    const others = (p.calibrations ?? []).filter((c) => c.scanId !== scanId);
    await db.profiles.update(r.profileId, { calibrations: [...others, point] });
  });
}
```

It filters out any earlier point for the same scan, so editing replaces rather than doubles. It uses `hbUncalibrated`, the raw estimate, because comparing with an already-corrected value would be circular.

Other useful items:

- `toSubject(profile)` extracts the fields that WHO classification needs.
- `recordToOutcome(record)` turns a saved record back into the shape the results page uses.
- `deleteAllData()` clears all four tables.

### 16.6 `i18n/index.ts`

```ts
void i18n.use(initReactI18next).init({
  resources,
  lng: useSettings.getState().language,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'guidance'],
  interpolation: { escapeValue: false },
});
```

- If a key is missing in a language, English is used.
- It also subscribes to the settings store, so a language change takes effect instantly and sets `<html lang>`.
- `localeTags` maps `en`, `te`, `hi` to `en-IN`, `te-IN`, `hi-IN`, used for speech and dates.

### 16.7 `config/locations.ts`

- `COUNTRY_CODES`: country codes. Names are produced by the browser in the user's language.
- `INDIAN_STATES`: states and union territories.
- `HILL_STATES`: places where the form asks about altitude. Ladakh has a default of 3,500 m.

---

## Part 17: Code walkthrough: image processing

### 17.1 `imageProcessing/types.ts`

```ts
export interface RGBAImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}
```

`data` is one long list: R, G, B, A, R, G, B, A, and so on. To find a pixel at column `x` and row `y`:

```ts
const i = (y * width + x) * 4;
const red = data[i];
const green = data[i + 1];
const blue = data[i + 2];
```

You will see that `(y * w + x) * 4` throughout the code. `Uint8ClampedArray` automatically keeps values within 0 to 255.

`ImageOps` is an **interface**, a promise of four operations: `laplacianVariance`, `grayWorld`, `claheOnL`, `gaussianDenoise`. Two classes fulfil it:

- `OpenCvOps`: fast, using WebAssembly. The default.
- `JsOps`: plain TypeScript. Used in tests, and as a backup if OpenCV.js fails to load.

The rest of the code does not care which it receives. This design is called **abstraction**.

### 17.2 `colorSpace.ts`

Converts colours with the same formulas as OpenCV, so that training features match the app.

```ts
const GAMMA_LUT = new Float32Array(256);
for (let i = 0; i < 256; i++) GAMMA_LUT[i] = srgbToLinear(i / 255);
```

**LUT** means lookup table. There are only 256 possible values, so results are computed once and reused. It is much faster for millions of pixels.

### 17.3 `colorFeatures.ts`

The core loop goes through every pixel:

```ts
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const y = luma(r, g, b);
  if (y > GLARE_LUMA || y < SHADOW_LUMA) continue;   // skip glare and shadow
  const [h, s, v] = rgbToHsv(r, g, b);
  const [L, a, bb] = rgbToLab(r, g, b);
  const ch = [r / 255, g / 255, b / 255, h, s, v, L / 100, a / 128, bb / 128];
  for (let k = 0; k < 9; k++) {
    acc[k] += ch[k];            // running sum
    acc[9 + k] += ch[k] * ch[k]; // running sum of squares
  }
  ...
}
```

Standard deviation is then found from those two sums:

```ts
const mean = acc[k] / n;
const std = Math.sqrt(Math.max(0, acc[9 + k] / n - mean * mean));
```

`bb` is Lab's `b`, named differently so that it is not confused with blue.

**Example from the real function.** With a two-pixel image of (200, 100, 100) and (180, 120, 110):

| Feature | Value |
| --- | --- |
| `r_mean` | 0.7451 (that is, 190 / 255) |
| `g_mean` | 0.4314 (110 / 255) |
| `rg_ratio` | 1.7273 (380 / 220) |
| `a_mean` | 0.2419 |
| `erythema_index` | 0.2369 |

### 17.4 `qualityChecker.ts`

`check` collects reasons into two groups: `fails` and `warns`.

| Check | Fail | Warn (borderline) |
| --- | --- | --- |
| Size | Shortest side under 96 | |
| Sharpness | Under 60 | Under 140 |
| Average brightness | Under 55 or over 215 | Under 80 or over 195 |
| Clipped pixels | Over 25% too bright or too dark | Over 8% in total |

A score from 0 to 1 is then combined:

```ts
const score = 0.5 * blurScore + 0.3 * brightnessScore + 0.2 * clipScore;
```

Any fail gives status `fail`. Any warning, or a score under 0.7, gives `borderline`. Otherwise `pass`. "Borderline" photos are used, but with the backup model, and they count for less.

### 17.5 `preprocessor.ts`

```ts
process(img, opts = {}) {
  const balanced = this.ops.grayWorld(img, this.cfg.maxWhiteBalanceGain);
  const contrasted = this.ops.claheOnL(balanced, this.cfg.claheClipLimit, this.cfg.claheTileGrid);
  const noiseSigma = estimateNoiseSigma(contrasted);
  const denoise = noiseSigma >= this.cfg.denoiseNoiseThreshold && noiseSigma < this.cfg.denoiseMaxNoise;
  let image = denoise ? this.ops.gaussianDenoise(contrasted) : contrasted;
  const sharpen = !!opts.sharpen && !denoise;
  if (sharpen) image = unsharpMask(image, this.cfg.unsharpAmount, this.cfg.unsharpSigma);
  return { image, noiseSigma, denoised: denoise, sharpened: sharpen };
}
```

Exactly the sequence from Part 11. It never both denoises and sharpens, since they work against each other.

### 17.6 `opencvOps.ts`

OpenCV.js allocates memory that JavaScript cannot clean up automatically. Each `new cv.Mat()` must be freed with `.delete()`. That is why every function has `try { ... } finally { ...delete() }`. Without it, the app would slowly run out of memory.

### 17.7 `loadOpenCv.ts`

There is an unusual trick here. OpenCV's module object has a `.then` method, so `await` treats it as a promise that resolves to itself, and loops forever. The fix removes `then` before resolving:

```ts
if (m && typeof m.then === 'function') delete m.then;
```

Also, `(0, eval)(code)` runs the fetched library in global scope, because module workers cannot use the older `importScripts`.

### 17.8 `roiHeuristics.ts`, `conjunctiva.ts`, `skinTone.ts`, `confounderDetection.ts`

These implement the techniques from Part 11 directly. Their numeric thresholds are at the top of each file or in `pipeline.json`.

---

## Part 18: Code walkthrough: estimating and the worker

### 18.1 `ml/types.ts`

Defines the vocabulary shared by everything:

```ts
export type Region = 'eye' | 'nails' | 'palm';
export type Severity = 'normal' | 'mild' | 'moderate' | 'severe';
```

`RegionEstimate` is the result for one region. `ScanOutcome` is the final result. Reading these two types is the fastest way to understand what data flows through the app.

### 18.2 `ml/modelProvider.ts`

Defines the `ModelProvider` interface, and how inputs are arranged.

```ts
export function buildXgbInput(cnn, color, region, demo) {
  return [...(cnn ? Array.from(cnn) : []), ...color, ...regionOneHot(region), ...(demo ?? [])];
}

export function demographicFeatures(subject) {
  if (!subject) return [30, 0.5];
  return [subject.ageYears, subject.sex === 'male' ? 1 : subject.sex === 'female' ? 0 : 0.5];
}
```

**The order of the numbers is critical.** The model only knows positions. If you put age where it expects redness, it gives nonsense without any error.

### 18.3 `ml/realModelProvider.ts`

Imports the generated files and wraps them.

- `regions`: which regions are available. Currently `eye`, `nails`, and `palm`.
- `likelihoodRegions`: `palm`, meaning classifier only.
- `init()`: reads `model-info.json`, works out each model's training age range, and skips TensorFlow.js because `USES_CNN` is false.
- `predictXgboost`: refuses input of the wrong length.
- `featuresOutOfRange`: compares colours with the recorded training ranges.
- `predictAnemiaProbability`: runs the palm classifier.

### 18.4 `ml/mockModelProvider.ts`

A simple formula that turns redness into a fake hemoglobin. **It is not a trained model.** It is reachable only if a developer sets `VITE_USE_MOCK_MODELS=true`. Normal builds never use it.

### 18.5 `ml/regionExtractor.ts`

Loads MediaPipe once, then turns landmarks into boxes, as in Part 11.

The eye box:

```ts
const xs = corners.map((i) => lm[i].x * w);
const eyeW = Math.abs(xs[0] - xs[1]);
const lidY = Math.max(...lowerLid.map((i) => lm[i].y * h));
return { x: Math.min(...xs), y: lidY - eyeW * 0.04, width: eyeW, height: eyeW * 0.28 };
```

Landmark positions are fractions, so they are multiplied by width and height. In the image, y grows downward, so `Math.max` finds the lowest point of the lid.

```ts
async detect(region, source, img) {
  await this.init();
  const det = this.detectLandmarks(region, source, img.width, img.height) ?? heuristicDetection(region, img);
  if (det && region === 'eye') det.boxes = pickPulledEye(img, det.boxes);
  return det;
}
```

The `??` means: try landmarks, and if that gives nothing, try heuristics.

### 18.6 `ml/regionAnalyzer.ts`

`analyzeRegion` handles one region:

1. Builds the ROI mosaic.
2. Extracts colour features. For the real eye model, sclera pixels are removed first.
3. If the region is classifier-only (palm), returns a probability with `hb: NaN`. **NaN** means "not a number", a deliberate sign that no value exists.
4. Asks `FallbackDecider` whether to skip XGBoost.
5. Runs XGBoost.
6. Asks the decider again, now with XGBoost's output.
7. Uses XGBoost, or the Random Forest.
8. Checks for out-of-range colours.

### 18.7 `ml/fallbackDecider.ts`

Has two steps, since some reasons are known before running the model:

```ts
shouldSkipXgboost(input) { return this.preReasons(input).length > 0; }

decide(input) {
  const reasons = this.preReasons(input);
  if (input.xgb) {
    if (!Number.isFinite(xgb.hb) || xgb.hb < min || xgb.hb > max) reasons.push('implausibleValue');
    if (xgb.upper - xgb.lower > maxWidth) reasons.push('wideInterval');
  }
  ...
  return { model: reasons.length ? 'randomForest' : 'xgboost', reasons };
}
```

### 18.8 `ml/fusion.ts`

Implements the maths from section 12.14. Key parts:

```ts
const usable = weighted.filter((e) => e.weight > 1e-6);
const allRegionsAffected = usable.length === 0;
const pool = allRegionsAffected ? weighted.map((e) => ({ ...e, weight: 1 })) : usable;
const hb = pool.reduce((s, e) => s + e.hb * e.weight, 0) / sumW;
```

The range is stretched so that it covers every region's estimate:

```ts
if (pool.length > 1) half = Math.max(half, spread / 2);
half = Math.min(u.maxHalfWidth, Math.max(u.minHalfWidth, half));
```

The app never claims better than ±0.6 g/dL, since photo methods cannot be that precise.

There are two related numbers per region. `trust` measures how usable it is, and drives the confidence label. `weight` also includes the inverse-variance factor, and only decides the mix.

### 18.9 `ml/severityClassifier.ts`

```ts
selectGroup(subject) {
  if (pregnant && sex === 'female') { /* the pregnancy group has priority */ }
  const match = entries.find(([, g]) =>
    !g.pregnant && ageYears >= g.minAge && ageYears < g.maxAge && (g.sex === undefined || g.sex === sex));
}

static bandFor(hb, g) {
  const v = Math.round(hb * 10) / 10;
  if (v >= g.normal) return 'normal';
  if (v >= g.mild) return 'mild';
  if (v >= g.moderate) return 'moderate';
  return 'severe';
}
```

Rounding comes first, so 12.96 becomes 13.0 and counts as normal for a man.

### 18.10 `ml/altitude.ts` and `ml/confounders.ts`

`altitudeAdjustment` finds the highest band reached.

`confounderFactor` multiplies the applicable factors:

```ts
let f = 1;
for (const c of new Set(conditions)) if (c in reported) f *= reported[c];
for (const fl of new Set(flags)) if (fl in image) f *= image[fl];
```

A `Set` removes duplicates.

### 18.11 `ml/personalCalibration.ts` and `ml/deviceLearning.ts`

These implement sections 12.15 and 12.16. Key function in device learning:

```ts
function fitRaw(pairs) {
  const center = mean of estimates;
  const res = pairs.map((p) => p.labHb - p.estimate);
  const a = clamp((meanRes * n) / (n + c.shrinkK), c.maxOffset);
  // slope: sum of (x - center)(res - meanRes) / (sum of (x - center)² + slopeRidge)
  const slope = clamp(sxy / (sxx + c.slopeRidge), c.maxSlope);
  return { a, c: slope, center };
}
```

`fitDeviceModel` then runs the leave-one-person-out loop, and only sets `active` when error falls by at least `minImprovement`.

### 18.12 The worker: three files

**`workers/protocol.ts`** defines the messages. **`workers/workerClient.ts`** is the main-thread side:

```ts
private call(req, transfer = []) {
  const w = this.ensureWorker();
  const id = ++this.seq;
  return new Promise((resolve, reject) => {
    this.pending.set(id, { resolve, reject });
    w.postMessage({ ...req, id }, transfer);
  });
}
```

Worker messages are one-way, so each request gets an id, and its promise is stored. When a reply arrives with that id, the matching promise is resolved. To the caller, it looks like a normal `await`.

`transfer` passes ownership of a large memory block to the worker without copying, which is much faster. After transfer, the sender can no longer use it. That is why `runPipeline` uses `cloneImage` first.

**`workers/pipeline.worker.ts`** is the other side:

```ts
self.onmessage = async (ev) => {
  const { id, ...req } = ev.data;
  switch (req.type) {
    case 'init': ...
    case 'quality': ...
    case 'prepare': ...
    case 'analyze': ...
  }
};
```

It tries to load OpenCV.js and falls back to `JsOps`. If the trained models fail to load, it reports an error, and the Processing screen shows **Try again**. It never substitutes a stand-in number.

### 18.13 `features/scan/runPipeline.ts`

This coordinates section 13.4 and 13.5. Things to notice:

```ts
const dm = !po && opts.deviceModel?.active && init.modelSource === 'real' && !opts.isDemo ? opts.deviceModel : null;
const dc = dm ? { offset: correctionFor(dm, fusedRaw.hb), pairs: dm.pairs } : undefined;
const shift = po ? po.offset : (dc?.offset ?? 0);
```

The person's own correction takes priority, otherwise the phone-level one applies. `fusedRaw` is kept separately and saved as `hbUncalibrated`, so that calibration never learns from corrected numbers.

The `emit('quality')` calls drive the step list on the processing screen.

The return type is a **discriminated union**: either `{ kind: 'ok', ... }` or `{ kind: 'retake', ... }`. Checking `kind` tells TypeScript which shape it has.

---

## Part 19: Code walkthrough: features, guidance, utilities

### 19.1 `features/scan/useCaptureFlow.ts`

Used by the camera, upload and sample paths. After a quick check:

```ts
const { queue, captures } = useScanSession.getState();
const next = queue.findIndex((r) => !captures[r]);
if (next >= 0) {
  useScanSession.setState({ index: next });
  navigate('/scan/method', { replace: true });
} else {
  navigate('/scan/processing', { replace: true });
}
```

It looks for the next region that still has no photo, which also handles retakes from the middle.

`pickImage` uses Android's photo picker in the APK, and a hidden `<input type="file">` in a browser.

`replace: true` swaps the history entry, so the Back button does not return to a finished step.

### 19.2 `features/scan/saveScan.ts`

Saves only once, using `savedScanId` to remember. It stores colour numbers and a snapshot of the person. If the person opted in to **Contribute anonymous data**, it also stores small cropped images and features.

### 19.3 `features/camera/useCamera.ts`

```ts
const stream = await navigator.mediaDevices.getUserMedia({
  audio: false,
  video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
});
```

- `facingMode: environment` means the rear camera.
- It first checks `window.isSecureContext`. Without HTTPS or localhost, the camera is blocked.
- It turns on the torch where possible, for consistent light.
- Its cleanup stops the camera when leaving the screen.
- `capture()` draws a frame on a canvas and saves it as a JPEG.

### 19.4 `features/camera/useLiveQuality.ts`

Every 450 ms it draws a 240-pixel frame and runs a looser quality check. Position is checked every second tick, because it is more expensive.

### 19.5 `features/voice/`

**`useVoice.ts`** has two paths:

- **APK:** `TextToSpeech.speak(...)` through the Capacitor plugin.
- **Browser:** the Web Speech API.

Chrome has several quirks, each handled explicitly:

| Quirk | Handling |
| --- | --- |
| Voices load late | `loadVoices` waits for `voiceschanged`, up to 1.5 seconds |
| `cancel()` immediately before `speak()` drops the sentence | Cancels only if speaking, then waits 80 ms |
| Speech gets stuck in a paused state | Calls `resume()` |
| Long speech cut off as memory is cleaned | Keeps each utterance in the `liveUtterances` set until it ends |
| No voice for this language | Speaks the English version instead |

**`speechText.ts`** rewrites text so it is pronounced well: numbers become words in Hindi and Telugu, `g/dL` is spelled out, `HemoScan` is split, and dashes become pauses. `fixForVoice` handles words a specific voice gets wrong.

**`voiceSelect.ts`** scores voices. Natural and neural voices score highest, then Google voices, and novelty voices are excluded. Voices needing internet are skipped when offline.

### 19.6 `features/report/pdfReport.ts`

`renderReportCanvas` draws an A4 page (1240 by 1754 pixels) onto a canvas: header, person, value, severity, regions, adjustments, advice. `buildReportPdf` puts that picture into a PDF. `shareOrDownloadFile` then sends it to the share sheet or downloads it.

### 19.7 `features/learning/`

**`learningData.ts`:**

```ts
export const isLearningScan = (r) => !!r.bloodTest && r.modelSource === 'real' && !r.isDemo;
```

**`learningExport.ts`** builds the anonymous file. People are numbered `p1`, `p2`, only within that file. It includes colour measurements, lab value, age, sex, state, skin-tone category, and the browser's device string. It contains no names or photos.

### 19.8 `features/sync/syncService.ts`

An outline for a future server. It does nothing unless **all** of these are true: sync is on, a server address is configured, and the device is online. No server exists in this project.

### 19.9 `guidance/guidanceEngine.ts`

Plain rules. No text is written here, only keys.

| Severity | Starting referral |
| --- | --- |
| Normal | `none` |
| Mild | `routine` |
| Moderate | `soon` |
| Severe | `urgent` |

Referral is raised to at least `soon` for pregnancy or recent blood loss. Causes begin with iron deficiency, the commonest cause in India, and recent blood loss jumps to the front. `new Set(...)` removes duplicates.

### 19.10 `utils/`

- `cn(...)` joins class names, skipping empty ones: `cn('a', false && 'b', 'c')` gives `'a c'`.
- `judgedHb` returns the value compared with cutoffs (after altitude), which is what gets displayed.
- `decodeImage` shrinks a photo to the working size and respects its rotation.
- `assetUrl` finds a file inside `public/`, relative to the page.
- `useThemeSync` adds or removes the `dark` class on `<html>`.
- `cssVarColor` reads a colour variable, as charts need real colours.
- `shareFile.ts` chooses between the Android share sheet, web sharing and a plain download.

---

## Part 20: Code walkthrough: screens and tests

### 20.1 Common pattern

Nearly every page has this form:

```tsx
export function SomePage() {
  const { t } = useTranslation();          // text
  const navigate = useNavigate();          // moving
  const { active } = useProfiles();        // data
  const [x, setX] = useState(...);         // local state

  if (!data) return <Navigate to="/home" replace />;   // guard

  return (
    <div>
      <PageHeader title={t('...')} />
      ...
    </div>
  );
}
```

The **guard** handles a screen being opened directly with no scan in progress.

### 20.2 Setup pages

**`SplashPage`** waits 1.8 seconds, and then goes to the first unfinished step:

```ts
if (!s.languageChosen) navigate('/language', { replace: true });
else if (!s.onboardingDone) navigate('/onboarding', { replace: true });
else if (!s.consentGiven) navigate('/consent', { replace: true });
else if (count === 0) navigate('/profile/new', { replace: true });
else navigate('/home', { replace: true });
```

**`LanguagePage`**: three big cards, each in its own script.

**`OnboardingPage`**: three steps that can be swiped, clicked, or moved with the arrow keys.

**`ConsentPage`**: the agree button stays disabled until the box is ticked.

**`ProfileFormPage`**: a lot of `useState`, one for each field. Smart details:

- Months only appear if age is under 5.
- Pregnancy only appears for females aged 10 to 55.
- Only age and sex are required.
- When editing, an effect loads the person's data into the fields.

**`ProfilesPage`**: switch or edit people. One phone can hold a whole family or health camp.

### 20.3 `HomePage`

Shows a greeting based on the time, a profile switcher, the big Start Scan card, the last result, a small trend chart, and quick links. Data comes from `useLiveQuery`, so it updates automatically.

### 20.4 Scan pages

**`RegionSelectPage`**: a palm-only scan is disabled, since the palm cannot give a number by itself:

```ts
const selectable = (c) => c === 'all' || (supported.includes(c) && !likelihoodRegions.includes(c));
```

**`InputMethodPage`**: instruction, checklist, Camera and Upload buttons, and samples if demo mode is on.

**`CapturePage`**: full-screen video with `GuideOverlay`, an SVG with a darkened mask and a cut-out in the shape of the area. The shape is defined by the same `guideBoxes` used by the heuristics.

**`RetakePage`**: shows the reason and the tips.

**`ProcessingPage`**: runs the pipeline. A `useRef` flag makes sure it runs just once:

```ts
const started = useRef(false);
useEffect(() => {
  if (!active || started.current || !queue.length) return;
  started.current = true;
  ...
```

### 20.5 `ResultsPage`

It serves two addresses. With an `id` in the URL it loads a saved record, otherwise it uses the current scan:

```ts
const outcome = historyId ? (record ? recordToOutcome(record) : null) : session.outcome;
```

Sections:

- `HbGauge`, severity, likely range, healthy range.
- Notes: range crosses a boundary, palm disagrees, above normal, altitude.
- Confidence badge, fallback note, and an urgent message if severe.
- `AdjustmentsCard`.
- Region breakdown.
- Buttons: **Why might this be happening?**, **What should I do?**, **Save**, and the share button for the PDF report.
- `CalibrationCard`, `ModelInfoNote`, `Disclaimer`.

The `?bloodtest=1` address scrolls to the entry box and focuses it.

### 20.6 `CalibrationCard`

Hidden for demo scans and non-real models:

```ts
if (outcome.isDemo || outcome.modelSource !== 'real' || !profile.id) return null;
```

`submit` validates through `isValidCalibration`: Hb between 3 and 22, and within 7 days of the scan. `ensureSaved` saves the scan first if needed.

### 20.7 `QuestionnairePage` and `GuidancePage`

The questionnaire adapts to the person, and pre-fills pregnancy and diet from the profile. Guidance builds a plan with `guidanceEngine.build` and displays it in order, with referral first.

### 20.8 `HistoryPage`

The chart and a list. Each eligible scan has an **Add blood test result** button:

```tsx
{s.modelSource === 'real' && !s.isDemo && !s.bloodTest && (
  <button onClick={() => navigate(`/history/${s.id}?bloodtest=1`)}>...</button>
)}
```

### 20.9 `SettingsPage`

Has language, theme, voice test, voice choice, speed, profiles, demo mode, privacy options, learning card, model information, performance card, and delete all data.

### 20.10 Charts and the gauge

**`HbGauge`** draws arcs in SVG. `toDeg` maps a value from 4 to 18 onto a 270-degree sweep. Framer Motion animates the fill and the number.

**`ModelPerformanceCard`** reads `info.evaluation` from `model-info.json`. It shows the selected group as a Recharts bar chart, and all groups in a table. **The figures are not typed by hand.** They come from `training/model_metrics.py` through `export.py`.

### 20.11 Accessibility features to notice

| Code | Purpose |
| --- | --- |
| `aria-label` | Spoken name for an icon button |
| `role="alert"` | Announced immediately by screen readers |
| `aria-live="polite"` | Announces changes when convenient |
| `aria-hidden` | Hides decorative items from screen readers |
| `sr-only` | Visible only to screen readers |
| `min-h-touch` | Large touch targets |
| A dot on `SeverityChip` | Meaning is not carried by colour alone |

### 20.12 The tests

| File | What it protects |
| --- | --- |
| `severityClassifier.test.ts` | WHO groups and bands, including boundary values |
| `fallbackDecider.test.ts` | Each trigger, including exact limits |
| `fusion.test.ts` | Weighting and reliability |
| `range.test.ts` | Range width rules and displayed values |
| `adjustments.test.ts` | Altitude, skin tone, confounders |
| `calibration.test.ts` | Personal correction, out-of-range |
| `deviceLearning.test.ts` | Learns only when justified |
| `palmCheck.test.ts` | Palm gives a probability and no number |
| `qualityChecker.test.ts` | Blurry, dark, bright, small |
| `guidanceEngine.test.ts` | Advice rules, and text exists in all languages |
| `voice.test.ts` | Pronunciation and voice choice |
| `i18n.test.ts` | All languages have the same keys |

`src/test/syntheticImages.ts` draws fake images, for example a checkerboard for "sharp". It uses a fixed random seed so results are repeatable.

---

## Part 21: Retraining the models

### 21.1 The whole process

```text
 Raw datasets
      │  prepare_public_datasets.py      (or extract_features.py for your own data)
      ▼
 artifacts/features.npz                  55 colour features + answers
      │  (optional) merge_app_exports.py
      │  train.py
      ▼
 xgb_*.json, rf.joblib, calibration.json, oof_predictions.csv
      │  model_metrics.py
      ▼
 metrics.json
      │  export.py
      ▼
 src/ml/models/*.ts + public/models/model-info.json
      │  npm test, npm run build
      ▼
 New app
```

### 21.2 Shortcut: retrain without downloading anything

If your copy has `training/artifacts/features.npz`, the feature step is already done. Activate the virtual environment (section 5.14), and then, inside `training/`:

```bash
python train.py
python model_metrics.py
python export.py --skip-cnn --palm --version 2026.11-a
```

In testing, `train.py` took under a minute.

Then from the project folder:

```bash
npm test
npm run build
```

**What the flags mean:**

| Flag | Meaning |
| --- | --- |
| `--skip-cnn` | Do not export a CNN. The current models do not use one. |
| `--palm` | Also export the palm classifier |
| `--version` | Name for this model version |
| `--dry-run` | Write to a temporary folder instead of the app. Good for a safe trial. |

### 21.3 Full retrain from raw data

**Step 1. Get the datasets**, and create this layout inside `training/data/raw/`:

```text
training/data/raw/
├── conjunctiva/
│   ├── Anemia_Data_Collection_Sheet.xlsx
│   ├── Anemic/
│   └── Non-anemic/
├── palm/
│   └── Palm/
└── skin_nails/
    ├── metadata.csv
    └── photo/
```

| Dataset | Where |
| --- | --- |
| CP-AnemiC eye photos | <https://doi.org/10.17632/m53vz6b7fx.1> (or the direct link in `training/README.md`) |
| Ghana palm photos | <https://doi.org/10.17632/ccr8cm22vz.1> |
| Moscow skin and nails | <https://doi.org/10.6084/m9.figshare.c.6760179> |

Download them **in a browser**. The Moscow file refused a scripted download during testing (error 403), so the `curl` line in `training/README.md` may not work for that one.

Extract `.rar` files with `bsdtar` on a Mac, or 7-Zip on Windows.

**Step 2. Get the Indian and Italian eye data** from Kaggle. Inside the virtual environment:

```bash
python -c "import kagglehub; print(kagglehub.dataset_download('harshwardhanfartale/eyes-defy-anemia'))"
```

This is stored in a cache folder in your home directory, and the script looks there automatically. If you place it elsewhere, pass `--eyes-defy "path/to/dataset anemia"`.

**Step 3. Build features:**

```bash
python prepare_public_datasets.py
```

Expected:

```text
  eye (Ghana children): 710 used
  eye (Eyes-defy-anemia adults): 214 used — India 94, Italy 120
  nails: 195 used, 55 failed the quality gate; ROI method: {'annotated': 195}
```

`libpng warning: iCCP: CRC error` lines are harmless.

**Step 4. Train the palm classifier:**

```bash
python train_palm_classifier.py
```

Expected: `AUC 0.847 | threshold 0.61 → sensitivity 0.79, specificity 0.78`.

**Step 5.** Continue as in section 21.2.

### 21.4 Reading the code: `common.py`

Reads `pipeline.json` and `severityThresholds.json` from the app folder. It contains Python versions of the colour code, the ROI mosaic and the WHO logic, written to match the TypeScript exactly. Small details are copied too, like JavaScript's rounding:

```python
def js_round(x: float) -> int:
    """JavaScript Math.round (half away from zero for positives)."""
    return int(math.floor(x + 0.5))
```

`ARTIFACTS` is the output folder. Setting the environment variable `HEMOSCAN_ARTIFACTS` sends outputs elsewhere, which is useful for experiments.

### 21.5 Reading the code: `preprocess.py` and `roi.py`

Python versions of the app's image clean-up and region finding. Note that `cv2.imread` gives BGR, so `load_rgb` converts it to RGB.

### 21.6 Reading the code: `prepare_public_datasets.py`

Three functions gather the rows:

- `eye_rows`: reads the Excel sheet, opens each transparent PNG, and keeps only pixels that are opaque (the mask), then removes sclera.
- `eyes_defy_rows`: the same for adults. Rows marked "ELIMINATO" (removed) by the authors are skipped.
- `nail_rows`: fits the photo to 640 px, judges quality on the hand area only, preprocesses, and uses the experts' nail boxes.

**Note on the nail data:** the Moscow dataset gives no per-person age or sex that is used, so all rows have `age=56.0` and `sex="unknown"`.

It writes `features.npz`, and `datasets.json`, which is the list of sources shown in the app.

### 21.7 Reading the code: `train.py`

```python
XGB_PARAMS = dict(n_estimators=600, max_depth=6, learning_rate=0.03, subsample=0.8,
                  colsample_bytree=0.4, min_child_weight=3, reg_lambda=1.0,
                  tree_method="hist", objective="reg:quantileerror")
```

The steps in `main()`:

1. Load features. XGBoost input is colour + one-hot + age and sex. Random Forest input is colour + one-hot.
2. Give Indian samples a weight of 3, so errors on them matter more.
3. For each of 5 folds, train 3 XGBoost models and a Random Forest on 4 parts, then predict the fifth.
4. Apply the same fallback rules as the phone, and store what the phone would show in `pred`.
5. Print a report by dataset and region, including a baseline that always guesses the average.
6. Compute conformal offsets, and write `calibration.json`.
7. Refit all models on **all** the data for the final version.

**Why refit on everything?** The cross-validation folds exist only to measure quality. The final model should learn from every available example.

Results differ very slightly from run to run in the last decimal places, because of parallel processing. The reported figures stay the same at the precision shown.

### 21.8 Reading the code: `model_metrics.py`

Reads `oof_predictions.csv`, and computes the scorecard for the overall group, eye, nails and Indian adults. Those are saved in `metrics.json`, which `export.py` copies into `model-info.json`, where the Settings chart reads them.

A person whose sex is unknown is compared against the women's cutoff.

### 21.9 Reading the code: `export.py`

| Function | Job |
| --- | --- |
| `m2cgen_js` | Converts a model with m2cgen |
| `xgb_dump_to_js` | The built-in translator |
| `verify_js` | Runs the code in Node and compares with Python |
| `export_trees` | Writes the XGBoost and Random Forest files and `model-info.json` |
| `export_palm` | Writes the palm classifier |
| `export_cnn` | For a future CNN |

The `predict` function placed in the app widens the range by the conformal offset:

```js
return { hb, lower: Math.min(a, b, hb) - cal, upper: Math.max(a, b, hb) + cal };
```

`Math.fround` is applied to the inputs because XGBoost compares 32-bit numbers. Without it, a value extremely near a split could go the wrong way.

### 21.10 Adding your own data

**Best option: use the app.** Part 24 explains this cycle in depth.

1. Scan people on real phones.
2. Enter each person's CBC value.
3. In **Settings**, press **Export learning data** on each phone.
4. Put the files into `training/data/app_exports/`.
5. Run:

```bash
python merge_app_exports.py
python train.py --features artifacts/features_with_app.npz
python model_metrics.py
python export.py --skip-cnn --palm --version 2026.12-app
```

The merge script keeps only eye and nail samples, within 7 days, with a plausible value, and removes duplicates. These samples are named "HemoScan app users (India)", so they get the Indian weight.

**Alternative: a CSV of images.** `extract_features.py`, described in `training/README.md`, builds features from your own photos using MediaPipe. This route was **not** run for this guide, and it needs care: with `--no-cnn` it leaves 576 empty columns in the features, which do not match the app's 60-number colour-only input (see section 24.13). Prefer the app export route above.

**Always** get consent and ethics approval before collecting health data from people. Never put identifiable photos or reports in the project.

### 21.11 Parity tests

`tests/test_parity.py` loads test data made by the app's TypeScript and confirms Python gives the same colour features, ROI pixels and detection boxes.

If you change feature code, regenerate the data on a computer with Python and the Pillow package:

```bash
npm run parity:fixtures
```

Then update both languages until the tests pass.

### 21.12 Choosing settings correctly

If you try many settings and report the best score on the same data, the score is misleading. To reduce this, test on several different person splits and compare averages, which is how the depth-6 setting was chosen.

Never remove difficult people from the test set, or test on people the model trained on. Those make the number look better and make the product worse.

---

## Part 22: Common changes, step by step

### 22.1 Change some on-screen text

1. Open `src/i18n/locales/en/common.json`, or `guidance.json` for health advice.
2. Find the sentence with VS Code's search (Ctrl + Shift + F).
3. Edit it, and edit the same key in `te` and `hi`.
4. Save. The browser updates.

Keep `{{placeholders}}` exactly as they are.

### 22.2 Change the brand colour

Edit `--primary` in `src/index.css`, for both `:root` and `.dark`. Values are three numbers, R G B. Also update `theme_color` in `vite.config.ts`, `severityHex` and the colours in `pdfReport.ts` if you want them to match.

### 22.3 Change a threshold or weight

Open `src/config/pipeline.json`, change the value, and then run `npm test`. Some tests intentionally lock certain values, so if you changed a rule on purpose, update the test too.

Remember: `preprocessing` and `features` need retraining.

### 22.4 Update WHO cutoffs

Edit `src/config/severityThresholds.json`. Update the source note, then `npm test`.

### 22.5 Add a new screen

1. Create `src/pages/MyPage.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/PageHeader';

export function MyPage() {
  const { t } = useTranslation();
  return <PageHeader title={t('my.title')} back />;
}
```

2. Add the text to all three `common.json` files.
3. In `src/App.tsx`, import it and add `<Route path="/my" element={<MyPage />} />`.
4. To open it from somewhere: `navigate('/my')`.

### 22.6 Add a language, for example Tamil

1. Add `'ta'` to the `Language` type in `store/settingsStore.ts`.
2. Add an entry in `config/languages.ts`.
3. Create `locales/ta/common.json` and `guidance.json`, with all the keys.
4. Import them in `i18n/index.ts`, and add `ta: 'ta-IN'` to `localeTags`.
5. Add `ta` to `localeTags` in `features/voice/voiceSelect.ts`.
6. Add `UNIT`, `BRAND`, `HB`, `TO`, and optionally a word list, in `features/voice/speechText.ts`.
7. Add a date tag in `utils/profileText.ts`.
8. Add a font such as `@fontsource/noto-sans-tamil`, import it in `main.tsx`, and add it to `tailwind.config.ts`.
9. Add tests in `i18n.test.ts`.

### 22.7 Change the app version

Update `version` in `package.json`, `appVersion` in `config/appConfig.ts`, and `versionCode` and `versionName` in `android/app/build.gradle`. For Android updates, `versionCode` must increase every time.

### 22.8 Change the app name or icon

- Name: `capacitor.config.ts`, `android/app/src/main/res/values/strings.xml`, and `vite.config.ts`.
- Icons: edit and run `scripts/generate_icons.py` and `npm run icons:android`, which require Python with Pillow.

### 22.9 Replace the sample images

Put new images into `public/demo/`, with the same names, such as `healthy_eye.jpg`. Use only photos that you are allowed to reuse, and never identifiable patient photos.

### 22.10 Update the phone after any change

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug      # on Windows: .\gradlew.bat assembleDebug
cd ..
```

---

## Part 23: When something goes wrong

### 23.1 How to approach any error

1. Read the **first** error line, not just the last.
2. Note which command caused it.
3. Search the exact message with your favourite search engine.
4. Change one thing at a time.

### 23.2 Installing and running

| Problem | Cause | Fix |
| --- | --- | --- |
| `node` or `npm` not recognized | Not installed, or terminal is old | Reinstall Node, open a new terminal, or restart |
| `running scripts is disabled` | Windows PowerShell policy | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `ENOENT ... package.json` | You are in the wrong folder | `cd` to the folder with `package.json` |
| `could not download hand_landmarker.task` | No internet during install | Connect, then `npm run setup-assets` |
| Many `deprecated` warnings | Normal | Ignore |
| `vulnerabilities` | npm's automated report | Ignore. Do not use `npm audit fix --force`. |
| npm install fails strangely | Corrupted download | Delete `node_modules`, then run `npm install` again |
| `Port 5173 is in use` | Another copy is running | Vite will offer another port, or close the old terminal |
| Blank white page | Error during startup | Press F12, open Console, and read the red message |
| Old version keeps showing | Browser cache | Ctrl + Shift + R (Command + Shift + R on Mac) |
| Page reloads during a scan | Dev server found a new package | Run the scan again. Add the package to `optimizeDeps.include`. |

### 23.3 Camera and voice

| Problem | Cause | Fix |
| --- | --- | --- |
| Camera error on phone via IP | Needs HTTPS or localhost | Use the APK, a hosted HTTPS version, or Upload |
| Permission denied | Blocked in browser | Click the lock icon in the address bar and allow the camera |
| Capture button stays grey | Focus, lighting or position is not OK | Follow the on-screen hint |
| No sound | System volume, or tab muted | Check volume. Use **Settings**, **Test voice**, and read the status message. |
| Pronunciation could be clearer | The device's voice | Try other voices in Settings, set speed to Slow, or use Edge or Android |

### 23.4 Scans

| Problem | Cause | Fix |
| --- | --- | --- |
| "Blurry" | Sharpness under 60 | Hold still, get closer to the light |
| "We couldn't find the area" | Region not visible | Fill the guide with the area |
| Results keep changing | Light, angle and camera settings differ | Same place, same light, pull the eyelid fully |
| Low confidence | Regions disagree, or poor photo | Rescan in better light |
| "We could not analyse these photos" | Models failed to load, or an error during analysis | See Console (F12), then rebuild |
| Blood test button missing | A sample image or an old test scan | Do a new real-photo scan |
| "must be within 7 days" | Test date too far from the scan | Enter the correct date, or scan again |

### 23.5 Android

| Problem | Cause | Fix |
| --- | --- | --- |
| `SDK location not found` | `local.properties` missing or wrong | Create it (5.11) |
| `Unsupported class file major version` | Wrong Java | Use JDK 17, and set `JAVA_HOME` |
| `./gradlew: Permission denied` (Mac) | File is not executable, often after a zip | `chmod +x android/gradlew` |
| `'.' is not recognized` on Windows | `./gradlew` is Mac syntax | Use `.\gradlew.bat` |
| `License not accepted` | SDK licences | Open Android Studio's SDK Manager and accept |
| Phone shows old app | Forgot to sync | `npm run build`, `npx cap sync android`, rebuild |
| "App not installed" | Older app signed differently | Uninstall the old one first |
| `adb devices` shows nothing | USB debugging off or not allowed | Turn it on, and tap Allow on the phone |
| `gradlew clean` fails | Happens occasionally | Skip it and just run `assembleDebug` |

### 23.6 Python

| Problem | Cause | Fix |
| --- | --- | --- |
| `No matching distribution for tensorflow` | Python too new | Use Python 3.11 |
| `ModuleNotFoundError` | Virtual environment not active, or package missing | Activate `.venv`, and install |
| `Missing optional dependency 'openpyxl'` | Not in requirements | `python -m pip install openpyxl` |
| `.venv\Scripts\Activate.ps1 cannot be loaded` | PowerShell policy | See the `Set-ExecutionPolicy` fix |
| `VERIFICATION FAILED ... (m2cgen)` followed by "using the built-in translator" | Expected | Continue, unless it then fails again |
| `evaluate.py` stops with `no WHO group for ... sex=unknown` | Nail rows have no sex value | Use `model_metrics.py` |
| Features file not found | Features not generated | Run `prepare_public_datasets.py` |

---

## Part 24: How the data keeps growing and the model keeps improving

### 24.1 Built on the data, and built to grow

HemoScan's models were trained on as much lab-verified data as could be gathered: eye, nail and palm photos paired with real blood results, from four public research datasets (section 12.10), covering children and adults across several countries, including India.

Any AI system gets better with more good data. So HemoScan was designed from the beginning so that its data is **not fixed**. Its database is not limited to the data it started with. It grows every time the app is used and a real blood test value is added.

### 24.2 What "use-generated data" means

The word **use-generated data** in this book means new training data created by real use of the app.

It is **not** fake or artificial data. Each new data point is made of two real things:

| Half | Where it comes from |
| --- | --- |
| The measurements | The colour features from a real scan of a real person |
| The correct answer | That same person's real blood test value, typed in by them |

Each time an output is generated and then checked against an original test value, the app knows exactly how far off that output was, and that knowledge is put to use.

### 24.3 The life of one data point

```text
  A person scans             The app saves             The person gets a CBC
  ┌──────────────┐          ┌───────────────┐          ┌───────────────────┐
  │ Eye, nails,  │  ──────► │ Result + 55   │  ──────► │ Types the value   │
  │ palm photos  │          │ colour numbers│          │ (now or later,    │
  └──────────────┘          │ (no photo)    │          │ from History)     │
                            └───────────────┘          └─────────┬─────────┘
                                                                 │
                         one verified data point: measurements + true value
                                                                 │
             ┌───────────────────────────────┬───────────────────┴──────────┐
             ▼                               ▼                              ▼
   ┌──────────────────┐           ┌─────────────────────┐        ┌─────────────────────┐
   │ LEVEL 1          │           │ LEVEL 2             │        │ LEVEL 3             │
   │ Personal         │           │ Phone               │        │ Main model          │
   │ correction       │           │ correction          │        │ retraining          │
   │ Next scan of     │           │ Everyone scanned    │        │ Every future user   │
   │ this person      │           │ on this phone       │        │ of the new version  │
   └──────────────────┘           └─────────────────────┘        └─────────────────────┘
```

### 24.4 The three levels of learning

| | Level 1: Personal | Level 2: Phone | Level 3: Main model |
| --- | --- | --- | --- |
| **What improves** | Readings for this person | Readings for people on this phone | The AI model itself |
| **What it corrects** | The person's own tissue, camera and lighting | The phone's camera and usual lighting | Everything the model learned |
| **When** | From the next scan | As soon as enough tests exist | When a new version is built |
| **How it starts** | Automatic | Automatic | The developer collects export files and runs the retraining commands |
| **Needs** | 1 blood test | 5 tests from 2 people, and a proven improvement | Exported files from phones |
| **Code** | `ml/personalCalibration.ts` | `ml/deviceLearning.ts` | `training/merge_app_exports.py`, `train.py`, `export.py` |

Levels 1 and 2 take effect by themselves on the phone. Level 3 builds a completely new model that includes all the original data **plus** the new data, and that is delivered in the next app version.

### 24.5 Level 1 in detail: personal correction

When a blood test is entered, `scanRepo.setBloodTest` stores a calibration point on the person's profile. On every later scan:

```text
offset = average(lab value - photo estimate) × n / (n + 0.5)
```

Example: lab 14.5, photo estimate 11.9, one test.

```text
difference = 14.5 - 11.9 = 2.6
offset     = 2.6 × 1 / 1.5 = +1.7 g/dL
```

Her next photo estimate of 12.0 is displayed as 13.7. With more tests, the factor approaches 1, and the correction gets stronger: at 3 tests it is 3 / 3.5, or 0.86.

### 24.6 Level 2 in detail: phone correction

Every blood test on the phone, from every profile, is used together. The app fits:

```text
correction(estimate) = a + c × (estimate - center)
```

and tests that correction by leaving out one person at a time. It turns on when it has proved itself.

**Worked example from the real code.** Six people on one phone:

| Person | Photo estimate | Lab value |
| --- | --- | --- |
| 1 | 11.0 | 13.1 |
| 2 | 12.0 | 13.8 |
| 3 | 10.0 | 12.3 |
| 4 | 13.0 | 14.9 |
| 5 | 11.5 | 13.4 |
| 6 | 12.5 | 14.6 |

Result: average error before was **2.02 g/dL**, and after, on people left out of the fit, it was **0.77 g/dL**. The correction switches on, and an estimate of 11.0 becomes 12.4.

A person with their own blood tests uses Level 1. Everyone else on the phone benefits from Level 2. On a health-camp phone, one set of tests helps everybody who is scanned after.

Progress is shown in **Settings → Learning from blood tests**, including the measured error before and after.

### 24.7 Level 3 in detail: growing the main model

This is where the dataset really increases in size.

**Step 1. Collect.** On each phone, open **Settings → Learning from blood tests → Export learning data**. The file holds numbers only, with no names and no photos.

**Step 2. Add.** Copy the files into `training/data/app_exports/`.

**Step 3. Merge.** Inside `training/`, with the virtual environment active:

```bash
python merge_app_exports.py
```

It prints how many new samples each file gave, and writes a larger dataset: all the original samples plus the new ones.

```text
wrote artifacts/features_with_app.npz: 1119 existing + N app samples
```

**Step 4. Retrain.**

```bash
python train.py --features artifacts/features_with_app.npz
python model_metrics.py
```

New samples are named "HemoScan app users (India)", and receive the higher Indian sample weight, so the model pays particular attention to the people it serves.

**Step 5. Compare.** Look at the printed scorecard and compare it with the current version's.

**Step 6. Release.**

```bash
python export.py --skip-cnn --palm --version 2026.12-app
cd ..
npm test
npm run build
```

The **Model performance** chart in Settings updates automatically with the new figures, because they travel with the model.

**Suggested rhythm:** run the cycle after each health camp, or whenever a few dozen new blood tests have been collected. Keep every export file, as each retraining uses them all.

### 24.8 Built-in quality protection

More data helps only when the data is good. These checks protect the growing database.

| Protection | What it does | Where |
| --- | --- | --- |
| 7-day rule | A blood test must be within 7 days of the scan | `isValidCalibration` |
| Plausible value | Must be between 3 and 22 g/dL | `isValidCalibration` |
| Real scans only | Sample images and test scans are never used | `isLearningScan` |
| Raw estimate | Learning always compares with the uncorrected estimate, so it never learns from its own correction | `hbUncalibrated` |
| Edit replaces | Correcting a typed value overwrites the old one | `setBloodTest` |
| Shrinkage | A single test is not fully believed | `n / (n + k)` |
| Caps | Personal ±4 g/dL, phone ±3 g/dL | `pipeline.json` |
| Proof before use | A phone correction needs to reduce the error on people it did not learn from | `fitDeviceModel` |
| Duplicates removed | Exporting the same phone twice does no harm | `merge_app_exports.py` |
| Person-grouped testing | A person is never in both training and testing | `GroupKFold` |
| Verified export | The app's model code must match Python's predictions | `verify_js` |

### 24.9 Widening the data further

The same retraining pipeline accepts more sources:

| Source | How |
| --- | --- |
| Health camps | One phone, many people, each with a same-day CBC. The most direct route to more local data. |
| Partner clinics and labs | Patients scanned while they are already having a blood test |
| Additional research datasets | For example the multimodal Indian datasets on IEEE DataPort and Hugging Face (SEWA Rural), under each dataset's own licence and access terms |

For the best data, for each person record: same-day hemoglobin, age, sex, pregnancy, state; eye, nail and palm scans using the app; a wide mix of ages and hemoglobin levels; and signed consent.

### 24.10 Making Level 3 fully automatic

Today, Level 3 is started by a developer. The project is prepared for making it automatic:

```text
 Phones ──(consented upload)──► Server ──► Scheduled retraining ──► New model ──► App update
```

`features/sync/syncService.ts` already defines the upload and "latest model" calls. Adding this needs a server, a consent screen for upload, and compliance with India's DPDP Act, since it moves health data off the device.

### 24.11 Intended use

HemoScan screens for the chance of anemia. If it shows a chance of anemia, the person should get a blood test (CBC) and talk to a doctor or health worker before any treatment. For a large clinical or commercial rollout, complete the local validation study and regulatory steps that apply.

### 24.12 Privacy

| Data | Where it goes |
| --- | --- |
| Full photos | Memory only. Never saved. |
| Colour measurements (numbers) | Saved on the device with each scan |
| Profile (optional name, age, sex, location, diet) | On the device |
| Small crop of the scanned area | Only if the person turns on **Contribute anonymous data** |
| Export file | Only when someone presses Export. No names or photos. Includes age, sex, state and device type. |
| Upload | Nothing is uploaded. |

Treat export files as health data: store them securely, share them only with the team, and follow India's DPDP Act.

### 24.13 Maintenance notes for developers

Small housekeeping items, so a new developer is not confused by them.

| Item | Detail |
| --- | --- |
| Older comments | `config/appConfig.ts`, and a comment above `resolveUseMock` in `useCaptureFlow.ts`, describe an earlier arrangement of simulated models. Section 18.12 describes the current behaviour. |
| Older notes | `public/models/README.md`, `training/README.md` and the top of `export.py` mention a "Settings → Model source" switch from an earlier version. |
| `training/README.md` | The fallback interval limit in `pipeline.json` is 8.0 g/dL. |
| `prepare_public_datasets.py` | The script now also reads Eyes-defy-anemia. The palm has its own script. |
| `modelMode` | A settings field kept from an earlier version. It has no effect. |
| `requirements.txt` | Install `openpyxl` and `kagglehub` as well (section 5.14). |
| `evaluate.py` | Expects a sex value for every row. Use `model_metrics.py`, which handles the nail rows and provides the app's figures. |
| `extract_features.py --no-cnn` | Fills the CNN block with 576 zero columns, so a colour-only model should be built through `prepare_public_datasets.py` or `merge_app_exports.py`. |
| Export ranges | `export.py` reads `features.npz` for its check and colour ranges, including after training with `features_with_app.npz`. |
| Sample images | These are drawings that show how the app works. Use real photos for demonstrations and for judging results. |
| Worker startup | `provider.init()` is called twice for real models. It is harmless. |
| `docs/screenshots/` | May show earlier versions of screens. |
| Windows | `npm run android:build` uses `./gradlew`. On Windows, use the commands in section 5.11. |

---

## Part 25: Glossary

| Word | Meaning |
| --- | --- |
| Accuracy | Share of people correctly marked anemic or not |
| Alpha (image) | How see-through a pixel is |
| Alpha (quantile) | Which percentile a model aims for |
| Altitude adjustment | Amount subtracted for people living high up |
| Anemia | Too little hemoglobin |
| APK | Android app file |
| Array | A list of values |
| Artifact | A file produced by a process |
| async/await | A way to write code that waits without freezing |
| AUC | How well a score ranks positives above negatives |
| Backend | A server that an app talks to. This project has none. |
| Base score | XGBoost's starting prediction |
| Blob | A chunk of binary data held in memory |
| Boosting | Building trees that fix previous mistakes |
| Bridge | Connection from web code to phone features |
| Build | The final packaged app, or the act of making it |
| Bundle | Many code files merged into one |
| Canvas | A drawable pixel surface in the browser |
| Capacitor | Wraps a web app as a native app |
| CBC | Complete Blood Count, a lab test |
| Classification | Predicting a category |
| CLAHE | Local contrast improvement that avoids amplifying noise |
| CNN | Convolutional Neural Network, an image model. Not used by current models. |
| Component | A reusable piece of screen in React |
| Confidence | How much to trust the result |
| Confounder | Something that changes appearance but not the blood |
| Conformal calibration | Widening ranges so they really hold the promised share |
| Confusion matrix | Table of right and wrong predictions |
| Conjunctiva | Thin tissue lining the eyelid |
| Cross-validation | Testing on each part of the data in turn |
| CSS | Styling language |
| Cutoff | A boundary value |
| Dataset | A collection of examples |
| Debug build | A test version of an app |
| Decision tree | A flowchart of yes or no questions |
| Dependency | A package your project needs |
| Device learning | Correction learned from blood tests on one phone |
| Dexie | Library for the browser's database |
| Directory | A folder |
| DOM | The browser's tree of page elements |
| Environment variable | A named setting available to programs |
| Epoch time | A date as milliseconds since 1970 |
| Erythema index | A measure of skin redness |
| ESLint | Tool that finds suspicious code |
| Export (code) | Make something usable by other files |
| F1 score | Balance of precision and recall |
| False negative | Sick, but the test said healthy |
| False positive | Healthy, but the test said sick |
| Feature | One measured input number |
| Fetch | Browser function for loading a file |
| Fixture | Prepared data for tests |
| Fold | One part of the data in cross-validation |
| Framework | A large library with an overall structure |
| Fusion | Combining several estimates |
| g/dL | Grams per decilitre |
| Gaussian blur | Averaging with neighbours, weighted by distance |
| Gradle | Android's build system |
| Gray-world | White balance assuming the scene averages to grey |
| Guard | Early exit if required data is missing |
| HashRouter | Routing using the part after `#` |
| Hb | Hemoglobin |
| Heuristic | A practical rule of thumb |
| Histogram | Counts of values in ranges |
| Hook | A React function that starts with `use` |
| HSV | Colour as hue, saturation, value |
| HTML | Page structure language |
| HTTPS | Encrypted web communication |
| Hyperparameter | A setting chosen before training |
| i18n | Internationalization |
| IDE | A program for writing code, such as VS Code |
| IndexedDB | The browser's database |
| Inference | Using a trained model |
| Interface | A declared shape or set of functions |
| ITA | Individual Typology Angle, a skin-tone measure |
| JDK | Java Development Kit |
| JSON | Simple text data format |
| JSX | HTML-like syntax inside JavaScript |
| Label | The correct answer for an example |
| Lab colour | Colour as lightness, green-red, blue-yellow |
| Landmark | A numbered point found on a hand or face |
| Laplacian | An edge measure |
| Leaf | The end of a tree branch, holding the answer |
| Leakage | Test information reaching training, faking a better score |
| Library | Reusable code |
| Lint | Automated code checking |
| localhost | This same computer |
| localStorage | Small saved browser data |
| Luma | Brightness as one number |
| LUT | Lookup table |
| MAE | Mean absolute error, the average size of the error |
| Mean | Average |
| Median | The middle value |
| MediaPipe | Google's hand and face detection library |
| Mock | A fake stand-in used for development |
| Model | The learned rules |
| Module | A file of code that shares items through export |
| Namespace | A named group of translations |
| NaN | "Not a number" |
| Node.js | Runs JavaScript outside a browser |
| node_modules | Folder of downloaded packages |
| npm | Node's package manager |
| npx | Runs a package's tool |
| NumPy | Python's number array library |
| One-hot | A category as one 1 among 0s |
| OpenCV | Image-processing library |
| Out-of-fold | Predicted by a model that did not train on this example |
| Out-of-range | Colours unlike any in training |
| pandas | Python's table library |
| Parity | The same result in two implementations |
| Path | The address of a file |
| Percentile | Value below which a given share of values fall |
| Pip | Python's package installer |
| Pipeline | A sequence of processing steps |
| Pixel | One tiny dot of an image |
| Plugin | An add-on |
| Port | A numbered door on a computer |
| Precision | Of those marked anemic, the share truly anemic |
| Prediction | The model's output |
| Prettier | Code formatting tool |
| Promise | A value that will arrive later |
| Props | Inputs to a React component |
| PWA | A website that installs and works offline |
| Quantile | A percentile as a fraction |
| Quantile regression | Predicting a chosen percentile |
| R² | Share of variation explained |
| RAM | Short-term working memory |
| Random Forest | Average of many varied decision trees |
| React | Library for building screens |
| Recall | Of those truly anemic, the share found |
| Regression | Predicting a number |
| Repository (code) | Set of database functions; also a project's stored code |
| RGB | Colour as red, green, blue |
| RMSE | Root mean squared error |
| ROI | Region of Interest |
| Route | Mapping from an address to a screen |
| Sample | One example |
| Sclera | The white of the eye |
| SDK | Software Development Kit |
| Screening | A quick first check, not a diagnosis |
| Sensitivity | Same as recall |
| Server | A computer that provides data to others |
| Service worker | Background script enabling offline use |
| Severity | Normal, mild, moderate or severe |
| Shrinkage | Pulling an estimate towards a safe value when evidence is small |
| Specificity | Of the healthy, the share correctly cleared |
| State | Data a React component remembers |
| Std | Standard deviation, how spread out values are |
| Store | Shared data available across the app |
| Supervised learning | Learning from examples with known answers |
| SVG | Drawing described by shapes in code |
| Tailwind | CSS class-based styling |
| Terminal | A window for typing commands |
| Test | Code that checks other code |
| Thread | One line of work in a program |
| Transaction | Database changes that succeed or fail together |
| Tree | See decision tree |
| TypeScript | JavaScript with types |
| Unsharp mask | Sharpening by adding back edges |
| URL | The address of a web page |
| Variance | A measure of how spread out numbers are |
| venv | A private set of Python packages |
| Vite | Development server and build tool |
| Vitest | Test runner |
| WASM | WebAssembly, fast code in browsers |
| Web Speech API | Browser text-to-speech |
| Web Worker | A background thread in the browser |
| WebView | A browser inside an app |
| White balance | Correcting the colour of the light |
| WHO | World Health Organization |
| XGBoost | A leading gradient-boosted tree library |
| YCrCb | A colour system useful for detecting skin |
| Zip | A compressed bundle of files |
| Zustand | A small state library for React |

---

## Part 26: Command cheat sheet

**Run these inside the `hemoscan` folder, unless stated otherwise.**

### App

| Command | What it does |
| --- | --- |
| `npm install` | Install packages |
| `npm run dev` | Start for development |
| `npx vite --host` | Start, and allow phones on the same Wi-Fi |
| `npm test` | Run the tests |
| `npm run test:watch` | Tests rerun on save |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | Code check |
| `npm run format` | Tidy code |
| `npm run build` | Make the production version |
| `npm run preview` | Try the production version |
| `npm run setup-assets` | Repeat the OpenCV and MediaPipe setup |

### Android

| Command | What it does |
| --- | --- |
| `npx cap sync android` | Copy the build into the Android project |
| `npx cap open android` | Open in Android Studio |
| `cd android && ./gradlew assembleDebug` | Build the APK (Mac) |
| `cd android; .\gradlew.bat assembleDebug` | Build the APK (Windows PowerShell) |
| `npm run android:build` | Sync and build (Mac only) |
| `adb devices` | List connected phones |
| `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` | Install on a phone |

### Training (inside `training/`, with `.venv` active)

| Command | What it does |
| --- | --- |
| `source .venv/bin/activate` | Activate (Mac) |
| `.venv\Scripts\Activate.ps1` | Activate (Windows) |
| `python -m pytest tests/ -q` | Parity tests |
| `python prepare_public_datasets.py` | Build features from datasets |
| `python train_palm_classifier.py` | Train the palm check |
| `python merge_app_exports.py` | Add data from the app |
| `python train.py` | Train eye and nail models |
| `python model_metrics.py` | Compute the scorecard |
| `python export.py --skip-cnn --palm --version NAME` | Put models into the app |
| `python export.py --skip-cnn --palm --dry-run` | Trial export |
| `deactivate` | Leave the environment |

### Where things end up

| Thing | Location |
| --- | --- |
| Web build | `dist/` |
| Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Trained model files | `training/artifacts/` |
| Models used by the app | `src/ml/models/` |
| Model information | `public/models/model-info.json` |

### First-day path for a complete beginner

1. Read Parts 1, 2 and 3.
2. Install VS Code and Node (Part 4).
3. Extract the zip, then run `npm install` and `npm run dev` (Part 5).
4. Use the app and press every button.
5. Read Parts 6 and 7, while looking at `src/pages/AboutPage.tsx`. It is short.
6. Change a sentence in `src/i18n/locales/en/common.json`, and watch it update.
7. Read Part 13, following along in `src/features/scan/runPipeline.ts`.
8. Read Parts 11 and 12 when you are ready for the science.

Congratulations. If you have come this far, you understand a complete real-world project, from a pixel to a prediction.
