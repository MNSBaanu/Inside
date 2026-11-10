'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/field';
import { cn } from '@/lib/utils/cn';

export function PasswordInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pr-12', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-card text-muted transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-none"
      >
        {visible ? (
          <EyeOff aria-hidden className="h-5 w-5" />
        ) : (
          <Eye aria-hidden className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
