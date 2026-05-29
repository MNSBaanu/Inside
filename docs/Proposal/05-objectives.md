# Objectives

## General objectives (academic)

1. Conduct a critical review of the interior design service domain and existing digital platforms.
2. Critically study technologies suitable for a modern, role-based web application deployed on the cloud.
3. Design and develop a system that addresses the identified problem.
4. Evaluate the proposed system against defined criteria.
5. Prepare comprehensive final documentation.

## Specific objectives (Inside)

6. Implement **authentication** with a dual-role model (client and designer on one account).

7. Implement **portfolio-first discovery** with filtering by design style, room type, and budget.

8. Implement **moodboards** so clients can curate visual briefs and attach them to project requests.

9. Implement **project requests and proposals** for open marketplace hiring and direct portfolio hire.

10. Implement a **structured project workspace** with stages (Proposal → Concept → Design → Revision → Completion), messaging, and S3 file sharing.

11. Implement **milestone-based payments** using Stripe, released upon client approval at each stage.

12. Implement **reviews, notifications**, and designer **availability** indicators.

13. Deploy the application on **AWS** (Amplify, ECS, S3, CloudFront, SES, Cognito, CloudWatch) with CI/CD from GitHub.

## Traceability

| Objective | System flow (see [SYSTEM-OVERVIEW.md](../SYSTEM-OVERVIEW.md)) |
|-----------|---------------------------------------------------------------|
| 7–8 | Flow 1 — Discover & moodboard |
| 9 | Flow 2–3 — Hire via request or direct |
| 10 | Flow 4 — Project delivery |
| 11 | Flow 5 — Milestone payment |
| 12 | Flow 6 — Review |

Functional detail: [supporting/functional-requirements.md](supporting/functional-requirements.md).
