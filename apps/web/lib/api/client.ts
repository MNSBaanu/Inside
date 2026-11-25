const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: (() => Promise<string | null>) | null) {
  tokenGetter = getter;
}

export function getAccessToken(): Promise<string | null> {
  return tokenGetter?.() ?? Promise.resolve(null);
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
  const browser = typeof window !== 'undefined';
  const token =
    options.token ?? (auth && browser ? await getAccessToken() : null);

  return send<T>(method, path, options, token);
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options),
};

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (
    error instanceof TypeError &&
    /failed to fetch|networkerror|load failed/i.test(error.message)
  ) {
    return "Can't reach Inside right now. Check your connection and try again.";
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
