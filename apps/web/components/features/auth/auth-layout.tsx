import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { authImage } from '@/lib/utils/images';

export function AuthLayout({
  eyebrow,
  title,
  description,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="shell grid items-center gap-16 py-32 md:py-40 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <Badge tone="brand">{eyebrow}</Badge>
        <h1 className="mt-6 font-display text-section font-semibold">{title}</h1>
        <p className="mt-4 text-muted">{description}</p>

        <div className="mt-10">{children}</div>

        <p className="mt-8 text-sm text-muted">{footer}</p>
      </div>

      <div className="relative hidden aspect-[4/5] overflow-hidden rounded-card shadow-lift lg:block">
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
