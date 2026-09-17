import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, setSessionExpiredHandler } from './api';
import { authStorage } from './auth-storage';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: async () => body,
  } as unknown as Response;
}

const ok = (data: unknown) => jsonResponse(200, { success: true, data });
const unauthorized = () =>
  jsonResponse(401, {
    success: false,
    error: { statusCode: 401, message: 'Unauthorized' },
  });

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
}

describe('api request', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    authStorage.save('stale-access', 'refresh-1');
  });

  afterEach(() => {
    setSessionExpiredHandler(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('refreshes once and retries the original request after a 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(
        ok({ accessToken: 'fresh-access', refreshToken: 'refresh-2' }),
      )
      .mockResolvedValueOnce(ok({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get('/projects')).resolves.toEqual({ items: [] });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
    expect(
      (fetchMock.mock.calls[2][1] as RequestInit).headers,
    ).toMatchObject({ Authorization: 'Bearer fresh-access' });
    expect(authStorage.getAccessToken()).toBe('fresh-access');
    expect(authStorage.getRefreshToken()).toBe('refresh-2');
  });

  it('clears the session and reports expiry when the refresh fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(unauthorized());
    vi.stubGlobal('fetch', fetchMock);

    const expired = vi.fn();
    setSessionExpiredHandler(expired);

    await expect(api.get('/projects')).rejects.toBeInstanceOf(ApiError);

    expect(expired).toHaveBeenCalledTimes(1);
    expect(authStorage.getAccessToken()).toBeNull();
  });

  it('does not try to refresh auth endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue(unauthorized());
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      api.post('/auth/login', { email: 'a@b.c', password: 'x' }, { auth: false }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
