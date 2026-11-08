import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils/cn';

const control =
  'w-full rounded-card border border-hairline bg-surface px-4 py-3 text-base text-ink transition-colors duration-200 placeholder:text-muted/70 focus:border-brand focus:outline-none disabled:opacity-60';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="ui-label text-ink/70">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, className)} />;
}

const bareControl =
  'w-full truncate bg-transparent p-0 text-base font-medium text-ink placeholder:font-normal placeholder:text-muted/60 focus:outline-none';

export function BareInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(bareControl, className)} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={cn(control, 'min-h-32', className)} />
  );
}
