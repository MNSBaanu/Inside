# -*- coding: utf-8 -*-
"""Sync Checklist.docx to Phase 2 complete without rewriting per-step NEXT lines."""
from docx import Document
from pathlib import Path

path = Path("Checklist.docx")
doc = Document(str(path))

DONE_STEPS = set(range(6, 34))  # 6..33

SKIP_SUBSTRINGS = (
    "Postman:",
    "Stripe test checkout",
    "Stripe webhook",
    "Expo push",
    "Vercel",
    "Railway",
    "Sentry",
    "Playwright",
    "Vitest",
    "GitHub Actions",
    "Cloudinary upload working",  # launch checklist
)

SPRINT_CLOSES = {
    11: {
        "Features completed:": (
            "☑  Features completed: Auth (register/login/refresh/logout/me/verify/"
            "forgot-reset); User profile + password + activeRole; Jest unit + e2e"
        ),
        "Features postponed": (
            "☑  Features postponed: httpOnly cookie JWT (Bearer chosen for Swagger); "
            "Postman collection export"
        ),
        "Bugs fixed:": (
            "☑  Bugs fixed: JWT_EXPIRES_IN honored; health checks DB; e2e uses inside_test"
        ),
        "New backlog items:": (
            "☑  New backlog items: Postman folders; optional cookie auth for web Phase 3"
        ),
        "Planning / Review": "☑  Planning / Review / Retro done (dates): 2026-08-04",
        "Key retro action": (
            "☑  Key retro action for next sprint: Keep Swagger + Jest DoD per module"
        ),
    },
    14: {
        "Features completed:": (
            "☑  Features completed: Portfolio CRUD + discovery filters + images "
            "(placeholder URLs); Favourite CRUD (client mode)"
        ),
        "Features postponed": (
            "☑  Features postponed (+ why): Cloudinary uploads — placeholder URLs first"
        ),
        "Bugs fixed:": "☑  Bugs fixed: —",
        "New backlog items:": "☑  New backlog items: Cloudinary wire-up in Phase 3/5",
        "Planning / Review": "☑  Planning / Review / Retro done (dates): 2026-08-04",
        "Key retro action": (
            "☑  Key retro action for next sprint: Matching then hiring APIs"
        ),
    },
    18: {
        "Features completed:": (
            "☑  Features completed: Moodboard + Brief + Matching (fit score on the fly); "
            "Jest/e2e"
        ),
        "Features postponed": (
            "☑  Features postponed (+ why): none for this sprint scope"
        ),
        "Bugs fixed:": "☑  Bugs fixed: —",
        "New backlog items:": "☑  New backlog items: —",
        "Planning / Review": "☑  Planning / Review / Retro done (dates): 2026-08-04",
        "Key retro action": (
            "☑  Key retro action for next sprint: Requests + Proposals"
        ),
    },
    21: {
        "Features completed:": (
            "☑  Features completed: Requests (open/direct) + Proposals "
            "(submit/withdraw/reject/accept → Project + 5 stages); hiring e2e"
        ),
        "Features postponed": (
            "☑  Features postponed (+ why): none for this sprint scope"
        ),
        "Bugs fixed:": "☑  Bugs fixed: —",
        "New backlog items:": "☑  New backlog items: —",
        "Planning / Review": "☑  Planning / Review / Retro done (dates): 2026-08-04",
        "Key retro action": (
            "☑  Key retro action for next sprint: Workspace (stages, deliverables, messages)"
        ),
    },
    27: {
        "Features completed:": (
            "☑  Features completed: Projects, Stages (approve advances + payment stub), "
            "Deliverables (versioned), Messages, Notifications; workspace e2e"
        ),
        "Features postponed": (
            "☑  Features postponed (+ why): realtime/websockets; file storage beyond URL stubs"
        ),
        "Bugs fixed:": "☑  Bugs fixed: —",
        "New backlog items:": (
            "☑  New backlog items: WebSocket messaging optional for Phase 3/4"
        ),
        "Planning / Review": "☑  Planning / Review / Retro done (dates): 2026-08-05",
        "Key retro action": (
            "☑  Key retro action for next sprint: Payments stub + reviews + trust + admin"
        ),
    },
    33: {
        "Features completed:": (
            "☑  Features completed: MilestonePayment ledger stub (pay/release); Reviews; "
            "Report/Block; Verification queue; Admin suspend/reactivate + reports; "
            "Phase 2 API complete (70 unit + 14 e2e)"
        ),
        "Features postponed": (
            "☑  Features postponed (+ why): live Stripe keys/webhooks; Postman export; "
            "httpOnly cookies (Bearer kept)"
        ),
        "Bugs fixed:": (
            "☑  Bugs fixed: workspace e2e timeout; proposal notification wiring"
        ),
        "New backlog items:": (
            "☑  New backlog items: Step 34 Next.js web; Postman collection; Stripe later"
        ),
        "Planning / Review": "☑  Planning / Review / Retro done (dates): 2026-08-05",
        "Key retro action": (
            "☑  Key retro action for next sprint: Scaffold apps/web with Bearer API client"
        ),
    },
}

SPECIAL = {
    "☐  On login, set JWT in httpOnly cookie (not JSON body for storage)": (
        "☑  Auth tokens: Bearer access JWT in JSON + refresh token (Session hash); "
        "httpOnly cookies deferred"
    ),
    "☐  @Public() on register/login; global JWT guard elsewhere": (
        "☑  JWT on protected routes (JwtAuthGuard / ClientMode / DesignerMode / Admin); "
        "auth routes public"
    ),
}


def set_checked(text: str) -> str:
    if text.startswith("☐"):
        return "☑" + text[1:]
    return text


def apply_text(para, new: str) -> None:
    if para.runs:
        para.runs[0].text = new
        for r in para.runs[1:]:
            r.text = ""
    else:
        para.add_run(new)


def detect_section(text: str, current: int | None) -> int | None:
    for n in range(1, 48):
        if text.startswith(f"Step {n} —") or text.startswith(f"Step {n} "):
            return n
    if text.startswith("PART "):
        return None
    return current


changed = 0
section: int | None = None
in_where_i_am = False

for p in doc.paragraphs:
    t = p.text
    if not t.strip():
        continue

    if t.strip() == "Where I am now":
        in_where_i_am = True
        section = detect_section(t, section)
        continue

    if in_where_i_am:
        if t.startswith("PART "):
            in_where_i_am = False
        else:
            new = t
            if "Last completed Step number:" in t:
                new = "☑  Last completed Step number: 33"
            elif "Current Step number:" in t:
                new = "☑  Current Step number: 34"
            elif "Today" in t and "date:" in t:
                new = "☑  Today’s date: 2026-08-05"
            elif t.startswith("➜ NEXT:"):
                new = (
                    "➜ NEXT: Step 34 — Scaffold Next.js web (Phase 3). "
                    "Phase 2 API complete (Steps 9–33). "
                    "Auth = Bearer JWT + refresh (cookies deferred)."
                )
            if new != t:
                apply_text(p, new)
                changed += 1
            continue

    section = detect_section(t, section)
    new = t

    # Never rewrite per-step NEXT arrows (they document flow)
    if t.startswith("➜ NEXT:"):
        continue

    if t in SPECIAL:
        new = SPECIAL[t]
    elif section in SPRINT_CLOSES:
        for key, replacement in SPRINT_CLOSES[section].items():
            if key in t and (t.startswith("☐") or t.startswith("☑")):
                new = replacement
                break
    elif (
        t.startswith("☐")
        and section in DONE_STEPS
        and not any(s in t for s in SKIP_SUBSTRINGS)
    ):
        new = set_checked(t)
    elif "Images: Cloudinary (or placeholder URLs first)" in t and t.startswith("☐"):
        new = (
            "☑  Images: placeholder URLs first (Cloudinary wire later); store URLs in DB"
        )

    if new != t:
        apply_text(p, new)
        changed += 1

for table in doc.tables:
    for row in table.rows:
        for cell in row.cells:
            for para in cell.paragraphs:
                t = para.text
                if "httpOnly cookie JWT" in t:
                    apply_text(
                        para,
                        t.replace(
                            "httpOnly cookie JWT",
                            "Bearer JWT (access) + refresh token / Session "
                            "(cookies deferred)",
                        ),
                    )
                    changed += 1
                elif "XSS-safe; production pattern" in t:
                    apply_text(
                        para,
                        t.replace(
                            "XSS-safe; production pattern",
                            "Matches NestJS + Swagger; cookies optional later for web",
                        ),
                    )
                    changed += 1

doc.save(str(path))
print(f"Updated {changed} items in {path}")
