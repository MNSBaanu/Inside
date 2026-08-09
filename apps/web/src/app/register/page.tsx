import { SiteHeader } from '@/components/layout/site-header';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl tracking-tight">Register</h1>
          <p className="text-sm text-muted-foreground">
            Create a client or designer account.
          </p>
        </div>
        <RegisterForm />
      </main>
    </div>
  );
}
