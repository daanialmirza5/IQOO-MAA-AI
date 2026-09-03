# Architecture

## Layering

```
screens/           UI only — calls hooks/services/repositories, never touches SQL directly
  ├─ hooks/         Thin data-fetching hooks (useMothers, useAlerts, useUserProfile, useSelectedMother)
  ├─ services/       Business logic: risk engine, OCR, voice, imaging, reports, ai, reference
  └─ db/             Repository layer — the only code that writes SQL
       ├─ schema.ts        Table definitions (source of truth for the data model)
       ├─ client.ts        expo-sqlite connection
       └─ repositories/    One repository per entity (mother, alert, screening, care, syncOutbox, user)
```

No screen executes SQL directly. Every read/write goes through a repository
in `db/repositories/`, which returns typed domain objects (`types/mother.ts`,
`types/domain.ts`, `types/screening.ts`, `types/alert.ts`), not raw rows.

## Navigation

One root native-stack (`navigation/RootNavigator.tsx`) holds the auth flow
(`Onboarding`/`Login`), the bottom-tab shell (`Tabs` → `navigation/AppTabs.tsx`:
Home / Mothers / Screen / Alerts / Profile), and every full-screen flow
(camera, OCR, voice, mother detail, referral, reports, health info) as
siblings of `Tabs` — not nested per-tab stacks. This is simpler than nested
stacks and still gives native back-gesture support. `navigation/types.ts` is
the single source of truth for every route's params;
`navigation/useAppNavigation.ts` gives any screen (including ones nested in
the tab navigator) a typed handle to push a root-level route.

**Web caveat:** `NavigationContainer` has no `linking` config, so the
browser's back/forward buttons do not sync with in-app navigation — use the
in-app back/close buttons, not the browser back button.

## Authentication

`auth/` implements a real local-device credential model — there is no
backend, so this is not a stub waiting to be replaced by "real" auth, it
*is* the real auth for a backend-less deployment. See
[SECURITY.md](SECURITY.md) for the hashing/storage details and exactly what
a future backend-auth migration would touch.

## State management

No global state library. Each screen/hook independently reads from
SQLite via the repository layer and re-fetches on focus
(`useFocusEffect`). This is intentional for an offline-first app where the
database itself is the single source of truth — there's no client-side
cache to keep in sync with it.

## Design system

`constants/theme.ts` is the only place colors/spacing/typography/radius are
defined. Every screen and component imports tokens from there — no
hardcoded hex colors or magic-number spacing in component files.

## Offline-first + sync architecture

Every write lands in SQLite immediately (no network dependency for any core
workflow). Key mutations (`motherRepository.create`, `.updateRisk`,
`.addVital`, `screeningRepository.create`, `careRepository.createReferral`
/`.addVisit`, `alertRepository.create`) also enqueue a row into the
`sync_outbox` table via `db/repositories/syncOutboxRepository.ts`. No
backend exists to drain this queue yet, so nothing is actually synced today
— but the queue itself is real, durable, and ready: a sync worker can be
added later that calls `syncOutboxRepository.listPending()` and POSTs each
entry to a real backend without any schema or call-site change.

## AI-assisted validation (optional, off by default)

`services/ai/aiValidationService.ts` is a real, callable service for
LLM-assisted explanation/validation, architected so the deterministic risk
engine and OCR field-extraction regexes remain authoritative — this service
can only *annotate*, never overrule a saved value. It requires
`EXPO_PUBLIC_AI_VALIDATION_ENDPOINT` (your own backend proxy — never a
provider API key directly from the client) to be configured; unset, every
call returns a clearly labeled "not configured" result. See
[AI_PIPELINE.md](AI_PIPELINE.md).
