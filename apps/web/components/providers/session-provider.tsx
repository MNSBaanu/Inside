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
import { ApiError, api, setTokenGetter } from '@/lib/api/client';
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
  const signingOut = useRef(false);

  useEffect(() => {
    setTokenGetter(() => getToken());
    return () => setTokenGetter(null);
  }, [getToken]);

  const loadUser = useCallback(() => {
    const request = ++latest.current;
    const attempt = (tries: number): Promise<void> =>
      api
        .get<{ user: User }>('/users/me')
        .then((data) => {
          if (request !== latest.current) return;
          setUser(data.user);
          setStatus('authenticated');
        })
        .catch((cause) => {
          if (request !== latest.current) return;
          // Signed in with Clerk but refused by the API: sign out, or /login bounces straight back.
          if (cause instanceof ApiError && cause.statusCode === 401) {
            setUser(null);
            const suspended = cause.message === 'Account suspended';
            void signOut({
              redirectUrl: suspended ? '/login?suspended=1' : '/login',
            });
            return;
          }
          // Clerk still has a session, so a network or server error is not a sign-out. Retry.
          const delay = Math.min(1000 * 2 ** tries, 10_000);
          return new Promise<void>((resolve) => setTimeout(resolve, delay)).then(
            () => (request === latest.current ? attempt(tries + 1) : undefined),
          );
        });
    return attempt(0);
  }, [signOut]);

  useEffect(() => {
    if (!isLoaded || signingOut.current) return;
    if (isSignedIn) {
      setStatus('loading');
      void loadUser();
    } else {
      latest.current++;
      setUser(null);
      setStatus('unauthenticated');
    }
  }, [isLoaded, isSignedIn, userId, loadUser]);

  /** Keeps the signed-in page as it is until the browser has left for the home page. */
  const logout = useCallback(async () => {
    signingOut.current = true;
    latest.current++;
    await signOut();
    window.location.assign('/');
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
