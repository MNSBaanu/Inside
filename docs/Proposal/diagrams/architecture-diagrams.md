# Architecture Diagrams

**Project:** Inside — Interior Design Service Platform  
**Stack:** Next.js + React Native + **Node.js / NestJS** + **PostgreSQL (Prisma)** + **Cloudinary** + **Stripe** + Cloud Hosting + GitHub

**Brand colours (diagrams):** light `#B1DDF0` · dark `#10739e` (alternating fills; white text on dark)

Match the **lecturer sample layout** ([Sample/](../Sample/)): Figure 1 = feature hub; Figure 2 = detailed three-tier.

| Figure | Style (sample equivalent) | Export file | Source |
|--------|---------------------------|-------------|--------|
| 1 — System features hub | AHC TOURS hub-and-spoke | `01-feature-overview.png` | [Simple AD.drawio](Simple%20AD.drawio) |
| 2 — Detailed architecture | Three-tier with modules | `02-detailed-architecture.png` | [Detailed AD.drawio](Detailed%20AD.drawio) |

**Export:** Open the `.drawio` files in [draw.io](https://app.diagrams.net) or Canva (import PNG guide) → Export PNG (white background, 300 DPI). Or use Mermaid blocks below via [mermaid.live](https://mermaid.live).

---

## Figure 1 — System Features Overview (Hub-and-Spoke)

Central hub: **INSIDE — Interior Design Service Platform (Web & Mobile)**  
Eight feature nodes with coloured arrows pointing **inward** to the centre (same layout as sample).

| Position | Feature node | Colour |
|----------|--------------|--------|
| 12 o'clock | Portfolio Discovery | Light `#B1DDF0` / stroke `#10739e` |
| 1:30 | Moodboards & Brief | Dark `#10739e` / white text |
| 3 o'clock | Fit Scoring | Light |
| 4:30 | Requests & Proposals | Dark |
| 6 o'clock | Stage Workspace | Light |
| 7:30 | Milestone Payments | Dark |
| 9 o'clock | Dual-Role Dashboards | Light |
| 10:30 | Notifications & Messaging | Dark |
| Centre hub | INSIDE platform | Dark `#10739e` |
| Figure 2 | Trust & Safety · Admin · Messaging modules | See detailed architecture |

### Mermaid (export fallback)

```mermaid
flowchart TB
    Hub["🏠 INSIDE<br/><b>Interior Design Service Platform</b><br/><i>(Web & Mobile)</i>"]

    F1["💻 Portfolio Discovery"]
    F2["🎨 Moodboards & Brief"]
    F3["📊 Fit Scoring"]
    F4["📋 Requests & Proposals<br/><i>open + direct</i>"]
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

    style Hub fill:#10739e,stroke:#10739e,color:#fff
    style F1 fill:#B1DDF0,stroke:#10739e,color:#10739e
    style F2 fill:#10739e,stroke:#10739e,color:#fff
    style F3 fill:#B1DDF0,stroke:#10739e,color:#10739e
    style F4 fill:#10739e,stroke:#10739e,color:#fff
    style F5 fill:#B1DDF0,stroke:#10739e,color:#10739e
    style F6 fill:#10739e,stroke:#10739e,color:#fff
    style F7 fill:#B1DDF0,stroke:#10739e,color:#10739e
    style F8 fill:#10739e,stroke:#10739e,color:#fff
```

---

## Hiring flow (dual paths)

| Path | Trigger | Who responds | Client action |
|------|---------|--------------|---------------|
| **A — Open request** | Client posts request with moodboard + brief | Multiple designers propose | Compare proposals → accept one |
| **B — Direct contact** | Client contacts designer from profile | That designer proposes | Accept proposal |

Both paths: **Request → Proposal → Accept → Stage workspace → Milestone payments**

```mermaid
flowchart TB
    Fit[Fit scores / discovery]
    Fit --> Open[Open request]
    Fit --> Direct[Contact designer]
    Direct --> DirectReq[Direct request]
    Open --> Props[Proposals]
    DirectReq --> Props
    Props --> Accept[Accept proposal]
    Accept --> Workspace[Stage workspace]
```

---

## Figure 2 — Detailed High-Level Architecture (Three-Tier)

Title: **Inside Interior Design Service Platform — Architecture**

### 1. USER LAYER (Presentation)

Communication to application tier: **HTTPS / REST API (JSON)**

| Client | Technology | Key features |
|--------|------------|--------------|
| **Client / Designer Web App** | Next.js (TypeScript, Tailwind) | Auth (incl. reset, verify) · Profiles & settings · Portfolio discovery & search · Favourites · Moodboards & brief · Fit scores · Requests & proposals · Project workspace · Messaging · Milestone ledger · Reviews · Trust (report/block) · Multi-role switch |
| **Admin Web App** | Next.js (admin routes) | User management · Verification queue · Reports · Review & portfolio moderation · Analytics |
| **Mobile App** | React Native — iOS / Android | Push notifications · Messaging · Stage approval · Payment confirmation · Project status · Multi-role switch |

### 2. APPLICATION LAYER (Business Logic)

**Node.js + NestJS Web API** (cloud-hosted)

| Module | Colour group | Responsibility |
|--------|--------------|----------------|
| Auth Module | Green | JWT, Passport, register/login, password reset, email verification, dual-role |
| Moodboard + Brief Module | Green | Saved projects, brief generation and edit |
| Fit Scoring Module | Green | Designer ranking, score breakdown |
| Request / Proposal Module | Green | Open/direct requests, proposals, comparison |
| Project Workflow Module | Green | Stages, deliverables, versions, feedback, approval, timeline, activity log |
| Messaging Module | Green | WebSocket chat, project threads, read/unread |
| Payment + Ledger Module | Green | Stripe milestones, payment audit trail |
| Notification Module | Green | In-app, push, email alerts |
| Trust & Safety Module | Green | Verification, reports, blocks |
| Admin Module | Green | Users, verification queue, moderation, analytics |
| Portfolio Module | Orange | Case studies, discovery, search, filters |
| User Module | Orange | Profiles, settings, availability, favourites, reviews |

**Middleware / guards layer** (red box, spans all requests):

- JWT Authentication · Role Authorization · Input Validation (class-validator) · Error Handling · Logging  
- Security / performance: CORS, Helmet, Rate Limiting

**Data access:** Prisma ORM → PostgreSQL

### 3. DATA LAYER (Persistence)

| Component | Contents |
|-----------|----------|
| **PostgreSQL** (centre, via **Prisma ORM**) | users, designer_profiles, portfolio_projects, favourites, moodboards, structured_briefs, project_requests, proposals, projects, project_stages, deliverables, messages, notifications, milestone_payments, reviews, verifications, reports, blocks, activity_logs, sessions |
| **External Services** (left, dotted line) | **Stripe** — payment gateway · **Email API** — transactional email · **Expo Push** — mobile notifications |
| **Cloudinary** (right, dotted line) | Portfolio images · Deliverable files · Image transforms & CDN · Uploaded assets |

**DevOps:** GitHub (source control + CI) · Cloud hosting (Next.js + NestJS + PostgreSQL)

### Mermaid (export fallback)

```mermaid
flowchart TB
    subgraph userLayer ["USER LAYER (Presentation)"]
        direction LR
        Web["Client / Designer Web App<br/>(Next.js)<br/>─────────────<br/>Auth & Dashboards<br/>Portfolio Discovery<br/>Moodboards & Brief<br/>Fit Scores<br/>Requests & Proposals<br/>Project Workspace<br/>Milestone Ledger"]
        Mobile["Mobile App<br/>(React Native)<br/>─────────────<br/>Push Notifications<br/>Messaging<br/>Stage Approval<br/>Payment Confirmation<br/>Project Status"]
    end

    userLayer -->|"HTTPS / REST API (JSON)"| appLayer

    subgraph appLayer ["APPLICATION LAYER (Business Logic)"]
        direction TB
        API["Node.js + NestJS Web API — Cloud Hosted"]
        subgraph modules ["Functional Modules"]
            direction LR
            M1["Auth"]
            M2["Moodboard + Brief"]
            M3["Fit Scoring"]
            M4["Request / Proposal"]
            M5["Project Workflow"]
            M6["Payment + Ledger"]
            M7["Notification"]
            M8["Messaging"]
            M9["Trust & Safety"]
            M10["Admin"]
            M11["Portfolio"]
            M12["User"]
        end
        MW["Guards & Middleware: JWT · Roles · Validation · Error Handling · Logging · CORS · Rate Limiting"]
        PR["Prisma ORM"]
        API --> modules
        modules --> MW
        MW --> PR
    end

    appLayer --> dataLayer

    subgraph dataLayer ["DATA LAYER (Persistence)"]
        direction LR
        Ext["External Services<br/>─────────────<br/>Stripe<br/>Email API<br/>Expo Push"]
        DB[("PostgreSQL<br/>─────────────<br/>users · portfolios · moodboards<br/>briefs · requests · proposals<br/>projects · stages · payments<br/>reviews · sessions")]
        CL["Cloudinary<br/>─────────────<br/>Portfolio images<br/>Deliverables<br/>Image transforms<br/>Uploaded assets"]
        Ext -.-> DB
        DB -.-> CL
    end

    PR --> DB

    style API fill:#10739e,stroke:#10739e,color:#fff
    style Web fill:#B1DDF0,stroke:#10739e
    style Mobile fill:#10739e,stroke:#10739e,color:#fff
    style MW fill:#B1DDF0,stroke:#10739e
    style PR fill:#10739e,stroke:#10739e,color:#fff
    style M1 fill:#B1DDF0,stroke:#10739e
    style M2 fill:#10739e,stroke:#10739e,color:#fff
    style M3 fill:#B1DDF0,stroke:#10739e
    style M4 fill:#10739e,stroke:#10739e,color:#fff
    style M5 fill:#B1DDF0,stroke:#10739e
    style M6 fill:#10739e,stroke:#10739e,color:#fff
    style M7 fill:#B1DDF0,stroke:#10739e
    style M8 fill:#10739e,stroke:#10739e,color:#fff
    style M9 fill:#B1DDF0,stroke:#10739e
    style M10 fill:#10739e,stroke:#10739e,color:#fff
    style M11 fill:#B1DDF0,stroke:#10739e
    style M12 fill:#10739e,stroke:#10739e,color:#fff
    style DB fill:#B1DDF0,stroke:#10739e
    style Ext fill:#B1DDF0,stroke:#10739e
    style CL fill:#10739e,stroke:#10739e,color:#fff
```

### ASCII layout (sample-style)

```
┌──────────────────────── USER LAYER ────────────────────────────┐
│  [ Client/Designer Web App — Next.js ]  [ Mobile — React Native ]│
└────────────────────────────┬───────────────────────────────────┘
                             │ HTTPS / REST API
┌──────────────────────── APPLICATION LAYER ─────────────────────┐
│  Node.js + NestJS Web API                                          │
│  [Auth][Brief][Fit][Request][Workflow][Payment][Notify]            │
│  [Portfolio][User]                                                 │
│  [ Guards: JWT · Roles · Validation · Logging · CORS ]             │
│  [ Prisma ORM ]                                                    │
└──────────────┬─────────────────────┬───────────────────────────┘
               │                     │
┌──────────────▼──────┐    ┌─────────▼─────────┐    ┌─────────────┐
│ External Services   │    │ PostgreSQL        │    │ Cloudinary  │
│ Stripe · Email ·    │◄──►│ users, projects,  │◄──►│ images,     │
│ Expo Push           │    │ payments, …       │    │ deliverables│
└─────────────────────┘    └───────────────────┘    └─────────────┘
        GitHub (CI) · Cloud Hosting
```

---

## Payment approval sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant App as Web / Mobile App
    participant API as NestJS API
    participant DB as PostgreSQL
    participant ST as Stripe

    C->>App: Approve stage + pay milestone
    App->>API: Submit approval + payment request
    API->>DB: Validate stage + record payment intent (Prisma)
    API->>ST: Create Checkout Session
    ST-->>C: Payment UI
    ST->>API: Webhook succeeded
    API->>DB: Update ledger + advance project stage
```

---

## Solution structure (NestJS monorepo)

```
api/                  # NestJS — controllers, modules, guards
├── src/modules/      # auth, portfolio, moodboard, fit-scoring, …
prisma/               # schema.prisma, migrations
web/                  # Next.js web client
mobile/               # React Native app
.github/              # GitHub Actions CI
```

---

## Export checklist

- [ ] `01-feature-overview.png` — hub centred, 8 nodes readable at A4 width
- [ ] `02-detailed-architecture.png` — all three tiers and module boxes legible
- [ ] `07-gantt-chart.png` — readable at A4 width
- [ ] Technology matches [07-resource-requirements.md](../07-resource-requirements.md)
