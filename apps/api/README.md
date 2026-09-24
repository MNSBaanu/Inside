# Inside API

NestJS REST API for Inside: auth, portfolios, moodboards and briefs, designer
matching, requests and proposals, the staged project workspace, milestone
payments, reviews, moderation and admin. Data lives in PostgreSQL through
Prisma (`packages/database`).

## Run locally

From the repository root:

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env

docker compose up -d                          # Postgres 16: inside_dev + inside_test
pnpm --filter @inside/database db:migrate
pnpm --filter @inside/database db:seed        # sample users and projects

pnpm --filter api start:dev
```

- Swagger: http://localhost:3001/api/docs (not served in production)
- Health: http://localhost:3001/health

Every seeded account uses the password `Password123!`, for example
`client@inside.test`, `designer@inside.test` and `admin@inside.test`.

## Environment

| Variable | Needed for |
|----------|------------|
| `DATABASE_URL` | Everything |
| `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_DAYS` | Access and refresh tokens |
| `CORS_ORIGIN` | The web app's origin; also the base of Stripe return links |
| `PORT` | Defaults to `3001` |
| `CLOUDINARY_URL` | Signed uploads; without it upload endpoints return 503 |
| `STRIPE_SECRET_KEY` | Milestone checkout; without it payment endpoints return 503 |
| `EXPOSE_DEV_AUTH_TOKENS` | Dev only: returns email-verify and reset tokens in responses, since no email is sent yet |
| `THROTTLE_DISABLED` | Test runs only |

## Tests

```bash
pnpm --filter api test        # unit tests
pnpm --filter api test:e2e    # migrates inside_test, then runs HTTP tests against it
pnpm --filter api lint
pnpm --filter api build
```

The e2e suite uses `DATABASE_URL_TEST` when set, otherwise `inside_test` on
localhost.
