import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-16">
        <h1 className="font-heading text-3xl tracking-tight">Register</h1>
        <p className="text-sm text-muted-foreground">
          Registration UI lands in Step 35. Use seed accounts via the API for
          now.
        </p>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Already registered?
        </Link>
      </main>
    </div>
  );
}
