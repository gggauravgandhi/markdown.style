# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

markdown.style turns LLM-generated markdown into styled, self-contained documents (HTML download or print-to-PDF), entirely in the browser. No backend, no upload. Live at https://markdown.style (GitHub Pages behind Cloudflare DNS; push to `main` deploys via `.github/workflows/deploy.yml` after tests + typecheck pass).

Three strictly separated layers:

- **Render pipeline** (`src/pipeline/`): markdown-it (+ footnote, task-lists, KaTeX, mermaid, shiki) → DOMPurify sanitize → assemble a self-contained HTML document. `render()` output must stay script-free and dependency-free: it IS the product.
- **Editor app** (`src/app/`, mounted from `editor.html`): vanilla TS, CodeMirror 6, dark chrome. `app.css` styles chrome only; documents are styled exclusively by themes.
- **Static site** (`index.html`, `src/site/`): marketing + SEO pages. `bun run build` = `vite build` **then** `bun scripts/build-pages.ts`, which renders per-theme samples/specimens and writes ~70 files into `dist/` (theme pages, hub, use-cases, convert hubs, and the three crawl files `sitemap.xml` / `robots.txt` / `llms.txt`). All three crawl files are generated from the registry and `routes.ts`, never hand-written; `public/` now holds only `CNAME` and `specimen-chart.svg`.
- **Themes** (`src/themes/`): `registry.ts` holds 30 themes across 6 categories (`category`, `featured` fields). Each theme is a standalone CSS file imported with `?raw`.

Design context lives in `PRODUCT.md` / `DESIGN.md` (root) and `docs/superpowers/{specs,plans}/`.

## Commands

- `bun run test`: full vitest suite. **NEVER bare `bun test`**: that runs Bun's own runner and produces ~27 false failures.
- `bun run test src/app/main.test.ts`: single file.
- `bunx tsc --noEmit`: typecheck (run before every commit).
- `bun run build` / `bun run dev` / `bun run preview`.
- bun for everything; never npm/npx/node/yarn.

## Hard Invariants (test-enforced; never weaken the tests)

- Preview iframe sandbox is exactly `allow-same-origin`: never add `allow-scripts`. Theme-thumb iframes use `sandbox=""`.
- Zero `<script>` (except JSON-LD) and zero external REQUESTS on marketing/generated pages (the AEO strategy). The privacy promise ("no analytics, no third-party requests") is load-bearing copy; analytics are Cloudflare edge-level only. "Request" means a fetch: `src`/`srcset` on any element, `href` on `<link>`. An `<a href>` to another origin is navigation on click, not a fetch, so the outbound GitHub link is allowed and the test is scoped accordingly.
- Registry: static `?raw` imports only; `scripts/build-pages.ts` runs under plain bun where Vite-isms (`import.meta.glob`) don't exist.
- Theme CSS contract: define `--mds-bg/--mds-fg/--mds-font-body/--mds-font-heading`, include `@media print`, no flex/grid on `.mds-content` (Paged.js), decorative `::before/::after` content uses alt-text syntax (`content: '# ' / ''`), web-safe fonts only. Dark themes (carbon, terminal, neon) flip light in print.
- Sample docs (`content/samples/`): no mermaid fences (mermaid needs a DOM; build-time render degrades to an error block). Math IS fine: KaTeX renders via `renderToString`, verified working under plain bun.
- NO EM DASHES ANYWHERE. Not in copy, UI strings, theme descriptions, samples, docs, commit messages, or code comments. Every file. Use a comma, a colon, parentheses, or two sentences. A test enforces this across the repo; write the character as the escape sequence `\u2014` inside that test so it does not flag itself.
- `bun run dev` serves ONLY index/editor/privacy/terms unless the dev middleware renders the generated pages. Vite's fallback silently returns index.html with a 200 for `/themes`, `/themes/*`, `/use-cases/*`, so a "page shows the wrong content" bug locally is usually this, not the page.
- Theme pages embed one full sample document plus one card per entry in `src/site/pages/specimens.ts` (source markdown left, rendered-in-theme right). Every specimen render is namespaced `specimen-<id>-fn*`, because markdown-it-footnote emits `id="fn1"` on every render and 16 embeds on one page would otherwise collide. Duplicate `id="fn1"` is a regression.
- Adding a component to the theme pages = one entry in `specimens.ts`. Nothing else. It must not be a mermaid fence (see above) and any image it references must exist in `public/` (test-enforced: a specimen once pointed at a nonexistent `/og.png` and shipped a broken image on all 30 pages with the suite green).
- Sitemap ≤ 50 URLs; landing strip = the six `featured` themes exactly.
- Never nest rendered markdown (it contains links) inside an `<a>`: parsers split the outer link. Hub previews demote inner anchors via `inertLinks()`; reuse it for any new linked preview.

## Code Style

- Vanilla TS, no framework. DOM built via the `el()` helper in `main.ts`; match that pattern.
- No new dependencies without explicit need (`@codemirror/language` and `@lezer/highlight` are deliberately declared transitives, not additions).
- Editor chrome follows DESIGN.md: flat, border-defined, one accent (`--app-accent`), dark text on accent fills, 150ms ease-out transitions with `prefers-reduced-motion` off-switch.
- Menus use the disclosure pattern (`aria-expanded` + `aria-controls`), not `role="menu"`.

## Testing

- TDD: failing test first, then implement. Tests are colocated `*.test.ts`; vitest + jsdom; `vitest.config.ts` needs `css: true` (`?raw` imports resolve empty without it) and excludes `.claude/**` (agent worktrees).
- jsdom gaps are polyfilled in `main.test.ts`'s `beforeEach` (Range APIs, `<dialog>` showModal); IntersectionObserver is absent, so the picker's eager fallback is the tested path.
- Adding a theme: CSS file + registry entry + `themeCopy` entry (1:1 test) + category count expectations; the end-to-end render test auto-covers new registry entries (a wrong `shikiTheme` string fails there).

## Behavioral Rules

- Adding routes/pages: everything derives from the registry and `routes.ts`: never hardcode counts in copy or tests (use `themes.length`; the "eight themes" regression test exists because stale counts shipped twice).
- Print/export behavior changes require checking both screen and `@media print` paths.
- `git push` to `main` is a production deploy: suite + typecheck locally first.
