'use client';

import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import type { Block } from '@/lib/types';

export function BlockButton({
  userId,
  menuItem = false,
}: {
  userId: string;
  menuItem?: boolean;
}) {
  const { user, status } = useSession();
  if (status !== 'authenticated' || !user || user.id === userId) return null;
  return (
    <AuthenticatedBlockButton
      key={`${user.id}:${userId}`}
      userId={userId}
      menuItem={menuItem}
    />
  );
}

function AuthenticatedBlockButton({
  userId,
  menuItem,
}: {
  userId: string;
  menuItem: boolean;
}) {
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
  const { confirm, dialog } = useConfirm();

  async function toggle() {
    const ok = await confirm(
      blocked
        ? {
            title: 'Unblock this person?',
            description: 'You can message and work with each other again.',
            confirmLabel: 'Unblock',
            tone: 'default',
          }
        : {
            title: 'Block this person?',
            description: 'Neither of you can message the other. You can unblock them later from Safety.',
            confirmLabel: 'Block',
          },
    );
    if (!ok) return;
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
      {dialog}
      {error || actionError ? (
        <ErrorNotice message={error ?? actionError!} />
      ) : null}
      {error ? (
        <Button variant="outline" onClick={() => void reload()}>
          Retry blocked users
        </Button>
      ) : menuItem ? (
        <button
          type="button"
          role="menuitem"
          onClick={toggle}
          disabled={busy || loading || !data}
          className="block w-full rounded-card px-4 py-2.5 text-left text-sm text-ink transition-colors duration-150 hover:bg-brand-soft hover:text-brand disabled:opacity-50"
        >
          {blocked ? 'Unblock' : 'Block'}
        </button>
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
