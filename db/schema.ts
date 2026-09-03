/**
 * SQLite schema for MaAI's offline-first local database.
 *
 * Replaces the previous AsyncStorage-as-JSON-blob persistence with real,
 * normalized, indexed tables so the app can scale to a real ASHA worker's
 * full caseload (hundreds of mothers) instead of loading one giant object
 * into memory on every read.
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  worker_id TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  assigned_area TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  notifications_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mothers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT NOT NULL,
  village TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  blood_group TEXT,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  risk_reason TEXT,
  is_demo_data INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mothers_risk ON mothers(risk_level);
CREATE INDEX IF NOT EXISTS idx_mothers_name ON mothers(name);

CREATE TABLE IF NOT EXISTS pregnancies (
  id TEXT PRIMARY KEY NOT NULL,
  mother_id TEXT NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  gestational_age_weeks INTEGER NOT NULL,
  gestational_age_as_of TEXT NOT NULL,
  expected_delivery_date TEXT NOT NULL,
  gravida INTEGER NOT NULL DEFAULT 1,
  para INTEGER NOT NULL DEFAULT 0,
  previous_complications TEXT,
  existing_conditions_json TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pregnancies_mother ON pregnancies(mother_id);

CREATE TABLE IF NOT EXISTS vitals (
  id TEXT PRIMARY KEY NOT NULL,
  mother_id TEXT NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  pregnancy_id TEXT REFERENCES pregnancies(id) ON DELETE SET NULL,
  gestational_week INTEGER,
  recorded_date TEXT NOT NULL,
  hemoglobin REAL,
  bp_systolic INTEGER,
  bp_diastolic INTEGER,
  weight_kg REAL,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  source TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vitals_mother ON vitals(mother_id, recorded_date);

CREATE TABLE IF NOT EXISTS lab_reports (
  id TEXT PRIMARY KEY NOT NULL,
  mother_id TEXT NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  source_image_uri TEXT,
  extraction_method TEXT NOT NULL,
  raw_fields_json TEXT NOT NULL,
  confirmed_fields_json TEXT,
  ocr_confidence REAL,
  status TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lab_reports_mother ON lab_reports(mother_id);

CREATE TABLE IF NOT EXISTS symptoms (
  id TEXT PRIMARY KEY NOT NULL,
  mother_id TEXT NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  symptom TEXT NOT NULL,
  is_danger_sign INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  raw_text TEXT,
  language TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_symptoms_mother ON symptoms(mother_id);

CREATE TABLE IF NOT EXISTS screenings (
  id TEXT PRIMARY KEY NOT NULL,
  mother_id TEXT NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  overall_risk TEXT NOT NULL,
  reasons_json TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  is_prototype_engine INTEGER NOT NULL DEFAULT 1,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_screenings_mother ON screenings(mother_id, created_at);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY NOT NULL,
  mother_id TEXT NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  screening_id TEXT REFERENCES screenings(id) ON DELETE SET NULL,
  overall_risk TEXT NOT NULL,
  score REAL NOT NULL,
  reasons_json TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_mother ON risk_assessments(mother_id);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY NOT NULL,
  mother_id TEXT NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  priority TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_required TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  snoozed_until TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status, priority);
CREATE INDEX IF NOT EXISTS idx_alerts_mother ON alerts(mother_id);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY NOT NULL,
  mother_id TEXT NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_visits_mother ON visits(mother_id);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY NOT NULL,
  mother_id TEXT NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  screening_id TEXT REFERENCES screenings(id) ON DELETE SET NULL,
  risk_level TEXT NOT NULL,
  findings_json TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_referrals_mother ON referrals(mother_id);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY NOT NULL,
  mother_id TEXT NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_level TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_mother ON activity_log(mother_id, created_at);

-- Real outbox queue for future backend sync. No remote endpoint exists yet in
-- this build (no backend), but the structure is genuinely functional: every
-- local write can be appended here and drained by a sync worker later without
-- any schema change.
CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON sync_outbox(status);
`;
