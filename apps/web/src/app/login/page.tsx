import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-16">
        <h1 className="font-heading text-3xl tracking-tight">Log in</h1>
        <p className="text-sm text-muted-foreground">
          Auth form lands in Step 35. API client and route gates are ready.
        </p>
        <Link href="/register" className={cn(buttonVariants())}>
          Need an account?
        </Link>
      </main>
    </div>
  );
}
