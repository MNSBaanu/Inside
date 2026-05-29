# Inside — Architecture Diagrams

**Stack:** Next.js (Amplify) + **ASP.NET Core 8 Web API** (ECS Fargate) + **Amazon RDS PostgreSQL** + AWS services.

| Figure | Export file |
|--------|-------------|
| 1 — Simple three-tier | `02-simple-architecture.png` |
| 2 — Detailed modules | `03-detailed-architecture.png` |

Export via [mermaid.live](https://mermaid.live) → PNG (white background).

---

## Figure 1 — Simple High-Level Architecture

```mermaid
flowchart TB
    subgraph presentation ["PRESENTATION TIER"]
        Browser["Web Browser\n(Client / Designer)"]
        NextJS["Next.js 14\nAWS Amplify"]
    end
    subgraph application ["APPLICATION TIER"]
        API["ASP.NET Core 8 Web API\nAWS ECS Fargate + ALB"]
    end
    subgraph data ["DATA TIER"]
        RDS[("Amazon RDS\nPostgreSQL")]
        S3[("AWS S3")]
        Stripe["Stripe API"]
    end
    Browser -->|"HTTPS"| NextJS
    NextJS -->|"HTTPS REST JSON"| API
    API -->|"EF Core"| RDS
    API --> S3
    API --> Stripe
```

### ASCII layout

```
[ Browser ] ──► [ Next.js / Amplify ]
                      │
                      ▼
              [ ASP.NET Core 8 API / ECS + ALB ]
                 │         │         │
                 ▼         ▼         ▼
            [ RDS PG ]  [ S3 ]  [ Stripe ]
```

### Tier summary

| Tier | Technology | Responsibility |
|------|------------|----------------|
| Presentation | Next.js 14, Amplify | UI, brief display, fit scores, stage workspace |
| Application | ASP.NET Core 8, ECS | Brief engine, fit scoring, workflow, Stripe webhooks |
| Data | RDS PostgreSQL | Users, projects, stages, ledger |
| Data | S3 + CloudFront | Portfolio and deliverable media |
| Data | Stripe | Milestone payments |

---

## Figure 2 — Detailed High-Level Architecture

```mermaid
flowchart TB
    subgraph users ["USERS"]
        Client["Client"]
        Designer["Designer"]
    end
    subgraph presentation ["PRESENTATION TIER — Amplify"]
        P1["Auth / Role Switch"]
        P2["Discovery Feed"]
        P3["Moodboard + Brief UI"]
        P4["Fit Score + Request UI"]
        P5["Designer Dashboard"]
        P6["Stage Workspace + Ledger"]
    end
    subgraph application ["APPLICATION TIER — ECS"]
        ALB["Application Load Balancer"]
        S1["Auth Service"]
        S2["Portfolio Service"]
        S3["Moodboard + Brief Service"]
        S4["Fit Scoring Service"]
        S5["Request / Proposal Service"]
        S6["Project Workflow Service"]
        S7["Payment + Ledger Service"]
        S8["Notification Service"]
        S9["File Upload Service"]
        ALB --> S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9
    end
    subgraph data ["DATA AND EXTERNAL"]
        D1[("RDS PostgreSQL")]
        D2[("S3 + CloudFront")]
        D3["Stripe"]
        D4["Cognito"]
        D5["SES"]
        D6["Secrets Manager"]
        D7["CloudWatch"]
    end
    Client --> presentation
    Designer --> presentation
    presentation --> ALB
    S1 --> D1 & D4 & D6
    S2 --> D1 & S9
    S3 --> D1
    S4 --> D1
    S5 --> D1
    S6 --> D1 & S7 & S9
    S7 --> D3 & D1
    S8 --> D1 & D5
    S9 --> D2
    S1 & S6 & S7 -.-> D7
```

### Application services

| Service | Responsibility |
|---------|----------------|
| Auth Service | Cognito integration, JWT, dual-role claims |
| Portfolio Service | Case studies, discovery queries |
| Moodboard + Brief Service | Boards, items, **structured brief generation** |
| Fit Scoring Service | Moodboard ↔ portfolio **compatibility %** |
| Request / Proposal Service | Hiring marketplace |
| Project Workflow Service | Stage transitions, deliverable approval |
| Payment + Ledger Service | Stripe, milestone audit trail |
| Notification Service | In-app + SES |
| File Upload Service | S3 presigned URLs |

---

## Deployment view (AWS)

```mermaid
flowchart LR
    User[Users] --> Amplify[Amplify Next.js]
    User --> ALB[ALB]
    Amplify --> ALB
    ALB --> ECS[ECS Fargate\nASP.NET Core 8]
    ECS --> RDS[(RDS PostgreSQL)]
    ECS --> S3[S3]
    S3 --> CF[CloudFront]
    ECS --> Stripe[Stripe]
    ECS --> Cognito[Cognito]
    ECS --> SES[SES]
    ECS --> CW[CloudWatch]
```

---

## Payment approval sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant API as ASP.NET Core API
    participant DB as RDS
    participant ST as Stripe

    C->>API: Approve stage + pay milestone
    API->>DB: Validate stage + create ledger entry
    API->>ST: Create Checkout Session
    ST-->>C: Payment UI
    ST->>API: Webhook succeeded
    API->>DB: Update ledger + advance stage
```

---

## Solution structure (.NET)

```
src/
├── Inside.Api/              # Controllers, middleware
├── Inside.Application/      # BriefService, FitScoringService
├── Inside.Domain/           # Entities, ProjectStage enum
└── Inside.Infrastructure/   # EF Core, S3, Stripe, Cognito
web/                         # Next.js client
```

---

## Export checklist

- [ ] `02-simple-architecture.png` — readable at A4 width
- [ ] `03-detailed-architecture.png` — all service boxes legible
- [ ] Technology matches [07-resource-requirements.md](../07-resource-requirements.md)
