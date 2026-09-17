import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center py-40">
      <Badge className="w-fit">404</Badge>
      <h1 className="mt-8 max-w-2xl font-display text-section font-semibold">
        This page has not been built yet.
      </h1>
      <p className="mt-6 max-w-md text-lg text-muted">
        The link works, but there is nothing behind it for now. Start from the
        home page instead.
      </p>
      <div className="mt-10">
        <ButtonLink href="/" size="lg">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
