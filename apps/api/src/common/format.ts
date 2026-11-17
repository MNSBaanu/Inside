const lkr = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
});

export function formatLkr(value: unknown) {
  return lkr.format(Number(value)).replace(/\s/g, ' ');
}

export function stageLabel(name: string) {
  const text = name.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
