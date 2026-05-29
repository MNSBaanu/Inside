# Resource Requirements

## Hardware

| Item | Specification |
|------|---------------|
| Development laptop/PC | Minimum 16 GB RAM recommended (Visual Studio + Docker + Next.js) |
| Internet | Stable broadband for AWS, RDS, and Stripe |
| Optional | Second monitor for UI and API development |

## Software

| Category | Tools / technologies |
|----------|----------------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | **.NET 8 SDK**, **ASP.NET Core 8 Web API**, C# |
| ORM / database | **Entity Framework Core 8**, **Amazon RDS PostgreSQL**, pgAdmin or DBeaver |
| IDE | **Visual Studio 2022** or VS Code + C# Dev Kit |
| Cloud (AWS) | Amplify, ECS Fargate, ECR, ALB, RDS, S3, CloudFront, Cognito, SES, Secrets Manager, CloudWatch, IAM |
| Payments | Stripe (test mode), Stripe CLI |
| DevOps | Git, GitHub, GitHub Actions, Docker Desktop |
| API testing | Postman or Swagger UI (built-in) |
| Diagrams | draw.io, Figma |

## Cloud backup and recovery

- **Amazon RDS** — automated backups and point-in-time recovery (configure retention in AWS Console)
- **Amazon S3** — versioning on deliverables and portfolio buckets
- **GitHub** — source code as system of record

## Third-party services

| Service | Purpose |
|---------|---------|
| Amazon RDS (PostgreSQL) | Primary relational database |
| Stripe | Milestone payments and webhooks |
| GitHub | Version control and CI/CD to ECR/ECS |

## Estimated cost

| Item | Cost |
|------|------|
| .NET SDK, VS Community, Next.js | $0 |
| AWS + RDS + Stripe (development) | $0–40/month within free/low tiers |
| Domain (optional) | ~$12/year |
| **Total** | Minimal for academic project |

## Human resources

- Student developer (full-stack: C# API + Next.js)
- Academic supervisor
- Optional: 2–3 peers for user acceptance testing (brief clarity, fit score usefulness, stage workflow)
