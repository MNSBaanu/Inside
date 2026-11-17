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

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return currency.format(value);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '-';
  return date.format(new Date(value));
}

export function formatBudgetRange(
  min: number | null | undefined,
  max: number | null | undefined,
) {
  if (min === null && max === null) return 'Budget not set';
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    return `${formatMoney(min)} - ${formatMoney(max)}`;
  }
  return formatMoney(min ?? max);
}

export function titleCase(value: string) {
  const text = value.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
