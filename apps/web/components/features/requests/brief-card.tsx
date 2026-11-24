import { MoodboardPreview } from '@/components/features/moodboards/moodboard-preview';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import type { RequestBrief } from '@/lib/types';

/** The client's brief as it was when the request was sent. */
export function BriefCard({ brief }: { brief: RequestBrief }) {
  const rows: [string, string[]][] = [
    ['Rooms', brief.rooms],
    ['Styles', brief.styles],
  ];

  return (
    <Card className="mt-6">
      <p className="ui-label text-muted">Brief</p>

      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        {rows
          .filter(([, values]) => values.length > 0)
          .map(([label, values]) => (
            <div key={label}>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {values.map((value) => (
                  <Tag key={value}>{value}</Tag>
                ))}
              </dd>
            </div>
          ))}
        {brief.budgetRange ? (
          <div>
            <dt className="text-sm text-muted">Budget range</dt>
            <dd className="mt-1 font-semibold">LKR {brief.budgetRange}</dd>
          </div>
        ) : null}
      </dl>

      {brief.description ? (
        <p className="mt-4 whitespace-pre-line text-muted">{brief.description}</p>
      ) : null}

      {brief.moodboard ? (
        <div className="mt-5 border-t border-hairline pt-4">
          <MoodboardPreview board={brief.moodboard} />
        </div>
      ) : null}
    </Card>
  );
}
