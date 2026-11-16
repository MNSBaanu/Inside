import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function ArrowButton({
  href,
  tone,
  small = false,
  children,
}: {
  href: string;
  tone: 'light' | 'dark';
  small?: boolean;
  children: React.ReactNode;
}) {
  const colors =
    tone === 'light'
      ? 'bg-canvas text-ink group-hover:bg-white'
      : 'bg-brand text-canvas group-hover:bg-brand-deep';
  return (
    <Link href={href} className={`group inline-flex items-stretch gap-1 font-medium ${small ? 'text-xs' : 'text-sm'}`}>
      <span className={`rounded-md transition-colors ${small ? 'px-3 py-2' : 'px-5 py-3'} ${colors}`}>
        {children}
      </span>
      <span className={`grid place-items-center rounded-md transition-colors ${small ? 'w-8' : 'w-11'} ${colors}`}>
        <ChevronRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
