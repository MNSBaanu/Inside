import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'onDark';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-canvas hover:bg-brand-deep hover:shadow-lift',
  outline:
    'border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-canvas',
  ghost: 'text-ink hover:bg-sand',
  onDark: 'bg-canvas text-brand-deep hover:bg-sand',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-4 py-2',
  md: 'px-6 py-3',
  lg: 'px-8 py-4',
};

function classesFor(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth?: boolean,
  className?: string,
) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg text-base font-semibold transition-all duration-300 ease-editorial disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={classesFor(variant, size, fullWidth, className)}
    />
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={classesFor(variant, size, fullWidth, className)}
    >
      {children}
    </Link>
  );
}
