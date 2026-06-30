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

## Recommended Implementation Order

Build **database first**, then **API modules**, then **frontend**. Test each API module in Swagger/Postman before writing UI.

```
PostgreSQL → Prisma schema + seed → Minimal NestJS shell → Auth → User → Portfolio → … → Frontend last
```

| Step | Phase | What | Done when |
|------|-------|------|-----------|
| 1 | Phase 1 | Database schema + migrate + seed | All models visible in Prisma Studio |
| 2 | Phase 0 | Minimal monorepo + NestJS shell | `GET /health` + Swagger running |
| 3 | Phase 2 | API modules in dependency order | Postman collection passes per module |
| 4 | Phase 3 | Next.js frontend | Only after core APIs are stable |
| 5 | Phase 5 | Deploy, test, polish | Production demo ready |

**Parallel (non-blocking):** UI wireframes via [`.stitch/DESIGN.md`](../../.stitch/DESIGN.md) for interim report — does not block backend work.

**Defer:** `apps/web` scaffold, Vercel deploy, Stripe webhooks, Sentry, Husky, full CI/CD until the matching API module is built.

**Schema reference:** [`docs/Interim/Diagrams/08-er.drawio`](Diagrams/08-er.drawio) · [`docs/Proposal/Sections/Functions.md`](../Proposal/Sections/Functions.md)

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
Inside/                          # Scaffold in existing repo root
├── apps/
│   ├── api/                    # NestJS backend — build first
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
│   └── web/                    # Next.js frontend — defer until Phase 3
│       └── src/
│           ├── app/            # App Router pages
│           ├── components/     # Shared UI components
│           ├── lib/            # Utilities, API client, auth helpers
│           └── hooks/          # Custom React hooks
├── packages/
│   ├── database/               # Prisma schema + client — START HERE
│   ├── shared/                 # Shared TypeScript types, constants
│   ├── ui/                     # Shared React components (if needed)
│   └── eslint-config/          # Shared ESLint configuration
├── .stitch/
│   ├── DESIGN.md               # UI design system + Stitch prompts
│   └── SITE.md                 # Wireframe generation order
├── .github/
│   └── workflows/              # GitHub Actions CI/CD — defer to Phase 5
├── docs/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
├── .prettierrc
└── .eslintrc.js
```

---

## Phase 1: Data Model (Week 1) — START HERE

> **First implementation task.** Complete this before NestJS modules or frontend. Only prerequisite: PostgreSQL running + `packages/database` folder (`prisma init`).

### 1.0 — Install Required Tools

| Tool | Version | Command |
|------|---------|---------|
| Node.js | ≥ 20 LTS | `node --version` to verify |
| pnpm | Latest | `npm install -g pnpm` |
| Git | Latest | `git --version` to verify |
| PostgreSQL | 16 | Local install, Docker, or pgAdmin |
| VS Code | Latest | Install from code.visualstudio.com |

Create local database: `inside_dev`

### 1.1 — Initialise Database Package

```bash
mkdir -p packages/database
cd packages/database
pnpm init
pnpm add prisma @prisma/client
npx prisma init
```

Set `DATABASE_URL` in `packages/database/.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/inside_dev
```

### 1.2 — Write Prisma Schema

Define **all** models upfront in `packages/database/schema.prisma` (do not add models incrementally):

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

### 1.3 — Run Migrations

```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
```

### 1.4 — Create Seed Script

Write `packages/database/seed.ts` with:
- 3 users (admin, client, designer)
- 2 portfolios with sample images (use placeholder URLs initially)
- 1 moodboard with brief
- 1 project request + proposal
- 1 project with all 5 stages

Run: `npx prisma db seed`

### 1.5 — Verify in Prisma Studio

```bash
npx prisma studio
```

Confirm all relations (User → Portfolio → Project → Stage → Deliverable) look correct before writing API code.

### 1.6 — Push to Staging (optional, end of Week 1)

When Railway/Neon is set up:
```bash
npx prisma migrate deploy
```

**Phase 1 Outcome:** Full schema migrated, seed data populated, Prisma client generated, relations verified in Prisma Studio.

---

## Phase 0: Minimal API Scaffold (Week 1, after database)

> Build only enough structure to connect NestJS to Prisma. **Do not scaffold `apps/web` yet.**

### 0.1 — Create Monorepo with Turborepo

Scaffold inside the existing `Inside/` repo root:

```bash
pnpm dlx create-turbo@latest .
# Or manually add turbo.json + pnpm-workspace.yaml
```

### 0.2 — Scaffold NestJS API

```bash
cd apps
nest new api --package-manager pnpm
cd ..
mkdir -p packages/shared packages/eslint-config
```

Wire `packages/database` Prisma client into `apps/api` (PrismaService module).

### 0.3 — API Baseline Config

| Task | Priority |
|------|----------|
| `GET /health` endpoint | Now |
| Swagger at `/api/docs` | Now |
| Global validation pipe, Helmet, CORS | Now |
| `apps/api/.env.example` | Now |
| Prettier at repo root | Now |
| `apps/web` (Next.js) | **Defer to Phase 3** |
| Husky / lint-staged | Defer to Phase 5 |
| Vercel / Railway deploy | Defer to Phase 5 |

### 0.4 — Environment Variables

Create `apps/api/.env` (add integration keys only when that module is built):

```
DATABASE_URL=postgresql://...
JWT_SECRET=<random-64-char-string>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
PORT=3001
```

Add when needed:
- `CLOUDINARY_URL` — Portfolio module (Week 3)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Payment module (Week 6)
- `SENTRY_DSN` — Phase 5

### 0.5 — External Accounts (create early, wire later)

| Service | When to wire |
|---------|--------------|
| **Cloudinary** | Portfolio image upload |
| **Stripe** | Payment module |
| **Railway / Neon** | End of Week 1 (optional staging DB) |
| **Vercel** | Phase 3 (frontend) |

**Phase 0 Outcome:** `pnpm --filter api start:dev` runs; health check and Swagger accessible; Prisma client connected.

---

## Phase 2: Backend API — NestJS (Weeks 1–6)

> Test every module in **Swagger** (`http://localhost:3001/api/docs`) and a **Postman collection** before moving to the next module. No frontend required.

### API Testing Conventions

| Tool | Use |
|------|-----|
| Swagger UI | Interactive endpoint testing during development |
| Postman | Saved collection per module; export for interim demo |
| Prisma Studio | Verify DB state after each endpoint test |
| Cookie jar | Postman stores httpOnly JWT cookie after login |

Postman auth flow: `POST /auth/register` → `POST /auth/login` → `GET /auth/me` → protected routes.

### Development Conventions

- Each module is created with `nest g resource modules/<name> --no-spec` (or `--spec` if writing tests)
- DTOs use `class-validator` decorators
- All endpoints return standardised response format: `{ success: boolean, data: T, error?: string }`
- Authentication: JWT guard applied globally, public routes marked with `@Public()` decorator
- Pagination: consistent `?page=1&limit=20` query params

### Week 1 (days 5–7) — Auth Module

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

**Done when:** Full auth flow passes in Swagger/Postman (register → login → `/me` → logout).

### Week 2 — User + Portfolio Modules

**User Module (`/users`)** — complete if not finished in Week 1.

**Portfolio Module (`/portfolios`)**

| Endpoint | Description |
|----------|-------------|
| `POST /portfolios` | Create (designer only) |
| `GET /portfolios` | List with filters: `?style=modern&roomType=living&minBudget=1000&maxBudget=50000` |
| `GET /portfolios/:id` | Detail with designer info |
| `PATCH /portfolios/:id` | Update own portfolio |
| `DELETE /portfolios/:id` | Soft delete |
| `POST /portfolios/:id/images` | Upload multiple images to Cloudinary |

**Done when:** Portfolio list/detail/create pass in Postman; export Postman collection.

### Week 3 — Moodboard + Brief

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

## Phase 3: Web Frontend — Next.js (Weeks 7–10)

> **Do not start Phase 3 until these API modules pass Postman tests:**
> - [ ] Auth + User
> - [ ] Portfolio (list, detail, filters)
> - [ ] Request + Proposal (at least one hiring path)

Map UI tokens from [`.stitch/DESIGN.md`](../../.stitch/DESIGN.md) to `tailwind.config.ts`. Use shadcn/ui components.

### Week 7 — Scaffold Web + Auth UI

```bash
cd apps
pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir
```

| Task | Details |
|------|---------|
| Set up shadcn/ui | `npx shadcn-ui@latest init` — map DESIGN.md colours to Tailwind |
| Layout component | Navbar, sidebar (role-based), footer |
| Auth pages | Login, Register (with role selection), password validation |
| Auth context | Read JWT from httpOnly cookie via `/auth/me`, provide user state globally |
| Route protection | Middleware checks for authenticated routes, redirects to login |
| API client | Axios/fetch with credentials; handle 401 → redirect login |

### Week 8 — Dashboard + Portfolio Discovery

| Task | Details |
|------|---------|
| Client dashboard | Browse designers, recent moodboards, active projects overview |
| Designer dashboard | New requests, active projects, earnings summary |
| Portfolio gallery | Grid layout, image lazy loading, filter sidebar (style, room, budget slider) |
| Portfolio detail | Carousel, designer info, contact button |
| Search | Debounced text search + multi-select filters |

### Week 9 — Moodboard Builder + Brief

| Task | Details |
|------|---------|
| Moodboard list | CRUD UI, grid of moodboard cards |
| Moodboard editor | Responsive grid, drag-and-drop images (react-grid-layout or custom), unsplash/Pexels stock image integration |
| Brief form | Multi-step: styles (checkboxes), rooms (multi-select), budget range (slider), description (textarea) |
| Brief preview | Read-only view, edit option |

### Week 10 — Request + Proposal Flow

| Task | Details |
|------|---------|
| Request form | Select designer, choose brief, set budget, post |
| Request list | Tab: open/closed, status badges |
| Designer proposal submission | Form: scope, timeline, stage-fee breakdown |
| Client proposal comparison | Side-by-side cards, accept/reject buttons |
| Confirmation flow | Success toast, email notification (basic smtp) |

### Week 11 — Project Workspace + Messaging

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

Web app made responsive. Native mobile deferred per Key Decisions. Stitch mobile prompts in `.stitch/DESIGN.md` are for wireframes/report only.

If time permits after Phase 5, a lightweight Expo companion app with notifications, messaging, and quick approvals.

---

## UI Wireframes (parallel — interim report)

Generate in Google Stitch when needed for Chapter 5; does not block backend.

| Priority | Screen ID | Purpose |
|----------|-----------|---------|
| 1 | W-C02 | Discovery feed |
| 2 | W-C07 | Moodboard editor |
| 3 | W-C15 | Proposal comparison |
| 4 | W-C20 | Project workspace |
| 5 | W-C24 | Milestone ledger |

Prompts: [`.stitch/DESIGN.md` Appendix B](../../.stitch/DESIGN.md). Order: [`.stitch/SITE.md`](../../.stitch/SITE.md).

---

## Phase 5: Testing, Polish & Deployment (Weeks 12–13)

### Week 12 — Testing

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

### Week 13 — Polish + Deploy

| Task | Details |
|------|---------|
| Error states | 404, 500, network error, empty state illustrations |
| Loading states | Skeleton loaders for every list/detail view |
| Form validation | Password strength, required fields, file size limits |
| Security audit | Check CORS, rate limiting, input sanitization, SQL injection (covered by Prisma), XSS (covered by React) |
| Performance | Image optimisation (Cloudinary transforms), lazy loading, React.memo where needed |
| Responsive | Test all pages at mobile, tablet, desktop widths |
| SEO | Meta tags, Open Graph for portfolio pages |

Deploy staging/production:

| Task | Details |
|------|---------|
| Railway | Auto-deploy `apps/api` from `main` |
| Vercel | Auto-deploy `apps/web` from `main` |
| API docs | Swagger UI verified and accessible |
| README | Live URLs, env var table, setup steps |
| Demo recording | Full user journey walkthrough |

---

## Week 1 Checklist

### Days 1–2: Database (first)
- [ ] PostgreSQL running; `inside_dev` database created
- [ ] `packages/database` initialised (`prisma init`)
- [ ] Full `schema.prisma` written (all models + enums)
- [ ] `prisma migrate dev --name init`
- [ ] Seed script written and run
- [ ] Relations verified in Prisma Studio

### Days 3–4: Minimal API shell
- [ ] Turborepo + pnpm workspaces in repo root
- [ ] `apps/api` (NestJS) scaffolded, Prisma client wired
- [ ] `GET /health` + Swagger at `/api/docs`
- [ ] `apps/api/.env.example` added
- [ ] `pnpm --filter api start:dev` runs

### Days 5–7: Auth module
- [ ] `POST /auth/register`, `login`, `logout`, `GET /auth/me`
- [ ] JWT httpOnly cookie + global guard
- [ ] Auth flow tested in Swagger and Postman

### Week 2 goal
- [ ] User module complete
- [ ] Portfolio CRUD + filtered list in Postman
- [ ] Postman collection exported

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
