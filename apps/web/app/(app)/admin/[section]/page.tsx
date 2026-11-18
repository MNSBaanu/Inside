'use client';

import { notFound } from 'next/navigation';
import {
  ActivitySection,
  ContactSection,
  NewsletterSection,
  AdminOnly,
  ReportsSection,
  ReviewsSection,
  UsersSection,
  VerificationsSection,
} from '@/components/features/admin/admin-sections';
import {
  OpenProjectsSection,
  ProjectsSection,
  ShopSection,
} from '@/components/features/admin/admin-manage';
import { AnalyticsSection } from '@/components/features/admin/admin-analytics';
import { AnnouncementsSection } from '@/components/features/admin/admin-announcements';
import { PageHeader } from '@/components/ui/page-header';

const sections: Record<
  string,
  { title?: string; description?: string; Section: () => JSX.Element }
> = {
  analytics: { Section: AnalyticsSection },
  users: { Section: UsersSection },
  verifications: {
    title: 'Verifications.',
    description: 'Designers waiting for their credentials to be checked.',
    Section: VerificationsSection,
  },
  projects: { Section: ProjectsSection },
  shop: { Section: ShopSection },
  'open-projects': { Section: OpenProjectsSection },
  reports: { Section: ReportsSection },
  reviews: {
    title: 'Reviews.',
    description: 'Client reviews. Hidden ones do not appear on designer profiles.',
    Section: ReviewsSection,
  },
  announcements: { Section: AnnouncementsSection },
  newsletter: { Section: NewsletterSection },
  activity: { Section: ActivitySection },
  contact: { Section: ContactSection },
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
      {title ? (
        <PageHeader
          variant="app"
          eyebrow="Admin"
          title={title}
          description={description}
        />
      ) : null}
      <div className={title ? 'mt-6' : undefined}>
        <Section />
      </div>
    </AdminOnly>
  );
}
