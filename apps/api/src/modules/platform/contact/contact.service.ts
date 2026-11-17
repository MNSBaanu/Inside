import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@inside/database';
import { paginate } from '../../../common/dto/pagination-query.dto';
import { PrismaService } from '../../../database/prisma.service';
import type {
  AdminContactQueryDto,
  CreateContactMessageDto,
  SetContactStatusDto,
} from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactMessageDto) {
    await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        topic: dto.topic,
        message: dto.message.trim(),
      },
    });
    return { success: true, data: { received: true } };
  }

  async list(query: AdminContactQueryDto) {
    const { page, pageSize, skip, take } = paginate(query, 20);
    const search = query.search?.trim();
    const where: Prisma.ContactMessageWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.topic ? { topic: query.topic } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { message: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
    ]);
    return { success: true, data: { items, page, pageSize, total } };
  }

  async setStatus(id: string, dto: SetContactStatusDto) {
    const existing = await this.prisma.contactMessage.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Message not found');
    }
    const message = await this.prisma.contactMessage.update({
      where: { id },
      data: { status: dto.status },
    });
    return { success: true, data: { message } };
  }
}
