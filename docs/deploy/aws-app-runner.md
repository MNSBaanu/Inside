# AWS App Runner + RDS (us-east-1) — Inside Nest API

## Status

Repo includes a root `Dockerfile` for the Nest API. Cloud resources are created with AWS CLI after you authenticate.

## 0. Authenticate AWS CLI (required)

```powershell
aws configure
# or: aws login
aws sts get-caller-identity
aws configure set region us-east-1
```

Set a **Billing → Budgets** alert (e.g. $5) before creating RDS/App Runner.

## Architecture

| Piece | Service |
|-------|---------|
| API | App Runner (container from ECR) |
| DB | RDS PostgreSQL `db.t3.micro` |
| Region | `us-east-1` |

## 1. Create RDS (console or CLI)

**Console:** RDS → Create database → PostgreSQL → Free tier template if shown → `db.t3.micro` → public access **Yes** (simplest for App Runner) → note endpoint + master password.

**Security group:** allow inbound **5432** from App Runner / `0.0.0.0/0` only for academic demos (tighten later).

Connection URL shape:

```text
postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/inside?schema=public
```

## 2. Build & push image to ECR

```powershell
$ACCOUNT = aws sts get-caller-identity --query Account --output text
$REGION = "us-east-1"
$REPO = "inside-api"

aws ecr create-repository --repository-name $REPO --region $REGION 2>$null
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com"

docker build -t $REPO .
docker tag "${REPO}:latest" "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/${REPO}:latest"
docker push "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/${REPO}:latest"
```

## 3. App Runner

App Runner → Create service → Container registry → ECR → select `inside-api`.

**Port:** `3001`

**Environment variables:**

| Key | Value |
|-----|--------|
| `DATABASE_URL` | RDS URL above |
| `JWT_SECRET` | long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `JWT_REFRESH_DAYS` | `30` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `CORS_ORIGIN` | `*` (tighten later) |

## 4. Migrate + seed (from a machine that can reach RDS)

After RDS is publicly reachable (or use CloudShell in the VPC):

```powershell
$env:DATABASE_URL = "postgresql://..."
pnpm --filter @inside/database exec prisma migrate deploy
pnpm --filter @inside/database db:seed
```

Seed users: `client@inside.test` / `designer@inside.test` / `admin@inside.test` — password `Password123!`

## 5. Verify

```text
https://YOUR_APP_RUNNER_URL/health
https://YOUR_APP_RUNNER_URL/api/docs
```

## Cost reminder

- RDS `db.t3.micro` may be Free Tier (12 months).
- App Runner **bills while running** — delete/pause when not demoting.

## Local still

Keep Docker Postgres + `localhost` `DATABASE_URL` for daily development.
