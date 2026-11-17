'use client';

import { notFound } from 'next/navigation';
import { AdminOnly } from '@/components/features/admin/admin-sections';
import { AdminUserDetail } from '@/components/features/admin/admin-users';
import { PageHeader } from '@/components/ui/page-header';

export default function AdminUserPage({
  params,
}: {
  params: { section: string; id: string };
}) {
  if (params.section !== 'users') notFound();

  return (
    <AdminOnly>
      <PageHeader variant="app" eyebrow="Admin" title="User details." />
      <div className="mt-6">
        <AdminUserDetail id={params.id} />
      </div>
    </AdminOnly>
  );
}
