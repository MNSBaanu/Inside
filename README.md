# Inside — Interior Design Service Platform

**Inside** connects clients and interior designers in one platform: discover work through a **portfolio feed**, express taste with **moodboards**, hire via **proposals**, collaborate in a **staged project workspace**, and pay through **Stripe milestones**.

> **New to the project?** Read **[docs/SYSTEM-OVERVIEW.md](docs/SYSTEM-OVERVIEW.md)** for actors, concepts, and end-to-end flows with diagrams.

---

## What it does

| Phase | What happens |
|-------|----------------|
| **Discover** | Clients browse completed room projects; filter by style, room type, budget |
| **Curate** | Save favourites to moodboards as a visual brief |
| **Hire** | Post a project request (with moodboard) or hire directly from a portfolio |
| **Deliver** | Five stages: Proposal → Concept → Design → Revision → Completion |
| **Pay** | Client approves each stage; Stripe releases milestone payments |
| **Review** | Rate the designer after completion |

## Who uses it

- **Clients** — browse, moodboard, request, approve, pay, review  
- **Designers** — portfolio, proposals, deliverables, availability  
- **Dual-role users** — one account, switch between client and designer dashboards  

## Key features

- Portfolio-first discovery (not profile-first hiring)
- Moodboards attached to project requests
- Open marketplace proposals
- Structured interior-design workflow
- Milestone-based payments (Stripe)
- Dual-role accounts
- AWS-hosted production-style stack

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS → **AWS Amplify** |
| Backend | Node.js, Express, TypeScript → **AWS ECS Fargate** + ALB |
| Database | **MongoDB Atlas** |
| Media | **AWS S3** + **CloudFront** |
| Auth | JWT + **AWS Cognito** |
| Email | **AWS SES** |
| Payments | **Stripe** |
| Ops | **CloudWatch**, **Secrets Manager**, **GitHub Actions** |

## Repository structure (planned)

```
Inside/
├── client/                 # Next.js frontend
├── server/                 # Express REST API
├── docs/
│   ├── SYSTEM-OVERVIEW.md  # Flows & concepts (read first)
│   ├── Approval/           # Approved topic
│   └── Proposal/           # Proposal sections 00–12
└── README.md
```

## Documentation

| Document | Description |
|----------|-------------|
| **[docs/SYSTEM-OVERVIEW.md](docs/SYSTEM-OVERVIEW.md)** | System flows, modules, MVP scope |
| [docs/Proposal/README.md](docs/Proposal/README.md) | Proposal for ELMS (merge `00`–`12`) |
| [docs/Proposal/diagrams/architecture-diagrams.md](docs/Proposal/diagrams/architecture-diagrams.md) | Simple + detailed architecture |
| [docs/Approval/Topic Approval Documentation.md](docs/Approval/Topic%20Approval%20Documentation.md) | Approved uniqueness & scope |

## Compared to other platforms

| Platform | Discovery | Hire on-platform | ID-specific workflow | Milestone pay |
|----------|-----------|------------------|----------------------|---------------|
| Behance / Dribbble | Yes | No | No | No |
| Fiverr | Profile-based | Yes | Generic | Escrow |
| Havenly / Decorilla | Limited | Yes (assigned) | Yes | Yes |
| **Inside** | Portfolio-first | Yes (client choice) | Yes | Yes (per stage approval) |

## Status

- **Phase:** Proposal & design documentation  
- **Code:** Not yet scaffolded (`client/`, `server/` planned)  

## Inspiration

[Houzz](https://houzz.com) · [Havenly](https://havenly.com) · [Decorilla](https://decorilla.com) · [Behance](https://behance.net) · [Fiverr](https://fiverr.com)
