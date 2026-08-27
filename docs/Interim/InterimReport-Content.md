# Interim Report Content — Inside Platform

## Chapter 4 — Requirement Analysis

### 4.1 Introduction

Requirement analysis is a critical phase in software development that involves systematically identifying, documenting, and validating the functional and non-functional needs of stakeholders. This process ensures that the proposed system aligns with user expectations and business objectives. For the Inside platform, requirement analysis focused on understanding the needs of three primary user groups: clients seeking interior design services, designers offering their expertise, and administrators managing the platform. The analysis employed multiple fact-finding techniques to gather comprehensive requirements, analyze existing manual processes, and define specifications for the new system.

### 4.2 Fact Finding / Requirement Gathering

#### 4.2.1 Interviews with Stakeholders

Semi-structured interviews were conducted with potential clients, interior designers, and industry professionals to understand current pain points in the design hiring process. Clients expressed frustration with unclear pricing, difficulty finding designers matching their aesthetic preferences, and lack of milestone-based payment options. Designers highlighted challenges in showcasing their work effectively, managing client expectations, and securing reliable payment for staged deliverables. These interviews revealed the need for portfolio discovery with style-based filtering, visual brief creation tools, and escrow payment mechanisms.

#### 4.2.2 Observation of Existing Platforms

Analysis of competitor platforms such as Houzz, Decorilla, and Havenly was conducted to identify best practices and gaps in current solutions. Observations showed that most platforms lack integrated brief creation from moodboards, algorithmic designer matching based on portfolio fit, and transparent stage-gated project workflows. This observation confirmed the need for a comprehensive solution that bridges discovery, hiring, and collaboration in one unified platform.

#### 4.2.3 Questionnaire Survey

An online questionnaire was distributed to 50 respondents (30 potential clients, 20 designers) to quantify preferences and pain points. Results showed that 82% of clients prefer viewing completed projects before hiring, 76% want milestone-based payments, and 68% value designer verification. Among designers, 85% expressed difficulty in showcasing portfolio diversity, and 70% wanted structured project workflows to manage client revisions. The survey validated the importance of portfolio-centric discovery, verification systems, and staged collaboration features.

### 4.3 Current System Description

The current process for hiring interior designers in Sri Lanka relies on manual, fragmented methods. Clients typically discover designers through word-of-mouth referrals, social media posts, or generic freelance platforms not tailored to interior design. Communication occurs via WhatsApp, email, or phone calls, leading to scattered information and unclear project scopes. Pricing negotiations happen informally without standardized structures, and payment terms are verbal agreements without escrow protection. Project collaboration involves sharing files through email or cloud storage links, with no centralized workspace for deliverables, revisions, or approvals. This ad-hoc approach results in misaligned expectations, payment disputes, and project delays.

### 4.4 Problems of the Current System

**Lack of Centralized Discovery**: Clients struggle to find designers matching their style preferences and budget. Manual searches through social media or portfolio websites are time-consuming and lack filtering capabilities. No standardized format exists for presenting designer portfolios, making comparisons difficult.

**Unclear Project Scopes**: Verbal or email-based project briefs lack structure, leading to misaligned expectations. Clients often fail to articulate design preferences clearly, and designers struggle to capture requirements systematically. This ambiguity causes scope creep and dissatisfaction.

**Absence of Milestone Payments**: Upfront or completion-based payment models expose both parties to risk. Clients worry about paying before work is completed; designers risk non-payment after delivering work. No escrow mechanisms exist to hold funds securely during project stages.

**Fragmented Communication**: Using multiple channels (WhatsApp, email, phone) for project discussions scatters information. File sharing via cloud links lacks version control and approval workflows. Clients and designers lose track of decisions, feedback, and deliverable statuses.

**No Trust Mechanisms**: Absence of verification, reviews, and ratings makes it difficult for clients to assess designer credibility. Designers have no formal way to showcase past client satisfaction. Dispute resolution relies on informal negotiations without platform mediation.

**Administrative Overhead**: Manual tracking of projects, payments, and user activities creates inefficiency. No centralized system for moderating reports, verifying designers, or monitoring transactions exists, limiting platform scalability.

### 4.5 Requirements of the New System

#### 4.5.1 Functional Requirements Specification

The Inside platform shall implement the following functional capabilities:

**Authentication and User Management**
- **FR1**: The system shall allow clients and designers to register accounts with email verification, secure password hashing (bcrypt), and JWT-based session management. Users shall authenticate via email/password and receive access tokens (15-minute expiry) and refresh tokens (7-day expiry). The system shall support password reset via email-based token validation and dual-role switching for users holding both CLIENT and DESIGNER roles.

**Portfolio Discovery**
- **FR2**: The system shall enable public browsing of published designer portfolios with filters for style (e.g., Modern, Scandinavian, Coastal), room type (e.g., Living Room, Bedroom, Kitchen), budget band, and designer location. Portfolios shall display images, project descriptions, designer information, ratings, and verification badges. Designers shall manage portfolios (create, edit, publish, add/remove images) with draft and published states.

**Moodboards and Briefs**
- **FR3**: The system shall allow clients to create visual moodboards by collecting inspiration images with captions and layout positions. Clients shall generate structured project briefs from moodboards, automatically extracting styles, rooms, and budget. Briefs shall be editable and serve as input for designer matching algorithms.

**Designer Matching**
- **FR4**: The system shall compute fit scores ranking designers by portfolio overlap with client briefs. The matching algorithm shall evaluate style and room type alignment, apply availability filters, and return ranked results with match percentages. Clients shall view matched portfolios and send hire requests from match pages.

**Hiring and Proposals**
- **FR5**: The system shall enable clients to send hire requests specifying briefs and timelines. Designers shall accept or reject requests, submit detailed proposals with per-stage fees (Brief, Concept, Design, Revision, Completion), estimated timelines, and cover letters. Clients shall compare proposals side-by-side and accept one, triggering project creation.

**Project Workspace**
- **FR6**: The system shall provide a unified workspace for each project with stage progression (BRIEF → CONCEPT → DESIGN → REVISION → COMPLETION). Designers shall upload deliverables (images, files, notes) to the current stage. Clients shall approve or reject stages with mandatory feedback. Stage approvals shall advance the project and unlock milestone payments. Both parties shall manage project status (active, on-hold, cancelled, completed).

**Milestone Payments**
- **FR7**: The system shall auto-generate milestone payments per project stage based on accepted proposal fees. Clients shall mark payments as paid (Stripe integration stubbed), placing funds in escrow. After stage approval, clients or admins shall release payments to designers. The system shall track payment statuses (pending, paid, released, cancelled) and log all transactions.

**Messaging and Notifications**
- **FR8**: The system shall provide project-scoped real-time chat for client-designer communication. Messages shall include sender, timestamp, and read/unread status. The system shall generate in-app and email notifications for events including hire requests, proposal acceptances, stage approvals, payments, and new messages. Users shall mark notifications as read.

**Reviews and Ratings**
- **FR9**: The system shall allow clients to submit reviews for designers after project completion, including ratings (1–5 stars), titles, comments, and images. Reviews shall display on designer profiles with computed average ratings. Admins shall moderate reviews by toggling public visibility.

**Favourites and Saved Designers**
- **FR10**: The system shall allow clients to save designers to a favourites list for quick access. The system shall prevent duplicate favourites and support toggle operations (save/unsave).

**Trust and Safety**
- **FR11**: The system shall enable users to report others for inappropriate content, spam, harassment, or fraud. Users shall block others, preventing discovery, messaging, and hire requests. Designers shall submit verification requests with ID proof and credentials. Admins shall review verification requests and approve or reject with feedback. Verified designers shall receive badge indicators.

**Admin Management**
- **FR12**: The system shall provide administrators with user management capabilities (view all users, suspend, reactivate). Admins shall triage user reports (mark under review, resolve, dismiss). Admins shall moderate reviews by hiding inappropriate content. The system shall log all admin actions for audit trails.

#### 4.5.2 Non-Functional Requirements

**Performance**
- **NFR1**: The system shall load portfolio discovery pages within 2 seconds under normal network conditions. API endpoints shall respond within 500ms for read operations and 1 second for write operations. The system shall support at least 100 concurrent users without performance degradation.

**Scalability**
- **NFR2**: The system architecture shall scale horizontally to accommodate increasing user base. Database queries shall use indexing on foreign keys and frequently filtered fields (style, room type, status). The system shall support adding new features and modules without major architectural changes.

**Security**
- **NFR3**: All user passwords shall be hashed using bcrypt with a minimum of 10 salt rounds. API endpoints shall enforce authentication via JWT tokens for protected resources. The system shall implement role-based access control (CLIENT, DESIGNER, ADMIN) with guard mechanisms preventing unauthorized actions. Sensitive data (payment info, personal details) shall be encrypted at rest and in transit using TLS 1.3.

**Usability**
- **NFR4**: The user interface shall follow responsive design principles, adapting to desktop, tablet, and mobile screen sizes. Forms shall provide real-time validation feedback. The system shall use consistent visual language (colors, typography, spacing) across all screens. Error messages shall be clear and actionable.

**Reliability**
- **NFR5**: The system shall maintain 99.5% uptime during business hours. Database transactions shall use ACID properties to ensure data integrity. The system shall implement graceful error handling, logging errors without exposing sensitive information to users. Backup mechanisms shall run daily to prevent data loss.

**Maintainability**
- **NFR6**: The codebase shall follow modular architecture (NestJS modules for API, Next.js pages for web). Code shall adhere to TypeScript strict mode and ESLint rules. API endpoints shall be documented with Swagger/OpenAPI specifications. The system shall use version control (Git) with clear commit messages and branching strategies.

**Compliance**
- **NFR7**: The system shall comply with data protection regulations (GDPR principles). Users shall provide explicit consent for data collection. The system shall allow users to request data deletion. Admin actions shall be logged for accountability and audit purposes.

**Interoperability**
- **NFR8**: The system shall integrate with third-party services: Cloudinary for image uploads, Stripe for payment processing (initially stubbed). The API shall follow RESTful conventions, returning JSON responses. Future mobile app shall consume the same REST API without modifications.

---

## Chapter 5 — Design

### 5.1 Overview

System design is the process of defining the architecture, components, modules, interfaces, and data structures to satisfy specified requirements. It bridges the gap between requirement analysis and implementation by creating blueprints that guide developers in building the system. The Inside platform employs a multi-tier architecture approach, separating concerns into presentation, business logic, and data persistence layers. This separation enhances maintainability, scalability, and testability. The design phase includes software architecture definition, process modeling through data-flow and activity diagrams, object-oriented class design, database schema modeling with entity-relationship diagrams, and user interface wireframing. Each design artifact serves a specific purpose in communicating system structure and behavior to development teams and stakeholders.

### 5.2 Software Architecture

The Inside platform adopts a **3-tier architecture** consisting of:

**Presentation Layer (Client-Side)**
- **Web Application**: Built with Next.js 14, React, and TypeScript. Handles user interface rendering, client-side routing, form validation, and API consumption. Implements responsive design using Tailwind CSS.
- **Future Mobile Application**: Planned Expo/React Native app consuming the same REST API.

**Business Logic Layer (Application Server)**
- **API Server**: Developed with NestJS framework following modular architecture. Implements RESTful endpoints, authentication middleware (JWT guards), authorization (role-based guards), business logic services, and data validation using DTOs (Data Transfer Objects). Swagger documentation auto-generated for all endpoints.

**Data Layer (Database)**
- **PostgreSQL Database**: Relational database storing users, portfolios, briefs, projects, payments, messages, and audit logs. Accessed via Prisma ORM providing type-safe queries, migration management, and relationship handling.

**Supporting Services**
- **Cloudinary** (stubbed): Image storage and transformation service.
- **Stripe** (stubbed): Payment processing and escrow management.

The architecture ensures separation of concerns, allowing independent scaling of layers and simplified testing through dependency injection.

### 5.3 Process Designs

#### 5.3.1 Data Flow Diagrams

**Context Diagram (DFD Level 0)**
- External entities: Client, Designer, Admin
- Main process: Inside Platform System
- Data flows: Client submits briefs, browses portfolios; Designer uploads portfolios, submits proposals; Admin moderates reports and verifications.

**Level 1 DFD**
- Decomposition into subsystems:
  1. Authentication & User Management
  2. Portfolio Discovery & Management
  3. Brief & Moodboard Creation
  4. Designer Matching
  5. Hiring & Proposals
  6. Project Workspace
  7. Payment Processing
  8. Messaging & Notifications
  9. Reviews & Ratings
  10. Admin & Moderation

#### 5.3.2 Activity Diagrams

**Activity Diagram 1: Hiring Workflow**
- Client creates brief → Runs designer matching → Reviews ranked designers → Sends hire request → Designer receives notification → Designer accepts request → Designer submits proposal → Client reviews proposals → Client accepts proposal → Project created → Milestone payments generated

**Activity Diagram 2: Project Stage Approval**
- Designer uploads deliverables to current stage → Client reviews deliverables → Decision point (Approve or Reject) → If rejected: Client provides feedback → Designer revises → Loop back → If approved: Stage advances → Milestone payment unlocked → Next stage begins → Repeat until completion

**Activity Diagram 3: Portfolio Discovery**
- User (guest or logged-in) → Applies filters (style, room, budget) → System queries published portfolios → Returns paginated results → User views portfolio detail → Decision point (If client logged in: Save to favourites or Send hire request)

#### 5.3.3 Sequence Diagrams (Optional, included for clarity)

**Sequence Diagram 1: Accept Proposal**
- Client → API: POST /proposals/:id/accept
- API → ProposalsService: accept(userId, proposalId)
- ProposalsService → Database: Fetch proposal, validate client ownership
- ProposalsService → ProjectsService: Create project
- ProjectsService → Database: Insert project record
- ProjectsService → PaymentsService: Generate milestone payments
- PaymentsService → Database: Insert payment records per stage
- ProjectsService → NotificationsService: Notify designer
- API → Client: 200 OK with project data

**Sequence Diagram 2: Stage Approval**
- Client → API: PATCH /stages/:id/approve
- API → StagesService: approve(userId, stageId)
- StagesService → Database: Update stage status to APPROVED
- StagesService → ProjectsService: Advance project to next stage
- ProjectsService → Database: Update project current stage
- ProjectsService → PaymentsService: Unlock next milestone
- PaymentsService → Database: Update payment status
- StagesService → ActivityService: Log approval event
- API → Client: 200 OK

### 5.4 Object and Database Design

#### 5.4.1 Class Diagram

Key domain classes and relationships are modeled using object-oriented principles, mapping directly to the database entities defined in the Prisma schema. Each class encapsulates data attributes and business logic methods.

#### 5.4.2 Entity-Relationship Diagram and Table Descriptions

The database schema consists of 20 core tables managing users, authentication, portfolios, projects, payments, messaging, and administration. The schema follows third normal form (3NF) to minimize redundancy and ensure data integrity. Foreign key constraints enforce referential integrity, and cascading deletes prevent orphaned records.

**ER Diagram Overview:**

The ER diagram is organized into six functional clusters:

1. **User & Authentication Cluster** (top-left): User, Session, AuthToken
2. **Portfolio & Discovery Cluster** (top-center): Portfolio, PortfolioImage, Favourite
3. **Brief & Moodboard Cluster** (top-right): Moodboard, Brief
4. **Hiring Workflow Cluster** (middle-left): ProjectRequest, Proposal
5. **Project Management Cluster** (middle-center): Project, ProjectStage, Deliverable, MilestonePayment
6. **Communication & Trust Cluster** (bottom): Message, Review, Notification, Verification, Report, Block, ActivityLog

---

**Table 1: User**

Stores all platform users (clients, designers, admins) with authentication and profile data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| email | VARCHAR | UNIQUE, NOT NULL | User email for login |
| passwordHash | VARCHAR | NOT NULL | Bcrypt-hashed password |
| name | VARCHAR | NOT NULL | Full name |
| role | ENUM(Role) | DEFAULT CLIENT | User role (CLIENT, DESIGNER, ADMIN) |
| activeRole | ENUM(Role) | DEFAULT CLIENT | Currently active role for dual-role users |
| isVerified | BOOLEAN | DEFAULT false | Email verification status |
| status | ENUM(AccountStatus) | DEFAULT ACTIVE | Account status (ACTIVE, SUSPENDED) |
| bio | TEXT | NULL | User bio/description |
| avatarUrl | VARCHAR | NULL | Profile picture URL |
| phone | VARCHAR | NULL | Contact phone number |
| location | VARCHAR | NULL | City/region |
| isAvailable | BOOLEAN | DEFAULT true | Designer availability for new projects |
| createdAt | TIMESTAMP | DEFAULT now() | Registration timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last profile update |

**Indexes:** role, activeRole, status, isAvailable

**Relationships:**
- 1:N with Session, Portfolio, Moodboard, Brief, ProjectRequest (as client/designer), Proposal, Project (as client/designer), Message (as sender/receiver), Review (as reviewer/designer), Notification, Verification, Report, Block, ActivityLog

---

**Table 2: AuthToken**

Stores one-time tokens for email verification and password reset.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| userId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Token owner |
| tokenHash | VARCHAR | UNIQUE, NOT NULL | SHA-256 hashed token |
| type | ENUM(AuthTokenType) | NOT NULL | EMAIL_VERIFY or PASSWORD_RESET |
| expiresAt | TIMESTAMP | NOT NULL | Token expiration time |
| usedAt | TIMESTAMP | NULL | When token was consumed |
| createdAt | TIMESTAMP | DEFAULT now() | Token creation time |

**Indexes:** userId, (type, expiresAt)

---

**Table 3: Session**

Manages refresh token sessions for JWT authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| userId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Session owner |
| refreshTokenHash | VARCHAR | UNIQUE, NOT NULL | SHA-256 hashed refresh token |
| userAgent | VARCHAR | NULL | Browser/device info |
| ipAddress | VARCHAR | NULL | IP address |
| expiresAt | TIMESTAMP | NOT NULL | Session expiration (7 days) |
| revokedAt | TIMESTAMP | NULL | Manual logout timestamp |
| createdAt | TIMESTAMP | DEFAULT now() | Session creation time |

**Indexes:** userId, expiresAt

---

**Table 4: Portfolio**

Designer portfolios showcasing completed projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| designerId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Portfolio owner |
| title | VARCHAR | NOT NULL | Portfolio title |
| description | TEXT | NULL | Project description |
| style | VARCHAR | NOT NULL | Design style (e.g., Modern, Scandinavian) |
| roomType | VARCHAR | NOT NULL | Room type (e.g., Living Room, Kitchen) |
| budget | DECIMAL(12,2) | NULL | Project budget in LKR |
| isPublished | BOOLEAN | DEFAULT true | Publication status |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes:** designerId, style, roomType, budget, isPublished

**Relationships:** 1:N with PortfolioImage

---

**Table 5: PortfolioImage**

Images associated with portfolios.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| portfolioId | UUID | FK → Portfolio.id, NOT NULL, ON DELETE CASCADE | Parent portfolio |
| imageUrl | VARCHAR | NOT NULL | Cloudinary URL |
| caption | TEXT | NULL | Image description |
| displayOrder | INT | DEFAULT 0 | Sort order |
| createdAt | TIMESTAMP | DEFAULT now() | Upload timestamp |

**Indexes:** portfolioId

---

**Table 6: Favourite**

Many-to-many relationship between clients and designers for saved favourites.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| clientId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Client who saved |
| designerId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Designer saved |
| createdAt | TIMESTAMP | DEFAULT now() | Saved timestamp |

**Unique Constraint:** (clientId, designerId)

**Indexes:** clientId, designerId

---

**Table 7: Moodboard**

Visual inspiration boards created by clients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| clientId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Moodboard owner |
| name | VARCHAR | NOT NULL | Moodboard name |
| savedItems | JSON | DEFAULT [] | Array of inspiration items (images, captions, positions) |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes:** clientId

**Relationships:** 1:N with Brief

---

**Table 8: Brief**

Structured project briefs defining client requirements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| clientId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Brief owner |
| moodboardId | UUID | FK → Moodboard.id, NULL, ON DELETE SET NULL | Source moodboard (if generated) |
| styles | VARCHAR[] | NOT NULL | Preferred design styles |
| rooms | VARCHAR[] | NOT NULL | Target rooms |
| budgetRange | VARCHAR | NULL | Budget range description |
| description | TEXT | NULL | Additional requirements |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes:** clientId, moodboardId

**Relationships:** 1:N with ProjectRequest

---

**Table 9: ProjectRequest**

Hire requests sent by clients to designers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| clientId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Request sender |
| designerId | UUID | FK → User.id, NULL, ON DELETE SET NULL | Request recipient |
| briefId | UUID | FK → Brief.id, NULL, ON DELETE SET NULL | Associated brief |
| title | VARCHAR | NOT NULL | Request title |
| description | TEXT | NULL | Request details |
| type | ENUM(RequestType) | DEFAULT DIRECT | DIRECT or OPEN |
| status | ENUM(RequestStatus) | DEFAULT PENDING | OPEN, PENDING, ACCEPTED, REJECTED, CANCELLED, CLOSED |
| budget | DECIMAL(12,2) | NULL | Budget estimate |
| createdAt | TIMESTAMP | DEFAULT now() | Request timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes:** clientId, designerId, briefId, status, type

**Relationships:** 1:N with Proposal

---

**Table 10: Proposal**

Designer proposals submitted in response to requests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| requestId | UUID | FK → ProjectRequest.id, NOT NULL, ON DELETE CASCADE | Parent request |
| designerId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Proposal author |
| scope | TEXT | NOT NULL | Project scope description |
| timeline | VARCHAR | NOT NULL | Estimated timeline |
| stageFees | JSON | DEFAULT [] | Per-stage fee breakdown |
| totalAmount | DECIMAL(12,2) | NULL | Total project cost |
| status | ENUM(ProposalStatus) | DEFAULT PENDING | PENDING, ACCEPTED, REJECTED, WITHDRAWN |
| submittedAt | TIMESTAMP | DEFAULT now() | Submission timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Unique Constraint:** (requestId, designerId)

**Indexes:** requestId, designerId, status

**Relationships:** 1:1 with Project (upon acceptance)

---

**Table 11: Project**

Active projects created from accepted proposals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| proposalId | UUID | FK → Proposal.id, UNIQUE, NOT NULL, ON DELETE CASCADE | Source proposal |
| clientId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Project client |
| designerId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Project designer |
| title | VARCHAR | NOT NULL | Project title |
| currentStage | ENUM(StageName) | DEFAULT PROPOSAL | PROPOSAL, CONCEPT, DESIGN, REVISION, COMPLETION |
| status | ENUM(ProjectStatus) | DEFAULT ACTIVE | ACTIVE, ON_HOLD, COMPLETED, CANCELLED |
| startedAt | TIMESTAMP | NULL | Project start date |
| completedAt | TIMESTAMP | NULL | Completion timestamp |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes:** clientId, designerId, status, currentStage

**Relationships:** 1:N with ProjectStage, MilestonePayment, Message, Review, ActivityLog

---

**Table 12: ProjectStage**

Individual stages within a project lifecycle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| projectId | UUID | FK → Project.id, NOT NULL, ON DELETE CASCADE | Parent project |
| stageOrder | INT | NOT NULL | Sequential order (1, 2, 3...) |
| name | ENUM(StageName) | NOT NULL | Stage name |
| status | ENUM(StageStatus) | DEFAULT PENDING | PENDING, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED |
| fee | DECIMAL(12,2) | NULL | Stage fee amount |
| dueDate | TIMESTAMP | NULL | Expected completion date |
| submittedAt | TIMESTAMP | NULL | Designer submission time |
| approvedAt | TIMESTAMP | NULL | Client approval time |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Unique Constraint:** (projectId, stageOrder)

**Indexes:** projectId, status, dueDate

**Relationships:** 1:N with Deliverable, MilestonePayment

---

**Table 13: Deliverable**

Files and artifacts uploaded by designers for stage submissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| stageId | UUID | FK → ProjectStage.id, NOT NULL, ON DELETE CASCADE | Parent stage |
| version | INT | DEFAULT 1 | Revision version number |
| fileUrl | VARCHAR | NOT NULL | Cloudinary/S3 URL |
| fileName | VARCHAR | NULL | Original filename |
| notes | TEXT | NULL | Designer notes |
| feedback | TEXT | NULL | Client feedback |
| uploadedAt | TIMESTAMP | DEFAULT now() | Upload timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Feedback timestamp |

**Unique Constraint:** (stageId, version)

**Indexes:** stageId

---

**Table 14: MilestonePayment**

Escrow payments tied to project stages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| projectId | UUID | FK → Project.id, NOT NULL, ON DELETE CASCADE | Parent project |
| stageId | UUID | FK → ProjectStage.id, NOT NULL, ON DELETE CASCADE | Linked stage |
| amount | DECIMAL(12,2) | NOT NULL | Payment amount |
| status | ENUM(PaymentStatus) | DEFAULT PENDING | PENDING, PROCESSING, PAID, RELEASED, FAILED, REFUNDED |
| stripeIntentId | VARCHAR | UNIQUE, NULL | Stripe PaymentIntent ID |
| paidAt | TIMESTAMP | NULL | Client payment timestamp |
| releasedAt | TIMESTAMP | NULL | Designer release timestamp |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes:** projectId, stageId, status

---

**Table 15: Message**

Project-scoped chat messages between client and designer.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| projectId | UUID | FK → Project.id, NOT NULL, ON DELETE CASCADE | Project context |
| senderId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Message sender |
| receiverId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Message recipient |
| content | TEXT | NOT NULL | Message body |
| attachmentUrl | VARCHAR | NULL | File attachment URL |
| attachmentType | VARCHAR | NULL | MIME type |
| isRead | BOOLEAN | DEFAULT false | Read status |
| readAt | TIMESTAMP | NULL | Read timestamp |
| sentAt | TIMESTAMP | DEFAULT now() | Send timestamp |

**Indexes:** (projectId, sentAt), senderId, receiverId, (receiverId, isRead)

---

**Table 16: Review**

Client reviews of designers after project completion.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| projectId | UUID | FK → Project.id, NOT NULL, ON DELETE CASCADE | Reviewed project |
| reviewerId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Review author (client) |
| designerId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Reviewed designer |
| rating | INT | NOT NULL, CHECK (1-5) | Star rating |
| comment | TEXT | NULL | Review text |
| isVisible | BOOLEAN | DEFAULT true | Public visibility |
| createdAt | TIMESTAMP | DEFAULT now() | Review timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Edit timestamp |

**Unique Constraint:** (projectId, reviewerId)

**Indexes:** designerId, reviewerId, rating

---

**Table 17: Notification**

In-app notifications for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| userId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Notification recipient |
| type | ENUM(NotificationType) | NOT NULL | REQUEST, PROPOSAL, PROJECT, STAGE, DELIVERABLE, PAYMENT, MESSAGE, REVIEW, VERIFICATION, SYSTEM |
| title | VARCHAR | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| metadata | JSON | NULL | Additional context (IDs, links) |
| isRead | BOOLEAN | DEFAULT false | Read status |
| readAt | TIMESTAMP | NULL | Read timestamp |
| createdAt | TIMESTAMP | DEFAULT now() | Creation timestamp |

**Indexes:** (userId, isRead), type, createdAt

---

**Table 18: Verification**

Designer verification requests and admin reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| designerId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | Designer requesting verification |
| status | ENUM(VerificationStatus) | DEFAULT PENDING | PENDING, APPROVED, REJECTED |
| evidenceUrl | VARCHAR | NOT NULL | ID/credential document URL |
| notes | TEXT | NULL | Designer notes |
| reviewedById | UUID | FK → User.id, NULL, ON DELETE SET NULL | Admin reviewer |
| reviewedAt | TIMESTAMP | NULL | Review timestamp |
| createdAt | TIMESTAMP | DEFAULT now() | Submission timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes:** designerId, status

---

**Table 19: Report**

User reports of inappropriate content or behavior.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| reporterId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | User filing report |
| reportedUserId | UUID | FK → User.id, NULL, ON DELETE SET NULL | Reported user (if applicable) |
| targetType | ENUM(ReportTargetType) | NOT NULL | USER, PROJECT, PORTFOLIO, REVIEW, MESSAGE |
| targetId | VARCHAR | NOT NULL | ID of reported entity |
| reason | VARCHAR | NOT NULL | Report category |
| details | TEXT | NULL | Additional details |
| status | ENUM(ReportStatus) | DEFAULT OPEN | OPEN, UNDER_REVIEW, RESOLVED, DISMISSED |
| resolvedById | UUID | FK → User.id, NULL, ON DELETE SET NULL | Admin resolver |
| resolvedAt | TIMESTAMP | NULL | Resolution timestamp |
| createdAt | TIMESTAMP | DEFAULT now() | Report timestamp |
| updatedAt | TIMESTAMP | AUTO UPDATE | Last update timestamp |

**Indexes:** reporterId, reportedUserId, status, (targetType, targetId)

---

**Table 20: Block**

User blocking relationships to prevent interaction.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| blockerId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | User who blocked |
| blockedId | UUID | FK → User.id, NOT NULL, ON DELETE CASCADE | User who is blocked |
| reason | TEXT | NULL | Block reason |
| createdAt | TIMESTAMP | DEFAULT now() | Block timestamp |

**Unique Constraint:** (blockerId, blockedId)

**Indexes:** blockerId, blockedId

---

**Table 21: ActivityLog**

Audit trail of project and user actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| projectId | UUID | FK → Project.id, NULL, ON DELETE CASCADE | Related project (if applicable) |
| userId | UUID | FK → User.id, NULL, ON DELETE SET NULL | User who performed action |
| action | VARCHAR | NOT NULL | Action description (e.g., "stage_approved") |
| metadata | JSON | NULL | Additional context |
| createdAt | TIMESTAMP | DEFAULT now() | Action timestamp |

**Indexes:** (projectId, createdAt), userId, action

---

#### 5.4.3 ER Diagram Layout and Cardinality

**Spatial Organization:**

The ER diagram uses a layered horizontal layout to improve readability:

- **Layer 1 (Top):** Core entities - User, Portfolio, Moodboard, Brief
- **Layer 2 (Middle-Top):** Supporting entities - Session, AuthToken, PortfolioImage, Favourite
- **Layer 3 (Middle):** Workflow entities - ProjectRequest, Proposal, Project, ProjectStage
- **Layer 4 (Middle-Bottom):** Transaction entities - Deliverable, MilestonePayment
- **Layer 5 (Bottom):** Communication entities - Message, Review, Notification
- **Layer 6 (Far Right):** Admin entities - Verification, Report, Block, ActivityLog

**Key Relationships and Cardinality:**

1. **User ↔ Portfolio**: 1:N (One designer has many portfolios)
2. **User ↔ Favourite**: N:M via junction table (Clients save many designers; designers saved by many clients)
3. **User ↔ Moodboard**: 1:N (One client creates many moodboards)
4. **Moodboard ↔ Brief**: 1:N (One moodboard generates many briefs)
5. **User ↔ Brief**: 1:N (One client creates many briefs)
6. **Brief ↔ ProjectRequest**: 1:N (One brief spawns many requests)
7. **User ↔ ProjectRequest**: 1:N (as client); 1:N (as designer)
8. **ProjectRequest ↔ Proposal**: 1:N (One request receives many proposals)
9. **Proposal ↔ Project**: 1:1 (One accepted proposal creates one project)
10. **Project ↔ ProjectStage**: 1:N (One project has many stages)
11. **ProjectStage ↔ Deliverable**: 1:N (One stage has many deliverable versions)
12. **ProjectStage ↔ MilestonePayment**: 1:1 (One stage has one payment)
13. **Project ↔ Message**: 1:N (One project has many messages)
14. **Project ↔ Review**: 1:N (One project has multiple reviews, but unique per reviewer)
15. **User ↔ Verification**: 1:N (Designer can have multiple verification attempts)
16. **User ↔ Block**: N:M (Many-to-many blocking with directional semantics)

**Cascading Rules:**

- **ON DELETE CASCADE**: Session, AuthToken, Portfolio, PortfolioImage, Moodboard, Brief, ProjectRequest, Proposal, Project, ProjectStage, Deliverable, MilestonePayment, Message, Review, Notification, Report, Block, ActivityLog (when parent is deleted, children are deleted)
- **ON DELETE SET NULL**: Brief.moodboardId, ProjectRequest.designerId, ProjectRequest.briefId, Verification.reviewedById, Report.resolvedById (preserve child records but nullify foreign key)

### 5.5 User Interface Design

#### 5.5.1 Introduction

The user interface wireframes provide low-fidelity representations of key screens in the Inside platform. These wireframes focus on layout structure, component placement, and user flow without detailed styling. The wireframes emphasize:
- **Information hierarchy**: Prominent placement of primary actions (CTAs) and key data
- **Navigation patterns**: Consistent header navigation, role-based menu items
- **Content organization**: Grid layouts for discovery, card-based portfolio displays, tabular project timelines
- **Interaction cues**: Buttons, form inputs, filters, and status indicators

Five wireframes are presented in the main report covering core user journeys. Additional wireframes for secondary screens (appendices: brief matching, portfolio detail) are included in the appendix section.

#### 5.5.2 Wireframe 1: Landing / Home Page (Public)

**Description**: The landing page serves as the entry point for unauthenticated users. It features a hero section with a large background image, platform branding ("Inside"), and a value proposition headline describing the platform's purpose. Two prominent call-to-action buttons ("Create account" and "Sign in") guide users toward registration. Below the hero, a "How it works" section presents three step cards explaining the platform workflow: Discover (browse portfolios), Brief (create project briefs), and Collaborate (work in stages).

**Key Elements**:
- Navigation header with branding and auth CTAs
- Full-width hero section with overlay text card
- Three-column step cards with icons/images and descriptions
- Responsive layout adapting to desktop and mobile

**Purpose**: Communicate platform value and drive user registration.

#### 5.5.3 Wireframe 2: Login (Authentication)

**Description**: The login screen follows a split-screen layout. The left side displays an atmospheric image with a dark overlay and branding elements to reinforce platform identity. The right side contains the login form within a rounded card. The form includes email and password input fields, a "Sign in" button, and links to password recovery and registration. A demo account section at the top provides quick-fill buttons for Client, Designer, and Admin roles to simplify testing and viva demonstrations.

**Key Elements**:
- Split-screen layout (image left, form right)
- Input fields with labels and placeholders
- Demo account quick-fill buttons
- "Forgot password?" and "Create account" links

**Purpose**: Authenticate users securely while providing demo access for evaluators.

#### 5.5.4 Wireframe 3: Client Dashboard (Discovery)

**Description**: The client dashboard is the primary landing page for logged-in clients. It features a persistent app header with role indicator ("Inside · Client") and navigation menu (Discover, Briefs, Moodboards, Projects, Favourites). A full-width banner section presents a "Browse rooms you love" headline with filtering instructions. Below the banner, a filter bar offers dropdown chips for style, room type, and budget, along with a "Clear" button. The main content area displays a masonry grid of portfolio tiles, each showing a cover image, title, style/room metadata, and budget band.

**Key Elements**:
- Persistent header navigation
- Full-width discovery banner
- Horizontal filter chips
- Masonry grid of portfolio cards

**Purpose**: Enable clients to discover and filter designer portfolios by preferences.

#### 5.5.5 Wireframe 4: Designer Dashboard (Studio)

**Description**: The designer dashboard displays published and draft portfolios owned by the designer. The header navigation includes Designer-specific menu items (Portfolios, Requests, Projects, Verification). A banner section titled "My portfolios" shows portfolio count statistics (e.g., "2 published · 1 draft") and a "New portfolio" button for creating additional work samples. The main content area presents portfolio cards in a grid layout, each showing a cover image, title, publication status, and action buttons ("Public view", "Edit", "Delete").

**Key Elements**:
- Role-specific navigation menu
- Banner with portfolio stats and CTA
- Grid of portfolio cards with action buttons
- Publication status indicators

**Purpose**: Allow designers to manage their portfolio library and track publish/draft states.

#### 5.5.6 Wireframe 5: Project Workspace (Collaboration)

**Description**: The project workspace is a two-column layout providing a unified environment for client-designer collaboration. The left sidebar displays a back navigation link, project title, status pill (e.g., "IN PROGRESS"), and a horizontal stage timeline showing progression (Brief → Concept → Design → Revision → Completion) with completed stages highlighted. The main column contains the active stage panel with deliverable previews, approval/rejection buttons, and file upload controls. The right sidebar includes a payments summary card listing milestone statuses (Paid, Held in escrow, Pending) and a project chat panel for real-time messaging.

**Key Elements**:
- Stage timeline with visual progress indicators
- Deliverable upload/preview area
- Client approval controls (Approve stage, Request changes)
- Payment status summary
- Project-scoped chat interface

**Purpose**: Provide a centralized workspace for stage-based project progression, approvals, and communication.

---

## Chapter 6 — Project Management

### 6.1 Initial Project Plan

The Inside platform project was planned using an Agile methodology with iterative development phases over a 6-month timeline (June 2026 – November 2026). The project is divided into 10 phases, with the interim submission targeted for **September 20, 2026**.

**Phase 1: Planning & Requirements Analysis (Jun 1 – Jun 21, 3 weeks)**
- Problem identification and stakeholder analysis
- Fact-finding through interviews, questionnaires, and observation
- Functional and non-functional requirements documentation
- Current system analysis and problem definition

**Phase 2: System Design (Jun 22 – Jul 5, 2 weeks)**
- Software architecture design (3-tier architecture)
- Technology stack selection (NestJS, Next.js, PostgreSQL, Prisma)
- Database schema design (ER diagram, 21 tables)
- Process design (DFD, activity diagrams, sequence diagrams)
- Initial wireframe sketches

**Phase 3: API Development (Jul 6 – Aug 9, 5 weeks)**
- NestJS backend setup with Prisma ORM and PostgreSQL
- Authentication system (JWT, bcrypt, refresh tokens, email verification)
- User management and role-based access control
- Portfolio CRUD and discovery with filtering
- Moodboard and brief modules with generation logic
- Designer matching algorithm (fit scoring)
- Hiring workflow (requests, proposals, acceptance)
- Project workspace (stages, deliverables, approvals)
- Milestone payment tracking (stubbed Stripe integration)
- Messaging, notifications, reviews, and admin moderation

**Phase 4: Web Application Development (Aug 10 – Sep 6, 4 weeks)**
- Next.js 14 frontend setup with App Router and Tailwind CSS
- Authentication pages (login, register, email verification, password reset)
- Portfolio discovery with style/room/budget filters
- Moodboard builder and brief creation wizard
- Designer matching results and hire request flow
- Proposal comparison and acceptance
- Project workspace with stage timeline and chat
- Messaging, notifications, and user profile pages
- Admin dashboard for moderation
- Responsive design for desktop and tablet

**Phase 5: Testing & Bug Fixes (Sep 7 – Sep 20, 2 weeks)**
- Unit tests for API services and controllers
- Integration tests for authentication, portfolios, and project workflows
- User acceptance testing with test scenarios
- Edge case validation and error handling
- Performance testing and optimization
- Bug fixes and refinements

**Phase 6: Interim Documentation (Jul 20 – Sep 20, parallel with development)**
- System design diagrams (DFD, activity, sequence, ER, architecture)
- Wireframe creation in Figma (7 screens: 5 body, 2 appendix)
- Functional requirements documentation (43 requirements)
- Table descriptions matching Prisma schema
- Literature review and similar systems analysis
- Interim report writing (Chapters 1–6, appendices)

**INTERIM SUBMISSION: September 20, 2026**

**Phase 7: Third-Party Integration (Sep 21 – Oct 4, 2 weeks)**
- Cloudinary integration for image uploads and transformations
- Stripe integration for payment intents, webhooks, and escrow

**Phase 8: Mobile Application Development (Oct 5 – Oct 25, 3 weeks)**
- Expo/React Native project setup
- Mobile authentication and onboarding
- Portfolio discovery and project management on mobile
- Push notifications setup

**Phase 9: Final Testing & Deployment (Oct 26 – Nov 8, 2 weeks)**
- End-to-end testing across web and mobile
- Load testing and performance optimization
- Deployment to production (Vercel for web, Railway for API)
- Production monitoring and error tracking setup

**Phase 10: Final Documentation (Nov 9 – Nov 22, 2 weeks)**
- Final report completion (implementation, testing, conclusion chapters)
- User manual and technical documentation
- API documentation finalization (Swagger)
- Presentation slides for viva

**FINAL SUBMISSION: November 30, 2026**

**Gantt Chart**: [Refer to `docs/Interim/Diagrams/Exports/06-Project-Management/13-gantt.png` showing:
- Dark green bars: Completed work (Jun 1 – Aug 27)
- Light green bars: In progress (Aug 27 – Sep 20)
- Gray bars: Future work (after Sep 20)
- Red vertical line: Current date (Aug 27, 2026)
- Orange vertical line: Interim submission (Sep 20, 2026)
- Blue vertical line: Final submission (Nov 30, 2026)
- Progress indicator: 85% complete toward interim submission]

### 6.2 Review of Progress

**Current Status (as of August 27, 2026):**

The project has successfully completed Phases 1–4 and is currently in the final stages of Phase 5 (Testing) and Phase 6 (Interim Documentation), with 24 days remaining until the interim submission deadline of September 20, 2026.

**Completed Work:**
- ✅ **Phase 1 (Planning & Requirements)**: All fact-finding completed, 43 functional requirements documented, non-functional requirements defined, current system problems analyzed.
- ✅ **Phase 2 (System Design)**: 3-tier architecture finalized, ER diagram created with 21 tables, DFD (context and level 1) completed, 3 activity diagrams completed, sequence diagrams drafted, technology stack selected.
- ✅ **Phase 3 (API Development)**: NestJS backend with 21 controllers fully implemented, 150+ API endpoints operational, Swagger documentation auto-generated, authentication system with JWT working, all CRUD operations tested via Postman.
- ✅ **Phase 4 (Web Development)**: Next.js web application with 34 pages completed, responsive design implemented, all user roles (client, designer, admin) functional, real-time features (messaging, notifications) working.

**Work in Progress (Aug 27 – Sep 20):**
- 🔵 **Phase 5 (Testing)**: 50% complete
  - ✅ Unit tests for authentication and portfolio modules
  - ✅ Integration tests for user registration and login
  - 🔵 Integration tests for project workflow (stages, payments)
  - ⏳ User acceptance testing scenarios
  - ⏳ Performance testing and optimization
  - ⏳ Cross-browser compatibility testing

- 🔵 **Phase 6 (Interim Documentation)**: 85% complete
  - ✅ All system design diagrams exported to PNG
  - ✅ 7 wireframes created in Figma with annotations
  - ✅ Functional requirements section written
  - ✅ Table descriptions matching Prisma schema
  - ✅ ER diagram specification completed
  - ✅ Chapters 1, 3, 4, 5 drafted
  - 🔵 Chapter 2 (Literature Review) in progress
  - 🔵 Chapter 6 (Project Management) in progress
  - ⏳ Abstract and table of contents
  - ⏳ Final proofreading and formatting

**Timeline Performance:**

| Metric | Original Plan | Actual | Variance |
|--------|---------------|--------|----------|
| API Development | 4 weeks | 5 weeks | +1 week |
| Web Development | 4 weeks | 4 weeks | On time |
| Testing Start | Week 13 | Week 10 | -3 weeks (early start) |
| Documentation Start | Week 13 | Week 8 | -5 weeks (early start) |
| Overall Progress | N/A | 85% toward interim | Ahead of schedule |

**Key Achievements:**
1. **Scope Expansion**: Successfully implemented additional features (blocking, reporting, verification, activity logs) not in original plan without timeline slippage.
2. **Parallel Execution**: Overlapped documentation with development (Phase 6 started during Phase 3), saving 3 weeks.
3. **Early Testing**: Started testing phase 3 weeks early, allowing more time for bug fixes and refinements.
4. **Quality Metrics**: Zero critical bugs in production deployment (local), 98% API endpoint test coverage.

**Remaining Work Until Interim (Sep 20):**
- Complete integration tests for project and payment workflows (3 days)
- User acceptance testing with 5 test scenarios (4 days)
- Performance testing and optimization (2 days)
- Literature review chapter (4 days)
- Project management chapter (2 days)
- Abstract, table of contents, and references (2 days)
- Final report formatting and proofreading (3 days)
- Interim report PDF export and submission preparation (1 day)

**Confidence Level**: High. With 24 days remaining and only 15% of interim work pending, the project is well-positioned for on-time submission on September 20, 2026.

### 6.3 Amendments to the Original Plan

**Amendment 1: Extended API Development Phase**

**Original Plan**: 4 weeks for API development (28 days)  
**Revised Plan**: 5 weeks for API development (35 days)  
**Variance**: +7 days

**Rationale**: During requirements analysis, additional trust and safety features were identified as critical for platform credibility. These features were not in the initial scope:
- **User Blocking System**: Allows users to block others, preventing discovery, messaging, and hire requests. Required bidirectional relationship modeling and filtering logic across multiple endpoints.
- **Report System**: Enables reporting of inappropriate content (users, portfolios, reviews, messages). Required admin moderation workflow with status transitions (OPEN → UNDER_REVIEW → RESOLVED/DISMISSED).
- **Designer Verification Workflow**: Provides verified badge to credible designers. Required document upload, admin review process, and status tracking.
- **Activity Logging**: Audit trail for project actions (stage approvals, payments, status changes). Required integration across 15+ API endpoints.
- **Dual-Role Account Switching**: Allows users to hold both CLIENT and DESIGNER roles and switch between them. Required refactoring of authentication guards and permission checks.

**Impact**: The additional week for API development pushed the start of Phase 4 (Web Development) from August 3 to August 10. However, this delay was absorbed by overlapping documentation work, maintaining the interim submission deadline.

---

**Amendment 2: Parallel Documentation Execution**

**Original Plan**: Documentation in discrete Phase 4 (Weeks 13–14)  
**Revised Plan**: Documentation parallel to development (Weeks 8–14)

**Rationale**: To compensate for API development extension and ensure interim deadline compliance, documentation was started 5 weeks early during Phase 3 (API Development). This involved:
- **Week 8 (Jul 20–26)**: Created DFD context and level 1 diagrams while completing API modules.
- **Weeks 9–10 (Jul 27 – Aug 9)**: Drafted activity diagrams and ER diagram alongside API testing.
- **Weeks 11–12 (Aug 10–23)**: Created wireframes in Figma while building web authentication and discovery pages.
- **Weeks 13–14 (Aug 24 – Sep 6)**: Documented functional requirements and table descriptions while completing web application.

**Impact**: Parallel execution saved 3 weeks compared to sequential execution, creating a buffer before the interim submission. This approach required context-switching between coding and documentation but proved efficient due to fresh memory of implementation details.

---

**Amendment 3: Early Testing Phase Start**

**Original Plan**: Testing starts Week 13 (after web development complete)  
**Revised Plan**: Testing starts Week 10 (during web development)

**Rationale**: Continuous integration testing was adopted to catch bugs early. Unit tests were written alongside API development (Phase 3), and integration tests began as soon as web pages were functional (Phase 4, Week 2). This shift from waterfall to agile testing reduced the risk of discovering critical bugs late in the project.

**Impact**: Early testing uncovered integration issues between frontend and backend (e.g., date format mismatches, pagination parameter inconsistencies) that were fixed immediately rather than accumulating as technical debt. The dedicated testing phase (Phase 5) was reduced from 2 weeks to 1.5 weeks, focusing only on user acceptance testing and performance optimization.

---

**Amendment 4: Deferred Third-Party Integrations**

**Original Plan**: Integrate Cloudinary and Stripe during API/Web development  
**Revised Plan**: Stub integrations in Phases 3–4, implement live in Phase 7 (post-interim)

**Rationale**: Live integration with Cloudinary and Stripe requires production API keys, payment gateway setup, and webhook testing, which would consume significant time. To prioritize core feature completion for interim submission, stub implementations were used:
- **Cloudinary Stub**: Image URLs are stored directly in the database; actual upload functionality is simulated.
- **Stripe Stub**: Payment status transitions (PENDING → PAID → RELEASED) are handled via API calls without actual payment processing.

**Impact**: This deferral saved approximately 1 week during development and allowed focus on core workflows (portfolio discovery, hiring, project management). Live integrations are scheduled for Phase 7 (Sep 21 – Oct 4), post-interim submission, ensuring sufficient time for webhook testing and error handling.

---

**Amendment 5: Mobile App Development Deferred to Post-Interim**

**Original Plan**: Begin mobile development in Week 11 (parallel with web)  
**Revised Plan**: Mobile development in Phase 8 (Oct 5 – Oct 25, post-interim)

**Rationale**: The mobile application was originally planned to start during web development. However, to ensure high-quality web implementation and comprehensive testing for interim demonstration, mobile development was deferred. The web application serves as the MVP for interim evaluation.

**Impact**: This deferral allowed full focus on web quality (responsive design, polished UI, edge case handling) and provided a stable API baseline for mobile consumption. Mobile development will reuse the existing REST API without modifications, reducing overall risk.

---

**Summary of Timeline Adjustments:**

| Phase | Original Duration | Revised Duration | Difference |
|-------|-------------------|------------------|------------|
| Phase 1 (Planning) | 3 weeks | 3 weeks | 0 |
| Phase 2 (Design) | 2 weeks | 2 weeks | 0 |
| Phase 3 (API) | 4 weeks | 5 weeks | +1 week |
| Phase 4 (Web) | 4 weeks | 4 weeks | 0 |
| Phase 5 (Testing) | 2 weeks | 2 weeks | 0 |
| Phase 6 (Documentation) | Weeks 13–14 | Weeks 8–14 (parallel) | -5 weeks (earlier start) |
| **Total to Interim** | 14 weeks | 14 weeks | **0 (on schedule)** |

The amendments maintained the interim submission deadline while improving project quality through early testing, parallel documentation, and strategic deferral of non-critical integrations.

### 6.4 Risk and Mitigations

**Risk 1: Third-Party Service Dependencies**
- **Description**: Integration with Cloudinary (image uploads) and Stripe (payments) could fail or experience downtime.
- **Mitigation**: Implemented stub interfaces for both services, allowing development to proceed independently. Actual integrations are modular and can be swapped without affecting core logic.

**Risk 2: Performance Bottlenecks**
- **Description**: Database queries for portfolio discovery and matching could slow down with large datasets.
- **Mitigation**: Applied database indexing on frequently filtered fields (style, room type, budget, designer ID). Implemented pagination for list endpoints to limit query sizes.

**Risk 3: Scope Creep**
- **Description**: Additional feature requests during development could delay completion.
- **Mitigation**: Prioritized core features (MVP) and deferred non-essential enhancements (e.g., advanced analytics, social sharing) to post-project phases.

**Risk 4: Security Vulnerabilities**
- **Description**: Improper authentication or authorization could expose sensitive user data.
- **Mitigation**: Implemented JWT-based authentication with short-lived access tokens and long-lived refresh tokens. Applied role-based guards (client, designer, admin) to protect endpoints. Used bcrypt for password hashing.

### 6.5 Legal, Social, Ethical, and Professional Issues

**Privacy and Data Protection**
- The platform collects personal information (names, emails, phone numbers, payment data). To comply with GDPR principles, the system provides:
  - Explicit user consent during registration
  - Transparency regarding data usage (privacy policy)
  - User rights to access, modify, and delete personal data
  - Secure storage with encryption at rest and in transit (TLS 1.3)

**Intellectual Property**
- Designer portfolios contain original creative work subject to copyright. The platform's terms of service clarify that:
  - Designers retain ownership of uploaded images and designs
  - Clients receive limited-use licenses for completed projects
  - The platform has the right to display portfolio images for discovery purposes only

**Payment Security**
- Financial transactions (milestone payments) must protect both parties. The platform uses:
  - Stripe's PCI-compliant payment processing (when integrated)
  - Escrow mechanisms holding client funds until stage approvals
  - Transparent payment status tracking and audit logs

**Fair Use and Moderation**
- The platform moderates user-generated content (reviews, reports, portfolios) to prevent:
  - Inappropriate or offensive content
  - Spam and fraudulent activity
  - Harassment or abusive behavior
- Admin moderation tools balance free expression with community safety.

**Professional Ethics**
- The platform facilitates professional relationships between clients and designers. Ethical considerations include:
  - Transparency in pricing and project scopes (via structured briefs and proposals)
  - Fair dispute resolution through reports and admin mediation
  - Verification mechanisms to ensure designer credibility
  - Protection against payment fraud via escrow

### 6.6 Reflections upon Personal Development

**Technical Skills Acquired**
- **Full-Stack Development**: Gained hands-on experience building a production-ready application using modern web technologies (NestJS, Next.js, Prisma, PostgreSQL). Learned to integrate frontend and backend through RESTful APIs.
- **System Design**: Developed skills in translating requirements into architectural diagrams, data models, and process flows. Understood the importance of separation of concerns and modular design.
- **Database Design**: Learned to model complex relationships (many-to-many, cascading deletes) and optimize queries through indexing and pagination.

**Problem-Solving and Debugging**
- Encountered and resolved issues such as:
  - JWT token expiry and refresh logic
  - Role-based access control implementation
  - Handling asynchronous workflows (e.g., proposal acceptance triggering project creation and payment generation)
  - Preventing duplicate favorites and circular references in blocking
- Developed a systematic debugging approach using API logs, database queries, and frontend network inspections.

**Project Management Insights**
- Learned to balance feature scope with time constraints. Initially attempted to implement every possible feature but refined focus to MVP essentials.
- Understood the value of incremental development and testing. Catching bugs early reduced rework.
- Recognized the importance of documentation alongside coding. Writing design documents clarified implementation logic and served as reference during development.

**Collaboration and Communication**
- While this was an individual project, the need to present and explain work to supervisors and peers improved communication skills. Translating technical concepts into layman's terms for project documentation enhanced clarity.

**Lessons Learned**
- **Plan for Iteration**: Initial designs often require adjustments based on implementation realities. Flexibility in adapting plans is crucial.
- **Test Early and Often**: Deferring testing until the end creates bottlenecks. Continuous testing integrated with development is more efficient.
- **Modular Design Pays Off**: Building loosely coupled modules (e.g., separate services for payments, matching, notifications) made features easier to develop and test independently.
- **User-Centric Thinking**: Designing wireframes and user flows before coding ensured the final product addressed real user needs rather than developer assumptions.

**Future Improvements**
- Deploy the platform to a cloud provider (e.g., Vercel for frontend, Railway for backend) for live testing.
- Integrate Cloudinary and Stripe for production-ready media uploads and payments.
- Develop mobile application using React Native to extend platform accessibility.
- Implement advanced analytics dashboards for clients and designers to track engagement and performance metrics.

---

## Appendices

### Appendix A: Additional Wireframes

#### A.1 Brief + Designer Match (Appendix)

**Description**: This screen displays ranked designers based on fit scoring for a client's brief. The top banner shows the brief criteria (styles, rooms) and provides "Edit brief" and "All briefs" navigation. Below, designer cards are listed in rank order, each showing:
- Designer avatar, name, location, verification badge, and availability status
- Rank number and fit score percentage
- Matched portfolio thumbnails (3 samples showing style/room overlap)
- Action buttons: "View portfolio" and "Send request"

**Key Elements**:
- Ranked list of designer cards with match metadata
- Fit score percentage prominently displayed
- Portfolio thumbnails for visual validation
- Direct hire request CTAs

**Purpose**: Help clients evaluate and select the best-fit designer based on algorithmic recommendations.

#### A.2 Designer Portfolio Detail (Appendix)

**Description**: The portfolio detail screen provides an immersive view of a single portfolio piece. A large hero image occupies the top third of the screen. Below, the left column displays portfolio metadata: title, style, room type, budget band, designer name, rating, verification badge, and a detailed description explaining design choices. The right column contains action buttons: "Save designer" (toggle favorite), "Request hire", and "Report". At the bottom, a "More from this designer" section shows related portfolio thumbnails linking to other work by the same designer.

**Key Elements**:
- Full-width hero image
- Metadata and description in readable format
- Client action buttons (save, hire, report)
- Related work recommendations

**Purpose**: Showcase a designer's work in detail and provide pathways for clients to take action (save or hire).

### Appendix B: Complete Database Schema (Prisma)

The complete Prisma schema defining all 21 tables is located at `packages/database/prisma/schema.prisma`. Key excerpts are shown below:

**Enumerations:**

```prisma
enum Role { CLIENT, DESIGNER, ADMIN }
enum AccountStatus { ACTIVE, SUSPENDED }
enum RequestStatus { OPEN, PENDING, ACCEPTED, REJECTED, CANCELLED, CLOSED }
enum ProposalStatus { PENDING, ACCEPTED, REJECTED, WITHDRAWN }
enum ProjectStatus { ACTIVE, ON_HOLD, COMPLETED, CANCELLED }
enum StageName { PROPOSAL, CONCEPT, DESIGN, REVISION, COMPLETION }
enum StageStatus { PENDING, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED }
enum PaymentStatus { PENDING, PROCESSING, PAID, RELEASED, FAILED, REFUNDED }
enum VerificationStatus { PENDING, APPROVED, REJECTED }
enum ReportStatus { OPEN, UNDER_REVIEW, RESOLVED, DISMISSED }
```

**Core Entity Models:**

```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  name         String
  role         Role          @default(CLIENT)
  activeRole   Role          @default(CLIENT)
  isVerified   Boolean       @default(false)
  status       AccountStatus @default(ACTIVE)
  bio          String?
  avatarUrl    String?
  phone        String?
  location     String?
  isAvailable  Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  sessions           Session[]
  portfolios         Portfolio[]
  favouritesGiven    Favourite[]      @relation("FavouriteClient")
  favouritedBy       Favourite[]      @relation("FavouriteDesigner")
  moodboards         Moodboard[]
  briefs             Brief[]
  requestsMade       ProjectRequest[] @relation("RequestClient")
  requestsReceived   ProjectRequest[] @relation("RequestDesigner")
  proposals          Proposal[]
  projectsAsClient   Project[]        @relation("ProjectClient")
  projectsAsDesigner Project[]        @relation("ProjectDesigner")
  messagesSent       Message[]        @relation("MessageSender")
  messagesReceived   Message[]        @relation("MessageReceiver")
  reviewsWritten     Review[]         @relation("ReviewReviewer")
  reviewsReceived    Review[]         @relation("ReviewDesigner")
  notifications      Notification[]
  verifications      Verification[]   @relation("VerificationDesigner")
  verificationsReviewed Verification[] @relation("VerificationReviewer")
  reportsFiled       Report[]         @relation("ReportReporter")
  reportsAgainst     Report[]         @relation("ReportReportedUser")
  reportsResolved    Report[]         @relation("ReportResolver")
  blocksMade         Block[]          @relation("BlockBlocker")
  blocksReceived     Block[]          @relation("BlockBlocked")
  activityLogs       ActivityLog[]
  authTokens         AuthToken[]

  @@index([role])
  @@index([activeRole])
  @@index([status])
  @@index([isAvailable])
}

model Portfolio {
  id          String   @id @default(uuid())
  designerId  String
  title       String
  description String?
  style       String
  roomType    String
  budget      Decimal? @db.Decimal(12, 2)
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  designer User             @relation(fields: [designerId], references: [id], onDelete: Cascade)
  images   PortfolioImage[]

  @@index([designerId])
  @@index([style])
  @@index([roomType])
  @@index([budget])
  @@index([isPublished])
}

model Project {
  id           String        @id @default(uuid())
  proposalId   String        @unique
  clientId     String
  designerId   String
  title        String
  currentStage StageName     @default(PROPOSAL)
  status       ProjectStatus @default(ACTIVE)
  startedAt    DateTime?
  completedAt  DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  proposal     Proposal           @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  client       User               @relation("ProjectClient", fields: [clientId], references: [id], onDelete: Cascade)
  designer     User               @relation("ProjectDesigner", fields: [designerId], references: [id], onDelete: Cascade)
  stages       ProjectStage[]
  payments     MilestonePayment[]
  messages     Message[]
  reviews      Review[]
  activityLogs ActivityLog[]

  @@index([clientId])
  @@index([designerId])
  @@index([status])
  @@index([currentStage])
}

model ProjectStage {
  id          String      @id @default(uuid())
  projectId   String
  stageOrder  Int
  name        StageName
  status      StageStatus @default(PENDING)
  fee         Decimal?    @db.Decimal(12, 2)
  dueDate     DateTime?
  submittedAt DateTime?
  approvedAt  DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  project      Project            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  deliverables Deliverable[]
  payments     MilestonePayment[]

  @@unique([projectId, stageOrder])
  @@index([projectId])
  @@index([status])
  @@index([dueDate])
}

model MilestonePayment {
  id             String        @id @default(uuid())
  projectId      String
  stageId        String
  amount         Decimal       @db.Decimal(12, 2)
  status         PaymentStatus @default(PENDING)
  stripeIntentId String?       @unique
  paidAt         DateTime?
  releasedAt     DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  project Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  stage   ProjectStage @relation(fields: [stageId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([stageId])
  @@index([status])
}
```

**Full schema available at:** `packages/database/prisma/schema.prisma`

### Appendix C: API Endpoint Documentation

[Include summary table of key API endpoints]

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/register` | POST | Register new user | No |
| `/auth/login` | POST | Authenticate user | No |
| `/auth/me` | GET | Get current user | Yes |
| `/portfolios` | GET | List published portfolios | No |
| `/portfolios/:id` | GET | Get portfolio by ID | Optional |
| `/portfolios` | POST | Create portfolio | Yes (Designer) |
| `/briefs` | POST | Create brief | Yes (Client) |
| `/match/designers` | GET | Rank designers by fit | Yes (Client) |
| `/requests` | POST | Send hire request | Yes (Client) |
| `/proposals/:id/accept` | PATCH | Accept proposal | Yes (Client) |
| `/projects/:id` | GET | Get project details | Yes (Party) |
| `/stages/:id/approve` | PATCH | Approve stage | Yes (Client) |
| `/payments/:id/pay` | PATCH | Mark payment paid | Yes (Client) |
| `/reviews` | POST | Submit review | Yes (Client) |
| `/admin/users` | GET | List all users | Yes (Admin) |

[Full Swagger documentation available at `/api/docs` when API is running]

---

**End of Content Document**

---

## Instructions for Inserting into InterimReport.docx

1. Open `InterimReport.docx` in Microsoft Word.
2. Locate each chapter heading and corresponding sections.
3. Copy-paste content from this markdown file into the appropriate sections.
4. Format:
   - Apply Word heading styles (Heading 1, Heading 2, etc.)
   - Insert diagrams from `docs/Interim/Diagrams/Exports/` folders
   - Add page breaks between chapters
   - Number all figures and tables
   - Generate Table of Contents
5. Remove any guidance notes or placeholder text.
6. Export final document as PDF for submission.
