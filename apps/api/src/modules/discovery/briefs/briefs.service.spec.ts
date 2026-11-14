import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { PrismaService } from '../../../database/prisma.service';
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
  };

  const client = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  let service: BriefsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.brief.findMany.mockResolvedValue([]);
    service = new BriefsService(prisma as unknown as PrismaService);
  });

  it('blocks a brief identical to an existing one', async () => {
    prisma.brief.findMany.mockResolvedValue([
      {
        styles: ['coastal'],
        rooms: ['Bedroom'],
        budgetRange: '100-200',
        description: 'Nice ',
      },
    ]);

    await expect(
      service.create(client, {
        styles: ['Coastal'],
        rooms: ['Bedroom'],
        budgetRange: '100-200',
        description: 'Nice',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.brief.create).not.toHaveBeenCalled();
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

  it('summarises mood, palette, loves and dislikes into the brief', async () => {
    prisma.moodboard.findUnique.mockResolvedValue({
      id: 'm1',
      clientId: 'c1',
      name: 'Board',
      moodWords: ['Calm', 'Warm'],
      palette: ['Sage', 'Oak'],
      savedItems: [
        { note: 'Soft light', reaction: 'love', loves: ['Lighting'] },
        { loves: ['Lighting', 'Texture'] },
        { note: 'Heavy pattern', reaction: 'dislike', loves: ['Colour'] },
      ],
    });
    prisma.brief.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'b3',
        ...data,
        budgetRange: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        moodboard: { id: 'm1', name: 'Board' },
      }),
    );

    await service.generateFromMoodboard(client, 'm1', {});
    const { description } = prisma.brief.create.mock.calls[0][0].data;
    expect(description).toContain('Feeling: Calm, Warm.');
    expect(description).toContain('Palette: Sage, Oak.');
    expect(description).toContain('Loves: lighting (2), texture (1).');
    expect(description).toContain('Not for them: 1 image (Heavy pattern).');
    expect(description).not.toContain('colour');
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
