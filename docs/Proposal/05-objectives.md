# Objectives

## General objectives (academic)

1. Conduct a critical review of the interior design service domain and existing digital platforms.
2. Critically study technologies suitable for a cloud-deployed, role-based application (.NET, AWS, Stripe).
3. Design and develop a system that addresses the identified problem with demonstrable innovation.
4. Evaluate brief quality, fit scoring usefulness, and stage-gated workflow effectiveness.
5. Prepare comprehensive final documentation.

## Specific objectives (Inside)

6. Implement **authentication** with dual-role accounts (AWS Cognito).

7. Implement **portfolio-first discovery** with style, room type, and budget filters.

8. Implement **moodboards** and **structured brief generation** (FR-BRIEF) from saved portfolio items.

9. Implement **designer–client fit scoring** (FR-FIT) based on visual portfolio compatibility.

10. Implement **project requests and proposals** for marketplace hiring.

11. Implement a **stage-gated project workspace** (Proposal → Concept → Design → Revision → Completion) with S3 deliverables and per-stage approval.

12. Implement **milestone payments** and a **transparent ledger** using Stripe webhooks.

13. Implement reviews, notifications (in-app + SES), and designer availability.

14. Deploy on **AWS** (Amplify, ECS, RDS, S3, CloudFront) with CI/CD.

## Traceability

| Objective | Flow ([SYSTEM-OVERVIEW.md](../SYSTEM-OVERVIEW.md)) |
|-----------|-----------------------------------------------------|
| 7–8 | Discovery, moodboard, brief |
| 9 | Fit scoring |
| 10 | Hire (request + proposals) |
| 11 | Stage workspace |
| 12 | Milestone ledger |
| 13 | Review |

Detail: [supporting/functional-requirements.md](supporting/functional-requirements.md) · Evaluation: [supporting/evaluation-plan.md](supporting/evaluation-plan.md).
