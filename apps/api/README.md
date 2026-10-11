# Inside API

NestJS backend for the Inside interior design marketplace. Prisma connects it to PostgreSQL. Modules cover authentication, discovery, matching, hiring, staged projects, messages, payments and administration.

## Setup

Run from the repository root with pnpm 10.25.0 (pinned in package.json):

```powershell
npx --yes pnpm@10.25.0 install --frozen-lockfile
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item packages/database/.env.example packages/database/.env
docker compose up -d postgres
pnpm --filter @inside/database db:generate
pnpm --filter @inside/database exec prisma migrate deploy
pnpm --filter api dev
```

Docker Desktop's Linux engine must be running. API: http://localhost:3001. Development Swagger: /api/docs. The /health endpoint checks database connectivity.

Optional demo data: `pnpm --filter @inside/database db:seed`. **This deletes existing application data in the selected database.** Use an expendable demo database. Sample accounts use Password123!; see docs/SEED_DATA.md.

## Environment

See apps/api/.env.example. Set DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_DAYS, PORT and CORS_ORIGIN. Use unique production secrets. CLOUDINARY_URL enables uploads; STRIPE_SECRET_KEY enables Checkout. EXPOSE_DEV_AUTH_TOKENS is opt-in development token exposure and is ignored in production. DATABASE_URL_TEST optionally selects the dedicated API test database.

Existing environment values take precedence outside explicit development mode. Start through the API package so its local .env is found.

## Verification

```powershell
pnpm --filter api build
pnpm --filter api exec tsc --noEmit
pnpm --filter api exec eslint "{src,test}/**/*.ts"
pnpm --filter api test --runInBand
pnpm --filter api test:e2e --runInBand
```

The package lint script uses --fix; the direct ESLint command above inspects without editing. API e2e tests migrate and modify inside_test by default. Web browser tests use inside_ui. Never configure either suite against user data.

## Current integration limits

Notifications are stored in-app; email and mobile push delivery are unfinished. Verification/reset tokens have no production email sender.

Stripe Checkout collects payments. Recording currently requires the client to return and confirm payment; webhook recovery is unfinished. Release changes the milestone record but does not transfer money to a designer. This is not completed escrow/payout functionality.

The root Dockerfile packages the API. Production deployment also requires configured secrets and applied migrations. See PROJECT_REVIEW.md for repair priorities and verification limits.
