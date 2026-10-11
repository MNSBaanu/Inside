# Inside: initial project review

Review date: 11 October 2026. This is an initial source review, not confirmation that every feature works.

## Purpose

Inside is an interior design service marketplace connecting clients and designers throughout a project. Its distinguishing workflow combines portfolio-first discovery, visual moodboards, structured briefs, designer recommendations, hiring and staged collaboration.

Clients browse portfolios, save inspiration, prepare briefs, send direct or open requests, compare proposals and select a designer. Acceptance creates a project with Proposal, Concept, Design, Revision and Completion stages. Designers upload versioned deliverables; clients approve or request revisions. Approval creates a pending milestone payment and advances the project. Messaging, activity, notifications and reviews support the workflow. Designers can switch to client mode; admins manage verification, reports, suspension and reviews.

The approved topic and project aim support this interpretation.

## Architecture

| Part | Location | Role |
| --- | --- | --- |
| Next.js website | apps/web | Discovery, hiring, workspace and administration |
| NestJS API | apps/api | Authentication, authorization and business rules |
| Expo mobile app | apps/mobile | Projects, approvals, messages and notifications |
| Prisma/PostgreSQL | packages/database | Schema, migrations and sample data |
| Shared types | packages/shared | Currently empty; app types maintained separately |
| Integrations | API payments/uploads | Stripe Checkout and Cloudinary signing |

Matching combines weighted style, room and budget scores with TF-IDF/cosine text similarity. Explain and evaluate this specific method in the dissertation.

## Findings and repair priorities

| Priority | Finding | Evidence / action |
| --- | --- | --- |
| High | Payment recording depends on the client returning from Checkout; no webhook exists. | API payments controller/service. Add signature-verified, idempotent webhook processing and amount/currency checks. |
| High | Release changes database status but does not transfer funds to designers. README overstates this as escrow. | PaymentsService.release. Define demo versus actual payout scope; implement onboarding/transfers for real payouts. |
| High | Auth tokens are generated but there is no email delivery. Production hides raw tokens. | AuthService.register/forgotPassword. Add email delivery and usable verification/reset links. |
| High | Test startup can overwrite its database URL from local .env values. | main.ts. Initial repair restricts override to explicit development mode. |
| Medium | Suspended users can refresh sessions although login/protected requests reject them. | AuthService.refresh. Initial repair rejects suspension before token rotation; regression test added. |
| Medium | In-app notifications exist; push and email delivery are absent. | NotificationsService and mobile dependencies/screens. Add delivery infrastructure. |
| Medium | Mobile payments are read-only. | mobile/components/project-panels.tsx explicitly redirects users to web for payment. Add Checkout launch/return. |
| Medium | Open requests use creation order rather than designer fit. | RequestsService.listMine/listOpen. Add explainable portfolio-based ranking. |
| Medium | Privacy/terms pages and registration consent are absent. | Web routes/register form and requirements reference. |
| Medium | State transition concurrency needs further testing. | Several stage/payment/project methods read state then update by ID. Reproduce conflicts and use atomic status predicates. |
| Medium | CI lacks explicit full-workspace lint, typecheck and build gates. | .github/workflows/ci.yml. Add after obtaining a clean baseline. |
| Resolved | Initial standalone lint failures: 10 web errors, one web accessibility warning and one mobile error. | Refactored form initialization, request lifecycle, session storage subscriptions and menu/reveal behavior; corrected the select role. Web/mobile lint now pass with zero warnings. |
| Academic | Requirements reference says all comparison rows are implemented while listing unfinished items. | docs/INSIDE_REQUIREMENTS_REFERENCE.md. Replace blanket claims with evidence. |
| Academic | UAT, performance/accessibility evidence, backup/restore instructions and user guide remain outstanding. | Requirements reference sections 8-8.1. |
| Documentation | API README is the NestJS starter template. | Replace with project-specific setup/testing documentation. |

## Environment and verification

- Working tree was clean initially.
- Dependencies were missing. Global pnpm failed with 'unable to open database file'. Installation uses pinned pnpm 10.25.0 and a workspace-local store.
- Docker is installed but its Linux engine was unavailable. Database-dependent tests require a running isolated PostgreSQL instance.
- No seed or database reset was executed. The seed deletes existing application data; use only expendable demo databases.
- Build/test/lint results must be recorded after execution; unrun checks are not passing checks.

### Checks completed in this pass

- Dependency installation and Prisma client generation succeeded.
- API: production build, TypeScript check, ESLint and all 111 tests across 26 unit suites passed.
- Web: all 27 tests across six suites passed; production build and its type validation passed. Standalone ESLint nevertheless failed with 10 errors and one accessibility warning. The first restricted build could not download Google fonts; the network-enabled retry passed.
- Mobile: TypeScript check passed; standalone ESLint failed with one React effect state-update error.
- Database/API e2e and browser journeys were not executed because the local Docker PostgreSQL service was unavailable.
- Initial auth/environment fixes are implemented. Payment, email, push, consent and evaluation gaps remain open.

### Follow-up: lint and React lifecycle repairs

- Web and mobile ESLint both pass with `--max-warnings 0`; their TypeScript checks pass.
- Web production build passes after the repairs. All 41 tests across 10 suites pass.
- Request results are scoped to the active URL, older requests are ignored, and web requests are aborted on effect cleanup. Disabled hooks clear visible results and do not fetch.
- Account and brief forms initialize when their data is available rather than copying it in effects. Account edits survive session refreshes and reset for a different account.
- Saved-designer and block buttons use the request hook, reset for a different account/target, and expose lookup/action errors instead of silently assuming state.
- Stage tasks and deliverables use the request hook; failed initial loads have retry controls. Task updates retain an optimistic UI and report failures.
- Session state subscribes to browser storage changes. Pending profile requests cannot restore a signed-out session.
- Route navigation remounts the mobile header menu and releases its scroll lock. Reduced-motion visibility is handled through CSS. Select keyboard focus is exposed under the combobox role.
- Added regression coverage for request races/reloads/cleanup, session logout races, keyboard selection, profile drafts and menu navigation.
- API code was unchanged during this follow-up; the preceding 111 passing API unit tests remain the latest API result.
- End-to-end tests and actual mobile-device behavior still require runtime verification. Payment, email, push, consent and academic evaluation items remain open.

## Repair sequence

1. Establish build/type/lint/unit baseline and verify the initial auth/environment repairs.
2. Run isolated database and browser suites; exercise client/designer/admin journeys.
3. Finish payment recording, state transition safety and auth delivery.
4. Finish mobile activities, notifications, request ranking and consent.
5. Collect performance, accessibility, recommendation quality and real user evaluation evidence; align documentation and dissertation claims.
