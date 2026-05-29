# Resource Requirements

## Hardware

A development laptop or PC with at least 16 GB RAM is required to run Visual Studio or VS Code, Docker, and the Next.js dev server concurrently. Stable broadband internet is needed for **AWS**, database access, and **Stripe** test mode. A second monitor is optional but useful when developing the UI and API side by side.

## Software

| Category | Tools / technologies |
|----------|----------------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | .NET 8 SDK, ASP.NET Core 8 Web API, C# |
| Data | Entity Framework Core, PostgreSQL on AWS |
| IDE | Visual Studio 2022 or VS Code with C# extensions |
| Cloud | AWS (hosting, database, storage, authentication, email as needed) |
| Payments | Stripe (test mode), Stripe CLI for webhooks |
| DevOps | Git, GitHub, GitHub Actions, Docker |
| Testing | xUnit, Playwright or similar, Postman / Swagger |
| Design | draw.io, Figma (wireframes) |

## Cloud backup and recovery

- Automated database backups on **AWS**
- Versioned object storage for media files
- Source code maintained on **GitHub**

## Estimated cost

| Item | Estimated cost |
|------|----------------|
| Development tools (IDE, Git, etc.) | $0 |
| AWS and Stripe (development / low traffic) | $0–40 per month |
| Domain name (optional) | ~$12 per year |

## Human resources

- Student developer (Next.js front end and ASP.NET Core API)
- Academic supervisor for milestone reviews
- Two to three volunteer testers for user acceptance testing
