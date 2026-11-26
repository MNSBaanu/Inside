const currency = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
});

const date = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const MAX_AMOUNT = 9_999_999_999;

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return currency.format(value);
}

/** "400000-800000" -> "LKR 400,000 – LKR 800,000"; text without figures is returned as typed. */
export function formatBudgetRange(range: string | null | undefined) {
  const figures = (range ?? '').match(/\d+/g)?.map(Number) ?? [];
  if (figures.length === 0) return range?.trim() || null;
  return figures.map((figure) => currency.format(figure)).join(' – ');
}

export function availabilityLabel(
  isAvailable: boolean,
  availableFrom?: string | null,
) {
  if (!isAvailable) return 'Not taking work';
  if (availableFrom && new Date(availableFrom) > new Date()) {
    return `Available from ${formatDate(availableFrom)}`;
  }
  return 'Available';
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '-';
  return date.format(new Date(value));
}

export function titleCase(value: string) {
  const text = value.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
