# Inside — Audit: attraction, neatness and AI

**Date:** 2026-11-17  
**Scope:** the web app (`apps/web`), the AI features in the API (`apps/api`), and how both come across to a supervisor or first-time user.  
**Method:** code review of every page and shared component, design-token usage counts across `app/` and `components/`, and a read-through of the AI services and their tests. Pages were not viewed in a browser for this audit, so visual findings come from the code and from screenshots shared during development. The mobile app is out of scope.

---

## 1. Summary

| Area | Rating | In one line |
|---|---|---|
| AI functionality | **Fair** | One real AI feature (the Gemini brief assistant) plus explainable designer matching. Both are well built, but the assistant is hidden whenever its key is missing, and nothing in the UI says "AI". |
| Attraction | **Good** | The home page and the marketplace pages are editorial and distinctive. The logged-in app is clean but plainer, and some public pages open with too much empty space. |
| Neatness | **Fair–Good** | Shared components (cards, badges, page headers, filters) are used widely. Spacing, corner radius and heading sizes drift between pages. |

**The three things that matter most before the supervisor sees it:**

1. **Make sure the AI is switched on and visible** (§2.3, A1–A2). If `GEMINI_API_KEY` isn't set on Render, the brief assistant silently disappears and the system appears to have no AI at all. It isn't set locally.
2. **Label the AI as AI** (§2.3, A2). The assistant is titled "Describe it in your own words" and the matching is "Designers matched to this brief". A reviewer looking for AI won't recognise either.
3. **Add one more visible AI feature** where it has the most effect (§2.4). The best option is "Best matches" for designers on Open Projects, which reuses the existing matching engine.

---

## 2. AI functionality

### 2.1 What exists

| Feature | Where | How it works | Kind |
|---|---|---|---|
| **Brief assistant** | `/briefs/new` → `BriefAssistant` component; API `POST /briefs/assistant` (`brief-assistant.service.ts`) | The client writes a few sentences. Google Gemini (`gemini-flash-latest`) returns rooms, styles, a budget range and a cleaned-up description as structured JSON, and the app fills in the brief form. | **Generative AI (LLM)** |
| **Designer matching** | Brief detail page, "Designers matched to this brief"; API `GET /match/designers?briefId=` (`matching.service.ts`) | A weighted score (style 35, room 30, budget 20, description 15) per designer, using their best-fitting published portfolio. The description part is TF-IDF cosine similarity between the brief and portfolio text (`text-similarity.ts`). Ties break on verification, then rating. | **Content-based recommendation** (classic information retrieval, not an AI model) |
| Style wizard | Moodboards, "Describe your style" | Guided questions: mood words, palette, love / not for me. | Rule-based UI, **not AI** |

### 2.2 What is done well

- **The assistant has safe guardrails.** Low temperature (0.2), a fixed JSON response schema, and every returned room and style checked against an allowlist. The budget is checked with a regex, the description is capped at 1,500 characters, and there's a 15-second timeout. The API limits it to 5 requests per user per minute.
- **It resists prompt injection.** The system instruction tells the model to treat the homeowner's text as data and ignore any instructions inside it.
- **It fails quietly.** Without a key the API reports `enabled: false` and the card hides. Provider errors become a friendly "not available right now".
- **The match scores explain themselves.** Each match shows a percentage plus a points bar for style, room, budget and description. The page says they are "suggestions only: you decide who to hire". This is a strong point for an academic review because the result can be justified line by line.
- **Matching respects trust and safety.** It skips the client's own portfolios, blocked users, suspended or unavailable designers, and unpublished work.
- **Both services have unit tests** (`brief-assistant.service.spec.ts`, `matching.service.spec.ts`).

### 2.3 Issues

| # | Issue | Impact | Fix |
|---|---|---|---|
| A1 | **The assistant depends on an optional key, and that key isn't set locally.** When it's missing, the whole card is hidden with no hint. | High: the only real AI feature may be invisible in the demo. | Set `GEMINI_API_KEY` on Render (free from Google AI Studio) and locally. When it's missing, show a disabled card that says the assistant is offline, rather than nothing. |
| A2 | **Nothing is labelled as AI.** The assistant reads as a normal form helper, and matching reads as a filter. | High for marking: the supervisor may not credit either. | Add a small "AI" badge and a sparkle icon to the assistant card and the match section. Add a "How matching works" note, and say "AI" in the How it works page and README. |
| A3 | **Matching is keyword-based.** TF-IDF only rewards shared words, so "cosy, warm timber" won't match a portfolio described as "snug, oak tones". | Medium: weaker matches on free-text descriptions. | Replace the description part with Gemini text embeddings (cosine similarity over vectors), keeping TF-IDF as the fallback when there's no key. Same weights and same explanation UI. |
| A4 | **The model is set to a moving alias** (`gemini-flash-latest`). | Medium: behaviour can change without a code change, which is risky before a demo. | Pin a specific model version in `GEMINI_MODEL` for the demo period. |
| A5 | **The assistant shows no reasoning.** The form changes, but the user can't see why a style was chosen. | Low–Medium: less trust and less "wow". | Return a one-line reason per suggested style and room, and show the filled fields highlighted for a moment. |
| A6 | **AI shows up in one place only**, at brief creation. Designers, the shop and moodboards have none. | Medium: AI looks like an add-on rather than part of the system. | See §2.4. |
| A7 | **AI use isn't measured.** There's no count of assistant uses, accepted suggestions or failures. | Low: hard to show evidence in the report. | Log anonymous counts (used, applied, failed) and show them on the admin overview. |

### 2.4 Recommended AI additions, in order of value for effort

1. **"Best matches" for designers on Open Projects** (small, uses only the existing engine). Run `MatchingService` in reverse: score each open request against the signed-in designer's portfolios. Add a "Best matches | Most recent" tab like Upwork's, with the same percentage and factor bars. It reuses existing code and is very visible.
2. **Moodboard image tagging with Gemini vision** (medium). When a client adds an image to a moodboard, suggest its style, room and dominant colours. This feeds straight into brief creation and matching.
3. **Proposal comparison summary** (medium). On a request with several proposals, add an AI paragraph comparing scope, timeline and cost, under the existing side-by-side table. Same guardrails as the assistant: JSON output, facts only from the proposals.
4. **Shop suggestions from a brief or moodboard** (small–medium). "Products that fit this brief", using the same style and room matching against `Product.style` and `category`.
5. **Semantic description matching** (small, see A3). Improves every recommendation at once.

Points 1 and 5 together would let the report describe a coherent "AI-assisted matching" layer that works in both directions (client → designer and designer → project) and uses semantic understanding.

---

## 3. Attraction (visual appeal)

### 3.1 Strengths

- **The home page is the strongest part of the product.** Editorial type (Inter Tight), a full-height hero with scroll zoom, counting stats, a spotlight carousel, an accordion of steps and a dark footer. It feels like a premium interiors brand rather than a template.
- **There's a clear brand palette** (deep green `brand`, sand, ink, soft tints), defined as Tailwind tokens and used throughout. The only hex colours in components are the style-wizard palette swatches (data) and the Open Graph image, both acceptable.
- **The marketplace pages are now distinct from each other.** Projects use full-image overlay cards, designers use profile cards with a cover strip, the shop uses framed product tiles, and Open Projects uses job cards with a slide-over detail panel.
- **Photography is consistent.** Real, checked Unsplash interiors throughout, all through `next/image` (26 uses, no raw `<img>`).
- **Motion respects user settings.** Reveal, count-up and scroll-scale all honour `prefers-reduced-motion`.

### 3.2 Issues

| # | Issue | Where | Fix |
|---|---|---|---|
| V1 | **Too much empty space under the header** on public list pages: `py-32 md:py-40` means 160px before the first content on desktop. Already fixed on the product detail page. | Shop, Open Projects, How it works, designer profile and portfolio detail (and their loading screens) | Use the product-page values (`pt-24 md:pt-28`) everywhere, ideally as one shared `page-top` class. |
| V2 | **The logged-in app is visually flatter than the public site.** The dashboard is tiles and lists only, with no imagery and no brand moment. | `/dashboard`, `/briefs`, `/projects`, `/requests` | Add a welcome banner like Upwork's "Get hired faster" panel: a brand-green card with one suggested action (start a brief / complete verification / see best matches). Show project cover images on project rows. |
| V3 | **The dashboard has two navigation systems**: the new left rail and the top header with messages, bell and avatar. | App shell | Fine as it is, but for a cleaner look, move messages and the bell into the rail's bottom group (as Upwork does) and keep only the avatar at the top-right. |
| V4 | **Empty states are text-only.** | Every `EmptyState` | Add a small line illustration or icon plus one action button (for example "Start a brief"). This is cheap and makes first use feel finished. |
| V5 | **There's no feedback after actions** such as save, send or approve, beyond inline text. There's no toast system (only 6 places use `role="status"`). | App-wide | Add one small toast component for success messages. |

---

## 4. Neatness (consistency and polish)

### 4.1 Strengths

- **Shared building blocks are widely used**: `PageHeader` (22 of 33 pages), `Card` and `cardSurface`, `Badge`, `FilterBar`, `Pagination`, `EmptyState`, `ErrorNotice`, `Skeleton`, `ConfirmDialog`.
- **Accessibility basics are in place**: a global `:focus-visible` style, a skip link, `aria-current` on navigation, dialogs that close on Esc, and labelled icon buttons.
- **There's no leftover debugging**: no `console.log` in the app code, no emoji in the UI, and no raw `<img>` tags.

### 4.2 Issues

| # | Issue | Evidence | Fix |
|---|---|---|---|
| N1 | **Page spacing differs from page to page.** | 10 different top and bottom padding combinations on `shell` containers (for example `py-32 md:py-40`, `pt-24 md:pt-28`, `pt-36 md:pt-44`, `py-10 md:py-12`). | Define two or three page-spacing classes (public, app, detail) and use only those. |
| N2 | **Corner radius differs on similar elements.** | `rounded-card` (49), `rounded-2xl` (13), `rounded-lg` (15), `rounded-xl` (6), `rounded-md` (7) are used for comparable boxes, tiles and chips. | Use `rounded-card` for cards and panels, `rounded-xl` for inner tiles and images, and `rounded-pill` for chips and badges. Remove the rest. |
| N3 | **Heading sizes differ.** | Page `<h1>`s use `text-section`, `text-4xl` and `text-3xl`. There are 12 one-off `text-[…]` sizes, 6 of them `clamp()` sizes on the home page. | Let `PageHeader` own all page titles. Add `display`/`section`/`title` type tokens and replace the one-off sizes. |
| N4 | **Tags have three styles**: the `Badge` component, sand `rounded-md` chips (shop and open projects) and bordered pills (designer specialities). | Product card, open-request card, designer card | Choose one tag style (suggested: sand `rounded-pill` chip) and make it a `Tag` component. |
| N5 | **Some pages don't handle a failed data load.** | The dashboard loads several lists but shows no error message if they fail. Admin section pages also show none of the shared loading or error components (the admin section components weren't read for this audit). | Use the same `ErrorNotice` plus retry pattern as Explore and Shop. |
| N6 | **Shadows are mixed.** | `shadow-lift` (12), `shadow-card` (4), plus plain Tailwind `shadow-lg` (5). | Use only the two tokens: `shadow-card` for resting and `shadow-lift` for hover and overlays. |

---

## 5. Prioritised actions

| Priority | Action | Refs | Effort |
|---|---|---|---|
| **P1** | Set `GEMINI_API_KEY` on Render and locally, and pin the model version | A1, A4 | 15 min |
| **P1** | Label the AI features (AI badge, "How matching works", README and How it works page) | A2 | 1–2 h |
| **P1** | Make page top spacing consistent on all public pages | V1, N1 | 1 h |
| **P2** | "Best matches" tab for designers on Open Projects (reverse matching) | §2.4.1 | 0.5–1 day |
| **P2** | Semantic (embedding) description matching with TF-IDF fallback | A3 | 0.5 day |
| **P2** | Dashboard welcome banner and project images | V2 | 2–3 h |
| **P2** | Settle on one radius, tag style, shadow and heading scale | N2–N4, N6 | 3–4 h |
| **P3** | Illustrated empty states and a success toast | V4, V5 | 2–3 h |
| **P3** | Moodboard image tagging (Gemini vision) or proposal comparison summary | §2.4.2–3 | 1 day each |
| **P3** | Error and retry states on the dashboard and admin pages | N5 | 1–2 h |
| **P3** | Count AI usage and show it on the admin overview | A7 | 2 h |

---

## 6. Not covered

- **Not viewed in a browser:** visual findings come from code and earlier screenshots. A walk-through at phone and desktop widths should confirm V1–V5.
- **Live configuration:** whether `GEMINI_API_KEY` is set on Render couldn't be checked from the repository.
- **Mobile app** (`apps/mobile`) and **performance** (Lighthouse, bundle size) weren't audited.
- **Security and payments** were covered in the earlier audit (2026-11-08) and weren't repeated here.
