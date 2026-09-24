'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setSessionExpiredHandler } from '@/lib/api';
import { authStorage } from '@/lib/auth-storage';
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

/** The signed-in user, or null when there is no valid session. */
async function fetchSessionUser(): Promise<User | null> {
  if (!authStorage.getAccessToken()) return null;
  try {
    const data = await api.get<{ user: User }>('/users/me');
    authStorage.markActive();
    return data.user;
  } catch {
    authStorage.clear();
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const applyUser = useCallback((next: User | null) => {
    setUser(next);
    setStatus(next ? 'authenticated' : 'unauthenticated');
  }, []);

  const loadUser = useCallback(async () => {
    applyUser(await fetchSessionUser());
  }, [applyUser]);

  useEffect(() => {
    let active = true;
    void fetchSessionUser().then((next) => {
      if (active) applyUser(next);
    });
    return () => {
      active = false;
    };
  }, [applyUser]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === authStorage.refreshKey && event.newValue === null) {
        setUser(null);
        setStatus('unauthenticated');
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const adopt = useCallback((payload: AuthPayload) => {
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
    () => ({ user, status, login, register, logout, refreshUser: loadUser }),
    [user, status, login, register, logout, loadUser],
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
