import type { ComponentProps } from 'react';
import { MoodboardPreview } from '@/components/features/moodboards/moodboard-preview';
import { MoodboardReview } from '@/components/features/requests/moodboard-review';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import type { RequestBrief } from '@/lib/types';
import { formatBudgetRange } from '@/lib/utils/format';

/** The client's brief as it was when the request was sent. */
export function BriefCard({
  brief,
  clientName,
  review,
}: {
  brief: RequestBrief;
  clientName?: string;
  review?: Omit<ComponentProps<typeof MoodboardReview>, 'board' | 'clientName'>;
}) {
  const rows: [string, string[]][] = [
    ['Rooms', brief.rooms],
    ['Styles', brief.styles],
  ];
  const budget = formatBudgetRange(brief.budgetRange);

  return (
    <Card className="mt-6">
      <h2 className="font-display text-lg font-semibold">Brief</h2>

      <dl className="mt-4 grid gap-5 sm:grid-cols-3">
        {rows
          .filter(([, values]) => values.length > 0)
          .map(([label, values]) => (
            <div key={label}>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {values.map((value) => (
                  <Tag key={value}>{value}</Tag>
                ))}
              </dd>
            </div>
          ))}
        {budget ? (
          <div>
            <dt className="text-sm text-muted">Budget</dt>
            <dd className="mt-1.5 font-semibold">{budget}</dd>
          </div>
        ) : null}
      </dl>

      {brief.description ? (
        <p className="mt-5 whitespace-pre-line text-muted">{brief.description}</p>
      ) : null}

      {brief.moodboard ? (
        <div className="mt-6 border-t border-hairline pt-5">
          {review ? (
            <MoodboardReview board={brief.moodboard} clientName={clientName} {...review} />
          ) : (
            <MoodboardPreview board={brief.moodboard} clientName={clientName} />
          )}
        </div>
      ) : null}
    </Card>
  );
}
