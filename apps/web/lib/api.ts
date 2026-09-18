import { authStorage } from './auth-storage';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { statusCode: number; message: string | string[] };
};

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  body?: unknown;
  token?: string | null;
  auth?: boolean;
  signal?: AbortSignal;
};

type RefreshPayload = { accessToken: string; refreshToken: string };

let refreshInFlight: Promise<string | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = (await response
    .json()
    .catch(() => null)) as ApiSuccess<RefreshPayload> | ApiFailure | null;

  if (!response.ok || !payload || !payload.success) {
    return null;
  }

  authStorage.save(payload.data.accessToken, payload.data.refreshToken);
  return payload.data.accessToken;
}

function refreshOnce() {
  refreshInFlight ??= refreshAccessToken().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function send<T>(
  method: string,
  path: string,
  options: RequestOptions,
  token: string | null,
): Promise<T> {
  const { body, signal } = options;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const payload = (await response
    .json()
    .catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!payload) {
    throw new ApiError(
      response.status,
      `Unexpected non-JSON response (${response.status}) from ${baseUrl} - check the API is running there`,
    );
  }

  if (!response.ok || !payload.success) {
    const message = !payload.success
      ? [payload.error.message].flat().join(', ')
      : response.statusText;
    throw new ApiError(response.status, message);
  }

  return payload.data;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true } = options;
  const explicitToken = options.token !== undefined;
  const browser = typeof window !== 'undefined';
  const token =
    options.token ?? (auth && browser ? authStorage.getAccessToken() : null);

  try {
    return await send<T>(method, path, options, token);
  } catch (cause) {
    const canRetry =
      cause instanceof ApiError &&
      cause.statusCode === 401 &&
      auth &&
      browser &&
      !explicitToken &&
      !path.startsWith('/auth/');

    if (!canRetry) throw cause;

    const fresh = await refreshOnce();
    if (!fresh) {
      authStorage.clear();
      onSessionExpired?.();
      throw cause;
    }

    return send<T>(method, path, options, fresh);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options),
};

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
