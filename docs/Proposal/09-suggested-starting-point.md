# Suggested Starting Point

The following actions will be undertaken first to begin work on Inside:

1. **Requirements gathering** — Confirm functional scope against the approved topic ([Topic Approval Documentation](../Approval/Topic%20Approval%20Documentation.md)) and document user stories for client and designer roles.

2. **Domain research** — Analyse comparable platforms (Houzz, Fiverr, Havenly, Behance) and document gaps (see [supporting/literature-domain-review.md](supporting/literature-domain-review.md)).

3. **System design** — Finalise ER diagram, API outline, and wireframes; complete architecture diagrams in [diagrams/](diagrams/) per [diagrams-and-charts-guide.md](diagrams-and-charts-guide.md).

4. **Environment setup** — Create AWS (Amplify, ECS, RDS PostgreSQL, Cognito, S3), Stripe, and GitHub accounts; scaffold `src/Inside.*` (.NET solution) and `web/` (Next.js).

5. **Authentication and role management** — Implement registration, login, JWT/Cognito, and dual-role switching as the foundation for all other modules.

6. **Review system flows** — Read [SYSTEM-OVERVIEW.md](../SYSTEM-OVERVIEW.md) to validate journeys before coding.

7. **Iterative development** — Follow the build order in [10-project-plan.md](10-project-plan.md): auth → portfolio → discovery → moodboards → requests/proposals → project workspace → payments → reviews.
