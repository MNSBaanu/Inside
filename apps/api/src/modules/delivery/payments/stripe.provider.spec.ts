import type { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';
import { stripeProvider } from './stripe.provider';

describe('Demo-only Stripe configuration', () => {
  const factory = stripeProvider.useFactory as (
    config: ConfigService,
  ) => Stripe | null;

  it.each([undefined, '', 'sk_live_example', 'rk_live_example'])(
    'disables checkout for %s',
    (key) => {
      expect(
        factory({ get: () => key } as unknown as ConfigService),
      ).toBeNull();
    },
  );

  it.each(['sk_test_example', 'rk_test_example'])(
    'accepts a test-mode key',
    (key) => {
      const client = factory({ get: () => key } as unknown as ConfigService);
      expect(client).not.toBeNull();
      expect(typeof client?.checkout.sessions.create).toBe('function');
    },
  );
});
