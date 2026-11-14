---
title: Inside
aliases: [Inside marketplace, Inside FYP]
tags: [project, academic, final-year, nestjs, nextjs, expo, prisma]
status: in development, submission 2026-11-20
version: 0.0.1
created: 2026-05-04
updated: 2026-11-14
repo: https://github.com/MNSBaanu/Inside
author: MNS Baanu
---

> [!summary]
> Interior-design marketplace: clients brief and hire designers, approve work in five stages, and pay milestones through Stripe test mode. TypeScript monorepo: NestJS API, Next.js 14 web, Expo mobile companion, PostgreSQL via Prisma. Audited 2026-11-08: architecture sound, gaps are email delivery, payment webhook, docs and evidence.

## Quick links
- [[README]] · [[docs/audit-and-restructure|Audit and restructure]] · [[docs/submission-plan|Submission plan]]
- [[CLAUDE]] (working agreements: verify after every change)

## Tech stack
Next.js 14 + Tailwind (web) · Expo / React Native (mobile) · NestJS 11 + Prisma 6 (API) · PostgreSQL 16 · Cloudinary (uploads) · Stripe test mode (payments) · pnpm + Turborepo · GitHub Actions · Jest, Vitest, Playwright.

## Commands
```bash
docker compose up -d postgres          # database
pnpm install
pnpm --filter @inside/database exec prisma migrate dev
pnpm --filter @inside/database db:seed # demo accounts @inside.test
pnpm dev                               # all apps
pnpm typecheck | lint | test | build   # verify (API typecheck gap: plan IN-01)
pnpm --filter api test:e2e             # needs Postgres
pnpm --filter web exec playwright test
```

## Folder structure
Restructured 2026-11-08 (ST-01, branch `final/submission`, uncommitted): `apps/api/src/modules/{identity,discovery,hiring,delivery,trust,platform}/<module>` plus `src/database` (Prisma module) and `src/common`; `apps/web` (31 routes) with `components/{ui,layout,features,providers}` and `lib/{api,auth,utils}`; `apps/mobile` with `components/features` and `lib/{api,auth,utils}`; `packages/database` (Prisma schema, 7 migrations, seed) · `packages/eslint-config` · `docker/postgres/init`. Dockerfile and compose stay at the root until Render's setup is confirmed.

## How it works
Moodboard → brief → weighted matching (style 35, room 30, budget 20, description 15) → request → proposal with per-stage fees → accepted proposal creates a project with 5 stages and one pending milestone payment per stage → client pays a stage through Stripe Checkout before the designer can start it (held) → approving the stage releases that payment (status record only, no payout). Details: see the audit file and, once rebuilt, docs/architecture.md.

## APIs and data
REST with Bearer JWT; session row checked on every request. Swagger at `/api/docs` outside production. 23 Prisma models, 13 enums.

## Deployment
Web appears to be on Vercel; API on Render (confirmed by owner 2026-11-08). Root `bonto-start` script looks like a Render native-Node build/start command, so the `Dockerfile` may be unused in production (verify in the Render dashboard). Render free tier sleeps when idle and free databases may expire: check before the demo.

## Open issues
- [ ] Email verification and reset have no delivery outside dev (B1)
- [ ] No Stripe webhook; payment depends on browser return (B2)
- [ ] `pnpm typecheck` skips API and database (D1)
- [ ] API e2e and Playwright not run in the 2026-11-08 audit (E1)
- [ ] README overclaims email and push (A1)
- [ ] Shared API types duplicated in web and mobile (D5)
- [x] Folder structure refactor (ST-01) done 2026-11-08
- [ ] API e2e and Playwright not run since the move (need Postgres): run in IN-02
- [ ] `docs/` folder (audit, plan) went missing from disk on 2026-11-08; recreate or restore
- [ ] Hosted site: seed password Password123! must not exist on hosted accounts; migrations not applied by bonto-start (D1)
- [ ] Tokens in localStorage: accepted, to document (C1)
- [ ] Product never walked by hand end to end: feature tasks F1 to F9 in the plan
- [ ] Stripe test account and CLI not set up (IN-02)

## Log
- 2026-11-08: Full audit. Typecheck (web, mobile), API lint, API build, web build, 120 API unit tests pass. Wrote `docs/01` to `docs/03` and this note. Plan first drafted at 65 h.
- 2026-11-08: Re-planned to real availability (weekdays 3.5 h, Sat 6, Sun 10 = 47.5 h): 15 scheduled tasks, 44.5 h, 3 h slack, freeze end of Sun 2026-11-15. Postman, extra email types and file-splitting cut or made optional.
- 2026-11-08: Plan rebuilt around a screen-by-screen QA and fix loop (31 routes, 9 QA tasks, 4 fix batches, security pass). 25 scheduled tasks, 47 h, freeze end of Tue 2026-11-17. Nothing run yet.
- 2026-11-08: UI decision: foundation first (UI-01 direction, UI-02 shared components and mobile layout, Tue-Wed), screen-level changes in fix batches after QA. Priorities: mobile layout, spacing polish. Plan now 27 tasks, 47.5 h, no slack.
- 2026-11-08: Plan restructured to one task per feature (F1 to F10: build, UI, QA, security, fixes and tests together) plus foundation and documents. 22 tasks, 47.5 h.
- 2026-11-08: Plan was local-only; added hosted work: D1 hosted setup (Sat 14), hosted checks per feature, D2 real-phone smoke test and demo rehearsal on the hosted site (Wed 18). Findings: API URL baked into CSP at build time, shared seed password Password123! (admin included), no migrate step in bonto-start. Still 22 tasks, 47.5 h.
- 2026-11-08: Added ST-01 project structure refactor (Tue-Wed, 4.5 h) before UI and feature work. Plan now 23 tasks, 52 h, needs top-of-range hours (55 h; 47.5 h at the bottom). Audit file updated (S1 finding, target tree, finding map).
- 2026-11-08: ST-01 executed: 196 files moved as git renames, 502 imports rewritten in 269 files, 0 unresolved. Matches the baseline: API typecheck (src + test), 120 API unit tests, API lint and build, 50 web tests, web typecheck, lint and build (31 routes), mobile typecheck. Not run: API e2e, Playwright (need Postgres). Remaining plan 47.5 h.
- 2026-11-08: Previous commit removed the 2026-10-17 audit and completion plan; findings carried into docs/02.
- 2026-11-10: Payments changed to escrow to match the interim report: payments created on proposal accept, stage start requires the stage paid, approval releases it; release endpoint and button removed, seed updated. Stage, payment and proposal unit tests pass; API e2e updated but not run (needs Postgres).
- 2026-11-11: Seed expanded for a production-like demo: 26 listed designers (20 new + 8 new clients), 79 published portfolios, 53 shop products, 14 open requests, 33 completed projects with reviews. Every style, room and shop category returns results (Kids Room has 2). All Unsplash photos checked by eye and for HTTP 200; dead `neutrals` photo replaced. Ravi and Nimal stay on page 1 for the Playwright directory tests.
- 2026-11-12: Work moved to `main` only (dev retired). Added `seed-production.yml`: on seed changes on main it applies migrations and seeds Neon with `SEED_MODE=sync`, which adds missing sample rows and updates existing ones without deleting anything; the manual run has a reset option that wipes first. Seed rows now all have fixed ids or natural keys; default local run still resets. CI jobs run only when their own code changes. `NEXT_PUBLIC_SITE_URL` set on Vercel.
- 2026-11-12: Admin area rebuilt: `/admin` is now an overview (counts from new `GET /admin/stats`, recent activity) and each section has its own page under `/admin/[section]` (users, verifications, reports, reviews, activity) with search and filters on the loaded rows. Admins land on `/admin` instead of the dashboard and their side menu only lists admin pages and Account. Paginated API lists got an `id` tie-breaker so items no longer repeat across pages.
- 2026-11-14: Home page rebuilt to an editorial luxury layout (Inside theme colours, Inter Tight): full-height hero, about + stats, numbered steps accordion, spotlight carousel, staggered work grid, editorial cards, and a home-only dark footer with an image wordmark (shared footer hidden on `/`). Scroll effects: sticky hero that zooms out under the next card, spotlight zooms in, counting stats. Search, styles, designers, testimonials and FAQ removed from the home page.
