import type { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export const STRIPE = Symbol('STRIPE');

export const stripeProvider: FactoryProvider<Stripe | null> = {
  provide: STRIPE,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    return key ? new Stripe(key) : null;
  },
};
