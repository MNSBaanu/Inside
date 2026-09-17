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

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, signal, auth = true } = options;
  const token =
    options.token ??
    (auth && typeof window !== 'undefined'
      ? authStorage.getAccessToken()
      : null);

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
    throw new ApiError(response.status, 'The server returned an empty response');
  }

  if (!response.ok || !payload.success) {
    const message = !payload.success
      ? [payload.error.message].flat().join(', ')
      : response.statusText;
    throw new ApiError(response.status, message);
  }

  return payload.data;
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
