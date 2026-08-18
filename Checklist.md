# Inside — Interior Design Service Platform
## Comprehensive Checklist & Implementation Blueprint

> **Single Source of Truth** for project progress, technical implementation, automated testing, deployment, and academic deliverables.
>
> **Current Status:** Phase 2 (Backend API) & Phase 3 (Next.js Web Frontend) core flows implemented. Unit & E2E API tests passing. Web App ready for Playwright E2E automation & Polish. Mobile companion (Phase 4) and final deployment / dissertation (Phase 5) scheduled.

---

## 📌 Where I Am Now

- **Current Phase:** Phase 3 / Phase 5 transition (Web Completion & Automated Testing Integration)
- **Last Completed API Step:** Step 33 (Sprint 7 close-out: API Phase 2 complete — 92 unit tests passing + E2E suites)
- **Web App Status:** Steps 34–40 (Next.js 15 App Router scaffolded with full marketplace flows: Auth, Discovery, Moodboards/Briefs, Matching, Requests/Proposals, Staged Workspace, Payments, Messaging, Trust & Admin Dashboard)
- **Active Focus:** Automated End-to-End Testing with **Playwright**, Web Unit Testing, CI/CD automation, and Mobile MVP setup.
- **Date Updated:** 2026-08-18

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PROJECT PROGRESS MAP                            │
├──────────────┬───────────────────────────────┬──────────────────────────────┤
│ Phase 0 & 1  │ Monorepo Shell & Database     │ [x] 100% COMPLETE            │
│ Phase 2      │ NestJS API Modules (Steps 9-33)│ [x] 100% COMPLETE (92 tests) │
│ Phase 3      │ Next.js Web App (Steps 34-40) │ [x] 95% COMPLETE (Wiring ok) │
│ Automation   │ Playwright E2E + Vitest + CI  │ [ ] IN PROGRESS (Adding now) │
│ Phase 4      │ Expo Mobile Companion         │ [ ] SCHEDULED (Steps 41-43)  │
│ Phase 5      │ Deploy, Harden & Dissertation │ [ ] SCHEDULED (Steps 44-47)  │
└──────────────┴───────────────────────────────┴──────────────────────────────┘
```

---

## 🏗️ PART 0 — Architecture & Project Blueprint

### 1. Project Profile

| Item | Specification |
|------|---------------|
| **Project Name** | **Inside** — Interior Design Service Platform |
| **Domain** | Two-sided marketplace connecting clients & interior designers with visual briefs, stage-gated workspace, and escrow-style milestone payments |
| **Web Tech Stack** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix/Lucide icons |
| **API Tech Stack** | Node.js, NestJS, Prisma ORM, Class-Validator, Passport JWT |
| **Database** | PostgreSQL 16 (`inside_dev` for development, `inside_test` for isolated testing) |
| **Mobile Tech Stack** | Expo / React Native, TypeScript (Companion app: approvals, notifications, chat) |
| **Third-Party Services** | Cloudinary (Media storage), Stripe (Milestone escrow payments) |
| **DevOps & Tooling** | pnpm workspaces, Turborepo, GitHub Actions, Docker Compose, Postman, Swagger UI |
| **Methodology** | Agile (Scrum) — 2-week sprint cycles |
| **Total Duration** | ~22 Weeks |

---

### 2. Key Technical Decisions

| Area | Choice | Rationale |
|------|--------|-----------|
| **Monorepo** | Turborepo + pnpm workspaces | Clean separation of concerns (`apps/api`, `apps/web`, `apps/mobile`, `packages/database`, `packages/shared`) with blazing fast caching |
| **Frontend Styling** | Tailwind CSS + custom component primitives | Full design system control without third-party design lock-in; highly responsive |
| **API Architecture** | NestJS Modular Architecture | Scalable enterprise structure with built-in Dependency Injection, Guards, Interceptors, Pipes |
| **Authentication** | Bearer JWT (Access Token) + Hashed DB Refresh Sessions | Secure token rotation, multi-device session invalidation, role-based guards (`@Roles('CLIENT', 'DESIGNER', 'ADMIN')`) |
| **Role Model** | Dual-Role capability (`activeRole: CLIENT ↔ DESIGNER`) | Allows verified designers to also act as clients without registering separate accounts |
| **E2E Automation** | **Playwright** | Industry standard for cross-browser, reliable, fast end-to-end testing with video recording, tracing, and CI support |
| **API Testing** | Jest + Supertest | Rapid unit testing of service logic + isolated end-to-end HTTP API validation against `inside_test` |
| **API Documentation**| Swagger OpenAPI (`/api/docs`) + Postman Collections | Real-time interactive API schema synchronized with code annotations |
| **Error Tracking** | Sentry (`@sentry/nestjs`, `@sentry/nextjs`) | Production observability and real-time exception reporting |

---

### 3. Repository Structure

```
Inside/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Automated CI: Lint, API Unit/E2E, Web Vitest, Playwright
│       └── deploy.yml             # CD pipeline (Railway API + Vercel Web)
├── apps/
│   ├── api/                       # NestJS Backend API
│   │   ├── src/                   # Auth, Users, Portfolios, Briefs, Matching, Projects, etc.
│   │   ├── test/                  # Supertest e2e integration suites
│   │   └── package.json
│   ├── web/                       # Next.js 15 Frontend Web Application
│   │   ├── src/app/               # App Router pages (public, client, designer, admin)
│   │   ├── src/components/        # UI components & feature blocks
│   │   ├── src/lib/api/           # Type-safe API client layer
│   │   └── tests/e2e/             # Playwright E2E test specs
│   └── mobile/                    # Expo / React Native App (Phase 4)
├── packages/
│   ├── database/                  # Prisma schema, migrations, seed script
│   ├── shared/                    # Shared DTOs, interfaces, and taxonomy constants
│   └── eslint-config/             # Unified code standards
├── docs/                          # Academic documentation & diagrams
│   ├── Approval/                  # Topic approval documentation
│   ├── Interim/                   # Interim report, discussion notes & 13 Draw.io diagrams
│   ├── Proposal/                  # Project proposal, Gantt charts, section markdowns
│   └── postman/                   # Postman collection & environment generators
├── Checklist.md                   # Single source of truth (This file)
├── docker-compose.yml             # Postgres 16 container setup
├── package.json                   # Root workspace scripts
└── turbo.json                     # Turborepo task pipeline definition
```

---

### 4. Automated Testing & Quality Strategy

| Test Layer | Framework / Tool | Execution Trigger | Coverage Target |
|------------|------------------|-------------------|-----------------|
| **API Unit Tests** | Jest | `pnpm --filter api test` / Pre-push / CI | Services, Guards, Pipes, Scoring algorithms (92+ tests) |
| **API Integration / E2E** | Supertest + `inside_test` | `pnpm --filter api test:e2e` / CI | Complete HTTP request-response cycles, DB transactions, RBAC |
| **Web Unit Tests** | Vitest + React Testing Library | `pnpm --filter web test` / CI | Custom hooks, taxonomy helpers, auth state, form validation |
| **Web E2E Automation** | **Playwright** | `pnpm --filter web test:e2e` / CI | Cross-browser multi-role user journeys (Client, Designer, Admin) |
| **Code Style & Linting** | ESLint + Prettier + TypeScript | `pnpm lint` / `pnpm typecheck` | 100% clean type safety and formatting across monorepo |

---

## 📋 Comprehensive Linear Implementation Checklist

---

### PART A — Foundations & Environment Preparation

#### Step 1: Requirements & Scope Confirmation
- [x] Lock functional requirements (FRs) across all 12 system domains (User Management, Portfolio Discovery, Moodboards & Briefs, Matching Engine, Requests & Proposals, Workspace Stages, Messaging & Notifications, Payments, Reviews, Trust & Safety, Mobile, Administration).
- [x] Lock non-functional requirements (NFRs): Security (OWASP, bcrypt, JWT expiry), Performance (<200ms API response), Usability, Availability.
- [x] Confirm actor roles: Client, Designer, Admin, and Dual-Role (`activeRole` switching).
- [x] Confirm out-of-scope boundaries: Generative 3D CAD modeling, live AR furniture placement, logistics/shipping delivery.

#### Step 2: System Design Artefacts Review
- [x] Review Use Case Diagram (`docs/Interim/Diagrams/01-use-case.drawio`).
- [x] Review Activity Diagrams: Hiring Flow (`02-activity-hiring.drawio`), Workspace Flow (`03-activity-workspace.drawio`), Discovery & Brief Flow (`04-activity-discover-brief.drawio`).
- [x] Review DFDs: Context Level 0 (`05-dfd-context.drawio`) and Level 1 (`06-dfd-level1.drawio`).
- [x] Review Sequence Diagrams: Payment Flow (`07-sequence-payment.drawio`), Accept Proposal (`08-sequence-accept-proposal.drawio`), Stage Approval (`09-sequence-stage-approval.drawio`).
- [x] Review Class Diagram (`10-class.drawio`) & ER Diagram (`11-er.drawio`).
- [x] Review 3-Tier Layered Architecture Diagram (`12-3-layer-architecture.drawio`).
- [x] Review Project Management Gantt Schedule (`13-gantt.drawio`).

#### Step 3: Stack Confirmation & Backlog Baseline
- [x] Confirm core tech stack: NestJS, Next.js, Expo, Prisma, PostgreSQL 16, Cloudinary, Stripe.
- [x] Establish Turborepo build pipeline and module dependency graph.
- [x] Agree on linear phase execution: Database → API Shell → Core APIs → Advanced APIs → Web UI → Playwright E2E → Mobile Companion → Final Deploy & Report.

#### Step 4: Developer Tooling Setup
- [x] Node.js v20+ LTS and `pnpm` installed.
- [x] Docker Desktop configured for running PostgreSQL 16.
- [x] Prisma Studio, VS Code extensions (Prisma, Tailwind, ESLint).
- [x] Postman Desktop for API manual inspection.

#### Step 5: External Accounts & Staging Services
- [x] GitHub repository initialized with branch protection on `main`.
- [x] Cloudinary account created for image CDN storage.
- [x] Stripe developer account set up in test mode.
- [x] Railway account prepared for API + PostgreSQL production hosting.
- [x] Vercel account linked for Next.js web deployment.

#### Step 6: Git Standards & Quality Config
- [x] `.gitignore` configured to ignore `.env`, `.env.local`, `dist/`, `node_modules/`, drawio backup files.
- [x] Environment variable templates established (`apps/api/.env.example`, `packages/database/.env.example`, `apps/web/.env.example`).
- [x] Isolated PostgreSQL databases configured: `inside_dev` (development) and `inside_test` (testing).

---

### PART B — Phase 0 & 1: Monorepo, Database & API Shell

#### Step 7: Monorepo Shell & NestJS Foundation
- [x] Initialize Turborepo with `turbo.json` and `pnpm-workspace.yaml`.
- [x] Create workspace packages: `packages/database`, `packages/shared`, `packages/eslint-config`.
- [x] Scaffold `apps/api` with NestJS framework.
- [x] Implement global `PrismaService` with connection lifecycle hooks.
- [x] Setup global `ValidationPipe` (class-validator with whitelist & transform).
- [x] Setup security middleware: Helmet, CORS configuration, centralized API exception filter (`ApiExceptionFilter`).
- [x] Verify `/health` endpoint and Swagger UI documentation at `/api/docs`.

#### Step 8: Database Schema, Migrations & Comprehensive Seed
- [x] Define Prisma schema (`packages/database/prisma/schema.prisma`) with all models:
  - `User`, `Session`, `AuthToken`
  - `Portfolio`, `PortfolioImage`, `Favourite`
  - `Moodboard`, `MoodboardItem`, `Brief`
  - `ProjectRequest`, `Proposal`
  - `Project`, `ProjectStage`, `Deliverable`, `MilestonePayment`
  - `Message`, `Review`, `Notification`
  - `Verification`, `Report`, `Block`, `ActivityLog`
- [x] Add indexes on foreign keys, hot lookup fields, and unique constraints (`Favourite`, `Block`).
- [x] Execute initial migration: `npx prisma migrate dev --name init`.
- [x] Create comprehensive idempotent seed script (`packages/database/prisma/seed.ts`) populating:
  - Admin (`admin@inside.test`), Dual-role Designer (`designer@inside.test`, `designer2@inside.test`), Clients (`client@inside.test`, `client2@inside.test`).
  - Sample portfolios with images, room types, styles, and budget ranges.
  - Active moodboards, briefs, requests, proposals, active projects with 5 stages, messages, notifications, and verification records.
- [x] Verify relations and data integrity in Prisma Studio.

---

### PART C — Phase 2: Core Domain APIs (Sprints 1–7)

#### Step 9: Authentication Module
- [x] Register (`POST /auth/register`), Login (`POST /auth/login`), Logout (`POST /auth/logout`), Refresh (`POST /auth/refresh`).
- [x] Profile Hydration (`GET /auth/me`) using Bearer JWT.
- [x] Password management: Forgot Password (`POST /auth/forgot-password`), Reset Password (`POST /auth/reset-password`), Email Verification (`POST /auth/verify-email`).
- [x] Session tracking with hashed refresh tokens in the database.
- [x] Unit test coverage (`auth.service.spec.ts`, `jwt-expires.spec.ts`) & E2E tests.

#### Step 10: User & Profile Management Module
- [x] Get own profile (`GET /users/me`) and update profile details (`PATCH /users/me`).
- [x] Password update (`PATCH /users/me/password`).
- [x] Role switching for dual-role accounts (`PATCH /users/me/active-role`: `CLIENT` ↔ `DESIGNER`).
- [x] Unit test coverage (`users.service.spec.ts`).

#### Step 11: Sprint 1 Review & Close-out
- [x] Auth & User management tested and verified.

#### Step 12: Portfolio & Discovery Module
- [x] Designer Portfolio CRUD (`POST /portfolios`, `PATCH /portfolios/:id`, `DELETE /portfolios/:id`, `GET /portfolios/mine`).
- [x] Public Discovery Feed with multi-attribute filtering (`GET /portfolios?style=&roomType=&budget=&page=&limit=`).
- [x] Portfolio image upload and management endpoints (`POST /portfolios/:id/images`, `DELETE /portfolios/:id/images/:imageId`).
- [x] Unit test coverage (`portfolios.service.spec.ts`).

#### Step 13: Favourites & Designer Bookmarks Module
- [x] Add favourite designer (`POST /favourites`), list saved designers (`GET /favourites`), remove favourite (`DELETE /favourites/:designerId`).
- [x] Strict authorization: only Client mode can bookmark designers; duplicate prevention.
- [x] Unit test coverage (`favourites.service.spec.ts`).

#### Step 14: Sprint 2 Review & Close-out
- [x] Discovery, Portfolio management, and Favourites verified.

#### Step 15: Moodboard Module
- [x] Client Moodboard CRUD (`POST /moodboards`, `GET /moodboards`, `GET /moodboards/:id`, `PATCH /moodboards/:id`, `DELETE /moodboards/:id`).
- [x] Add/remove inspiration items with image URLs, room types, design tags (`POST/DELETE /moodboards/:id/items`).
- [x] Unit test coverage (`moodboards.service.spec.ts`).

#### Step 16: Structured Brief Generation Module
- [x] Automatic brief generation from visual moodboard items (`POST /moodboards/:id/briefs`).
- [x] Brief CRUD (`GET /briefs`, `GET /briefs/:id`, `PATCH /briefs/:id`, `DELETE /briefs/:id`).
- [x] Unit test coverage (`briefs.service.spec.ts`).

#### Step 17: Designer Matching Engine Module
- [x] Intelligent Fit Scoring algorithm based on multi-factor weighted matching:
  - Style overlap scoring
  - Room type experience match
  - Budget band compatibility
  - Availability and rating weight
- [x] Match results endpoint (`GET /match/designers?briefId=:id`) returning sorted rankings with scoring breakdown.
- [x] Unit test coverage (`matching.service.spec.ts`).

#### Step 18: Sprint 3 Review & Close-out
- [x] Moodboard, Brief auto-generation, and Matching algorithm verified.

#### Step 19: Project Requests Module
- [x] Create open project request or send direct request to specific designer (`POST /requests`).
- [x] Client & Designer request views with status badges (`GET /requests`, `GET /requests/:id`).
- [x] Request lifecycle status management (`PATCH /requests/:id/cancel`, `PATCH /requests/:id/close`).
- [x] Unit test coverage (`requests.service.spec.ts`).

#### Step 20: Proposals Module
- [x] Designer proposal submission (`POST /requests/:id/proposals`) with scope, timeline, and 5-stage fee breakdown.
- [x] Designer withdraw proposal (`PATCH /proposals/:id/withdraw`).
- [x] Client proposal evaluation: Compare proposals, Reject (`PATCH /proposals/:id/reject`), Accept (`PATCH /proposals/:id/accept`).
- [x] Atomic project creation on proposal acceptance (generates `Project` + 5 initial `ProjectStage` records + closes request).
- [x] Unit test coverage (`proposals.service.spec.ts`).

#### Step 21: Sprint 4 Review & Close-out
- [x] Requests, Proposals, and atomic Project creation verified.

#### Step 22: Project Workspace Management
- [x] List party projects (`GET /projects`), get project details (`GET /projects/:id`).
- [x] Project state transitions (`PATCH /projects/:id/cancel`, `PATCH /projects/:id/on-hold`, `PATCH /projects/:id/resume`).
- [x] Unit test coverage (`projects.service.spec.ts`).

#### Step 23: Project Stages (5-Stage Gated Flow)
- [x] List project stages (`GET /projects/:projectId/stages`).
- [x] 5-Stage sequence: `PROPOSAL` → `CONCEPT` → `DESIGN` → `REVISION` → `COMPLETION`.
- [x] Stage transitions: Start (`PATCH /stages/:id/start`), Submit (`PATCH /stages/:id/submit`), Approve (`PATCH /stages/:id/approve`), Reject (`PATCH /stages/:id/reject`).
- [x] Sequential stage gating (advancing to next stage strictly requires client approval of previous stage).
- [x] Unit test coverage (`stages.service.spec.ts`).

#### Step 24: Deliverables & Version Control Module
- [x] Upload versioned deliverables (`POST /stages/:stageId/deliverables`).
- [x] Client feedback loop on deliverables (`PATCH /deliverables/:id/feedback`).
- [x] Unit test coverage (`deliverables.service.spec.ts`).

#### Step 25: Project Messaging Module
- [x] Project-scoped direct messaging (`POST /projects/:projectId/messages`, `GET /projects/:projectId/messages`).
- [x] Message read receipts (`PATCH /messages/:id/read`, `PATCH /projects/:projectId/messages/read-all`).
- [x] Party-only authorization: only assigned client and designer can access project messages.
- [x] Unit test coverage (`messages.service.spec.ts`).

#### Step 26: In-App Notifications Module
- [x] Event-driven notification dispatch (proposals received, stage submitted, stage approved, payment released, messages).
- [x] Notification inbox (`GET /notifications`), mark single/all as read (`PATCH /notifications/:id/read`, `PATCH /notifications/read-all`).
- [x] Unit test coverage (`notifications.service.spec.ts`).

#### Step 27: Sprint 5 Review & Close-out
- [x] Workspace, Stages, Deliverables, Messaging, and Notifications verified.

#### Step 28: Milestone Payments Module
- [x] Milestone Payment ledger (`GET /projects/:projectId/payments`).
- [x] Pay milestone (`PATCH /payments/:id/pay`) and Release milestone funds (`PATCH /payments/:id/release`).
- [x] Strict business rule: Funds release locked until Client approves the corresponding project stage.
- [x] Unit test coverage (`payments.service.spec.ts`).

#### Step 29: Reviews & Ratings Module
- [x] Client review submission on completed projects (`POST /projects/:projectId/reviews`) with 1-5 star rating and comments.
- [x] Public designer review display (`GET /designers/:designerId/reviews`) with aggregate average score.
- [x] Unit test coverage (`reviews.service.spec.ts`).

#### Step 30: Trust & Safety (Report & Block)
- [x] User and content reporting (`POST /reports`, `GET /reports/mine`).
- [x] User blocking (`POST /blocks`, `GET /blocks`, `DELETE /blocks/:blockedId`).
- [x] Enforcement across messaging and discovery feeds.
- [x] Unit test coverage (`reports.service.spec.ts`, `blocks.service.spec.ts`).

#### Step 31: Designer Verification Module
- [x] Designer submits official verification credential evidence (`POST /verifications`, `GET /verifications/mine`).
- [x] Admin pending verification queue (`GET /verifications/admin/pending`, `PATCH /verifications/admin/:id/approve`, `PATCH /verifications/admin/:id/reject`).
- [x] Unit test coverage (`verifications.service.spec.ts`).

#### Step 32: Admin Management Module
- [x] Admin user overview & moderation (`GET /admin/users`, `PATCH /admin/users/:id/suspend`, `PATCH /admin/users/:id/reactivate`).
- [x] Admin report moderation queue (`GET /admin/reports`, `PATCH /admin/reports/:id/resolve`, `PATCH /admin/reports/:id/dismiss`).
- [x] Unit test coverage (`admin.service.spec.ts`).

#### Step 33: Sprint 6 & 7 Review & Close-out
- [x] All 23 API modules verified with 92 passing unit tests + e2e test suite.
- [x] Postman collections generated and organized in `docs/postman/`.

---

### PART D — Phase 3: Next.js Web Frontend (Sprints 7–8)

#### Step 34: Scaffold Next.js Web Application
- [x] Initialize `apps/web` with Next.js 15 (App Router), TypeScript, ESLint.
- [x] Setup Tailwind CSS design system with custom color tokens, responsive utilities, and animations.
- [x] Setup centralized type-safe API client (`src/lib/api/`) with Bearer token authentication header injection and error handling.
- [x] Implement root navigation headers, footers, and role-based route protection (`src/lib/auth/`).

#### Step 35: Web Auth, Profile & Role Switcher
- [x] Login page (`/login`) with fast demo user fill buttons (Client, Designer, Admin).
- [x] Registration page (`/register`) with role selection.
- [x] Forgot password (`/forgot-password`) & Reset password (`/reset-password`) UI.
- [x] Profile management page (`/profile`) with avatar, bio, and password change tabs.
- [x] Header dual-role switcher toggle (`CLIENT` ↔ `DESIGNER`) for dual-role users.

#### Step 36: Web Portfolio Discovery & Designer Showcase
- [x] Discovery Feed (`/discover`) with search bar, multi-select style filters, room type filters, and budget sliders.
- [x] Portfolio detail modal / page with high-res gallery and designer bio.
- [x] Client Favourite / Bookmark toggle button on designer cards.
- [x] Designer Portfolio Manager (`/designer/portfolios`) for creating, editing, and uploading room project case studies.

#### Step 37: Web Moodboards, Visual Briefs & Matching UI
- [x] Moodboard manager & visual board canvas (`/moodboards`).
- [x] Save discovery items directly to moodboards.
- [x] Automated Brief generator (`/briefs/new`) transforming moodboard items into structured requirements.
- [x] Designer Match Results page (`/match`) displaying ranked designer cards with percentage fit scores and compatibility breakdowns.

#### Step 38: Web Requests & Proposals Flow
- [x] Create open request or targeted direct request from match results (`/requests/new`).
- [x] Client Requests Dashboard (`/requests`) with status badges and proposal count.
- [x] Designer Requests Inbox (`/designer/requests`) for submitting stage-by-stage proposals.
- [x] Side-by-side Proposal Comparison view (`/requests/[id]`) with Accept / Reject buttons.

#### Step 39: Web Stage-Gated Project Workspace & Real-Time Messaging
- [x] Project Workspace page (`/projects/[id]`) with horizontal 5-stage progression timeline:
  - `Proposal` → `Concept` → `Design` → `Revision` → `Completion`
- [x] Stage deliverables panel: Designer file upload, version history, and download previews.
- [x] Client Stage Approval / Rejection modal with feedback commentary.
- [x] In-workspace Project Chat panel with polling / real-time updates and unread badges.
- [x] In-app notification center dropdown in main navigation header.

#### Step 40: Web Milestone Payments, Reviews, Trust & Admin
- [x] Milestone Payment Ledger card showing stage fees, escrow status, and Pay / Release actions.
- [x] Client Review modal on project completion with 1–5 star rating and public testimonial.
- [x] User Trust actions: Report User form and Block User button with confirm dialogs.
- [x] Admin Dashboard (`/admin`) with tabs for:
  - User management (view, suspend, reactivate)
  - Designer verification queue (review credentials, approve badge, reject)
  - Platform moderation reports (view complaints, resolve, dismiss)

---

### PART E — Automated Testing & Playwright Integration (Phase 3/5)

#### Step 40.1: Playwright Test Automation Suite Setup
- [ ] Install Playwright in `apps/web`: `pnpm --filter web add -D @playwright/test`.
- [ ] Configure `playwright.config.ts` (baseURL `http://localhost:3000`, webServer automation, screenshot on failure, video on retry, HTML reporter).
- [ ] Add npm scripts in `apps/web/package.json` (`test:e2e`, `test:e2e:ui`, `test:e2e:headed`).
- [ ] Create seed test helper scripts to reset and ensure demo seed data before E2E runs.

#### Step 40.2: Playwright End-to-End Test Matrix
- [ ] **Auth & Session Suite (`auth.spec.ts`):**
  - [ ] Client login with demo button → redirects to `/discover`.
  - [ ] Designer login → displays designer navigation & role badge.
  - [ ] Admin login → displays admin navigation link.
  - [ ] Role switching: Designer switches to Client mode → UI updates immediately.
  - [ ] Logout → clears session and protects private routes.
- [ ] **Discovery, Moodboard & Matching Suite (`discovery-brief.spec.ts`):**
  - [ ] Search and filter portfolio items by style and room type.
  - [ ] Add portfolio item to a new moodboard.
  - [ ] Generate structured project brief from moodboard.
  - [ ] View matching designers and verify fit score breakdown display.
- [ ] **Hiring & Proposal Acceptance Suite (`hiring.spec.ts`):**
  - [ ] Client creates a project request from brief.
  - [ ] Designer submits a proposal with scope and stage fees.
  - [ ] Client compares proposals and accepts designer proposal.
  - [ ] Verify automatic project and 5-stage workspace creation.
- [ ] **Project Workspace & Stage Approval Suite (`workspace.spec.ts`):**
  - [ ] Designer uploads deliverable in active stage.
  - [ ] Client reviews deliverable and approves stage.
  - [ ] Verify next stage unlocks and milestone payment status updates.
  - [ ] Send and verify project chat messages.
- [ ] **Admin & Moderation Suite (`admin.spec.ts`):**
  - [ ] Admin views pending designer verification and approves.
  - [ ] Admin resolves flagged user report.
  - [ ] Verify non-admin users cannot access `/admin`.

#### Step 40.3: Web Unit Testing with Vitest
- [ ] Install Vitest & Testing Library in `apps/web`: `pnpm --filter web add -D vitest @testing-library/react @testing-library/jest-dom jsdom`.
- [ ] Configure `vitest.config.ts`.
- [ ] Add unit tests for critical utility functions (`taxonomy.ts`, `stages.ts`, `api/client.ts`, `time.ts`).
- [ ] Add unit tests for form components and badge renders.

#### Step 40.4: GitHub Actions CI/CD Pipeline Automation
- [ ] Create/Update `.github/workflows/ci.yml`:
  - Linting check across all workspace packages (`pnpm lint`).
  - Database migration & seed on isolated PostgreSQL service container.
  - API unit tests (`pnpm --filter api test`).
  - API E2E integration tests (`pnpm --filter api test:e2e`).
  - Web unit tests (`pnpm --filter web test`).
  - Playwright E2E automation run with artifact report uploads.
  - Enforce passing CI before allowing merge to `main`.

---

### PART F — Phase 4: Expo Mobile Companion App (Sprint 8)

#### Step 41: Scaffold Expo Mobile App
- [ ] Scaffold `apps/mobile` with Expo & TypeScript (`npx create-expo-app`).
- [ ] Setup tab & stack navigation (React Navigation / Expo Router).
- [ ] Setup type-safe API client with secure storage token management (`expo-secure-store`).
- [ ] Setup environment configuration for localhost/LAN API connectivity.

#### Step 42: Mobile MVP Features
- [ ] Mobile Auth & Session restore (Login, Biometrics/SecureStore, Role switch).
- [ ] Active Projects List & Detail screen.
- [ ] 5-Stage progress tracker & Quick Deliverable Preview.
- [ ] Quick Stage Approve / Reject with feedback.
- [ ] Push Notifications setup with Expo Push token registration.
- [ ] Mobile-safe Milestone Payment confirmation.
- [ ] Project chat & direct messaging.
- [ ] Android & iOS simulator validation.

#### Step 43: Sprint 8 Review & Close-out
- [ ] Mobile companion features verified and connected to backend API.

---

### PART G — Phase 5: Hardening, Deployment & Academic Delivery (Sprint 9)

#### Step 44: Comprehensive Quality & Security Hardening
- [ ] Full automated test pass (API Unit + API E2E + Web Vitest + Playwright E2E all green).
- [ ] Security audit: OWASP Top 10 compliance, rate limiting on auth endpoints, CORS origin lock, SQL injection prevention (Prisma parameterized queries), XSS sanitization.
- [ ] Responsive design verification: Mobile, Tablet, Desktop across Chrome, Firefox, Safari, Edge.
- [ ] Performance audit: Lighthouse score > 90 on key pages, database index query optimization.

#### Step 45: Production Cloud Deployment & Monitoring
- [ ] Provision PostgreSQL database on Railway / Neon.
- [ ] Run production migration: `prisma migrate deploy`.
- [ ] Deploy NestJS API to Railway with production environment variables.
- [ ] Deploy Next.js Web App to Vercel with custom domain and SSL.
- [ ] Configure live Cloudinary bucket and Stripe webhook endpoints.
- [ ] Setup Sentry error monitoring and performance tracing.
- [ ] Validate live health checks: `GET https://api.yourdomain.com/health`.

#### Step 46: Academic Documentation & Final Deliverables
- [ ] Update `README.md` with live production URLs, architecture overview, and setup instructions.
- [ ] Write user guide manuals for Client, Designer, and Administrator personas.
- [ ] Compile Dissertation Chapters:
  - Chapter 1: Introduction, Aims, Objectives & Methodology
  - Chapter 2: Literature Review & Evaluation of 3 Similar Systems
  - Chapter 3: Proposed Solution & Scope Specification
  - Chapter 4: Requirement Analysis & Fact-Finding
  - Chapter 5: System Design (Architecture, DFDs, Sequence, Class, ER, UI Wireframes)
  - Chapter 6: Implementation, Automated Testing Matrix & Project Management
  - Chapter 7: Critical Evaluation, Security Analysis & Future Enhancements
- [ ] Produce high-quality End-to-End Demo Video demonstrating full platform lifecycle.
- [ ] Prepare final academic submission package (Source Code, Dissertation PDF, Presentation Slides, Demo Video).

#### Step 47: Final Sprint Close-out & Project Sign-Off
- [ ] Final retrospective and sign-off on all project deliverables.

---

## 🚀 Production Launch Verification Checklist

| Area | Checkpoint Item | Target Status |
|------|-----------------|---------------|
| **API** | All 23 API modules return valid responses in Swagger & Postman | 🟢 Ready |
| **API Tests** | 92+ Unit tests & E2E Supertest integration tests passing | 🟢 Ready |
| **Web** | Complete user flows operational (Auth, Discovery, Moodboards, Workspace, Admin) | 🟢 Ready |
| **Automation** | Playwright E2E tests passing for Client, Designer, and Admin journeys | 🟡 In Progress |
| **CI/CD** | GitHub Actions pipeline executes lint, tests, and Playwright runs on PRs | 🟡 In Progress |
| **Database** | PostgreSQL production migrations deployed and indexed | 🟢 Ready |
| **Security** | Helmet, CORS, JWT expiration, rate limiting, and bcrypt hashing active | 🟢 Ready |
| **Observability**| Sentry error monitoring configured on API and Web | ⚪ Scheduled |
| **Mobile** | Expo companion app tested on emulator/device | ⚪ Scheduled |
| **Academic** | Dissertation report, diagrams, user guide, and demo video completed | ⚪ Scheduled |

---
*Maintained by MNSBaanu — Academic Top-Up Project*
