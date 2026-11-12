'use client';

import { notFound } from 'next/navigation';
import {
  ActivitySection,
  AdminOnly,
  ReportsSection,
  ReviewsSection,
  UsersSection,
  VerificationsSection,
} from '@/components/features/admin/admin-sections';
import { PageHeader } from '@/components/ui/page-header';

const sections: Record<
  string,
  { title: string; description: string; Section: () => JSX.Element }
> = {
  users: {
    title: 'Users.',
    description: 'Every account on the platform. Suspend, reactivate or remove a verified badge.',
    Section: UsersSection,
  },
  verifications: {
    title: 'Verifications.',
    description: 'Designers waiting for their credentials to be checked.',
    Section: VerificationsSection,
  },
  reports: {
    title: 'Reports.',
    description: 'Reported people and content that still need a decision.',
    Section: ReportsSection,
  },
  reviews: {
    title: 'Reviews.',
    description: 'Client reviews. Hidden ones do not appear on designer profiles.',
    Section: ReviewsSection,
  },
  activity: {
    title: 'Activity.',
    description: 'What has happened across projects, plus the admin audit trail.',
    Section: ActivitySection,
  },
};

export default function AdminSectionPage({
  params,
}: {
  params: { section: string };
}) {
  const section = sections[params.section];
  if (!section) notFound();
  const { title, description, Section } = section;

  return (
    <AdminOnly>
      <PageHeader
        variant="app"
        eyebrow="Admin"
        title={title}
        description={description}
      />
      <div className="mt-10">
        <Section />
      </div>
    </AdminOnly>
  );
}
