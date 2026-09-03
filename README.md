# MaAI — Maternal Risk Intelligence for Frontline Health Workers

MaAI is an offline-first Expo/React Native app that helps ASHA/frontline
health workers track a caseload of pregnant mothers, screen for anemia risk
using the phone's camera, digitize lab reports with on-device OCR, capture
symptoms by voice, and get an explainable, deterministic risk assessment
that triages who needs attention first.

**Core idea:** *"Risk doesn't start at red."* MaAI combines camera vision,
lab values, voice-reported symptoms, and longitudinal history into one
record per mother, run through a transparent risk engine — not a black-box
score.

## Quick start

```bash
npm install
npx expo start --web    # fastest way to try it — runs in a browser
```

No account, no backend, and no API key is required to run the full app.
Auth is a local on-device PIN (see [docs/SECURITY.md](docs/SECURITY.md)),
and all data lives in a local SQLite database. On first launch, five
realistic demo mothers are seeded automatically — see
[docs/DATA_MODEL.md](docs/DATA_MODEL.md).

To run on a native simulator/device instead: `npx expo start` then press
`i` (iOS) or `a` (Android) — requires Xcode/Android Studio locally.

## What's real vs. platform-limited

Every core workflow does genuine work on real data — no hardcoded "AI
results." Camera captures and analyzes actual pixels, OCR reads actual
report text, voice actually transcribes speech, and the risk engine is a
transparent, tested, weighted scoring model, not an LLM guess. Some
capabilities (on-device OCR, live speech transcription, real-time eye
landmark detection) currently only run on web, because they need either a
browser API or a native module that requires an EAS/dev-client build not
available in this project's environment — native (iOS/Android) degrades
honestly to a manual-entry/quick-select flow instead of faking a result.
Full breakdown: [docs/AI_PIPELINE.md](docs/AI_PIPELINE.md).

## Documentation

| Doc | Covers |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | App structure, navigation, layering |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | SQLite schema, repositories, demo data |
| [docs/AI_PIPELINE.md](docs/AI_PIPELINE.md) | Camera/OCR/voice/risk engine, what's real vs. limited |
| [docs/SECURITY.md](docs/SECURITY.md) | Auth, secrets, data-at-rest, known limitations |
| [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) | External services, env vars, what's stubbed |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Build/export commands, deployment checklist |
| [docs/OVERNIGHT_BUILD_REPORT.md](docs/OVERNIGHT_BUILD_REPORT.md) | What was built/verified in the most recent autonomous build pass |

## Tech stack

Expo (React Native + react-native-web) · TypeScript (strict) · React
Navigation · expo-sqlite · expo-crypto / expo-secure-store · Tesseract.js
(web OCR) · Web Speech API (web voice) · MediaPipe FaceLandmarker (web eye
detection) · Jest · ESLint (`eslint-config-expo`)

## Validation

```bash
npx tsc --noEmit        # TypeScript
npx jest                # unit tests
npx eslint .             # lint
npx expo-doctor          # deployment-readiness checks
npx expo export -p web   # production web build
```
