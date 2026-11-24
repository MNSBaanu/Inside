/** Image URLs from a moodboard's saved items, leaving out ones the client disliked. */
export function likedImages(savedItems: unknown): string[] {
  if (!Array.isArray(savedItems)) return [];
  return (savedItems as { imageUrl?: unknown; reaction?: unknown }[])
    .filter(
      (item) =>
        item.reaction !== 'dislike' && typeof item.imageUrl === 'string',
    )
    .map((item) => item.imageUrl as string);
}
