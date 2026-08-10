import { Suspense } from 'react';
import { BriefWizard } from '@/components/briefs/brief-wizard';

export default function NewBriefPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <BriefWizard mode="create" />
    </Suspense>
  );
}
