import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BriefAssistantService } from './brief-assistant.service';

function serviceWith(env: Record<string, string>) {
  return new BriefAssistantService({
    get: (name: string) => env[name],
  } as unknown as ConfigService);
}

function providerAnswer(json: unknown) {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }],
      }),
  };
}

describe('BriefAssistantService', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  it('is disabled without a key and never calls the provider', async () => {
    const service = serviceWith({});
    expect(service.enabled).toBe(false);
    await expect(
      service.suggest('some text here that is long'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the key as a header, not in the URL, and returns cleaned suggestions', async () => {
    fetchMock.mockResolvedValue(
      providerAnswer({
        rooms: ['living room', 'Garage', 'Kitchen', 'Kitchen'],
        styles: ['scandinavian', 'Steampunk'],
        budgetRange: '400,000 - 800,000',
        description: '  A calmer living room.  ',
      }),
    );
    const service = serviceWith({ GEMINI_API_KEY: 'secret-key' });

    const result = await service.suggest(
      'We want a calm living room and kitchen.',
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain('secret-key');
    expect(init.headers['x-goog-api-key']).toBe('secret-key');
    expect(result).toEqual({
      rooms: ['Living Room', 'Kitchen'],
      styles: ['Scandinavian'],
      budgetRange: '400000-800000',
      description: 'A calmer living room.',
    });
  });

  it('drops a budget that is not in the expected format', async () => {
    fetchMock.mockResolvedValue(
      providerAnswer({
        rooms: [],
        styles: [],
        budgetRange: 'around a million-ish',
        description: '',
      }),
    );
    const service = serviceWith({ GEMINI_API_KEY: 'k' });
    const result = await service.suggest('Some long enough description text.');
    expect(result.budgetRange).toBe('');
  });

  it('reports a friendly error when the provider fails or answers badly', async () => {
    const service = serviceWith({ GEMINI_API_KEY: 'k' });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => ({}),
    });
    await expect(
      service.suggest('Some long enough description text.'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    fetchMock.mockRejectedValueOnce(new Error('network down'));
    await expect(
      service.suggest('Some long enough description text.'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'not json' }] } }],
        }),
    });
    await expect(
      service.suggest('Some long enough description text.'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
