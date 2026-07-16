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

Implementation order and week-by-week plan: [`ImplementationPlan.md`](ImplementationPlan.md).

---

## Features

- **Portfolio discovery** — search and filter designers by style, room type, and budget
- **Moodboards & briefs** — visual inspiration boards that generate editable project briefs
- **Designer matching** — fit scoring and ranked recommendations
- **Hiring** — open requests, direct invites, proposals, and side-by-side comparison
- **Project workspace** — staged flow (Proposal → Concept → Design → Revision → Completion)
- **Messaging & notifications** — in-app and email alerts; push on mobile
- **Milestone payments** — Stripe escrow with per-stage client approval
- **Dual-role accounts** — one user can operate as client and designer
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

Turborepo monorepo (planned):

```
Inside/
├── apps/
│   ├── api/              # NestJS REST API — build first
│   ├── web/              # Next.js web app — Phase 3
│   └── mobile/           # Expo / React Native — Phase 4
├── packages/
│   ├── database/         # Prisma schema + client — start here
│   ├── shared/           # Shared TypeScript types
│   └── eslint-config/
├── docs/
├── ImplementationPlan.md
└── README.md
```

> Apps and packages are not yet scaffolded. Documentation lives under `docs/`.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ (20 LTS recommended) |
| pnpm | Latest stable |
| PostgreSQL | 14+ (16 recommended) |
| Git | Latest stable |

**External services (development):**

- [Cloudinary](https://cloudinary.com) — image and media storage
- [Stripe](https://stripe.com) — payment processing (test mode)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Inside
```

### 2. Environment variables

Each service will use its own `.env` file. Expected variables:

**API (`apps/api/.env`)**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Token signing secret |
| `CORS_ORIGIN` | Web origin (e.g. `http://localhost:3000`) |
| `PORT` | API port (default `3001`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

**Database (`packages/database/.env`)**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Same PostgreSQL connection string |

**Web (`apps/web/.env.local`)**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:3001`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

**Mobile (`apps/mobile/.env`)**

| Variable | Description |
|----------|-------------|
| `API_URL` | Backend API base URL |

### 3. Install and run

> Setup commands will be finalised when each service is scaffolded. See [`ImplementationPlan.md`](ImplementationPlan.md) Phase 1 / Phase 0.

```bash
pnpm install

# Database (Phase 1)
cd packages/database
npx prisma migrate dev
npx prisma generate
npx prisma db seed

# API (Phase 0+)
pnpm --filter api start:dev

# Web (Phase 3)
pnpm --filter web dev

# Mobile (Phase 4)
cd apps/mobile && npx expo start
```

### 4. Database

```bash
cd packages/database
npx prisma migrate dev
npx prisma generate
```

---

## API

REST API served by NestJS. Interactive docs:

```
http://localhost:3001/api/docs
```

Health check: `GET http://localhost:3001/health`

---

## License

All rights reserved. Academic project
