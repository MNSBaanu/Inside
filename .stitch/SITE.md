# Inside — Stitch Site Manifest

**Design system source:** [DESIGN.md](DESIGN.md)  
**Platform:** Inside — Interior Design Service Platform  
**Audience:** Clients (homeowners), interior designers, platform administrators

## Description

Inside connects clients and interior designers from portfolio discovery through moodboard briefs, proposal-based hiring, five-stage project collaboration, and Stripe milestone payments. This manifest defines the generation order for Google Stitch screen batch workflows (`stitch-loop` or manual generation).

## Device defaults

| Section | deviceType | Viewport |
|---------|------------|----------|
| Web (W-*) | `DESKTOP` | 1440 × 900 |
| Mobile (M-*) | `MOBILE` | 390 × 844 |

## Generation order

Generate screens in this sequence. Each prompt is in [DESIGN.md Appendix B](DESIGN.md#appendix-b--stitch-generation-prompts).

### Wave 1 — Auth & marketing (P1)

| Order | ID | Screen |
|-------|-----|--------|
| 1 | W-01 | Landing / Marketing home |
| 2 | W-02 | Login |
| 3 | W-03 | Register |

### Wave 2 — Client discovery & brief (P1)

| Order | ID | Screen |
|-------|-----|--------|
| 4 | W-C01 | Client dashboard |
| 5 | W-C02 | Discovery feed |
| 6 | W-C03 | Filters drawer |
| 7 | W-C04 | Portfolio detail |
| 8 | W-C05 | Designer public profile |
| 9 | W-C06 | Moodboard list |
| 10 | W-C07 | Moodboard editor |
| 11 | W-C08 | Brief builder |
| 12 | W-C09 | Brief preview |
| 13 | W-C10 | Fit scores |

### Wave 3 — Client hiring (P1)

| Order | ID | Screen |
|-------|-----|--------|
| 14 | W-C11 | Create open request |
| 15 | W-C12 | Send direct request |
| 16 | W-C13 | My requests list |
| 17 | W-C14 | Request detail |
| 18 | W-C15 | Proposal comparison |
| 19 | W-C17 | Accept proposal modal |

### Wave 4 — Client project workspace (P1)

| Order | ID | Screen |
|-------|-----|--------|
| 20 | W-C19 | Active projects list |
| 21 | W-C20 | Project workspace |
| 22 | W-C21 | Stage detail + deliverables |
| 23 | W-C22 | Deliverable viewer |
| 24 | W-C23 | Approve / reject modal |
| 25 | W-C24 | Milestone ledger |
| 26 | W-C25 | Stripe checkout |
| 27 | W-C26 | Project messaging |
| 28 | W-C27 | Post-completion review |

### Wave 5 — Designer (P1)

| Order | ID | Screen |
|-------|-----|--------|
| 29 | W-D01 | Designer dashboard |
| 30 | W-D02 | Portfolio list |
| 31 | W-D03 | Create / edit portfolio |
| 32 | W-D05 | Incoming requests inbox |
| 33 | W-D06 | Request detail (designer) |
| 34 | W-D07 | Submit proposal |
| 35 | W-D08 | Active projects list |
| 36 | W-D09 | Designer stage workspace |

### Wave 6 — Shared overlays (P1)

| Order | ID | Screen |
|-------|-----|--------|
| 37 | W-S01 | Notifications panel |
| 38 | W-S02 | Role switcher modal |

### Wave 7 — Mobile companion (P1)

| Order | ID | Screen |
|-------|-----|--------|
| 39 | M-01 | Login + role switch |
| 40 | M-02 | Notifications home |
| 41 | M-03 | Messages list |
| 42 | M-04 | Chat thread |
| 43 | M-05 | My projects (client) |
| 44 | M-06 | Project detail |
| 45 | M-07 | Deliverable approve/reject |
| 46 | M-08 | Pay milestone |

### Wave 8 — Secondary web (P2)

| Order | ID | Screen |
|-------|-----|--------|
| 47 | W-04 | Forgot password |
| 48 | W-05 | Email verification |
| 49 | W-06 | Profile settings |
| 50 | W-C16 | Single proposal detail |
| 51 | W-C18 | Favourite designers |
| 52 | W-D04 | Availability settings |
| 53 | W-D10 | Designer earnings |
| 54 | W-S03 | Empty / error / loading states |

### Wave 9 — Admin (P2–P3)

| Order | ID | Screen |
|-------|-----|--------|
| 55 | W-A01 | Admin dashboard |
| 56 | W-A02 | User management |
| 57 | W-A03 | Verification queue |
| 58 | W-A04 | Reports & complaints |
| 59 | W-A05 | Review moderation |
| 60 | W-A06 | Platform analytics |

### Wave 10 — Mobile secondary (P2)

| Order | ID | Screen |
|-------|-----|--------|
| 61 | M-09 | Designer requests inbox |
| 62 | M-10 | Designer earnings |

## How to use with Google Stitch

1. **Create project:** Open [Google Stitch](https://stitch.withgoogle.com) → New project → name it **Inside**
2. **Import design system:** Paste contents of `DESIGN.md` into project design settings, or generate the first screen (W-01) and use the `design-md` skill to refine
3. **Generate screens:** For each row above, open **Generate from text**, paste the matching prompt from DESIGN.md Appendix B, set `deviceType` per table
4. **Batch option:** Use [stitch-skills](https://github.com/google-labs-code/stitch-skills) `stitch-loop` with this SITE.md as the page manifest
5. **Export:** Download PNG screenshots at 1440×900 (web) or 390×844 (mobile) for interim report wireframes
6. **Validate:** Run `npx @google/design.md lint .stitch/DESIGN.md` from repo root

## Interim report wireframes (priority export)

Export these five first for the main report body:

1. W-C02 — Discovery feed
2. W-C07 — Moodboard editor
3. W-C15 — Proposal comparison
4. W-C20 — Project workspace
5. W-C24 — Milestone ledger

See [DESIGN.md Appendix D](DESIGN.md#appendix-d--academic-wireframe-mapping) for highlight guidance.

## Related docs

- User flows: [`docs/Proposal/Sections/Flow.md`](../docs/Proposal/Sections/Flow.md)
- Functional requirements: [`docs/Proposal/Sections/Functions.md`](../docs/Proposal/Sections/Functions.md)
- Frontend implementation: [`docs/Interim/ImplementationPlan.md`](../docs/Interim/ImplementationPlan.md)
