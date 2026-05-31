# Inside — System Overview

**What Inside is**, **who uses it**, and **how data flows** from discovery through payment and review.

| Document | Purpose |
|----------|---------|
| Proposal (ELMS) | [Proposal/README.md](Proposal/README.md) |
| Architecture | [Proposal/diagrams/architecture-diagrams.md](Proposal/diagrams/architecture-diagrams.md) |
| Approved topic | [Approval/Topic Approval Documentation.md](Approval/Topic%20Approval%20Documentation.md) |

---

## What is Inside?

**Inside** is a Final Year interior design platform where clients discover designers through **completed room projects**, build **moodboards**, receive an **auto-generated structured brief**, see **designer fit scores**, hire via **open or direct requests and proposals**, collaborate in a **stage-gated workspace**, and pay through a **milestone ledger** (Stripe).

**One-line summary:** Visual brief intelligence + fit scoring + stage-gated delivery—not a generic freelance job board.

---

## Final Year differentiators

| Feature | Description |
|---------|-------------|
| **Structured brief (Layer A)** | Moodboard items → aggregated styles, rooms, budget suggestion |
| **Fit score (Layer B)** | % compatibility between moodboard and each designer’s portfolio |
| **Stage workspace (Layer C)** | Deliverables + approve/reject per stage; chat is secondary |
| **Milestone ledger (Layer D)** | Transparent stage → amount → status → approval history |

---

## Who uses the system?

| Actor | Role |
|-------|------|
| **Guest** | Browse discovery feed (read-only) |
| **Client** | Moodboards, brief, fit scores, requests, approvals, payments, reviews |
| **Designer** | Portfolio, proposals, stage deliverables, availability |
| **Dual-role user** | One account; switch client / designer dashboard |

---

## Core concepts

| Term | Meaning |
|------|---------|
| **Portfolio project** | Room case study: images + style + room type + budget band |
| **Moodboard** | Saved portfolio projects = visual input |
| **Structured brief** | Auto summary derived from moodboard (styles %, rooms, budget band) |
| **Fit score** | 0–100% match between moodboard and designer portfolio |
| **Open project request** | Client post visible to multiple designers; description + moodboard + brief |
| **Direct project request** | Client contacts one designer and sends a targeted request with moodboard + brief |
| **Proposal** | Designer offer: scope, timeline, price, milestones |
| **Project** | Active job after proposal accepted |
| **Stage** | Proposal → Concept → Design → Revision → Completion |
| **Deliverable** | File for current stage (Cloudinary) |
| **Milestone ledger** | Payment record per stage |

---

## End-to-end flow

```mermaid
flowchart LR
    Browse[Browse portfolios] --> Mood[Build moodboard]
    Mood --> Brief[Auto structured brief]
    Brief --> Fit[Designer fit scores]
    Fit --> OpenReq[Open request]
    Fit --> Contact[Contact designer]
    Contact --> DirectReq[Direct request]
    OpenReq --> Proposals[Proposals]
    DirectReq --> Proposals
    Proposals --> Accept[Accept proposal]
    Accept --> Workspace[Stage workspace]
    Workspace --> Ledger[Approve + pay milestone]
    Ledger --> Review[Review]
```

---

## Flow 1 — Discovery and moodboard

1. Client browses **discovery feed** (filter: style, room, budget).
2. Saves projects to **moodboard**.
3. System generates **structured brief** (rule-based tag aggregation in MVP; optional ML image labelling in Phase 2).

```mermaid
sequenceDiagram
    actor Client
    participant Web as Next.js
    participant API as NestJS API
    participant DB as PostgreSQL

    Client->>Web: Browse / save to moodboard
    Web->>API: GET/POST moodboards
    API->>DB: Persist items (Prisma)
    Client->>Web: Generate brief
    Web->>API: GET /moodboards/{id}/brief
    API->>DB: Aggregate style/room/budget tags
    API-->>Web: Structured brief DTO
```

---

## Flow 2 — Fit scoring

Before posting a request, client views designers ranked by **fit score**:

- Overlap on **design style** tags
- Overlap on **room types**
- **Budget band** alignment

```mermaid
flowchart LR
    Moodboard[Moodboard tags] --> Algo[Fit scoring service]
    Portfolios[Designer portfolios] --> Algo
    Algo --> Rank[Ranked designer list]
```

**MVP algorithm (example):** weighted score = 40% style overlap + 35% room overlap + 25% budget match.

---

## Flow 3 — Hire (dual paths: open or direct)

Both paths require **request → proposal → accept** before a project starts. There is no instant gig-style booking.

### Path A — Open request (multi-designer)

1. Client creates an **open request** (space, budget, notes) + moodboard + brief.
2. Multiple designers submit **proposals**.
3. Client compares proposals and accepts one → **Project** created at stage `Proposal`.

### Path B — Direct contact (single designer)

1. Client views a designer profile (from discovery or fit scores) and **contacts** them via messaging.
2. Client sends a **direct request** to that designer with moodboard + brief attached.
3. Designer submits a **proposal**.
4. Client accepts → **Project** created at stage `Proposal`.

```mermaid
flowchart TB
    subgraph pathA ["Path A — Open request"]
        A1[Post open request] --> A2[Multiple proposals]
        A2 --> A3[Compare and accept]
    end
    subgraph pathB ["Path B — Direct contact"]
        B1[Contact designer] --> B2[Send direct request]
        B2 --> B3[Designer proposal]
        B3 --> B4[Accept proposal]
    end
    A3 --> Project[Project created]
    B4 --> Project
    Project --> Workspace[Stage workspace]
```

---

## Flow 4 — Stage-gated workspace (primary collaboration)

Workspace UI is organised by **stage tabs**, not a single chat thread.

| Stage | Designer | Client |
|-------|----------|--------|
| Concept | Upload concept boards | Approve / reject + comment |
| Design | Upload design package | Approve / reject |
| Revision | Upload revisions | Approve / reject |
| Completion | Final package | Approve + final payment |

- **Deliverables** uploaded per stage (Cloudinary).
- **Messaging** available for clarification but approval happens on stage panel.
- Optional stretch: image annotation on deliverable.

```mermaid
stateDiagram-v2
    [*] --> Proposal
    Proposal --> Concept: Accepted
    Concept --> Design: Approved_and_paid
    Design --> Revision: Approved_and_paid
    Revision --> Completion: Approved
    Completion --> [*]: Final_payment_and_review
```

---

## Flow 5 — Milestone ledger and Stripe

1. Client opens **ledger** for project: stage | amount | status | approved at.
2. Client approves stage → API creates Stripe Checkout / Payment Intent.
3. Webhook confirms payment → stage advances.

Stripe webhooks are authoritative; ledger UI reflects database state.

---

## Flow 6 — Review

After **Completion** and final payment, client submits rating + review on designer profile.

---

## Technology stack

| Layer | Technology |
|-------|------------|
| Web | Next.js 14, TypeScript, Tailwind |
| Mobile | React Native |
| Backend | Node.js, NestJS |
| Database | PostgreSQL + Prisma |
| Files | Cloudinary |
| Auth | JWT, Passport, dual-role (client/designer) |
| Email | Email API (transactional) |
| Payments | Stripe |
| Ops | GitHub Actions, cloud hosting |

Details: [Proposal/07-resource-requirements.md](Proposal/07-resource-requirements.md) (includes technology justification).

---

## Repository structure (planned)

```
Inside/
├── api/                       # NestJS — modules, guards, controllers
│   └── prisma/                # schema.prisma, migrations
├── web/                       # Next.js
├── mobile/                    # React Native
└── docs/
```

---

## Software modules

| Module | Responsibility |
|--------|----------------|
| Auth | JWT, dual-role, Passport |
| Discovery | Portfolio feed, filters |
| Moodboard + Brief | Boards, items, brief generation |
| Fit scoring | Rank designers for moodboard |
| Hiring | Requests, proposals, accept |
| Project workflow | Stages, deliverables, approvals |
| Payments | Stripe, milestone ledger |
| Notifications | In-app + push + email |
| Reviews | Post-completion ratings |

---

## Data model (simplified)

```mermaid
erDiagram
    User ||--o| DesignerProfile : has
    User ||--o{ Moodboard : owns
    Moodboard ||--o| StructuredBrief : generates
    DesignerProfile ||--o{ PortfolioProject : publishes
    User ||--o{ ProjectRequest : creates
    ProjectRequest ||--o{ Proposal : receives
    Proposal ||--|| Project : creates
    Project ||--o{ ProjectStage : has
    Project ||--o{ MilestonePayment : has
    Project ||--o| Review : earns
```

---

## MVP vs Phase 2

| MVP | Phase 2 |
|-----|---------|
| Rule-based brief + fit score | ML image labelling |
| HTTP messaging (polling) | WebSocket |
| Stripe test mode | Stripe Connect payouts |
| Stage tabs + file approval | Deliverable annotations |

See scope section in [Proposal/06-proposed-solution.md](Proposal/06-proposed-solution.md).

---

## Implementation order

1. Auth + dual-role (JWT)  
2. Portfolio + discovery  
3. Moodboards + **brief generation**  
4. **Fit scoring** + requests/proposals  
5. Stage workspace + Cloudinary deliverables  
6. Stripe ledger  
7. Reviews + notifications  
8. Cloud deployment + evaluation  

Matches [Proposal/10-project-plan.md](Proposal/10-project-plan.md).
