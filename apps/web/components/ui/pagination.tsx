import { Button } from '@/components/ui/button';

export function Pagination({
  page,
  totalPages,
  onPageChange,
  label = 'Pagination',
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={label}
      className="mt-16 flex items-center justify-center gap-4"
    >
      <Button
        variant="outline"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="label text-muted">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
