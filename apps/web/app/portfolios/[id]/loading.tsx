import { Skeleton } from '@/components/ui/feedback';

export default function Loading() {
  return (
    <div className="shell py-32 md:py-40">
      <Skeleton className="h-16 w-2/3" />
      <Skeleton className="mt-10 aspect-[16/9] w-full" />
    </div>
  );
}
