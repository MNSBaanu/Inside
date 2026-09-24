import { authStorage } from './auth-storage';

// Android emulators reach the host machine at 10.0.2.2; phones need the computer's LAN IP.
export const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001';

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

type RequestOptions = { auth?: boolean };
type RefreshPayload = { accessToken: string; refreshToken: string };

let refreshInFlight: Promise<string | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const payload = (await response.json().catch(() => null)) as
      | ApiSuccess<RefreshPayload>
      | ApiFailure
      | null;
    if (!response.ok || !payload || !payload.success) return null;

    await authStorage.save(payload.data.accessToken, payload.data.refreshToken);
    return payload.data.accessToken;
  } catch {
    return null;
  }
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
  body: unknown,
  token: string | null,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(
      0,
      `Can't reach the Inside API at ${baseUrl}. Check EXPO_PUBLIC_API_URL.`,
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (!payload) {
    throw new ApiError(
      response.status,
      `Unexpected response (${response.status}) from the API`,
    );
  }
  if (!response.ok || !payload.success) {
    const message = !payload.success
      ? [payload.error.message].flat().join(', ')
      : `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }
  return payload.data;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true } = options;
  const token = auth ? authStorage.getAccessToken() : null;

  try {
    return await send<T>(method, path, body, token);
  } catch (cause) {
    const canRetry =
      cause instanceof ApiError &&
      cause.statusCode === 401 &&
      auth &&
      !path.startsWith('/auth/');
    if (!canRetry) throw cause;

    const fresh = await refreshOnce();
    if (!fresh) {
      await authStorage.clear();
      onSessionExpired?.();
      throw cause;
    }
    return send<T>(method, path, body, fresh);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
};

export function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Something went wrong.';
}
