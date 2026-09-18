import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setSessionExpiredHandler } from './api';
import { authStorage } from './auth-storage';
import type { AuthPayload, User } from './types';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';
type ModeRole = 'CLIENT' | 'DESIGNER';

type SessionValue = {
  user: User | null;
  status: SessionStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: ModeRole;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (activeRole: ModeRole) => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const signOutLocally = useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    void (async () => {
      await authStorage.load();
      if (!authStorage.getAccessToken() && !authStorage.getRefreshToken()) {
        signOutLocally();
        return;
      }
      try {
        const data = await api.get<{ user: User }>('/users/me');
        setUser(data.user);
        setStatus('authenticated');
      } catch {
        await authStorage.clear();
        signOutLocally();
      }
    })();
  }, [signOutLocally]);

  useEffect(() => {
    setSessionExpiredHandler(signOutLocally);
    return () => setSessionExpiredHandler(null);
  }, [signOutLocally]);

  const adopt = useCallback(async (payload: AuthPayload) => {
    await authStorage.save(payload.accessToken, payload.refreshToken);
    setUser(payload.user);
    setStatus('authenticated');
  }, []);

  const login = useCallback<SessionValue['login']>(
    async (email, password) => {
      const payload = await api.post<AuthPayload>(
        '/auth/login',
        { email, password },
        { auth: false },
      );
      await adopt(payload);
    },
    [adopt],
  );

  const register = useCallback<SessionValue['register']>(
    async (input) => {
      const payload = await api.post<AuthPayload>('/auth/register', input, {
        auth: false,
      });
      await adopt(payload);
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
    await authStorage.clear();
    signOutLocally();
  }, [signOutLocally]);

  const switchRole = useCallback<SessionValue['switchRole']>(
    async (activeRole) => {
      const data = await api.patch<{ user: User; accessToken: string }>(
        '/users/me/active-role',
        { activeRole },
      );
      await authStorage.save(data.accessToken);
      setUser(data.user);
    },
    [],
  );

  const value = useMemo<SessionValue>(
    () => ({ user, status, login, register, logout, switchRole }),
    [user, status, login, register, logout, switchRole],
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
