# Inside: full project analysis

Reviewed: 17 October 2026. Basis: current local repository, the preceding live-site audit, retained QA records, and extracted proposal/final-report text. This review covers the major product and engineering areas; it is not an exhaustive verification of every execution path or a production security certification.

## 1. Assessment

Inside is an implemented marketplace with a connected web workflow, a modular API, a substantial database model, and a narrower mobile companion. It should be completed through focused integration, reliability, and evaluation work. A rewrite or a new architecture is not justified by the evidence reviewed.

The central workflow already exists:

`Discover work → collect inspiration → prepare brief → match designers → request proposals → accept one → deliver five stages → review work → record milestone payments → moderate feedback`

The main unfinished areas are production email, native push, useful visual-brief generation, payment reconciliation and financial policy, some transition races, operational recovery, and independent evaluation. Recent directory/payment-demo fixes are local changes; deployment parity has not been established.

No defensible overall completion percentage can be calculated without an agreed release scope and acceptance results. A screen or API endpoint existing is not the same as the feature being fully verified.

## 2. Scope and evidence

Reviewed sources include:

- Root README, package scripts, Turborepo configuration, CI, Docker configuration, environment examples, and previous audit/review documents.
- Prisma schema, migrations inventory, seed behavior, API controllers/guards, and core services for authentication, profiles, discovery, moodboards, briefs, matching, requests, proposals, projects, stages, tasks, delivery, payments, messaging, notifications, reviews, uploads, verification, moderation, and activity.
- Web route/component inventory and the main forms, project controls, request hooks, session handling, and public metadata.
- Mobile route inventory, session/storage handling, project/stage controls, uploads, messages, notifications, and payment/account limitations.
- API/browser test inventories and retained hosted QA results.
- `test-results/final-report-work/proposal.txt` and the requirements/evaluation sections of `final-pdf-text.txt`. These are extracted local artifacts, not a newly confirmed supervisor-approved scope.

The older review references a `docs/` requirements file that is absent from this checkout. The extracted final report does contain a useful FR01–FR20 baseline. Recover the authoritative source documents and freeze their version during Phase 0.

No production accounts, payment actions, migrations, seeds, or hosted QA scripts were executed for this analysis. Existing staged implementation changes were preserved.

## 3. Architecture and maintainability

| Area | Current implementation | Assessment |
| --- | --- | --- |
| Web | Next.js App Router, React, TypeScript, Tailwind; public discovery and authenticated client/designer/admin areas | Broadest product surface; much public content is fetched after hydration |
| API | NestJS modules, DTO validation, JWT/session validation, role guards and record ownership | Sensible separation; improve transactional boundaries and integration delivery |
| Database | Prisma/PostgreSQL; users, portfolios, briefs, hiring, stages, payments, messages, trust records | Relationships and uniqueness rules are substantial; strengthen financial and concurrency invariants |
| Mobile | Expo/React Native; secure storage, projects, stages, delivery, messaging, notifications | Useful companion; not equivalent to the web application |
| Media | Signed Cloudinary uploads, allowed formats, direct file URLs | Real integration exists; private retrieval, size/abuse controls, ownership and retention need explicit validation |
| Finance | Stripe test-mode Checkout; return-based confirmation; internal release status | Demonstration only; no webhook recovery or designer settlement |
| Shared package | `packages/shared/src/index.ts` exports nothing | Web/mobile response shapes are duplicated; share a small stable contract set rather than creating a large abstraction project |
| Delivery | Web hosted separately; API Dockerfile; PostgreSQL Compose; GitHub Actions | Repeatable pieces exist, but migration/rollback, mobile artifact, recovery and release proof are incomplete |

Important tooling details:

- Root `pnpm typecheck` delegates only to packages with that script. The API currently lacks a dedicated typecheck script, although CI now explicitly invokes its compiler.
- Root build does not produce a native mobile release: mobile has no build script in this repository.
- API lint includes `--fix`; use a non-mutating lint command for CI and audit checks.
- CI includes API unit/database tests and web unit/browser tests. Recent changes add type checking and web lint. Mobile checks and explicit production/container build gates still need coverage.
- Runtime versions differ across Docker and CI jobs. Choose and document supported versions after testing the current lockfile; do not combine completion work with an unnecessary major-version migration.

## 4. Requirements coverage

“Implemented” below describes reviewed source and available historical evidence. It does not certify every path on the current deployment.

| ID | Requirement | Current state | Completion work |
| --- | --- | --- | --- |
| FR01 | Account access/session lifecycle | Implemented; hashed passwords, refresh rotation, revocation and suspension checks | Real recovery-email journey, concurrency/error tests, mobile lifecycle verification |
| FR02 | Profiles and role switching | Implemented on web; mobile role switch and account summary | Confirm account editing scope, availability policy and publication feedback |
| FR03 | Email verification/password recovery | Token logic and web pages exist; no email sender | Delivery, resend, retry, expiry/reuse tests, correct UI promises |
| FR04 | Portfolio publishing/discovery | Implemented with media, style, room, budget and location | Draft/public ownership tests, validation, shareable portfolio filters, accessibility/performance |
| FR05 | Favourites | Implemented with uniqueness constraint | Confirm cross-account state and available/unavailable designer behavior |
| FR06 | Visual briefs | Moodboards link to briefs; generation concatenates notes and defaults missing selections | Preserve linked portfolio context; collect/infer style/room with client confirmation |
| FR07 | Explainable matching | Weighted style/room/budget plus TF-IDF/cosine text similarity | Relevance evaluation, fallback for incomplete briefs, numeric budget semantics |
| FR08 | Direct/open requests and proposal comparison | Implemented | State conflict tests, clear eligibility rules and designer opportunity ranking if retained in scope |
| FR09 | Single proposal acceptance | Transactional conditional request/proposal claims exist | Preserve existing guards; verify competing decisions and creation rollback in a real test database |
| FR10 | Five-stage delivery/tasks/dates/versions | Implemented | Concurrent version allocation; explicit schedule changes and closed-project behavior |
| FR11 | Approval/revision | Approval claims submitted stage atomically; revision requires new deliverable | Protect competing reject/approve and other transitions, including project cancellation races |
| FR12 | Hold/resume/cancel | Implemented | Persist hold ownership outside best-effort logs; atomic transitions; cancellation/payment policy |
| FR13 | Private project messaging/attachments | Party checks, read state, older pages and 15-second polling | Pagination under new-message arrival, retry behavior, actual attachment privacy and device tests |
| FR14 | In-app notifications | Stored records, read/read-all; delivery errors are swallowed and logged | Durable event handling, pagination/retention, correct destination navigation |
| FR15 | Transactional email/native push | Not implemented | Email delivery service, push registration/delivery/receipts/preferences and real-device tests |
| FR16 | Milestone finance | Checkout demo and release records; test keys now enforced | Agree funding/completion rules; idempotent Checkout, webhook reconciliation and failed/pending handling |
| FR17 | Reviews/moderation | Completed-project eligibility, duplicate prevention; new reviews await visibility moderation | Publish/decline feedback, rating consistency and admin queue acceptance tests |
| FR18 | Verification/reports/blocks | Implemented pathways | Evidence access, report authorization/attribution, duplicate/competing decisions and documented criteria |
| FR19 | Administration | Counts, user moderation, verification, reports, review visibility, activity | Pagination beyond first 100 records, audit durability and scoped analytics expectations |
| FR20 | Mobile companion | Login, projects, stages, files, messages, in-app notifications, role switching | Define companion scope; recovery links, alert navigation, test-payment handoff, release artifact/device evidence |

## 5. Product strengths to preserve

- Proposal acceptance claims the request before proposal rows, rejects competing decisions, rejects other proposals and creates the five-stage project in one transaction.
- Stage approval uses a conditional SUBMITTED claim; it is not completely unprotected.
- Moodboard item add/remove uses optimistic concurrency through `updatedAt`.
- Private project endpoints enforce party membership; admin status is not automatically universal private-project access.
- Reviews are contextual to completed projects and are not immediately public by default.
- Web request hooks abort superseded requests and protect against stale results; session regression tests exist.
- Mobile uses encrypted secure storage, unlike the web localStorage implementation.
- Database uniqueness constraints cover favourites, per-designer proposals, project-per-proposal, stage ordering and deliverable versions.
- The visual language and main web journey are already coherent. Improve continuity and feedback rather than redesigning every page.

## 6. Priority findings

| Priority | Finding and evidence | Consequence | Planned phase |
| --- | --- | --- | --- |
| P0 | Auth creates verify/reset tokens but never emails them (`auth/auth.service.ts`); forgot-password UI promises a sent email | User recovery cannot complete through normal production UI | 1 |
| P0 for real money | Payments have no webhook handler; confirmation comes from web return (`payments.service.ts`, web `payment-list.tsx`) | Successful Checkout can remain unrecorded; duplicate attempts can create duplicate payable sessions | 4 |
| P0 for real money | Release writes RELEASED but makes no transfer call; test-mode restriction is now explicit | No actual designer settlement; real-money release claims would be inaccurate | 4 / commercial gate |
| P1 | Stage approval creates unpaid milestones and advances delivery without payment gating (`stages.service.ts`) | All work can finish with payments outstanding; intended funding policy is not enforced | 0, 3, 4 |
| P1 | Brief generation uses `Mixed`/`General` defaults and does not infer linked portfolio attributes (`briefs.service.ts`) | Weak matching input; inspiration loses useful meaning | 2 |
| P1 | Reject/start/submit, project changes and verification decisions commonly read status then update only by ID | Competing valid requests can overwrite a newer decision; requires reproduction with database concurrency tests | 3 |
| P1 | Deliverable version is allocated by reading max then creating; uniqueness prevents duplicate rows but not a conflict experience | Parallel uploads can fail instead of allocating a new version safely | 3 |
| P1 | Resume authorization reads the last hold event; activity logging is best-effort (`projects.service.ts`, `activity.service.ts`) | Missing activity records can weaken the intended holder-only resume rule | 3 |
| P1 before private files | Upload signing handles format/folder but reviewed code has no authenticated retrieval path for private files | API membership checks alone do not establish confidentiality of directly shared file URLs | 1, 6 |
| P1 | Email/push delivery infrastructure and device registrations are absent | Alerts do not reach users outside the app | 1, 5 |
| P1 | Current release lacks fresh database/browser/native acceptance evidence | Passing unit tests cannot establish the complete deployed experience | 0, 6, 7 |
| P2 | Web stores access/refresh tokens in localStorage; CSP permits inline scripts | XSS would expose persistent sessions; no XSS exploit was demonstrated | 1, 6 |
| P2 | Public data loads in client effects; sitemap lists static routes only | Additional load dependency and incomplete content discovery | 2, 6 |
| P2 | Several lists return all records or cap at 100, including notifications/activity/admin views | Counts and old records can become incomplete; scalability must be measured | 5, 6 |
| P2 | Report targets are checked for existence, not consistently for reporter membership; reported user ID is client-provided | Private-target policy and attribution need review and negative tests; no exploit was exercised | 1, 3 |
| P2 | Shared contracts are empty; mobile contracts are hand-maintained subsets | Response/enum drift risk during completion | 0, 5 |
| P2 | Backup/restore, observability, release rollback and privacy procedures lack verified runbooks | Hosted availability and safe recovery are not demonstrated | 6, 7 |

Paths in this table are relative to `apps/api/src` unless explicitly marked web.

## 7. Mobile scope assessment

| Capability | Web | Native mobile |
| --- | --- | --- |
| Registration/login/role switch | Available | Available |
| Public designer/portfolio discovery | Available | No corresponding native routes found |
| Moodboards/briefs/matching/hiring | Available | No corresponding native routes found |
| Project list/detail and stage actions | Available | Available |
| Deliverable upload/feedback and messages | Available | Available in project components |
| Task and due-date management | Available on web | Do not assume parity; confirm against agreed companion scope |
| Payment actions | Test-mode demo | Read-only list; text directs users to web |
| Profile/portfolio/verification management | Available | Text directs users to web |
| Native push and recovery deep links | Not applicable / email links on web | Not implemented end to end |
| Automated native tests/release packaging | Not applicable | No native test script or release-build configuration found |

The extracted FR20 explicitly describes a companion. Keep that as the recommended baseline, subject to the authoritative requirements. Full native marketplace parity is a separate substantial scope increase.

## 8. Data, matching and integrity assessment

- Monetary database columns use Decimal(12,2), and proposal totals sum rounded minor units. Financial actions still need expected amount/currency validation and durable event identity.
- Payment states include PROCESSING, FAILED and REFUNDED, but the reviewed service mainly implements PENDING, PAID and RELEASED. An enum is not evidence of a working failure/refund flow.
- Milestones have a stage index but no stage uniqueness constraint. Add an appropriate invariant when the agreed one-payment-per-stage model is finalized; review existing rows before migration.
- Budget is a free-text brief range and a historical portfolio budget, not necessarily a designer service fee. Normalize the former and label the latter accurately.
- Matching weights are style 35, room 30, budget 20 and description 15. Missing description changes the score denominator. The strongest portfolio score represents the designer.
- Candidate selection initially requires style/room/budget relevance. Description-only matches outside that pool are never scored. Default `Mixed/General` with no usable budget can therefore produce no recommendations.
- Generated briefs are rule-based summaries, not image understanding. Do not describe them as visual AI unless such functionality is actually built and evaluated.
- Common style/room values should be normalized or validated. Free-text unknown values and whitespace can reduce exact matching.
- Message pages use offset pagination with a changing conversation. Test new arrivals between older-page requests; use a stable cursor if the tests show gaps/duplication.
- Privacy and account deletion need a retention policy that respects financial history and existing Restrict relationships. Do not add cascading deletion of payment history as a shortcut.

## 9. Verification state

| Evidence | Result | Limits |
| --- | --- | --- |
| Latest preceding web unit run in this conversation | 50 passed across 12 files | Component/unit coverage, not current deployed journeys |
| Latest preceding API unit run | 120 passed across 28 suites | Mocks do not reproduce PostgreSQL locking or provider settlement |
| Web/API TypeScript, web lint, changed API module lint, API build | Passed in the preceding implementation pass | Full production web/container release was not rebuilt in that pass |
| Mobile TypeScript and lint | Both passed during this analysis | Does not prove an Android/iOS package builds or works on a device |
| Retained hosted QA results from 13 October | 149 PASS, 2 GAP, 1 BLOCKED, 1 NOT_TESTED | Historical recorded evidence; not rerun against the latest source |
| Historical gaps | Brief context; all milestones unpaid at completion | Reconfirmed in reviewed service logic |
| Historical blocked check | Stripe Checkout creation | Do not infer successful payment or payout |
| Fresh database/browser suites | Not run | Local PostgreSQL unavailable; local socket restrictions affected the previous manual preview |
| Native devices, email/push delivery, Stripe settlement, load/UAT/recovery | Unverified | Require configured services, isolated environments and recorded execution |

The plan must retain these distinctions in the dissertation. Do not convert old evidence or proposed performance targets into new measured results.

## 10. Recommended completion strategy

1. Freeze the release contract and establish an isolated, repeatable verification environment.
2. Close account access and file-privacy gaps.
3. Preserve visual intent through briefs and matching.
4. Make workflow state changes safe, then complete payment behavior in test mode.
5. Finish alerts and the agreed mobile companion.
6. Measure quality, validate with users, deploy a traceable release and align documentation.

See [PROJECT_COMPLETION_PLAN.md](PROJECT_COMPLETION_PLAN.md) for task IDs, dependencies, effort estimates and acceptance gates.
