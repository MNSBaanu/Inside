import { Skeleton } from '@/components/ui/feedback';

export default function Loading() {
  return (
    <div className="shell py-32 md:py-40">
      <Skeleton className="h-40" />
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-80" />
        ))}
      </div>
    </div>
  );
}
