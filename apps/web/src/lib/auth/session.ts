import type { AuthUser, Role, TokenPair } from '@/lib/api/types';

const ACCESS_KEY = 'inside_access_token';
const REFRESH_KEY = 'inside_refresh_token';
const GATE_COOKIE = 'inside_gate';

export type GatePayload = {
  role: Role;
  activeRole: Role;
};

function canUseDom() {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!canUseDom()) return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseDom()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: TokenPair) {
  if (!canUseDom()) return;
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens() {
  if (!canUseDom()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function setGateCookie(user: Pick<AuthUser, 'role' | 'activeRole'>) {
  if (!canUseDom()) return;
  const payload: GatePayload = {
    role: user.role,
    activeRole: user.activeRole,
  };
  const value = encodeURIComponent(JSON.stringify(payload));
  document.cookie = `${GATE_COOKIE}=${value}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
}

export function clearGateCookie() {
  if (!canUseDom()) return;
  document.cookie = `${GATE_COOKIE}=; Path=/; Max-Age=0`;
}

export function clearSession() {
  clearTokens();
  clearGateCookie();
}

export function persistSession(tokens: TokenPair, user: AuthUser) {
  setTokens(tokens);
  setGateCookie(user);
}

export function parseGateCookie(raw: string | undefined): GatePayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as GatePayload;
    if (!parsed.role || !parsed.activeRole) return null;
    return parsed;
  } catch {
    return null;
  }
}

export { GATE_COOKIE };
