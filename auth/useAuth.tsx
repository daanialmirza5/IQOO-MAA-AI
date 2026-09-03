import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { localAuthProvider } from './LocalAuthProvider';
import { AuthSession, RegisterInput } from './AuthService';

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  isRegistered: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (workerId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [existingSession, registered] = await Promise.all([
        localAuthProvider.getSession(),
        localAuthProvider.isRegistered(),
      ]);
      setSession(existingSession);
      setIsRegistered(registered);
      setIsLoading(false);
    })();
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const newSession = await localAuthProvider.register(input);
    setSession(newSession);
    setIsRegistered(true);
  }, []);

  const login = useCallback(async (workerId: string, pin: string) => {
    const newSession = await localAuthProvider.login(workerId, pin);
    setSession(newSession);
  }, []);

  const logout = useCallback(async () => {
    await localAuthProvider.logout();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, isRegistered, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
