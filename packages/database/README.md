# @inside/database

Prisma schema, migrations, client, and seed data for the Inside platform.

## Setup

1. Ensure PostgreSQL is running and create the database:

```bash
createdb inside_dev
# or: CREATE DATABASE inside_dev;
```

2. Copy env and set your connection string:

```bash
cp .env.example .env
# DATABASE_URL=postgresql://user:password@localhost:5432/inside_dev
```

3. From repo root:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm db:studio   # optional UI verification
```

## Seed accounts

| Email | Password | Role |
|-------|----------|------|
| admin@inside.local | Password123! | ADMIN |
| client@inside.local | Password123! | CLIENT (dual-role capable) |
| designer@inside.local | Password123! | DESIGNER |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:migrate` | Run migrations (dev) |
| `pnpm db:seed` | Seed sample data |
| `pnpm db:studio` | Open Prisma Studio |
