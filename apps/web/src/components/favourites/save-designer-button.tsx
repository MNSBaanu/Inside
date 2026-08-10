'use client';

import { useState } from 'react';
import { addFavourite, removeFavourite } from '@/lib/api/favourites';
import { formatApiError } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

type SaveDesignerButtonProps = {
  designerId: string;
  designerName?: string;
  saved: boolean;
  onSavedChange: (saved: boolean) => void;
  onError?: (message: string) => void;
  variant?: 'overlay' | 'inline';
  className?: string;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20.5 4.7 13.4a4.8 4.8 0 0 1 0-6.8 4.6 4.6 0 0 1 6.6 0l.7.7.7-.7a4.6 4.6 0 0 1 6.6 0 4.8 4.8 0 0 1 0 6.8Z" />
    </svg>
  );
}

export function SaveDesignerButton({
  designerId,
  designerName,
  saved,
  onSavedChange,
  onError,
  variant = 'overlay',
  className,
}: SaveDesignerButtonProps) {
  const [busy, setBusy] = useState(false);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setBusy(true);
    try {
      if (saved) {
        await removeFavourite(designerId);
        onSavedChange(false);
      } else {
        await addFavourite(designerId);
        onSavedChange(true);
      }
    } catch (err) {
      onError?.(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  const label = saved
    ? `Remove ${designerName ?? 'designer'} from favourites`
    : `Save ${designerName ?? 'designer'} to favourites`;

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        className={cn(
          'inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50',
          saved
            ? 'border-transparent bg-primary text-primary-foreground'
            : 'border-border bg-background hover:bg-muted',
          className,
        )}
      >
        <HeartIcon filled={saved} />
        {saved ? 'Saved' : 'Save designer'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      className={cn(
        'absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full backdrop-blur transition-all disabled:opacity-60',
        saved
          ? 'bg-white text-[oklch(0.45_0.16_20)]'
          : 'bg-black/35 text-white opacity-0 hover:bg-black/55 focus-visible:opacity-100 group-hover:opacity-100',
        className,
      )}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
