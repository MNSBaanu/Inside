# Architecture Diagrams

**Project:** Inside — Interior Design Service Platform  
**Stack:** Next.js + React Native (Expo) + ASP.NET Core 8 Web API + AWS (RDS PostgreSQL, S3, Cognito) + Stripe

Match the **lecturer sample layout** ([Sample/](../Sample/)): Figure 1 = feature hub; Figure 2 = detailed three-tier.

| Figure | Style (sample equivalent) | Export file |
|--------|---------------------------|-------------|
| 1 — System features hub | AHC TOURS hub-and-spoke | `01-feature-overview.png` |
| 2 — Detailed architecture | Three-tier with modules | `02-detailed-architecture.png` |

**Export:** Open [01-feature-hub.drawio](01-feature-hub.drawio) / [02-detailed-architecture.drawio](02-detailed-architecture.drawio) in [draw.io](https://app.diagrams.net) → File → Export as PNG (white background, 300 DPI). Or use Mermaid blocks below via [mermaid.live](https://mermaid.live).

---

## Figure 1 — System Features Overview (Hub-and-Spoke)

Central hub: **INSIDE — Interior Design Service Platform (Web & Mobile)**  
Eight feature nodes with coloured arrows pointing **inward** to the centre (same layout as sample).

| Position | Feature node | Colour (sample match) |
|----------|--------------|------------------------|
| 12 o'clock | Portfolio Discovery | Blue |
| 1:30 | Moodboards & Brief | Orange |
| 3 o'clock | Fit Scoring | Green |
| 4:30 | Requests & Proposals | Orange |
| 6 o'clock | Stage Workspace | Purple |
| 7:30 | Milestone Payments | Blue |
| 9 o'clock | Dual-Role Dashboards | Yellow |
| 10:30 | Notifications & Messaging | Green |

### Mermaid (export fallback)

```mermaid
flowchart TB
    Hub["🏠 INSIDE<br/><b>Interior Design Service Platform</b><br/><i>(Web & Mobile)</i>"]

    F1["💻 Portfolio Discovery"]
    F2["🎨 Moodboards & Brief"]
    F3["📊 Fit Scoring"]
    F4["📋 Requests & Proposals"]
    F5["✅ Stage Workspace"]
    F6["💳 Milestone Payments"]
    F7["👤 Dual-Role Dashboards"]
    F8["🔔 Notifications & Messaging"]

    F1 --> Hub
    F2 --> Hub
    F3 --> Hub
    F4 --> Hub
    F5 --> Hub
    F6 --> Hub
    F7 --> Hub
    F8 --> Hub

    style Hub fill:#2563eb,stroke:#1e40af,color:#fff
    style F1 fill:#dbeafe,stroke:#2563eb
    style F2 fill:#ffedd5,stroke:#ea580c
    style F3 fill:#dcfce7,stroke:#16a34a
    style F4 fill:#ffedd5,stroke:#ea580c
    style F5 fill:#f3e8ff,stroke:#9333ea
    style F6 fill:#dbeafe,stroke:#2563eb
    style F7 fill:#fef9c3,stroke:#ca8a04
    style F8 fill:#dcfce7,stroke:#16a34a
```

---

## Figure 2 — Detailed High-Level Architecture (Three-Tier)

Title: **Inside Interior Design Service Platform — Architecture**

### 1. USER LAYER (Presentation)

Communication to application tier: **HTTPS / REST API (JSON)**

| Client | Technology | Key features |
|--------|------------|--------------|
| **Client / Designer Web App** | Next.js (TypeScript, Tailwind) | Auth & dashboards · Portfolio discovery · Moodboards & brief · Fit scores · Requests & proposals · Project workspace · Milestone ledger · Multi-role switch |
| **Mobile App** | React Native (Expo) — iOS / Android | Push notifications · Messaging · Stage approval · Payment confirmation · Project status · Multi-role switch |

### 2. APPLICATION LAYER (Business Logic)

**ASP.NET Core 8 Web API** on AWS (ECS Fargate + ALB)

| Module | Colour group | Responsibility |
|--------|--------------|----------------|
| Auth Module | Green | Cognito, JWT, dual-role (client/designer) |
| Moodboard + Brief Module | Green | Saved projects, structured brief generation |
| Fit Scoring Module | Green | Designer ranking, score breakdown |
| Request / Proposal Module | Green | Requests, proposals, comparison |
| Project Workflow Module | Green | Stages, deliverables, version history, approval |
| Payment + Ledger Module | Green | Stripe milestones, payment audit trail |
| Notification Module | Green | In-app, push, email alerts |
| Portfolio Module | Orange | Case studies, discovery filters |
| User Module | Orange | Profiles, availability, reviews |

**Middleware layer** (red box, spans all requests):

- JWT Authentication · Role Authorization · Input Validation · Error Handling · Logging  
- Security / performance: CORS, Helmet, Rate Limiting

### 3. DATA LAYER (Persistence)

| Component | Contents |
|-----------|----------|
| **Amazon RDS PostgreSQL** (centre) | users, designer_profiles, portfolio_projects, moodboards, structured_briefs, project_requests, proposals, projects, project_stages, deliverables, milestone_payments, reviews, sessions |
| **External Services** (left, dotted line) | **Stripe** — payment gateway · **AWS SES** — email · **AWS Cognito** — authentication |
| **File Storage — Amazon S3** (right, dotted line) | Portfolio images · Deliverable files · QR / receipt assets · System logs · Backup files |

### Mermaid (export fallback)

```mermaid
flowchart TB
    subgraph userLayer ["USER LAYER (Presentation)"]
        direction LR
        Web["Client / Designer Web App<br/>(Next.js)<br/>─────────────<br/>Auth & Dashboards<br/>Portfolio Discovery<br/>Moodboards & Brief<br/>Fit Scores<br/>Requests & Proposals<br/>Project Workspace<br/>Milestone Ledger"]
        Mobile["Mobile App<br/>(React Native Expo)<br/>─────────────<br/>Push Notifications<br/>Messaging<br/>Stage Approval<br/>Payment Confirmation<br/>Project Status"]
    end

    userLayer -->|"HTTPS / REST API (JSON)"| appLayer

    subgraph appLayer ["APPLICATION LAYER (Business Logic)"]
        direction TB
        API["ASP.NET Core 8 Web API — AWS"]
        subgraph modules ["Functional Modules"]
            direction LR
            M1["Auth"]
            M2["Moodboard + Brief"]
            M3["Fit Scoring"]
            M4["Request / Proposal"]
            M5["Project Workflow"]
            M6["Payment + Ledger"]
            M7["Notification"]
            M8["Portfolio"]
            M9["User"]
        end
        MW["Middleware: JWT Auth · Role Auth · Validation · Error Handling · Logging · CORS · Rate Limiting"]
        API --> modules
        modules --> MW
    end

    appLayer --> dataLayer

    subgraph dataLayer ["DATA LAYER (Persistence)"]
        direction LR
        Ext["External Services<br/>─────────────<br/>Stripe<br/>AWS SES<br/>AWS Cognito"]
        DB[("Amazon RDS PostgreSQL<br/>─────────────<br/>users · portfolios · moodboards<br/>briefs · requests · proposals<br/>projects · stages · payments<br/>reviews · sessions")]
        S3["Amazon S3<br/>─────────────<br/>Portfolio images<br/>Deliverables<br/>Uploaded assets<br/>System logs"]
        Ext -.-> DB
        DB -.-> S3
    end

    style Web fill:#dcfce7,stroke:#16a34a
    style Mobile fill:#f3e8ff,stroke:#9333ea
    style MW fill:#fecaca,stroke:#dc2626
    style M1 fill:#dcfce7,stroke:#16a34a
    style M2 fill:#dcfce7,stroke:#16a34a
    style M3 fill:#dcfce7,stroke:#16a34a
    style M4 fill:#dcfce7,stroke:#16a34a
    style M5 fill:#dcfce7,stroke:#16a34a
    style M6 fill:#dcfce7,stroke:#16a34a
    style M7 fill:#dcfce7,stroke:#16a34a
    style M8 fill:#ffedd5,stroke:#ea580c
    style M9 fill:#ffedd5,stroke:#ea580c
    style DB fill:#e9d5ff,stroke:#9333ea
    style Ext fill:#dbeafe,stroke:#2563eb
    style S3 fill:#fef9c3,stroke:#ca8a04
```

### ASCII layout (sample-style)

```
┌──────────────────────── USER LAYER ────────────────────────────┐
│  [ Client/Designer Web App — Next.js ]  [ Mobile — Expo ]      │
└────────────────────────────┬───────────────────────────────────┘
                             │ HTTPS / REST API
┌──────────────────────── APPLICATION LAYER ─────────────────────┐
│  ASP.NET Core 8 Web API                                          │
│  [Auth][Brief][Fit][Request][Workflow][Payment][Notify]        │
│  [Portfolio][User]                                               │
│  [ Middleware: JWT · Roles · Validation · Logging · CORS ]     │
└──────────────┬─────────────────────┬───────────────────────────┘
               │                     │
┌──────────────▼──────┐    ┌─────────▼─────────┐    ┌─────────────┐
│ External Services   │    │ RDS PostgreSQL    │    │ Amazon S3   │
│ Stripe · SES ·      │◄──►│ users, projects,  │◄──►│ images,     │
│ Cognito             │    │ payments, …       │    │ deliverables│
└─────────────────────┘    └───────────────────┘    └─────────────┘
```

---

## Payment approval sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant App as Web / Mobile App
    participant API as ASP.NET Core API
    participant DB as PostgreSQL
    participant ST as Stripe

    C->>App: Approve stage + pay milestone
    App->>API: Submit approval + payment request
    API->>DB: Validate stage + record payment intent
    API->>ST: Create Checkout Session
    ST-->>C: Payment UI
    ST->>API: Webhook succeeded
    API->>DB: Update ledger + advance project stage
```

---

## Solution structure (.NET)

```
src/
├── Api/              # Controllers, middleware
├── Application/      # BriefService, FitScoringService, …
├── Domain/           # Entities, enums
└── Infrastructure/   # EF Core, S3, Stripe, Cognito
web/                  # Next.js web client
mobile/               # React Native (Expo) app
```

---

## Export checklist

- [ ] `01-feature-overview.png` — hub centred, 8 nodes readable at A4 width
- [ ] `02-detailed-architecture.png` — all three tiers and module boxes legible
- [ ] `07-gantt-chart.png` — readable at A4 width
- [ ] Technology matches [07-resource-requirements.md](../07-resource-requirements.md)
