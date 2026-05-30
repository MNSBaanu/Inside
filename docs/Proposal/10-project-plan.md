# Project Plan

**Development methodology:** Agile (sprint-based)

**Total duration:** 13 weeks

| Sprint | Activities | Duration |
|--------|------------|----------|
| Sprint 1 | Requirements gathering, domain research (Havenly, Decorilla, Houzz, etc.), technology evaluation, proposal | 2 weeks |
| Sprint 2 | System architecture, database design, UI wireframes, AWS/Stripe setup, web and mobile scaffolding | 2 weeks |
| Sprint 3 | Authentication, dual-role access, user profiles | 2 weeks |
| Sprint 4 | Portfolio discovery, moodboards, structured brief, fit scoring; web UI + mobile app shell | 2 weeks |
| Sprint 5 | Project requests, proposals, comparison view, messaging, notifications; mobile core flows | 2 weeks |
| Sprint 6 | Stage-gated workspace, deliverable versions, Stripe milestones, ledger, reviews, integration | 2 weeks |
| Sprint 7 | Testing, UAT, evaluation, bug fixes, documentation, deployment | 1 week |

### Key milestones

| Week | Milestone |
|------|-----------|
| 2 | Requirements and scope finalized; proposal on ELMS |
| 4 | Design sign-off; architecture diagrams exported |
| 6 | Auth and dual-role demonstrable |
| 8 | Discovery, moodboard, brief, and fit score demonstrable (web) |
| 10 | Request, proposal, and workspace flows working (web + mobile notifications) |
| 11 | End-to-end journey including Stripe test payment |
| 13 | Final testing, evaluation, dissertation, and demo |

---

## Evaluation plan

The dissertation will evaluate innovation beyond a generic marketplace through **brief quality**, **fit score usefulness**, and **stage-gated workflow** effectiveness.

| Criterion | Method | Target |
|-----------|--------|--------|
| Functional coverage | Checklist against objectives | ≥ 90% MVP features pass |
| End-to-end journey | Test scenarios: moodboard → brief → request → proposal → one milestone | All critical paths pass |
| Brief clarity | Likert survey (1–5): brief reflects moodboard; n = 3–5 volunteers | Mean ≥ 4 |
| Fit score usefulness | Compare user top-3 designer picks vs fit ranking; survey item | ≥ 70% alignment or mean ≥ 4 |
| Stage workflow | UAT: upload deliverable → approve → stage advances | Pass |
| Usability | SUS survey (3–5 participants) on core web tasks | Mean ≥ 68 |
| Payments | Stripe test payment vs ledger record | Amounts and status match |

---

## Gantt Chart

```mermaid
gantt
    title Interior Design Service Platform — 13-Week Plan
    dateFormat X
    axisFormat %s
    section Research
    Requirements and domain research    :a1, 0, 2
    section Design
    Architecture DB wireframes setup    :a2, 2, 2
    section Development
    Auth and dual-role                  :a3, 4, 2
    Discovery moodboard brief fit       :a4, 6, 2
    Requests proposals messaging        :a5, 8, 2
    Workspace payments ledger reviews   :a6, 10, 2
    section Close
    Testing UAT evaluation docs         :a7, 12, 1
```

![Project Gantt chart](diagrams/07-gantt-chart.png)

*Figure 3: Gantt chart — 13-week project schedule*

Export PNG to `diagrams/07-gantt-chart.png` via [diagrams-and-charts-guide.md](diagrams-and-charts-guide.md) or mermaid.live.
