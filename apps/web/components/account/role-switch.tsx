'use client';

import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';

const roles = ['CLIENT', 'DESIGNER'] as const;

export function RoleSwitch() {
  const { user, refreshUser } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user?.role !== 'DESIGNER') return null;

  async function switchTo(activeRole: (typeof roles)[number]) {
    setError(null);
    setBusy(true);
    try {
      await api.patch('/users/me/active-role', { activeRole });
      await refreshUser();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Working as"
        description="Switch between hiring a designer and taking on work yourself."
      />

      {error ? <ErrorNotice message={error} /> : null}

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            disabled={busy}
            onClick={() => switchTo(role)}
            aria-pressed={user.activeRole === role}
            className={cn(
              'rounded-card border p-5 text-left transition-colors duration-300 disabled:opacity-60',
              user.activeRole === role
                ? 'border-brand bg-brand-soft'
                : 'border-hairline bg-surface hover:border-ink/30',
            )}
          >
            <span className="block font-display text-lg font-semibold">
              {role === 'CLIENT' ? 'Client' : 'Designer'}
            </span>
            <span className="mt-1 block text-sm text-muted">
              {role === 'CLIENT'
                ? 'Brief projects and hire designers.'
                : 'Publish work and send proposals.'}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
