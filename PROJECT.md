# 🌸 MaAI — Maternal Risk Intelligence for Frontline Health Workers

**"Risk doesn't start at red."**

MaAI is an offline-first Expo/React Native app for ASHA/ANM frontline health workers. It fuses three field-collectible signals — a camera pallor screen, scanned lab reports, and a voice symptom check-in — into one longitudinal, explainable risk score per mother, so a worker managing 50–100 women can see who is quietly deteriorating weeks before it becomes an emergency.

This document reflects the app as it actually is today, including what is real and what is intentionally simulated. Nothing here overstates clinical validation — see [§6 Honest Limitations](#6-honest-limitations).

---

## 1. Problem & Approach

Frontline workers in low-resource settings manage large caseloads with paper records and episodic visits. Anemia, pre-eclampsia, and hypertension are frequently caught only once a woman is already in crisis, because nothing tracks subtle change *across* visits — only the latest snapshot. MaAI's answer: turn every routine interaction (a photo, a scanned slip, a spoken symptom check-in) into a structured, timestamped record, and let a transparent rules engine watch the *trajectory*, not just the latest value.

```
 📷 Vision (camera)     📄 Records (lab report)     🎙️ Voice (symptom check-in)
        │                        │                          │
        └────────────────────────┼──────────────────────────┘
                                 ▼
                🧠 Maternal Risk Engine (explainable, rule-based)
                                 ▼
                📊 Pregnancy Journey (trajectory, not just latest reading)
                                 ▼
                👩‍⚕️ Worklist → Alerts → Referral (Call / Visit / Refer / Share)
```

---

## 2. Architecture

```
App.tsx                    — thin root: DB init, GestureHandlerRootView, AuthProvider, RootNavigator
auth/                       — AuthService interface + LocalAuthProvider (PIN-based, no backend)
navigation/                 — React Navigation: bottom tabs + root stack for full-screen flows
db/                         — SQLite (expo-sqlite) schema, client, seed data, repositories
  schema.ts                 — normalized tables: mothers, pregnancies, vitals, lab_reports,
                               symptoms, screenings, risk_assessments, alerts, visits, referrals,
                               activity_log, sync_outbox
  repositories/              — typed CRUD + query layer; assembles a `Mother`-shaped read model
                               from joins so existing screens don't need a rewrite
  migrateFromAsyncStorage.ts — one-time migration of any pre-SQLite local data
  seed.ts                   — 5 realistic, clearly-flagged (isDemoData) demo mothers
hooks/                      — useMothers, useMother, useAlerts, useUserProfile, useSelectedMother
services/
  risk/maternalRiskEngine.ts — the one canonical risk engine (see §4)
  imaging/                   — real pixel extraction (web canvas / native jpeg-js) + quality heuristics
  screening/anemiaScreening.ts — colorimetric heuristic run on real captured pixels
  ocr/                       — real Tesseract.js OCR (web) + field extraction + native fallback
  voice/                     — symptom keyword extraction (word-boundary matched) + voice service
screens/                    — one file per screen; components/ for shared UI primitives
constants/theme.ts          — the design system (see §3)
```

**Data flow for a screening**: a screening screen (Camera/Report/Voice/RiskCheck/Symptom) collects evidence → builds a `ScreeningResult` → `ScreeningResultScreen` re-runs `evaluateUnifiedMaternalRisk()` against the mother's full history, persists the screening + risk assessment + any new vitals/symptoms, updates the mother's risk level, appends an activity-log entry, and auto-creates an alert if risk is MEDIUM/HIGH.

---

## 3. Design System

Light, clinical, restrained — one primary blue (`#1D6FE0`) for actions/links, neutral white/slate surfaces, and red/amber/green reserved exclusively for risk semantics (never reused for branding). Typography, spacing, radius, and shadow scales are centralized in `constants/theme.ts`; every screen consumes the same tokens.

---

## 4. Risk Engine

`services/risk/maternalRiskEngine.ts` is a single, deterministic, additive-scoring rules engine (not a trained model) — deliberately transparent and auditable, which is a feature for clinical decision support, not a limitation. It weighs: Hb/BP trajectory across visits, visual screening findings, absolute Hb/BP thresholds, prior complications, missed ANC visits, reported symptoms, and maternal age. **Any reported danger sign (severe headache, bleeding, convulsions, etc.) always forces HIGH risk, regardless of the accumulated score** — a low numeric total can never mask a critical symptom. Covered by 25 automated Jest tests, including two regression tests for real bugs the tests themselves caught during development (a severity-threshold miscalibration and a substring-matching false positive in symptom extraction).

An earlier, separate `pregnancyRiskEngine.ts` has been consolidated into this one engine so there is exactly one source of truth for risk.

---

## 5. What's Real vs. What's Honestly Simulated

| Module | Web | Native (Android/iOS) |
|---|---|---|
| **Camera** | Real `takePictureAsync()` capture, real per-pixel analysis via Canvas, real brightness/blur quality gate (rejects unusable photos) | Same real capture; pixels decoded via `expo-image-manipulator` + `jpeg-js` (pure-JS, no native module) — genuinely real pixel data on both platforms |
| **OCR** | Real on-device OCR via **Tesseract.js**, runs entirely client-side | No OCR engine available without a custom native build — falls back to guided manual entry with the photo attached as evidence, never a fake extraction |
| **Voice** | Real transcription via the browser's Web Speech API | No STT available without a native module — falls back to a quick-select symptom picker + free-text notes |
| **Symptom extraction** | Transparent word-boundary keyword matching (not an NLP model), same on both platforms | Same |
| **Risk scoring** | Real, deterministic, tested (see §4) | Same |

Every extracted or computed value — OCR fields, voice-detected symptoms, camera findings — is shown to the worker for **confirmation or correction before it is saved**. Nothing is written to a mother's record without that step.

---

## 6. Honest Limitations

- The camera's colorimetric formula (Erythema Index, Hb Redness Index) is real arithmetic on real pixels, but it is an **unvalidated heuristic**, not a clinically validated diagnostic model. The app never claims "AI diagnosed anemia" — only "screening indicates elevated risk, confirm with lab testing."
- Native OCR and native speech-to-text are not implemented in this build — both would require a custom Expo dev-client/EAS build (native modules) or a paid cloud API with backend infrastructure, neither available in this environment. The native fallbacks are honest, not fake.
- Authentication is a local-device PIN model (salted SHA-256 via `expo-crypto`, session via `expo-secure-store`) because no backend exists. It is architected behind an `AuthProvider` interface so a real backend auth service can be substituted without UI changes.
- The `sync_outbox` table is a real, structurally complete offline-sync queue, but there is no remote endpoint yet to drain it into — this app is fully local-only today.

---

## 7. Tech Stack

Expo ~57 · React Native 0.86 · React 19 · TypeScript (strict) · `expo-sqlite` · `expo-camera` · `expo-image-manipulator` · `expo-image-picker` · `expo-crypto` · `expo-secure-store` · `@react-navigation` (native-stack + bottom-tabs) · `tesseract.js` (web) · `jpeg-js` + `base64-js` (native pixel decode) · Jest (`jest-expo`) · ESLint (`eslint-config-expo` flat config).

---

## 8. Setup & Run

```bash
npm install
npm run web        # browser at http://localhost:8081
npm run start        # Metro + QR code for Expo Go
npm test              # Jest unit tests (risk engine, symptom extraction)
npm run lint           # ESLint
npx expo export -p web # production web bundle validation
```

First launch walks through on-device worker registration (name, Worker ID, PIN) — no external account needed. Camera, microphone, and photo library permissions are declared in `app.json`.

---

## 9. Roadmap

| Feature | Status |
|---|---|
| WhatsApp / SMS direct referral share | ✅ Done (`ReferralSummaryScreen.tsx`) |
| SQLite offline-first data layer | ✅ Done |
| Local device authentication | ✅ Done |
| Real camera capture + on-device pixel analysis | ✅ Done |
| Real OCR (web) / honest manual fallback (native) | ✅ Done |
| Real voice transcription (web) / quick-select fallback (native) | ✅ Done |
| Consolidated, tested risk engine | ✅ Done |
| ABDM / PMSMA FHIR export | 🔲 Planned |
| Native OCR / STT (requires EAS/dev-client build) | 🔲 Requires infrastructure not available in this environment |
| Backend sync (outbox queue is ready) | 🔲 Requires a backend, not yet built |
| "Mother Mode" companion view | 🔲 Planned |
| Full multi-language UI translation (i18n architecture exists; coverage is partial) | 🔲 Planned |

---

*MaAI provides decision support for frontline health workers. It is not a medical diagnosis. All high-risk findings should be confirmed with laboratory testing and clinical evaluation.*
