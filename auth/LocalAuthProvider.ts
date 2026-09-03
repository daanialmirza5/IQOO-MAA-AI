import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getDatabase } from '../db/client';
import { generateId, nowIso } from '../db/id';
import { AuthProvider, AuthSession, RegisterInput, AuthError } from './AuthService';

const SESSION_KEY = 'maai_auth_session';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// expo-secure-store's native Keychain/Keystore backing isn't available on
// web; localStorage is the honest, documented web fallback (same trust
// model a browser-based PWA would have — there is no OS-level secure
// enclave to defer to on web).
const secureGet = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try { return window.localStorage.getItem(key); } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
};
const secureSet = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
    return;
  }
  await SecureStore.setItemAsync(key, value);
};
const secureDelete = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

function generateSalt(): string {
  return Crypto.randomUUID();
}

export const localAuthProvider: AuthProvider = {
  sessionTtlMs: SEVEN_DAYS_MS,

  async isRegistered(): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM users`);
    return (row?.c ?? 0) > 0;
  },

  async register(input: RegisterInput): Promise<AuthSession> {
    if (!input.pin || input.pin.length < 4) {
      throw new AuthError('WEAK_PIN', 'PIN must be at least 4 digits.');
    }
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ id: string }>(`SELECT id FROM users WHERE worker_id = ?`, [input.workerId]);
    if (existing) {
      throw new AuthError('WORKER_ID_TAKEN', 'This Worker ID is already registered on this device.');
    }

    const salt = generateSalt();
    const pinHash = await hashPin(input.pin, salt);
    const id = generateId('user');
    const ts = nowIso();

    await db.runAsync(
      `INSERT INTO users (id, name, worker_id, phone, assigned_area, language, pin_hash, pin_salt, notifications_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'English', ?, ?, 1, ?, ?)`,
      [id, input.name, input.workerId, input.phone, input.assignedArea, pinHash, salt, ts, ts]
    );

    const session: AuthSession = { userId: id, workerId: input.workerId, loggedInAt: ts };
    await secureSet(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async login(workerId: string, pin: string): Promise<AuthSession> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ id: string; pin_hash: string; pin_salt: string; worker_id: string }>(
      `SELECT id, pin_hash, pin_salt, worker_id FROM users WHERE worker_id = ?`,
      [workerId]
    );
    if (!row) throw new AuthError('NOT_REGISTERED', 'No worker profile found for this Worker ID on this device.');

    const attemptHash = await hashPin(pin, row.pin_salt);
    if (attemptHash !== row.pin_hash) {
      throw new AuthError('INVALID_CREDENTIALS', 'Incorrect PIN.');
    }

    const session: AuthSession = { userId: row.id, workerId: row.worker_id, loggedInAt: nowIso() };
    await secureSet(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async logout(): Promise<void> {
    await secureDelete(SESSION_KEY);
  },

  async getSession(): Promise<AuthSession | null> {
    const raw = await secureGet(SESSION_KEY);
    if (!raw) return null;
    try {
      const session: AuthSession = JSON.parse(raw);
      const age = Date.now() - new Date(session.loggedInAt).getTime();
      if (age > SEVEN_DAYS_MS) {
        await secureDelete(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },
};
