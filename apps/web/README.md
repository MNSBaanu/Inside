# Inside Web (Next.js)

Phase 3 — App Router, Tailwind, shadcn/ui, auth, discovery/portfolios/favourites.

## Setup

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm --filter web dev
```

App: http://localhost:3000 · API: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)

## Demo credentials

Password for all seed users: **`Password123!`**

| Email | Role |
|-------|------|
| `client@inside.test` | Client |
| `designer@inside.test` | Designer |
| `admin@inside.test` | Admin |

Also: `client2@inside.test`, `designer2@inside.test`. Use the demo buttons on `/login` to fill the form.

## Auth note

API issues **Bearer** access tokens (plus refresh). The web client stores tokens in `localStorage`, sends `Authorization: Bearer …`, and uses `credentials: 'include'` for CORS. A lightweight `inside_gate` cookie (`role` / `activeRole`) drives middleware for `/client`, `/designer`, and `/admin`.

## Routes

| Path | Access |
|------|--------|
| `/`, `/login`, `/register` | Public |
| `/profile` | Authenticated |
| `/portfolios/:id` | Public detail (favourite if client) |
| `/client` | Discover browse/search |
| `/client/favourites` | Client favourites |
| `/designer` | My portfolios |
| `/designer/portfolios/new` | Create portfolio |
| `/designer/portfolios/:id` | Manage portfolio |
| `/admin` | `role === ADMIN` |

Next checklist step: **37**.
