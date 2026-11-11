const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchPublic<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as
      | { success: true; data: T }
      | { success: false };
    return payload.success ? payload.data : null;
  } catch {
    return null;
  }
}
