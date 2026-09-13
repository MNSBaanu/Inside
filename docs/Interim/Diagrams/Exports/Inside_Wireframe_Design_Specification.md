# Inside --- Wireframe Design Specification

## 1. Purpose

This document defines how the **Inside -- Interior Design Service
Marketplace** wireframes should be designed.

The wireframes should represent the actual proposed system rather than a
generic interior-design website. They should demonstrate layout,
navigation, functionality, information hierarchy, and the main user
journeys.

The wireframes should remain **low-to-medium fidelity**: focus on
structure and functionality rather than final visual polish.

The project documentation defines the web application as the primary
platform for discovery, moodboards, briefs, hiring, proposal comparison,
and the full project workspace. The mobile application is a focused
companion for notifications, messaging, project status, stage approval,
and payment confirmation. fileciteturn52file2L199-L206

------------------------------------------------------------------------

## 2. Main Inside Workflow

The complete client journey should be represented as:

``` text
Discover
   ↓
Moodboard
   ↓
Structured Brief
   ↓
Fit Scores
   ↓
Request / Direct Contact
   ↓
Proposal
   ↓
Accept Proposal
   ↓
Project Workspace
   ↓
Stage Approval
   ↓
Milestone Payment
   ↓
Review
```

Project stages:

``` text
PROPOSAL → CONCEPT → DESIGN → REVISION → COMPLETION
```

This workflow is supported by the project's documented client flow.
fileciteturn52file2L210-L256

------------------------------------------------------------------------

# 3. Web Application Structure

## 3.1 Web is the primary platform

The web application should contain the richer functionality:

-   Designer discovery
-   Portfolio browsing
-   Search and filtering
-   Moodboards
-   Structured briefs
-   Designer fit scoring
-   Open project requests
-   Direct designer requests
-   Proposal submission
-   Proposal comparison
-   Project workspace
-   Project stages
-   Deliverables
-   Version history
-   Messaging
-   Milestone payments
-   Reviews
-   Favourites
-   Trust and safety
-   Administration

The project implementation plan specifically identifies Discovery Feed,
Moodboard Editor, Proposal Comparison, Project Workspace and Milestone
Ledger as priority wireframes. fileciteturn52file4L443-L453

------------------------------------------------------------------------

# 4. Global Web Layout

Every major web screen should use a consistent layout.

``` text
┌─────────────────────────────────────────────────────────────┐
│ Inside | Navigation | Search | Notifications | Profile     │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│   Sidebar     │              Main Content                   │
│               │                                             │
│   Dashboard   │                                             │
│   Discover    │                                             │
│   Projects    │                                             │
│   Messages    │                                             │
│   Settings    │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

## Header

Include:

-   Inside logo/name
-   Search where appropriate
-   Notifications
-   Profile/avatar
-   Role switcher for dual-role users

## Client navigation

-   Dashboard
-   Discover Designers
-   My Projects
-   Moodboards
-   Messages
-   Favourites
-   Notifications
-   Settings

## Designer navigation

-   Dashboard
-   Requests
-   My Portfolio
-   Projects
-   Messages
-   Payments
-   Notifications
-   Settings

## Admin navigation

-   Dashboard
-   Users
-   Designer Verification
-   Reports
-   Content Moderation
-   Projects
-   Analytics
-   Settings

------------------------------------------------------------------------

# 5. Wireframe W-C02 --- Discovery Feed

## Purpose

Allow clients to discover completed interior-design projects and
suitable designers.

The documented client flow begins with browsing completed room projects,
applying filters, opening project details, saving inspiration, and
continuing toward designer matching. fileciteturn52file2L210-L223

## Layout

``` text
┌─────────────────────────────────────────────────────────────┐
│ Inside     Discover     Projects     Messages     Profile   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Discover Interior Designers                                 │
│ Find inspiration and designers for your project             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Search projects or designers                         🔍 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Filters                 Portfolio Projects                   │
│ ┌──────────────┐       ┌────────┐ ┌────────┐ ┌────────┐   │
│ │ Style        │       │ Image  │ │ Image  │ │ Image  │   │
│ │ □ Modern     │       └────────┘ └────────┘ └────────┘   │
│ │ □ Minimal    │       Living     Kitchen    Bedroom       │
│ │ □ Classic    │       Sarah      David      Amara         │
│ │              │                                            │
│ │ Room         │       [View]     [View]     [View]        │
│ │ □ Living     │                                            │
│ │ □ Bedroom    │       ...                                  │
│ │ □ Kitchen    │                                            │
│ │              │                                            │
│ │ Budget       │                                            │
│ │ [────────]   │                                            │
│ └──────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

## Required elements

### Search

Search for:

-   designer names
-   portfolio projects
-   keywords

### Filters

Include:

-   Style
-   Room type
-   Budget band
-   Location where applicable

### Portfolio cards

Each card should contain:

-   Project image
-   Project title
-   Designer name
-   Style
-   Room type
-   Budget
-   Save/Favourite action
-   View action

## Primary actions

-   Search
-   Apply filters
-   View Portfolio
-   Save to Moodboard
-   Open Designer Profile

## Navigation flow

``` text
Discovery Feed
      ↓
Portfolio Detail
      ↓
Save Inspiration
      ↓
Moodboard
```

------------------------------------------------------------------------

# 6. Wireframe W-C07 --- Moodboard Editor

## Purpose

Allow clients to collect visual inspiration and prepare information for
a structured project brief.

The project flow defines moodboards as a key step between discovery and
brief generation. fileciteturn52file2L216-L223

## Layout

``` text
┌─────────────────────────────────────────────────────────────┐
│ ← Moodboards        Living Room Inspiration          Save   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Moodboard                                                   │
│ Living Room Inspiration                                    │
│ Modern, warm and natural ideas                             │
│                                                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│ │            │ │            │ │            │              │
│ │ Inspiration│ │ Inspiration│ │ Inspiration│              │
│ │   Image    │ │   Image    │ │   Image    │              │
│ │            │ │            │ │            │              │
│ └────────────┘ └────────────┘ └────────────┘              │
│                                                             │
│ ┌────────────┐ ┌────────────┐                              │
│ │ Inspiration│ │ Inspiration│                              │
│ │   Image    │ │   Image    │                              │
│ └────────────┘ └────────────┘                              │
│                                                             │
│ [Add Inspiration]    [Add Note]                            │
│                                                             │
│                         [Generate Brief]                    │
└─────────────────────────────────────────────────────────────┘
```

## Required elements

-   Moodboard name
-   Description
-   Inspiration grid
-   Add inspiration
-   Remove item
-   Optional note/caption
-   Save
-   Generate Brief

The implementation plan specifies a responsive moodboard editor with a
grid, drag-and-drop images, and a multi-step brief form.
fileciteturn52file4L387-L394

------------------------------------------------------------------------

# 7. Structured Project Brief

## Purpose

Convert moodboard information into an editable structured brief.

## Layout

``` text
┌─────────────────────────────────────────────────────────────┐
│ Structured Project Brief                         Save       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Property / Space                                            │
│ [ Living Room                                           ]   │
│                                                             │
│ Preferred Styles                                            │
│ [Modern] [Minimal] [Natural]                                │
│                                                             │
│ Rooms                                                       │
│ [Living Room]                                               │
│                                                             │
│ Budget Range                                                │
│ [ LKR 500,000 — 750,000 ]                                  │
│                                                             │
│ Requirements                                                │
│ [_______________________________________________________]   │
│ [_______________________________________________________]   │
│                                                             │
│ Linked Moodboard                                            │
│ Living Room Inspiration                                     │
│                                                             │
│                 [Edit Brief] [Confirm Brief]                │
└─────────────────────────────────────────────────────────────┘
```

## Required fields

-   Property/space information
-   Preferred styles
-   Rooms
-   Budget range
-   Description/requirements
-   Linked moodboard

The functional requirements specify project briefs containing project
details, budget, timeline, property information, preferred styles and
linked moodboards. fileciteturn52file8L669-L680

------------------------------------------------------------------------

# 8. Designer Fit Score Screen

## Purpose

Rank designers according to the client's project requirements.

Fit scoring should consider:

-   Style
-   Room type
-   Availability
-   Project requirements
-   Portfolio similarity

The project documentation specifies visible fit-score ranking and a
breakdown of matching factors. fileciteturn52file9L774-L778

## Layout

``` text
┌─────────────────────────────────────────────────────────────┐
│ Recommended Designers                                       │
│ Based on your project brief                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Sarah Perera                              92% Match     │ │
│ │ Interior Designer | Colombo | ✓ Verified               │ │
│ │                                                         │ │
│ │ Style          ██████████ 95%                           │ │
│ │ Room           █████████  90%                           │ │
│ │ Budget         █████████  88%                           │ │
│ │ Availability   █████████  94%                           │ │
│ │                                                         │ │
│ │ [View Portfolio] [Contact] [Send Request]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ David Silva                               86% Match     │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

Do not show only the percentage. The user should be able to understand
why the designer received the score.

------------------------------------------------------------------------

# 9. Designer Profile / Portfolio

## Purpose

Allow clients to inspect a designer before sending a request.

## Layout

``` text
┌─────────────────────────────────────────────────────────────┐
│ ← Back                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Profile]   Sarah Perera                                    │
│             Interior Designer                               │
│             ★ 4.8   ✓ Verified   Available                 │
│             Colombo                                         │
│                                                             │
│ Bio                                                         │
│ Modern residential interior design specialist...            │
│                                                             │
│ Portfolio                                                   │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│ │   Image    │ │   Image    │ │   Image    │              │
│ └────────────┘ └────────────┘ └────────────┘              │
│                                                             │
│ Style: Modern | Minimal                                     │
│ Rooms: Living | Bedroom | Kitchen                           │
│                                                             │
│ [Save Favourite] [Contact] [Send Request]                   │
└─────────────────────────────────────────────────────────────┘
```

The designer flow includes portfolio case studies, availability,
incoming requests, proposals, active projects and payments.
fileciteturn52file2L604-L617

------------------------------------------------------------------------

# 10. Hiring --- Open Request

The open-request flow should be represented as:

``` text
Create Open Request
        ↓
Attach Moodboard + Brief
        ↓
Post Request
        ↓
Multiple Designers
        ↓
Multiple Proposals
        ↓
Proposal Comparison
        ↓
Accept One
        ↓
Project Created
```

The documented flow specifically requires attaching the moodboard and
brief, waiting for proposals, comparing them side-by-side, and accepting
one proposal to create the project. fileciteturn52file2L224-L234

------------------------------------------------------------------------

# 11. Hiring --- Direct Request

The direct-request flow should be:

``` text
Designer Profile
      ↓
Optional Message
      ↓
Direct Request
      ↓
Attach Moodboard + Brief
      ↓
Designer Proposal
      ↓
Accept Proposal
      ↓
Project Created
```

The direct-contact path is documented separately from the open-request
path. fileciteturn52file2L235-L243

Both hiring paths must eventually lead to the same Project Workspace.

------------------------------------------------------------------------

# 12. Wireframe W-C15 --- Proposal Comparison

## Purpose

Allow clients to compare proposals before selecting a designer.

## Layout

``` text
┌─────────────────────────────────────────────────────────────┐
│ Proposal Comparison                                         │
│ Living Room Renovation                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              Sarah          David          Amara             │
│              92% Match      87% Match      84% Match        │
│                                                             │
│ Scope        Full Design   Full Design    Concept + Design  │
│ Timeline     6 weeks       7 weeks        5 weeks           │
│ Total Fee    LKR 650k      LKR 620k       LKR 700k          │
│                                                             │
│ Concept      LKR 100k      LKR 90k        LKR 120k          │
│ Design       LKR 250k      LKR 250k       LKR 280k          │
│ Revision     LKR 150k      LKR 140k       LKR 160k          │
│ Completion   LKR 150k      LKR 140k       LKR 140k          │
│                                                             │
│ [View]         [View]         [View]                         │
│ [Select]       [Select]       [Select]                       │
└─────────────────────────────────────────────────────────────┘
```

## Required elements

-   Designer name
-   Fit score
-   Scope
-   Timeline
-   Total proposal fee
-   Stage-based fees
-   View Portfolio
-   Select Proposal
-   Proposal status

The implementation plan specifically calls for a side-by-side proposal
comparison with scope, timeline and stage-fee information.
fileciteturn52file4L396-L404

------------------------------------------------------------------------

# 13. Proposal Submission --- Designer

## Purpose

Allow a designer to respond to a request.

## Layout

``` text
┌─────────────────────────────────────────────────────────────┐
│ Submit Proposal                                              │
├─────────────────────────────────────────────────────────────┤
│ Project: Living Room Renovation                              │
│                                                             │
│ Scope                                                       │
│ [_______________________________________________________]   │
│                                                             │
│ Timeline                                                    │
│ [ 6 weeks                                               ]   │
│                                                             │
│ Total Proposal Fee                                         │
│ [ LKR 650,000                                           ]   │
│                                                             │
│ Stage Fees                                                  │
│ Proposal       [ LKR ______ ]                              │
│ Concept        [ LKR ______ ]                              │
│ Design         [ LKR ______ ]                              │
│ Revision       [ LKR ______ ]                              │
│ Completion     [ LKR ______ ]                              │
│                                                             │
│                  [Save Draft] [Submit Proposal]             │
└─────────────────────────────────────────────────────────────┘
```

The designer flow specifies proposals containing scope, timeline and
stage-based fees. fileciteturn52file2L604-L617

------------------------------------------------------------------------

# 14. Wireframe W-C20 --- Project Workspace

## Purpose

This is the main collaboration screen after a proposal has been
accepted.

It should bring together:

-   Project information
-   Stages
-   Deliverables
-   Progress
-   Approval
-   Revisions
-   Messaging
-   Milestones

## Layout

``` text
┌─────────────────────────────────────────────────────────────┐
│ Inside | Projects | Messages | Notifications | Profile      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Living Room Renovation                         ACTIVE        │
│ Client: Sarah Perera       Designer: David Silva            │
│                                                             │
│ PROPOSAL → CONCEPT → DESIGN → REVISION → COMPLETION         │
│     ✓          ●          ○          ○           ○           │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Current Stage: CONCEPT                                  │ │
│ │ Due Date: 20 October                                    │ │
│ │                                                         │ │
│ │ Deliverables                                            │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Concept Board v2                                     │ │ │
│ │ │ Uploaded: 18 October                                 │ │ │
│ │ │ [Preview] [Download] [Version History]              │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ Feedback                                                │ │
│ │ [___________________________________________________]  │ │
│ │                                                         │ │
│ │ [Reject with Feedback]        [Approve Stage]           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Milestone: LKR 100,000      Status: Pending Approval        │
│                                                             │
│ [Open Messages]                                             │
└─────────────────────────────────────────────────────────────┘
```

The implementation plan specifies a project workspace with a stage
timeline, stage detail, deliverable upload/download, approval/rejection,
version history, messaging and payment UI.
fileciteturn52file4L406-L418

## Required stage tracker

Always use:

``` text
PROPOSAL → CONCEPT → DESIGN → REVISION → COMPLETION
```

The current stage must be visually highlighted.

## Deliverable section

Show:

-   File/image
-   Description
-   Upload date
-   Version
-   Preview
-   Download
-   Version History

## Approval

Client actions:

-   Approve Stage
-   Reject Stage
-   Feedback

Rejection must provide a way to give feedback.

------------------------------------------------------------------------

# 15. Wireframe W-C24 --- Milestone Ledger

## Purpose

Show transparent stage-based payment information.

## Layout

``` text
┌─────────────────────────────────────────────────────────────┐
│ Milestone Payments                                          │
│ Living Room Renovation                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Stage        Amount        Status             Action         │
│ ─────────────────────────────────────────────────────────── │
│ Proposal     LKR 100k      Paid               —             │
│ Concept      LKR 150k      Approved           Pay           │
│ Design       LKR 250k      Pending            —             │
│ Revision     LKR 100k      Pending            —             │
│ Completion   LKR 150k      Pending            —             │
│                                                             │
│ Total:       LKR 750,000                                    │
│ Paid:        LKR 100,000                                    │
│ Remaining:   LKR 650,000                                    │
│                                                             │
│              [Pay Approved Milestone]                       │
└─────────────────────────────────────────────────────────────┘
```

Payment should become available after the corresponding stage is
approved. The project requirements specify milestone-based payments,
payment history and payment-status updates.
fileciteturn52file8L709-L725

------------------------------------------------------------------------

# 16. Messaging Screen

## Purpose

Provide project-scoped communication between client and designer.

## Layout

``` text
┌───────────────────────┬─────────────────────────────────────┐
│ Conversations         │ Living Room Renovation              │
│                       │ David Silva                         │
│ ● Living Room         │                                     │
│   Renovation          │ David: Concept board uploaded.     │
│                       │                                     │
│ ○ Kitchen Design      │ You: I'll review it today.         │
│                       │                                     │
│                       │                                     │
│                       │ ┌─────────────────────────────────┐ │
│                       │ │ Type a message...              │ │
│                       │ └─────────────────────────────────┘ │
│                       │                         [Send] [📎] │
└───────────────────────┴─────────────────────────────────────┘
```

Required:

-   Conversation list
-   Project name
-   Messages
-   Timestamp
-   Read/unread state
-   Attachment
-   Message input
-   Send button

The functional requirements specify project-based messaging,
conversation history, timestamps, read receipts and typing indicators.
fileciteturn52file8L698-L708

------------------------------------------------------------------------

# 17. Client Dashboard

## Layout

``` text
Welcome back, Sarah

┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Active     │ │ Pending    │ │ Messages   │ │ Milestones │
│ Projects   │ │ Proposals  │ │            │ │            │
│     3      │ │     2      │ │     5      │ │     2      │
└────────────┘ └────────────┘ └────────────┘ └────────────┘

Active Projects
──────────────────────────────────────────────────────────────
Living Room Renovation       Design       60%
Kitchen Renovation           Concept      30%

Recent Activity
──────────────────────────────────────────────────────────────
• New proposal received
• Concept stage ready for approval
• Milestone payment due

Recommended Designers
──────────────────────────────────────────────────────────────
[Designer] [Designer] [Designer] [Designer]
```

The functional requirements define role-specific dashboards showing
statistics, recent activities, notifications, pending actions and quick
access to common features. fileciteturn52file8L742-L746

------------------------------------------------------------------------

# 18. Designer Dashboard

## Layout

``` text
Welcome back, David

┌────────────┐ ┌────────────┐ ┌────────────┐
│ Requests   │ │ Projects   │ │ Earnings   │
│     5      │ │     3      │ │ LKR ...    │
└────────────┘ └────────────┘ └────────────┘

Incoming Requests
──────────────────────────────────────────────────────────────
Living Room Renovation      Open Request       [View]
Kitchen Design              Direct Request     [View]

Active Projects
──────────────────────────────────────────────────────────────
Project A                   Design              60%
Project B                   Concept             30%

Quick Actions
[Update Portfolio] [Set Availability] [View Payments]
```

------------------------------------------------------------------------

# 19. Admin Dashboard

## Purpose

Allow administrators to manage and monitor the platform.

## Main sections

``` text
Admin Dashboard

┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Users      │ │ Designers  │ │ Reports    │ │ Projects   │
│ 1,240      │ │ 320        │ │ 12         │ │ 185        │
└────────────┘ └────────────┘ └────────────┘ └────────────┘

Pending Designer Verification
──────────────────────────────────────────────────────────────
Designer          Submitted       Status       Action
Sarah Perera      18 Oct          Pending      [Review]

Reports
──────────────────────────────────────────────────────────────
Report #104       User Report    Under Review  [Review]

Recent Activity
──────────────────────────────────────────────────────────────
• Designer verified
• Review moderated
• User suspended
```

Administration should cover:

-   User management
-   Designer verification
-   Reports
-   Content moderation
-   Project monitoring
-   Analytics
-   Administrative activity/audit records

------------------------------------------------------------------------

# 20. Mobile Wireframe Direction

The mobile app is a **companion**, not a full copy of the website.
fileciteturn52file2L631-L655

## Mobile navigation

``` text
Home | Projects | Messages | Notifications | Profile
```

## Mobile Home

Show:

-   Current projects
-   Current stage
-   Pending approvals
-   Payment due
-   Notifications

## Mobile Project Detail

Show:

-   Project title
-   Current stage
-   Progress
-   Latest deliverable
-   Approve
-   Reject
-   Messages
-   Payment

## Mobile Messages

Show:

-   Conversations
-   Message history
-   Message input
-   Attachment

## Mobile Notifications

Show:

-   New proposal
-   New message
-   Stage ready
-   Approval required
-   Payment update

## Mobile Payment

Show:

-   Milestone
-   Amount
-   Status
-   Payment confirmation

## Mobile Role Switch

For dual-role users:

``` text
Current Role: Client

[ Switch to Designer ]
```

------------------------------------------------------------------------

# 21. Responsive Design

## Desktop

Use:

-   Left sidebar
-   Multi-column portfolio grid
-   Side-by-side proposal comparison
-   Detailed project workspace
-   Large moodboard area

## Tablet

Use:

-   Collapsible sidebar
-   Reduced card columns
-   Responsive comparison
-   Simplified workspace

## Mobile

Use:

-   Bottom navigation
-   Single-column cards
-   Stacked forms
-   Compact stage tracker
-   Quick actions

Do not simply shrink the desktop interface.

------------------------------------------------------------------------

# 22. States to Show

Important screens should account for:

## Loading

``` text
Loading recommendations...
```

## Empty

``` text
No moodboards yet.
[Create Moodboard]
```

## Error

``` text
Unable to load proposals.
[Try Again]
```

## Success

``` text
Proposal accepted.
Your project workspace has been created.
[Open Project]
```

## Pending

``` text
Waiting for designer proposal
```

## Approval

``` text
Stage Approved
Milestone Payment Available
```

## Rejection

``` text
Stage Rejected
Feedback Required
```

------------------------------------------------------------------------

# 23. Inside Visual Theme

The final visual UI should follow the Inside presentation identity.

## Colour palette

  Purpose                Colour
  ---------------------- -----------
  Primary                `#183C35`
  Primary Light          `#A8B8A5`
  Accent                 `#C98262`
  Background             `#F7F4EE`
  Surface / Cards        `#FFFFFF`
  Secondary Background   `#E8EEE8`
  Main Text              `#252A28`
  Secondary Text         `#68716D`
  Border                 `#D9D7D0`
  Success                `#3F7D5A`
  Warning                `#C49A4A`
  Error                  `#B85C5C`

## Style

The finished UI should feel:

-   Modern
-   Natural
-   Premium
-   Calm
-   Professional
-   Interior-design focused
-   Spacious
-   Easy to navigate

For the actual wireframe, keep colours restrained so that structure
remains the main focus.

------------------------------------------------------------------------

# 24. Typography

Use:

-   Elegant serif typography for major headings where appropriate
-   Clean sans-serif typography for controls and interface text
-   Strong hierarchy for headings, labels and body text

Avoid overly decorative typography for functional controls.

------------------------------------------------------------------------

# 25. Image Guidelines

Portfolio-led discovery is central to Inside, so portfolio images should
be prominent.

Use:

-   Living rooms
-   Bedrooms
-   Kitchens
-   Dining areas
-   Home offices
-   Modern interiors
-   Minimal interiors
-   Warm/natural interiors

Avoid unrelated business stock images.

------------------------------------------------------------------------

# 26. Important UX Rules

1.  Every screen must have one clear primary purpose.
2.  Primary actions must be visually obvious.
3.  Forms must use clear labels.
4.  Important actions must have confirmation or clear status.
5.  Statuses must be understandable without relying only on colour.
6.  Related screens should have obvious navigation.
7.  Do not overload screens with unnecessary information.
8.  Keep the main workflow visible.
9.  Use realistic interior-design sample content.
10. Keep the same navigation and component structure across screens.

------------------------------------------------------------------------

# 27. Features That Must Not Be Added

Do not represent future/out-of-scope functionality as implemented.

Do not add:

-   AI-generated interior designs
-   AR/VR visualisation
-   CAD integration
-   Furniture delivery services

These are explicitly outside the current scope.
fileciteturn52file3L340-L352

Also avoid unrelated:

-   Social-media feeds
-   Public follower systems
-   Generic ecommerce
-   Furniture shopping
-   Unrelated blogs/news
-   Generic AI assistants

------------------------------------------------------------------------

# 28. Recommended Wireframes for the Interim Report

The project implementation plan identifies these five priority
wireframes: fileciteturn52file4L443-L453

  Priority   Screen ID   Wireframe
  ---------- ----------- ---------------------
  1          W-C02       Discovery Feed
  2          W-C07       Moodboard Editor
  3          W-C15       Proposal Comparison
  4          W-C20       Project Workspace
  5          W-C24       Milestone Ledger

If only **two wireframes** are required, the recommended pair is:

### 1. W-C02 --- Discovery Feed

Shows:

``` text
Search → Filter → Portfolio → Designer
```

### 2. W-C20 --- Project Workspace

Shows:

``` text
Project → Stages → Deliverables → Approval → Payment
```

Together, these demonstrate both the beginning of the Inside journey and
the core project lifecycle.

------------------------------------------------------------------------

# 29. Wireframe Quality Checklist

## Layout

-   [ ] Clear page purpose
-   [ ] Consistent header
-   [ ] Consistent navigation
-   [ ] Clear hierarchy
-   [ ] Good spacing
-   [ ] No unnecessary elements

## Functionality

-   [ ] Main action is obvious
-   [ ] Secondary actions are visible
-   [ ] Forms have labels
-   [ ] Statuses are clear
-   [ ] Navigation is understandable

## Inside-specific functionality

-   [ ] Portfolio discovery
-   [ ] Search and filters
-   [ ] Moodboards
-   [ ] Structured briefs
-   [ ] Fit scores
-   [ ] Open requests
-   [ ] Direct requests
-   [ ] Proposal comparison
-   [ ] Project stages
-   [ ] Deliverables
-   [ ] Version history
-   [ ] Stage approval
-   [ ] Milestone payments
-   [ ] Messaging
-   [ ] Reviews

## Visual consistency

-   [ ] Inside colour palette
-   [ ] Natural/premium style
-   [ ] Consistent typography
-   [ ] Consistent cards
-   [ ] Consistent buttons
-   [ ] Relevant interior imagery
-   [ ] No unrelated elements

------------------------------------------------------------------------

# 30. Final Design Goal

The wireframes should make the Inside concept immediately
understandable:

> **A client discovers interior designers through completed work,
> collects inspiration into a moodboard, creates a structured brief,
> receives designer fit scores, sends an open or direct request,
> compares proposals, and manages the selected project through a
> stage-based workspace with deliverables, approvals, messaging and
> milestone payments.**

The wireframes should therefore be **simple, structured, realistic,
consistent, and directly connected to the documented Inside workflow**.
