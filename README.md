# Inside

**Interior design marketplace — portfolio discovery, visual briefs, staged collaboration, milestone payments.**

[![Project Status](https://img.shields.io/badge/status-in%20development-yellow)]()
[![Web](https://img.shields.io/badge/web-Next.js%2014-black?logo=next.js)]()
[![API](https://img.shields.io/badge/api-NestJS-E0234E?logo=nestjs)]()
[![Mobile](https://img.shields.io/badge/mobile-React%20Native-61DAFB?logo=react)]()
[![Database](https://img.shields.io/badge/database-PostgreSQL-4169E1?logo=postgresql)]()

**Done by MNSBaanu**

## Overview

Inside is a full-stack platform that connects **clients** and **interior designers** in one workflow. Clients browse completed room projects, build moodboards, submit structured briefs, hire designers, and approve work at each stage before funds are released. Designers publish portfolios, respond to requests, deliver concepts through a stage-gated workspace, and receive milestone payments.

Implementation order and week-by-week checklist: [`Checklist.docx`](Checklist.docx).

---

## Features

- **Portfolio discovery** — search and filter designers by style, room type, and budget
- **Moodboards & briefs** — visual inspiration boards that generate editable project briefs
- **Designer matching** — fit scoring and ranked recommendations
- **Hiring** — open requests, direct invites, proposals, and side-by-side comparison
- **Project workspace** — staged flow (Proposal → Concept → Design → Revision → Completion)
- **Messaging & notifications** — in-app and email alerts; push on mobile
- **Milestone payments** — Stripe escrow with per-stage client approval
- **Dual-role accounts** — designers can switch `activeRole` CLIENT ↔ DESIGNER
- **Trust & admin** — verification, reviews, moderation, and platform oversight

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Web | Next.js 14, TypeScript, Tailwind CSS |
| Mobile | Expo / React Native, TypeScript |
| API | Node.js, NestJS, Prisma |
| Database | PostgreSQL |
| Media | Cloudinary |
| Payments | Stripe |
| Tooling | pnpm, Turborepo, Git, GitHub Actions, Postman, Swagger |

---

## Project Structure

Turborepo monorepo:

```
Inside/
├── apps/
│   ├── api/              # NestJS REST API (auth + health — in progress)
│   ├── web/              # Next.js web app — Phase 3 (not scaffolded yet)
│   └── mobile/           # Expo / React Native — Phase 4 (not scaffolded yet)
├── packages/
│   ├── database/         # Prisma schema, migrations, seed
│   ├── shared/           # Shared TypeScript types (stub)
│   └── eslint-config/
├── docs/
├── Checklist.docx
└── README.md
```

**Current status:** PostgreSQL + Prisma schema/seed done; Nest API with auth, user profile/role switch, and automated tests done. Web/mobile come later.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ (20 LTS recommended) |
| pnpm | Latest stable |
| PostgreSQL | 14+ (16 recommended) — via Docker Compose |
| Git | Latest stable |
| Docker Desktop | Required for local Postgres |

**External services (later phases):** Cloudinary, Stripe (test mode).

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Inside
pnpm install
```

### 2. Environment variables

Copy examples:

```bash
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
```

**API (`apps/api/.env`) — required now**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Dev DB (`inside_dev`) |
| `JWT_SECRET` | Access-token signing secret |
| `JWT_EXPIRES_IN` | e.g. `7d`, `12h`, `15m` (honored by the API) |
| `JWT_REFRESH_DAYS` | Refresh session lifetime in days (default `30`) |
| `CORS_ORIGIN` | Web origin (e.g. `http://localhost:3000`) |
| `PORT` | API port (default `3001`) |

Optional for e2e: `DATABASE_URL_TEST` (defaults to `inside_test`).

Cloudinary / Stripe vars are **not required** until those modules are built.

**Database (`packages/database/.env`)**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Same as API for migrate/seed/Studio (`inside_dev`) |

### 3. Install and run

```bash
# Postgres 16 — creates inside_dev + inside_test
docker compose up -d

# Schema + sample data (dev DB)
pnpm --filter @inside/database db:migrate
pnpm --filter @inside/database db:seed

# API
pnpm --filter api start:dev
```

Swagger: http://localhost:3001/api/docs · Health: http://localhost:3001/health

### 4. Database

`docker-compose.yml` runs PostgreSQL 16 on `localhost:5432` with `inside_dev` (development) and `inside_test` (Jest e2e). Defaults: `postgres` / `postgres`.

```bash
pnpm --filter @inside/database db:migrate
pnpm --filter @inside/database db:generate
pnpm --filter @inside/database db:seed
pnpm --filter @inside/database db:studio
```

Prisma Studio: http://localhost:5555

Seed accounts (password `Password123!`): `admin@inside.test`, `client@inside.test`, `client2@inside.test`, `designer@inside.test`, `designer2@inside.test` (verification pending).

---

## API

Auth uses **Bearer JWT** (access token) plus refresh tokens stored hashed in `Session`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register client/designer |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Revoke refresh session |
| GET | `/auth/me` | Current user (Bearer required) |
| POST | `/auth/verify-email` | Verify with AuthToken |
| POST | `/auth/forgot-password` | Create reset token |
| POST | `/auth/reset-password` | Reset password |
| GET | `/users/me` | Current profile (Bearer) |
| PATCH | `/users/me` | Update profile |
| PATCH | `/users/me/password` | Change password |
| PATCH | `/users/me/active-role` | Switch activeRole (designers) |
| GET | `/health` | API + database status |

```bash
pnpm --filter api start:dev
pnpm --filter api test          # unit
pnpm --filter api test:e2e      # migrates inside_test, then e2e
```

---

## License

All rights reserved. Academic project
