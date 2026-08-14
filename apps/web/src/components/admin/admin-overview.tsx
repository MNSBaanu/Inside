'use client';

import { useEffect, useState } from 'react';
import { Flag, ShieldCheck, Star, Users } from 'lucide-react';
import { InlineAlert } from '@/components/layout/inline-alert';
import { StatCard } from '@/components/layout/stat-card';
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
      value: loading ? '—' : counts.users,
      hint: `${counts.suspended} suspended`,
      icon: <Users className="size-4" />,
    },
    {
      href: '/admin/verifications',
      label: 'Verification queue',
      value: loading ? '—' : counts.verifications,
      hint: 'Designers awaiting review',
      icon: <ShieldCheck className="size-4" />,
    },
    {
      href: '/admin/reports',
      label: 'Open reports',
      value: loading ? '—' : counts.reports,
      hint: 'Trust & safety queue',
      icon: <Flag className="size-4" />,
    },
    {
      href: '/admin/reviews',
      label: 'Reviews',
      value: '·',
      hint: 'Hide or restore public ratings',
      icon: <Star className="size-4" />,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEMO_LIVING}
          alt=""
          className="h-44 w-full object-cover md:h-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.18_0.03_155_/_0.86)_0%,oklch(0.18_0.03_155_/_0.3)_78%)]" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-white/80"
            />
            Admin · Oversight
          </span>
          <h1 className="mt-3 font-heading text-3xl tracking-tight text-white md:text-4xl">
            Platform control
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
            Accounts, designer verification, and trust &amp; safety reports.
          </p>
        </div>
      </section>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.href} {...card} />
        ))}
      </div>
    </div>
  );
}
