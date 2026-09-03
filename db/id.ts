import * as Crypto from 'expo-crypto';

/** Generates a real random UUID v4 for new records (never a Date.now() counter). */
export function generateId(prefix?: string): string {
  const uuid = Crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export function nowIso(): string {
  return new Date().toISOString();
}
