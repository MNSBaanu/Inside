# Inside

**Interior design marketplace — portfolio discovery, visual briefs, staged collaboration, milestone payments.**

[![Project Status](https://img.shields.io/badge/status-in%20development-yellow)]()
[![Web](https://img.shields.io/badge/web-Next.js%2014-black?logo=next.js)]()
[![API](https://img.shields.io/badge/api-NestJS-E0234E?logo=nestjs)]()
[![Mobile](https://img.shields.io/badge/mobile-React%20Native-61DAFB?logo=react)]()
[![Database](https://img.shields.io/badge/database-PostgreSQL-4169E1?logo=postgresql)]()

---

## Overview

Inside is a full-stack platform that connects **clients** and **interior designers** in one workflow. Clients browse completed room projects, build moodboards, submit structured briefs, hire designers, and approve work at each stage before funds are released. Designers publish portfolios, respond to requests, deliver concepts through a stage-gated workspace, and receive milestone payments.

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
| Mobile | React Native, TypeScript |
| API | Node.js, NestJS, Prisma |
| Database | PostgreSQL |
| Media | Cloudinary |
| Payments | Stripe |
| Tooling | Git, GitHub Actions, Postman, Swagger |

---

## Project Structure

Monorepo layout (planned):

```
inside/
├── api/                  # NestJS REST API
├── web/                  # Next.js web application
├── app/                  # React Native mobile app
├── docs/                 # Project documentation
│   ├── Approval/
│   ├── Intermit/
│   └── Proposal/
└── README.md
```

> `api/`, `web/`, and `app/` are not yet scaffolded. Documentation lives under `docs/`.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ (20 LTS recommended) |
| npm or pnpm | Latest stable |
| PostgreSQL | 14+ |
| Git | Latest stable |

**External services (development):**

- [Cloudinary](https://cloudinary.com) — image and media storage
- [Stripe](https://stripe.com) — payment processing (test mode)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd inside
```

### 2. Environment variables

Each service will use its own `.env` file. Expected variables:

**API (`api/.env`)**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Token signing secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

**Web (`web/.env.local`)**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

**Mobile (`app/.env`)**

| Variable | Description |
|----------|-------------|
| `API_URL` | Backend API base URL |

### 3. Install and run

> Setup commands will be added when each service is scaffolded.

```bash
# API
cd api && npm install && npm run start:dev

# Web
cd web && npm install && npm run dev

# Mobile
cd app && npm install && npx expo start
```

### 4. Database

```bash
cd api
npx prisma migrate dev
npx prisma generate
```

---

## API

REST API served by NestJS. Interactive docs will be available at:

```
http://localhost:3000/api/docs    # Swagger (planned)
```

---

## Documentation

| Path | Contents |
|------|----------|
| [`docs/Proposal/Functions.md`](docs/Proposal/Functions.md) | Functional requirements |
| [`docs/Proposal/diagrams/`](docs/Proposal/diagrams/) | Architecture diagrams |
| [`docs/Proposal/`](docs/Proposal/) | Full project proposal |
| [`docs/Approval/`](docs/Approval/) | Topic approval |

---

## Roadmap

- [x] Topic approval
- [x] Project proposal & requirements draft
- [ ] System design (architecture, database, UI wireframes)
- [ ] API scaffold (`api/`)
- [ ] Web app scaffold (`web/`)
- [ ] Mobile app scaffold (`app/`)
- [ ] Core features (auth, portfolios, projects, payments)
- [ ] Testing & evaluation
- [ ] Production deployment

---

## Contributing

This is an academic final-year project. External contributions are not accepted at this stage. For supervisor review, refer to documentation under `docs/`.

---

## License

All rights reserved. Academic project — not licensed for commercial use.
