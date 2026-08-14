# Frontend gap analysis (Database + API → Web)

**Project:** Inside  
**Updated:** 2026-08-14  
**Sources:** `packages/database/prisma/schema.prisma`, `apps/api/src/**/*.controller.ts`, `apps/web/src`

---

## Executive summary

Product marketplace flows on web are covered. Gaps closed in this pass: logged-in change password, avatar URL edit, `/notifications`, per-message mark-read, report `PORTFOLIO` / `REVIEW` / `MESSAGE`, stage due dates (API write + UI), activity log API + project feed, admin under-review + review visibility moderation.

**Still open (by design / Phase):** Cloudinary uploads, real Stripe (PROCESSING / FAILED / REFUNDED), transactional email, WebSocket chat, mobile / push. Ops-only: `GET /health`. Redundant: `GET /users/me` (web uses `/auth/me`), unused `listStages` helper.

---

## 1. Closed in this pass

| Gap | Status |
|-----|--------|
| Change password while logged in | Profile `ChangePasswordForm` → `PATCH /users/me/password` |
| Avatar edit | Profile sends `avatarUrl` |
| Report PORTFOLIO / REVIEW / MESSAGE | Portfolio detail, designer reviews, project chat |
| `/notifications` page | Route + bell “See all” |
| `markMessageRead` | Used in project chat for single unread |
| Stage `dueDate` | Set on project create; timeline show; panel edit → `PATCH /stages/:id/due-date` |
| `ReportStatus.UNDER_REVIEW` | Admin “Under review” action |
| `Review.isVisible` | `GET/PATCH /admin/reviews…` + `/admin/reviews` UI |
| `ActivityLog` | `ActivityService`; `GET /projects/:id/activity` + workspace feed |

---

## 2. Remaining schema / API (not product UI blockers)

| Item | Notes |
|------|--------|
| `PaymentStatus.PROCESSING` / `FAILED` / `REFUNDED` | Unused until real Stripe |
| `Session` revoke UI | Optional; JWT sessions internal |
| `Message.attachmentType` | Chat sends URL only |
| `GET /projects/:id/stages` | Client helper unused; stages from project detail |
| `GET /health` | Ops |
| `GET /users/me` | Covered by `/auth/me` |

---

## 3. Stubbed integrations (unchanged)

| Integration | Current state |
|-------------|---------------|
| **Cloudinary** | URL paste only |
| **Stripe** | Stub pay/release; fake intent id |
| **Email** | Tokens created; non-prod may return raw token |
| **Realtime messaging** | 20s polling |
| **Push** | Mobile / Expo only (Phase 4) |

---

## 4. Out of scope

| Item | Status |
|------|--------|
| `apps/mobile` | Not scaffolded |
| Shared package type sync | Largely stub |

---

*Update this file when remaining stubs are replaced with production integrations.*
