'use client';

import { SignUp } from '@clerk/nextjs';
import { useState } from 'react';
import { AuthFooterLink, AuthLayout } from '@/components/features/auth/auth-layout';
import { cn } from '@/lib/utils/cn';

const roles = [
  {
    value: 'CLIENT' as const,
    title: 'I have a space',
    body: 'Brief a project and hire a designer.',
  },
  {
    value: 'DESIGNER' as const,
    title: 'I am a designer',
    body: 'Show your work and win projects.',
  },
];

export default function RegisterPage() {
  const [role, setRole] = useState<'CLIENT' | 'DESIGNER'>('CLIENT');

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Start your first project."
      description="One account covers briefing, proposals, milestones and messaging."
      footer={
        <AuthFooterLink
          href="/login"
          label="Already have an account?"
          cta="Sign in"
        />
      }
    >
      <div className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="label mb-3 text-ink/70">I am joining as</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={role === option.value}
                className={cn(
                  'rounded-card border p-5 text-left transition-colors duration-300',
                  role === option.value
                    ? 'border-brand bg-brand-soft'
                    : 'border-hairline bg-surface hover:border-ink/30',
                )}
              >
                <span className="block font-display text-lg font-semibold">
                  {option.title}
                </span>
                <span
                  className={cn(
                    'mt-1 block text-sm',
                    role === option.value ? 'text-ink' : 'text-muted',
                  )}
                >
                  {option.body}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <SignUp
          routing="hash"
          signInUrl="/login"
          forceRedirectUrl="/dashboard"
          unsafeMetadata={{ role }}
        />
      </div>
    </AuthLayout>
  );
}
