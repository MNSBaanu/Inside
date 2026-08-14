'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatApiError } from '@/lib/api/auth';
import { blockUser } from '@/lib/api/blocks';

export function BlockUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onBlock() {
    if (
      !window.confirm(
        `Block ${userName}? You will not be able to message each other on projects.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await blockUser(userId);
      setDone(true);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="text-xs text-muted-foreground" role="status">
        {userName} is blocked.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => void onBlock()}
      >
        {busy ? 'Blocking…' : `Block ${userName}`}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
