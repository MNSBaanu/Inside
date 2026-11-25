import { ConfigService } from '@nestjs/config';
import { Role } from '@inside/database';
import { PrismaService } from '../../../database/prisma.service';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { EmailService } from '../../platform/email/email.service';
import { AdminImportService } from './admin-import.service';
import { AdminManageService } from './admin-manage.service';

describe('AdminImportService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    newsletterSubscriber: { createMany: jest.fn() },
  };
  const config = { get: jest.fn() };
  const email = { send: jest.fn() };
  const activity = { log: jest.fn() };
  const manage = { createProduct: jest.fn() };
  const admin = { id: 'a1', role: Role.ADMIN } as AuthUser;
  let service: AdminImportService;

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue(undefined);
    service = new AdminImportService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
      email as unknown as EmailService,
      activity as unknown as ActivityService,
      manage as unknown as AdminManageService,
    );
  });

  it('creates new users without a password and emails them', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const { data } = await service.importUsers(admin, [
      { name: 'Nimali Perera', email: 'Nimali@Example.com', role: 'Designer' },
    ]);

    expect(data.created).toBe(1);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'nimali@example.com',
        name: 'Nimali Perera',
        role: Role.DESIGNER,
        activeRole: Role.DESIGNER,
      },
    });
    expect(email.send).toHaveBeenCalledTimes(1);
  });

  it('skips existing and repeated emails and reports invalid rows', async () => {
    prisma.user.findUnique.mockImplementation(
      ({ where }: { where: { email: string } }) =>
        where.email === 'taken@example.com' ? { id: 'u1' } : null,
    );

    const { data } = await service.importUsers(admin, [
      { name: 'Taken Person', email: 'taken@example.com', role: 'Client' },
      { name: 'New Person', email: 'new@example.com', role: 'Client' },
      { name: 'New Person', email: 'new@example.com', role: 'Client' },
      { name: 'No Email', email: 'not-an-email', role: 'Client' },
      { name: 'Bad Role', email: 'bad@example.com', role: 'Admin' },
    ]);

    expect(data.created).toBe(1);
    expect(data.skipped).toBe(2);
    expect(data.failed).toBe(2);
    expect(data.errors.map((e) => e.row)).toEqual([5, 6]);
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
  });

  it('never lets an import create an admin', async () => {
    const { data } = await service.importUsers(admin, [
      { name: 'Sneaky Admin', email: 'sneaky@example.com', role: 'ADMIN' },
    ]);
    expect(data.failed).toBe(1);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('adds subscribers once and counts duplicates as skipped', async () => {
    prisma.newsletterSubscriber.createMany.mockResolvedValue({ count: 1 });

    const { data } = await service.importSubscribers(admin, [
      { email: 'a@example.com' },
      { email: 'A@example.com' },
      { email: 'b@example.com' },
      { email: 'nope' },
    ]);

    expect(prisma.newsletterSubscriber.createMany).toHaveBeenCalledWith({
      data: [{ email: 'a@example.com' }, { email: 'b@example.com' }],
      skipDuplicates: true,
    });
    expect(data).toMatchObject({ created: 1, skipped: 1, failed: 1 });
  });

  it('validates product rows with the same rules as the Add item form', async () => {
    const { data } = await service.importProducts(admin, [
      {
        name: 'Oak sofa',
        description: 'Three-seater sofa in solid oak.',
        category: 'Sofas',
        price: '185,000',
        imageUrl: 'https://example.com/not-cloudinary.jpg',
        sellerName: 'Damro',
        sellerUrl: 'https://example.com/sofa',
      },
    ]);
    expect(data.failed).toBe(1);
    expect(manage.createProduct).not.toHaveBeenCalled();
  });
});
