# Data Model

Source of truth: `db/schema.ts`. All access goes through
`db/repositories/*.ts` — screens never touch SQL directly (see
[ARCHITECTURE.md](ARCHITECTURE.md)).

## Tables

| Table | Purpose |
|---|---|
| `users` | ASHA worker profiles + salted/hashed PIN |
| `mothers` | Identity, contact, risk level (current snapshot) |
| `pregnancies` | Gestational age, EDD, gravida/para, active/completed status |
| `vitals` | Every Hb/BP/weight reading, with `source` and `recorded_date` — the full longitudinal history |
| `lab_reports` | Raw OCR/manual extraction + human-confirmed fields, per uploaded report |
| `symptoms` | Every reported symptom, tagged with `source` (voice/manual/checklist) and danger-sign flag |
| `screenings` | Every camera/OCR/voice/risk-check result, including the captured image URI |
| `risk_assessments` | Every risk engine run: score, reasons, evidence, engine version |
| `alerts` | Triage queue items — priority, status, linked mother |
| `visits` | ANC/home/follow-up visit log |
| `referrals` | Generated referral summaries |
| `activity_log` | Unified per-mother timeline (registration, visits, screenings, risk changes, referrals) |
| `sync_outbox` | Real local write-ahead queue for future backend sync — see [ARCHITECTURE.md](ARCHITECTURE.md) |

Every table uses a real foreign key to `mothers(id)` with
`ON DELETE CASCADE`, so a mother's full record is one join away and never
orphaned.

## Provenance

Every `vitals` row and every `symptoms` row records a `source` — e.g.
`REGISTRATION`, `CLINICAL_VISIT`, `REPORT_OCR`, `VISUAL_SCREENING`,
`VOICE_CHECKIN`, `VOICE`, `MANUAL`, `SYMPTOM_CHECKLIST`. `MotherDetailScreen`
surfaces this directly ("Source: Lab report (OCR)", etc.) so a worker always
knows where a number came from, not just what it is.

## Demo data

`db/seed.ts` inserts 5 realistic mothers on first launch only if the
database is genuinely empty (`motherRepository.count() === 0` — never
overwrites real field data): a stable pregnancy, a declining-Hb trend, a
rising-BP/pre-eclampsia-history case, a danger-symptom high-risk case, and
an ANC-overdue case. Every seeded mother is flagged `is_demo_data = 1` at
the storage layer, so a future "hide/clear demo data" feature can target
them precisely without touching real records. `ProfileScreen`'s "Reset Demo
Dataset" action deletes all mothers and re-seeds this same fixed set.

## Migration from the pre-SQLite build

`db/migrateFromAsyncStorageToSqlite.ts` runs once on first launch after an
upgrade from the old AsyncStorage-blob version, importing any existing
local data before seed data is considered. This only fires if legacy
AsyncStorage data is actually present.
