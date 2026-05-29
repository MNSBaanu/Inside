# Inside — Interior Design Service Platform

**Final Year project:** Portfolio-led interior design with **structured brief intelligence**, **designer fit scoring**, **stage-gated collaboration**, and **milestone payments** on **AWS** (.NET 8 + Next.js).

> **Read first:** [docs/SYSTEM-OVERVIEW.md](docs/SYSTEM-OVERVIEW.md)  
> **Proposal (ELMS):** [docs/Proposal/README.md](docs/Proposal/README.md) — merge sections `00`–`12`

---

## Documentation map

| Content | Location |
|---------|----------|
| System flows | [docs/SYSTEM-OVERVIEW.md](docs/SYSTEM-OVERVIEW.md) |
| Platform comparison | [docs/Proposal/02-background-and-motivation.md](docs/Proposal/02-background-and-motivation.md) |
| Functional requirements | [docs/Proposal/06-proposed-solution.md](docs/Proposal/06-proposed-solution.md) |
| Technology + AWS | [docs/Proposal/07-resource-requirements.md](docs/Proposal/07-resource-requirements.md) |
| Evaluation + testing | [docs/Proposal/10-project-plan.md](docs/Proposal/10-project-plan.md) |
| Architecture diagrams | [docs/Proposal/diagrams/architecture-diagrams.md](docs/Proposal/diagrams/architecture-diagrams.md) |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 → **AWS Amplify** |
| Backend | **ASP.NET Core 8** → **ECS Fargate** |
| Database | **RDS PostgreSQL** + EF Core 8 |
| Media | S3 + CloudFront |
| Auth | Cognito · Payments | Stripe |

---

## Status

Proposal documentation in `docs/Proposal/` · Code scaffold pending
