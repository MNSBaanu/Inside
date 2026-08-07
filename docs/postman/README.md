# Inside Postman collection

Manual API demos for the Nest Phase 2 API.

## TODO — verify later

- [ ] Run full collection on **Postman Desktop app** (not browser/`web.postman.co`)
- [ ] Top-right env = **Inside Local** (not “No environment”)
- [ ] Confirm `00 Health → Health check` returns 200 before Collection Run
- [ ] If “Local network access unavailable”: use Desktop app; do not fight Chrome permissions

## Import

1. Open **Postman Desktop** → **Import**
2. Add:
   - `Inside.postman_collection.json`
   - `Inside.local.postman_environment.json`
3. Select environment **Inside Local** (top-right dropdown)
4. Start API: `pnpm --filter api start:dev` (Postgres via Docker)

## Auth

Collection uses **Bearer** `{{accessToken}}`.

1. Run **01 Auth → Login (seed client)** (or designer / admin)
2. Tests script stores `accessToken` + `refreshToken`

Seed logins (password `Password123!`):

| Email | Role |
|-------|------|
| `client@inside.test` | CLIENT |
| `designer@inside.test` | DESIGNER |
| `admin@inside.test` | ADMIN |

## Variables

Copy ids from responses into collection variables: `requestId`, `proposalId`, `projectId`, `stageId`, `briefId`, `designerId`, etc. Path params like `:id` map to `{{id}}`.

## Regenerate

After route changes:

```bash
node docs/postman/generate-collection.cjs
```
