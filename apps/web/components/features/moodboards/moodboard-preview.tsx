'use client';

import { Images } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MoodboardSheet } from '@/components/features/moodboards/moodboard-sheet';
import type { MoodboardSummary } from '@/lib/types';

/**
 * A brief's attached moodboard: its name, an optional status, any extra
 * actions, and a button that opens the printable sheet in a popup.
 */
export function MoodboardPreview({
  board,
  clientName,
  status,
  actions,
  children,
}: {
  board: MoodboardSummary;
  clientName?: string;
  status?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted">Moodboard</p>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <p className="truncate font-semibold">{board.name}</p>
            {status}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Images aria-hidden className="h-4 w-4" />
            View moodboard
          </Button>
          {actions}
        </div>
      </div>
      {children}
      {open ? (
        <MoodboardPopup board={board} clientName={clientName} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  );
}

function MoodboardPopup({
  board,
  clientName,
  onClose,
}: {
  board: MoodboardSummary;
  clientName?: string;
  onClose: () => void;
}) {
  return (
    <Modal title={board.name} size="lg" onClose={onClose}>
      <MoodboardSheet
        name={board.name}
        moodWords={board.moodWords}
        palette={board.palette}
        images={board.images}
        clientName={clientName}
      />
    </Modal>
  );
}
