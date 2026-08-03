/**
 * Parses JWT_EXPIRES_IN into seconds for @nestjs/jwt.
 * Accepts: plain seconds ("3600") or duration ("15m", "7d", "12h", "30s").
 */
export function parseJwtExpiresIn(value: string | undefined): number {
  const raw = (value ?? '7d').trim();
  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber) && asNumber > 0) {
    return asNumber;
  }

  const match = /^(\d+)\s*([smhd])$/i.exec(raw);
  if (!match) {
    return 60 * 60 * 24 * 7;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return amount * (multipliers[unit] ?? 60 * 60 * 24);
}
