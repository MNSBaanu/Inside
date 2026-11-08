import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth/auth-storage';
import type { User } from '@/lib/types';
import { SessionProvider, useSession } from './session-provider';

const user = { id: 'client-a', name: 'Client A', activeRole: 'CLIENT' } as User;

beforeEach(() => {
  const tokens = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => tokens.get(key) ?? null,
    setItem: (key: string, value: string) => {
      tokens.set(key, value);
    },
    removeItem: (key: string) => {
      tokens.delete(key);
    },
  });
  authStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  authStorage.clear();
  vi.unstubAllGlobals();
});

describe('SessionProvider', () => {
  it('renders signed out without making a profile request for a guest', () => {
    const get = vi.spyOn(api, 'get');
    const { result } = renderHook(useSession, { wrapper: SessionProvider });
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it('loads the saved session and responds immediately when storage is cleared', async () => {
    authStorage.save('access', 'refresh');
    vi.spyOn(api, 'get').mockResolvedValue({ user });
    const { result } = renderHook(useSession, { wrapper: SessionProvider });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user?.id).toBe(user.id);
    act(() => {
      authStorage.clear();
    });
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
  });

  it('cannot restore a signed-out session when an old profile request finishes', async () => {
    authStorage.save('access', 'refresh');
    let complete!: (value: { user: User }) => void;
    const pending = new Promise<{ user: User }>((resolve) => {
      complete = resolve;
    });
    const get = vi.spyOn(api, 'get').mockReturnValue(pending);
    const { result } = renderHook(useSession, { wrapper: SessionProvider });
    expect(get).toHaveBeenCalledWith('/users/me');
    act(() => {
      authStorage.clear();
    });
    await act(async () => {
      complete({ user });
    });
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
    expect(document.cookie).not.toContain('inside.session=1');
  });
});
