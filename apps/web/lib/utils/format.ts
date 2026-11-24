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
