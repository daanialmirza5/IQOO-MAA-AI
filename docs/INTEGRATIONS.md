# Integrations

## Currently active (zero configuration required)

| Integration | Where | Notes |
|---|---|---|
| Google MediaPipe FaceLandmarker | `services/imaging/eyeDetection.web.ts` | Loaded at runtime from `cdn.jsdelivr.net` — see the Metro note below. Web only. |
| Tesseract.js | `services/ocr/ocrEngine.web.ts` | Client-side OCR, no API key. Web only. |
| Web Speech API | `services/voice/voiceCheckInService.ts` | Browser built-in, no API key. Web only. |
| WhatsApp / SMS / native Share | `screens/ReferralSummaryScreen.tsx`, `screens/MotherReportScreen.tsx` | Deep links (`whatsapp://`, `sms:`) / OS share sheet — no API key. |
| Phone dialer | `Linking.openURL('tel:...')` throughout | No API key. |

### Why MediaPipe is loaded from a CDN URL, not bundled

`@mediapipe/tasks-vision`'s published bundle (both its ESM and CJS builds)
contains a fully dynamic `import(expr)` call internally for its own WASM
loading, which Metro's static bundler cannot resolve — it fails the
production `expo export -p web` build. The fix used here: the package is
loaded at runtime via a CDN URL through an indirect dynamic import
(`new Function('specifier','return import(specifier)')`), invisible to
Metro's static analysis — the same class of fix as webpack's
`/* webpackIgnore: true */`. TypeScript still gets full type-checking via a
compile-time-only `import type`. See `services/imaging/eyeDetection.web.ts`.

## Not configured (architecture ready, no credential available here)

| Integration | Where it would plug in | What's needed |
|---|---|---|
| AI validation/explanation backend | `services/ai/aiValidationService.ts` | Your own backend endpoint holding a real LLM provider key server-side; set `EXPO_PUBLIC_AI_VALIDATION_ENDPOINT`. See [AI_PIPELINE.md](AI_PIPELINE.md) and [SECURITY.md](SECURITY.md) for why this can't be a direct client-side provider key. |
| Live WHO / MoHFW guideline lookup | `services/reference/medicalReference.ts` (currently static) | A real government/WHO open-data API and credential, if one becomes available; until then this module ships a small curated static set instead of faking a live call. |
| Backend sync target | `db/repositories/syncOutboxRepository.ts` | A real backend endpoint to drain `sync_outbox` — the local queue is already real and durable, just has nowhere to send to yet. |

None of these are faked. Where a credential or backend doesn't exist in
this environment, the code path either doesn't run (and says so clearly in
the UI/logs) or the feature is honestly presented as a static/offline
version instead of a live one.

## Env vars

See `.env.example`. `EXPO_PUBLIC_APP_NAME` is cosmetic.
`EXPO_PUBLIC_AI_VALIDATION_ENDPOINT` is the only optional integration point,
and it is unset in this build.
