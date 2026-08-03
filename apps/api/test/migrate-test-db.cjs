/**
 * Apply Prisma migrations to inside_test before e2e runs.
 */
const { execSync } = require('node:child_process');
const path = require('node:path');

const databaseUrl =
  process.env.DATABASE_URL_TEST ??
  'postgresql://postgres:postgres@localhost:5432/inside_test?schema=public';

const databasePackage = path.resolve(__dirname, '../../../packages/database');

execSync('pnpm exec prisma migrate deploy', {
  cwd: databasePackage,
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: 'inherit',
});
