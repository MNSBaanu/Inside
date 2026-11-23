'use client';

import { useAuth } from '@clerk/nextjs';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api, setTokenGetter } from '@/lib/api/client';
import { connectSocket, disconnectSocket } from '@/lib/realtime/socket';
import type { User } from '@/lib/types';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

type SessionValue = {
  user: User | null;
  status: SessionStatus;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const latest = useRef(0);

  useEffect(() => {
    setTokenGetter(() => getToken());
    return () => setTokenGetter(null);
  }, [getToken]);

  const loadUser = useCallback(() => {
    const request = ++latest.current;
    return api
      .get<{ user: User }>('/users/me')
      .then((data) => {
        if (request !== latest.current) return;
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (request !== latest.current) return;
        setUser(null);
        setStatus('unauthenticated');
      });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      setStatus('loading');
      void loadUser();
    } else {
      latest.current++;
      setUser(null);
      setStatus('unauthenticated');
    }
  }, [isLoaded, isSignedIn, userId, loadUser]);

  const logout = useCallback(async () => {
    latest.current++;
    await signOut();
    setUser(null);
    setStatus('unauthenticated');
  }, [signOut]);

  const socketUserId = user?.id;
  useEffect(() => {
    if (!socketUserId) return;
    connectSocket();
    return () => disconnectSocket();
  }, [socketUserId]);

  const value = useMemo<SessionValue>(
    () => ({ user, status, logout, refreshUser: loadUser }),
    [user, status, logout, loadUser],
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
