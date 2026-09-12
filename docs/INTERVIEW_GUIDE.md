# MaAI (IQOO-MAA-AI) — Interview Guide & Technical Defense

## 1. Pitches
- **30-Second Pitch**: "MaAI is an offline-first React Native mobile app for frontline community health workers, providing automated maternal risk scoring, ANC visit scheduling, and offline SQLite data synchronization."
- **2-Minute Pitch**: "Frontline community health workers in remote rural regions are the first line of defense against maternal mortality, but operate in zero-connectivity environments with paper registers. MaAI provides a native mobile solution built on Expo, TypeScript, and SQLite. Workers record prenatal vitals completely offline, with automated clinical heuristics instantly flagging pre-eclampsia and severe anemia risks. The app generates automated trimester checkup schedules and delta-syncs records to central district health servers when a cellular connection is re-established."

## 2. Key Technical Q&A
- **Q: How does SQLite local sync avoid database schema corruption on mobile?**
  - **A**: We use an append-only mutation log table locally (`sync_queue`). Every user edit creates an immutable transaction entry. Sync workers process queue records sequentially with idempotency keys, ensuring network interruptions during upload never duplicate or corrupt records.
