# Resource Requirements

## Hardware

| Item | Specification |
|------|---------------|
| Development laptop/PC | Minimum 8 GB RAM, 256 GB SSD recommended |
| Internet | Stable broadband for AWS, MongoDB Atlas, and Stripe |
| Optional | Second monitor for UI development and documentation |

## Software

| Category | Tools / technologies |
|----------|----------------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Node.js 20 LTS, Express, TypeScript |
| Database | MongoDB Atlas, MongoDB Compass |
| Cloud (AWS) | Amplify, ECS Fargate, S3, CloudFront, SES, Cognito, Secrets Manager, CloudWatch, IAM |
| Payments | Stripe (test mode), Stripe CLI |
| Dev tools | Visual Studio Code, Git, GitHub, GitHub Actions |
| API testing | Postman or Insomnia |
| Diagrams | draw.io / diagrams.net, Figma (wireframes) |
| Container (optional) | Docker Desktop (ECS local parity) |

## Cloud backup and recovery

- **MongoDB Atlas** — automated backups on cluster
- **Amazon S3** — versioning enabled on deliverables bucket
- **GitHub** — source code repository as system of record

## Third-party services

| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Primary database (M0 free tier) |
| Stripe | Milestone payments and webhooks |
| GitHub | Version control and CI/CD to AWS |

## Estimated cost

| Item | Cost |
|------|------|
| Development tools | $0 (open source) |
| AWS + Atlas + Stripe (development) | $0–30/month within free tiers |
| Domain name (optional) | ~$12/year |
| **Total** | Minimal for academic project |

## Human resources

- Student developer (full-stack)
- Academic supervisor
- Optional: 2–3 peers for user acceptance testing
