# -*- coding: utf-8 -*-
"""Update Checklist.docx to reflect real implementation progress."""
from docx import Document
from pathlib import Path

path = Path("Checklist.docx")
doc = Document(str(path))

REPLACEMENTS = {
    "☑  Last completed Step number: 8": "☑  Last completed Step number: 16",
    "☑  Current Step number: 9": "☑  Current Step number: 13",
    "☑  Today’s date: 2026-07-29": "☑  Today’s date: 2026-08-04",
    "☑  Today's date: 2026-07-29": "☑  Today’s date: 2026-08-04",
    "➜ NEXT: Step 9 — Start Sprint 1 (Auth)": (
        "➜ NEXT: Step 13 — Favourite (catch-up); then Matching → Requests. "
        "Auth/User/Portfolio/Moodboard/Brief done (Bearer JWT)."
    ),
}

COOKIE_OLD = "☐  On login, set JWT in httpOnly cookie (not JSON body for storage)"
COOKIE_NEW = (
    "☑  Auth tokens: Bearer access JWT in JSON + refresh token (Session hash); "
    "httpOnly cookies deferred"
)

PUBLIC_OLD = "☐  @Public() on register/login; global JWT guard elsewhere"
PUBLIC_NEW = (
    "☑  JWT on protected routes (JwtAuthGuard / ClientMode / DesignerMode); "
    "auth routes public"
)

SPRINT11 = {
    "☐  Features completed: _________________________________": (
        "☑  Features completed: Auth (register/login/refresh/logout/me/verify/"
        "forgot-reset); User profile + password + activeRole switch; Jest unit + e2e"
    ),
    "☐  Features postponed (+ why): _________________________": (
        "☑  Features postponed: httpOnly cookie JWT (Bearer chosen for Swagger); "
        "Postman collection export; global @Public decorator pattern"
    ),
    "☐  Bugs fixed: _________________________________________": (
        "☑  Bugs fixed: JWT_EXPIRES_IN honored; health checks DB; e2e uses inside_test"
    ),
    "☐  New backlog items: __________________________________": (
        "☑  New backlog items: Favourite module; Fit matching; Postman folders; "
        "optional cookie auth for web"
    ),
    "☐  Planning / Review / Retro done (dates): ______________": (
        "☑  Planning / Review / Retro done (dates): 2026-08-04 (progress sync)"
    ),
    "☐  Key retro action for next sprint: ____________________": (
        "☑  Key retro action for next sprint: Catch up Favourite then Matching; "
        "keep Swagger+Jest DoD per module"
    ),
}

MARK_DONE_IN_SECTIONS = {
    6: [
        ".gitignore covers .env, node_modules",
        "Add .editorconfig + Prettier",
        "Create local DB inside_dev",
        "Secrets only in .env — never commit keys",
        "Plan separate test DB name inside_test",
    ],
    9: [
        "NestJS auth module (controller, service, DTOs, JWT strategy/guard)",
        "POST /auth/register, /login, /logout; GET /auth/me",
        "bcrypt hash on register; same rounds on compare",
        "If in scope: forgot-password + reset-password",
        "Swagger: test happy path AND main error cases",
        "Prisma Studio: after each important API call",
        "Automated tests (planned → required by Step 44)",
    ],
    10: [
        "DONE: Step 9 Auth — register → login → /me → logout works",
        "Profile: get public profile; update own",
        "Dual-role: PATCH switch activeRole",
        "Account settings: change password",
        "Swagger: test happy path AND main error cases",
        "Prisma Studio: after each important API call",
        "Automated tests (planned → required by Step 44)",
    ],
    12: [
        "DONE: Auth + User modules",
        "Portfolio CRUD: designer owns create/update/delete",
        "Filter fields: style, roomType, budget",
        "Discovery: list/search",
        "Swagger: test happy path AND main error cases",
        "Prisma Studio: after each important API call",
        "Automated tests (planned → required by Step 44)",
    ],
    15: [
        "DONE: Auth + User",
        "Moodboard CRUD — client owns only",
        "Saved items: add/remove inspiration items",
        "Swagger: test happy path AND main error cases",
        "Prisma Studio: after each important API call",
        "Automated tests (planned → required by Step 44)",
    ],
    16: [
        "DONE: Moodboard module",
        "Structured brief: styles, rooms, budgetRange, description",
        "Link brief to moodboard",
        "Swagger: test happy path AND main error cases",
        "Prisma Studio: after each important API call",
        "Automated tests (planned → required by Step 44)",
    ],
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
    mapping = {
        "Step 6 —": 6,
        "Step 9 —": 9,
        "Step 10 —": 10,
        "Step 11 —": 11,
        "Step 12 —": 12,
        "Step 13 —": 13,
        "Step 14 —": 14,
        "Step 15 —": 15,
        "Step 16 —": 16,
        "Step 17 —": 17,
        "Step 18 —": 18,
    }
    for prefix, num in mapping.items():
        if text.startswith(prefix):
            return num
    if text.startswith("Step ") or text.startswith("PART "):
        return None
    return current


changed = 0
section: int | None = None

for p in doc.paragraphs:
    t = p.text
    if not t.strip():
        continue

    section = detect_section(t, section)
    new = t

    if t in REPLACEMENTS:
        new = REPLACEMENTS[t]
    elif t == COOKIE_OLD:
        new = COOKIE_NEW
    elif t == PUBLIC_OLD:
        new = PUBLIC_NEW
    elif section == 11 and t in SPRINT11:
        new = SPRINT11[t]
    elif "Images: Cloudinary (or placeholder URLs first)" in t and t.startswith("☐"):
        new = "☑  Images: placeholder URLs first (Cloudinary wire later); store URLs in DB"
    elif section == 14 and "Features completed:" in t and t.startswith("☐"):
        new = (
            "☑  Features completed: Portfolio CRUD + discovery filters + images "
            "(placeholder URLs); Favourite NOT done yet"
        )
    elif section == 14 and "Features postponed" in t and t.startswith("☐"):
        new = (
            "☑  Features postponed (+ why): Favourite (Step 13) — built Moodboard/Brief "
            "ahead; catch up Favourite next"
        )
    elif section == 14 and "Key retro action" in t and t.startswith("☐"):
        new = (
            "☑  Key retro action for next sprint: Complete Favourite before Matching / "
            "hiring APIs"
        )
    elif section == 18 and "Features completed:" in t and t.startswith("☐"):
        new = (
            "☑  Features completed: Moodboard CRUD + items; Brief CRUD + "
            "generate-from-moodboard; Jest/e2e"
        )
    elif section == 18 and "Features postponed" in t and t.startswith("☐"):
        new = (
            "☑  Features postponed (+ why): Matching/fit scoring (Step 17) — next after "
            "Favourite catch-up"
        )
    elif t.startswith("☐") and section in MARK_DONE_IN_SECTIONS:
        if "AuthZ check:" in t or "Postman:" in t or "Git committed" in t:
            pass
        else:
            for sub in MARK_DONE_IN_SECTIONS[section]:
                if sub in t:
                    new = set_checked(t)
                    break

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
