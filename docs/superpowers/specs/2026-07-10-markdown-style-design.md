# markdown.style — Design

**Date:** 2026-07-10
**Status:** Approved (brainstormed and section-approved in session; SEO strategy grounded in a 4-researcher workflow against primary sources)

## 1. Product & user flow

markdown.style is a free, public, frontend-only web tool: paste (or upload, or drag) markdown — typically LLM output — see a live styled preview, pick a theme, and export a designed document. The USP: LLMs produce great markdown; turning it into a presentable document today means asking the LLM to burn tokens generating HTML or settling for a plain white PDF. This tool applies a real theme client-side and outputs styled HTML or print-ready PDF.

**Core loop:**

1. User lands on the editor; a sample document is pre-loaded so first-time visitors see the value immediately.
2. Live preview renders with the current theme (debounced ~200ms on edits).
3. User picks a theme from a visual picker (thumbnail previews) and optionally adjusts three knobs: **accent color, font size, page width**.
4. Exports:
   - **Download HTML** — one self-contained .html file, identical anywhere, offline, zero JS inside.
   - **Print / Save as PDF** — same document opens in a clean tab, browser print dialog fires, per-theme print CSS gives clean page breaks.

Everything is client-side; the document never touches a server (stated on the landing page as a trust claim).

**v1 quality-of-life:** debounced autosave of content + theme + knobs to localStorage with restore on return; drag-and-drop .md/.txt/.markdown; copy-HTML-to-clipboard; "Reset to sample."

**Explicitly out of v1:** accounts, sharing links, multiple documents, custom theme editor, Paged.js page numbers (door left open — see §3), scroll-sync between panes, markdown-to-docx.

## 2. Architecture — the "one string" pipeline

The entire product hangs off one pure function:

```
render(markdown, themeId, knobs) → complete self-contained HTML document string
```

Three consumers guarantee preview ≡ download ≡ PDF:

| Consumer | Mechanism |
|---|---|
| Preview | Sandboxed `<iframe srcdoc>` — **no** `allow-scripts` (string contains zero JS by construction). Knob changes mutate CSS custom properties on the iframe document directly (no re-render); markdown edits re-render debounced. |
| Download | Same string saved as a Blob; filename from first h1, fallback `document.html`. |
| Print | `window.open()` a tab, write the same string, `print()` after `document.fonts.ready` + load. Never print from the preview iframe (cross-browser quirks). |

**Rendering pipeline inside `render()`:**

```
markdown-it (GFM: tables, task lists, strikethrough, autolink)
  ├─ raw HTML passthrough DISABLED (html: false)
  ├─ code fences → Shiki (static highlighted HTML, theme-matched palette)
  ├─ $..$ / $$..$$ → KaTeX (static HTML)
  └─ ```mermaid fences → Mermaid → inline static SVG
→ assembled: content + theme CSS + knob variables inlined into a full HTML doc
```

**Security stance (launch-blocking requirement):** the exported file is opened by third parties with full script rights, so it must be script-free *by construction*: `html: false` in markdown-it, all renderers emit static output only (HTML/SVG, zero runtime JS), plus a DOMPurify pass on the assembled body as belt-and-braces. The preview iframe never needs `allow-scripts`.

**Performance:** Shiki (with per-language lazy grammar loading), KaTeX, and Mermaid (~1MB) are dynamic `import()`s triggered only when the document content needs them; base app stays small. Preview re-render is debounced; heavy parse work may move to a worker if INP measurements demand it.

**Stack:** Vite + vanilla TypeScript (no UI framework — the shell has ~4 controls; Paged.js is orthogonal to UI framework). CodeMirror 6 for the editor pane. bun for package management/tooling.

## 3. Theme system

A theme is one CSS file plus a registry entry. No JS per theme.

```
themes/
  _base.css      # reset + shared structural rules + print scaffolding
  <name>.css     # per theme: custom properties + element styles
themes.ts        # registry: id, name, description, default accent, thumbnail
```

**Contract every theme implements:**

- Styles the full markdown element set: h1–h6, p, lists (incl. task lists), tables, blockquote, inline code + Shiki blocks, hr, links, images, KaTeX output, Mermaid SVG containers, footnotes.
- All tunable values route through CSS custom properties; the three knobs (`--accent`, `--font-scale`, `--page-width`) are variable overrides, identical across themes. `--page-width` sets content max-width for screen and exported HTML only; printed page size always comes from the browser's paper selection + the theme's `@page` margins.
- An `@media print` block: `@page` margins, `break-inside: avoid` on tables/code/figures, `break-after: avoid` on headings, print-safe colors.
- **Paged.js-ready constraint:** rendered content stays plain flowing block elements — no flex/grid wrappers around content blocks. v2 "pro print" (page numbers, running headers) then consumes the same HTML string.
- Shiki syntax palette and Mermaid color variables matched per theme.

**Launch set: 8 themes** with distinct visual personalities (not document types): clean editorial serif, modern sans product-doc, dark technical, warm paper, bold high-contrast, minimal Swiss, academic, colorful/friendly. Exact naming/design happens during implementation against real sample documents; those renders double as the theme-gallery pages (§6).

## 4. Export & print details

- **Self-contained HTML:** theme CSS + knob values inlined in `<style>`; Shiki output is pre-colored spans; Mermaid is inline SVG; proper `<title>` + `<meta charset>`. User-referenced remote images remain remote (noted in UI).
- **KaTeX fonts:** base64 woff2 inlined **only when the document contains math** (cheap content check); zero font weight otherwise.
- **Print:** print tab receives the same string; print CSS lives in each theme's `@media print` block; no app chrome exists in the string, so nothing to hide.

## 5. App shell & UI

Two-pane layout: CodeMirror 6 editor left, preview iframe right (stacked on mobile with a toggle). Top bar: theme picker (visual grid with live thumbnails), three knobs, Download HTML, Print/PDF, copy-HTML. That is the whole app.

- State (markdown, themeId, knobs) in one small store module; persisted to localStorage (debounced); restored on load.
- Upload via file input + drag-drop; read client-side.
- A11y basics: keyboard-reachable controls, labeled inputs, focus states, sufficient contrast in app chrome. Preview content contrast is the theme's responsibility.

## 6. SEO / AEO / GEO (traffic architecture)

Traffic strategy is organic (SEO + answer engines + LLM recommendation), so this is a first-class design concern, not a bolt-on.

**Governing constraint (verified 2026-07):** no major AI crawler (GPTBot, ClaudeBot, PerplexityBot) executes JavaScript. **Every citable page is static HTML generated at build time.** Only `/editor` is an SPA.

**Positioning:** hero message = "Turn your ChatGPT/Claude output into a designed report" — NOT "markdown to pdf" (contested head term: legacy converters + a well-optimized 2025–26 cohort). Research found the "single LLM answer → designed report" framing unclaimed as a hero message. "100% client-side / no upload / free" is a trust badge on every page (baseline in this niche, not a differentiator).

**Site structure at launch (~20–25 pages, cross-linked, zero orphans):**

| Route | Purpose |
|---|---|
| `/` | Landing: hero framing, how-it-works, trust badges, CTA to editor |
| `/editor` | The tool (SPA); own static `<head>`/canonical; path routing, never hash routing |
| `/themes` | Visual gallery hub — grid of rendered thumbnails |
| `/themes/<name>` ×8 | Full sample report statically rendered in that theme + who it suits + deep link into editor with theme pre-applied |
| `/use-cases/<x>` ×3–6 | Only genuinely distinct inputs (chatgpt-report, meeting-notes, readme…), each a real worked example (sample input + rendered output) |
| `/convert/markdown-to-pdf`, `/convert/markdown-to-html` | Exactly two hubs matching real outputs today; no synonym padding (doorway-page risk) |
| `/privacy`, `/terms` | Credibility for the "no upload" claim |
| `/sitemap.xml`, `/robots.txt` | Build-time generated |

**Structural synergy:** a build script feeds `content/themes.json` / `content/use-cases.json` through the product's own `render()` pipeline to emit these static pages — programmatic pages are literal product demos with genuinely unique rendered content, which keeps them on the right side of Google's scaled-content-abuse policy (verified against Google Search Central). Build-time constraint: Mermaid requires a browser DOM, so sample documents for static pages either avoid mermaid fences or embed pre-rendered SVG — the build script must not depend on a headless browser.

**Technical checklist:**

- JSON-LD: `WebApplication` (applicationCategory `DeveloperApplication`, `offers.price: 0`) + `Organization` + `WebSite`. **No** `aggregateRating`/`review` until genuine reviews exist. No `SearchAction`.
- OG/Twitter cards, 1200×630 image, absolute https URLs.
- robots.txt allows **all** crawlers — citation bots (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Claude-User) explicitly listed, training bots (GPTBot, ClaudeBot) allowed too (owner ruling 2026-07-10: allow all; training crawls may help LLM recommendation).
- Copy is answer-first: each page/section opens with a direct 1–2 sentence answer; H1s/titles/slugs use natural question language matching real queries.
- Core Web Vitals at architecture level: debounced (or worker-offloaded) preview re-render (INP), preload landing LCP font/element, reserve preview-pane layout space (CLS).
- llms.txt: ship as a 5-minute add; not a strategy (97% of published files get zero AI requests per Ahrefs 137K-domain study; Google explicitly doesn't read it).

**Research-backed DON'Ts:**

- No FAQPage/HowTo JSON-LD (Google removed FAQ rich results May 2026; controlled Ahrefs study shows zero AI-citation uplift). Use genuine prose Q&A headings instead.
- Don't lead with "markdown to pdf" / "markdown editor online" head terms.
- Don't compete on "chatgpt conversation to pdf" (whole-thread export, owned by others).
- Don't exceed ~25 programmatic pages at launch on a zero-authority domain (sitewide quality suppression risk).
- Don't fabricate ratings/reviews (manual-action risk).

**Post-launch roadmap (planned, not built):** Reddit/HN/Product Hunt genuine participation (highest-leverage GEO lever found); dedicated short pages for the "why does my markdown look ugly as PDF" cluster (broken tables/code blocks/page breaks); deliberate backlink earning; expand use-case/convert pages only as real features ship; add aggregateRating once genuine reviews exist; re-verify AI-crawler/CWV/schema guidance near launch (field shifts monthly).

## 7. Error handling

Policy: **no silent failures, no blank holes.**

- Mermaid syntax errors → visible inline error block in place of the diagram.
- KaTeX errors → raw TeX rendered with an error tint.
- Oversized input (>2MB) → warning, still attempts render.
- File-read failures → toast.
- localStorage full/unavailable → warn once, keep working without persistence.
- Export/print with empty document → friendly nudge, no empty file.
- `render()` never throws to the UI: returns a result with per-block error annotations.

## 8. Testing

- **Pipeline unit tests** (bulk of coverage): markdown → HTML snapshots per feature (GFM tables, task lists, code, math, mermaid fences, frontmatter stripping); **sanitization tests** with XSS vectors (script tags, event handlers, `javascript:` URLs) asserting script-free output; **export self-containment test** (no `<script>`, no external stylesheet/font URLs except user images).
- **Theme hygiene tests:** every registered theme defines required custom properties + `@media print` block; knobs apply across all themes.
- **Build tests:** static generation emits every registry route; sitemap matches emitted pages.
- Runner: vitest via bun. E2E/browser automation deferred (requires explicit owner go-ahead per environment rules); manual print-dialog QA across Chrome/Safari/Firefox before launch.

## 9. Hosting & deployment

Static host; recommendation **Cloudflare Pages** (free, edge-fast for CWV), Vercel/Netlify equivalent alternatives. Build = `bun run build` → pure static output. Domain `markdown.style` registration is owner's task.

## Decision log

| Decision | Ruling | Why |
|---|---|---|
| Audience | Public product | Owner ruling |
| Themes vs templates | Themes (element-level styling), no document templates | Owner ruling |
| Markdown features | GFM + Shiki highlighting + KaTeX + Mermaid at launch | Owner ruling — matches LLM output |
| PDF depth | Clean print CSS in v1; architecture Paged.js-ready for v2 | Owner ruling |
| Theme customization | Light knobs only: accent, font size, page width | Owner ruling |
| Stack | Vite + vanilla TS + CodeMirror 6, bun tooling | Advisor-endorsed; framework adds nothing to a 4-control shell |
| Parser | markdown-it + plugins | Faster single-pass; plugin coverage for all requirements |
| Highlighter | Shiki, lazy-loaded | Visual quality matches USP; static output exports cleanly |
| Print mechanism | window.open + write + print (never iframe print) | Advisor-flagged cross-browser quirks |
| Sanitization | html:false + static-output-only renderers + DOMPurify | Advisor-flagged launch blocker |
| SEO surface | ~20–25 static pages, themes/use-cases/convert, answer-first copy | Research workflow (4 researchers + synthesis, primary sources) |
