import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { authImage } from '@/lib/utils/images';

export function AuthLayout({
  eyebrow,
  title,
  description,
  footer,
  children,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'shell grid lg:grid-cols-2',
        compact
          ? 'min-h-[100dvh] items-center gap-12 pb-8 pt-24'
          : 'items-start gap-16 pb-20 pt-20 md:pb-24 md:pt-24',
      )}
    >
      <div className="mx-auto w-full max-w-md">
        <Badge tone="brand">{eyebrow}</Badge>
        <h1
          className={cn(
            'font-display font-semibold',
            compact ? 'mt-4 text-4xl md:text-5xl' : 'mt-6 text-section',
          )}
        >
          {title}
        </h1>
        <p className={cn('text-muted', compact ? 'mt-3' : 'mt-4')}>
          {description}
        </p>

        <div className={compact ? 'mt-6' : 'mt-10'}>{children}</div>

        <p className={cn('text-sm text-muted', compact ? 'mt-5' : 'mt-8')}>
          {footer}
        </p>
      </div>

      <div
        className={cn(
          'relative hidden overflow-hidden rounded-card shadow-lift lg:block',
          compact ? 'h-[calc(100dvh-8rem)]' : 'aspect-[4/5]',
        )}
      >
        <Image
          src={authImage}
          alt="An interior designed through Inside"
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 0px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-canvas">
          <p className="font-display text-3xl font-semibold">
            Inside<span className="text-highlight">.</span>
          </p>
          <p className="mt-3 max-w-sm text-canvas/80">
            Brief your project, compare verified designers, and follow the work
            through to handover.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthFooterLink({
  href,
  label,
  cta,
}: {
  href: string;
  label: string;
  cta: string;
}) {
  return (
    <>
      {label}{' '}
      <Link href={href} className="link-underline font-semibold text-ink">
        {cta}
      </Link>
    </>
  );
}
