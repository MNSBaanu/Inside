import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@inside/database';
import { PrismaService } from '../../../database/prisma.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 12, 50);

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
      ...(query.category
        ? { category: { equals: query.category, mode: 'insensitive' } }
        : {}),
      ...(query.style
        ? { style: { equals: query.style, mode: 'insensitive' } }
        : {}),
      ...(query.maxPrice !== undefined
        ? { price: { lte: query.maxPrice } }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      success: true,
      data: {
        items: products.map((product) => this.serialize(product)),
        page,
        pageSize,
        total,
      },
    };
  }

  async getById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isPublished: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return { success: true, data: { product: this.serialize(product) } };
  }

  private serialize(product: {
    id: string;
    name: string;
    description: string;
    category: string;
    style: string | null;
    price: Prisma.Decimal;
    imageUrl: string;
    sellerName: string;
    sellerUrl: string;
  }) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      style: product.style,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      sellerName: product.sellerName,
      sellerUrl: product.sellerUrl,
    };
  }
}
