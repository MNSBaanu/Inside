import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@inside/database';
import { PrismaService } from '../../../database/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const prisma = {
    product: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new ProductsService(prisma as unknown as PrismaService);

  const row = {
    id: 'p1',
    name: 'Oak Sofa',
    description: 'Comfortable',
    category: 'Seating',
    style: 'Scandinavian',
    price: new Prisma.Decimal('189000.00'),
    imageUrl: 'https://images.unsplash.com/photo-1',
    sellerName: 'Atelier',
    sellerUrl: 'https://example.com/shop/oak-sofa',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockResolvedValue([1, [row]]);
  });

  it('only lists published products and applies every filter', async () => {
    await service.list({
      q: 'oak',
      category: 'Seating',
      style: 'Scandinavian',
      maxPrice: 200000,
    });

    const where = prisma.product.findMany.mock.calls[0][0].where;
    expect(where).toEqual({
      isPublished: true,
      category: { equals: 'Seating', mode: 'insensitive' },
      style: { equals: 'Scandinavian', mode: 'insensitive' },
      price: { lte: 200000 },
      OR: [
        { name: { contains: 'oak', mode: 'insensitive' } },
        { description: { contains: 'oak', mode: 'insensitive' } },
      ],
    });
  });

  it('returns prices as plain numbers and caps the page size', async () => {
    const result = await service.list({ pageSize: 500 });

    expect(prisma.product.findMany.mock.calls[0][0].take).toBe(50);
    expect(result.data.items[0].price).toBe(189000);
    expect(result.data.total).toBe(1);
  });

  it('does not return unpublished or missing products', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(service.getById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.product.findFirst).toHaveBeenCalledWith({
      where: { id: 'missing', isPublished: true },
    });
  });
});
