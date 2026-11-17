'use client';

import { notFound } from 'next/navigation';
import { AdminProjectDetail } from '@/components/features/admin/admin-manage';
import { AdminOnly } from '@/components/features/admin/admin-sections';
import { AdminUserDetail } from '@/components/features/admin/admin-users';
import { PageHeader } from '@/components/ui/page-header';

const details: Record<
  string,
  { title: string; Detail: (props: { id: string }) => JSX.Element }
> = {
  users: { title: 'User details.', Detail: AdminUserDetail },
  projects: { title: 'Project details.', Detail: AdminProjectDetail },
};

export default function AdminDetailPage({
  params,
}: {
  params: { section: string; id: string };
}) {
  const detail = details[params.section];
  if (!detail) notFound();
  const { title, Detail } = detail;

  return (
    <AdminOnly>
      <PageHeader variant="app" eyebrow="Admin" title={title} />
      <div className="mt-6">
        <Detail id={params.id} />
      </div>
    </AdminOnly>
  );
}
