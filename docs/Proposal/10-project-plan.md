# Project Plan

**Total duration:** 13 weeks *(adjust to your academic calendar)*

## Stages and approximate times

| Stage | Activities | Duration |
|-------|------------|----------|
| 1 | Research and requirement analysis | 2 weeks |
| 2 | System design and planning (diagrams, ER, wireframes) | 1 week |
| 3 | Database design and AWS environment setup | 1 week |
| 4 | Frontend development (discovery, dashboards, workspace UI) | 3 weeks |
| 5 | Backend development (API, auth, workflow, messaging) | 3 weeks |
| 6 | Payment integration (Stripe) and system testing | 2 weeks |
| 7 | System evaluation and documentation | 1 week |

### Detailed week breakdown

| Week(s) | Task |
|---------|------|
| 1–2 | Research, domain review, requirements, proposal finalisation |
| 3 | System design, wireframes, architecture diagrams |
| 4 | Database/API design, AWS baseline (Amplify, ECS, S3, Atlas) |
| 5 | Auth, dual-role, user profiles |
| 6–7 | Portfolio CRUD, S3 uploads, discovery feed |
| 7–8 | Moodboards, **structured brief** (FR-BRIEF), **fit scoring** (FR-FIT) |
| 8 | Project requests, proposals |
| 9–10 | Project workspace, stages, messaging, deliverables |
| 10–11 | Stripe milestones, SES notifications, reviews |
| 12 | Integration testing, UAT, bug fixes |
| 13 | Evaluation, dissertation, technical docs, demo |

---

## Gantt Chart

Present the schedule as a Gantt chart (per lecturer template). Export to `diagrams/07-gantt-chart.png` for Word/PDF submission.

### Mermaid preview (export to PNG via [mermaid.live](https://mermaid.live) or use Excel)

```mermaid
gantt
    title Inside — 13-Week Project Plan
    dateFormat X
    axisFormat %s

    section Research
    Research and requirements           :a1, 0, 2
    section Design
    System design and wireframes        :a2, 2, 1
    Database API and AWS setup          :a3, 3, 1
    section Development
    Auth and dual-role                  :a4, 4, 1
    Portfolio and discovery feed        :a5, 5, 2
    Moodboards and requests             :a6, 7, 1
    Proposals and project creation      :a7, 8, 1
    Project workspace and messaging     :a8, 9, 2
    Stripe and S3 deliverables          :a9, 10, 2
    Reviews and notifications           :a10, 11, 1
    section Close
    Testing and bug fixes               :a11, 12, 1
    Evaluation and documentation        :a12, 13, 1
```

![Project Gantt chart — 13-week plan](diagrams/07-gantt-chart.png)

*Figure 3: Gantt chart — Inside project schedule*

### How to create the Gantt chart

| Step | Action |
|------|--------|
| 1 | Use **Excel**, **Google Sheets**, or **draw.io** |
| 2 | Add one row per task (table below); bar length = duration in weeks |
| 3 | X-axis: Week 1 through Week 13 |
| 4 | Match layout style of lecturer example: [Sample/Gantt Chart.png](Sample/Gantt%20Chart.png) |
| 5 | Export PNG → save as `diagrams/07-gantt-chart.png` |

Full instructions: [diagrams-and-charts-guide.md](diagrams-and-charts-guide.md) — Section “Diagram 7”.

### Gantt task data (copy into spreadsheet)

| Task | Start week | Duration (weeks) |
|------|------------|------------------|
| Research & requirements | 1 | 2 |
| System design & wireframes | 3 | 1 |
| Database & API design + AWS setup | 4 | 1 |
| Auth + dual-role | 5 | 1 |
| Portfolio + discovery feed | 6 | 2 |
| Moodboards + brief + fit score | 7 | 1 |
| Project requests + proposals | 8 | 1 |
| Proposals + project creation | 8 | 1 |
| Project workspace + messaging | 9 | 2 |
| Stripe + S3 deliverables | 10 | 2 |
| Reviews + notifications | 11 | 1 |
| Testing & bug fixes | 12 | 1 |
| Evaluation + documentation | 13 | 1 |

### Supervisor checkpoints

| Week | Milestone |
|------|-----------|
| 2 | Proposal submitted (ELMS) |
| 4 | Design sign-off (diagrams + ER) |
| 7 | Discovery + moodboard demo |
| 11 | End-to-end workflow + Stripe test payment |
| 13 | Final submission |
