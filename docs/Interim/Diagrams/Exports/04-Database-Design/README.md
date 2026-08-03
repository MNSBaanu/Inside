# Database Design

## 11-er.png

Defines how persistent data is organised for the marketplace: identities, project lifecycle records, media, messaging, payments, and trust-related entities. It supports referential integrity and query design for features that span hiring, collaboration, and settlement.

**Source:** [`../../11-er.drawio`](../../11-er.drawio) — re-export the PNG after diagram edits (`../export-diagrams.ps1` or Draw.io export).

### Aligned with Prisma (`packages/database/prisma/schema.prisma`)

| Area | Entities |
|------|----------|
| Discovery | User, Favourite, Portfolio, PortfolioImage, Moodboard, Brief |
| Hiring → workspace | ProjectRequest, Proposal, Project, ProjectStage, Deliverable, MilestonePayment |
| Project support | Message, Review, Notification |
| Users and trust | Report, **AuthToken** (email verify / password reset) |
| Also in Prisma (note on ER) | Session, Verification, Block, ActivityLog |
| Not persisted | Fit scores — computed from brief + designer/portfolio data |

Auth tokens store a **hash** only (`tokenHash`), with `type` `EMAIL_VERIFY` or `PASSWORD_RESET`, plus `expiresAt` / `usedAt`.
