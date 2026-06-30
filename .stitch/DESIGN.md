---
version: alpha
name: Inside
description: Interior design marketplace — portfolio discovery, moodboards, staged collaboration, milestone payments.
colors:
  primary: "#10739e"
  primary-light: "#B1DDF0"
  primary-dark: "#0A4F6E"
  surface: "#FFFFFF"
  background: "#F8FAFB"
  on-surface: "#1A2B33"
  muted: "#6B7C85"
  accent: "#E8A838"
  success: "#2D8A5E"
  warning: "#D97706"
  error: "#DC2626"
  border: "#D4E8F0"
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.08em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 24px
  margin: 32px
  container-max: 1280px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 24px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 24px
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 24px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 24px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    height: 44px
  badge:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 4px 12px
  chip-filter:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px 16px
  nav-item:
    typography: "{typography.body-md}"
    textColor: "{colors.on-surface}"
    padding: 8px 12px
  stage-stepper-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    size: 32px
  stage-stepper-inactive:
    backgroundColor: "{colors.border}"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
    size: 32px
  chat-bubble-sent:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 12px 16px
  chat-bubble-received:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 12px 16px
  milestone-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
---

# Design System: Inside — Interior Design Service Platform

**Project:** Inside  
**Stack target:** Next.js 14 · shadcn/ui · Tailwind CSS · React Native (companion mobile)

---

## Overview

Inside is a **portfolio-first interior design marketplace** that connects clients and designers from inspiration through milestone payment. The visual language should feel **curated, warm, and trustworthy** — closer to a design magazine than a generic freelance gig board.

**Audience:** Homeowners and property owners (clients) seeking interior designers; professional interior designers building portfolios and managing staged projects; platform administrators.

**Platform scope:**

- **Web (desktop-first):** Full discovery, moodboards, briefs, hiring, project workspace, payments, admin.
- **Mobile companion:** Notifications, messaging, quick stage approvals, and milestone payments — not a full feature parity copy.

**Dual-role accounts:** One login can switch between Client and Designer modes. The role switcher must always be visible in the authenticated navbar.

**Emotional tone:** Spacious layouts with large room photography, restrained teal-and-white palette, single warm gold accent for hire/pay actions. Users should feel guided by clear "next action" CTAs on dashboards, never lost in the workflow.

**Unique UX pillars (must be visible in UI):**

1. Moodboard → structured brief generation
2. Designer fit scoring with breakdown
3. Open request + direct hire (both via proposals)
4. Five-stage gated workspace (Proposal → Concept → Design → Revision → Completion)
5. Approval-gated milestone payment ledger

---

## Colors

The palette is rooted in **Deep Teal Navy** and **Sky Mist** from the project architecture diagrams, with a single warm accent for conversion actions.

| Token | Hex | Role |
|-------|-----|------|
| **Primary** | `#10739e` | Navbar active states, primary buttons, stage stepper active step, links |
| **Primary Light** | `#B1DDF0` | Filter chip backgrounds, badge fills, hover highlights, diagram accents |
| **Primary Dark** | `#0A4F6E` | Hover/pressed primary button, footer backgrounds |
| **Surface** | `#FFFFFF` | Cards, modals, input backgrounds, main content panels |
| **Background** | `#F8FAFB` | Page canvas behind cards |
| **On Surface** | `#1A2B33` | Headlines, body text, icons |
| **Muted** | `#6B7C85` | Captions, metadata, inactive nav, placeholder text |
| **Accent** | `#E8A838` | Hire CTA, pay milestone, accept proposal — use sparingly (one per screen) |
| **Success** | `#2D8A5E` | Approved stage, payment released, verified designer badge |
| **Warning** | `#D97706` | Pending review, due soon |
| **Error** | `#DC2626` | Rejected stage, form errors, report actions |
| **Border** | `#D4E8F0` | Card outlines, dividers, input strokes |

**Rules:**

- Use **Primary** for navigation and structural actions; **Accent** only for the single most important conversion on a screen.
- Never place light teal text on white — use Primary (`#10739e`) for readable teal text.
- Maintain **WCAG AA** contrast (4.5:1 normal text, 3:1 large text).
- Status colours always pair with text labels — never colour alone.

---

## Typography

**Playfair Display** — marketing headlines on landing and hero sections only.  
**Inter** — all UI, dashboards, forms, tables, and mobile screens.

| Level | Use |
|-------|-----|
| Display Large (48px Playfair) | Landing hero headline only |
| Headline Large (32px Inter Semi-Bold) | Page titles (Discovery, Project Workspace) |
| Headline Medium (24px) | Section headers, card titles |
| Headline Small (20px) | Subsection headers, modal titles |
| Body Large (18px) | Intro paragraphs on marketing pages |
| Body Medium (16px) | Default UI text, button labels, form labels |
| Body Small (14px) | Secondary descriptions, table cells |
| Label Medium/Small (12–11px, tracked) | Status badges, filter chips, overlines |
| Caption (12px) | Timestamps, helper text, metadata |

**Weight rule:** Maximum two weights per screen (typically 400 + 600). Never use Playfair below 24px equivalent.

---

## Layout

**Grid:** 12-column fluid grid, max content width **1280px**, centred with 32px side margins on desktop.

| Context | Layout |
|---------|--------|
| Discovery feed | 280px fixed filter sidebar (left) + fluid card grid (3-col desktop, 2-col tablet, 1-col mobile) |
| Dashboards | 2/3 main content + 1/3 sidebar (next-action card, recent activity) |
| Project workspace | Full-width stage stepper header; 2/3 deliverable area + 1/3 milestone/chat sidebar |
| Proposal comparison | Equal-width columns (2–3 proposals), horizontal scroll on tablet |
| Moodboard editor | Masonry image grid, min tile 200px |
| Admin tables | Full-width data table with sticky header |
| Mobile | Single column, 16px horizontal padding, bottom tab bar 56px height |

**Spacing scale:** 4px base — use 8, 16, 24, 32, 48px consistently. Card internal padding: 24px. Section gaps: 32px.

---

## Elevation & Depth

**Flat-to-subtle** — no heavy drop shadows. Hierarchy is conveyed through:

- White **surface** cards on **background** canvas
- 1px **border** (`#D4E8F0`) on cards and inputs
- Active stage stepper: filled Primary circle with white number
- Modals: white surface, border, subtle backdrop blur at 40% opacity
- Hover on portfolio cards: slight scale (1.02) + border darkens to Primary Light — no shadow

**Forbidden:** Glass morphism, neumorphism, gradient backgrounds on content areas, box-shadow stacks.

---

## Shapes

- **Cards, buttons, inputs:** 8px corner radius (`rounded.md`)
- **Large modals / image containers:** 12px (`rounded.lg`)
- **Status badges, filter chips, avatars:** Full pill (`rounded.full`)
- **Portfolio images:** 8px top radius when inside cards; full bleed allowed in detail carousel
- **Stage stepper nodes:** Circular (32px diameter)

---

## Components

### Global Navbar (authenticated)

- Left: Inside wordmark (Primary colour)
- Centre: Role-specific nav links (see Appendix C)
- Right: Role switcher pill (Client | Designer), notifications bell with unread dot, avatar dropdown (Settings, Logout)
- Height: 64px, white surface, bottom border

### Global Navbar (public)

- Links: Discover (preview), How it works, Login, Register (primary button)

### Portfolio Card (discovery)

- 16:10 room image (lazy-load placeholder skeleton)
- Room type chip (e.g. Living Room) — badge style
- Style tags row (max 3 visible)
- Budget band label (e.g. £15k–£30k)
- Designer avatar + name footer
- Heart icon top-right: Save to moodboard
- Hover: subtle border highlight

### Moodboard Tile

- Square or 4:3 image with drag handle overlay in edit mode
- Remove (×) button on hover
- Add tile: dashed border placeholder with + icon

### Fit Score Card

- Designer avatar, name, overall score (large number, Primary)
- Horizontal bar breakdown: Style match, Budget fit, Room experience (each 0–100%)
- CTA: View profile | Send direct request

### Proposal Comparison Card

- Designer header, total fee, timeline estimate
- Stage fee breakdown table (5 rows)
- Scope summary (truncated, expand)
- Footer: Accept (accent) | Reject (ghost) | Message

### Stage Stepper

- Horizontal on desktop, vertical on mobile
- Steps: Proposal → Concept → Design → Revision → Completion
- States: completed (checkmark, Primary fill), active (Primary ring + pulse), pending (muted border), rejected (error icon)

### Deliverable Version List

- Rows: v3 (current) highlighted, v2, v1
- Each row: filename, upload date, download icon, preview thumbnail

### Milestone Ledger Table

- Columns: Stage | Amount | Status | Action
- Status badges: Pending, Awaiting Approval, Approved, Paid, Released
- Pay button (accent) appears only when status = Approved

### Chat Panel

- Sent bubbles: Primary background, right-aligned
- Received bubbles: Background grey, left-aligned
- Timestamp caption below each group
- Input bar: text field + send icon, fixed bottom

### Star Rating (review)

- 5 clickable stars, filled Accent on select
- Comment textarea below, 500 char limit indicator

### Admin Data Table

- Sortable columns, row actions dropdown
- Verification queue: Approve (success) / Reject (error) inline buttons

### Mobile Bottom Tab Bar

- 5 icons with labels, active tab Primary colour
- Client tabs: Home, Projects, Messages, Notifications, Profile
- Designer tabs: Home, Requests, Projects, Messages, Profile

### Dashboard Next-Action Card

- Prominent card at top of dashboard
- Single CTA button (accent or primary)
- Examples: "Add 3 items to moodboard", "Compare 2 proposals", "Approve Concept stage"

### Empty / Loading / Error States

- Empty: Illustration placeholder + headline + CTA to relevant create flow
- Loading: Skeleton cards matching grid layout
- Error: Muted icon + retry button

---

## Do's and Don'ts

**Do:**

- Show current project stage prominently on every workspace screen
- Use one primary CTA per screen; secondary actions as ghost buttons
- Display fit score breakdown when recommending designers
- Keep approval and reject actions visible — never buried in menus
- Use real interior photography placeholders (living rooms, kitchens, bedrooms)
- Highlight the next recommended user action on dashboards

**Don't:**

- Use generic freelancer/gig marketplace layouts
- Apply gradients to buttons or page backgrounds
- Use more than one accent (gold) CTA per screen
- Hide milestone payment status — always show ledger access from project workspace
- Mix sharp (0px) and rounded corners on the same view
- Use Playfair Display in dashboards or forms
- Show mobile bottom nav on desktop layouts

---

## Appendix A — Screen Catalog

All screens for Stitch generation. **Priority:** P1 = generate first, P2 = second wave, P3 = optional.

### Shared / Auth (Web)

| ID | Screen | Route | deviceType | Role | Priority |
|----|--------|-------|------------|------|----------|
| W-01 | Landing / Marketing home | `/` | DESKTOP | Public | P1 |
| W-02 | Login | `/login` | DESKTOP | Public | P1 |
| W-03 | Register (Client / Designer) | `/register` | DESKTOP | Public | P1 |
| W-04 | Forgot password | `/forgot-password` | DESKTOP | Public | P2 |
| W-05 | Email verification | `/verify-email` | DESKTOP | Public | P2 |
| W-06 | Profile & account settings | `/settings` | DESKTOP | All | P2 |

### Client — Discovery & Brief (Web)

| ID | Screen | Route | deviceType | Role | Priority |
|----|--------|-------|------------|------|----------|
| W-C01 | Client dashboard | `/client` | DESKTOP | Client | P1 |
| W-C02 | Discovery feed | `/discover` | DESKTOP | Client | P1 |
| W-C03 | Filters drawer/sidebar | overlay on `/discover` | DESKTOP | Client | P1 |
| W-C04 | Portfolio / room project detail | `/discover/[id]` | DESKTOP | Client | P1 |
| W-C05 | Designer public profile | `/designers/[id]` | DESKTOP | Client | P1 |
| W-C06 | Moodboard list | `/moodboards` | DESKTOP | Client | P1 |
| W-C07 | Moodboard editor | `/moodboards/[id]` | DESKTOP | Client | P1 |
| W-C08 | Brief builder (multi-step) | `/briefs/new` | DESKTOP | Client | P1 |
| W-C09 | Brief preview / edit | `/briefs/[id]` | DESKTOP | Client | P1 |
| W-C10 | Designer fit scores & breakdown | `/match?briefId=` | DESKTOP | Client | P1 |

### Client — Hiring (Web)

| ID | Screen | Route | deviceType | Role | Priority |
|----|--------|-------|------------|------|----------|
| W-C11 | Create open request | `/requests/new` | DESKTOP | Client | P1 |
| W-C12 | Send direct request | `/requests/direct/[designerId]` | DESKTOP | Client | P1 |
| W-C13 | My requests list | `/requests` | DESKTOP | Client | P1 |
| W-C14 | Request detail | `/requests/[id]` | DESKTOP | Client | P1 |
| W-C15 | Proposal comparison (side-by-side) | `/requests/[id]/proposals` | DESKTOP | Client | P1 |
| W-C16 | Single proposal detail | `/proposals/[id]` | DESKTOP | Client | P2 |
| W-C17 | Accept proposal confirmation | modal on W-C15 | DESKTOP | Client | P1 |
| W-C18 | Saved / favourite designers | `/favourites` | DESKTOP | Client | P2 |

### Client — Project Workspace (Web)

| ID | Screen | Route | deviceType | Role | Priority |
|----|--------|-------|------------|------|----------|
| W-C19 | Active projects list | `/projects` | DESKTOP | Client | P1 |
| W-C20 | Project workspace (stage stepper shell) | `/projects/[id]` | DESKTOP | Client | P1 |
| W-C21 | Stage detail + deliverables | `/projects/[id]/stages/[stage]` | DESKTOP | Client | P1 |
| W-C22 | Deliverable viewer (version history) | `/projects/[id]/deliverables/[id]` | DESKTOP | Client | P1 |
| W-C23 | Approve / reject stage modal | modal on W-C21 | DESKTOP | Client | P1 |
| W-C24 | Milestone payment ledger | `/projects/[id]/payments` | DESKTOP | Client | P1 |
| W-C25 | Stripe checkout / pay milestone | `/projects/[id]/pay` | DESKTOP | Client | P1 |
| W-C26 | Project messaging | `/projects/[id]/messages` | DESKTOP | Client | P1 |
| W-C27 | Post-completion review | `/projects/[id]/review` | DESKTOP | Client | P1 |

### Designer (Web)

| ID | Screen | Route | deviceType | Role | Priority |
|----|--------|-------|------------|------|----------|
| W-D01 | Designer dashboard | `/designer` | DESKTOP | Designer | P1 |
| W-D02 | Portfolio list | `/designer/portfolio` | DESKTOP | Designer | P1 |
| W-D03 | Create / edit portfolio project | `/designer/portfolio/new` | DESKTOP | Designer | P1 |
| W-D04 | Availability toggle | `/designer/settings` | DESKTOP | Designer | P2 |
| W-D05 | Incoming requests inbox | `/designer/requests` | DESKTOP | Designer | P1 |
| W-D06 | Request detail (designer view) | `/designer/requests/[id]` | DESKTOP | Designer | P1 |
| W-D07 | Submit proposal form | `/designer/requests/[id]/propose` | DESKTOP | Designer | P1 |
| W-D08 | Active projects list | `/designer/projects` | DESKTOP | Designer | P1 |
| W-D09 | Designer stage workspace (upload) | `/designer/projects/[id]` | DESKTOP | Designer | P1 |
| W-D10 | Earnings & released milestones | `/designer/earnings` | DESKTOP | Designer | P2 |

### Admin (Web)

| ID | Screen | Route | deviceType | Role | Priority |
|----|--------|-------|------------|------|----------|
| W-A01 | Admin dashboard | `/admin` | DESKTOP | Admin | P2 |
| W-A02 | User management table | `/admin/users` | DESKTOP | Admin | P2 |
| W-A03 | Designer verification queue | `/admin/verification` | DESKTOP | Admin | P2 |
| W-A04 | Reports & complaints | `/admin/reports` | DESKTOP | Admin | P2 |
| W-A05 | Review moderation | `/admin/reviews` | DESKTOP | Admin | P3 |
| W-A06 | Platform analytics | `/admin/analytics` | DESKTOP | Admin | P3 |

### Shared Overlays (Web)

| ID | Screen | Context | deviceType | Role | Priority |
|----|--------|---------|------------|------|----------|
| W-S01 | Notifications panel | dropdown / `/notifications` | DESKTOP | All | P1 |
| W-S02 | Role switcher modal | global | DESKTOP | All | P1 |
| W-S03 | Empty / error / loading states | reusable | DESKTOP | All | P2 |

### Mobile Companion

| ID | Screen | Route | deviceType | Role | Priority |
|----|--------|-------|------------|------|----------|
| M-01 | Login + role switch | `/login` | MOBILE | All | P1 |
| M-02 | Notifications home | `/notifications` | MOBILE | All | P1 |
| M-03 | Messages list | `/messages` | MOBILE | All | P1 |
| M-04 | Chat thread | `/messages/[id]` | MOBILE | All | P1 |
| M-05 | My projects (client) | `/projects` | MOBILE | Client | P1 |
| M-06 | Project detail + current stage | `/projects/[id]` | MOBILE | Client | P1 |
| M-07 | Deliverable preview + approve/reject | `/projects/[id]/stage` | MOBILE | Client | P1 |
| M-08 | Pay milestone (Stripe) | `/projects/[id]/pay` | MOBILE | Client | P1 |
| M-09 | Designer requests inbox (summary) | `/designer/requests` | MOBILE | Designer | P2 |
| M-10 | Designer earnings summary | `/designer/earnings` | MOBILE | Designer | P2 |

**Total: 52 screens**

---

## Appendix B — Stitch Generation Prompts

Use each prompt with Google Stitch **Generate from text**. Set `deviceType` to DESKTOP for W-* screens and MOBILE for M-* screens. Paste the DESIGN SYSTEM block verbatim; customise PAGE STRUCTURE per screen.

### Prompt template (reference)

```
[Atmosphere sentence]

DESIGN SYSTEM (REQUIRED):
- Platform: [Web Desktop-first | Mobile companion], [Desktop|Mobile]-first
- Palette: Deep Teal Navy (#10739e) primary, Sky Mist (#B1DDF0) accents, Warm Hire Gold (#E8A838) CTA
- Typography: Inter body, Playfair Display hero only
- Styles: 8px rounded cards, 1px #D4E8F0 borders, flat depth, no heavy shadows

PAGE STRUCTURE:
[Numbered sections]

KEY ELEMENTS:
[Bulleted UI elements]

INTERACTIONS:
[Primary actions and navigation]
```

---

### W-01 — Landing / Marketing Home (P1)

```
Aspirational interior design marketplace landing — curated, warm, magazine-quality photography, trustworthy professional tone.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first, Desktop-first
- Palette: Deep Teal Navy (#10739e) primary, Sky Mist (#B1DDF0) accents, Warm Hire Gold (#E8A838) CTA
- Typography: Inter body, Playfair Display hero only
- Styles: 8px rounded cards, 1px #D4E8F0 borders, flat depth, no heavy shadows

PAGE STRUCTURE:
1. Header: Inside logo left; nav links (Discover, How it works); Login text link; Register primary button right
2. Hero: Full-width interior room photo overlay; Playfair headline "Design your space, inside and out"; subtext; two CTAs — "Browse designers" (primary), "I'm a designer" (secondary)
3. Feature strip: 4 icon cards — Portfolio Discovery, Moodboards, Staged Projects, Milestone Payments
4. Social proof: 3 portfolio preview cards in a row
5. Footer: Links, copyright, social icons on Primary Dark background

KEY ELEMENTS:
- Hero uses real living-room photography placeholder
- Feature cards white on background canvas
- No gradient buttons

INTERACTIONS:
- Browse designers → Discover feed
- Register → registration screen
- I'm a designer → register with designer role pre-selected
```

---

### W-02 — Login (P1)

```
Clean, minimal authentication — trustworthy fintech-grade simplicity with Inside teal accents.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first, Desktop-first
- Palette: Deep Teal Navy (#10739e) primary, Sky Mist (#B1DDF0) accents, Warm Hire Gold (#E8A838) CTA
- Typography: Inter body, Playfair Display hero only
- Styles: 8px rounded cards, 1px borders, flat depth

PAGE STRUCTURE:
1. Header: Inside logo centred or left; link back to home
2. Centre card (max 400px): "Welcome back" headline; email input; password input; "Forgot password?" link; Login primary button full width
3. Below card: "Don't have an account? Register" link

KEY ELEMENTS:
- Card on #F8FAFB background
- Input fields 44px height with border stroke
- Password show/hide toggle icon

INTERACTIONS:
- Login → role-appropriate dashboard
- Forgot password → W-04
- Register → W-03
```

---

### W-03 — Register (P1)

```
Registration with role selection — client vs designer chosen upfront, friendly onboarding tone.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first, Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter body only on this screen
- Styles: 8px rounded cards, flat borders

PAGE STRUCTURE:
1. Header: Inside logo, link to Login
2. Centre card: "Create your account" headline
3. Role selector: Two large toggle cards side by side — "I'm a client" (home icon) | "I'm a designer" (palette icon); selected state Primary border
4. Form: Full name, email, password, confirm password
5. Terms checkbox; Create account primary button
6. Link to Login

KEY ELEMENTS:
- Role cards show short description under each option
- Password strength indicator bar
- Designer card mentions portfolio setup next step

INTERACTIONS:
- Create account → email verification or dashboard
- Role selection highlights active card with Primary border
```

---

### W-C01 — Client Dashboard (P1)

```
Client home base — clear next-action guidance, overview of moodboards, requests, and active projects.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first, Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter throughout
- Styles: 8px cards, dashboard layout

PAGE STRUCTURE:
1. Navbar: Client nav (Discover, Moodboards, Requests, Projects), role switcher, notifications, avatar
2. Next-action hero card (accent border): Dynamic CTA e.g. "Compare 2 proposals" with gold button
3. Main grid: Recent moodboards (3 cards) | Open requests (list) | Active projects (list with stage badge)
4. Right sidebar: Quick links — Browse designers, Create moodboard

KEY ELEMENTS:
- Stage badges on project rows (Concept, Design, etc.)
- Unread notification dot on bell
- Empty states with create CTAs if no data

INTERACTIONS:
- Next-action CTA routes to most urgent task
- Project row click → W-C20
- Moodboard card → W-C07
```

---

### W-C02 — Discovery Feed (P1)

```
Portfolio discovery feed — image-forward browsing like a design magazine, filterable grid of completed room projects.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first, Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter body, Playfair optional in page title only
- Styles: 8px cards, masonry-style grid

PAGE STRUCTURE:
1. Navbar: Client authenticated nav
2. Page header: "Discover" headline; search bar full width with debounced placeholder
3. Left sidebar (280px): Filters — Style multi-select chips, Room type checkboxes, Budget range dual slider (£5k–£100k), Apply / Clear buttons
4. Main grid: Portfolio cards (3 columns) — room image, room type badge, style tags, budget band, designer avatar+name, heart save icon
5. Pagination or infinite scroll loader at bottom

KEY ELEMENTS:
- Active filter chips shown above grid with × remove
- Heart icon toggles saved state (filled Primary)
- Skeleton loaders for image cards

INTERACTIONS:
- Card click → W-C04
- Designer name → W-C05
- Heart → add to moodboard toast
- Filter apply → grid updates
```

---

### W-C03 — Filters Drawer (P1)

```
Filter sidebar panel — same filters as W-C02, can be shown as slide-over on tablet/mobile breakpoints.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Styles: 8px rounded, chip filters

PAGE STRUCTURE:
1. Panel header: "Filters" + close × for mobile drawer
2. Style section: Chip grid (Modern, Scandinavian, Industrial, Bohemian, Minimal, Traditional)
3. Room type: Checkboxes (Living, Bedroom, Kitchen, Bathroom, Office, Full home)
4. Budget slider: Dual-handle range with live value labels
5. Footer: Clear all (ghost) | Apply filters (primary) buttons

KEY ELEMENTS:
- Selected chips filled Primary Light with Primary text
- Budget labels update as slider moves

INTERACTIONS:
- Apply → closes drawer, updates discovery grid
- Clear → resets all filters
```

---

### W-C04 — Portfolio / Room Project Detail (P1)

```
Single room case study detail — large image carousel, project metadata, designer CTA.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px rounded image gallery

PAGE STRUCTURE:
1. Navbar: Client nav
2. Breadcrumb: Discover > Modern Living Room
3. Left (60%): Image carousel with thumbnails below; 4–6 room photos
4. Right (40%): Room type badge; style tags; budget band; project description; designer card (avatar, name, rating, verified badge); CTAs — "Contact designer" (primary), "Save to moodboard" (secondary), "View designer profile" (ghost)
5. Related projects row at bottom (3 cards)

KEY ELEMENTS:
- Verified designer checkmark in success green
- Star rating display (4.8)
- Carousel prev/next arrows

INTERACTIONS:
- Contact designer → W-C12 direct request
- Save to moodboard → moodboard picker modal
- View profile → W-C05
```

---

### W-C05 — Designer Public Profile (P1)

```
Designer portfolio profile — trust signals, portfolio grid, hire actions.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px cards

PAGE STRUCTURE:
1. Navbar: Client nav
2. Profile header: Large avatar, name, verified badge, location, availability pill (Available/Busy), star rating + review count, bio paragraph
3. Stats row: Projects completed | Avg budget | Response time
4. Portfolio grid: 3-col case study cards from this designer
5. Reviews section: 3 recent reviews with stars and comment
6. Sticky footer CTA bar: "Send project request" (accent) | "Message" (secondary)

KEY ELEMENTS:
- Availability pill: green for Available, muted for Busy
- Portfolio cards match discovery card style

INTERACTIONS:
- Send project request → W-C12
- Message → W-C26 or chat modal
- Portfolio card → W-C04
```

---

### W-C06 — Moodboard List (P1)

```
Client moodboard collection — grid of moodboard cards with item counts.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px cards

PAGE STRUCTURE:
1. Navbar: Client nav
2. Header: "My moodboards" + "Create moodboard" primary button
3. Grid: Moodboard cards — cover collage (2x2 thumbnails), moodboard name, item count, last updated date; overflow menu (Edit, Delete)
4. Empty state if none: illustration + "Start your first moodboard" CTA

KEY ELEMENTS:
- Cover shows up to 4 saved inspiration images
- Create button top-right

INTERACTIONS:
- Card click → W-C07
- Create → new moodboard editor
- Generate brief action on card footer if 3+ items
```

---

### W-C07 — Moodboard Editor (P1)

```
Visual moodboard builder — drag-and-drop image grid for collecting design inspiration.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px tiles, masonry grid

PAGE STRUCTURE:
1. Navbar: Client nav
2. Toolbar: Editable moodboard title; "Add images" button; "Generate brief" accent button (enabled when 3+ items); Save status indicator
3. Main canvas: Masonry grid of image tiles (min 200px); drag handles; × remove on hover; dashed "+" add tile
4. Right sidebar (collapsible): Stock image search (Unsplash-style); upload drop zone; saved discovery items

KEY ELEMENTS:
- Drag-and-drop reorder feedback
- Generate brief disabled state with tooltip "Add at least 3 items"
- Image count badge in toolbar

INTERACTIONS:
- Generate brief → W-C08
- Add from discovery imports saved portfolio images
- Drag to reorder tiles
```

---

### W-C08 — Brief Builder Multi-Step (P1)

```
Multi-step brief creation wizard — structured project requirements from moodboard.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px cards, step indicator

PAGE STRUCTURE:
1. Navbar: Client nav
2. Step indicator: 4 steps — Styles | Rooms | Budget | Details
3. Step 1 Styles: Auto-detected style percentages from moodboard shown as horizontal bars (Modern 45%, Scandinavian 30%); editable checkboxes
4. Step 2 Rooms: Multi-select room cards with icons
5. Step 3 Budget: Range slider + optional notes
6. Step 4 Details: Project description textarea, timeline preference, location
7. Footer nav: Back (ghost) | Continue (primary) | Generate brief (accent on final step)

KEY ELEMENTS:
- Moodboard thumbnail strip at top for context
- Progress bar below step indicator
- Style bars use Primary fill

INTERACTIONS:
- Continue advances steps
- Final step → W-C09 brief preview
```

---

### W-C09 — Brief Preview / Edit (P1)

```
Read-only brief summary with edit mode — structured brief before matching designers.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px summary card

PAGE STRUCTURE:
1. Navbar: Client nav
2. Header: "Your project brief" + Edit (ghost) | Find designers (accent) buttons
3. Summary card sections: Style breakdown (bar chart), Rooms list, Budget range, Description, Attached moodboard link
4. Metadata: Created date, brief ID

KEY ELEMENTS:
- Style breakdown matches W-C08 bars
- Edit toggles inline editable fields
- Find designers is primary conversion CTA

INTERACTIONS:
- Find designers → W-C10
- Edit → inline edit mode
- Moodboard link → W-C07
```

---

### W-C10 — Designer Fit Scores (P1)

```
Ranked designer recommendations with compatibility breakdown — core differentiator screen.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px cards, score bars

PAGE STRUCTURE:
1. Navbar: Client nav
2. Header: "Designers matched to your brief" + brief summary chip
3. Sort dropdown: Best match | Budget | Rating
4. List of fit score cards (vertical): Designer avatar, name, overall score (large, Primary), three breakdown bars (Style match %, Budget fit %, Room experience %), portfolio thumbnails row, CTAs — View profile | Send direct request
5. Bottom: "Or post open request" secondary link → W-C11

KEY ELEMENTS:
- Overall score 0–100 displayed prominently
- Breakdown bars labelled with percentages
- Verified badge on qualified designers

INTERACTIONS:
- View profile → W-C05
- Send direct request → W-C12
- Post open request → W-C11
```

---

### W-C11 — Create Open Request (P1)

```
Post public project request — visible to multiple designers who can submit proposals.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px form card

PAGE STRUCTURE:
1. Navbar: Client nav
2. Header: "Post a project request"
3. Form card: Attach brief (dropdown, pre-selected); Attach moodboard (dropdown); Project title; Space description textarea; Budget range; Timeline preference; Location; Additional notes
4. Preview sidebar: Brief + moodboard thumbnails
5. Footer: Cancel (ghost) | Post request (accent)

KEY ELEMENTS:
- Brief and moodboard required fields marked with asterisk
- Character count on textarea
- Info callout: "Designers will submit proposals you can compare"

INTERACTIONS:
- Post request → W-C13 with success toast
- Cancel → back to W-C10
```

---

### W-C12 — Send Direct Request (P1)

```
Direct hire request to one designer — pre-filled designer context.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px form

PAGE STRUCTURE:
1. Navbar: Client nav
2. Designer context card at top: Avatar, name, "You're contacting this designer directly"
3. Form: Same fields as W-C11 (brief, moodboard, description, budget, timeline)
4. Footer: Send request (accent) | Cancel

KEY ELEMENTS:
- Designer card pinned at top
- Pre-linked from W-C05 or W-C10

INTERACTIONS:
- Send → W-C14 request detail
- Designer receives in W-D05 inbox
```

---

### W-C13 — My Requests List (P1)

```
Client project requests list — open and closed tabs with status badges.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px list cards

PAGE STRUCTURE:
1. Navbar: Client nav
2. Header: "My requests" + "New request" primary button
3. Tabs: Open | Closed
4. Request cards: Title, status badge (Open, Proposals received, Accepted, Closed), proposal count, posted date, budget range; click to expand
5. Empty state for Open tab

KEY ELEMENTS:
- Status badges colour-coded (Primary Light fill)
- Proposal count pill e.g. "3 proposals"

INTERACTIONS:
- Card click → W-C14
- Proposals received → W-C15
- New request → W-C11
```

---

### W-C14 — Request Detail (P1)

```
Single request detail — attached brief, proposal list entry point.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px cards

PAGE STRUCTURE:
1. Navbar: Client nav
2. Breadcrumb: Requests > [Request title]
3. Left: Request details (title, description, budget, timeline, status badge, posted date)
4. Right: Attached brief summary card; Moodboard thumbnail link
5. Proposals section: "2 proposals received" header + "Compare proposals" accent button + proposal preview cards (designer, fee, timeline)

KEY ELEMENTS:
- Status timeline stepper (Posted → Proposals → Accepted)
- Compare button prominent when 2+ proposals

INTERACTIONS:
- Compare proposals → W-C15
- Brief card → W-C09
- Close request action in overflow menu
```

---

### W-C15 — Proposal Comparison (P1)

```
Side-by-side proposal comparison — core hiring decision screen.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px equal columns

PAGE STRUCTURE:
1. Navbar: Client nav
2. Header: "Compare proposals" + request title subtitle
3. Two or three equal columns (horizontal scroll if needed): Each column = designer header (avatar, name, rating), total fee (large), timeline estimate, stage fee table (5 stages with amounts), scope summary (expandable), Accept (accent) | Message (ghost) buttons
4. Comparison highlights: Best value badge, fastest timeline badge

KEY ELEMENTS:
- Stage fee breakdown table identical structure per column for easy scan
- Accept button per column — only one can be selected
- Selected column gets Primary border

INTERACTIONS:
- Accept → W-C17 confirmation modal
- Message → W-C26
- Expand scope shows full text
```

---

### W-C17 — Accept Proposal Confirmation (P1)

```
Modal confirming proposal acceptance — creates project, explains next steps.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px modal

PAGE STRUCTURE:
1. Modal overlay on W-C15
2. Modal content: Checkmark icon; "Accept [Designer name]'s proposal?"; Summary — total fee, timeline, first stage (Concept)
3. Info text: "A project workspace will be created. Other proposals will be declined."
4. Buttons: Cancel (ghost) | Confirm & create project (accent)

KEY ELEMENTS:
- Designer avatar in modal header
- Fee and timeline repeated for confirmation

INTERACTIONS:
- Confirm → W-C20 project workspace + success toast
- Cancel → closes modal
```

---

### W-C19 — Active Projects List (P1)

```
Client active projects — stage status at a glance.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px list cards

PAGE STRUCTURE:
1. Navbar: Client nav
2. Header: "My projects"
3. Tabs: Active | Completed
4. Project cards: Project title, designer avatar+name, current stage badge, progress bar (5 stages), next action label e.g. "Approve Concept", last activity date
5. Empty state for new clients

KEY ELEMENTS:
- Stage badge colour by status (active=Primary, pending approval=warning, complete=success)
- Mini stage stepper on each card

INTERACTIONS:
- Card click → W-C20
- Next action label hints urgent task
```

---

### W-C20 — Project Workspace (P1)

```
Main project collaboration shell — stage stepper, deliverables area, sidebar for payments and chat.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px cards, horizontal stage stepper

PAGE STRUCTURE:
1. Navbar: Client nav
2. Project header: Project title, designer/client avatars, status badge
3. Horizontal stage stepper: Proposal ✓ | Concept (active) | Design | Revision | Completion
4. Tab bar: Deliverables | Messages | Payments | Activity
5. Main area (2/3): Current stage content — stage name, due date, deliverable list, approval status
6. Right sidebar (1/3): Milestone summary card; Quick chat preview; "Open full chat" link

KEY ELEMENTS:
- Active stage highlighted in stepper with Primary fill
- Approve/Reject buttons visible when deliverables pending (not hidden in menu)
- Unread message indicator on Messages tab

INTERACTIONS:
- Stage step click → W-C21
- Payments tab → W-C24
- Messages tab → W-C26
- Approve → W-C23 modal
```

---

### W-C21 — Stage Detail + Deliverables (P1)

```
Current stage deliverables list — client review focus.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px deliverable rows

PAGE STRUCTURE:
1. Embedded in W-C20 or standalone with same header/stepper
2. Stage info: "Concept stage" headline, due date, status badge (In review)
3. Deliverable rows: Thumbnail, filename, version (v2), uploaded date, Preview | Download buttons
4. Client action bar (sticky): Approve stage (accent) | Request revision (secondary) | Reject (ghost, destructive text)
5. Feedback textarea for revision requests

KEY ELEMENTS:
- Version badge on latest deliverable
- Approve disabled until at least one deliverable viewed
- Revision links to feedback field

INTERACTIONS:
- Preview → W-C22
- Approve → W-C23
- Request revision → sends feedback to designer
```

---

### W-C22 — Deliverable Viewer (P1)

```
Full deliverable preview with version history — image/PDF viewer.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px viewer frame

PAGE STRUCTURE:
1. Breadcrumb: Project > Concept > concept-board-v2.pdf
2. Left (70%): Large preview area — image or PDF viewer with zoom controls
3. Right (30%): Version history list (v3 current highlighted, v2, v1); file metadata; download button; designer upload notes
4. Top bar: Prev/Next version arrows; fullscreen toggle

KEY ELEMENTS:
- Current version row highlighted Primary Light
- Zoom in/out icons on preview

INTERACTIONS:
- Version click swaps preview
- Download triggers file save
- Back → W-C21
```

---

### W-C23 — Approve / Reject Stage Modal (P1)

```
Stage approval decision modal — gates milestone payment.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Warm Hire Gold (#E8A838), Success (#2D8A5E)
- Typography: Inter
- Styles: 8px modal

PAGE STRUCTURE:
1. Modal overlay
2. Approve state: Green check icon; "Approve Concept stage?"; Milestone amount display e.g. £2,400; "Payment will be requested after approval"
3. Optional comment textarea
4. Reject state (tab or toggle): Reason required textarea
5. Buttons: Cancel | Confirm approval (accent) or Confirm rejection (error outline)

KEY ELEMENTS:
- Milestone amount prominently displayed on approve
- Reject requires minimum 20 characters

INTERACTIONS:
- Confirm approval → status Approved, routes to W-C25 pay flow
- Confirm rejection → designer notified, stage returns to In progress
```

---

### W-C24 — Milestone Payment Ledger (P1)

```
Project payment ledger — all stages, amounts, statuses, pay actions.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px table rows

PAGE STRUCTURE:
1. Navbar + project context breadcrumb
2. Header: "Payment ledger" + project title
3. Summary cards: Total project value | Paid to date | Remaining
4. Table: Columns — Stage | Amount | Status | Date | Action
5. Rows for 5 stages with status badges: Pending, Awaiting Approval, Approved (Pay now accent button), Paid, Released
6. Stripe trust badge footer

KEY ELEMENTS:
- Pay now button only on Approved rows
- Released rows show success checkmark
- Amount right-aligned in table

INTERACTIONS:
- Pay now → W-C25 Stripe checkout
- Row expand shows payment receipt ID
```

---

### W-C25 — Stripe Checkout / Pay Milestone (P1)

```
Milestone payment screen — Stripe checkout embed or redirect summary.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px payment card

PAGE STRUCTURE:
1. Simplified header: Inside logo, secure lock icon
2. Left: Order summary — Project name, stage name (Concept), amount, platform fee line, total
3. Right: Payment form placeholder — card number, expiry, CVC (Stripe Elements style); Pay £X,XXX (accent) button
4. Trust text: "Payments secured by Stripe. Funds held until stage completion."

KEY ELEMENTS:
- Amount large and clear
- SSL/secure badges
- Back link to ledger

INTERACTIONS:
- Pay → success state → ledger updates to Paid
- Cancel → W-C24
```

---

### W-C26 — Project Messaging (P1)

```
Project-scoped chat — client-designer communication.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: chat bubbles per component tokens

PAGE STRUCTURE:
1. Project workspace header with back link
2. Chat area (full height): Message groups by date; sent bubbles right Primary; received bubbles left grey; timestamps
3. Typing indicator placeholder
4. Input bar fixed bottom: Attachment icon, text input, send button
5. Optional left sidebar: Project info mini card

KEY ELEMENTS:
- Read receipts (double check)
- Date separators between message groups
- Attachment chip on file messages

INTERACTIONS:
- Send message → appears in thread
- Attachment → file upload chip
```

---

### W-C27 — Post-Completion Review (P1)

```
Post-project designer review — stars and written feedback.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Warm Hire Gold (#E8A838) for stars
- Typography: Inter
- Styles: 8px review card

PAGE STRUCTURE:
1. Navbar: Client nav
2. Celebration header: "Project complete!" with confetti-subtle illustration
3. Designer card: Avatar, name, project title
4. Star rating: 5 large clickable stars
5. Review textarea: "Share your experience" placeholder, 500 char limit
6. Optional tags: Communication, Quality, Timeliness (chip multi-select)
7. Submit review (accent) button

KEY ELEMENTS:
- Stars fill Accent on hover/select
- Submit disabled until rating selected

INTERACTIONS:
- Submit → thank you state, redirects to W-C19
```

---

### W-D01 — Designer Dashboard (P1)

```
Designer home — incoming requests, active projects, earnings snapshot.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px dashboard cards

PAGE STRUCTURE:
1. Navbar: Designer nav (Portfolio, Requests, Projects, Earnings)
2. Next-action card: e.g. "Respond to 2 new requests" with accent CTA
3. Stats row: New requests | Active projects | Earnings this month
4. Main: Incoming requests list (3 items) | Active projects with upload-needed badges
5. Sidebar: Availability toggle (Available/Busy); Profile completion progress bar

KEY ELEMENTS:
- Availability toggle prominent
- Upload-needed badge on projects awaiting deliverable

INTERACTIONS:
- Request row → W-D06
- Project row → W-D09
- Availability toggle → W-D04 settings
```

---

### W-D02 — Portfolio List (P1)

```
Designer portfolio management — list of published room case studies.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px grid cards

PAGE STRUCTURE:
1. Navbar: Designer nav
2. Header: "My portfolio" + "Add project" primary button
3. Grid: Portfolio project cards — cover image, title, room type, style tags, status (Published/Draft), edit/delete icons
4. Empty state: "Showcase your first room project"

KEY ELEMENTS:
- Draft badge in warning colour
- Add project button accent on empty state

INTERACTIONS:
- Add project → W-D03
- Edit card → W-D03 with prefill
- Card preview → public view
```

---

### W-D03 — Create / Edit Portfolio Project (P1)

```
Portfolio case study editor — multi-image upload with metadata.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px form sections

PAGE STRUCTURE:
1. Navbar: Designer nav
2. Form sections: Project title; Room type dropdown; Style tags multi-select; Budget band selector; Description rich textarea
3. Image upload zone: Drag-drop grid, reorder thumbnails, cover image badge on first
4. Preview panel: Live portfolio card preview
5. Footer: Save draft (ghost) | Publish (primary)

KEY ELEMENTS:
- Image upload shows progress bars
- Cover image star icon on first upload
- Min 3 images required to publish (validation message)

INTERACTIONS:
- Publish → W-D02 list with success toast
- Save draft → stays editable
```

---

### W-D05 — Incoming Requests Inbox (P1)

```
Designer request inbox — open public requests and direct client requests.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px inbox rows

PAGE STRUCTURE:
1. Navbar: Designer nav
2. Header: "Project requests"
3. Tabs: Open requests (public) | Direct requests | Submitted
4. Request rows: Client avatar (anonymised for open), request title, budget, room types, brief summary snippet, posted date, "Submit proposal" primary button
5. Direct requests show "Direct" badge

KEY ELEMENTS:
- New requests have unread dot
- Budget and room chips inline
- Fit score badge if algorithm matched

INTERACTIONS:
- Row click → W-D06
- Submit proposal → W-D07
```

---

### W-D06 — Request Detail Designer View (P1)

```
Designer view of client request — full brief before proposing.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px detail layout

PAGE STRUCTURE:
1. Navbar: Designer nav
2. Request header: Title, budget, timeline, Direct/Open badge
3. Left: Full brief (styles, rooms, description); Moodboard image grid
4. Right: Client info (name, location); Submit proposal (accent) sticky button; Decline (ghost)
5. Similar requests excluded — focus on this one

KEY ELEMENTS:
- Moodboard thumbnails clickable to enlarge
- Submit proposal fixed in right column on scroll

INTERACTIONS:
- Submit proposal → W-D07
- Decline → removes from inbox with confirm
```

---

### W-D07 — Submit Proposal Form (P1)

```
Designer proposal submission — scope, timeline, stage fee breakdown.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: 8px form

PAGE STRUCTURE:
1. Navbar: Designer nav
2. Header: "Submit proposal for [Request title]"
3. Form: Scope description textarea; Timeline estimate (weeks); Stage fee table — 5 rows (Proposal, Concept, Design, Revision, Completion) with amount inputs; Total auto-calculated
4. Cover letter textarea
5. Footer: Save draft | Submit proposal (accent)

KEY ELEMENTS:
- Total fee updates live as stage amounts change
- Stage fee table matches client comparison columns in W-C15
- Validation: all 5 stages must have amounts summing to total

INTERACTIONS:
- Submit → success, appears in client W-C15
- Save draft → W-D05 Submitted tab
```

---

### W-D08 — Designer Active Projects (P1)

```
Designer project list — upload status and client approval waiting.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px list cards

PAGE STRUCTURE:
1. Navbar: Designer nav
2. Header: "My projects"
3. Tabs: Active | Completed
4. Project cards: Client name, project title, current stage, status (Awaiting upload | In review | Approved), due date, Upload CTA button
5. Sort by due date default

KEY ELEMENTS:
- Awaiting upload cards have warning accent on Upload button
- In review shows clock icon

INTERACTIONS:
- Card → W-D09
- Upload → W-D09 focused on deliverable upload
```

---

### W-D09 — Designer Stage Workspace Upload (P1)

```
Designer deliverable upload workspace — mirror of client W-C20 from designer side.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px upload zone

PAGE STRUCTURE:
1. Navbar: Designer nav
2. Project header + stage stepper (same as W-C20)
3. Current stage panel: Stage name, client due date, status
4. Upload zone: Drag-drop files, supported formats note (PDF, PNG, JPG), upload progress
5. Uploaded deliverables list with version numbers
6. Client feedback panel if revision requested — shows rejection reason highlighted
7. Submit for review (primary) button

KEY ELEMENTS:
- Version auto-increments (v1, v2, v3)
- Client feedback in warning-bordered card
- Submit disabled until file uploaded

INTERACTIONS:
- Upload file → appears in list
- Submit for review → notifies client, status In review
- Messages link → W-C26
```

---

### W-S01 — Notifications Panel (P1)

```
Notifications dropdown and full page — alerts for proposals, messages, approvals.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px notification rows

PAGE STRUCTURE:
1. Dropdown (from bell): Last 5 notifications with icon, text, time ago, unread dot; "View all" link
2. Full page `/notifications`: Grouped by Today / Earlier; rows with type icon (proposal, message, payment, stage), title, description, timestamp, mark read
3. Empty state: "You're all caught up"

KEY ELEMENTS:
- Unread rows have Primary Light background
- Type-specific icons
- Click row navigates to relevant screen

INTERACTIONS:
- Notification click → deep link to W-C14, W-C20, W-C26, etc.
- Mark all read action in header
```

---

### W-S02 — Role Switcher Modal (P1)

```
Dual-role account switcher — toggle between Client and Designer mode.

DESIGN SYSTEM (REQUIRED):
- Platform: Web Desktop-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px modal

PAGE STRUCTURE:
1. Trigger: Pill in navbar showing current role e.g. "Client ▾"
2. Modal/dropdown: Two options — Client (home icon, "Browse & hire designers") | Designer (palette icon, "Manage portfolio & projects"); checkmark on active
3. Switch button confirms selection

KEY ELEMENTS:
- Current role highlighted Primary Light
- Brief description under each role
- Smooth transition note

INTERACTIONS:
- Switch → reloads dashboard (W-C01 or W-D01)
- Same account, different nav items
```

---

### M-01 — Mobile Login + Role Switch (P1)

```
Mobile authentication with role toggle — compact single-column layout.

DESIGN SYSTEM (REQUIRED):
- Platform: Mobile companion, Mobile-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter only
- Styles: 8px rounded, 16px screen padding

PAGE STRUCTURE:
1. Top: Inside logo centred
2. Role toggle: Client | Designer segmented control
3. Form: Email, password inputs full width
4. Login primary button full width
5. Links: Forgot password, Register
6. Bottom safe area padding

KEY ELEMENTS:
- Segmented control uses Primary fill on active segment
- Inputs 48px height for touch
- No Playfair on mobile

INTERACTIONS:
- Login → M-02 or role dashboard equivalent
```

---

### M-02 — Mobile Notifications Home (P1)

```
Mobile notifications feed — primary mobile entry point.

DESIGN SYSTEM (REQUIRED):
- Platform: Mobile companion, Mobile-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: full-width list rows

PAGE STRUCTURE:
1. Header: "Notifications" + mark all read
2. Notification list: Full-width rows with icon, title, body, time, unread indicator
3. Bottom tab bar: Home (active), Projects, Messages, Notifications, Profile
4. Pull-to-refresh indicator at top

KEY ELEMENTS:
- Unread dot on rows and tab icon
- Swipe actions optional (archive)
- Grouped by date headers

INTERACTIONS:
- Tap notification → M-06 or M-04 deep link
- Tab bar navigation
```

---

### M-03 — Mobile Messages List (P1)

```
Mobile conversation list — project chats summary.

DESIGN SYSTEM (REQUIRED):
- Platform: Mobile companion, Mobile-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: avatar + row layout

PAGE STRUCTURE:
1. Header: "Messages"
2. Search bar optional
3. Conversation rows: Avatar, designer/client name, project name subtitle, last message preview, timestamp, unread badge
4. Bottom tab bar

KEY ELEMENTS:
- Unread count badge on avatar
- Project name in muted caption
- Online indicator dot optional

INTERACTIONS:
- Row tap → M-04 chat thread
```

---

### M-04 — Mobile Chat Thread (P1)

```
Mobile project chat — full screen messaging.

DESIGN SYSTEM (REQUIRED):
- Platform: Mobile companion, Mobile-first
- Palette: Deep Teal Navy (#10739e) sent bubbles, #F8FAFB received
- Typography: Inter
- Styles: chat bubbles

PAGE STRUCTURE:
1. Header: Back arrow, contact name, project subtitle, overflow menu
2. Message list: Bubbles, date separators, timestamps
3. Input bar: Text field + send icon, fixed above keyboard
4. Safe area insets

KEY ELEMENTS:
- Sent bubbles Primary, right aligned
- Received grey, left aligned
- Send button disabled when empty

INTERACTIONS:
- Send → new bubble in thread
- Back → M-03
```

---

### M-05 — Mobile My Projects Client (P1)

```
Mobile client project list — compact cards with stage status.

DESIGN SYSTEM (REQUIRED):
- Platform: Mobile companion, Mobile-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0)
- Typography: Inter
- Styles: 8px cards stacked

PAGE STRUCTURE:
1. Header: "My projects"
2. Project cards: Title, designer name, stage badge, "Action needed" pill if approval pending
3. Bottom tab bar: Projects tab active
4. Pull to refresh

KEY ELEMENTS:
- Action needed pill in warning colour
- Compact stage stepper dots (5 dots)

INTERACTIONS:
- Card tap → M-06
```

---

### M-06 — Mobile Project Detail (P1)

```
Mobile project stage overview — current stage and quick actions.

DESIGN SYSTEM (REQUIRED):
- Platform: Mobile companion, Mobile-first
- Palette: Deep Teal Navy (#10739e), Sky Mist (#B1DDF0), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: vertical stage list

PAGE STRUCTURE:
1. Header: Back, project title, overflow
2. Designer info row: Avatar, name, message button
3. Vertical stage stepper: 5 stages with status icons
4. Current stage card: Name, status, deliverable count, "Review deliverables" button
5. Quick actions: Approve | Message | Pay (contextual)

KEY ELEMENTS:
- Current stage expanded, others collapsed
- Pay button shows only when payment due

INTERACTIONS:
- Review deliverables → M-07
- Message → M-04
- Pay → M-08
```

---

### M-07 — Mobile Deliverable Preview + Approve (P1)

```
Mobile stage approval — preview and approve/reject actions.

DESIGN SYSTEM (REQUIRED):
- Platform: Mobile companion, Mobile-first
- Palette: Deep Teal Navy (#10739e), Warm Hire Gold (#E8A838), Success (#2D8A5E)
- Typography: Inter
- Styles: full-width preview

PAGE STRUCTURE:
1. Header: Stage name, version badge
2. Image preview: Full width, pinch-zoom placeholder
3. File info: Filename, uploaded date
4. Fixed bottom action bar: Approve (accent, full width) | Reject (text link)
5. Reject expands feedback textarea sheet from bottom

KEY ELEMENTS:
- Approve button prominent and thumb-reachable
- Swipe between versions optional
- Milestone amount shown above approve button

INTERACTIONS:
- Approve → success toast, offers M-08 if payment due
- Reject → requires feedback text
```

---

### M-08 — Mobile Pay Milestone (P1)

```
Mobile Stripe payment — streamlined checkout.

DESIGN SYSTEM (REQUIRED):
- Platform: Mobile companion, Mobile-first
- Palette: Deep Teal Navy (#10739e), Warm Hire Gold (#E8A838)
- Typography: Inter
- Styles: single column payment

PAGE STRUCTURE:
1. Header: Back, "Pay milestone"
2. Summary card: Project, stage, amount large
3. Payment method: Card form simplified for mobile
4. Pay £X,XXX full-width accent button
5. Stripe secure badge
6. Safe area bottom padding

KEY ELEMENTS:
- Amount is largest text on screen
- Apple Pay / Google Pay buttons optional placeholders

INTERACTIONS:
- Pay → success confirmation → back to M-06
```

---

### P2/P3 Abbreviated Prompts

Use the nearest P1 screen as base; apply these deltas:

| ID | Base screen | Delta |
|----|-------------|-------|
| W-04 | W-02 | Replace form with email-only input; "Send reset link" CTA; confirmation message state |
| W-05 | W-02 | Centre card: email verification icon, "Check your inbox", resend link, change email link |
| W-06 | W-C01 | Settings form: avatar upload, name, email, password change section, notification preferences toggles, delete account danger zone |
| W-C16 | W-C15 | Single column layout; one proposal card expanded; same fee table and Accept CTA |
| W-C18 | W-C05 | Grid of saved designer cards only; remove portfolio section; "Remove" heart icon |
| W-D04 | W-D01 | Settings subsection: Availability toggle large; notification preferences; payout account link |
| W-D10 | W-C24 | Designer view: earnings received, pending release, payout history table; no Pay button |
| W-A01 | W-D01 | Admin nav; stats cards: Users, Pending verifications, Open reports; quick action links |
| W-A02 | W-D05 | Data table: Name, Email, Role, Status, Joined, Actions (suspend, view); search and filter |
| W-A03 | W-A02 | Queue table: Designer name, documents submitted, date, Approve/Reject inline buttons |
| W-A04 | W-A02 | Reports table: Reporter, Target, Reason, Date, Status, Resolve action |
| W-A05 | W-A02 | Reviews table: Rating, comment snippet, flag reason, Hide/Keep actions |
| W-A06 | W-A01 | Charts: User growth line, Projects per month bar, Revenue area; date range selector |
| W-S03 | W-C02 | Three variant cards: Empty ("No projects yet"), Loading (skeleton grid), Error ("Something went wrong" + retry) |
| M-09 | W-D05 | Compact mobile rows; bottom tab Requests active; swipe to submit proposal |
| M-10 | W-D10 | Single column earnings summary; total earned, pending, last payout card |

---

## Appendix C — Navigation & Information Architecture

### Public routes

```
/ (Landing) → /discover (preview) | /login | /register
/login ↔ /register | /forgot-password
```

### Client authenticated nav

**Navbar:** Logo | Discover | Moodboards | Requests | Projects | [Role switch] | 🔔 | Avatar

```
/client (dashboard)
  → /discover → /discover/[id] → /designers/[id]
  → /moodboards → /moodboards/[id] → /briefs/new → /briefs/[id] → /match
  → /requests/new | /requests/direct/[designerId]
  → /requests → /requests/[id] → /requests/[id]/proposals
  → /projects → /projects/[id] → stages | payments | messages | review
```

### Designer authenticated nav

**Navbar:** Logo | Portfolio | Requests | Projects | Earnings | [Role switch] | 🔔 | Avatar

```
/designer (dashboard)
  → /designer/portfolio → /designer/portfolio/new
  → /designer/requests → /designer/requests/[id] → /designer/requests/[id]/propose
  → /designer/projects → /designer/projects/[id]
  → /designer/earnings
```

### Admin nav

**Navbar:** Logo | Dashboard | Users | Verification | Reports | Analytics

### Mobile bottom tabs

| Tab | Client | Designer |
|-----|--------|----------|
| Home | M-02 notifications | M-02 notifications |
| Projects / Requests | M-05 projects | M-09 requests |
| Messages | M-03 | M-03 |
| Notifications | M-02 | M-02 |
| Profile | W-06 settings (mobile layout) | W-06 settings |

### Dashboard next-action CTAs

| Role | Example CTA |
|------|-------------|
| Client | "Add 3 items to moodboard" → W-C07 |
| Client | "Post request" → W-C11 |
| Client | "Compare 2 proposals" → W-C15 |
| Client | "Approve Concept stage" → W-C21 |
| Designer | "Complete portfolio" → W-D03 |
| Designer | "Respond to request" → W-D06 |
| Designer | "Upload Design deliverable" → W-D09 |

---

## Appendix D — Academic Wireframe Mapping

For the interim report ([`docs/Interim/InterimDiscussion.md`](../docs/Interim/InterimDiscussion.md) Chapter 5): **4–5 wireframes in the main report body**, remainder in appendices. Highlight key UI elements on exported Stitch screenshots.

### Main report body (required)

| # | Wireframe | Stitch ID | Key elements to highlight |
|---|-----------|-----------|---------------------------|
| 1 | Discovery feed | W-C02 | Filter sidebar, portfolio card grid, save-to-moodboard heart |
| 2 | Moodboard editor | W-C07 | Image masonry grid, generate brief CTA |
| 3 | Proposal comparison | W-C15 | Side-by-side columns, stage fee table, accept buttons |
| 4 | Project workspace | W-C20 | Stage stepper, approve/reject actions, deliverables tab |
| 5 | Milestone ledger | W-C24 | Payment status badges, Pay now CTA |

### Appendix wireframes (recommended)

All remaining P1 screens plus: W-01 Landing, W-03 Register, W-C10 Fit scores, W-D07 Proposal form, M-07 Mobile approve, W-A03 Verification queue.

### Export checklist

1. Generate each screen in Stitch at 1440×900 (desktop) or 390×844 (mobile)
2. Export PNG from Stitch
3. Add numbered callout highlights in Canva/Figma for report figures
4. Write 3 sentences per wireframe explaining user goal, key controls, and navigation

---

## Stitch Usage

1. Create a Stitch project named **Inside**
2. Paste this file into project design settings or reference it in each generation prompt
3. Generate P1 screens first (see [`.stitch/SITE.md`](SITE.md) for order)
4. Use `deviceType: DESKTOP` for W-* screens, `MOBILE` for M-* screens
5. Validate tokens: `npx @google/design.md lint .stitch/DESIGN.md`
6. Export screenshots for academic wireframes per Appendix D
