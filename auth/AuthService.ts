export interface AuthSession {
  userId: string;
  workerId: string;
  loggedInAt: string;
}

export interface RegisterInput {
  name: string;
  workerId: string;
  phone: string;
  assignedArea: string;
  pin: string;
}

export type AuthErrorCode =
  | 'WORKER_ID_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'NOT_REGISTERED'
  | 'WEAK_PIN'
  | 'UNKNOWN';

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

/**
 * Auth is architected as a swappable provider interface rather than
 * hardcoded to one implementation. This build ships `LocalAuthProvider`
 * (no backend exists in this environment — see PROJECT.md) which hashes the
 * PIN with expo-crypto and never stores it in plaintext. A real backend
 * (e.g. a REST auth service or Firebase Auth) can implement this same
 * interface later without any UI changes.
 */
export interface AuthProvider {
  isRegistered(): Promise<boolean>;
  register(input: RegisterInput): Promise<AuthSession>;
  login(workerId: string, pin: string): Promise<AuthSession>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  /** Session is considered expired after this many ms of inactivity. */
  readonly sessionTtlMs: number;
}
