# Security

## Authentication

Local, on-device credential model (`auth/LocalAuthProvider.ts`) — there is
no backend, so nothing here is a stub.

- A worker registers once per device: name, Worker ID, phone, assigned area,
  and a PIN (minimum 4 digits).
- The PIN is never stored in plaintext. Each account gets a random salt
  (`expo-crypto` `randomUUID`), and `SHA-256(salt:pin)` is what's stored
  (`users.pin_hash` / `users.pin_salt` in SQLite).
- **Login is by Worker ID + PIN**, not phone number.
- The session token is a small JSON object (`userId`, `workerId`,
  `loggedInAt`) stored via `expo-secure-store` on native (OS
  Keychain/Keystore) and `localStorage` on web — web has no OS-level secure
  enclave to defer to, so `localStorage` is the honest equivalent of what
  any browser-based PWA would use, not a downgrade specific to this app.
- Sessions expire after 7 days (`SEVEN_DAYS_MS` in `LocalAuthProvider.ts`);
  `RootNavigator.tsx` gates every screen behind a valid session — there is
  no route that bypasses auth.

**Migrating to a real backend later:** `auth/AuthService.ts` defines the
`AuthProvider` interface `LocalAuthProvider` implements
(`register`/`login`/`logout`/`getSession`/`isRegistered`). A server-backed
provider implementing the same interface can be swapped in without touching
any screen.

## Data at rest

All health data lives in a local SQLite database
(`expo-sqlite`, see [DATA_MODEL.md](DATA_MODEL.md)) — nothing is
transmitted anywhere by default. On native this is the app's sandboxed
storage; on web it's the browser's `wa-sqlite` WASM-backed storage, scoped
to the origin.

## Logging

No screen logs raw PIN values, full lab values, or full patient identity
strings to the console in normal operation. `console.error`/`console.warn`
calls in the codebase are limited to technical failure diagnostics (e.g.
"OCR failed:", "Capture failed:") for developer debugging, not health data.

## API keys / secrets

MaAI ships with **zero required external credentials**. The only optional
env var is `EXPO_PUBLIC_AI_VALIDATION_ENDPOINT`
(see [AI_PIPELINE.md](AI_PIPELINE.md)) — and by design it must point at your
own backend proxy, never at a provider API directly, because any
`EXPO_PUBLIC_*` value is bundled into client JS and readable by anyone who
opens the app bundle. `.env` is gitignored; `.env.example` documents the
one optional variable with no real values.

## Referral/report sharing

`ReferralSummaryScreen` and `MotherReportScreen` share only the fields
relevant to clinical handoff (risk level, findings, recommendation, worker
identity) via the OS share sheet, WhatsApp deep link, SMS deep link, or
clipboard — never the mother's full raw record.

## Known limitations (honestly disclosed)

- **Web session storage** (`localStorage`) is readable by any script that
  can execute in the page's origin; this is the standard trust model for a
  browser SPA, not unique to MaAI, but is a materially weaker guarantee than
  native's OS Keychain/Keystore. A production web deployment should serve
  over HTTPS with a strict CSP.
- **No rate limiting on PIN attempts.** A local-only, offline-first app
  has no server to rate-limit against; a device-level lockout after N failed
  attempts would be a reasonable addition before a wide rollout.
- **No remote wipe / device-loss story.** Since data lives only on-device
  with no cloud backup, a lost or stolen device means the data on it is
  gone or exposed to whoever holds the device unless the OS's own disk
  encryption is enabled. This is inherent to an offline-first, backend-less
  build — see [DEPLOYMENT.md](DEPLOYMENT.md) for what a real rollout would
  need to add.
