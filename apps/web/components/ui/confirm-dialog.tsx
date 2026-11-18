'use client';

import { useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded-card bg-surface p-6 shadow-lift"
      >
        <h2 id="confirm-dialog-title" className="font-display text-xl font-semibold">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm text-muted">
          {description}
        </p>
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={busy} autoFocus>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            className="!bg-error hover:!bg-error/90"
          >
            {busy ? 'Deleting…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
