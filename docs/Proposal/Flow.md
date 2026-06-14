# Inside — User Flows (Web & Mobile)

**Inside** connects clients and interior designers from inspiration to payment.

| Platform | Role |
|----------|------|
| **Web** | Discovery, moodboards, briefs, hiring, full workspace |
| **Mobile** | Notifications, messaging, quick approvals, payments |

---

## Client flow (website — primary)

### Phase 1 — Discover & brief

| Step | Screen / action | User does |
|------|-----------------|-----------|
| 1 | Home / Discovery feed | Browse completed room projects |
| 2 | Filters | Filter by style, room type, budget band |
| 3 | Project detail | View images, tags, designer link |
| 4 | Moodboard | Save projects to moodboard |
| 5 | Moodboard view | Review saved items |
| 6 | Generate brief | System creates structured brief (styles %, rooms, budget) |
| 7 | Fit scores | View ranked designers + match breakdown |

### Phase 2 — Hire (choose one path)

**Path A — Open request**

| Step | Screen / action | User does |
|------|-----------------|-----------|
| 8a | Create open request | Enter space, budget, notes; attach moodboard + brief |
| 9a | My requests | Wait for proposals |
| 10a | Proposal comparison | Compare scope, timeline, stage fees side by side |
| 11a | Accept proposal | Select one designer → **Project created** |

**Path B — Direct contact**

| Step | Screen / action | User does |
|------|-----------------|-----------|
| 8b | Designer profile | Open from discovery or fit score list |
| 9b | Contact / Message | Chat about requirements (optional) |
| 10b | Send direct request | Attach moodboard + brief to one designer |
| 11b | View proposal | Review designer’s proposal |
| 12b | Accept proposal | Accept → **Project created** |

### Phase 3 — Collaborate & pay

| Step | Screen / action | User does |
|------|-----------------|-----------|
| 12 | Project workspace | Open active project |
| 13 | Stage tabs | Navigate: Proposal → Concept → Design → Revision → Completion |
| 14 | Deliverables | View/download files for current stage |
| 15 | Approve / reject | Approve or reject with comment |
| 16 | Milestone ledger | See stage \| amount \| status |
| 17 | Pay milestone | Pay via Stripe after approval |
| 18 | Messaging | Clarify details in project chat (secondary to stages) |
| 19 | Review | Rate designer after final stage + payment |

### Client web — quick map

```
Discover → Moodboard → Brief → Fit scores
    ├─ Open request → Proposals → Compare → Accept
    └─ Contact designer → Direct request → Proposal → Accept
                        ↓
              Stage workspace → Approve → Pay → Review
```

---

## Designer flow (website — primary)

| Step | Screen / action | User does |
|------|-----------------|-----------|
| 1 | Designer dashboard | Overview: requests, active projects, earnings |
| 2 | Portfolio | Create/edit room case studies (images, style, room, budget) |
| 3 | Availability | Set available / busy |
| 4 | Incoming requests | View open requests (public) + direct requests (targeted) |
| 5 | Submit proposal | Scope, timeline, stage-based fees |
| 6 | Active projects | List ongoing jobs |
| 7 | Stage workspace | Upload deliverables per stage |
| 8 | Version history | Upload revisions (v1, v2, …) |
| 9 | Messaging | Reply to client questions |
| 10 | Payments | View milestone payments released on approval |

### Designer web — quick map

```
Publish portfolio → Set availability
    ↓
Receive request (open or direct) → Submit proposal
    ↓
Proposal accepted → Upload per stage → Client approves → Payment released
```

---

## Mobile app — how it works

Mobile is a **companion**, not a full copy of the website.

### What mobile is for

| Feature | Why on mobile |
|---------|----------------|
| Push notifications | New proposal, message, stage ready, payment due |
| Messages | Quick replies on the go |
| Project status | See current stage at a glance |
| Approve / reject stage | Client action without opening laptop |
| Confirm payment | Complete Stripe flow after approval |
| Role switch | Dual-role users switch client/designer mode |

### What stays web-only (MVP)

| Feature | Reason |
|---------|--------|
| Discovery feed & filters | Large images, better browsing |
| Moodboard building | Visual layout needs space |
| Structured brief + fit scores | Data-heavy comparison |
| Proposal comparison table | Side-by-side needs width |
| Full project workspace | Deliverable review on big screen |
| Portfolio creation/editing | Multi-image upload easier on web |

---

## Client flow (mobile)

| Step | Screen | User does |
|------|--------|-----------|
| 1 | Login / role switch | Sign in as client |
| 2 | Home / notifications | See alerts (proposal, message, approval needed) |
| 3 | Messages | Open chat with designer |
| 4 | My projects | List active projects |
| 5 | Project detail | Current stage + status |
| 6 | Deliverables | Preview files for current stage |
| 7 | Approve / reject | Tap approve or reject + comment |
| 8 | Pay milestone | Open payment after approval |
| 9 | (Optional) Post request | Short form only; full moodboard/brief better on web |

### Client mobile — quick map

```
Notification → Open project → Review deliverable → Approve → Pay
                    ↓
              Messages (anytime)
```

---

## Designer flow (mobile)

| Step | Screen | User does |
|------|--------|-----------|
| 1 | Login / role switch | Sign in as designer |
| 2 | Notifications | New request, client message, approval, payment received |
| 3 | Requests inbox | See open + direct requests (summary) |
| 4 | Messages | Reply to client |
| 5 | My projects | Active jobs list |
| 6 | Project detail | Current stage |
| 7 | (Light) Upload | Optional: photo upload for deliverable; full upload on web |
| 8 | Earnings / payments | View released milestones |

### Designer mobile — quick map

```
Notification → Request / message / project
                    ↓
         Reply or check status (heavy upload on web)
```

---

## Shared flows (both roles)

| Flow | Web | Mobile |
|------|-----|--------|
| Register / login | ✓ | ✓ |
| Dual-role switch | ✓ | ✓ |
| Profile settings | ✓ | ✓ |
| Notifications list | ✓ | ✓ (primary) |
| Messaging | ✓ | ✓ |

---

## Project stages (both platforms)

| Order | Stage | Designer | Client |
|-------|-------|----------|--------|
| 1 | Proposal | — | Accept proposal (hire) |
| 2 | Concept | Upload concept boards | Approve → pay |
| 3 | Design | Upload design package | Approve → pay |
| 4 | Revision | Upload revisions | Approve → pay |
| 5 | Completion | Final package | Approve → final pay → review |

---

## Dashboard “next action” (recommended UX)

Show one clear CTA so users never feel lost:

| Role | Example next actions |
|------|----------------------|
| Client | “Add 3 items to moodboard”, “Post request”, “Compare 2 proposals”, “Approve Concept stage” |
| Designer | “Complete portfolio”, “Respond to request”, “Upload Design deliverable” |

---

## Unique to Inside (not ShutterBug / Fiverr)

1. Moodboard → auto structured brief
2. Fit scoring with breakdown
3. Open + direct hiring (both via proposals)
4. Stage-gated workspace (not order status only)
5. Approval-gated milestone ledger
6. Portfolio room projects (not gigs)

---

## Related docs

- [SYSTEM-OVERVIEW.md](SYSTEM-OVERVIEW.md)
- [Proposal/06-proposed-solution.md](Proposal/06-proposed-solution.md)
- [Proposal/diagrams/architecture-diagrams.md](Proposal/diagrams/architecture-diagrams.md)
