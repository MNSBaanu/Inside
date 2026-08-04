# Inside Postman collection

Manual API demos for the Nest Phase 2 API.

## Import

1. Open Postman → **Import**
2. Add:
   - `Inside.postman_collection.json`
   - `Inside.local.postman_environment.json`
3. Select environment **Inside Local**
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
