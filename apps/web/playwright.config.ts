import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests that use the app the way people do. Each run gets its own database
 * (inside_ui), migrated and reset to the sample data, and its own API and web servers
 * on ports 3101 and 3100, so a local dev setup on 3000/3001 is never touched.
 * Needs Postgres running (docker compose up -d postgres).
 */
// Only the Clerk keys come from .env.local; CI passes them as environment variables instead.
let localEnv: Record<string, string | undefined> = {};
try {
  localEnv = parseEnv(readFileSync('.env.local', 'utf8'));
} catch {
  // No .env.local.
}
const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  localEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  '';
const CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY ?? localEnv.CLERK_SECRET_KEY ?? '';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = CLERK_PUBLISHABLE_KEY;
process.env.CLERK_SECRET_KEY = CLERK_SECRET_KEY;
const WEB_PORT = 3100;
const API_PORT = 3101;
const DATABASE_URL =
  process.env.UI_TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/inside_ui?schema=public';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global.setup.ts',
  globalTeardown: './e2e/global.teardown.ts',
  // Tests share one seeded database, so they run one at a time.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: /(home|auth|designers)\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: [
        'pnpm --filter @inside/database exec prisma migrate deploy',
        'pnpm --filter @inside/database exec prisma db seed',
        'pnpm --filter api build',
        'node apps/api/dist/main.js',
      ].join(' && '),
      cwd: '../..',
      url: `http://localhost:${API_PORT}/health`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'test',
        PORT: String(API_PORT),
        DATABASE_URL,
        JWT_SECRET: 'ui-tests-only-abcdefghijklmnopqrstuvwxyz0123456789',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_DAYS: '30',
        CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
        THROTTLE_DISABLED: 'true',
        CLERK_SECRET_KEY,
      },
    },
    {
      command: `pnpm exec next dev --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`,
        NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`,
        // Separate build folder so a running `next dev` on 3000 is unaffected.
        NEXT_DIST_DIR: '.next-ui',
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: CLERK_PUBLISHABLE_KEY,
        // As in CI: no payment provider, even when .env.local has a Stripe key.
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
        CLERK_SECRET_KEY,
      },
    },
  ],
});
