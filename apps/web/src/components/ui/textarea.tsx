import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'w-full min-w-0 rounded-lg border border-input bg-background/60 px-3 py-2 text-base shadow-[inset_0_1px_0_oklch(1_0_0_/_0.6)] transition-colors outline-none placeholder:text-muted-foreground/80 hover:border-ring/40 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
