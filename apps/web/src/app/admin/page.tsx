import { PageHeader } from '@/components/layout/page-header';

const AREAS = [
  {
    title: 'Users',
    copy: 'Review accounts, roles, and account status.',
  },
  {
    title: 'Verification',
    copy: 'Approve designer verification requests.',
  },
  {
    title: 'Reports',
    copy: 'Triage trust & safety reports from clients and designers.',
  },
] as const;

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · Control"
        title="Operations shell"
        description="Placeholder for users, verification, and reports (Step 40). Layout is ready for viva navigation."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {AREAS.map((area) => (
          <article key={area.title} className="surface-panel space-y-3 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Coming next
            </p>
            <h2 className="font-heading text-2xl tracking-tight">{area.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {area.copy}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
