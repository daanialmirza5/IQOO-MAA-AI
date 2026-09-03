# AI / Screening Pipeline

MaAI's principle: **the deterministic risk engine is always the clinical
decision-support authority.** Any AI/LLM-assisted layer can only explain or
annotate its output — never override a risk level, a lab value, or a saved
record. This document says exactly what is real, what is web-only and why,
and what would need a real backend to go further.

## System diagram

```
        MaAI
          |
  ┌───────┼────────┐
  ↓       ↓         ↓
CAMERA  REPORT    VOICE
  ↓       ↓         ↓
VISION   OCR       STT
  ↓       ↓         ↓
QUALITY  FIELD    SYMPTOM
GATE   EXTRACTION EXTRACTION
  └───────┼────────┘
          ↓
   UNIFIED HEALTH RECORD (SQLite)
          ↓
   LONGITUDINAL TREND (Hb/BP history)
          ↓
   DETERMINISTIC RISK ENGINE
          ↓
   TRIAGE / ALERTS
          ↓
   ACTION / FOLLOW-UP / REFERRAL

  (separate, optional, off by default)
  External medical reference (static, offline)
          ↓
  AI validation/explanation proxy (services/ai/aiValidationService.ts)
          ↓
  Human-readable explanation ONLY — never a decision path
```

## Camera / vision screening

`screens/CameraScreeningModal.tsx` → `services/imaging/*`

1. Real capture via `expo-camera`'s `takePictureAsync()` (or a real file
   upload on web / gallery picker on native — never a hash-of-filename fake).
2. **Eye detection (web only):** `services/imaging/eyeDetection.web.ts` runs
   Google MediaPipe FaceLandmarker fully in-browser (WASM), using published
   eye-contour landmark indices, to auto-crop to the actual detected eye
   region. It reports three distinct states, all surfaced to the UI
   differently:
   - **Eye detected** → crop to the real region, note added to the saved
     record.
   - **Eye not detected** (model ran, found zero faces) → the screening is
     **rejected** with "No eye was detected in this photo," the worker must
     retake. No result is generated from a bad frame.
   - **Detection unavailable** (model failed to load, e.g. offline) → falls
     through to whole-frame sampling, honestly unflagged — never confused
     with "no eye found."
   - Native has no equivalent yet (would need a native ML module + an
     EAS/dev-client build not available in this environment) — it always
     reports "unavailable" and uses the whole captured frame.
3. `services/imaging/imageQuality.ts` computes real brightness/sharpness
   from actual pixel data (Canvas on web, `jpeg-js` decode on native) and
   **rejects** poor-quality images before any analysis runs.
4. `services/screening/anemiaScreening.ts` runs a real colorimetric
   calculation on the real average RGB of the (cropped) region — deterministic
   arithmetic, not a trained model, and labeled as such everywhere: *"Screening
   indicates elevated anemia risk — confirm with clinical/laboratory
   assessment."* Never "diagnosed."
5. The captured image itself is stored (`screenings.metadata_json →
   capturedImageUri`) and shown back to the worker on the result screen and
   in the mother's Screening History — a result is never presented without
   the evidence that produced it.

## Lab report OCR

`screens/ReportScannerModal.tsx` → `services/ocr/*`

- **Web:** real Tesseract.js OCR, running client-side, no server/API key.
- **Native:** no on-device OCR engine is available without an EAS/dev-client
  build; the flow honestly switches to "photo attached as evidence + guided
  manual entry" instead of faking extraction.
- `services/ocr/fieldExtraction.ts` parses Hb / BP / gestational age /
  albumin / glucose out of the OCR'd (or manually typed) text with
  permissive regexes, and flags any value outside a physiologically
  plausible range (`RANGES` in that file).
- **Every extracted field is shown to the worker for confirmation/edit
  before it is saved** (`ReportScannerModal`'s review step) — a mis-parse is
  always caught by a human, never silently trusted.

## Voice check-in

`screens/VoiceCheckInModal.tsx` → `services/voice/*`

- **Web:** real Web Speech API transcription (Hindi + English).
- **Native:** no built-in STT without a native module/dev-client; the flow
  uses a structured quick-select symptom picker + free-text notes instead.
- `services/voice/symptomExtraction.ts` uses word-boundary regex matching
  (not naive substring matching — a naive match on "dard" alone previously,
  and incorrectly, fired on "pet ke upar dard" as if it were "headache"; this
  is fixed and covered by a unit test).
- Extracted symptoms are always shown for confirm/edit before being saved
  to the record.

## Risk engine

`services/risk/maternalRiskEngine.ts` — one canonical, versioned,
weighted-additive engine. Inputs: vitals, symptoms, pregnancy stage,
previous complications, missed ANC, screening results, and computed
longitudinal trends (`computeHbTrend`/`computeBpTrend` in
`db/repositories/motherRepository.ts`). A hard rule: **any recorded danger
symptom forces HIGH risk regardless of numeric score** — this cannot be
outvoted by a good Hb/BP reading. Covered by unit tests
(`services/risk/__tests__/maternalRiskEngine.test.ts`).

## AI-assisted validation/explanation (optional, off by default)

`services/ai/aiValidationService.ts` is real, callable infrastructure — not
a mock — for two narrow jobs: (1) generating a plain-language explanation of
an already-computed risk result, and (2) sanity-checking regex-extracted OCR
fields. It requires `EXPO_PUBLIC_AI_VALIDATION_ENDPOINT` to point at **your
own backend proxy** (never a provider API key directly — see
[SECURITY.md](SECURITY.md) for why). Unset (the default in this build —
no such backend exists here), every call returns a clearly-typed "not
configured" result and nothing is faked. If wired up, its output is
explanatory text/suggestions only; the deterministic engine's `overallRisk`
and any saved field value are never altered by it.

## Medical reference content

`services/reference/medicalReference.ts` is a small, static, offline set of
curated WHO / India MoHFW maternal-health guidance summaries (Hb thresholds,
BP thresholds, ANC visit schedule, danger signs, IFA supplementation),
surfaced via `screens/HealthInfoScreen.tsx` as a searchable reference list —
deliberately not a chat UI, since there is no live LLM behind it in this
build. `docs/INTEGRATIONS.md` documents what a real live-lookup integration
would need.
