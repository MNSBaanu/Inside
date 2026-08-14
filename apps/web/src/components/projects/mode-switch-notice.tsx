'use client';

import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/layout/inline-alert';
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
    <div className="surface-panel flex flex-wrap items-center justify-between gap-3 border-accent-foreground/15 bg-accent/40 p-4">
      <p className="flex items-center gap-2 text-sm text-accent-foreground">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        You are browsing in the other mode, so {label} actions are disabled here.
      </p>
      <Button type="button" size="sm" disabled={busy} onClick={onSwitch}>
        {busy ? 'Switching…' : `Switch to ${label} mode`}
      </Button>
      {error ? (
        <InlineAlert tone="error" className="w-full">
          {error}
        </InlineAlert>
      ) : null}
    </div>
  );
}
