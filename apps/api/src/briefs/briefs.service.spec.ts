import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { BriefsService } from './briefs.service';

describe('BriefsService', () => {
  const prisma = {
    brief: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    moodboard: { findUnique: jest.fn() },
    portfolio: { findMany: jest.fn().mockResolvedValue([]) },
  };

  const client = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  let service: BriefsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BriefsService(prisma as unknown as PrismaService);
  });

  it('creates a brief', async () => {
    prisma.brief.create.mockResolvedValue({
      id: 'b1',
      clientId: 'c1',
      moodboardId: null,
      styles: ['Coastal'],
      rooms: ['Bedroom'],
      budgetRange: '100-200',
      description: 'Nice',
      createdAt: new Date(),
      updatedAt: new Date(),
      moodboard: null,
    });

    const result = await service.create(client, {
      styles: ['Coastal'],
      rooms: ['Bedroom'],
      budgetRange: '100-200',
      description: 'Nice',
    });

    expect(result.data.brief.id).toBe('b1');
  });

  it('rejects create without styles/rooms', async () => {
    await expect(
      service.create(client, { styles: [], rooms: ['Bedroom'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('generates brief from moodboard notes', async () => {
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      name: 'Board',
      savedItems: [{ note: 'Soft blues' }],
    });
    prisma.brief.create.mockResolvedValue({
      id: 'b2',
      clientId: 'c1',
      moodboardId: 'm1',
      styles: ['Mixed'],
      rooms: ['General'],
      budgetRange: null,
      description: 'Generated from moodboard "Board": Soft blues',
      createdAt: new Date(),
      updatedAt: new Date(),
      moodboard: { id: 'm1', name: 'Board' },
    });

    const result = await service.generateFromMoodboard(client, 'm1', {});
    expect(result.data.brief.description).toContain('Soft blues');
  });

  it('takes styles and rooms from portfolios saved on the moodboard', async () => {
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      name: 'Board',
      savedItems: [
        { imageUrl: 'https://x.test/1.jpg', portfolioId: 'p1' },
        { imageUrl: 'https://x.test/2.jpg', portfolioId: 'p2' },
        { imageUrl: 'https://x.test/3.jpg', portfolioId: 'p3' },
        { imageUrl: 'https://x.test/4.jpg' },
      ],
    });
    prisma.portfolio.findMany.mockResolvedValue([
      { id: 'p1', style: 'Japandi', roomType: 'Bedroom' },
      { id: 'p2', style: 'Coastal', roomType: 'Kitchen' },
      { id: 'p3', style: 'coastal', roomType: 'Bedroom' },
    ]);
    prisma.brief.create.mockImplementation(({ data }) => ({
      id: 'b3',
      budgetRange: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      moodboard: { id: 'm1', name: 'Board' },
      ...data,
    }));

    const result = await service.generateFromMoodboard(client, 'm1', {});

    expect(result.data.brief.styles).toEqual(['Coastal', 'Japandi']);
    expect(result.data.brief.rooms).toEqual(['Bedroom', 'Kitchen']);
  });

  it('falls back to Mixed / General with no saved portfolios', async () => {
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      name: 'Board',
      savedItems: [{ imageUrl: 'https://x.test/1.jpg' }],
    });
    prisma.brief.create.mockImplementation(({ data }) => ({
      id: 'b4',
      budgetRange: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      moodboard: { id: 'm1', name: 'Board' },
      ...data,
    }));

    const result = await service.generateFromMoodboard(client, 'm1', {});

    expect(prisma.portfolio.findMany).not.toHaveBeenCalled();
    expect(result.data.brief.styles).toEqual(['Mixed']);
    expect(result.data.brief.rooms).toEqual(['General']);
  });

  it('forbids access to another client brief', async () => {
    prisma.brief.findUnique.mockResolvedValue({
      id: 'b1',
      clientId: 'other',
      moodboard: null,
    });

    await expect(service.getById(client, 'b1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('404 when brief missing', async () => {
    prisma.brief.findUnique.mockResolvedValue(null);
    await expect(service.getById(client, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes owned brief', async () => {
    prisma.brief.findUnique.mockResolvedValue({
      id: 'b1',
      clientId: 'c1',
      moodboard: null,
    });
    prisma.brief.delete.mockResolvedValue({});

    const result = await service.remove(client, 'b1');
    expect(result.data.deleted).toBe(true);
  });
});
