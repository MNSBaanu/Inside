'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatApiError, switchActiveRoleRequest } from '@/lib/api/auth';

export function ModeSwitchNotice({
  need,
  onSwitched,
}: {
  need: 'CLIENT' | 'DESIGNER';
  onSwitched: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSwitch() {
    setBusy(true);
    setError(null);
    try {
      await switchActiveRoleRequest(need);
      await onSwitched();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  const label = need === 'DESIGNER' ? 'designer' : 'client';

  return (
    <div className="surface-panel flex flex-wrap items-center justify-between gap-3 p-4">
      <p className="text-sm text-muted-foreground">
        You are browsing in the other mode, so {label} actions are disabled here.
      </p>
      <Button type="button" size="sm" disabled={busy} onClick={onSwitch}>
        {busy ? 'Switching…' : `Switch to ${label} mode`}
      </Button>
      {error ? (
        <p className="w-full text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
