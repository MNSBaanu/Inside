'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminProjectDetail } from '@/components/features/admin/admin-manage';
import { AdminOnly } from '@/components/features/admin/admin-sections';
import { AdminUserDetail } from '@/components/features/admin/admin-users';
import { PageHeader } from '@/components/ui/page-header';

const details: Record<
  string,
  {
    title: string;
    back: string;
    Detail: (props: { id: string }) => JSX.Element;
  }
> = {
  users: { title: 'User details.', back: 'All users', Detail: AdminUserDetail },
  projects: {
    title: 'Project details.',
    back: 'All projects',
    Detail: AdminProjectDetail,
  },
};

export default function AdminDetailPage({
  params,
}: {
  params: { section: string; id: string };
}) {
  const detail = details[params.section];
  if (!detail) notFound();
  const { title, back, Detail } = detail;

  return (
    <AdminOnly>
      <Link
        href={`/admin/${params.section}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        {back}
      </Link>
      <PageHeader variant="app" eyebrow="Admin" title={title} />
      <div className="mt-6">
        <Detail id={params.id} />
      </div>
    </AdminOnly>
  );
}
