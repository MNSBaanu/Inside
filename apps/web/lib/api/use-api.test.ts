import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';
import { buildQuery, useApi } from './use-api';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.dispatchEvent(new Event('inside:data-changed'));
});

describe('useApi request lifecycle', () => {
  it('does not fetch when disabled and clears data when the path becomes null', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ name: 'Project A' });
    const { result, rerender } = renderHook(
      ({ path }) => useApi<{ name: string }>(path),
      {
        initialProps: { path: null as string | null },
      },
    );
    expect(result.current.loading).toBe(false);
    expect(get).not.toHaveBeenCalled();
    rerender({ path: '/projects/a' });
    await waitFor(() => expect(result.current.data?.name).toBe('Project A'));
    rerender({ path: null });
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('hides previous data and ignores an older response after navigation', async () => {
    const first = deferred<{ name: string }>();
    const second = deferred<{ name: string }>();
    const get = vi
      .spyOn(api, 'get')
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(
      ({ path }) => useApi<{ name: string }>(path),
      {
        initialProps: { path: '/projects/a' },
      },
    );
    const oldSignal = get.mock.calls[0][1]?.signal;
    rerender({ path: '/projects/b' });
    expect(oldSignal?.aborted).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    await act(async () => {
      second.resolve({ name: 'Project B' });
    });
    await act(async () => {
      first.resolve({ name: 'Project A' });
    });
    expect(result.current.data?.name).toBe('Project B');
    expect(result.current.loading).toBe(false);
  });

  it('does not show completed data from another path while fetching', async () => {
    const second = deferred<{ name: string }>();
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ name: 'Project A' })
      .mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(
      ({ path }) => useApi<{ name: string }>(path),
      {
        initialProps: { path: '/projects/a' },
      },
    );
    await waitFor(() => expect(result.current.data?.name).toBe('Project A'));
    rerender({ path: '/projects/b' });
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    await act(async () => {
      second.resolve({ name: 'Project B' });
    });
  });

  it('retains existing data while reloading and takes only the latest response', async () => {
    const older = deferred<{ name: string }>();
    const newer = deferred<{ name: string }>();
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ name: 'Original' })
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    const { result } = renderHook(() =>
      useApi<{ name: string }>('/projects/a'),
    );
    await waitFor(() => expect(result.current.data?.name).toBe('Original'));
    act(() => {
      void result.current.reload();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.data?.name).toBe('Original');
    act(() => {
      void result.current.reload();
    });
    await act(async () => {
      newer.resolve({ name: 'Newest' });
    });
    await act(async () => {
      older.resolve({ name: 'Outdated' });
    });
    expect(result.current.data?.name).toBe('Newest');
  });

  it('shows a revisited page from the cache at once and refreshes it quietly', async () => {
    const fresh = deferred<{ name: string }>();
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ name: 'Cached' })
      .mockReturnValueOnce(fresh.promise);
    const first = renderHook(() => useApi<{ name: string }>('/projects/a'));
    await waitFor(() => expect(first.result.current.data?.name).toBe('Cached'));
    first.unmount();

    const { result } = renderHook(() => useApi<{ name: string }>('/projects/a'));
    expect(result.current.data?.name).toBe('Cached');
    expect(result.current.loading).toBe(false);
    await act(async () => {
      fresh.resolve({ name: 'Fresh' });
    });
    expect(result.current.data?.name).toBe('Fresh');
  });

  it('forgets cached data after a change is saved', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ name: 'Before' });
    const first = renderHook(() => useApi<{ name: string }>('/projects/a'));
    await waitFor(() => expect(first.result.current.data?.name).toBe('Before'));
    first.unmount();
    window.dispatchEvent(new Event('inside:data-changed'));

    vi.spyOn(api, 'get').mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHook(() => useApi<{ name: string }>('/projects/a'));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('reports a failed request and clears the error after a successful retry', async () => {
    vi.spyOn(api, 'get')
      .mockRejectedValueOnce(new Error('API unavailable'))
      .mockResolvedValueOnce({ name: 'Recovered' });
    const { result } = renderHook(() =>
      useApi<{ name: string }>('/projects/a'),
    );
    await waitFor(() => expect(result.current.error).toBe('API unavailable'));
    expect(result.current.loading).toBe(false);
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.data?.name).toBe('Recovered');
  });

  it('aborts the initial request when unmounted', () => {
    const pending = deferred<unknown>();
    const get = vi.spyOn(api, 'get').mockReturnValue(pending.promise);
    const { unmount } = renderHook(() => useApi('/projects/a'));
    const signal = get.mock.calls[0][1]?.signal;
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});

describe('buildQuery', () => {
  it('returns an empty string when nothing is set', () => {
    expect(buildQuery({})).toBe('');
    expect(buildQuery({ style: undefined, page: undefined })).toBe('');
  });

  it('omits empty strings so blank filters are not sent', () => {
    expect(buildQuery({ style: '', roomType: 'Kitchen' })).toBe(
      '?roomType=Kitchen',
    );
  });

  it('keeps numeric zero rather than dropping it', () => {
    expect(buildQuery({ minBudget: 0 })).toBe('?minBudget=0');
  });

  it('encodes values that need it', () => {
    expect(buildQuery({ q: 'living room' })).toBe('?q=living+room');
  });
});
