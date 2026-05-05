# Interior Design Service Platform

**Name:**
**Index No:**
London Metropolitan University
2026 March

---

## Table of Contents

1. [Chapter 1 — Introduction](#chapter-1-introduction)
   - 1.1 [Aim & Objectives](#11-aim--objectives)
   - 1.2 [Motivation](#12-motivation)
2. [Chapter 2 — Background and Problem Statement](#chapter-2-background-and-problem-statement)
   - 2.1 [Introduction](#21-introduction)
   - 2.2 [Literature Review](#22-literature-review)
   - 2.3 [Problem Statement](#23-problem-statement)
   - 2.4 [Similar Systems](#24-similar-systems)
   - 2.5 [Proposed System](#25-proposed-system)

---

## Chapter 1 Introduction

The interior design industry has traditionally relied on in-person consultations, local referrals, and physical showrooms to connect clients with professional designers. While this model works well in established markets, it creates significant barriers for clients who lack local access to qualified designers, have limited budgets for full-service engagements, or simply prefer a more flexible and self-directed approach to managing their design projects.

The rise of digital platforms has begun to address some of these barriers. Clients can now browse design inspiration online, find freelance designers through general marketplaces, or subscribe to dedicated online design services. However, each of these solutions addresses only a portion of the problem. Inspiration platforms do not support hiring. Marketplaces do not support visual discovery. Dedicated services do not support open selection.

This project proposes the development of an Interior Design Service Platform that unifies the discovery, hiring, collaboration, and payment aspects of the interior design process within a single, structured system. The platform is designed to serve both clients seeking design services and professional designers looking to offer and manage their work through a digital environment.

---

### 1.1 Aim & Objectives

**Aim:**
To design and develop an Interior Design Service Platform that enables clients to discover, hire, and collaborate with professional interior designers through a structured, visual-first workflow with integrated milestone-based payments.

**Objectives:**

- To design a portfolio-first discovery interface that allows clients to browse real completed interior design projects filtered by room type, style, and budget, enabling informed hiring decisions based on demonstrated work rather than text-based profiles
- To develop a mood board system that allows clients to save and organise design projects as visual references and attach them to project briefs when initiating a hire
- To implement a structured project workflow with defined stages — proposal, concept, design, revision, and completion — that reflects the natural progression of an interior design engagement
- To design and implement a milestone-based payment mechanism where the total project fee is divided across workflow stages and released to the designer only upon client approval at each stage
- To build a project collaboration workspace that supports real-time messaging, design file sharing, and a structured revision and feedback process within each active project
- To implement a dual-role user system that allows a single registered account to operate as both a client and a designer, with separate dashboards and permission scopes for each role
- To develop a designer availability management system that allows designers to indicate their current capacity and allows clients to view availability before submitting a project request

---

### 1.2 Motivation

The motivation for this project stems from a clear gap in how the interior design industry currently operates online. Clients who want to hire a designer are forced to use multiple disconnected tools — browsing inspiration on one platform, finding a designer on another, and managing the project through email or messaging apps. This fragmented experience leads to miscommunication, unclear expectations, and unreliable payment processes. At the same time, designers lack a dedicated environment where their portfolio directly drives client engagement and where project management, communication, and payments are handled in one place. This platform is proposed to address that gap by providing a purpose-built environment for the entire interior design service lifecycle.

---

## Chapter 2 Background and Problem Statement

### 2.1 Introduction

The interior design service domain involves a complex interaction between clients who have a vision for their space and professional designers who have the skills to realise it. This interaction typically spans multiple phases — from initial discovery and brief definition, through concept development and iterative revision, to final delivery and payment. Managing this process effectively requires clear communication, structured workflows, and reliable financial mechanisms.

In the digital context, this domain presents a particular challenge. Unlike software development or graphic design, interior design is deeply visual and highly personal. Clients often struggle to articulate what they want in words, and designers need rich contextual information to produce relevant proposals. The tools and platforms currently available in this space do not fully account for these characteristics, resulting in a fragmented and often frustrating experience for both parties.

---

### 2.2 Literature Review

The development of online platforms for creative services has followed a general pattern of specialisation over time. Early platforms focused on broad freelance marketplaces, connecting clients with service providers across many disciplines. Over time, more specialised platforms emerged to serve specific industries, including interior design. A review of the current state of these platforms reveals several distinct categories, each with its own strengths and limitations.

**Visual Inspiration and Portfolio Platforms**

Platforms in this category are built around the display and discovery of design work. They allow designers to publish their projects and allow users to browse, save, and share content. The primary value they offer is visual discovery — users can explore a wide range of styles, room types, and design approaches. However, these platforms are not designed to support service transactions. There is no native mechanism for a client to hire a designer, agree on a scope of work, manage a project, or process a payment. The platform serves as a showcase, not a service environment. As a result, any client who wishes to engage a designer they discover on such a platform must initiate contact and manage the entire engagement outside of it.

**General Freelance Marketplaces**

General freelance marketplaces provide the transactional infrastructure that inspiration platforms lack. They support job posting, proposal submission, contract agreement, and payment processing. However, their discovery model is not suited to interior design. Clients search for designers using keywords and evaluate them through written profiles, portfolio thumbnails, and rating scores. This text-driven approach does not reflect how clients actually make decisions about interior design, where aesthetic fit and demonstrated style are the primary criteria. The result is a mismatch between the platform's discovery model and the nature of the service being offered.

Additionally, general freelance marketplaces are not designed around the specific workflow of interior design. Project stages, revision cycles, and design file management are handled through generic task and messaging tools that are not tailored to the design process.

**Dedicated Online Interior Design Services**

A third category of platforms offers curated interior design services directly to consumers. These platforms typically operate by collecting client preferences through a style quiz or intake form, then assigning a designer from their internal pool. The client receives design concepts and can request revisions within a defined scope.

While this model addresses the quality and trust concerns associated with open marketplaces, it does so by removing client autonomy. The client does not browse, compare, or select a designer — they are matched by the platform. This limits the client's ability to make a choice based on a designer's specific body of work and style. Furthermore, these services operate as closed systems, meaning designers must be employed or contracted by the platform rather than operating independently.

**Gaps Identified**

Across all three categories, a consistent gap emerges: no existing platform provides a unified environment where clients can discover designers through their actual completed work, build a visual brief from that discovery, and then move directly into a structured hiring and project management workflow — all within the same system. The discovery experience and the service experience remain separated, and neither is fully optimised for the specific characteristics of interior design as a discipline.

---

### 2.3 Problem Statement

The core problem this project addresses is the absence of a unified, interior-design-specific platform that supports the full client-designer engagement lifecycle — from initial discovery through to project completion and payment.

Clients who seek interior design services online currently face a fragmented process. They may browse design inspiration on one platform, search for a designer on another, communicate through email or messaging applications, and manage payments through a separate tool. At no point does a single environment support all of these activities in a coherent and connected way.

This fragmentation creates several specific problems. First, clients have difficulty expressing their design preferences clearly. Without a structured way to communicate visual expectations, briefs tend to be vague, leading to misaligned proposals and repeated revision cycles. Second, the hiring decision is often made without sufficient visual evidence of a designer's capabilities. Profiles and ratings provide limited insight into whether a designer's aesthetic matches what the client is looking for. Third, once a project begins, there is no structured environment to manage its progress. Communication, file sharing, feedback, and approvals happen through informal channels, making it difficult to track the state of the project or hold either party accountable to agreed milestones. Fourth, payment processes are often informal or handled through third-party tools, creating risk for both clients and designers.

For designers, the problem is equally significant. Without a dedicated platform, designers must maintain their portfolio on one service, find clients through another, manage projects through general-purpose tools, and handle invoicing separately. This administrative overhead reduces the time available for design work and makes it difficult to build a consistent professional presence online.

The proposed system addresses these problems by providing a single platform that connects the discovery experience directly to the service workflow, supports visual communication of client preferences through a mood board system, structures the project lifecycle through defined stages, and manages payments through a milestone-based mechanism tied to client approvals.

---

### 2.4 Similar Systems

Several existing platforms operate in adjacent spaces to the proposed system. An analysis of these platforms helps to clarify the specific gap that this project addresses.

**Visual Portfolio and Community Platforms**

Platforms of this type allow designers to publish their work in a visual format and allow users to browse and engage with it. The discovery experience is strong — users can explore work by style, discipline, and designer. However, these platforms do not support hiring or project management. A client who wishes to engage a designer must leave the platform to do so. There is no proposal flow, no project workspace, and no payment mechanism.

**General Freelance Service Marketplaces**

These platforms support the full transaction lifecycle — job posting, proposals, contracts, and payments. Some have introduced milestone-based payment features. However, the discovery model is text-driven and not suited to visual disciplines like interior design. Clients cannot browse a designer's completed room projects filtered by style or room type. The project management tools are generic and not designed around the interior design workflow.

**Dedicated Interior Design Services**

These platforms offer a managed design service where clients are matched with a designer based on a style assessment. The service is structured and quality-controlled, but the client has no ability to browse an open pool of designers or make a selection based on a designer's specific portfolio. The platform operates as a closed service rather than an open marketplace.

**Home Renovation and Design Directories**

Some platforms combine a large library of home design photos with a directory of design professionals. Clients can browse inspiration and find professionals in their area. However, the connection between browsing and hiring is weak. The platform does not provide a structured project workflow, and the hiring process typically involves contacting the professional directly outside the platform.

**Summary**

None of the existing platforms reviewed provide a unified experience that combines visual, portfolio-led discovery with an open marketplace, a structured interior-design-specific project workflow, and an integrated milestone-based payment system. The proposed system is designed to address this combination of requirements within a single platform.

---

### 2.5 Proposed System

The proposed system is an Interior Design Service Platform that facilitates interaction between clients and interior designers through a structured workflow. The system enables users to discover designers, initiate design projects, and manage the progress of those projects within a single platform.

**Discovery and Designer Selection**

Clients enter the platform through a visual feed of completed interior design projects posted by designers. Each project is presented as a case study that includes images of the space, the room type, the design style, and relevant context. Clients can filter this feed by room type, design style, and budget range to find work that matches their requirements.

When a client finds a project they find relevant, they can save it to a personal mood board. The mood board functions as a visual collection that the client builds over time, reflecting the styles and approaches they are drawn to. This collection is not simply a saved list — it becomes a direct input to the project brief when the client decides to hire a designer.

Clients can also browse designer profiles directly, view their full portfolio, and check their current availability before initiating contact.

**Project Initiation and Proposal Flow**

When a client is ready to hire, they submit a project request from the designer's portfolio page. The request form captures the client's requirements — space type, budget, preferences — and allows them to attach their mood board as a visual reference. This means the designer receives a brief that already contains a curated set of visual references alongside the written requirements, providing immediate context before any conversation takes place.

The designer reviews the request and responds with a formal proposal that includes the scope of work, deliverables, timeline, and pricing. The client evaluates the proposal and either accepts it, requests clarification, or declines. Upon acceptance, the project is created within the system and both parties gain access to the project workspace.

**Project Workflow and Collaboration**

The project progresses through a defined set of stages: proposal, concept, design, revision, and completion. At each stage, the designer submits work and the client reviews it. The client can approve the submission and move the project to the next stage, or request revisions with specific feedback.

The project workspace supports threaded messaging tied to the project context, file sharing for design assets including mood boards, floor plans, and rendered visuals, and a structured revision and feedback mechanism. Both parties can view the current status of the project, what has been submitted, and what actions are pending at any point in the lifecycle.

**Milestone-Based Payment System**

The total project fee agreed in the proposal is divided across the defined project stages. At each stage, the corresponding payment portion is held on the platform and released to the designer only after the client approves the stage deliverable. This structure ensures that the client retains control over payments throughout the project and that the designer is compensated progressively as work is delivered and accepted.

**Additional Features**

The platform includes a designer availability management system that allows designers to indicate whether they are currently accepting new projects. Clients can see this status before submitting a request, reducing the likelihood of initiating contact with unavailable designers.

A review and rating system allows clients to leave verified feedback upon project completion. These reviews contribute to the designer's public profile and inform future clients during the discovery phase.

A notification system keeps both parties informed of project updates, new messages, payment events, and stage transitions.

**Dual-Role User System**

The platform supports a dual-role account model. A single registered user can operate as a client, a designer, or both, with separate dashboards for each role. This accommodates users who both seek design services and offer them, without requiring separate accounts or logins.
