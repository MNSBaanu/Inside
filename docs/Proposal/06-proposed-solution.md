# Proposed Solution

The proposed solution is a web and mobile Interior Design Service Platform that provides a centralized environment for clients, interior designers, and administrators to discover, communicate, collaborate, and manage design projects. The platform supports the complete interaction process from designer discovery and project requests to project tracking, reviews, milestone-based payments, trust and safety, and administrative oversight. A companion **mobile application** provides notifications, messaging, stage approval, and payment confirmation on the go, while the **web application** remains the primary channel for richer browsing, portfolio viewing, moodboard building, proposal comparison, detailed workspace management, and admin tools on larger screens.

Unlike closed matching services such as Havenly and Decorilla, general freelance marketplaces such as Fiverr and Upwork, or discovery-only platforms such as Houzz and Behance, the proposed system combines **open client choice** from demonstrated completed work, **visual brief preparation**, **evidence-based designer ranking**, **interior-design-specific project stages**, **approval-gated milestone payment**, and **platform governance** (verification, reporting, moderation) in one product on web and mobile.

Clients browse and search completed room projects filtered by style, room type, and budget; save work to **moodboards**; receive an auto-generated **structured brief** (editable before use); view **fit scores** with a breakdown of why each designer matches; and save **favourite designers**. They hire in **two ways**: (1) post an **open project request** with moodboard and brief attached so multiple designers submit proposals for side-by-side comparison; or (2) **contact a designer directly**, discuss requirements via **real-time messaging**, and send a **targeted request**. Work begins only after the client **accepts a proposal**. Accepted projects use a **stage-gated workspace** with deliverables, version history, feedback, approve/reject, timelines, due dates, and activity history before the client releases payment at each milestone.

Designers publish portfolio case studies, set **availability**, respond to open or direct requests with scoped proposals, upload deliverables with **version history**, and receive payment when the client approves each stage. **Dual-role** accounts allow one user to act as client or designer with separate dashboards. **Reviews and ratings** apply after project completion. **Administrators** manage users, verification, reports, reviews, projects, analytics, and portfolio moderation.

The system follows a **three-tier architecture** (IBM, 2024). The **presentation tier** includes a **Next.js** web client (client, designer, and admin areas) and a **React Native** mobile client, both calling the same API. The **application tier** is a **Node.js / NestJS** REST API with WebSocket support for real-time messaging, handling authentication, portfolios, moodboards, brief and fit-scoring logic, requests and proposals, staged workflow, messaging, payments, notifications, trust and safety, and administration. The **data tier** uses **PostgreSQL** with **Prisma**, **Cloudinary** for media, **Stripe** for payments, an **email API** for verification and transactional mail, and **Expo Push** for mobile notifications. The system is hosted on cloud infrastructure with **GitHub** for source control and CI.

---

## System capabilities (functional scope)

The following summarises the functional requirements the system will implement.

### 1. User management

* Register as client or designer; secure login and logout.
* Reset forgotten passwords; verify email addresses during registration.
* Manage profiles and update account settings.
* Dual-role accounts with switching between client and designer.
* Role-based access control (client, designer, administrator).

### 2. Portfolio and designer discovery

* Designers create and manage portfolio projects with images and details.
* Clients browse portfolios, use a discovery feed, search designers and projects, and filter by style, room type, and budget.
* Designer profiles show availability status; clients save favourite designers.

### 3. Moodboards and brief generation

* Clients create and manage moodboards and save inspirations.
* System generates structured briefs from saved items; clients edit briefs before submission.

### 4. Designer matching

* Fit scores between briefs and designers; ranked list with calculation breakdown.

### 5. Project requests and proposals

* Open and direct project requests; designers view requests and submit proposals.
* Clients compare proposals and accept one to create a project.

### 6. Project workspace

* Dedicated workspace per project; stages: Proposal, Concept, Design, Revision, Completion.
* Deliverable upload, view/download, version history, client feedback, approve/reject.
* Progress tracking, timelines and due dates, activity history.

### 7. Communication and notifications

* Real-time messaging; project-based conversations; read/unread status.
* In-app and email notifications for important events.

### 8. Payment management

* Stripe integration; milestone payments after client approval.
* Payment ledger, history, and status per project.

### 9. Reviews and ratings

* Post-completion reviews and 1–5 star ratings on designer profiles.

### 10. Trust and safety

* Designer verification; report users or projects; block users; admin review of reports.

### 11. Mobile application

* Push notifications, messaging, project progress, stage approve/reject, milestone payment confirmation, role switching.

### 12. Administration

* Manage users, verification requests, reviews, reports, projects, analytics, and portfolio content.

---

## Web and mobile responsibility

| Capability | Web | Mobile |
|------------|-----|--------|
| Full discovery, search, filters, moodboards, brief, fit scores | Primary | Limited |
| Portfolio create/edit | Primary | Light upload optional |
| Open/direct requests and proposal comparison | Primary | Summary only |
| Full project workspace and deliverable review | Primary | Preview + approve/reject |
| Real-time messaging | Yes | Yes |
| Notifications | In-app + email | Push + in-app |
| Milestone payment (Stripe) | Yes | Confirm after approval |
| Admin moderation and analytics | Primary | No |
| Role switch (client/designer) | Yes | Yes |

---

## Application modules (summary)

| Module | Responsibility |
|--------|----------------|
| Auth | JWT, registration, login, password reset, email verification, dual-role |
| User | Profiles, settings, availability, favourites, reviews display |
| Portfolio | Case studies, discovery feed, search and filters |
| Moodboard + Brief | Saved inspirations, brief generation and edit |
| Fit scoring | Ranking and score breakdown |
| Request / Proposal | Open and direct requests, proposals, comparison |
| Project workflow | Stages, deliverables, versions, feedback, approval, timeline, activity log |
| Messaging | Real-time chat, project threads, read receipts |
| Payment + ledger | Stripe milestones, ledger and history |
| Notification | In-app, email, push |
| Trust and safety | Verification, reports, blocks |
| Admin | Users, verification queue, moderation, analytics |

Middleware and guards enforce JWT authentication, role authorization, input validation, error handling, and logging (CORS, Helmet, rate limiting).
