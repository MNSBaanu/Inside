import { Suspense } from 'react';
import { CreateRequestForm } from '@/components/requests/create-request-form';

export default function NewRequestPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <CreateRequestForm />
    </Suspense>
  );
}
