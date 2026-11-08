import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../../../database/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns OK when database responds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    await expect(controller.getHealth()).resolves.toEqual({
      success: true,
      data: { status: 'ok', database: 'up' },
    });
  });

  it('throws 503 when database is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    await expect(controller.getHealth()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
