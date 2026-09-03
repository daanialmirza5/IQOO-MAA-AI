# Deployment

## Prerequisites

```bash
npm install
```

No account, API key, or backend is required for any of the commands below.

## Validation (run before every deploy)

```bash
npx tsc --noEmit
npx jest
npx eslint .
npx expo-doctor
npx expo export -p web --output-dir dist-web-check   # then delete dist-web-check
```

All five currently pass clean in this build (0 TS errors, all Jest tests
passing, 0 lint errors/warnings, 21/21 expo-doctor checks, clean production
web bundle).

## Web deployment

```bash
npx expo export -p web --output-dir dist
```

This produces a static site in `dist/` — deployable to any static host
(Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3+CloudFront, etc.). No
server-side runtime is required; the app is fully client-side and
offline-first (SQLite runs in-browser via `wa-sqlite`/WASM).

Serve it over HTTPS. If you configure `EXPO_PUBLIC_AI_VALIDATION_ENDPOINT`
(see [INTEGRATIONS.md](INTEGRATIONS.md)), also set a Content-Security-Policy
that allows `connect-src` to that origin and to `cdn.jsdelivr.net` (used at
runtime for the MediaPipe eye-detection model — see
[INTEGRATIONS.md](INTEGRATIONS.md) for why it's loaded from a CDN rather
than bundled).

## Native (iOS/Android) build

This environment has no EAS account/credentials and no Xcode/Android Studio
available, so a real native binary build has not been produced or verified
here. To build one:

```bash
npx expo install --check   # verify dependency versions first
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
```

This requires an Expo/EAS account and (for iOS) an Apple Developer account.
`app.json` is already configured with a real `bundleIdentifier` /
`package` (`com.maai.maternalhealth`), adaptive icon set, and splash screen
— the config-level blockers `expo-doctor` would normally catch are already
fixed (see `git log` for the deployment-readiness pass). What's genuinely
unverified is the actual native compile/run, since no native build
environment exists here.

**On native, remember:** eye detection, on-device OCR, and live voice
transcription are web-only in this build (see
[AI_PIPELINE.md](AI_PIPELINE.md)) — native gets the honest manual-entry/
quick-select fallback paths, not a broken feature.

## Post-deploy checklist

- [ ] Confirm the deployed URL loads past "Initializing MaAI…" (first-run
      SQLite init + demo seed can take a few seconds on a cold cache)
- [ ] Register a worker profile, confirm login works
- [ ] Add a mother, confirm she appears in the caseload
- [ ] Run a camera screening (upload fallback works without camera hardware)
- [ ] Upload the lab report test image from `docs/DEPLOYMENT.md`'s sibling
      testing flow (see the app's Reports screen for what a saved
      screening looks like) and confirm OCR extracts real values
- [ ] Confirm Sign Out and Reset Demo Dataset both work (these were
      previously silently broken on web due to `react-native-web`'s
      `Alert.alert()` being a no-op — now fixed via `ConfirmDialog`)
