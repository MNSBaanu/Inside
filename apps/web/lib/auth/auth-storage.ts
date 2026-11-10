const ACCESS_KEY = 'inside.accessToken';
const REFRESH_KEY = 'inside.refreshToken';
const SESSION_COOKIE = 'inside.session';
const SESSION_EVENT = 'inside:session-changed';

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Storage can be unavailable in private mode; the session simply won't persist.
  }
}

function writeSessionCookie(present: boolean) {
  try {
    document.cookie = present
      ? `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
      : `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // Without the cookie the middleware simply defers to the client-side guard.
  }
}

export const authStorage = {
  subscribe(onChange: () => void) {
    window.addEventListener(SESSION_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(SESSION_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  },
  hasSession: () => Boolean(read(ACCESS_KEY) || read(REFRESH_KEY)),
  refreshKey: REFRESH_KEY,
  getAccessToken: () => read(ACCESS_KEY),
  markActive: () => writeSessionCookie(true),
  markInactive: () => writeSessionCookie(false),
  getRefreshToken: () => read(REFRESH_KEY),
  save(accessToken: string, refreshToken: string) {
    write(ACCESS_KEY, accessToken);
    write(REFRESH_KEY, refreshToken);
    writeSessionCookie(true);
    window.dispatchEvent(new Event(SESSION_EVENT));
  },
  clear() {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
    writeSessionCookie(false);
    window.dispatchEvent(new Event(SESSION_EVENT));
  },
};
