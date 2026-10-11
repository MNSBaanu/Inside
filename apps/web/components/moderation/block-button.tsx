'use client';

import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { Block } from '@/lib/types';

export function BlockButton({ userId }: { userId: string }) {
  const { user, status } = useSession();
  if (status !== 'authenticated' || !user || user.id === userId) return null;
  return (
    <AuthenticatedBlockButton key={`${user.id}:${userId}`} userId={userId} />
  );
}

function AuthenticatedBlockButton({ userId }: { userId: string }) {
  const { data, error, loading, reload } = useApi<{ items: Block[] }>(
    '/blocks',
  );
  const [blockedOverride, setBlocked] = useState<boolean | null>(null);
  const blocked =
    blockedOverride ??
    data?.items.some((item) => item.blockedId === userId) ??
    false;
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setActionError(null);
    try {
      if (blocked) {
        await api.delete(`/blocks/${userId}`);
        setBlocked(false);
      } else {
        await api.post('/blocks', { blockedId: userId });
        setBlocked(true);
      }
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error || actionError ? (
        <ErrorNotice message={error ?? actionError!} />
      ) : null}
      {error ? (
        <Button variant="outline" onClick={() => void reload()}>
          Retry blocked users
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          disabled={busy || loading || !data}
          aria-pressed={blocked}
        >
          {blocked ? 'Unblock' : 'Block'}
        </Button>
      )}
    </div>
  );
}
