/** Inside's users are in Sri Lanka: UTC+5:30, no daylight saving. The server runs in UTC. */
export const APP_TIME_ZONE = 'Asia/Colombo';
const OFFSET_MS = (5 * 60 + 30) * 60_000;

/** Sri Lanka wall-clock time of `at`, held in a Date's UTC fields. */
export function toLocalClock(at: Date = new Date()): Date {
  return new Date(at.getTime() + OFFSET_MS);
}

export function fromLocalClock(clock: Date): Date {
  return new Date(clock.getTime() - OFFSET_MS);
}

/** Midnight at the start of the Sri Lanka day containing `at`. */
export function startOfLocalDay(at: Date = new Date()): Date {
  const clock = toLocalClock(at);
  clock.setUTCHours(0, 0, 0, 0);
  return fromLocalClock(clock);
}

/** A YYYY-MM-DD date as Sri Lanka midnight; full timestamps are kept as given. */
export function parseLocalDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00+05:30`)
    : new Date(value);
}
