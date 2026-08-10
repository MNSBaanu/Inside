import { Suspense } from 'react';
import { BriefWizard } from '@/components/briefs/brief-wizard';

export default function EditBriefPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <BriefWizard mode="edit" />
    </Suspense>
  );
}
