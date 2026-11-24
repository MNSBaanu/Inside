import { MoodboardSheet } from '@/components/features/moodboards/moodboard-sheet';
import type { MoodboardSummary } from '@/lib/types';

/** A brief's attached moodboard, shown as the printable moodboard sheet. */
export function MoodboardPreview({
  board,
  clientName,
}: {
  board: MoodboardSummary;
  clientName?: string;
}) {
  return (
    <div>
      <p className="ui-label text-muted">Moodboard · {board.name}</p>
      <div className="mt-3">
        <MoodboardSheet
          name={board.name}
          moodWords={board.moodWords}
          palette={board.palette}
          images={board.images}
          clientName={clientName}
        />
      </div>
    </div>
  );
}
