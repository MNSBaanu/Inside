import { getAccessToken, getRefreshToken, persistSession, clearSession } from '@/lib/auth/session';
import type { ApiResponse, AuthUser, TokenPair } from '@/lib/api/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  messages: string[];

  constructor(status: number, message: string | string[]) {
    const messages = Array.isArray(message) ? message : [message];
    super(messages.join(', '));
    this.status = status;
    this.messages = messages;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
  skipRefresh?: boolean;
};

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json()) as ApiResponse<T>;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await parseJson<{ user: AuthUser } & TokenPair>(response);
  if (!response.ok || !json.success) {
    clearSession();
    return null;
  }

  persistSession(
    { accessToken: json.data.accessToken, refreshToken: json.data.refreshToken },
    json.data.user,
  );
  return json.data.accessToken;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, skipRefresh = false, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && auth && !skipRefresh) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
  }

  const json = await parseJson<T>(response);
  if (!response.ok || !json.success) {
    const failure = json as Extract<ApiResponse<T>, { success: false }>;
    throw new ApiError(
      failure.error?.statusCode ?? response.status,
      failure.error?.message ?? 'Request failed',
    );
  }

  return json.data;
}

export function getApiBaseUrl() {
  return API_URL;
}
