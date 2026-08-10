import { Suspense } from 'react';
import { DiscoverBrowse } from '@/components/portfolios/discover-browse';

export default function ClientHomePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <DiscoverBrowse />
    </Suspense>
  );
}
