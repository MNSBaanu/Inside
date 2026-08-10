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
│   ├── api/              # NestJS REST API (auth, users, portfolios, moodboards/briefs)
│   ├── web/              # Next.js web app — Phase 3 (auth + discovery)
│   └── mobile/           # Expo / React Native — Phase 4 (not scaffolded yet)
├── packages/
│   ├── database/         # Prisma schema, migrations, seed
│   ├── shared/           # Shared TypeScript types (stub)
│   └── eslint-config/
├── docs/
├── Checklist.docx
└── README.md
```

**Current status:** Nest API Phase 2 complete. Web: Steps 34–36 (scaffold, auth/profile, discovery/portfolios/favourites). Next: Step 37. Mobile later.

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

### Demo credentials (after `db:seed`)

Password for all seed users: **`Password123!`**

| Email | Role | Notes |
|-------|------|--------|
| `client@inside.test` | CLIENT | Primary client demo |
| `client2@inside.test` | CLIENT | Second client |
| `designer@inside.test` | DESIGNER | Dual-role capable (CLIENT ↔ DESIGNER) |
| `designer2@inside.test` | DESIGNER | Verification pending |
| `admin@inside.test` | ADMIN | Admin moderation |

Web login: http://localhost:3000/login (demo fill buttons on the page).

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
| GET | `/portfolios` | List published (style, roomType, budget, page) |
| GET | `/portfolios/mine` | Own portfolios (designer mode) |
| GET | `/portfolios/:id` | Detail (owners see drafts) |
| POST | `/portfolios` | Create (designer mode) |
| PATCH | `/portfolios/:id` | Update own |
| DELETE | `/portfolios/:id` | Delete own |
| POST | `/portfolios/:id/images` | Add image |
| DELETE | `/portfolios/:id/images/:imageId` | Remove image |
| GET/POST | `/favourites` | List / add favourite designer (client mode) |
| DELETE | `/favourites/:designerId` | Remove favourite |
| GET/POST | `/moodboards` | List / create (client mode) |
| GET/PATCH/DELETE | `/moodboards/:id` | Own moodboard |
| POST/DELETE | `/moodboards/:id/items[/:index]` | Add / remove inspiration |
| GET/POST | `/briefs` | List / create brief |
| POST | `/moodboards/:id/briefs` | Generate brief from moodboard |
| GET/PATCH/DELETE | `/briefs/:id` | Own brief |
| GET | `/match/designers?briefId=` | Ranked designer matches for a brief |
| POST | `/requests` | Create request (client mode) |
| GET | `/requests` | List my requests (party view) |
| GET/PATCH | `/requests/:id[/cancel,close]` | Get / cancel / close request |
| POST/GET | `/requests/:id/proposals` | Submit / list proposals |
| PATCH | `/proposals/:id/[withdraw,reject,accept]` | Proposal lifecycle |
| GET | `/projects` | List my projects (party view) |
| GET | `/projects/:id` | Get project (party access) |
| PATCH | `/projects/:id/[cancel,on-hold,resume]` | Project status transitions |
| GET | `/projects/:projectId/stages` | List stages |
| PATCH | `/stages/:id/[start,submit,approve,reject]` | Stage transitions |
| POST/GET | `/stages/:stageId/deliverables` | Upload / list deliverables |
| PATCH | `/deliverables/:id/feedback` | Client feedback |
| POST/GET | `/projects/:projectId/messages` | Send / list messages |
| PATCH | `/projects/:projectId/messages/read-all` | Mark received messages read |
| PATCH | `/messages/:id/read` | Mark one message read |
| GET | `/projects/:projectId/payments` | List milestone payments |
| PATCH | `/payments/:id/[pay,release]` | Pay / release milestone (stub) |
| POST | `/projects/:projectId/reviews` | Client review on completed project |
| GET | `/designers/:designerId/reviews` | Public reviews + summary |
| GET/PATCH | `/notifications[/:id/read,/read-all]` | List / mark read |
| POST/GET | `/reports[,/mine]` | File / list my reports |
| GET/POST/DELETE | `/blocks[,/:blockedId]` | Block / unblock / list |
| POST/GET | `/verifications[,/mine]` | Designer submits / lists own |
| GET/PATCH | `/verifications/admin/pending[,/:id/approve,/:id/reject]` | Admin verification queue |
| GET/PATCH | `/admin/users[,/:id/suspend,/:id/reactivate]` | Admin user management |
| GET/PATCH | `/admin/reports[,/:id/resolve,/:id/dismiss]` | Admin report queue |
| GET | `/health` | API + database status |

```bash
pnpm --filter api start:dev
pnpm --filter api test          # unit
pnpm --filter api test:e2e      # migrates inside_test, then e2e
```

**CI:** On every push/PR to `main`, GitHub Actions runs API unit + e2e (`.github/workflows/ci.yml`). Web tests will be added when `apps/web` exists.

**Postman:** Import [`docs/postman/Inside.postman_collection.json`](docs/postman/Inside.postman_collection.json) + [`docs/postman/Inside.local.postman_environment.json`](docs/postman/Inside.local.postman_environment.json). See [`docs/postman/README.md`](docs/postman/README.md).

---

## License

All rights reserved. Academic project
