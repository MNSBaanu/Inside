# Implementation Plan: Inside Interior Design Service Platform

## Overview

| Item | Detail |
|------|--------|
| **Project** | Interior Design Service Platform (web + API) |
| **Tech Stack** | Next.js 14 (web) · NestJS (API) · PostgreSQL (database) · Prisma (ORM) · Cloudinary (media) · Stripe (payments) |
| **Methodology** | Agile (Scrum) — 2-week sprints |
| **Duration** | ~13 weeks |
| **Team** | Solo developer |
| **Quality Goal** | Production-grade — secure, tested, monitored, documented |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo tool | **Turborepo** | Simpler setup, good for solo dev |
| UI library | **shadcn/ui** (TailwindCSS) | Production standard for Next.js, full code control |
| Auth method | **httpOnly cookie JWT** | XSS-safe, what production apps use |
| State management | **Zustand** (or React Context) | Lightweight, sufficient for solo project |
| Mobile app | **Skip** — make web responsive | Focus time on production-quality web app |
| API docs | **Swagger** (built into NestJS) | Automatic, always in sync |
| Error monitoring | **Sentry** (free tier) | Catch production bugs |
| Logging | **Pino** (structured JSON logs) | Production-grade logging |
| CI/CD | **GitHub Actions** | Auto-test + deploy on push |
| Deployment | **Vercel** (web) + **Railway** (API + PostgreSQL) | Each platform optimised for its service |
| Testing | Jest (unit) + Playwright (e2e) | Built-in with NestJS/Next.js |

---

## Folder Structure

```
inside-platform/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── prisma/             # Schema + migrations (if not extracted)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── common/         # Guards, decorators, filters, pipes, interceptors
│   │       ├── config/         # Environment variables, configuration
│   │       └── modules/        # Feature modules (auth, user, portfolio, etc.)
│   │           ├── auth/
│   │           ├── user/
│   │           ├── portfolio/
│   │           ├── moodboard/
│   │           ├── brief/
│   │           ├── matching/
│   │           ├── request/
│   │           ├── proposal/
│   │           ├── project/
│   │           ├── stage/
│   │           ├── deliverable/
│   │           ├── payment/
│   │           ├── messaging/
│   │           └── review/
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/            # App Router pages
│           ├── components/     # Shared UI components
│           ├── lib/            # Utilities, API client, auth helpers
│           └── hooks/          # Custom React hooks
├── packages/
│   ├── database/               # Prisma schema + client (shared)
│   ├── shared/                 # Shared TypeScript types, constants
│   ├── ui/                     # Shared React components (if needed)
│   └── eslint-config/          # Shared ESLint configuration
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
├── .prettierrc
└── .eslintrc.js
```

---

## Phase 0: Project Scaffolding (Week 1)

### 0.1 — Install Required Tools

| Tool | Version | Command |
|------|---------|---------|
| Node.js | ≥ 20 LTS | `node --version` to verify |
| pnpm | Latest | `npm install -g pnpm` |
| Git | Latest | `git --version` to verify |
| PostgreSQL | 16 | Local install + pgAdmin |
| VS Code | Latest | Install from code.visualstudio.com |

### 0.2 — Create Monorepo with Turborepo

```bash
pnpm dlx create-turbo@latest inside-platform
cd inside-platform
```

### 0.3 — Scaffold Applications

```bash
# Backend API — NestJS
cd apps
nest new api --package-manager pnpm
cd ..

# Web frontend — Next.js
cd apps
pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir
cd ..

# Remove default mobile app (not building mobile)
rm -rf apps/mobile

# Re-organise packages
mkdir -p packages/database packages/shared packages/ui packages/eslint-config
```

### 0.4 — Configure Shared Database Package

```bash
cd packages/database
pnpm init
pnpm add prisma @prisma/client
npx prisma init
```

### 0.5 — Set Up ESLint, Prettier, Git Hooks

```bash
# Prettier config
echo '{"semi": true, "singleQuote": true, "trailingComma": "all"}' > .prettierrc

# Husky (pre-commit hooks) — optional
pnpm add -D husky lint-staged
npx husky init
```

### 0.6 — Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial monorepo scaffold"
git remote add origin https://github.com/your-username/inside-platform.git
git push -u origin main
```

### 0.7 — Deploy Staging Infrastructure

| Service | What to Deploy | How |
|---------|---------------|-----|
| **Railway** | Empty NestJS API + PostgreSQL | Connect GitHub repo → Railway auto-deploys `apps/api` |
| **Neon** (or Railway Postgres) | PostgreSQL database | Create via Railway dashboard |
| **Vercel** | Next.js web app | Connect GitHub → auto-deploy `apps/web` |
| **Cloudinary** | Media storage | Create account → get `CLOUDINARY_URL` |
| **Stripe** | Test payment keys | Create account → get `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` |

### 0.8 — Environment Variables

Create `apps/api/.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET=<random-64-char-string>
JWT_EXPIRES_IN=7d
CLOUDINARY_URL=cloudinary://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENTRY_DSN=https://...
CORS_ORIGIN=http://localhost:3000,https://your-app.vercel.app
```

**Phase 0 Outcome:** Running monorepo with deployable NestJS API, Next.js app, cloud database, and all third-party services configured.

---

## Phase 1: Data Model (Week 1–2)

### 1.1 — Write Prisma Schema

Define all models in `packages/database/schema.prisma`:

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| `User` | id, email, passwordHash, role, isVerified | → Portfolio, Moodboard, Request, Project, Message, Review |
| `Portfolio` | id, title, images, style, roomType, budget | ← User (designer) |
| `Moodboard` | id, name, savedItems | ← User (client), → Brief |
| `Brief` | id, styles, rooms, budgetRange | ← Moodboard, → Request |
| `ProjectRequest` | id, type, status, budget | ← User (client), ← Brief, → Proposal |
| `Proposal` | id, scope, timeline, stageFees, status | ← Request, ← User (designer), → Project |
| `Project` | id, currentStage, status | ← Proposal, ← User (client+designer), → Stage |
| `ProjectStage` | id, stageOrder, name, status, dueDate | ← Project, → Deliverable, → Payment |
| `Deliverable` | id, version, fileUrl, feedback | ← Stage |
| `MilestonePayment` | id, amount, status, stripeIntentId | ← Stage, ← Project |
| `Message` | id, content, isRead | ← Project, ← User (sender), ← User (receiver) |
| `Review` | id, rating, comment | ← Project, ← User (reviewer) |

Include:
- Enums: `Role`, `RequestType`, `RequestStatus`, `ProposalStatus`, `ProjectStatus`, `StageName`, `StageStatus`, `PaymentStatus`
- Indexes on foreign keys and frequently queried fields
- `@updatedAt` on relevant models

### 1.2 — Run Migrations

```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
```

### 1.3 — Create Seed Script

Write `packages/database/seed.ts` with:
- 3 users (admin, client, designer)
- 2 portfolios with sample images (use Cloudinary demo URLs)
- 1 moodboard with brief
- 1 project request + proposal
- 1 project with stages

Run: `npx prisma db seed`

### 1.4 — Verify Schema in Railway

Push migration to production:
```bash
npx prisma migrate deploy
```

**Phase 1 Outcome:** Database schema in production, seed data populated, Prisma client ready.

---

## Phase 2: Backend API — NestJS (Weeks 2–6)

### Development Conventions

- Each module is created with `nest g resource modules/<name> --no-spec` (or `--spec` if writing tests)
- DTOs use `class-validator` decorators
- All endpoints return standardised response format: `{ success: boolean, data: T, error?: string }`
- Authentication: JWT guard applied globally, public routes marked with `@Public()` decorator
- Pagination: consistent `?page=1&limit=20` query params

### Week 2 — Auth + User Module

**Auth Module (`POST /auth`)**

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Create account (email, password, name, role) |
| `POST /auth/login` | Authenticate → set httpOnly cookie with JWT |
| `POST /auth/logout` | Clear cookie |
| `GET /auth/me` | Get current user from cookie |

Key files:
- `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`
- `jwt.strategy.ts` — Passport JWT strategy reading from cookie
- `jwt-auth.guard.ts` — Global guard
- `roles.guard.ts` — Role-based access (`@Roles('ADMIN')`)
- `auth.dto.ts` — `RegisterDto`, `LoginDto`

**User Module (`/users`)**

| Endpoint | Description |
|----------|-------------|
| `GET /users/:id` | Get profile (public: name, avatar, bio) |
| `PATCH /users/:id` | Update own profile |
| `POST /users/:id/avatar` | Upload avatar to Cloudinary |

Security:
- Passwords hashed with `bcrypt` (10 rounds)
- Rate limiting on login (`@nestjs/throttler` — 5 attempts/15min)
- Helmet security headers enabled

### Week 3 — Portfolio + Moodboard + Brief

**Portfolio Module (`/portfolios`)**

| Endpoint | Description |
|----------|-------------|
| `POST /portfolios` | Create (designer only) |
| `GET /portfolios` | List with filters: `?style=modern&roomType=living&minBudget=1000&maxBudget=50000` |
| `GET /portfolios/:id` | Detail with designer info |
| `PATCH /portfolios/:id` | Update own portfolio |
| `DELETE /portfolios/:id` | Soft delete |
| `POST /portfolios/:id/images` | Upload multiple images to Cloudinary |

**Moodboard Module (`/moodboards`)**

| Endpoint | Description |
|----------|-------------|
| `POST /moodboards` | Create (client only) |
| `GET /moodboards?clientId=X` | List client's moodboards |
| `PATCH /moodboards/:id` | Update items |
| `DELETE /moodboards/:id` | Delete |

**Brief Module (`/briefs`)**

| Endpoint | Description |
|----------|-------------|
| `POST /briefs` | Create from moodboard |
| `GET /briefs/:id` | Detail |
| `PATCH /briefs/:id` | Update |
| `POST /briefs/:id/generate` | AI-assisted brief generation (future) |

### Week 4 — Matching + Request + Proposal

**Matching Module (`/match`)**

| Endpoint | Description |
|----------|-------------|
| `GET /match/designers?briefId=X` | Return designers sorted by compatibility score |
| `GET /match/fit-score` | Calculate compatibility (style × budget × room type) |

Algorithm (detail to be designed):
- Parse brief styles → match against portfolio style tags
- Budget range → filter designers within budget
- Room type → filter by experience
- Sort by combined score

**Request Module (`/requests`)**

| Endpoint | Description |
|----------|-------------|
| `POST /requests` | Post project request (client) |
| `GET /requests` | List (client sees own, designer sees matching) |
| `GET /requests/:id` | Detail |
| `PATCH /requests/:id` | Update status |
| `DELETE /requests/:id` | Close/withdraw |

**Proposal Module (`/proposals`)**

| Endpoint | Description |
|----------|-------------|
| `POST /proposals/:requestId` | Submit proposal (designer) |
| `GET /proposals/:requestId` | List proposals for a request |
| `PATCH /proposals/:id/accept` | Accept (client) |
| `PATCH /proposals/:id/reject` | Reject (client) |

### Week 5 — Project + Stage + Deliverable

**Project Module (`/projects`)**

| Endpoint | Description |
|----------|-------------|
| `POST /projects` | Create from accepted proposal |
| `GET /projects` | List user's projects |
| `GET /projects/:id` | Detail with stages |
| `PATCH /projects/:id` | Update timeline/status |

**Stage Module (`/stages`)**

| Endpoint | Description |
|----------|-------------|
| `POST /projects/:id/stages` | Add stage (designer) |
| `GET /projects/:id/stages` | List stages |
| `PATCH /stages/:id/approve` | Approve stage (client) |
| `PATCH /stages/:id/reject` | Reject stage (client) |

State machine:
```
PENDING → IN_REVIEW → APPROVED (or REJECTED → revised → IN_REVIEW)
```

**Deliverable Module (`/deliverables`)**

| Endpoint | Description |
|----------|-------------|
| `POST /stages/:id/deliverables` | Upload deliverable |
| `GET /stages/:id/deliverables` | List versions |
| `PATCH /deliverables/:id/feedback` | Add feedback (client) |

### Week 6 — Payment + Messaging + Review

**Payment Module (`/payments`)**

| Endpoint | Description |
|----------|-------------|
| `POST /payments/create-intent` | Create Stripe PaymentIntent for milestone |
| `POST /payments/confirm` | Confirm payment |
| `POST /payments/release` | Release to designer (after stage approval) |
| `POST /payments/webhook` | Stripe webhook handler |
| `GET /projects/:id/payments` | Payment ledger |

Key considerations:
- Milestone-based: each stage has a fee, released upon approval
- Escrow-like: payment intent created but captured only on approval
- Webhook idempotency to handle duplicate events

**Messaging Module (`/messages`)**

| Endpoint | Description |
|----------|-------------|
| `GET /messages?projectId=X` | Get messages for project |
| `POST /messages` | Send message |
| `WebSocket /chat/:projectId` | Real-time messaging (Socket.io) |
| `PATCH /messages/:id/read` | Mark as read |

**Review Module (`/reviews`)**

| Endpoint | Description |
|----------|-------------|
| `POST /projects/:id/review` | Submit review (client) |
| `GET /designers/:id/reviews` | List designer reviews |
| `GET /designers/:id/rating` | Average rating |

---

## Phase 3: Web Frontend — Next.js (Weeks 6–10)

### Week 6 — Foundation + Auth

| Task | Details |
|------|---------|
| Set up shadcn/ui | `npx shadcn-ui@latest init` — add button, input, card, dialog, form, table, toast |
| Layout component | Navbar, sidebar (role-based), footer |
| Auth pages | Login, Register (with role selection), password validation |
| Auth context | Read JWT from httpOnly cookie via `/auth/me`, provide user state globally |
| Route protection | Middleware checks for authenticated routes, redirects to login |
| API client | Axios instance with interceptor: read cookie, handle 401 → redirect login |

### Week 7 — Dashboard + Portfolio Discovery

| Task | Details |
|------|---------|
| Client dashboard | Browse designers, recent moodboards, active projects overview |
| Designer dashboard | New requests, active projects, earnings summary |
| Portfolio gallery | Grid layout, image lazy loading, filter sidebar (style, room, budget slider) |
| Portfolio detail | Carousel, designer info, contact button |
| Search | Debounced text search + multi-select filters |

### Week 8 — Moodboard Builder + Brief

| Task | Details |
|------|---------|
| Moodboard list | CRUD UI, grid of moodboard cards |
| Moodboard editor | Responsive grid, drag-and-drop images (react-grid-layout or custom), unsplash/Pexels stock image integration |
| Brief form | Multi-step: styles (checkboxes), rooms (multi-select), budget range (slider), description (textarea) |
| Brief preview | Read-only view, edit option |

### Week 9 — Request + Proposal Flow

| Task | Details |
|------|---------|
| Request form | Select designer, choose brief, set budget, post |
| Request list | Tab: open/closed, status badges |
| Designer proposal submission | Form: scope, timeline, stage-fee breakdown |
| Client proposal comparison | Side-by-side cards, accept/reject buttons |
| Confirmation flow | Success toast, email notification (basic smtp) |

### Week 10 — Project Workspace + Messaging

| Task | Details |
|------|---------|
| Project workspace | Stage timeline (vertical or horizontal stepper), current stage highlighted |
| Stage detail | Deliverable upload/download, approval/rejection buttons |
| Deliverable viewer | Image preview, version history |
| Messaging UI | Chat bubble design, WebSocket connection, typing indicator, message list with infinite scroll |
| Payment UI | Ledger table, pay button (Stripe Checkout redirect or embedded) |
| Review form | Star rating (1-5), comment textarea, submit |
| Admin basics | User list, verify designer toggle, basic dashboard |

---

## Phase 4: Mobile App — Skipped

Web app made responsive. If time permits, create a lightweight Expo app with only:

- Push notifications (Expo Notifications)
- Real-time messaging (WebSocket)
- Stage approval quick actions
- Payment confirmations

---

## Phase 5: Testing, Polish & Deployment (Weeks 11–13)

### Week 11 — Testing

| Layer | Tool | What to Test |
|-------|------|-------------|
| API unit | Jest | Service logic, guards, pipes |
| API integration | Supertest | Full request-response cycles for critical flows |
| Web unit | Vitest | Component rendering, hooks |
| Web e2e | Playwright | 3-4 critical user journeys (register → create moodboard → post request → submit proposal → work through project → pay → review) |

Critical flows to test end-to-end:
1. Client: register → create moodboard → generate brief → post request → compare proposals → accept → view project → approve stage → submit review
2. Designer: register → create portfolio → browse requests → submit proposal → upload deliverable
3. Admin: login → verify designer → view reports

### Week 12 — Polish

| Task | Details |
|------|---------|
| Error states | 404, 500, network error, empty state illustrations |
| Loading states | Skeleton loaders for every list/detail view |
| Form validation | Password strength, required fields, file size limits |
| Security audit | Check CORS, rate limiting, input sanitization, SQL injection (covered by Prisma), XSS (covered by React) |
| Performance | Image optimisation (Cloudinary transforms), lazy loading, React.memo where needed |
| Responsive | Test all pages at mobile, tablet, desktop widths |
| SEO | Meta tags, Open Graph for portfolio pages |

### Week 13 — Documentation + Deploy

| Task | Details |
|------|---------|
| API docs | Swagger UI at `GET /api` — verify all endpoints documented |
| README | Project overview, tech stack, setup instructions, environment variables table |
| Deployment guide | Step-by-step: how to deploy from scratch |
| `docs/` | Update all project documentation in repo |
| Final test | Deploy to production Vercel + Railway, run through all flows |
| Demo recording | Record walkthrough of complete user journey |

---

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint

  test-api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: inside_test
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm --filter api test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/inside_test
```

---

## Sentry Error Monitoring

- Install `@sentry/nestjs` on API, `@sentry/nextjs` on web
- Configure DSN from environment variable
- Set up performance tracing for slow endpoints/pages

---

## Weekly Workflow (for each sprint)

1. **Monday**: Pick 3-5 tasks from the sprint backlog
2. **Daily**: `git checkout -b feat/feature-name` → code → `pnpm lint` → commit → push → open PR
3. **Friday**: Merge PR → deploy to staging → test → update backlog

Git branch convention:
- `main` — production-ready
- `feat/portfolio-crud` — new feature
- `fix/payment-webhook` — bug fix

---

## Production Launch Checklist

- [ ] All API endpoints tested with Postman collection
- [ ] Swagger docs published and accessible
- [ ] Stripe webhook working end-to-end (test mode)
- [ ] Cloudinary upload working for images
- [ ] Auth flow works: register → login → protected routes → logout
- [ ] Rate limiting configured on auth endpoints
- [ ] Helmet + CORS configured
- [ ] Sentry reporting errors correctly
- [ ] Railway auto-deploy set up from `main` branch
- [ ] Vercel auto-deploy set up from `main` branch
- [ ] Custom domain configured (optional)
- [ ] README updated with live URLs
