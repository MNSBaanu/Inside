import { apiRequest } from '@/lib/api/client';
import type { Favourite } from '@/lib/api/types';

export function listFavourites() {
  return apiRequest<{ items: Favourite[] }>('/favourites');
}

export function addFavourite(designerId: string) {
  return apiRequest<{ favourite: Favourite }>('/favourites', {
    method: 'POST',
    body: { designerId },
  });
}

export function removeFavourite(designerId: string) {
  return apiRequest<{ deleted: boolean }>(`/favourites/${designerId}`, {
    method: 'DELETE',
  });
}
