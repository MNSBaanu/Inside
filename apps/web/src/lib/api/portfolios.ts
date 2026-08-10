import { apiRequest } from '@/lib/api/client';
import type { Portfolio, PortfolioListPage } from '@/lib/api/types';

export type ListPortfoliosQuery = {
  style?: string;
  roomType?: string;
  minBudget?: number;
  maxBudget?: number;
  designerId?: string;
  page?: number;
  pageSize?: number;
};

function toQuery(params: ListPortfoliosQuery): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function listPortfolios(query: ListPortfoliosQuery = {}) {
  return apiRequest<PortfolioListPage>(`/portfolios${toQuery(query)}`, {
    auth: false,
  });
}

export function listMyPortfolios() {
  return apiRequest<{ items: Portfolio[] }>('/portfolios/mine');
}

export function getPortfolio(id: string) {
  return apiRequest<{ portfolio: Portfolio }>(`/portfolios/${id}`);
}

export function createPortfolio(body: {
  title: string;
  description?: string;
  style: string;
  roomType: string;
  budget?: number;
  isPublished?: boolean;
  images?: { imageUrl: string; caption?: string }[];
}) {
  return apiRequest<{ portfolio: Portfolio }>('/portfolios', {
    method: 'POST',
    body,
  });
}

export function updatePortfolio(
  id: string,
  body: {
    title?: string;
    description?: string;
    style?: string;
    roomType?: string;
    budget?: number;
    isPublished?: boolean;
  },
) {
  return apiRequest<{ portfolio: Portfolio }>(`/portfolios/${id}`, {
    method: 'PATCH',
    body,
  });
}

export function deletePortfolio(id: string) {
  return apiRequest<{ deleted: boolean }>(`/portfolios/${id}`, {
    method: 'DELETE',
  });
}

export function addPortfolioImage(
  id: string,
  body: { imageUrl: string; caption?: string },
) {
  return apiRequest<{ image: { id: string; imageUrl: string } }>(
    `/portfolios/${id}/images`,
    { method: 'POST', body },
  );
}

export function removePortfolioImage(portfolioId: string, imageId: string) {
  return apiRequest<{ deleted: boolean }>(
    `/portfolios/${portfolioId}/images/${imageId}`,
    { method: 'DELETE' },
  );
}
