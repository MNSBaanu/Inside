# Inside

**Interior design marketplace — portfolio discovery, visual briefs, staged collaboration, milestone payments.**

[![Project Status](https://img.shields.io/badge/status-in%20development-yellow)]()
[![Web](https://img.shields.io/badge/web-Next.js%2014-black?logo=next.js)]()
[![API](https://img.shields.io/badge/api-NestJS-E0234E?logo=nestjs)]()
[![Mobile](https://img.shields.io/badge/mobile-React%20Native-61DAFB?logo=react)]()
[![Database](https://img.shields.io/badge/database-PostgreSQL-4169E1?logo=postgresql)]()

**Done by MNSBaanu**

## Overview

Inside is a full-stack platform that connects **clients** and **interior designers** in one workflow. Clients browse completed room projects, build moodboards, submit structured briefs, hire designers, and approve work at each stage. Designers publish portfolios, respond to requests, and deliver concepts through a stage-gated workspace. Milestone payments are a Stripe test-mode demonstration; releasing a milestone records approval and does not transfer money to a designer.

---

## Features

- **Portfolio discovery** — search and filter designers by style, room type, and budget
- **Moodboards & briefs** — visual inspiration boards that generate editable project briefs
- **Designer matching** — fit scoring and ranked recommendations
- **Hiring** — open requests, direct invites, proposals, and side-by-side comparison
- **Project workspace** — staged flow (Proposal → Concept → Design → Revision → Completion)
- **Messaging & notifications** — in-app and email alerts; push on mobile
- **Milestone payment demo** — Stripe test-mode Checkout and approval records; no escrow or designer payouts
- **Opt-in dual-role accounts** — every account starts with one role; a designer can create a client account and a client can create a designer account from Account, then switch `activeRole` CLIENT ↔ DESIGNER
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

## Database backups

- **Nightly dump:** the `Backup database` workflow runs `pg_dump` against the live Neon database every night at 02:00 Sri Lanka time, and on demand from the Actions tab.
- **Where it is stored:** each dump is saved as a workflow artifact (`inside-<date>.dump`) on that run's page in GitHub Actions, kept for 30 days, and visible only to repository collaborators.
- **Point-in-time restore:** Neon's own history restore covers very recent mistakes.
- **Not included:** uploaded files live in Cloudinary and are not part of the dump.

To restore, download the artifact, unzip it, then load it into an empty database (a new Neon branch or local Postgres):

```bash
pg_restore --no-owner --no-acl --clean --if-exists -d "<database url>" inside-<date>.dump
```

---

## License

All rights reserved. Academic project
