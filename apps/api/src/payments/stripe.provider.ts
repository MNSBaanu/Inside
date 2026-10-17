import type { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export const STRIPE = Symbol('STRIPE');

export const stripeProvider: FactoryProvider<Stripe | null> = {
  provide: STRIPE,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    // Settlement and webhook reconciliation are not implemented yet.
    // Fail closed for live keys so the payment demo cannot collect real money.
    return key?.startsWith('sk_test_') || key?.startsWith('rk_test_')
      ? new Stripe(key)
      : null;
  },
};
