/**
 * Force e2e tests onto inside_test so they never mutate inside_dev.
 * setupFiles runs before ConfigModule loads .env (existing env wins over dotenv).
 */
const testDatabaseUrl =
  process.env.DATABASE_URL_TEST ??
  'postgresql://postgres:postgres@localhost:5432/inside_test?schema=public';

process.env.DATABASE_URL = testDatabaseUrl;
process.env.JWT_SECRET =
  process.env.JWT_SECRET ??
  'dev-only-replace-me-abcdefghijklmnopqrstuvwxyz0123456789';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.EXPOSE_DEV_AUTH_TOKENS = 'true';
