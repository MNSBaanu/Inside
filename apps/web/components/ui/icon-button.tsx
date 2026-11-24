import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const icons = { edit: Pencil, delete: Trash2 };

const tones = {
  edit: 'hover:bg-sand hover:text-brand',
  delete: 'hover:bg-error/10 hover:text-error',
};

/** A round icon-only Edit or Delete action. `label` is read out by screen readers. */
export function IconButton({
  action,
  label,
  href,
  onClick,
  disabled,
  className,
}: {
  action: 'edit' | 'delete';
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const Icon = icons[action];
  const classes = cn(
    'grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink transition-colors disabled:opacity-50',
    tones[action],
    className,
  );
  const title = action === 'edit' ? 'Edit' : 'Delete';

  if (href) {
    return (
      <Link href={href} aria-label={label} title={title} className={classes}>
        <Icon aria-hidden className="h-4 w-4" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title}
      className={classes}
    >
      <Icon aria-hidden className="h-4 w-4" />
    </button>
  );
}
