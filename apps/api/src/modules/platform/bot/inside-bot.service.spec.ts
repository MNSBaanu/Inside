import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@inside/database';
import { PrismaService } from '../../../database/prisma.service';
import type { AuthUser } from '../../identity/auth/auth.service';
import { InsideBotService } from './inside-bot.service';

describe('InsideBotService', () => {
  const prisma = {
    project: { findMany: jest.fn() },
    projectRequest: { findMany: jest.fn() },
  };
  const fetchMock = jest.fn();
  const user = { id: 'u1', name: 'Nadia', role: Role.CLIENT } as AuthUser;
  const turns = [{ role: 'user' as const, text: 'Where is my project?' }];

  const serviceWith = (env: Record<string, string | undefined>) =>
    new InsideBotService(
      prisma as unknown as PrismaService,
      { get: (key: string) => env[key] } as unknown as ConfigService,
    );

  const geminiAnswer = (reply: string, suggestSupport: boolean) => ({
    ok: true,
    json: () =>
      Promise.resolve({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ reply, suggestSupport }) }],
            },
          },
        ],
      }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
    prisma.project.findMany.mockResolvedValue([]);
    prisma.projectRequest.findMany.mockResolvedValue([]);
  });

  it('is unavailable without an API key', async () => {
    await expect(serviceWith({}).ask(user, turns)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('only loads the asking user’s own records', async () => {
    fetchMock.mockResolvedValue(
      geminiAnswer('Your project is in Concept.', false),
    );
    await serviceWith({ GEMINI_API_KEY: 'k' }).ask(user, turns);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ clientId: 'u1' }, { designerId: 'u1' }] },
      }),
    );
  });

  it('returns the reply and whether to suggest support', async () => {
    fetchMock.mockResolvedValue(geminiAnswer('The team can help.', true));
    const answer = await serviceWith({ GEMINI_API_KEY: 'k' }).ask(user, turns);
    expect(answer).toEqual({
      reply: 'The team can help.',
      suggestSupport: true,
    });
  });

  it('points to support instead of failing when Gemini is unavailable', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    const answer = await serviceWith({ GEMINI_API_KEY: 'k' }).ask(user, turns);
    expect(answer.suggestSupport).toBe(true);
  });
});
