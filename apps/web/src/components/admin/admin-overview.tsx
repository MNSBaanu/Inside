'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatApiError } from '@/lib/api/auth';
import {
  listAdminUsers,
  listOpenReports,
  listPendingVerifications,
} from '@/lib/api/admin';
import { DEMO_LIVING } from '@/lib/media';

type Counts = {
  users: number;
  suspended: number;
  verifications: number;
  reports: number;
};

const EMPTY: Counts = { users: 0, suspended: 0, verifications: 0, reports: 0 };

export function AdminOverview() {
  const [counts, setCounts] = useState<Counts>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [users, verifications, reports] = await Promise.all([
          listAdminUsers(),
          listPendingVerifications(),
          listOpenReports(),
        ]);
        if (cancelled) return;
        setCounts({
          users: users.items.length,
          suspended: users.items.filter((u) => u.status === 'SUSPENDED').length,
          verifications: verifications.items.length,
          reports: reports.items.length,
        });
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      href: '/admin/users',
      label: 'Users',
      value: counts.users,
      copy: `${counts.suspended} suspended`,
    },
    {
      href: '/admin/verifications',
      label: 'Verification queue',
      value: counts.verifications,
      copy: 'Designers awaiting review',
    },
    {
      href: '/admin/reports',
      label: 'Open reports',
      value: counts.reports,
      copy: 'Trust & safety queue',
    },
    {
      href: '/admin/reviews',
      label: 'Reviews',
      value: null as number | null,
      copy: 'Hide or restore public ratings',
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEMO_LIVING}
          alt=""
          className="h-40 w-full object-cover md:h-56"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.82)_0%,oklch(0.18_0.03_155_/_0.35)_78%)]" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
            Admin · Oversight
          </p>
          <h1 className="mt-2 font-heading text-3xl tracking-tight text-white md:text-4xl">
            Platform control
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            Accounts, designer verification, and trust &amp; safety reports.
          </p>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="surface-panel group space-y-2 p-6 transition-shadow hover:shadow-[0_22px_60px_-32px_oklch(0.22_0.02_145_/_0.55)]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {card.label}
            </p>
            <p className="font-heading text-4xl tabular-nums tracking-tight">
              {card.value === null ? '→' : loading ? '—' : card.value}
            </p>
            <p className="text-sm text-muted-foreground">{card.copy}</p>
            <p className="pt-2 text-sm text-primary group-hover:underline">
              Open →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
