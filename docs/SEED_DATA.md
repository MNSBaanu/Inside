# Seed data reference

What `pnpm --filter @inside/database run db:seed` puts in the database, and how to
use it when testing. The seed is idempotent — it upserts, so running it twice
does not duplicate anything.

Source: [`packages/database/prisma/seed.ts`](../packages/database/prisma/seed.ts)

---

## Accounts

**Every seeded account uses the same password: `Password123!`**

| Email | Name | Role | Verified | Use it to test |
|---|---|---|---|---|
| `client@inside.test` | Nadia Client | CLIENT | yes | The main client flow — has briefs, moodboards, an active project |
| `client2@inside.test` | Sam Client | CLIENT | yes | A completed project, and the review that came out of it |
| `designer@inside.test` | Ravi Designer | DESIGNER | yes | The main designer flow — 2 portfolios, both projects, approved verification |
| `designer2@inside.test` | Ayesha Designer | DESIGNER | **no** | The unverified-email banner, and a pending verification in the admin queue |
| `admin@inside.test` | Platform Admin | ADMIN | yes | Admin moderation: users, verifications, reports, reviews |

A sixth user, `live-check-20260807211344@inside.test`, may exist in a long-lived
local database. That one is a leftover from manual signup testing, not part of
the seed.

### Demo auth tokens

The seed stores hashed tokens whose raw values are known, so the email
verification and password reset screens can be exercised without a mail server.
These are the values to paste into the form, or append as `?token=`:

| Raw token | Type | Belongs to | Expires |
|---|---|---|---|
| `seed-email-verify-pending-designer` | EMAIL_VERIFY | Ayesha Designer | 24 hours after seeding |
| `seed-password-reset-client` | PASSWORD_RESET | Nadia Client | 1 hour after seeding |

```
http://localhost:3000/verify-email?token=seed-email-verify-pending-designer
http://localhost:3000/reset-password?token=seed-password-reset-client
```

Both are short-lived. Re-run the seed if they have expired — the upsert leaves
the existing rows alone, so delete the `AuthToken` rows first if you need fresh
expiry dates.

There is also a demo `Session` row for Nadia with refresh token
`seed-client-refresh`, useful for testing `POST /auth/refresh` directly.

---

## Content

### Portfolios

| Title | Designer | Style | Room | Budget (LKR) | Images |
|---|---|---|---|---|---|
| Scandinavian Living Room | Ravi | Scandinavian | Living Room | 450,000 | 2 |
| Minimalist Kitchen Remodel | Ravi | Minimalist | Kitchen | 780,000 | 1 |
| Coastal Bedroom Concept | Ayesha | Coastal | Bedroom | 320,000 | 1 |

All three are published, so they appear on `/portfolios` and `/designers`.
Images are hotlinked from Unsplash, which means **the portfolio pages need
internet access to render**. Once Cloudinary uploads replace them, this stops
being true for newly added work.

### Requests

| Title | Type | Status | Budget (LKR) |
|---|---|---|---|
| Living room and kitchen refresh | DIRECT | ACCEPTED | 700,000 |
| Studio nook makeover | DIRECT | ACCEPTED | 180,000 |
| Coastal master bedroom redesign | OPEN | OPEN | 350,000 |

The open request is the one to use when testing the proposal flow as a designer —
the other two have already been accepted into projects.

### Projects

| Title | Client | Designer | Stage | Status |
|---|---|---|---|---|
| Living room and kitchen refresh | Nadia | Ravi | CONCEPT | ACTIVE |
| Studio nook makeover | Sam | Ravi | COMPLETION | COMPLETED |

The active project carries the full five-stage ladder:

| Order | Stage | Status | Fee (LKR) |
|---|---|---|---|
| 1 | PROPOSAL | APPROVED | 0 |
| 2 | CONCEPT | SUBMITTED | 150,000 |
| 3 | DESIGN | PENDING | 250,000 |
| 4 | REVISION | PENDING | 100,000 |
| 5 | COMPLETION | PENDING | 200,000 |

CONCEPT sitting at SUBMITTED is the interesting state: sign in as Nadia to
approve or reject it, and as Ravi to see the submitted side.

### Everything else

| Table | Rows | Notes |
|---|---|---|
| Brief | 2 | One for Nadia, one for Sam; both linked to a moodboard |
| Moodboard | 2 | Saved items are Unsplash URLs |
| Proposal | 4 | Across the three requests |
| Deliverable | 1 | `concept-board-v1.pdf`, on the submitted CONCEPT stage |
| Message | 2 | Enough for the inbox to show a thread with a preview |
| MilestonePayment | 2 | One PENDING (150,000), one RELEASED |
| Review | 1 | 5 stars, visible, from the completed project |
| Verification | 2 | One APPROVED (Ravi), one PENDING (Ayesha) — the pending one shows in the admin queue |
| Favourite | 1 | A client following a designer |
| Block | 1 | Shows on the Safety page |
| Report | 1 | Shows in the admin Reports tab and on the reporter's Safety page |
| Notification | 2 | Drives the unread badge in the sidebar |
| ActivityLog | 1 | Not yet surfaced in the UI |

---

## Running the seed

The database must be up first:

```bash
docker compose up -d postgres
pnpm --filter @inside/database run db:migrate
pnpm --filter @inside/database run db:seed
```

To check what is actually in the database right now:

```bash
docker exec inside-postgres psql -U postgres -d inside_dev -c 'select count(*) from "User";'
```

To start over from an empty database, remove the volume — this destroys all
local data, including anything you created by hand through the app:

```bash
docker compose down -v
docker compose up -d postgres
pnpm --filter @inside/database run db:migrate
pnpm --filter @inside/database run db:seed
```

---

## A warning about credentials

`Password123!` and the raw demo tokens above are safe to write down **because
this seed is for local development only**. Never run `db:seed` against a
deployed database, and never reuse these values for a real account. The seeded
accounts all use the `@inside.test` domain, which is not a real mail domain, so
they cannot receive password resets outside local development.
