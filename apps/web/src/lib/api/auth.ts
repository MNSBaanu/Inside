import { apiRequest, ApiError } from '@/lib/api/client';
import type { AuthUser, Role, TokenPair } from '@/lib/api/types';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  persistSession,
  setAccessToken,
  setGateCookie,
} from '@/lib/auth/session';
import { homePathForGate } from '@/lib/auth/roles';

export type AuthSessionData = {
  user: AuthUser;
} & TokenPair;

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.messages.join(', ');
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthSessionData> {
  const data = await apiRequest<AuthSessionData>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  persistSession(
    { accessToken: data.accessToken, refreshToken: data.refreshToken },
    data.user,
  );
  return data;
}

export async function registerRequest(input: {
  email: string;
  password: string;
  name: string;
  role: 'CLIENT' | 'DESIGNER';
}): Promise<AuthSessionData> {
  const data = await apiRequest<AuthSessionData>('/auth/register', {
    method: 'POST',
    auth: false,
    body: input,
  });
  persistSession(
    { accessToken: data.accessToken, refreshToken: data.refreshToken },
    data.user,
  );
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>('/auth/me');
  setGateCookie(data.user);
  return data.user;
}

export async function updateProfileRequest(input: {
  name?: string;
  bio?: string;
  phone?: string;
  location?: string;
  isAvailable?: boolean;
}): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>('/users/me', {
    method: 'PATCH',
    body: input,
  });
  setGateCookie(data.user);
  return data.user;
}

export async function switchActiveRoleRequest(
  activeRole: Extract<Role, 'CLIENT' | 'DESIGNER'>,
): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser; accessToken: string }>(
    '/users/me/active-role',
    {
      method: 'PATCH',
      body: { activeRole },
    },
  );
  setAccessToken(data.accessToken);
  setGateCookie(data.user);
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        auth: false,
        body: { refreshToken },
      });
    }
  } finally {
    clearSession();
  }
}

export function redirectPathAfterAuth(user: AuthUser): string {
  return homePathForGate({ role: user.role, activeRole: user.activeRole });
}

export function hasClientSession(): boolean {
  return Boolean(getAccessToken());
}

export function forgotPasswordRequest(email: string) {
  return apiRequest<{ message: string; resetToken?: string }>(
    '/auth/forgot-password',
    {
      method: 'POST',
      auth: false,
      body: { email },
    },
  );
}

export function resetPasswordRequest(token: string, newPassword: string) {
  return apiRequest<{ reset: true }>('/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: { token, newPassword },
  });
}

export function verifyEmailRequest(token: string) {
  return apiRequest<{ verified: true }>('/auth/verify-email', {
    method: 'POST',
    auth: false,
    body: { token },
  });
}
