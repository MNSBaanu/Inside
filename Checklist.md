# Inside — Interior Design Service Platform
## Comprehensive Checklist & Implementation Blueprint (To-Do Only)

> **Single Source of Truth** for remaining project tasks, web app enhancements, testing, mobile companion, production deployment, and academic deliverables.
>
> **Current Status:** 
> - Phase 0 & 1 (Monorepo Shell, Database, 23 NestJS API Modules) — **100% COMPLETE** (92 unit tests passing).
> - Phase 3 Web Frontend — Core marketplace scaffolded & Playwright E2E automation active in CI.
> - Focus: Closing web frontend feature gaps, Web Unit Testing (Vitest), Mobile Companion (Phase 4), Production Cloud Deploy & Dissertation (Phase 5).

---

## 📌 Project Progress Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PROJECT PROGRESS MAP                            │
├──────────────┬───────────────────────────────┬──────────────────────────────┤
│ Phase 0 & 1  │ Monorepo Shell & Database     │ [x] 100% COMPLETE            │
│ Phase 2      │ NestJS API Modules (Steps 1-33)│ [x] 100% COMPLETE (92 tests) │
│ Phase 3 Core │ Web Pages & Playwright CI     │ [x] 100% COMPLETE            │
│ Web Gaps     │ Web Routes, Uploads & Polish  │ [ ] TO DO (Enhancements)     │
│ Unit Testing │ Web Unit Testing (Vitest)     │ [ ] TO DO (Step 40.3)        │
│ Phase 4      │ Expo Mobile Companion         │ [ ] TO DO (Steps 41-43)      │
│ Phase 5      │ Deploy, Harden & Dissertation │ [ ] TO DO (Steps 44-47)      │
└──────────────┴───────────────────────────────┴──────────────────────────────┘
```

---

## 🏗️ Key Technical Decisions

| Area | Choice | Rationale |
|------|--------|-----------|
| **Monorepo** | Turborepo + pnpm workspaces | Clean separation (`apps/api`, `apps/web`, `apps/mobile`, `packages/database`, `packages/shared`) |
| **Frontend Web** | Next.js 15 (App Router) + Tailwind CSS | Fast SSR/CSR, modern UI primitives, fully responsive |
| **API Architecture** | NestJS Modular Architecture | Scalable enterprise architecture with Dependency Injection, Guards, Pipes, Prisma ORM |
| **Database** | PostgreSQL 16 (`inside_dev`, `inside_test`) | Relational integrity, foreign keys, comprehensive seed |
| **Authentication** | Bearer JWT + Hashed DB Refresh Sessions | Dual-role capability (`CLIENT` ↔ `DESIGNER`), role guards |
| **Mobile App** | Expo / React Native (TypeScript) | Companion app for approvals, notifications, messaging |
| **Testing** | Jest (API Unit), Supertest (API E2E), Playwright (Web E2E), Vitest (Web Unit) | Complete end-to-end automated quality assurance |
| **Cloud Hosting** | Railway (API + PostgreSQL), Vercel (Web) | Cloud-native deployment with automated CI/CD via GitHub Actions |

---

## 📋 Remaining Action Items (To Do)

---

### PART 1 — Web Application Gap Resolution & Feature Polish

#### 1.1 Public Routes & Navigation Gaps
- [ ] **Public Discovery / Portfolios Page (`/portfolios` & `/discover`)**:
  - Create `apps/web/src/app/portfolios/page.tsx` allowing unauthenticated guests to browse portfolios, filter by room/style/budget, and view public designer cards.
  - Update landing page ([app/page.tsx](file:///c:/Users/ASUS%20Vivobook/Desktop/MNSBaanu/Projects/Academic/Topup/Inside/apps/web/src/app/page.tsx)) with direct "Explore Portfolios" and "Find Designers" CTA buttons.
- [ ] **Public Designer Profile Page (`/designers/[id]`)**:
  - Create `apps/web/src/app/designers/[id]/page.tsx` displaying designer avatar, bio, location, verified badge, all published portfolios, and aggregated client ratings/reviews (`GET /designers/:id/reviews`).
- [ ] **Top-Level Match Navigation Route (`/match`)**:
  - Create a top-level `/match` route / redirect leading directly to active brief matching.

#### 1.2 Direct File Uploads & Media Handling
- [ ] **Drag-and-Drop & File Upload Support**:
  - Replace URL-only text inputs in [image-url-field.tsx](file:///c:/Users/ASUS%20Vivobook/Desktop/MNSBaanu/Projects/Academic/Topup/Inside/apps/web/src/components/layout/image-url-field.tsx) and [stage-panel.tsx](file:///c:/Users/ASUS%20Vivobook/Desktop/MNSBaanu/Projects/Academic/Topup/Inside/apps/web/src/components/projects/stage-panel.tsx) with direct file uploads (supporting Cloudinary signed upload or backend multipart/form-data upload).
  - Add client-side image preview, file size/type validation (PDF, PNG, JPG), and upload progress indicators.

#### 1.3 Stripe Escrow Payment UI Flow
- [ ] **Interactive Stripe Checkout / Card Modal**:
  - Implement a Stripe Elements card input modal in [payments-summary.tsx](file:///c:/Users/ASUS%20Vivobook/Desktop/MNSBaanu/Projects/Academic/Topup/Inside/apps/web/src/components/projects/payments-summary.tsx) for paying stage milestone fees.
  - Add payment receipt confirmation state and clear escrow status badge (`PAID (IN ESCROW)` vs `RELEASED`).

#### 1.4 Discovery, Moodboard & Workspace Enhancements
- [ ] **1-Click "Save to Moodboard" Modal**:
  - In [discover-browse.tsx](file:///c:/Users/ASUS%20Vivobook/Desktop/MNSBaanu/Projects/Academic/Topup/Inside/apps/web/src/components/portfolios/discover-browse.tsx), allow clients to click "Add to Moodboard" on any image and pick which moodboard to save it to.
- [ ] **Export Brief to PDF / Print View**:
  - Add a styled print stylesheet and "Download PDF Summary" action on `/client/briefs/[id]`.
- [ ] **Deliverable In-App Lightbox & Previewer**:
  - Add an in-app image lightbox and PDF previewer inside [stage-panel.tsx](file:///c:/Users/ASUS%20Vivobook/Desktop/MNSBaanu/Projects/Academic/Topup/Inside/apps/web/src/components/projects/stage-panel.tsx) so clients can view deliverables side-by-side with feedback notes.
- [ ] **Automatic Post-Completion Review Modal**:
  - Trigger an automatic review submission modal when Stage 5 (`COMPLETION`) is approved and final milestone funds are released.

#### 1.5 Admin Dashboard Analytics & Activity Logs
- [ ] **Admin Visual Analytics Charts**:
  - Add visual metric charts (Monthly GMV, Project Status distribution, User Growth) in [admin-overview.tsx](file:///c:/Users/ASUS%20Vivobook/Desktop/MNSBaanu/Projects/Academic/Topup/Inside/apps/web/src/components/admin/admin-overview.tsx).
- [ ] **System Activity Audit Log Table**:
  - Add an Activity Logs tab in `/admin` connected to the backend `activity` service to track administrative actions and user events.

#### 1.6 UI / UX Polish & Theme Customization
- [ ] **Global Toast Notification System**:
  - Integrate a global toast provider (e.g. Sonner) for instant feedback on user actions (e.g., "Saved to Favourites", "Changes Submitted", "Deliverable Added").
- [ ] **Light / Dark Mode Switcher**:
  - Add a theme toggle button in the header and profile settings supporting Light, Dark, and System modes.

---

### PART 2 — Web Unit Testing with Vitest (Step 40.3)

#### Step 40.3: Web Unit Testing Setup & Test Suites
- [ ] Install Vitest & Testing Library in `apps/web`: `pnpm --filter web add -D vitest @testing-library/react @testing-library/jest-dom jsdom`
- [ ] Configure `vitest.config.ts` for Next.js 15 App Router
- [ ] Add unit tests for utility functions (`taxonomy.ts`, `stages.ts`, `api/client.ts`, `time.ts`)
- [ ] Add unit tests for UI components (Status badges, Role switcher, Auth forms, Payments summary)
- [ ] Add `test:web` script to CI pipeline (`.github/workflows/ci.yml`)

---

### PART 3 — Phase 4: Expo Mobile Companion App (Sprint 8)

#### Step 41: Scaffold Expo Mobile App
- [ ] Scaffold `apps/mobile` with Expo & TypeScript (`npx create-expo-app`)
- [ ] Setup tab & stack navigation (React Navigation / Expo Router)
- [ ] Setup type-safe API client with secure storage token management (`expo-secure-store`)
- [ ] Setup environment configuration for localhost/LAN API connectivity

#### Step 42: Mobile MVP Features
- [ ] Mobile Auth & Session restore (Login, Biometrics / SecureStore, Dual-role switch)
- [ ] Active Projects List & Project Detail screen
- [ ] 5-Stage progress tracker & Quick Deliverable Preview
- [ ] Quick Stage Approve / Reject action with feedback commentary
- [ ] Push Notifications setup with Expo Push token registration
- [ ] Mobile-safe Milestone Payment confirmation
- [ ] Project chat & direct messaging interface
- [ ] Android & iOS simulator validation

#### Step 43: Mobile Companion Review & Close-Out
- [ ] End-to-end verification of mobile companion connected to live/local NestJS API

---

### PART 4 — Phase 5: Hardening, Production Deployment & Academic Deliverables (Sprint 9)

#### Step 44: Comprehensive Quality & Security Hardening
- [ ] Full automated test suite pass (API Unit + API E2E + Web Vitest + Playwright E2E all green)
- [ ] Security audit: OWASP Top 10 compliance, rate limiting on auth endpoints, CORS origin lock, SQL injection prevention, XSS sanitization
- [ ] Cross-browser & responsive design verification (Chrome, Firefox, Safari, Edge; Mobile / Tablet / Desktop)
- [ ] Performance audit: Lighthouse score > 90 on key pages, database index query optimization

#### Step 45: Production Cloud Deployment & Monitoring
- [ ] Provision PostgreSQL production database on Railway / Neon
- [ ] Run production migration: `prisma migrate deploy`
- [ ] Deploy NestJS API to Railway with production environment variables
- [ ] Deploy Next.js Web App to Vercel with custom domain and SSL
- [ ] Configure live Cloudinary bucket and Stripe webhook endpoints
- [ ] Setup Sentry error monitoring and performance tracing on API & Web
- [ ] Validate live production health checks: `GET https://api.yourdomain.com/health`

#### Step 46: Academic Documentation & Final Deliverables
- [ ] Update `README.md` with live production URLs, architecture overview, and setup instructions
- [ ] Write user guide manuals for Client, Designer, and Administrator personas
- [ ] Compile Dissertation Chapters:
  - [ ] Chapter 1: Introduction, Aims, Objectives & Methodology
  - [ ] Chapter 2: Literature Review & Evaluation of 3 Similar Systems
  - [ ] Chapter 3: Proposed Solution & Scope Specification
  - [ ] Chapter 4: Requirement Analysis & Fact-Finding
  - [ ] Chapter 5: System Design (Architecture, DFDs, Sequence, Class, ER, UI Wireframes)
  - [ ] Chapter 6: Implementation, Automated Testing Matrix & Project Management
  - [ ] Chapter 7: Critical Evaluation, Security Analysis & Future Enhancements
- [ ] Produce high-quality End-to-End Demo Video demonstrating full platform lifecycle
- [ ] Prepare final academic submission package (Source Code, Dissertation PDF, Presentation Slides, Demo Video)

#### Step 47: Final Sprint Close-Out & Project Sign-Off
- [ ] Final retrospective and sign-off on all project deliverables

---

## 🚀 Production Launch Verification Checklist

| Area | Checkpoint Item | Target Status |
|------|-----------------|---------------|
| **API** | All 23 API modules return valid responses in Swagger & Postman | 🟢 Completed |
| **API Tests** | 92+ Unit tests & E2E Supertest integration tests passing | 🟢 Completed |
| **Web Core Flows** | Auth, Discovery, Briefs, Workspace, Admin queues working | 🟢 Completed |
| **E2E Automation** | Playwright E2E tests passing for Client, Designer, and Admin journeys | 🟢 Completed |
| **CI/CD** | GitHub Actions pipeline executes lint, tests, and Playwright on PRs | 🟢 Completed |
| **Database** | PostgreSQL migrations configured and indexed | 🟢 Completed |
| **Web Gaps & Polish** | Public `/portfolios`, `/designers/[id]`, file uploaders, Stripe modal | 🟡 To Do |
| **Web Unit Tests** | Vitest suites for utility helpers and UI components | 🟡 To Do |
| **Mobile App** | Expo companion app tested on emulator/device | ⚪ To Do |
| **Security & Audits** | Rate limiting, CORS lock, Lighthouse > 90 | ⚪ To Do |
| **Production Deploy** | Live deployment on Railway (API + DB) & Vercel (Web) | ⚪ To Do |
| **Observability** | Sentry error monitoring configured on API and Web | ⚪ To Do |
| **Academic** | Dissertation report (Ch 1-7), diagrams, user guide, demo video | ⚪ To Do |

---
*Maintained by MNSBaanu — Academic Top-Up Project*
