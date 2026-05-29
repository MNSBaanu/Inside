# Proposed Solution

The proposed system digitises the interior design commission lifecycle by bringing discovery, hiring, staged delivery, communication, and payment into one cloud-hosted platform. Clients explore designers’ completed work, express preferences visually, receive and compare responses, and manage an active project through to completion. Designers maintain a professional presence, respond to opportunities with scoped offers, upload work for review at each stage, and receive payment as the client confirms progress. Both roles use dashboards suited to their responsibilities, with messages and alerts kept in the context of the project rather than on separate channels. The result replaces a scattered mix of inspiration sites, informal contact, and offline settlement with one workflow aligned to how interior design commissions are usually run.

The solution follows a **three-tier architecture** (IBM, 2024). The **presentation tier** is a **Next.js** web application hosted on **AWS**, providing public discovery pages and signed-in areas for clients and designers. The **application tier** is an **ASP.NET Core 8** REST API on **AWS**, handling authentication, published work, project requests and responses, staged project workflow, file handling, payments, and notifications. The **data tier** uses a **relational database on AWS** for users and project records, object storage for images and deliverables, and **Stripe** for payment processing. The API is organised in layers—controllers, application services, domain models, and infrastructure adapters—so business rules remain testable and maintainable.

Mermaid sources, service descriptions, and export notes are maintained in [diagrams/architecture-diagrams.md](diagrams/architecture-diagrams.md). Export PNGs before merging the proposal for ELMS.

## Architecture Diagrams

![Simple high-level architecture](diagrams/02-simple-architecture.png)

*Figure 1: Simple three-tier architecture*

![Detailed high-level architecture](diagrams/03-detailed-architecture.png)

*Figure 2: Detailed high-level architecture*

## Core functional areas

**User management** — Registration and login; separate client and designer dashboards.

**Discovery** — Designers publish completed work; clients browse and filter to find suitable professionals.

**Project initiation** — Clients post project needs; designers submit scoped responses; the client selects one to open an active commission.

**Project workspace** — Shared area for staged deliverables, client feedback, approval of progress, messaging, and notifications.

**Payments** — Total fee split across agreed stages; **Stripe** processes charges on client approval; payment status recorded per project.

## Scope

**MVP:** Authentication, discovery, requests and responses, project workspace, Stripe payments, core notifications, deployment on AWS.

**Later enhancements:** Richer messaging, extended reporting, and additional automation as time allows within the schedule.

**Limitations:** Stripe test mode during development; English UI; single cloud region for initial deployment.
