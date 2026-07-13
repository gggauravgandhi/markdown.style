# Theme Expansion: 30 Categorized Themes

Owner-approved design (2026-07-11) for growing markdown.style from 8 themes to 30, organized into six use-case categories. Supersedes the original spec's 8-theme lineup and Plan 4b's 25-URL sitemap cap (both re-ruled by the owner in this design's Q&A).

## 1. Owner rulings

1. **Quality-first count:** ~30 genuinely distinct hand-crafted themes (8 existing + 22 new), not 50 systematic variants. Every theme must feel intentionally designed; no filler hue-spins.
2. **Six use-case categories:** Business & Reports, Technical & Docs, Academic & Research, Editorial & Longform, Minimal & Clean, Bold & Creative.
3. **SEO surface:** every theme gets its own `/themes/<id>` page and sitemap entry. Sitemap grows to ~40 URLs; the former ≤25 cap is re-ruled to ≤50.
4. **Landing strip:** shows exactly the six featured themes (one per category) plus a "Browse all 30 themes" link to `/themes`.
5. **Picker:** one scrollable dialog with six category sections and lazily rendered thumbnails.
6. **Delivery:** a single implementation plan (SDD), infrastructure + all 22 themes.

## 2. Data model (`src/themes/registry.ts`)

```ts
export type Category = 'business' | 'technical' | 'academic' | 'editorial' | 'minimal' | 'bold'

export const CATEGORY_LABELS: Record<Category, string> = {
  business: 'Business & Reports',
  technical: 'Technical & Docs',
  academic: 'Academic & Research',
  editorial: 'Editorial & Longform',
  minimal: 'Minimal & Clean',
  bold: 'Bold & Creative',
}

export interface Theme {
  id: string
  name: string
  description: string
  category: Category        // NEW
  featured?: true           // NEW, exactly one per category
  defaultAccent: string
  shikiTheme: string
  mermaidTheme: MermaidTheme
  css: string
}
```

- Registry stays one flat ordered array; `paper` stays first (pinned by test). New themes append after the existing eight, grouped by category in source order.
- Category grouping is always derived (`themes.filter(t => t.category === c)`); no per-category arrays.
- Every theme is a standalone `src/themes/<id>.css` with a static `?raw` import. **Static imports only**, the page generator runs under plain bun, where Vite-only mechanisms (`import.meta.glob`) do not exist.
- Existing themes' categories: slate, carbon → technical; scholar → academic; paper, editorial → editorial; swiss, contrast → minimal; pop → bold.
- Featured six: **boardroom** (business), **slate** (technical), **scholar** (academic), **paper** (editorial), **swiss** (minimal), **pop** (bold).

## 3. New theme roster (22)

Every stylesheet is authored in full in the implementation plan. Identity table (id / name / accent / shiki / mermaid / one-line identity, which also becomes the registry `description`):

### Business & Reports (+5; category currently empty)
| id | name | accent | shiki | mermaid | identity |
|---|---|---|---|---|---|
| boardroom | Boardroom | `#1f3a5f` | github-light | neutral | Confident corporate report: navy authority, disciplined ruled tables. |
| ledger | Ledger | `#1a5c3a` | everforest-light | forest | Financial-statement style: tabular numerals, hairline table rules. |
| briefing | Briefing | `#b3261e` | min-light | neutral | Consulting brief: numbered sections, decisive charcoal and signal red. |
| memo | Memo | `#4a4238` | solarized-light | neutral | Interoffice memo: small-caps headings, typewriter code, warm paper. |
| quarterly | Quarterly | `#7c2138` | rose-pine-dawn | neutral | Annual-report editorial: generous margins, burgundy headlines. |

### Technical & Docs (+3)
| id | name | accent | shiki | mermaid | identity |
|---|---|---|---|---|---|
| terminal | Terminal | `#d9930d` | vesper | dark | Amber phosphor terminal: monospace everything on near-black. |
| blueprint | Blueprint | `#1e4f91` | github-light | neutral | Engineering drawing: drafting blues, uppercase mono annotations. |
| manual | Manual | `#8a1f11` | github-light | neutral | Reference manual: man-page structure, no-nonsense hierarchy. |

### Academic & Research (+4)
| id | name | accent | shiki | mermaid | identity |
|---|---|---|---|---|---|
| thesis | Thesis | `#1e2f5e` | github-light | neutral | Dissertation formality: Times lineage, numbered headings, sober rules. |
| preprint | Preprint | `#1a4fd6` | min-light | neutral | LaTeX preprint: Computer Modern spirit, justified measure, hyperref links. |
| notebook | Notebook | `#2563eb` | catppuccin-latte | neutral | Lab notebook: ruled callouts, ballpoint-blue annotations. |
| lecture | Lecture | `#0f766e` | snazzy-light | neutral | Lecture notes: crisp sans, tinted key-point blocks. |

### Editorial & Longform (+3)
| id | name | accent | shiki | mermaid | identity |
|---|---|---|---|---|---|
| gazette | Gazette | `#9f1239` | github-light | neutral | Front-page gazette: condensed headlines, uppercase kickers, dense measure. |
| novella | Novella | `#6b4226` | solarized-light | neutral | Fiction manuscript: serene serif, first-line indents, zero clutter. |
| columnist | Columnist | `#be123c` | one-light | neutral | Opinion page: assertive pull-quote blockquotes, byline italics. |

### Minimal & Clean (+3)
| id | name | accent | shiki | mermaid | identity |
|---|---|---|---|---|---|
| mist | Mist | `#64748b` | min-light | neutral | Hairline minimal: feather rules, whispered hierarchy. |
| mono | Mono | `#374151` | min-light | neutral | Typewriter monospace: one family, two weights, zero decoration. |
| airy | Airy | `#6366f1` | min-light | neutral | Air and whitespace: a small text block adrift in generous margins. |

### Bold & Creative (+4)
| id | name | accent | shiki | mermaid | identity |
|---|---|---|---|---|---|
| neon | Neon | `#22d3ee` | synthwave-84 | dark | Electric dark: neon cyan on deep violet-black. |
| poster | Poster | `#ea580c` | min-light | neutral | Poster type: massive headlines, unapologetic scale jumps. |
| riso | Riso | `#ff4d6d` | catppuccin-latte | neutral | Risograph print: two-ink overprint charm, tinted paper. |
| retro | Retro | `#c2410c` | gruvbox-light-soft | forest | Warm 70s: burnt orange, mustard rules, rounded corners. |

Shiki names must exist in shiki's bundled theme set (existing lineup already uses this pattern; the every-theme-renders test fails on an unknown name). `mermaidTheme` values come from the `MermaidTheme` union (`'default' | 'dark' | 'neutral' | 'forest'`, verified in `src/pipeline/types.ts:16`).

## 4. Theme CSS contract

Every new stylesheet must satisfy the same contract the existing eight do (enforced by `src/themes/registry.test.ts` + `themes-render.test.ts`, extended per §7):

- Style the full document vocabulary: body text, h1–h6, links, lists, task-list checkboxes, tables, blockquotes, inline code, code blocks (shiki output), footnotes, horizontal rules, images, `.mds-math-block`, `.mds-error`.
- Respect the knob tokens: `--mds-accent` (seeded from `defaultAccent`), `--mds-font-scale`, `--mds-page-width`. Accent participates in the design (headings, rules, links, per theme intent); it never decorates arbitrarily.
- No flex/grid on the content wrapper (Paged.js constraint, existing test).
- Print rules: sensible `@page` margins; dark themes (terminal, neon) must define an explicit print treatment the way carbon does today (follow carbon's pattern).
- Any decorative `::before/::after` glyph carries empty alt text (`content: '…' / ''`), the carbon precedent.
- Self-contained: system/web-safe font stacks only, no imports, no external requests.

## 5. Editor picker (`src/app/main.ts`, `app.css`)

- Dialog becomes max-height ~80vh, `overflow-y: auto`, one `<h3>` per category (label from `CATEGORY_LABELS`), cards grouped beneath in registry order. Dialog header (title + Close) and active-card marking (`aria-current` + "· current") are preserved from the 2026-07-11 polish.
- **Lazy thumbnails:** each card mounts with an empty thumb iframe; an `IntersectionObserver` renders a card's thumbnail (same `render(THUMB_MARKDOWN, id)` as today) the first time it approaches the viewport, then unobserves it. When `IntersectionObserver` is undefined (jsdom), fall back to eager rendering of all thumbs so tests exercise the same DOM.
- Theme choice behavior (knobs reset, re-render, close) is unchanged.

## 6. Site surfaces (`src/site/pages/*`, `index.html`)

- **/themes hub:** six category sections, each a `<section>` with an `<h2>` (label + theme count) and an `id` anchor (`#business` …); card structure unchanged. Hub intro sentence updated for 30 themes.
- **Per-theme pages:** all 30 themes get `/themes/<id>` pages from the existing builder. `themeCopy` grows to 30 entries, 1:1 with the registry (enforced by test). New-theme prose: unique `title`, `metaDescription`, and 2–3 paragraph body each; tighter than the flagship eight, never templated boilerplate. Each page names its category and links its category anchor on the hub.
- **Sitemap:** grows to 40 URLs (18 current + 22 new theme pages). New cap assertion: ≤50.
- **Landing strip:** exactly the six featured themes (swatch + link + name structural sync test, evolved from the current all-themes version) plus a "Browse all 30 themes" link to `/themes`. The `featured` flag is the single source of truth.
- **Editor `?theme=` deep links** work for all 30 automatically (id validation is registry-driven).

## 7. Testing

- Registry: every theme has a valid category; ≥3 themes per category; exactly six `featured`, one per category; unique ids; paper still first.
- The existing every-theme-renders end-to-end test auto-covers all 30 (an unknown shiki name or broken CSS fails here).
- `themeCopy` 1:1 with registry ids (both directions).
- Hub: renders six sections with correct counts and anchors; every theme page emitted; sitemap count = 40 and cap ≤50.
- Landing: featured-six structural sync + browse-all link presence.
- Picker: sections render per category; eager fallback path renders all thumbs (jsdom); active-card marking still passes.
- Copy hygiene: no em dashes in UI strings. Registry `description` strings render in the picker and on site pages, so the 22 new descriptions use colons/commas (as in §3), and migrating the existing eight descriptions off em dashes is in scope for consistency.

## 8. Constraints and non-goals

- Static `?raw` imports only (bun + Vite dual resolution). No new dependencies. No changes to the render pipeline, sanitizer, or preview sandbox.
- Editor bundle grows ~45KB of raw CSS (30 × ~2KB); accepted.
- Build time: 30 sample renders during page generation; accepted.
- Sample documents on theme pages keep the Plan 4b bans (no mermaid, no math).
- **Out of scope:** per-category landing pages, theme search/filter UI, user-defined custom themes, reordering the existing eight, dark-mode variants of light themes.

## 9. Open questions

None. All rulings above were made by the owner on 2026-07-11.
