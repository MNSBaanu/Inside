/** Same-site paths only, so ?next= can't send users to another site. */
export function safeRedirectPath(value: string | null, fallback: string) {
  return value &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/\\')
    ? value
    : fallback;
}

export function safeHref(url: string): string | undefined {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:' ? url : undefined;
  } catch {
    return undefined;
  }
}
