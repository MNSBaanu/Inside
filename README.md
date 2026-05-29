# Inside — Interior Design Service Platform

Inside is a portfolio-led interior design platform where clients discover designers through their work and hire them through a structured project workflow.

## What It Does

- Clients browse a visual feed of real completed interior design projects, save favorites to moodboards, and hire designers directly
- Designers showcase their work as rich portfolio case studies that double as service listings
- Once hired, both parties collaborate through a structured workflow with milestone-based payments, messaging, and file sharing

## Key Features

- Portfolio-first discovery feed (browse by style, room type, budget)
- Structured project workflow — Proposal → Concept → Design → Revision → Completion
- Milestone-based payment system with staged fund release
- Real-time messaging and design file sharing (mood boards, floor plans, 3D renders)
- Dual-role user system — same account can act as both client and designer
- Designer availability and scheduling management
- Moodboard / wishlist for saving and comparing designers
- Review and rating system

## Similar Platforms (Inspiration & Reference)

| Platform | Type |
|---|---|
| [Dribbble](https://dribbble.com) | Design portfolio & community |
| [Behance](https://behance.net) | Creative portfolio showcase |
| [Houzz](https://houzz.com) | Home design inspiration & pro directory |
| [Havenly](https://havenly.com) | Online interior design service |
| [Decorilla](https://decorilla.com) | Online interior design with 3D rendering |
| [Fiverr](https://fiverr.com) | Freelance service marketplace |

## What Makes Inside Different

Unlike Dribbble/Behance which stop at inspiration, and Havenly/Decorilla which skip community entirely, Inside connects the discovery experience with a full service and payment workflow — purpose-built for interior design.

## Documentation

| Document | Location |
|----------|----------|
| Approved topic | [docs/Approval/Topic Approval Documentation.md](docs/Approval/Topic%20Approval%20Documentation.md) |
| **Proposal (current)** | [docs/Proposal/README.md](docs/Proposal/README.md) — matches lecturer section order (`sample.md`) |
| Diagram & Gantt guide | [docs/Proposal/diagrams-and-charts-guide.md](docs/Proposal/diagrams-and-charts-guide.md) |
| Lecturer samples | [docs/Proposal/Sample/](docs/Proposal/Sample/) |

## Planned Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS → **AWS Amplify** |
| Backend | Node.js, Express → **AWS ECS Fargate** (or Elastic Beanstalk) |
| Database | MongoDB Atlas |
| Storage / CDN | **AWS S3** + **CloudFront** |
| Auth | JWT + **AWS Cognito** |
| Email | **AWS SES** |
| Payments | **Stripe** |
| CI/CD | GitHub Actions → AWS |

## Planned Repository Structure

```
Inside/
├── client/          # Next.js frontend
├── server/          # Express API
└── docs/
    ├── Approval/
    └── Proposal/
```
