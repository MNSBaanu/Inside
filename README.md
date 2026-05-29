# Inside — Interior Design Service Platform

**Final Year project:** A portfolio-led interior design platform with **structured brief intelligence**, **designer fit scoring**, **stage-gated collaboration**, and **milestone payments** on **AWS** — built with **ASP.NET Core 8** and **Next.js**.

> **Read first:** [docs/SYSTEM-OVERVIEW.md](docs/SYSTEM-OVERVIEW.md)

---

## What makes Inside different

| Generic freelance (e.g. Fiverr) | Inside |
|--------------------------------|--------|
| Text job post | Moodboard + **auto structured brief** |
| Star ratings | **Fit score** vs your moodboard |
| Message thread | **Stage tabs** + deliverable approval |
| Any category | **Interior design only** |

---

## What it does

| Step | Action |
|------|--------|
| Discover | Browse room portfolios; filter style, room, budget |
| Curate | Build moodboard → system generates **structured brief** |
| Match | View **designer fit scores** |
| Hire | Post request; receive proposals; accept |
| Deliver | Five stages with per-stage files and approvals |
| Pay | **Milestone ledger** + Stripe on approval |
| Review | Rate designer |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind → **AWS Amplify** |
| Backend | **ASP.NET Core 8 Web API** → **ECS Fargate** + ALB |
| Database | **Amazon RDS PostgreSQL** + **EF Core 8** |
| Media | **S3** + **CloudFront** |
| Auth | **AWS Cognito** |
| Email | **AWS SES** |
| Payments | **Stripe** |
| CI/CD | **GitHub Actions** → ECR → ECS |

---

## Repository structure (planned)

```
Inside/
├── src/
│   ├── Inside.Api/
│   ├── Inside.Application/     # BriefService, FitScoringService
│   ├── Inside.Domain/
│   └── Inside.Infrastructure/
├── web/                        # Next.js
└── docs/
    ├── SYSTEM-OVERVIEW.md
    ├── Approval/
    └── Proposal/
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/SYSTEM-OVERVIEW.md](docs/SYSTEM-OVERVIEW.md) | Flows, modules, MVP |
| [docs/Proposal/README.md](docs/Proposal/README.md) | ELMS proposal (`00`–`12`) |
| [docs/Proposal/diagrams/architecture-diagrams.md](docs/Proposal/diagrams/architecture-diagrams.md) | Architecture ( .NET on ECS ) |
| [docs/Proposal/supporting/functional-requirements.md](docs/Proposal/supporting/functional-requirements.md) | FR-BRIEF, FR-FIT, etc. |
| [docs/Approval/Topic Approval Documentation.md](docs/Approval/Topic%20Approval%20Documentation.md) | Approved topic |

---

## Status

Proposal and design documentation complete · Code scaffold pending

---

## References (market)

[Houzz](https://houzz.com) · [Havenly](https://havenly.com) · [Decorilla](https://decorilla.com) · [Behance](https://behance.net) · [Fiverr](https://fiverr.com)
