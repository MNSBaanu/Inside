# Background and Motivation

Interior design is a highly visual, preference-driven domain. Clients frequently struggle to articulate what they want using text alone, and designers struggle to interpret vague briefs. Industry research on digital service platforms highlights that visual communication and structured workflows significantly reduce misalignment between service providers and customers (Mahoney, 2024). In the home and interior sector, platforms like Houzz have proven strong demand for inspiration-led discovery, while freelance marketplaces demonstrate that clients expect integrated messaging and payments — but rarely both optimised for design-specific workflows.

Existing platforms fall into three categories, as identified in the approved topic documentation. **Portfolio and community platforms** (e.g. Behance, Dribbble) support discovery but not hiring or escrow payments. **General freelance marketplaces** (e.g. Fiverr, Upwork) support proposals and payments but not portfolio-first, style-filtered discovery for rooms and budgets. **Closed interior design services** (e.g. Havenly, Decorilla) manage the full journey but limit how freely clients browse and select designers based on demonstrated completed work.

The gap is a platform that combines: (1) portfolio-first discovery filtered by style, room type, and budget; (2) moodboards as visual briefs attached to project requests; (3) open marketplace proposals; (4) interior-design-specific project stages; and (5) milestone payments released upon client approval at each stage. Inside is designed to fill this gap.

## Platform comparison

| Platform | Portfolio discovery | Visual brief | Client chooses designer | ID-specific stages | Milestone pay |
|----------|---------------------|--------------|-------------------------|--------------------|---------------|
| Behance / Dribbble | Yes | No | No | No | No |
| Houzz | Yes (rooms) | Partial | Limited | No | No |
| Fiverr | Profile-based | Text job post | Yes | Generic | Escrow |
| Havenly / Decorilla | Limited | Assigned match | No | Yes | Yes |
| **Inside (proposed)** | Portfolio-first | **Auto brief + moodboard** | Yes + **fit score** | **5 ID stages** | Per approval |

## Inside vs generic freelancing

| Fiverr-style | Inside |
|--------------|--------|
| Text job description | Moodboard + structured brief |
| Reviews / stars | Fit score + portfolio case studies |
| Generic milestones | Concept → Design → Revision stages + ledger |
| Message thread | Stage deliverables + approval gates |

The motivation for this project is both practical and academic. Practically, the growth of remote and digital creative services requires better tools for structured collaboration. Academically, the project applies role-based access control, workflow state machines, RESTful API design on **ASP.NET Core 8**, **AWS** deployment, payment integration, and system evaluation within the interior design domain.

The author is motivated to deliver a production-quality Final Year application using **ASP.NET Core 8**, **AWS**, **PostgreSQL**, and **Stripe**—with research contributions in structured brief generation, designer fit scoring, and stage-gated workflows. End-to-end flows are in [SYSTEM-OVERVIEW.md](../SYSTEM-OVERVIEW.md). Citations: [11-references.md](11-references.md).
