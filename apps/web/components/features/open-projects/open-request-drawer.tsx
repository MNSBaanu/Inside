'use client';

import { ArrowLeft, CalendarClock, ExternalLink, MapPin, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatMoney } from '@/lib/utils/format';
import type { OpenRequest } from '@/lib/types';
import { Tag } from '@/components/ui/tag';
import { postedAgo } from './open-request-card';

export function OpenRequestDrawer({
  request,
  onClose,
}: {
  request: OpenRequest;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const href = `/requests/${request.id}`;
  const { user, status } = useSession();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const facts = [
    {
      icon: Wallet,
      value: request.budget !== null ? formatMoney(request.budget) : 'Not set',
      label: 'Fixed price',
    },
    { icon: CalendarClock, value: request.timeline ?? 'Not set', label: 'Timeline' },
    { icon: MapPin, value: request.location ?? 'Not set', label: 'Location' },
  ];

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-ink/40 transition-opacity duration-300',
          shown ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="open-request-title"
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col bg-canvas shadow-lift transition-transform duration-300 ease-editorial md:w-[min(64rem,85vw)] md:rounded-l-card',
          shown ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4 md:px-8">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Back to open projects"
            className="rounded-full p-1.5 hover:bg-sand"
          >
            <ArrowLeft aria-hidden className="h-5 w-5" />
          </button>
          <Link
            href={href}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            Open in a new window
            <ExternalLink aria-hidden className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-8 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="min-w-0">
              <h2
                id="open-request-title"
                className="text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-3xl"
              >
                {request.title}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                <span>{postedAgo(request.createdAt)}</span>
                <span className="inline-flex items-center gap-1 border-l border-hairline pl-3">
                  <MapPin aria-hidden className="h-3.5 w-3.5" />
                  {request.location ?? 'Location not set'}
                </span>
              </p>

              <section className="mt-8">
                <h3 className="text-lg font-semibold">Summary</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                  {request.description ?? 'No description provided.'}
                </p>
              </section>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {facts.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-start gap-3 rounded-xl bg-sand/60 p-4">
                    <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{value}</p>
                      <p className="text-xs text-muted">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {request.rooms.length > 0 || request.styles.length > 0 ? (
                <section className="mt-8">
                  <h3 className="text-lg font-semibold">Rooms and styles</h3>
                  {[
                    { label: 'Rooms', items: request.rooms },
                    { label: 'Styles', items: request.styles },
                  ]
                    .filter((group) => group.items.length > 0)
                    .map((group) => (
                      <div key={group.label} className="mt-3">
                        <p className="text-sm text-muted">{group.label}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.items.map((item) => (
                            <Tag key={item}>{item}</Tag>
                          ))}
                        </div>
                      </div>
                    ))}
                </section>
              ) : null}

              <section className="mt-8">
                <h3 className="text-lg font-semibold">Activity on this project</h3>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex gap-1.5">
                    <dt className="text-muted">Proposals:</dt>
                    <dd className="font-semibold">{request.proposalCount}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-muted">Posted on:</dt>
                    <dd className="font-semibold">{formatDate(request.createdAt)}</dd>
                  </div>
                </dl>
              </section>
            </div>

            <aside className="lg:border-l lg:border-hairline lg:pl-8">
              <div className="space-y-3 lg:sticky lg:top-0">
                {status === 'loading' ? null : user?.activeRole === 'DESIGNER' ? (
                  <ButtonLink href={`${href}?propose=1`} size="lg" fullWidth>
                    Send a proposal
                  </ButtonLink>
                ) : (
                  <div className="rounded-xl bg-sand p-4 text-sm">
                    <p className="font-semibold">Only designers can send proposals.</p>
                    <p className="mt-1 text-muted">
                      {!user
                        ? 'Join Inside as a designer to send proposals on open projects.'
                        : user.role === 'DESIGNER'
                          ? 'Switch to your designer view to send a proposal.'
                          : 'Be a designer on Inside to send proposals on open projects.'}
                    </p>
                    {!user ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ButtonLink href="/register" size="sm">
                          Join as a designer
                        </ButtonLink>
                        <ButtonLink
                          href={`/login?next=${encodeURIComponent(href)}`}
                          size="sm"
                          variant="outline"
                        >
                          Sign in
                        </ButtonLink>
                      </div>
                    ) : null}
                  </div>
                )}
                <div className="rounded-xl border border-hairline p-4 text-sm">
                  <p className="text-muted">Client budget</p>
                  <p className="mt-1 text-xl font-semibold">
                    {request.budget !== null ? formatMoney(request.budget) : 'Not set'}
                  </p>
                  <p className="mt-3 text-muted">
                    {request.proposalCount}{' '}
                    {request.proposalCount === 1 ? 'designer has' : 'designers have'} sent a
                    proposal
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
