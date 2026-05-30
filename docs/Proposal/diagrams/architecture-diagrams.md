# Architecture Diagrams

**Stack:** Next.js + **React Native (Expo)** + **ASP.NET Core 8 Web API** + relational database on **AWS** + **Stripe**.

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
        NextJS["Next.js Web App\nAWS"]
        Mobile["React Native Expo\niOS / Android"]
    end
    subgraph application ["APPLICATION TIER"]
        API["ASP.NET Core 8 Web API\nAWS"]
    end
    subgraph data ["DATA TIER"]
        RDS[("Relational database\nPostgreSQL on AWS")]
        S3[("Object storage")]
        Stripe["Stripe API"]
    end
    Browser -->|"HTTPS"| NextJS
    Mobile -->|"HTTPS REST JSON"| API
    NextJS -->|"HTTPS REST JSON"| API
    API -->|"EF Core"| RDS
    API --> S3
    API --> Stripe
```

### ASCII layout

```
[ Browser ] ──► [ Next.js Web App ]
                      │
[ Mobile App ] ───────┼──► [ ASP.NET Core 8 Web API ]
                      │
                 │         │         │
                 ▼         ▼         ▼
         [ Database ]  [ Storage ]  [ Stripe ]
```

### Tier summary

| Tier | Technology | Responsibility |
|------|------------|----------------|
| Presentation | Next.js | Web UI — discovery, dashboards, detailed project workspace |
| Presentation | React Native (Expo) | Mobile UI — notifications, messaging, progress, approvals on the go |
| Application | ASP.NET Core 8 | Auth, workflow, payments, notifications (shared API) |
| Data | Relational DB on AWS | Users, projects, stages, payment records |
| Data | Object storage | Portfolio images and deliverables |
| Data | Stripe | Secure online payments |

---

## Figure 2 — Detailed High-Level Architecture

```mermaid
flowchart TB
    subgraph users ["USERS"]
        Client["Client"]
        Designer["Designer"]
    end
    subgraph presentation ["PRESENTATION TIER"]
        Web["Next.js Web App"]
        Mobile["React Native Mobile App"]
        P1["Auth / Dashboards"]
        P2["Discovery"]
        P3["Project Requests"]
        P4["Project Workspace"]
        P5["Payments"]
    end
    subgraph application ["APPLICATION TIER"]
        ALB["Load Balancer"]
        S1["Auth Service"]
        S2["Profile / Portfolio Service"]
        S3["Request / Proposal Service"]
        S4["Project Workflow Service"]
        S5["Payment Service"]
        S6["Notification Service"]
        S7["File Upload Service"]
        ALB --> S1 & S2 & S3 & S4 & S5 & S6 & S7
    end
    subgraph data ["DATA AND EXTERNAL"]
        D1[("Relational database")]
        D2[("Object storage")]
        D3["Stripe"]
        D4["Auth + Email"]
    end
    Client --> Web & Mobile
    Designer --> Web & Mobile
    Web --> P1 & P2 & P3 & P4 & P5
    Mobile --> P1 & P3 & P4 & P5
    P1 & P2 & P3 & P4 & P5 --> ALB
    S1 & S2 & S3 & S4 & S5 & S6 --> D1
    S5 --> D3
    S6 --> D4
    S7 --> D2
```

### Application services

| Service | Responsibility |
|---------|----------------|
| Auth Service | Registration, login, role-based access |
| Profile / Portfolio Service | Published work, discovery queries |
| Request / Proposal Service | Project needs, designer responses, client selection |
| Project Workflow Service | Staged delivery, feedback, approval of progress |
| Payment Service | Stripe integration, payment records per project |
| Notification Service | In-app alerts and email where required |
| File Upload Service | Media upload for portfolios and deliverables |

---

## Payment approval sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant Web as Web / Mobile App
    participant API as ASP.NET Core API
    participant DB as Database
    participant ST as Stripe

    C->>Web: Approve progress + pay stage
    Web->>API: Submit approval + payment request
    API->>DB: Validate stage + record payment intent
    API->>ST: Create Checkout Session
    ST-->>C: Payment UI
    ST->>API: Webhook succeeded
    API->>DB: Update payment record + advance project
```

---

## Solution structure (.NET)

```
src/
├── Api/              # Controllers, middleware
├── Application/      # Business services
├── Domain/           # Entities, enums
└── Infrastructure/   # EF Core, storage, Stripe, auth
web/                  # Next.js web client
mobile/               # React Native (Expo) app
```

---

## Export checklist

- [ ] `02-simple-architecture.png` — readable at A4 width
- [ ] `03-detailed-architecture.png` — all service boxes legible
- [ ] Technology matches [07-resource-requirements.md](../07-resource-requirements.md)
