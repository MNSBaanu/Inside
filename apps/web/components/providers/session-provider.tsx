'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { api, setSessionExpiredHandler } from '@/lib/api/client';
import { authStorage } from '@/lib/auth/auth-storage';
import type { AuthPayload, Role, User } from '@/lib/types';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

type SessionValue = {
  user: User | null;
  status: SessionStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: Extract<Role, 'CLIENT' | 'DESIGNER'>;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const latest = useRef(0);
  const hasSession = useSyncExternalStore<boolean | null>(
    authStorage.subscribe,
    authStorage.hasSession,
    () => null,
  );

  const loadUser = useCallback(() => {
    const request = ++latest.current;
    return api
      .get<{ user: User }>('/users/me')
      .then((data) => {
        if (request !== latest.current || !authStorage.hasSession()) return;
        authStorage.markActive();
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (request !== latest.current) return;
        authStorage.clear();
        setUser(null);
        setStatus('unauthenticated');
      });
  }, []);

  useEffect(() => {
    const requests = latest;
    if (hasSession) void loadUser();
    return () => {
      requests.current++;
    };
  }, [hasSession, loadUser]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      latest.current++;
      setUser(null);
      setStatus('unauthenticated');
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === authStorage.refreshKey && event.newValue === null) {
        latest.current++;
        setUser(null);
        setStatus('unauthenticated');
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const adopt = useCallback((payload: AuthPayload) => {
    latest.current++;
    authStorage.save(payload.accessToken, payload.refreshToken);
    setUser(payload.user);
    setStatus('authenticated');
    return payload.user;
  }, []);

  const login = useCallback<SessionValue['login']>(
    async (email, password) => {
      const payload = await api.post<AuthPayload>(
        '/auth/login',
        { email, password },
        { auth: false },
      );
      return adopt(payload);
    },
    [adopt],
  );

  const register = useCallback<SessionValue['register']>(
    async (input) => {
      const payload = await api.post<AuthPayload>('/auth/register', input, {
        auth: false,
      });
      return adopt(payload);
    },
    [adopt],
  );

  const logout = useCallback(async () => {
    latest.current++;
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      await api
        .post('/auth/logout', { refreshToken }, { auth: false })
        .catch(() => undefined);
    }
    authStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user: hasSession ? user : null,
      status:
        hasSession === null
          ? 'loading'
          : hasSession
            ? status
            : 'unauthenticated',
      login,
      register,
      logout,
      refreshUser: loadUser,
    }),
    [hasSession, user, status, login, register, logout, loadUser],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside a SessionProvider');
  }
  return context;
}
