# Inside Web (Next.js)

Phase 3 scaffold — App Router, Tailwind, shadcn/ui, API client, role route shells.

## Setup

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm --filter web dev
```

App: http://localhost:3000 · API: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)

## Auth note

API issues **Bearer** access tokens (plus refresh). The web client stores tokens in `localStorage`, sends `Authorization: Bearer …`, and uses `credentials: 'include'` for CORS. A lightweight `inside_gate` cookie (`role` / `activeRole`) drives middleware for `/client`, `/designer`, and `/admin`.

## Routes

| Path | Access |
|------|--------|
| `/`, `/login`, `/register` | Public |
| `/client` | `activeRole === CLIENT` |
| `/designer` | Designer in designer mode |
| `/admin` | `role === ADMIN` |

Next checklist step: **35 — Web auth + profile pages**.
