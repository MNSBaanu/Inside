'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { Block } from '@/lib/types';

export function BlockButton({ userId }: { userId: string }) {
  const { user, status } = useSession();
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const enabled = status === 'authenticated' && user?.id !== userId;

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await api.get<{ items: Block[] }>('/blocks');
      setBlocked(data.items.some((item) => item.blockedId === userId));
    } catch {
      // Leave the button in its unblocked state if the lookup fails.
    } finally {
      setReady(true);
    }
  }, [enabled, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!enabled) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (blocked) {
        await api.delete(`/blocks/${userId}`);
        setBlocked(false);
      } else {
        await api.post('/blocks', { blockedId: userId });
        setBlocked(true);
      }
    } catch {
      // Next load reconciles the real state.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={busy || !ready}
      aria-pressed={blocked}
    >
      {blocked ? 'Unblock' : 'Block'}
    </Button>
  );
}
