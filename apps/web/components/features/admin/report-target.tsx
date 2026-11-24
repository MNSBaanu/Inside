import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function ReportTarget({
  target,
  className,
}: {
  target: { label: string; href: string | null } | null;
  className?: string;
}) {
  if (!target) return null;

  return target.href ? (
    <Link
      href={target.href}
      target="_blank"
      title={target.label}
      className={cn('text-brand hover:underline', className)}
    >
      {target.label}
    </Link>
  ) : (
    <span className={className}>{target.label}</span>
  );
}
