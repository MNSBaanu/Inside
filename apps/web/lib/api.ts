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

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = (await response.json()) as ApiSuccess<T> | ApiFailure;

  if (!response.ok || !body.success) {
    const message = !body.success
      ? [body.error.message].flat().join(', ')
      : response.statusText;
    throw new ApiError(response.status, message);
  }

  return body.data;
}
