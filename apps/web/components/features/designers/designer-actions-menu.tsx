'use client';

import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BlockButton } from '@/components/features/moderation/block-button';
import { ReportDialog } from '@/components/features/moderation/report-dialog';
import { useSession } from '@/components/providers/session-provider';
import { cardSurface } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

export function DesignerActionsMenu({ designerId }: { designerId: string }) {
  const { user, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (status !== 'authenticated' || !user || user.id === designerId) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        className="grid h-10 w-10 place-items-center rounded-full bg-white/85 text-ink shadow-card backdrop-blur transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <MoreHorizontal aria-hidden className="h-5 w-5" />
      </button>

      <div
        role="menu"
        className={cn(
          cardSurface,
          'absolute right-0 z-50 mt-2 w-44 p-1 shadow-lift',
          !open && 'hidden',
        )}
      >
        <BlockButton userId={designerId} menuItem />
        <ReportDialog
          targetType="USER"
          targetId={designerId}
          reportedUserId={designerId}
          menuItem
        />
      </div>
    </div>
  );
}
