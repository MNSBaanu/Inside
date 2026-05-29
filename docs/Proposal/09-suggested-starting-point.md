# Suggested Starting Point

1. **Requirements gathering** — Confirm scope against [Topic Approval Documentation](../Approval/Topic%20Approval%20Documentation.md) and functional requirements in [06-proposed-solution.md](06-proposed-solution.md).

2. **Domain research** — Platform comparison in [02-background-and-motivation.md](02-background-and-motivation.md).

3. **System design** — ER diagram, API outline, wireframes; architecture PNGs per [diagrams-and-charts-guide.md](diagrams-and-charts-guide.md).

4. **Environment setup** — AWS (Amplify, ECS, RDS, Cognito, S3), Stripe, GitHub; scaffold `src/Inside.*` and `web/`.

5. **Auth + dual-role** — Cognito and JWT claims (foundation for all modules).

6. **Review flows** — [SYSTEM-OVERVIEW.md](../SYSTEM-OVERVIEW.md).

7. **Iterative build** — Follow [10-project-plan.md](10-project-plan.md): auth → portfolio → discovery → moodboards + brief + fit → requests → workspace → Stripe → reviews.
