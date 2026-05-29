# Resource Requirements

## Hardware

| Item | Specification |
|------|---------------|
| Development laptop/PC | Minimum 16 GB RAM (Visual Studio + Docker + Next.js) |
| Internet | Stable broadband for AWS, RDS, Stripe |
| Optional | Second monitor for UI and API development |

## Software

| Category | Tools / technologies |
|----------|----------------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | **.NET 8 SDK**, **ASP.NET Core 8 Web API**, C# |
| ORM / database | **Entity Framework Core 8**, **Amazon RDS PostgreSQL** |
| IDE | Visual Studio 2022 or VS Code + C# Dev Kit |
| Cloud (AWS) | Amplify, ECS Fargate, ECR, ALB, RDS, S3, CloudFront, Cognito, SES, Secrets Manager, CloudWatch |
| Payments | Stripe (test mode), Stripe CLI |
| DevOps | Git, GitHub, GitHub Actions, Docker |
| API testing | Postman / Swagger |
| Diagrams | draw.io, Figma |

## Technology justification

| Choice | Rationale |
|--------|-----------|
| **ASP.NET Core 8** | Enterprise FYP stack; strong typing for brief/scoring algorithms; DI, middleware, OpenAPI |
| **Clean Architecture** | Separates Domain, Application, Infrastructure |
| **RDS PostgreSQL + EF Core** | Relational fit for projects, stages, milestone ledger |
| **Next.js on Amplify** | Rich discovery UI; SSR for portfolio pages |
| **ECS Fargate** | Scalable API hosting without server management |
| **Cognito** | User pools; JWT claims for dual-role |
| **S3 + CloudFront** | Portfolio and deliverable media |
| **Stripe** | PCI-compliant milestone payments |
| **SES** | Transactional email |
| **GitHub Actions → ECR → ECS** | CI/CD pipeline |

## Cloud backup and recovery

- **Amazon RDS** — automated backups
- **Amazon S3** — versioning on media buckets
- **GitHub** — source code repository

## Third-party services

| Service | Purpose |
|---------|---------|
| Amazon RDS (PostgreSQL) | Primary database |
| Stripe | Milestone payments |
| GitHub | Version control and CI/CD |

## Estimated cost

| Item | Cost |
|------|------|
| Development tools | $0 |
| AWS + RDS + Stripe (dev) | $0–40/month |
| Domain (optional) | ~$12/year |

## Human resources

- Student developer (C# API + Next.js)
- Academic supervisor
- 2–3 peers for UAT (brief clarity, fit score, stage workflow)
