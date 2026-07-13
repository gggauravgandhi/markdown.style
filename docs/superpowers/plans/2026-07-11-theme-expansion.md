# Theme Expansion (30 Categorized Themes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow markdown.style from 8 to 30 hand-crafted document themes organized into six use-case categories, with a categorized picker, categorized /themes hub, per-theme SEO pages, and a featured-six landing strip.

**Architecture:** The registry (`src/themes/registry.ts`) gains `category` and `featured` fields; every surface derives grouping from the flat registry array. Each new theme is a standalone CSS file with a static `?raw` import (plain-bun page generation cannot use Vite-only mechanisms). The picker becomes a scrollable sectioned dialog with IntersectionObserver-lazy thumbnails; site pages and sitemap grow automatically from the registry.

**Tech Stack:** Vite + vanilla TypeScript, vitest (jsdom), bun. No new dependencies.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-11-theme-expansion-design.md` (owner-ruled 2026-07-11). Read nothing else for requirements.
- Run tests with `bun run test` (vitest). NEVER bare `bun test` (Bun's own runner, ~27 false failures).
- Typecheck with `bunx tsc --noEmit` before every commit.
- Static `?raw` CSS imports only in the registry. No `import.meta.glob`.
- Theme CSS contract (spec §4): define `--mds-bg`, `--mds-fg`, `--mds-font-body`, `--mds-font-heading` in `:root`; include an `@media print` block; style headings, links, blockquotes, hr, inline code, `pre`/`pre.shiki`, tables, list markers, `.footnotes`; no flex/grid on `.mds-content`; decorative `::before/::after` content uses alt-text syntax `content: '…' / ''`; system/web-safe font stacks only; dark themes must print light (follow carbon's `@media print` token-flip pattern).
- `defaultAccent` must match `/^#[0-9a-fA-F]{6}$/` (existing contract test).
- No em dashes in registry `description` strings or any new UI string. New `themeCopy` entries follow the existing house title pattern (`Name theme, tagline, markdown.style`), which is marketing copy, not UI chrome.
- `themeCopy.pairWith` may only reference theme ids already registered at that task's state (the builder crashes on unknown ids).
- Every task ends with `bun run test` fully green + `bunx tsc --noEmit` clean + a commit.
- Categories: `business | technical | academic | editorial | minimal | bold`; labels exactly "Business & Reports", "Technical & Docs", "Academic & Research", "Editorial & Longform", "Minimal & Clean", "Bold & Creative".
- Do not deploy to production between the Task 2 and Task 3 commits: index.html briefly links /themes/boardroom before that route exists.
- Final lineup: 30 themes, exactly 5 per category, exactly 6 featured (one per category: boardroom, slate, scholar, paper, swiss, pop). Sitemap ends at 40 URLs, cap assertion ≤50.

## File Structure

- `src/themes/registry.ts`, types, labels, all 30 entries (flat array, paper first).
- `src/themes/<id>.css` ×22 new, one standalone stylesheet per new theme.
- `src/themes/registry.test.ts`, lineup, category, featured, description-hygiene tests.
- `src/app/main.ts` + `src/app/app.css` + `src/app/main.test.ts`, sectioned lazy picker.
- `src/site/pages/copy.ts`, `themeCopy` grows to 30 (category batches append).
- `src/site/pages/theme-pages.ts`, hub category sections; theme-page category link; count-safe strings.
- `src/site/pages/pages.test.ts`, hub/sitemap assertions evolve (cap ≤50, derived counts).
- `index.html` + `src/site/site.test.ts`, featured-six strip + browse-all link.

---

### Task 1: Registry category model

**Files:**
- Modify: `src/themes/registry.ts`
- Test: `src/themes/registry.test.ts`

**Interfaces:**
- Consumes: existing `Theme` interface, `themes` array, `MermaidTheme`.
- Produces: `export type Category = 'business' | 'technical' | 'academic' | 'editorial' | 'minimal' | 'bold'`; `export const CATEGORY_LABELS: Record<Category, string>`; `Theme` gains `category: Category` and `featured?: true`. Later tasks rely on these exact names.

- [ ] **Step 1: Write the failing tests**

Replace the `ships the full launch lineup, paper first` test in `src/themes/registry.test.ts` and add a categories block. New/changed tests exactly:

```ts
// change the import line to:
import { baseCss, CATEGORY_LABELS, getTheme, themes } from './registry'

  it('keeps the original eight first, paper leading', () => {
    expect(themes.slice(0, 8).map(t => t.id)).toEqual([
      'paper', 'slate', 'carbon', 'swiss', 'contrast', 'editorial', 'scholar', 'pop',
    ])
  })

describe('categories', () => {
  it('every theme has a registered category', () => {
    for (const t of themes) expect(Object.keys(CATEGORY_LABELS), t.id).toContain(t.category)
  })

  it('featured themes are unique per category', () => {
    const featured = themes.filter(t => t.featured)
    expect(new Set(featured.map(t => t.category)).size).toBe(featured.length)
    expect(featured.length).toBeGreaterThanOrEqual(5)
  })

  it('descriptions carry no em dashes (UI copy rule)', () => {
    for (const t of themes) expect(t.description, t.id).not.toContain('\u2014')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/themes/registry.test.ts`
Expected: FAIL: `CATEGORY_LABELS` has no export; `category` undefined; descriptions contain em dashes.

- [ ] **Step 3: Implement the model**

In `src/themes/registry.ts`, insert after the imports (before `export interface Theme`):

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
```

Add to `interface Theme` after `description: string`:

```ts
  category: Category
  /** Exactly one theme per category carries this; it drives the landing strip. */
  featured?: true
```

Update the existing eight entries per this table (add `category:` after `description:`; add `featured: true,` where marked; rewrite `description` replacing the `, ` separator with `: ` so no em dash remains, keep every other word identical):

| id | category | featured |
|---|---|---|
| paper | editorial | yes |
| slate | technical | yes |
| carbon | technical | – |
| swiss | minimal | yes |
| contrast | minimal | – |
| editorial | editorial | – |
| scholar | academic | yes |
| pop | bold | yes |

- [ ] **Step 4: Run the full suite**

Run: `bun run test && bunx tsc --noEmit`
Expected: all green. Note: `src/site/site.test.ts` strip-sync iterates all themes against `index.html`, which still lists all eight, descriptions in `index.html` are NOT asserted, only swatch+link+name, so the description rewrite cannot break it.

- [ ] **Step 5: Commit**

```bash
git add src/themes/registry.ts src/themes/registry.test.ts
git commit -m "feat: add category model to theme registry"
```

---

### Task 2: Featured-six landing strip

**Files:**
- Modify: `index.html` (theme strip section), `src/site/site.test.ts` (registry-sync block)

**Interfaces:**
- Consumes: `themes`, `Theme.featured` from Task 1.
- Produces: `index.html` strip contains exactly six `<li>` entries (five existing featured + boardroom, which registers in Task 3) and a "Browse all 30 themes" link.

- [ ] **Step 1: Rewrite the sync test**

In `src/site/site.test.ts`, replace the `theme strip mirrors the registry exactly and links every theme page` test with:

```ts
  it('theme strip mirrors the featured lineup and links a browse-all page', () => {
    for (const t of themes.filter(t => t.featured)) {
      expect(html, t.id).toContain(
        `<span class="swatch" style="background:${t.defaultAccent}"></span><a href="/themes/${t.id}">${t.name}</a>`,
      )
    }
    expect(html.match(/class="swatch"/g)).toHaveLength(6) // the final featured count, boardroom included
    expect(html).toContain('Browse all 30 themes')
  })
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun run test src/site/site.test.ts`
Expected: FAIL: strip has 8 swatches and no browse-all line.

- [ ] **Step 3: Rewrite the strip in `index.html`**

In the theme-strip `<ul class="theme-strip">`: keep the existing `<li>` blocks for `paper`, `slate`, `scholar`, `swiss`, `pop` byte-identical except the description `<span class="desc">` text, which changes to the Task 1 colon-form description. Delete the `carbon`, `contrast`, `editorial` blocks. Add this block after `slate`'s, structurally identical to the other entries (boardroom ships in Task 3 with accent `#1f3a5f`):

```html
        <li><strong><span class="swatch" style="background:#1f3a5f"></span><a href="/themes/boardroom">Boardroom</a></strong><span class="desc">Confident corporate report: navy authority, disciplined ruled tables.</span></li>
```

Directly after the closing `</ul>` of the strip, update the existing browse-all line's text to exactly:

```html
    <p><a class="btn-ghost" href="/themes">Browse all 30 themes →</a></p>
```

Also update the two remaining "eight theme(s)" copy references elsewhere in index.html to thirty-based phrasing.

- [ ] **Step 4: Run the full suite**

Run: `bun run test && bunx tsc --noEmit`
Expected: green. The featured filter yields five themes today (boardroom not yet registered); its static strip entry is inert until Task 3 registers the theme, and `/themes/boardroom` only becomes a generated route then. The zero-orphans/internal-link test in `pages.test.ts` operates on generated routes and dist output, not on `index.html` targets, so the forward-reference cannot fail it; if any test does flag the boardroom href, STOP and report BLOCKED rather than weakening the test.

- [ ] **Step 5: Commit**

```bash
git add index.html src/site/site.test.ts
git commit -m "feat: landing strip shows the featured six with browse-all link"
```

---

### Task 3: Business & Reports batch (5 themes)

**Files:**
- Create: `src/themes/boardroom.css`, `src/themes/ledger.css`, `src/themes/briefing.css`, `src/themes/memo.css`, `src/themes/quarterly.css`
- Modify: `src/themes/registry.ts`, `src/site/pages/copy.ts`
- Test: `src/themes/registry.test.ts`

**Interfaces:**
- Consumes: `Category`, `featured` from Task 1; `ThemeCopy` interface in `copy.ts`.
- Produces: theme ids `boardroom`, `ledger`, `briefing`, `memo`, `quarterly` registered with matching `themeCopy` entries. Completes the featured six.

- [ ] **Step 1: Write the failing tests**

In `src/themes/registry.test.ts` `categories` block, replace the `featured themes are unique per category` test with, and add the counts test:

```ts
  it('exactly six featured themes, one per category', () => {
    const featured = themes.filter(t => t.featured)
    expect(featured.map(t => t.id).sort()).toEqual(['boardroom', 'paper', 'pop', 'scholar', 'slate', 'swiss'])
    expect(new Set(featured.map(t => t.category)).size).toBe(6)
  })

  it('category population matches the shipped roadmap', () => {
    const count = (c: string) => themes.filter(t => t.category === c).length
    expect(count('business')).toBe(5)
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/themes/registry.test.ts`
Expected: FAIL: no boardroom, business count 0.

- [ ] **Step 3: Create the five stylesheets**

Create `src/themes/boardroom.css`:

```css
/* Boardroom, confident corporate report. Navy authority, disciplined tables. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #1c2431;
  --mds-font-body: 'Avenir Next', 'Segoe UI', Frutiger, system-ui, sans-serif;
  --mds-font-heading: 'Avenir Next', 'Segoe UI', Frutiger, system-ui, sans-serif;
  --mds-muted: #5b6474;
  --mds-rule: #d8dde6;
  --mds-code-bg: #f3f5f9;
}

h1 { font-size: 2em; letter-spacing: -0.015em; color: var(--mds-accent); border-bottom: 3px double var(--mds-rule); padding-bottom: 0.35em; }
h2 { font-size: 1.4em; margin-top: 2.2em; color: var(--mds-accent); }
h3 { font-size: 1.12em; margin-top: 1.7em; }
h4, h5, h6 { font-size: 0.95em; color: var(--mds-muted); text-transform: uppercase; letter-spacing: 0.08em; }

a { color: var(--mds-accent); text-underline-offset: 2px; }

blockquote { margin: 1.5em 0; padding: 0.8em 1.2em; border: 1px solid var(--mds-rule); border-radius: 6px; color: var(--mds-muted); background: #fafbfd; }

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.87em; background: var(--mds-code-bg); padding: 0.15em 0.4em; border-radius: 4px; }
pre { border-radius: 6px; padding: 16px 20px; font-size: 0.87em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.5em 0; font-size: 0.93em; }
thead th { background: var(--mds-accent); color: #ffffff; }
th { text-align: left; padding: 9px 12px; }
td { border-bottom: 1px solid var(--mds-rule); padding: 9px 12px; }
tbody tr:nth-child(even) { background: #f6f8fb; }

ul, ol { padding-left: 1.6em; }
li { margin: 0.3em 0; }
li::marker { color: var(--mds-accent); }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print {
  body { font-size: 10.5pt; }
  thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

Create `src/themes/ledger.css`:

```css
/* Ledger, financial-statement style. Tabular numerals, hairline rules, closing lines. */
:root {
  --mds-bg: #fdfdfb;
  --mds-fg: #21261f;
  --mds-font-body: Charter, 'Bitstream Charter', 'Source Serif 4', Georgia, serif;
  --mds-font-heading: Charter, 'Bitstream Charter', Georgia, serif;
  --mds-muted: #6a7265;
  --mds-rule: #d9ded4;
  --mds-code-bg: #f2f4ee;
}

body { font-variant-numeric: tabular-nums; }

h1 { font-size: 1.85em; border-bottom: 3px double var(--mds-fg); padding-bottom: 0.35em; }
h2 { font-size: 1.35em; margin-top: 2.2em; letter-spacing: 0.01em; }
h3 { font-size: 1.1em; margin-top: 1.7em; }
h4, h5, h6 { font-size: 0.92em; color: var(--mds-muted); text-transform: uppercase; letter-spacing: 0.09em; }

a { color: var(--mds-accent); }

blockquote { margin: 1.5em 0; padding: 0.2em 1.2em; border-left: 1px solid var(--mds-fg); color: var(--mds-muted); }

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.86em; background: var(--mds-code-bg); padding: 0.15em 0.4em; border-radius: 3px; }
pre { border-radius: 4px; padding: 14px 18px; font-size: 0.86em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.5em 0; font-size: 0.92em; }
th { text-align: left; border-top: 1px solid var(--mds-fg); border-bottom: 1px solid var(--mds-fg); padding: 7px 12px; font-weight: 600; }
td { border-bottom: 1px solid var(--mds-rule); padding: 7px 12px; }
tbody tr:last-child td { border-bottom: 2px solid var(--mds-fg); }

ul, ol { padding-left: 1.6em; }
li { margin: 0.25em 0; }
li::marker { color: var(--mds-accent); }

.footnotes { font-size: 0.84em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { body { font-size: 10.5pt; } }
```

Create `src/themes/briefing.css`:

```css
/* Briefing, consulting brief. Numbered sections, decisive charcoal and signal red. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #2a2d31;
  --mds-font-body: 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif;
  --mds-font-heading: 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif;
  --mds-muted: #70757c;
  --mds-rule: #e1e3e6;
  --mds-code-bg: #f4f5f6;
}

body { counter-reset: mds-h2; }

h1 { font-size: 2.2em; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
h2 { font-size: 1.35em; font-weight: 700; margin-top: 2.4em; counter-increment: mds-h2; }
h2::before { content: counter(mds-h2) '.  ' / ''; color: var(--mds-accent); }
h3 { font-size: 1.1em; font-weight: 700; margin-top: 1.7em; }
h4, h5, h6 { font-size: 0.95em; color: var(--mds-muted); }

a { color: var(--mds-accent); }

blockquote { margin: 1.5em 0; padding: 0.9em 1.2em; background: var(--mds-code-bg); border-radius: 0; font-weight: 500; }

hr { border: 0; border-top: 2px solid var(--mds-fg); margin: 2.5em 0; width: 48px; margin-left: 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.86em; background: var(--mds-code-bg); padding: 0.15em 0.4em; border-radius: 3px; }
pre { border-radius: 4px; padding: 16px 20px; font-size: 0.86em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.5em 0; font-size: 0.92em; }
th { text-align: left; border-bottom: 2px solid var(--mds-fg); padding: 8px 12px; text-transform: uppercase; font-size: 0.85em; letter-spacing: 0.05em; }
td { border-bottom: 1px solid var(--mds-rule); padding: 8px 12px; }

ul, ol { padding-left: 1.5em; }
li { margin: 0.3em 0; }
li::marker { color: var(--mds-accent); font-weight: 700; }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { body { font-size: 10.5pt; } }
```

Create `src/themes/memo.css`:

```css
/* Memo, interoffice memo. Small-caps headings, typewriter code, warm paper. */
:root {
  --mds-bg: #faf8f4;
  --mds-fg: #33302b;
  --mds-font-body: Georgia, 'Times New Roman', serif;
  --mds-font-heading: Georgia, 'Times New Roman', serif;
  --mds-muted: #7d766c;
  --mds-rule: #ddd6ca;
  --mds-code-bg: #f1ede4;
}

h1 { font-size: 1.7em; text-transform: uppercase; letter-spacing: 0.12em; text-align: center; border-top: 2px solid var(--mds-fg); border-bottom: 2px solid var(--mds-fg); padding: 0.5em 0; }
h2 { font-size: 1.25em; margin-top: 2.2em; font-variant-caps: small-caps; letter-spacing: 0.04em; }
h3 { font-size: 1.05em; margin-top: 1.7em; font-variant-caps: small-caps; }
h4, h5, h6 { font-size: 0.95em; color: var(--mds-muted); font-style: italic; }

a { color: var(--mds-accent); }

blockquote { margin: 1.5em 0; padding: 0.8em 1.1em; border: 1px solid var(--mds-rule); color: var(--mds-muted); }

hr { border: 0; border-top: 1px solid var(--mds-fg); margin: 2.5em 0; }

code { font-family: 'Courier New', Courier, monospace; font-size: 0.92em; background: var(--mds-code-bg); padding: 0.1em 0.35em; }
pre { padding: 14px 18px; font-size: 0.92em; border: 1px solid var(--mds-rule); }
pre code { background: none; padding: 0; font-size: 1em; }

table { margin: 1.5em 0; font-size: 0.94em; }
th { text-align: left; border-bottom: 1px solid var(--mds-fg); padding: 7px 12px; font-variant-caps: small-caps; }
td { border-bottom: 1px dotted var(--mds-rule); padding: 7px 12px; }

ul, ol { padding-left: 1.7em; }
li { margin: 0.3em 0; }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { :root { --mds-bg: #ffffff; } body { font-size: 11pt; } }
```

Create `src/themes/quarterly.css`:

```css
/* Quarterly, annual-report editorial. Generous margins, burgundy headlines. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #262223;
  --mds-font-body: 'Palatino Linotype', Palatino, Georgia, serif;
  --mds-font-heading: Didot, 'Bodoni MT', 'Playfair Display', Georgia, serif;
  --mds-muted: #756a6e;
  --mds-rule: #e4dcdf;
  --mds-code-bg: #f6f2f4;
}

.mds-content { padding: 72px 32px 120px; }

h1 { font-size: 2.5em; font-weight: 400; letter-spacing: -0.01em; line-height: 1.08; color: var(--mds-accent); }
h1 + p { font-size: 1.15em; color: var(--mds-muted); }
h2 { font-size: 1.5em; font-weight: 500; margin-top: 2.6em; border-top: 1px solid var(--mds-accent); padding-top: 0.7em; }
h3 { font-size: 1.15em; margin-top: 1.8em; }
h4, h5, h6 { font-size: 0.95em; color: var(--mds-muted); text-transform: uppercase; letter-spacing: 0.1em; }

a { color: var(--mds-accent); }

blockquote { margin: 2em 0; padding: 0 1.4em; color: var(--mds-accent); font-size: 1.12em; font-style: italic; border-left: 1px solid var(--mds-accent); }

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 3em auto; width: 40%; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.85em; background: var(--mds-code-bg); padding: 0.15em 0.4em; border-radius: 4px; }
pre { border-radius: 6px; padding: 16px 20px; font-size: 0.85em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.8em 0; font-size: 0.92em; }
th { text-align: left; border-bottom: 1px solid var(--mds-accent); padding: 9px 12px; font-weight: 500; text-transform: uppercase; font-size: 0.82em; letter-spacing: 0.08em; }
td { border-bottom: 1px solid var(--mds-rule); padding: 9px 12px; }

ul, ol { padding-left: 1.6em; }
li { margin: 0.35em 0; }
li::marker { color: var(--mds-accent); }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3.5em; }

@media print { body { font-size: 11pt; } .mds-content { padding: 0; } }
```

- [ ] **Step 4: Register the five themes**

In `src/themes/registry.ts`: add imports (keep the import list alphabetical):

```ts
import boardroomCss from './boardroom.css?raw'
import briefingCss from './briefing.css?raw'
import ledgerCss from './ledger.css?raw'
import memoCss from './memo.css?raw'
import quarterlyCss from './quarterly.css?raw'
```

Append to the END of the `themes` array (after `pop`):

```ts
  {
    id: 'boardroom',
    name: 'Boardroom',
    description: 'Confident corporate report: navy authority, disciplined ruled tables.',
    category: 'business',
    featured: true,
    defaultAccent: '#1f3a5f',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: boardroomCss,
  },
  {
    id: 'ledger',
    name: 'Ledger',
    description: 'Financial-statement style: tabular numerals, hairline table rules.',
    category: 'business',
    defaultAccent: '#1a5c3a',
    shikiTheme: 'everforest-light',
    mermaidTheme: 'forest',
    css: ledgerCss,
  },
  {
    id: 'briefing',
    name: 'Briefing',
    description: 'Consulting brief: numbered sections, decisive charcoal and signal red.',
    category: 'business',
    defaultAccent: '#b3261e',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: briefingCss,
  },
  {
    id: 'memo',
    name: 'Memo',
    description: 'Interoffice memo: small-caps headings, typewriter code, warm paper.',
    category: 'business',
    defaultAccent: '#4a4238',
    shikiTheme: 'solarized-light',
    mermaidTheme: 'neutral',
    css: memoCss,
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    description: 'Annual-report editorial: generous margins, burgundy headlines.',
    category: 'business',
    defaultAccent: '#7c2138',
    shikiTheme: 'rose-pine-dawn',
    mermaidTheme: 'neutral',
    css: quarterlyCss,
  },
```

- [ ] **Step 5: Add the five themeCopy entries**

Append to `themeCopy` in `src/site/pages/copy.ts` (before the closing `]`):

```ts
  {
    id: 'boardroom',
    title: 'Boardroom theme, corporate report styling for markdown, markdown.style',
    description: 'See a full report rendered in Boardroom: navy corporate styling for board packs, client reports, and executive summaries. Free, in your browser.',
    h1: 'Boardroom, corporate polish for reports that go up the chain',
    intro: 'Boardroom dresses your markdown for the meeting that matters: a navy-anchored sans, filled table headers, and a double-ruled title. Below is a complete sample report rendered in it.',
    whoItSuits: 'Board packs, client deliverables, and executive summaries, documents where the reader judges rigor by presentation before reading a word.',
    pairWith: ['quarterly', 'slate'],
  },
  {
    id: 'ledger',
    title: 'Ledger theme, financial-statement styling for markdown, markdown.style',
    description: 'See a full report rendered in Ledger: accounting-style rules, tabular numerals, and closing lines for finance-flavored documents. Free, in your browser.',
    h1: 'Ledger, statement styling with numerals that line up',
    intro: 'Ledger borrows the discipline of a financial statement: tabular numerals, hairline rules, and a closing line under every table. Below is a complete sample rendered in it.',
    whoItSuits: 'Budget summaries, financial reviews, and quantitative status reports, any document where columns of numbers must read cleanly.',
    pairWith: ['boardroom', 'swiss'],
  },
  {
    id: 'briefing',
    title: 'Briefing theme, consulting-brief styling for markdown, markdown.style',
    description: 'See a full report rendered in Briefing: numbered sections and decisive charcoal-and-red styling for recommendations that need a verdict. Free, in your browser.',
    h1: 'Briefing, numbered sections that walk the reader to a verdict',
    intro: 'Briefing structures your markdown like a consulting deliverable: auto-numbered sections, a heavy title, and one signal color used sparingly. Below is a complete sample rendered in it.',
    whoItSuits: 'Recommendations, decision memos, and strategy briefs, documents built around a numbered argument rather than a narrative.',
    pairWith: ['boardroom', 'contrast'],
  },
  {
    id: 'memo',
    title: 'Memo theme, classic interoffice styling for markdown, markdown.style',
    description: 'See a full report rendered in Memo: centered memorandum title, small-caps headings, and typewriter code on warm paper. Free, in your browser.',
    h1: 'Memo, the interoffice classic, typeset properly',
    intro: 'Memo gives your markdown the calm authority of a well-run office: a ruled memorandum title, small-caps section heads, and typewriter code. Below is a complete sample rendered in it.',
    whoItSuits: 'Internal updates, policy notes, and one-page decisions, short documents that should feel official without feeling corporate.',
    pairWith: ['ledger', 'paper'],
  },
  {
    id: 'quarterly',
    title: 'Quarterly theme, annual-report styling for markdown, markdown.style',
    description: 'See a full report rendered in Quarterly: display serif headlines, burgundy rules, and annual-report generosity for milestone documents. Free, in your browser.',
    h1: 'Quarterly, annual-report elegance for milestone documents',
    intro: 'Quarterly sets your markdown like the front section of a good annual report: a display serif, burgundy overlines, and room to breathe. Below is a complete sample rendered in it.',
    whoItSuits: 'Quarterly reviews, investor updates, and year-in-review documents, reporting that doubles as a keepsake.',
    pairWith: ['boardroom', 'editorial'],
  },
```

- [ ] **Step 6: Run the full suite**

Run: `bun run test && bunx tsc --noEmit`
Expected: green, the end-to-end render test (`src/themes/themes-render.test.ts`) now covers 13 themes; a typo'd shiki name or broken CSS fails there.

- [ ] **Step 7: Commit**

```bash
git add src/themes/ src/site/pages/copy.ts
git commit -m "feat: add Business & Reports theme batch (boardroom, ledger, briefing, memo, quarterly)"
```

---

### Task 4: Sectioned lazy theme picker

**Files:**
- Modify: `src/app/main.ts` (buildThumbs), `src/app/app.css`
- Test: `src/app/main.test.ts`

**Interfaces:**
- Consumes: `CATEGORY_LABELS`, `Category`, `themes` from the registry; existing `themeCards`, `dialog`, `el()`, `markActiveCard()`, `initKnobControls()`, `preview` in `main.ts`.
- Produces: dialog content = per-category `<h3 class="theme-cat">` headings + cards; thumbnails fill lazily (IntersectionObserver) with an eager fallback when the API is undefined (jsdom).

- [ ] **Step 1: Extend the dialog test**

In `src/app/main.test.ts`, inside the `opens labelled, marks the active theme, and closes from its header` test, directly after the existing card-count `waitFor`, add:

```ts
    // one heading per populated category, cards grouped beneath
    expect(dialog.querySelectorAll('.theme-cat')).toHaveLength(new Set(themes.map(t => t.category)).size)
    // jsdom has no IntersectionObserver, so the eager fallback must fill every thumbnail
    await vi.waitFor(() => {
      for (const thumb of dialog.querySelectorAll<HTMLIFrameElement>('.theme-thumb')) {
        expect(thumb.srcdoc).toContain('<!doctype html>')
      }
    })
```

Also raise THIS test's timeout unconditionally now (the eager fallback renders every registered theme, growing to 30 by Task 10): add `20_000` as the third argument of the `it()` call, i.e. `it('opens labelled, marks the active theme, and closes from its header', async () => { ... }, 20_000)`. Do not raise global timeouts, and never weaken the all-thumbs assertion if it gets slow.

- [ ] **Step 2: Run it to verify it fails**

Run: `bun run test src/app/main.test.ts`
Expected: FAIL: no `.theme-cat` headings exist.

- [ ] **Step 3: Rewrite buildThumbs in `src/app/main.ts`**

Change the registry import line to:

```ts
import { CATEGORY_LABELS, themes, type Category } from '../themes/registry'
```

Replace the whole `let thumbsBuilt = false` + `async function buildThumbs …` block with:

```ts
  let thumbsBuilt = false
  async function fillThumb(card: Element): Promise<void> {
    const thumb = card.querySelector<HTMLIFrameElement>('.theme-thumb')
    const id = card.getAttribute('data-theme')
    if (!thumb || !id || thumb.srcdoc) return
    const { html } = await render(THUMB_MARKDOWN, id)
    thumb.srcdoc = html
  }
  async function buildThumbs(): Promise<void> {
    if (thumbsBuilt) return
    thumbsBuilt = true
    const cards: HTMLButtonElement[] = []
    for (const category of Object.keys(CATEGORY_LABELS) as Category[]) {
      const group = themes.filter(t => t.category === category)
      if (group.length === 0) continue
      themeCards.append(el('h3', { class: 'theme-cat' }, CATEGORY_LABELS[category]))
      for (const theme of group) {
        const card = el('button', { class: 'theme-card', 'data-theme': theme.id })
        const thumb = el('iframe', { sandbox: '', class: 'theme-thumb', title: `${theme.name} preview`, loading: 'lazy' })
        card.append(thumb, el('span', { class: 'theme-name' }, theme.name), el('span', { class: 'theme-desc' }, theme.description))
        themeCards.append(card)
        cards.push(card)
        card.addEventListener('click', () => {
          store.set({ themeId: theme.id, knobs: {} })
          initKnobControls()
          void preview.renderNow(store.get())
          dialog.close()
        })
      }
    }
    // jsdom and older engines: no IntersectionObserver, render everything now
    if (typeof IntersectionObserver === 'undefined') {
      await Promise.all(cards.map(fillThumb))
      return
    }
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          io.unobserve(entry.target)
          void fillThumb(entry.target)
        }
      },
      { root: dialog, rootMargin: '200px' },
    )
    for (const card of cards) io.observe(card)
  }
```

The security invariant is unchanged: thumb iframes keep `sandbox: ''` (no permissions at all). Do not touch the preview iframe.

- [ ] **Step 4: Style the sections in `src/app/app.css`**

Change `.theme-dialog` to scroll and give the header a sticky perch; add the category heading rule. Replace the current `.theme-dialog { … }` block and `.dialog-head { … }` line with:

```css
.theme-dialog {
  border: 1px solid var(--app-border); border-radius: 12px; background: var(--app-surface); color: var(--app-fg);
  display: none; padding: 16px; max-width: 760px; width: 90vw; max-height: 80vh; overflow-y: auto;
}
.dialog-head {
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: -16px; z-index: 1; background: var(--app-surface);
  padding: 16px 0 8px; margin: -16px 0 8px;
}
```

And append after `.theme-cards { … }`:

```css
.theme-cards .theme-cat {
  grid-column: 1 / -1; margin: 10px 0 0; font-size: 13px;
  text-transform: uppercase; letter-spacing: 0.08em; color: var(--app-muted); font-weight: 600;
}
```

- [ ] **Step 5: Run the full suite**

Run: `bun run test && bunx tsc --noEmit`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/app/main.ts src/app/app.css src/app/main.test.ts
git commit -m "feat: categorized theme picker with lazy thumbnails"
```

---

### Task 5: Categorized /themes hub, theme-page category link, sitemap cap

**Files:**
- Modify: `src/site/pages/theme-pages.ts`
- Test: `src/site/pages/pages.test.ts`

**Interfaces:**
- Consumes: `CATEGORY_LABELS`, `Category`, `themes` from the registry; existing `scopedSampleCss`, `pageShell`, `escapeHtml`, `themeCopy`.
- Produces: hub HTML with six category `<section id="<category>">` blocks; every theme page carries a category line linking `/themes#<category>`; sitemap cap test at ≤50.

- [ ] **Step 1: Update the tests**

In `src/site/pages/pages.test.ts`:

1. The test named `the hub previews all eight themes inline and links each theme page`: rename to `the hub previews every theme inline and links each theme page` and replace any hardcoded count (`8`, `eight`) with values derived from `themes.length`, the assertions must iterate the registry, not a literal list. Add to it:

```ts
      for (const category of Object.keys(CATEGORY_LABELS)) {
        expect(hub).toContain(`id="${category}"`)
        // labels contain '&', which the builder escapes to '&amp;'
        expect(hub).toContain(escapeHtml(CATEGORY_LABELS[category as Category]))
      }
```

(Adjust the local variable name to whatever the test calls the hub HTML; add `CATEGORY_LABELS` and `Category` to the test's registry import.)

2. Change the sitemap ceiling assertion from `expect(urls.length).toBeLessThanOrEqual(25)` to:

```ts
    expect(urls.length).toBeLessThanOrEqual(50) // re-ruled 2026-07-11 (theme expansion spec §1.3)
    expect(urls.length).toBe(4 + GENERATED_ROUTES.length) // '/', '/editor', '/privacy', '/terms' + generated
```

(Import `GENERATED_ROUTES` from `./routes` if the test file does not already.)

3. Add a new test to the same file (imports: `themeCopy` from `./copy`, `themes` from the registry):

```ts
  it('themeCopy is 1:1 with the registry', () => {
    expect(themeCopy.map(c => c.id).sort()).toEqual([...themes.map(t => t.id)].sort())
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test src/site/pages/pages.test.ts`
Expected: FAIL: hub has no category section ids.

- [ ] **Step 3: Rewrite `buildThemesHub` and touch `buildThemePage`**

In `src/site/pages/theme-pages.ts`, change the registry import to include the category exports:

```ts
import { CATEGORY_LABELS, getTheme, themes, type Category } from '../../themes/registry'
```

Replace `buildThemesHub` with:

```ts
export function buildThemesHub(samples: ReadonlyMap<string, string>): string {
  const card = (t: (typeof themes)[number]): string => `<li>
<a class="theme-card-link" href="/themes/${t.id}">
  <div class="mini-preview" aria-hidden="true">
    <div class="mds-theme-${t.id}"><div class="mds-content">
${samples.get(t.id) ?? ''}
    </div></div>
  </div>
  <span class="theme-card-meta"><strong>${escapeHtml(t.name)}</strong><span class="desc">${escapeHtml(t.description)}</span></span>
</a>
</li>`
  const sections = (Object.keys(CATEGORY_LABELS) as Category[])
    .map(category => {
      const group = themes.filter(t => t.category === category)
      if (group.length === 0) return ''
      return `<section aria-label="${escapeHtml(CATEGORY_LABELS[category])}" id="${category}">
  <h2>${escapeHtml(CATEGORY_LABELS[category])} (${group.length})</h2>
  <ul class="theme-grid">
${group.map(card).join('\n')}
  </ul>
</section>`
    })
    .filter(Boolean)
    .join('\n\n')
  const main = `<section class="hero" aria-label="Introduction" style="border-top:0">
  <h1>What do the markdown.style themes look like?</h1>
  <p class="lede">${themes.length} designed looks in six categories, each previewed below on the same real report. Click any theme for the full sample and a one-click way to apply it to your own markdown.</p>
</section>

${sections}

<section aria-label="Next steps">
  <h2>How do I use one of these on my own document?</h2>
  <p class="answer">Open any theme page and click “Use this theme”, or go straight to the <a href="/editor">editor</a> and paste your markdown, the theme picker previews every theme live. See a worked example: <a href="/use-cases/chatgpt-report">a ChatGPT research answer styled into a report</a>, or the two-step paths to <a href="/convert/markdown-to-pdf">PDF</a> and <a href="/convert/markdown-to-html">a single HTML file</a>.</p>
</section>`
  return pageShell({
    title: 'Themes, designed looks for LLM markdown, by category, markdown.style',
    description: 'Compare all markdown.style themes on the same real report, organized by use case: business reports, technical docs, academic papers, editorial longform, minimal, and bold.',
    path: '/themes',
    main,
    extraCss: themes.map(t => scopedSampleCss(t)).join('\n'),
  })
}
```

In `buildThemePage`, replace the line `<p><a class="btn-ghost" href="/themes">Browse all eight themes →</a></p>` with:

```ts
  <p class="answer">Part of the ${escapeHtml(CATEGORY_LABELS[theme.category])} collection: <a href="/themes#${theme.category}">see the rest of the category</a>.</p>
  <p><a class="btn-ghost" href="/themes">Browse all themes →</a></p>
```

- [ ] **Step 4: Run the full suite**

Run: `bun run test && bunx tsc --noEmit`
Expected: green. Then run `bun run build` once and confirm it completes (page generation now emits category sections).

- [ ] **Step 5: Commit**

```bash
git add src/site/pages/theme-pages.ts src/site/pages/pages.test.ts
git commit -m "feat: categorized themes hub and category links on theme pages"
```

---

### Task 6: Technical & Docs batch (3 themes)

**Files:**
- Create: `src/themes/terminal.css`, `src/themes/blueprint.css`, `src/themes/manual.css`
- Modify: `src/themes/registry.ts`, `src/site/pages/copy.ts`
- Test: `src/themes/registry.test.ts`

**Interfaces:**
- Consumes: Task 1 model; Task 3 established the batch pattern (imports alphabetical, entries appended to array end, copy appended).
- Produces: theme ids `terminal`, `blueprint`, `manual` registered with `themeCopy` entries.

- [ ] **Step 1: Extend the counts test**

In `src/themes/registry.test.ts`, inside `category population matches the shipped roadmap`, add:

```ts
    expect(count('technical')).toBe(5)
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun run test src/themes/registry.test.ts`
Expected: FAIL: technical is 2.

- [ ] **Step 3: Create the three stylesheets**

Create `src/themes/terminal.css`:

```css
/* Terminal, amber phosphor CRT. Monospace everything on near-black. Prints light. */
:root {
  --mds-bg: #171208;
  --mds-fg: #ecc372;
  --mds-font-body: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --mds-font-heading: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --mds-muted: #a68a4d;
  --mds-rule: #40331a;
  --mds-code-bg: #211a0c;
}

body { line-height: 1.6; }

h1 { font-size: 1.7em; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--mds-rule); padding-bottom: 0.4em; }
h1::before { content: '> ' / ''; color: var(--mds-accent); }
h2 { font-size: 1.3em; margin-top: 2.1em; }
h2::before { content: '>> ' / ''; color: var(--mds-accent); }
h3 { font-size: 1.1em; margin-top: 1.6em; }
h3::before { content: '>>> ' / ''; color: var(--mds-accent); }
h4, h5, h6 { font-size: 1em; color: var(--mds-muted); }

a { color: var(--mds-accent); }

blockquote { margin: 1.4em 0; padding: 0.6em 1em; border: 1px solid var(--mds-rule); color: var(--mds-muted); background: var(--mds-code-bg); }

hr { border: 0; border-top: 1px dashed var(--mds-rule); margin: 2em 0; }

code { font-size: 0.95em; background: var(--mds-code-bg); border: 1px solid var(--mds-rule); padding: 0.1em 0.35em; border-radius: 3px; }
pre { border-radius: 4px; padding: 14px 16px; font-size: 0.9em; }
pre code { background: none; border: 0; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.4em 0; font-size: 0.92em; }
th { text-align: left; border-top: 1px solid var(--mds-fg); border-bottom: 1px solid var(--mds-fg); padding: 7px 10px; }
td { border-bottom: 1px solid var(--mds-rule); padding: 7px 10px; }

ul, ol { padding-left: 1.8em; }
li { margin: 0.25em 0; }
li::marker { color: var(--mds-accent); }

.mds-error { background: #2b1408; border-color: #d9930d; color: #ecc372; }

.footnotes { font-size: 0.88em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print {
  /* CRT on screen, paper in hand */
  :root { --mds-bg: #ffffff; --mds-fg: #3a2f14; --mds-muted: #7a6a3e; --mds-rule: #ddd2b4; --mds-code-bg: #f7f3e6; }
  blockquote { background: #f7f3e6; }
  .mds-error { background: #fef2f2; border-color: #b91c1c; color: #7f1d1d; }
  body { font-size: 10pt; }
}
```

Create `src/themes/blueprint.css`:

```css
/* Blueprint, engineering drawing. Drafting blues, uppercase mono annotations. */
:root {
  --mds-bg: #f5f8fc;
  --mds-fg: #23324a;
  --mds-font-body: Verdana, Geneva, 'DejaVu Sans', system-ui, sans-serif;
  --mds-font-heading: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --mds-muted: #5e7191;
  --mds-rule: #c6d4e8;
  --mds-code-bg: #e9eff8;
}

body { font-size: calc(15px * var(--mds-font-scale)); }

h1 { font-size: 1.8em; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mds-accent); border: 2px solid var(--mds-accent); padding: 0.4em 0.6em; display: inline-block; }
h2 { font-size: 1.25em; margin-top: 2.2em; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mds-accent); border-bottom: 1px solid var(--mds-rule); padding-bottom: 0.3em; }
h3 { font-size: 1.05em; margin-top: 1.7em; text-transform: uppercase; letter-spacing: 0.04em; }
h4, h5, h6 { font-size: 0.9em; color: var(--mds-muted); text-transform: uppercase; }

a { color: var(--mds-accent); }

blockquote { margin: 1.5em 0; padding: 0.7em 1.1em; border: 1px dashed var(--mds-accent); color: var(--mds-muted); background: #ffffff; }

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.88em; background: var(--mds-code-bg); padding: 0.15em 0.4em; border-radius: 3px; }
pre { border-radius: 4px; padding: 14px 18px; font-size: 0.88em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.5em 0; font-size: 0.9em; background: #ffffff; }
th { text-align: left; border-top: 2px solid var(--mds-accent); border-bottom: 1px solid var(--mds-accent); padding: 7px 11px; text-transform: uppercase; font-size: 0.85em; letter-spacing: 0.05em; }
td { border-bottom: 1px solid var(--mds-rule); padding: 7px 11px; }

ul, ol { padding-left: 1.6em; }
li { margin: 0.3em 0; }
li::marker { color: var(--mds-accent); }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { :root { --mds-bg: #ffffff; } body { font-size: 10pt; } }
```

Create `src/themes/manual.css`:

```css
/* Manual, reference-manual structure. Man-page bones, no-nonsense hierarchy. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #24292f;
  --mds-font-body: Georgia, 'Times New Roman', serif;
  --mds-font-heading: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --mds-muted: #656d76;
  --mds-rule: #d8dee4;
  --mds-code-bg: #f4f6f8;
}

h1 { font-size: 1.9em; font-weight: 800; letter-spacing: -0.01em; }
h1::after { content: '(1)' / ''; color: var(--mds-muted); font-size: 0.5em; vertical-align: super; margin-left: 0.3em; font-weight: 400; }
h2 { font-size: 1.2em; font-weight: 800; margin-top: 2.3em; text-transform: uppercase; letter-spacing: 0.05em; }
h3 { font-size: 1.05em; font-weight: 700; margin-top: 1.7em; }
h4, h5, h6 { font-size: 0.95em; color: var(--mds-muted); font-weight: 700; }

a { color: var(--mds-accent); }

blockquote { margin: 1.5em 0; padding: 0.2em 1.2em; border-left: 3px solid var(--mds-rule); color: var(--mds-muted); }

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.86em; background: var(--mds-code-bg); padding: 0.15em 0.4em; border-radius: 4px; font-weight: 600; }
pre { border-radius: 6px; padding: 16px 20px; font-size: 0.86em; border-left: 3px solid var(--mds-accent); }
pre code { background: none; padding: 0; font-size: 1em; font-weight: 400; }
pre.shiki { border: 1px solid var(--mds-rule); border-left: 3px solid var(--mds-accent); }

table { margin: 1.5em 0; font-size: 0.93em; }
th { text-align: left; border-bottom: 2px solid var(--mds-fg); padding: 8px 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
td { border-bottom: 1px solid var(--mds-rule); padding: 8px 12px; }
tbody tr:nth-child(even) { background: #f8f9fa; }

ul, ol { padding-left: 1.7em; }
li { margin: 0.3em 0; }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { body { font-size: 10.5pt; } }
```

- [ ] **Step 4: Register the three themes**

Add imports (alphabetical): `blueprintCss from './blueprint.css?raw'`, `manualCss from './manual.css?raw'`, `terminalCss from './terminal.css?raw'`.

Append entries to the END of the `themes` array:

```ts
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Amber phosphor terminal: monospace everything on near-black.',
    category: 'technical',
    defaultAccent: '#d9930d',
    shikiTheme: 'vesper',
    mermaidTheme: 'dark',
    css: terminalCss,
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Engineering drawing: drafting blues, uppercase mono annotations.',
    category: 'technical',
    defaultAccent: '#1e4f91',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: blueprintCss,
  },
  {
    id: 'manual',
    name: 'Manual',
    description: 'Reference manual: man-page structure, no-nonsense hierarchy.',
    category: 'technical',
    defaultAccent: '#8a1f11',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: manualCss,
  },
```

- [ ] **Step 5: Add the three themeCopy entries**

Append to `themeCopy`:

```ts
  {
    id: 'terminal',
    title: 'Terminal theme, amber CRT styling for markdown, markdown.style',
    description: 'See a full report rendered in Terminal: amber-on-black monospace styling that flips to a light palette when printed. Free, in your browser.',
    h1: 'Terminal, amber phosphor for documents that live in the shell',
    intro: 'Terminal renders your markdown like a well-kept CRT: amber monospace on near-black, prompt-prefixed headings, and a print stylesheet that lands on paper in ink-friendly light. Below is a complete sample rendered in it.',
    whoItSuits: 'Runbooks, CLI documentation, and incident notes, documents whose readers already have a terminal open. Printing flips it light automatically.',
    pairWith: ['carbon', 'manual'],
  },
  {
    id: 'blueprint',
    title: 'Blueprint theme, engineering-drawing styling for markdown, markdown.style',
    description: 'See a full report rendered in Blueprint: drafting blues, boxed title, and uppercase annotations for specs and technical plans. Free, in your browser.',
    h1: 'Blueprint, drafting-table discipline for specs and plans',
    intro: 'Blueprint borrows the visual language of an engineering drawing: a boxed title block, uppercase mono annotations, and drafting blues on cool paper. Below is a complete sample rendered in it.',
    whoItSuits: 'Specs, architecture documents, and implementation plans, writing that describes something to be built and benefits from looking like it.',
    pairWith: ['slate', 'manual'],
  },
  {
    id: 'manual',
    title: 'Manual theme, reference-manual styling for markdown, markdown.style',
    description: 'See a full report rendered in Manual: man-page bones, bold sans headings, and code blocks that lead the page. Free, in your browser.',
    h1: 'Manual, reference styling with man-page bones',
    intro: 'Manual sets your markdown like documentation that has shipped with software for decades: uppercase section heads, a serif reading measure, and code that stands proud of the prose. Below is a complete sample rendered in it.',
    whoItSuits: 'API references, how-to guides, and README-grade documentation, anything a reader consults rather than reads cover to cover.',
    pairWith: ['slate', 'terminal'],
  },
```

- [ ] **Step 6: Run the full suite**

Run: `bun run test && bunx tsc --noEmit`
Expected: green (16 themes render end-to-end).

- [ ] **Step 7: Commit**

```bash
git add src/themes/ src/site/pages/copy.ts
git commit -m "feat: add Technical & Docs theme batch (terminal, blueprint, manual)"
```

---

### Task 7: Academic & Research batch (4 themes)

**Files:**
- Create: `src/themes/thesis.css`, `src/themes/preprint.css`, `src/themes/notebook.css`, `src/themes/lecture.css`
- Modify: `src/themes/registry.ts`, `src/site/pages/copy.ts`
- Test: `src/themes/registry.test.ts`

**Interfaces:**
- Consumes: Task 1 model; Task 3 batch pattern.
- Produces: theme ids `thesis`, `preprint`, `notebook`, `lecture` registered with `themeCopy` entries.

- [ ] **Step 1: Extend the counts test**

Add to `category population matches the shipped roadmap`:

```ts
    expect(count('academic')).toBe(5)
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun run test src/themes/registry.test.ts`
Expected: FAIL: academic is 1.

- [ ] **Step 3: Create the four stylesheets**

Create `src/themes/thesis.css`:

```css
/* Thesis, dissertation formality. Times lineage, numbered headings, sober rules. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #1d1d20;
  --mds-font-body: 'Times New Roman', Times, serif;
  --mds-font-heading: 'Times New Roman', Times, serif;
  --mds-muted: #5f5f66;
  --mds-rule: #d9d9de;
  --mds-code-bg: #f4f4f6;
}

body { counter-reset: mds-h2; }
p { text-align: justify; hyphens: auto; }

h1 { font-size: 1.8em; text-align: center; margin-bottom: 1.6em; }
h2 { font-size: 1.3em; margin-top: 2.4em; counter-increment: mds-h2; counter-reset: mds-h3; }
h2::before { content: counter(mds-h2) '.  ' / ''; }
h3 { font-size: 1.1em; margin-top: 1.8em; counter-increment: mds-h3; }
h3::before { content: counter(mds-h2) '.' counter(mds-h3) '  ' / ''; }
h4, h5, h6 { font-size: 1em; font-style: italic; font-weight: 600; }

a { color: var(--mds-accent); }

blockquote { margin: 1.5em 2em; padding: 0; border: 0; color: var(--mds-fg); font-size: 0.95em; }

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em auto; width: 30%; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.85em; background: var(--mds-code-bg); padding: 0.1em 0.35em; }
pre { padding: 14px 18px; font-size: 0.85em; border: 1px solid var(--mds-rule); }
pre code { background: none; padding: 0; font-size: 1em; }

table { margin: 1.6em 0; font-size: 0.92em; }
th { text-align: left; border-top: 2px solid var(--mds-fg); border-bottom: 1px solid var(--mds-fg); padding: 7px 12px; }
td { padding: 7px 12px; }
tbody tr:last-child td { border-bottom: 2px solid var(--mds-fg); }

ul, ol { padding-left: 1.8em; }
li { margin: 0.3em 0; }

.footnotes { font-size: 0.82em; border-top: 1px solid var(--mds-fg); margin-top: 3em; }

@media print { body { font-size: 11pt; } }
```

Create `src/themes/preprint.css`:

```css
/* Preprint, LaTeX spirit. Computer Modern lineage, booktabs tables, hyperref links. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #111114;
  --mds-font-body: 'Latin Modern Roman', 'Computer Modern', 'CMU Serif', Georgia, serif;
  --mds-font-heading: 'Latin Modern Roman', 'Computer Modern', 'CMU Serif', Georgia, serif;
  --mds-muted: #55555c;
  --mds-rule: #d6d6db;
  --mds-code-bg: #f5f5f7;
}

p { text-align: justify; hyphens: auto; }

h1 { font-size: 1.65em; text-align: center; font-weight: 700; margin-bottom: 1.4em; }
h1 + p { font-size: 0.95em; margin: 0 3em 2em; color: var(--mds-fg); }
h2 { font-size: 1.25em; margin-top: 2.2em; font-weight: 700; }
h3 { font-size: 1.05em; margin-top: 1.7em; font-weight: 700; font-style: italic; }
h4, h5, h6 { font-size: 1em; font-style: italic; }

a { color: var(--mds-accent); text-decoration: none; }
a:hover { text-decoration: underline; }

blockquote { margin: 1.4em 2.2em; padding: 0; border: 0; font-size: 0.93em; }

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.84em; background: var(--mds-code-bg); padding: 0.1em 0.3em; }
pre { padding: 12px 16px; font-size: 0.84em; border: 0; background: var(--mds-code-bg); }
pre code { background: none; padding: 0; font-size: 1em; }

table { margin: 1.6em auto; font-size: 0.9em; width: auto; min-width: 70%; }
th { text-align: left; border-top: 2px solid var(--mds-fg); border-bottom: 1px solid var(--mds-fg); padding: 6px 14px; }
td { padding: 6px 14px; }
tbody tr:last-child td { border-bottom: 2px solid var(--mds-fg); }

ul, ol { padding-left: 1.9em; }
li { margin: 0.25em 0; }

.footnotes { font-size: 0.82em; border-top: 1px solid var(--mds-fg); margin-top: 3em; }

@media print { body { font-size: 10.5pt; } }
```

Create `src/themes/notebook.css`:

```css
/* Notebook, lab notebook. Ruled callouts, ballpoint-blue annotations. */
:root {
  --mds-bg: #fffef8;
  --mds-fg: #2c2a24;
  --mds-font-body: 'Segoe UI', Seravek, system-ui, sans-serif;
  --mds-font-heading: 'Segoe UI', Seravek, system-ui, sans-serif;
  --mds-muted: #7b7668;
  --mds-rule: #e3ddc9;
  --mds-code-bg: #f4f1e4;
}

h1 { font-size: 1.9em; border-bottom: 2px solid var(--mds-accent); padding-bottom: 0.3em; }
h2 { font-size: 1.35em; margin-top: 2.2em; }
h2::after { content: '' / ''; display: block; width: 3.5em; border-bottom: 2px solid var(--mds-accent); padding-top: 0.15em; }
h3 { font-size: 1.1em; margin-top: 1.7em; color: var(--mds-accent); }
h4, h5, h6 { font-size: 0.95em; color: var(--mds-muted); }

a { color: var(--mds-accent); }

blockquote {
  margin: 1.5em 0; padding: 0.8em 1.1em; border: 1px dashed var(--mds-accent);
  background: #ffffff; color: var(--mds-fg); border-radius: 2px;
}

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.87em; background: var(--mds-code-bg); padding: 0.15em 0.4em; border-radius: 3px; }
pre { border-radius: 4px; padding: 14px 18px; font-size: 0.87em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.5em 0; font-size: 0.93em; background: #ffffff; }
th { text-align: left; border-bottom: 2px solid var(--mds-accent); padding: 8px 12px; }
td { border-bottom: 1px solid var(--mds-rule); padding: 8px 12px; }

ul, ol { padding-left: 1.6em; }
li { margin: 0.35em 0; }
li::marker { color: var(--mds-accent); }
input[type='checkbox'] { transform: scale(1.15); }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { :root { --mds-bg: #ffffff; } body { font-size: 10.5pt; } }
```

Create `src/themes/lecture.css`:

```css
/* Lecture, lecture notes. Crisp sans, tinted key-point blocks. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #212a28;
  --mds-font-body: Seravek, 'Gill Sans', 'Trebuchet MS', system-ui, sans-serif;
  --mds-font-heading: Seravek, 'Gill Sans', 'Trebuchet MS', system-ui, sans-serif;
  --mds-muted: #64716d;
  --mds-rule: #d9e2df;
  --mds-code-bg: #eef4f2;
}

h1 { font-size: 2em; letter-spacing: -0.01em; }
h2 { font-size: 1.35em; margin-top: 2.3em; display: inline-block; border-bottom: 3px solid var(--mds-accent); padding-bottom: 0.15em; }
h3 { font-size: 1.1em; margin-top: 1.7em; color: var(--mds-accent); }
h4, h5, h6 { font-size: 0.95em; color: var(--mds-muted); text-transform: uppercase; letter-spacing: 0.05em; }

a { color: var(--mds-accent); }

blockquote {
  margin: 1.5em 0; padding: 0.9em 1.2em; background: var(--mds-code-bg);
  border-radius: 6px; color: var(--mds-fg); font-weight: 500;
}

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.87em; background: var(--mds-code-bg); padding: 0.15em 0.4em; border-radius: 4px; }
pre { border-radius: 6px; padding: 15px 18px; font-size: 0.87em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.5em 0; font-size: 0.93em; }
th { text-align: left; background: var(--mds-code-bg); padding: 8px 12px; }
td { border-bottom: 1px solid var(--mds-rule); padding: 8px 12px; }

ul, ol { padding-left: 1.6em; }
li { margin: 0.35em 0; }
li::marker { color: var(--mds-accent); font-weight: 700; }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { body { font-size: 10.5pt; } }
```

- [ ] **Step 4: Register the four themes**

Add imports (alphabetical): `lectureCss from './lecture.css?raw'`, `notebookCss from './notebook.css?raw'`, `preprintCss from './preprint.css?raw'`, `thesisCss from './thesis.css?raw'`.

Append entries to the END of the `themes` array:

```ts
  {
    id: 'thesis',
    name: 'Thesis',
    description: 'Dissertation formality: Times lineage, numbered headings, sober rules.',
    category: 'academic',
    defaultAccent: '#1e2f5e',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: thesisCss,
  },
  {
    id: 'preprint',
    name: 'Preprint',
    description: 'LaTeX preprint: Computer Modern spirit, justified measure, hyperref links.',
    category: 'academic',
    defaultAccent: '#1a4fd6',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: preprintCss,
  },
  {
    id: 'notebook',
    name: 'Notebook',
    description: 'Lab notebook: ruled callouts, ballpoint-blue annotations.',
    category: 'academic',
    defaultAccent: '#2563eb',
    shikiTheme: 'catppuccin-latte',
    mermaidTheme: 'neutral',
    css: notebookCss,
  },
  {
    id: 'lecture',
    name: 'Lecture',
    description: 'Lecture notes: crisp sans, tinted key-point blocks.',
    category: 'academic',
    defaultAccent: '#0f766e',
    shikiTheme: 'snazzy-light',
    mermaidTheme: 'neutral',
    css: lectureCss,
  },
```

- [ ] **Step 5: Add the four themeCopy entries**

```ts
  {
    id: 'thesis',
    title: 'Thesis theme, dissertation styling for markdown, markdown.style',
    description: 'See a full report rendered in Thesis: Times lineage, numbered sections, and examiner-grade sobriety. Free, in your browser.',
    h1: 'Thesis, dissertation formality with numbered sections',
    intro: 'Thesis sets your markdown the way graduate schools expect: a Times lineage, automatically numbered sections, justified text, and rules that know when to stop. Below is a complete sample rendered in it.',
    whoItSuits: 'Dissertations, formal literature reviews, and committee-bound documents, writing that will be judged by people who notice margins.',
    pairWith: ['scholar', 'preprint'],
  },
  {
    id: 'preprint',
    title: 'Preprint theme, LaTeX-style markdown rendering, markdown.style',
    description: 'See a full report rendered in Preprint: Computer Modern spirit, booktabs tables, and hyperref-blue links without touching LaTeX. Free, in your browser.',
    h1: 'Preprint, the LaTeX look without the LaTeX',
    intro: 'Preprint borrows what people love about a good arXiv paper: the Computer Modern voice, centered booktabs tables, and quiet blue links. Below is a complete sample rendered in it.',
    whoItSuits: 'Research notes, paper drafts, and technical writeups for readers who live on arXiv, when the content is markdown but the audience expects LaTeX.',
    pairWith: ['thesis', 'scholar'],
  },
  {
    id: 'notebook',
    title: 'Notebook theme, lab-notebook styling for markdown, markdown.style',
    description: 'See a full report rendered in Notebook: warm ruled paper, dashed annotation boxes, and ballpoint-blue accents. Free, in your browser.',
    h1: 'Notebook, a lab notebook that keeps itself legible',
    intro: 'Notebook styles your markdown like a well-kept lab book: warm paper, ballpoint-blue rules, and dashed boxes where observations get taped in. Below is a complete sample rendered in it.',
    whoItSuits: 'Experiment logs, research journals, and working notes, documents that grow daily and still need to read cleanly at review time.',
    pairWith: ['lecture', 'slate'],
  },
  {
    id: 'lecture',
    title: 'Lecture theme, lecture-notes styling for markdown, markdown.style',
    description: 'See a full report rendered in Lecture: crisp humanist sans, tinted key-point blocks, and headings that underline themselves. Free, in your browser.',
    h1: 'Lecture, notes that teach as clearly as they read',
    intro: 'Lecture turns your markdown into the notes everyone borrows before the exam: a crisp humanist sans, tinted key-point blocks, and short accent underlines that keep sections scannable. Below is a complete sample rendered in it.',
    whoItSuits: 'Course notes, tutorials, and study guides, explanatory writing where the key point must be findable in three seconds.',
    pairWith: ['notebook', 'scholar'],
  },
```

- [ ] **Step 6: Run the full suite**

Run: `bun run test && bunx tsc --noEmit`
Expected: green (20 themes render end-to-end).

- [ ] **Step 7: Commit**

```bash
git add src/themes/ src/site/pages/copy.ts
git commit -m "feat: add Academic & Research theme batch (thesis, preprint, notebook, lecture)"
```

---

### Task 8: Editorial & Longform batch (3 themes)

**Files:**
- Create: `src/themes/gazette.css`, `src/themes/novella.css`, `src/themes/columnist.css`
- Modify: `src/themes/registry.ts`, `src/site/pages/copy.ts`
- Test: `src/themes/registry.test.ts`

**Interfaces:**
- Consumes: Task 1 model; Task 3 batch pattern.
- Produces: theme ids `gazette`, `novella`, `columnist` registered with `themeCopy` entries.

- [ ] **Step 1: Extend the counts test**

```ts
    expect(count('editorial')).toBe(5)
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun run test src/themes/registry.test.ts`
Expected: FAIL: editorial is 2.

- [ ] **Step 3: Create the three stylesheets**

Create `src/themes/gazette.css`:

```css
/* Gazette, front page. Condensed headlines, uppercase kickers, dense measure. */
:root {
  --mds-bg: #fdfcf9;
  --mds-fg: #191817;
  --mds-font-body: Georgia, 'Times New Roman', serif;
  --mds-font-heading: 'Helvetica Neue', 'Arial Narrow', Arial, sans-serif;
  --mds-muted: #6e6a63;
  --mds-rule: #d8d4cb;
  --mds-code-bg: #f2f0ea;
}

body { font-size: calc(15px * var(--mds-font-scale)); line-height: 1.55; }

h1 { font-size: 2.6em; font-weight: 800; letter-spacing: -0.025em; line-height: 1.02; border-bottom: 4px double var(--mds-fg); padding-bottom: 0.3em; }
h2 { font-size: 1.45em; font-weight: 800; letter-spacing: -0.01em; line-height: 1.1; margin-top: 2em; }
h3 { font-size: 0.95em; font-weight: 700; margin-top: 1.8em; text-transform: uppercase; letter-spacing: 0.12em; color: var(--mds-accent); }
h4, h5, h6 { font-size: 0.95em; font-weight: 700; }

a { color: var(--mds-accent); }

blockquote { margin: 1.4em 0; padding: 0.3em 1.1em; border-left: 3px solid var(--mds-fg); font-style: italic; }

hr { border: 0; border-top: 1px solid var(--mds-fg); margin: 2em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.85em; background: var(--mds-code-bg); padding: 0.1em 0.35em; }
pre { padding: 13px 16px; font-size: 0.85em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.4em 0; font-size: 0.9em; }
th { text-align: left; border-top: 2px solid var(--mds-fg); border-bottom: 1px solid var(--mds-fg); padding: 6px 10px; font-family: 'Helvetica Neue', Arial, sans-serif; text-transform: uppercase; font-size: 0.82em; letter-spacing: 0.06em; }
td { border-bottom: 1px solid var(--mds-rule); padding: 6px 10px; }

ul, ol { padding-left: 1.5em; }
li { margin: 0.25em 0; }

.footnotes { font-size: 0.82em; color: var(--mds-muted); border-top: 1px solid var(--mds-fg); margin-top: 2.6em; }

@media print { :root { --mds-bg: #ffffff; } body { font-size: 9.5pt; } }
```

Create `src/themes/novella.css`:

```css
/* Novella, fiction manuscript. Serene serif, first-line indents, zero clutter. */
:root {
  --mds-bg: #fffdf9;
  --mds-fg: #2e2a26;
  --mds-font-body: 'Palatino Linotype', Palatino, Georgia, serif;
  --mds-font-heading: 'Palatino Linotype', Palatino, Georgia, serif;
  --mds-muted: #837a70;
  --mds-rule: #e6ded1;
  --mds-code-bg: #f5f0e6;
}

body { line-height: 1.8; }
p + p { text-indent: 1.6em; margin-top: -0.6em; }

h1 { font-size: 1.9em; font-weight: 400; text-align: center; letter-spacing: 0.02em; margin-bottom: 2em; }
h2 { font-size: 1.3em; font-weight: 400; text-align: center; margin-top: 3em; letter-spacing: 0.05em; }
h2::before { content: '❦' / ''; display: block; color: var(--mds-accent); font-size: 0.85em; padding-bottom: 0.6em; }
h3 { font-size: 1.05em; font-weight: 600; margin-top: 2em; font-style: italic; }
h4, h5, h6 { font-size: 1em; font-style: italic; font-weight: 400; color: var(--mds-muted); }

a { color: var(--mds-accent); text-decoration-thickness: 1px; text-underline-offset: 3px; }

blockquote { margin: 1.8em 2em; padding: 0; border: 0; font-style: italic; color: var(--mds-muted); }

hr { border: 0; text-align: center; margin: 2.6em 0; }
hr::after { content: '· · ·' / ''; color: var(--mds-muted); letter-spacing: 0.6em; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.85em; background: var(--mds-code-bg); padding: 0.1em 0.35em; border-radius: 3px; }
pre { padding: 14px 18px; font-size: 0.85em; border-radius: 4px; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.6em 0; font-size: 0.93em; }
th { text-align: left; border-bottom: 1px solid var(--mds-fg); padding: 7px 12px; font-style: italic; font-weight: 600; }
td { border-bottom: 1px solid var(--mds-rule); padding: 7px 12px; }

ul, ol { padding-left: 1.7em; }
li { margin: 0.3em 0; }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { :root { --mds-bg: #ffffff; } body { font-size: 11.5pt; } }
```

Create `src/themes/columnist.css`:

```css
/* Columnist, opinion page. Assertive pull-quote blockquotes, byline italics. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #1f1c1c;
  --mds-font-body: Georgia, 'Times New Roman', serif;
  --mds-font-heading: Georgia, 'Times New Roman', serif;
  --mds-muted: #6f6664;
  --mds-rule: #e2dbd9;
  --mds-code-bg: #f5f1f0;
}

h1 { font-size: 2.3em; font-weight: 700; letter-spacing: -0.02em; line-height: 1.08; }
h1 + p { font-style: italic; color: var(--mds-muted); }
h2 { font-size: 1.4em; margin-top: 2.3em; }
h3 { font-size: 1.1em; margin-top: 1.7em; font-style: italic; }
h4, h5, h6 { font-size: 0.95em; color: var(--mds-muted); text-transform: uppercase; letter-spacing: 0.08em; }

a { color: var(--mds-accent); }

blockquote {
  margin: 2em 0; padding: 0.4em 0 0.4em 1.4em; border-left: 4px solid var(--mds-accent);
  font-size: 1.25em; line-height: 1.45; font-style: italic; color: var(--mds-fg);
}

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em auto; width: 25%; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.85em; background: var(--mds-code-bg); padding: 0.12em 0.35em; border-radius: 3px; }
pre { padding: 14px 18px; font-size: 0.85em; border-radius: 4px; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.5em 0; font-size: 0.93em; }
th { text-align: left; border-bottom: 2px solid var(--mds-accent); padding: 8px 12px; }
td { border-bottom: 1px solid var(--mds-rule); padding: 8px 12px; }

ul, ol { padding-left: 1.6em; }
li { margin: 0.3em 0; }
li::marker { color: var(--mds-accent); }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { body { font-size: 11pt; } blockquote { font-size: 1.15em; } }
```

- [ ] **Step 4: Register the three themes**

Imports (alphabetical): `columnistCss from './columnist.css?raw'`, `gazetteCss from './gazette.css?raw'`, `novellaCss from './novella.css?raw'`.

Append to the `themes` array:

```ts
  {
    id: 'gazette',
    name: 'Gazette',
    description: 'Front-page gazette: condensed headlines, uppercase kickers, dense measure.',
    category: 'editorial',
    defaultAccent: '#9f1239',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: gazetteCss,
  },
  {
    id: 'novella',
    name: 'Novella',
    description: 'Fiction manuscript: serene serif, first-line indents, zero clutter.',
    category: 'editorial',
    defaultAccent: '#6b4226',
    shikiTheme: 'solarized-light',
    mermaidTheme: 'neutral',
    css: novellaCss,
  },
  {
    id: 'columnist',
    name: 'Columnist',
    description: 'Opinion page: assertive pull-quote blockquotes, byline italics.',
    category: 'editorial',
    defaultAccent: '#be123c',
    shikiTheme: 'one-light',
    mermaidTheme: 'neutral',
    css: columnistCss,
  },
```

- [ ] **Step 5: Add the three themeCopy entries**

```ts
  {
    id: 'gazette',
    title: 'Gazette theme, newspaper styling for markdown, markdown.style',
    description: 'See a full report rendered in Gazette: double-ruled masthead, condensed headlines, and newsroom density. Free, in your browser.',
    h1: 'Gazette, front-page energy for dense reporting',
    intro: 'Gazette lays your markdown out like a broadsheet front page: a double-ruled masthead title, condensed bold headlines, and a measure tuned for density. Below is a complete sample rendered in it.',
    whoItSuits: 'Newsletters, digests, and weekly roundups, documents that carry many stories at once and want the reader to skim like a front page.',
    pairWith: ['editorial', 'columnist'],
  },
  {
    id: 'novella',
    title: 'Novella theme, manuscript styling for markdown, markdown.style',
    description: 'See a full report rendered in Novella: serene serif, first-line indents, and chapter ornaments with nothing else in the way. Free, in your browser.',
    h1: 'Novella, manuscript serenity for writing that flows',
    intro: 'Novella removes everything between the reader and the prose: indented paragraphs, centered chapter heads under a small ornament, and a warm page. Below is a complete sample rendered in it.',
    whoItSuits: 'Fiction drafts, essays, and personal writing, longform where the typography should disappear into the reading.',
    pairWith: ['paper', 'editorial'],
  },
  {
    id: 'columnist',
    title: 'Columnist theme, opinion-page styling for markdown, markdown.style',
    description: 'See a full report rendered in Columnist: oversized pull quotes, byline italics, and an argument that looks like it belongs in print. Free, in your browser.',
    h1: 'Columnist, opinion-page conviction for arguments in print',
    intro: 'Columnist treats every blockquote as a pull quote: oversized, italic, and ruled in your accent color, with byline-style italics under the headline. Below is a complete sample rendered in it.',
    whoItSuits: 'Op-eds, position pieces, and persuasive memos, writing built around quotable lines that deserve to be displayed, not buried.',
    pairWith: ['gazette', 'quarterly'],
  },
```

- [ ] **Step 6: Run the full suite**

Run: `bun run test && bunx tsc --noEmit`
Expected: green (23 themes render end-to-end).

- [ ] **Step 7: Commit**

```bash
git add src/themes/ src/site/pages/copy.ts
git commit -m "feat: add Editorial & Longform theme batch (gazette, novella, columnist)"
```

---

### Task 9: Minimal & Clean batch (3 themes)

**Files:**
- Create: `src/themes/mist.css`, `src/themes/mono.css`, `src/themes/airy.css`
- Modify: `src/themes/registry.ts`, `src/site/pages/copy.ts`
- Test: `src/themes/registry.test.ts`

**Interfaces:**
- Consumes: Task 1 model; Task 3 batch pattern.
- Produces: theme ids `mist`, `mono`, `airy` registered with `themeCopy` entries.

- [ ] **Step 1: Extend the counts test**

```ts
    expect(count('minimal')).toBe(5)
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun run test src/themes/registry.test.ts`
Expected: FAIL: minimal is 2.

- [ ] **Step 3: Create the three stylesheets**

Create `src/themes/mist.css`:

```css
/* Mist, hairline minimal. Feather rules, whispered hierarchy. */
:root {
  --mds-bg: #fcfcfd;
  --mds-fg: #3a3f46;
  --mds-font-body: 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif;
  --mds-font-heading: 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif;
  --mds-muted: #9aa1ab;
  --mds-rule: #eceef1;
  --mds-code-bg: #f4f5f7;
}

body { font-weight: 400; line-height: 1.75; }

h1 { font-size: 2em; font-weight: 300; letter-spacing: -0.01em; color: #24272c; }
h2 { font-size: 1.3em; font-weight: 400; margin-top: 2.6em; color: #24272c; }
h3 { font-size: 1.05em; font-weight: 500; margin-top: 1.9em; }
h4, h5, h6 { font-size: 0.85em; font-weight: 500; color: var(--mds-muted); text-transform: uppercase; letter-spacing: 0.12em; }

a { color: var(--mds-accent); text-decoration-color: var(--mds-rule); text-underline-offset: 3px; }

blockquote { margin: 1.8em 0; padding: 0 1.4em; border-left: 1px solid var(--mds-rule); color: var(--mds-muted); }

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 3em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.86em; background: var(--mds-code-bg); padding: 0.15em 0.4em; border-radius: 4px; }
pre { border-radius: 6px; padding: 16px 20px; font-size: 0.86em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.8em 0; font-size: 0.92em; }
th { text-align: left; border-bottom: 1px solid var(--mds-rule); padding: 9px 12px; font-weight: 500; color: var(--mds-muted); }
td { border-bottom: 1px solid var(--mds-rule); padding: 9px 12px; }

ul, ol { padding-left: 1.5em; }
li { margin: 0.35em 0; }
li::marker { color: var(--mds-muted); }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3.5em; }

@media print { :root { --mds-bg: #ffffff; } body { font-size: 10.5pt; } }
```

Create `src/themes/mono.css`:

```css
/* Mono, typewriter monospace. One family, two weights, zero decoration. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #26282b;
  --mds-font-body: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --mds-font-heading: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --mds-muted: #75797f;
  --mds-rule: #e4e6e8;
  --mds-code-bg: #f4f5f6;
}

body { font-size: calc(14.5px * var(--mds-font-scale)); line-height: 1.7; }

h1 { font-size: 1.55em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
h2 { font-size: 1.2em; font-weight: 700; margin-top: 2.4em; border-bottom: 1px solid var(--mds-fg); padding-bottom: 0.25em; }
h3 { font-size: 1.05em; font-weight: 700; margin-top: 1.8em; }
h4, h5, h6 { font-size: 1em; font-weight: 700; color: var(--mds-muted); }

a { color: var(--mds-accent); text-decoration: underline; }

blockquote { margin: 1.5em 0; padding: 0 0 0 1.4em; border-left: 1px solid var(--mds-fg); color: var(--mds-muted); }

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em 0; }

code { font-size: 1em; background: var(--mds-code-bg); padding: 0.1em 0.3em; }
pre { padding: 14px 16px; font-size: 0.95em; background: var(--mds-code-bg); }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.5em 0; font-size: 0.95em; }
th { text-align: left; border-bottom: 1px solid var(--mds-fg); padding: 6px 10px; }
td { border-bottom: 1px solid var(--mds-rule); padding: 6px 10px; }

ul, ol { padding-left: 1.8em; }
li { margin: 0.25em 0; }

.footnotes { font-size: 0.9em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { body { font-size: 9.5pt; } }
```

Create `src/themes/airy.css`:

```css
/* Airy, air and whitespace. A small text block adrift in generous margins. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #43464d;
  --mds-font-body: 'Avenir Next', 'Segoe UI', system-ui, sans-serif;
  --mds-font-heading: 'Avenir Next', 'Segoe UI', system-ui, sans-serif;
  --mds-muted: #9599a3;
  --mds-rule: #eef0f3;
  --mds-code-bg: #f5f6f8;
}

body { font-size: calc(15px * var(--mds-font-scale)); line-height: 1.9; }
.mds-content { padding: 96px 32px 140px; }

h1 { font-size: 1.9em; font-weight: 500; letter-spacing: -0.01em; margin-bottom: 1.8em; color: #2c2f35; }
h2 { font-size: 0.85em; font-weight: 600; margin-top: 4em; margin-bottom: 1.6em; text-transform: uppercase; letter-spacing: 0.22em; color: var(--mds-accent); }
h3 { font-size: 1.05em; font-weight: 600; margin-top: 2.2em; color: #2c2f35; }
h4, h5, h6 { font-size: 0.9em; font-weight: 600; color: var(--mds-muted); }

a { color: var(--mds-accent); text-underline-offset: 3px; }

blockquote { margin: 2.4em 0; padding: 0 1.6em; border-left: 1px solid var(--mds-accent); color: var(--mds-muted); }

hr { border: 0; text-align: center; margin: 4em 0; }
hr::after { content: '·' / ''; color: var(--mds-muted); font-size: 1.4em; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.85em; background: var(--mds-code-bg); padding: 0.15em 0.45em; border-radius: 5px; }
pre { border-radius: 8px; padding: 20px 24px; font-size: 0.85em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 2.2em 0; font-size: 0.92em; }
th { text-align: left; border-bottom: 1px solid var(--mds-rule); padding: 10px 14px; font-weight: 600; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mds-muted); }
td { border-bottom: 1px solid var(--mds-rule); padding: 10px 14px; }

ul, ol { padding-left: 1.5em; }
li { margin: 0.5em 0; }
li::marker { color: var(--mds-accent); }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 4em; }

@media print { body { font-size: 10.5pt; } .mds-content { padding: 0; } }
```

- [ ] **Step 4: Register the three themes**

Imports (alphabetical): `airyCss from './airy.css?raw'`, `mistCss from './mist.css?raw'`, `monoCss from './mono.css?raw'`.

Append to the `themes` array:

```ts
  {
    id: 'mist',
    name: 'Mist',
    description: 'Hairline minimal: feather rules, whispered hierarchy.',
    category: 'minimal',
    defaultAccent: '#64748b',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: mistCss,
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Typewriter monospace: one family, two weights, zero decoration.',
    category: 'minimal',
    defaultAccent: '#374151',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: monoCss,
  },
  {
    id: 'airy',
    name: 'Airy',
    description: 'Air and whitespace: a small text block adrift in generous margins.',
    category: 'minimal',
    defaultAccent: '#6366f1',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: airyCss,
  },
```

- [ ] **Step 5: Add the three themeCopy entries**

```ts
  {
    id: 'mist',
    title: 'Mist theme, hairline minimal styling for markdown, markdown.style',
    description: 'See a full report rendered in Mist: feather-light rules, a soft gray-blue voice, and hierarchy you feel more than see. Free, in your browser.',
    h1: 'Mist, minimalism at the hairline weight',
    intro: 'Mist keeps everything at a whisper: hairline rules, a light title weight, and gray-blue restraint. Below is a complete sample rendered in it.',
    whoItSuits: 'Design documents, product notes, and portfolios of thought, for readers who consider heavy borders a personal insult.',
    pairWith: ['swiss', 'airy'],
  },
  {
    id: 'mono',
    title: 'Mono theme, typewriter monospace styling for markdown, markdown.style',
    description: 'See a full report rendered in Mono: one monospace family, two weights, underlined links, and no decoration at all. Free, in your browser.',
    h1: 'Mono, one family, two weights, nothing else',
    intro: 'Mono is the plaintext ideal taken seriously: a single monospace family for everything, underlined links, and ruled headings. Below is a complete sample rendered in it.',
    whoItSuits: 'Changelogs, RFCs, and engineering notes, documents whose authors trust content over costume.',
    pairWith: ['contrast', 'terminal'],
  },
  {
    id: 'airy',
    title: 'Airy theme, whitespace-first styling for markdown, markdown.style',
    description: 'See a full report rendered in Airy: a small measured text block, oversized margins, and section labels in tracked-out caps. Free, in your browser.',
    h1: 'Airy, whitespace doing the heavy lifting',
    intro: 'Airy gives your markdown room: an unhurried line height, tracked-out section labels, and margins most themes would call wasteful. Below is a complete sample rendered in it.',
    whoItSuits: 'Manifestos, letters, and short strategy notes, writing that gains authority from calm. Not the theme for a 40-page appendix.',
    pairWith: ['mist', 'swiss'],
  },
```

- [ ] **Step 6: Run the full suite**

Run: `bun run test && bunx tsc --noEmit`
Expected: green (26 themes render end-to-end).

- [ ] **Step 7: Commit**

```bash
git add src/themes/ src/site/pages/copy.ts
git commit -m "feat: add Minimal & Clean theme batch (mist, mono, airy)"
```

---

### Task 10: Bold & Creative batch (4 themes)

**Files:**
- Create: `src/themes/neon.css`, `src/themes/poster.css`, `src/themes/riso.css`, `src/themes/retro.css`
- Modify: `src/themes/registry.ts`, `src/site/pages/copy.ts`
- Test: `src/themes/registry.test.ts`

**Interfaces:**
- Consumes: Task 1 model; Task 3 batch pattern.
- Produces: theme ids `neon`, `poster`, `riso`, `retro` registered with `themeCopy` entries.

- [ ] **Step 1: Extend the counts test**

```ts
    expect(count('bold')).toBe(5)
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun run test src/themes/registry.test.ts`
Expected: FAIL: bold is 1.

- [ ] **Step 3: Create the four stylesheets**

Create `src/themes/neon.css`:

```css
/* Neon, electric dark. Cyan and magenta on violet-black. Prints light. */
:root {
  --mds-bg: #0e0716;
  --mds-fg: #e9e4f7;
  --mds-font-body: 'Segoe UI', system-ui, -apple-system, sans-serif;
  --mds-font-heading: 'Segoe UI', system-ui, -apple-system, sans-serif;
  --mds-muted: #9b8fbd;
  --mds-rule: #2e2344;
  --mds-code-bg: #180f26;
  --mds-neon-2: #f472b6;
}

h1 { font-size: 2.2em; font-weight: 800; letter-spacing: -0.02em; color: var(--mds-accent); }
h2 { font-size: 1.4em; font-weight: 700; margin-top: 2.2em; color: var(--mds-accent); border-bottom: 1px solid var(--mds-rule); padding-bottom: 0.3em; }
h3 { font-size: 1.1em; font-weight: 700; margin-top: 1.7em; color: var(--mds-neon-2); }
h4, h5, h6 { font-size: 0.95em; color: var(--mds-muted); text-transform: uppercase; letter-spacing: 0.08em; }

a { color: var(--mds-neon-2); }

blockquote { margin: 1.5em 0; padding: 0.7em 1.2em; border: 1px solid var(--mds-rule); border-radius: 8px; color: var(--mds-muted); background: var(--mds-code-bg); }

hr { border: 0; border-top: 1px solid var(--mds-rule); margin: 2.5em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.86em; background: var(--mds-code-bg); border: 1px solid var(--mds-rule); padding: 0.15em 0.4em; border-radius: 4px; }
pre { border-radius: 8px; padding: 16px 20px; font-size: 0.86em; }
pre code { background: none; border: 0; padding: 0; font-size: 1em; }
pre.shiki { border: 1px solid var(--mds-rule); }

table { margin: 1.5em 0; font-size: 0.92em; }
th { text-align: left; border-bottom: 2px solid var(--mds-accent); padding: 8px 12px; color: var(--mds-accent); }
td { border-bottom: 1px solid var(--mds-rule); padding: 8px 12px; }
tbody tr:nth-child(even) { background: rgba(255, 255, 255, 0.03); }

ul, ol { padding-left: 1.6em; }
li { margin: 0.3em 0; }
li::marker { color: var(--mds-neon-2); }

.mds-error { background: #2b0f1c; border-color: #f472b6; color: #fbcfe8; }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print {
  /* electric on screen, printable on paper */
  :root { --mds-bg: #ffffff; --mds-fg: #2a2438; --mds-muted: #6d6486; --mds-rule: #ddd6ec; --mds-code-bg: #f5f2fb; --mds-neon-2: #be3d84; }
  blockquote { background: #f5f2fb; }
  tbody tr:nth-child(even) { background: #f5f2fb; }
  .mds-error { background: #fef2f2; border-color: #b91c1c; color: #7f1d1d; }
  body { font-size: 10.5pt; }
}
```

Create `src/themes/poster.css`:

```css
/* Poster, poster type. Massive headlines, unapologetic scale jumps. */
:root {
  --mds-bg: #ffffff;
  --mds-fg: #141414;
  --mds-font-body: 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif;
  --mds-font-heading: 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif;
  --mds-muted: #6b6b6b;
  --mds-rule: #141414;
  --mds-code-bg: #f2f2f2;
}

h1 { font-size: 3em; font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em; line-height: 0.98; }
h2 { font-size: 1.8em; font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; margin-top: 1.8em; }
h2::after { content: '' / ''; display: block; width: 1.6em; border-bottom: 6px solid var(--mds-accent); padding-top: 0.2em; }
h3 { font-size: 1.2em; font-weight: 800; margin-top: 1.6em; text-transform: uppercase; letter-spacing: 0.02em; }
h4, h5, h6 { font-size: 1em; font-weight: 800; }

a { color: var(--mds-accent); text-decoration-thickness: 2px; }

blockquote { margin: 1.8em 0; padding: 1em 1.3em; background: var(--mds-fg); color: var(--mds-bg); font-size: 1.15em; font-weight: 700; }
blockquote a { color: var(--mds-accent); }

hr { border: 0; border-top: 6px solid var(--mds-fg); margin: 2.5em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.86em; background: var(--mds-code-bg); padding: 0.15em 0.4em; }
pre { padding: 16px 20px; font-size: 0.86em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 2px solid var(--mds-fg); }

table { margin: 1.6em 0; font-size: 0.93em; }
th { text-align: left; border-bottom: 3px solid var(--mds-fg); padding: 9px 12px; text-transform: uppercase; font-size: 0.85em; letter-spacing: 0.04em; }
td { border-bottom: 1px solid #d9d9d9; padding: 9px 12px; }

ul, ol { padding-left: 1.5em; }
li { margin: 0.3em 0; }
li::marker { color: var(--mds-accent); font-weight: 900; }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 3px solid var(--mds-fg); margin-top: 3em; }

@media print { body { font-size: 10.5pt; } h1 { font-size: 2.6em; } }
```

Create `src/themes/riso.css`:

```css
/* Riso, risograph print. Two-ink overprint charm on tinted paper. */
:root {
  --mds-bg: #fbf7ef;
  --mds-fg: #33312c;
  --mds-font-body: 'Segoe UI', Seravek, system-ui, sans-serif;
  --mds-font-heading: 'Segoe UI', Seravek, system-ui, sans-serif;
  --mds-muted: #7d7668;
  --mds-rule: #e5ddcb;
  --mds-code-bg: #f2ecdd;
  --mds-ink-2: #2b4bd7;
}

h1 { font-size: 2.3em; font-weight: 800; letter-spacing: -0.02em; color: var(--mds-accent); }
h2 { font-size: 1.4em; font-weight: 800; margin-top: 2.2em; color: var(--mds-accent); }
h2::after { content: '' / ''; display: block; width: 2.4em; border-bottom: 4px solid var(--mds-ink-2); padding-top: 0.2em; }
h3 { font-size: 1.1em; font-weight: 700; margin-top: 1.7em; color: var(--mds-ink-2); }
h4, h5, h6 { font-size: 0.95em; font-weight: 700; color: var(--mds-muted); }

a { color: var(--mds-ink-2); text-decoration-thickness: 2px; text-decoration-color: var(--mds-accent); }

blockquote { margin: 1.6em 0; padding: 0.8em 1.2em; background: #edf1ff; border: 0; border-radius: 4px; color: #22368f; }

hr { border: 0; border-top: 3px dotted var(--mds-accent); margin: 2.5em 0; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.87em; background: var(--mds-code-bg); color: var(--mds-ink-2); padding: 0.15em 0.4em; border-radius: 4px; }
pre { border-radius: 6px; padding: 16px 20px; font-size: 0.87em; }
pre code { background: none; color: inherit; padding: 0; font-size: 1em; }
pre.shiki { border: 2px solid var(--mds-accent); }

table { margin: 1.6em 0; font-size: 0.93em; }
th { text-align: left; border-bottom: 3px solid var(--mds-accent); padding: 8px 12px; color: var(--mds-ink-2); }
td { border-bottom: 1px solid var(--mds-rule); padding: 8px 12px; }
tbody tr:nth-child(even) { background: rgba(43, 75, 215, 0.05); }

ul, ol { padding-left: 1.6em; }
li { margin: 0.3em 0; }
li::marker { color: var(--mds-accent); }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { :root { --mds-bg: #ffffff; } body { font-size: 10.5pt; } }
```

Create `src/themes/retro.css`:

```css
/* Retro, warm 70s. Burnt orange, mustard rules, rounded corners. */
:root {
  --mds-bg: #f9f1df;
  --mds-fg: #453423;
  --mds-font-body: Georgia, 'Times New Roman', serif;
  --mds-font-heading: Verdana, Geneva, 'DejaVu Sans', sans-serif;
  --mds-muted: #8a765c;
  --mds-rule: #e2d3b4;
  --mds-code-bg: #f0e5cb;
  --mds-mustard: #c99b2e;
}

h1 { font-size: 2.2em; font-weight: 800; letter-spacing: -0.02em; color: var(--mds-accent); }
h2 { font-size: 1.4em; font-weight: 800; margin-top: 2.2em; color: var(--mds-accent); display: inline-block; border-bottom: 4px solid var(--mds-mustard); padding-bottom: 0.1em; }
h3 { font-size: 0.95em; font-weight: 700; margin-top: 1.7em; color: var(--mds-mustard); text-transform: uppercase; letter-spacing: 0.06em; }
h4, h5, h6 { font-size: 0.95em; font-weight: 700; color: var(--mds-muted); }

a { color: var(--mds-accent); text-decoration-thickness: 2px; }

blockquote { margin: 1.6em 0; padding: 0.9em 1.3em; background: var(--mds-code-bg); border: 0; border-radius: 12px; color: var(--mds-fg); font-style: italic; }

hr { border: 0; border-top: 4px solid var(--mds-mustard); border-radius: 2px; margin: 2.5em 0; width: 30%; }

code { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 0.86em; background: var(--mds-code-bg); padding: 0.15em 0.45em; border-radius: 6px; }
pre { border-radius: 12px; padding: 16px 20px; font-size: 0.86em; }
pre code { background: none; padding: 0; font-size: 1em; }
pre.shiki { border: 2px solid var(--mds-rule); }

table { margin: 1.6em 0; font-size: 0.93em; }
th { text-align: left; border-bottom: 3px solid var(--mds-accent); padding: 8px 12px; font-family: Verdana, Geneva, sans-serif; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.05em; }
td { border-bottom: 1px solid var(--mds-rule); padding: 8px 12px; }
tbody tr:nth-child(even) { background: rgba(201, 155, 46, 0.08); }

ul, ol { padding-left: 1.6em; }
li { margin: 0.3em 0; }
li::marker { color: var(--mds-mustard); }

.footnotes { font-size: 0.85em; color: var(--mds-muted); border-top: 1px solid var(--mds-rule); margin-top: 3em; }

@media print { :root { --mds-bg: #ffffff; } body { font-size: 10.5pt; } }
```

- [ ] **Step 4: Register the four themes**

Imports (alphabetical): `neonCss from './neon.css?raw'`, `posterCss from './poster.css?raw'`, `retroCss from './retro.css?raw'`, `risoCss from './riso.css?raw'`.

Append to the `themes` array:

```ts
  {
    id: 'neon',
    name: 'Neon',
    description: 'Electric dark: neon cyan on deep violet-black.',
    category: 'bold',
    defaultAccent: '#22d3ee',
    shikiTheme: 'synthwave-84',
    mermaidTheme: 'dark',
    css: neonCss,
  },
  {
    id: 'poster',
    name: 'Poster',
    description: 'Poster type: massive headlines, unapologetic scale jumps.',
    category: 'bold',
    defaultAccent: '#ea580c',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: posterCss,
  },
  {
    id: 'riso',
    name: 'Riso',
    description: 'Risograph print: two-ink overprint charm, tinted paper.',
    category: 'bold',
    defaultAccent: '#ff4d6d',
    shikiTheme: 'catppuccin-latte',
    mermaidTheme: 'neutral',
    css: risoCss,
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Warm 70s: burnt orange, mustard rules, rounded corners.',
    category: 'bold',
    defaultAccent: '#c2410c',
    shikiTheme: 'gruvbox-light-soft',
    mermaidTheme: 'forest',
    css: retroCss,
  },
```

Note: `riso`'s `defaultAccent` `#ff4d6d`, keep the exact hex; the contract test requires 6-digit hex.

- [ ] **Step 5: Add the four themeCopy entries**

```ts
  {
    id: 'neon',
    title: 'Neon theme, electric dark styling for markdown, markdown.style',
    description: 'See a full report rendered in Neon: cyan and magenta on violet-black, flipping to a printable light palette on paper. Free, in your browser.',
    h1: 'Neon, electric dark for documents with a pulse',
    intro: 'Neon runs your markdown through the night: cyan headings, magenta accents, violet-black depth, and a print stylesheet that lands light. Below is a complete sample rendered in it.',
    whoItSuits: 'Launch notes, event recaps, and gaming or creative-tech writeups, documents meant to be read on a screen with the lights down.',
    pairWith: ['pop', 'terminal'],
  },
  {
    id: 'poster',
    title: 'Poster theme, display-type styling for markdown, markdown.style',
    description: 'See a full report rendered in Poster: massive uppercase headlines, thick black rules, and reversed pull blocks. Free, in your browser.',
    h1: 'Poster, headlines that read across the room',
    intro: 'Poster typesets your markdown like something meant for a wall: enormous uppercase headlines, six-pixel rules, and blockquotes reversed out in black. Below is a complete sample rendered in it.',
    whoItSuits: 'Announcements, manifestos, and one-page briefs, short documents that win or lose in the first two seconds.',
    pairWith: ['contrast', 'pop'],
  },
  {
    id: 'riso',
    title: 'Riso theme, risograph two-ink styling for markdown, markdown.style',
    description: 'See a full report rendered in Riso: pink and blue inks overprinting on cream stock, straight from the community print shop. Free, in your browser.',
    h1: 'Riso, two inks, one very charming document',
    intro: 'Riso borrows the community print-shop look: pink headings, blue working text, dotted rules, and cream stock that makes both inks sing. Below is a complete sample rendered in it.',
    whoItSuits: 'Zines, event programs, community updates, and side-project docs, writing that should feel hand-made and a little joyful.',
    pairWith: ['pop', 'retro'],
  },
  {
    id: 'retro',
    title: 'Retro theme, warm 70s styling for markdown, markdown.style',
    description: 'See a full report rendered in Retro: burnt orange, mustard rules, rounded corners, and cream paper straight from 1974. Free, in your browser.',
    h1: 'Retro, 1970s warmth for documents with personality',
    intro: 'Retro pours your markdown a glass of orange juice in 1974: burnt-orange headings, mustard underlines, rounded blocks, and cream paper. Below is a complete sample rendered in it.',
    whoItSuits: 'Newsletters, personal sites turned PDFs, and culture-team documents, anywhere warmth beats formality.',
    pairWith: ['riso', 'paper'],
  },
```

- [ ] **Step 6: Run the full suite**

Run: `bun run test && bunx tsc --noEmit`
Expected: green (30 themes render end-to-end).

- [ ] **Step 7: Commit**

```bash
git add src/themes/ src/site/pages/copy.ts
git commit -m "feat: add Bold & Creative theme batch (neon, poster, riso, retro)"
```

---

### Task 11: Final lineup pin and full verification

**Files:**
- Modify: `src/themes/registry.test.ts`, `src/site/pages/pages.test.ts`, `src/site/pages/build.test.ts` (only if it pins a generated-file count), `scripts/build-pages.ts` (only if it hardcodes a count)

**Interfaces:**
- Consumes: the complete 30-theme registry.
- Produces: exact-lineup regression net; verified production build.

- [ ] **Step 1: Pin the final lineup**

In `src/themes/registry.test.ts`, replace `keeps the original eight first, paper leading` with the full-order pin:

```ts
  it('ships the expanded lineup in category batches, paper first', () => {
    expect(themes.map(t => t.id)).toEqual([
      'paper', 'slate', 'carbon', 'swiss', 'contrast', 'editorial', 'scholar', 'pop',
      'boardroom', 'ledger', 'briefing', 'memo', 'quarterly',
      'terminal', 'blueprint', 'manual',
      'thesis', 'preprint', 'notebook', 'lecture',
      'gazette', 'novella', 'columnist',
      'mist', 'mono', 'airy',
      'neon', 'poster', 'riso', 'retro',
    ])
  })
```

Replace the body of `category population matches the shipped roadmap` with the full check:

```ts
    const count = (c: string) => themes.filter(t => t.category === c).length
    for (const category of Object.keys(CATEGORY_LABELS)) {
      expect(count(category), category).toBe(5)
    }
```

In `src/site/pages/pages.test.ts`, add to the sitemap test:

```ts
    expect(urls.length).toBe(40) // 4 static + 36 generated (spec 2026-07-11 §6)
```

- [ ] **Step 2: Run tests**

Run: `bun run test && bunx tsc --noEmit`
Expected: green (if the lineup order differs, fix the registry order, not the test).

- [ ] **Step 3: Verify the production build end-to-end**

Run: `bun run build`
Expected: completes; page generation reports 70 files (36 route pages + 33 samples + sitemap.xml). If `scripts/build-pages.ts` or `src/site/pages/build.test.ts` hardcodes the old count (26), replace the literal with the derived value `GENERATED_ROUTES.length + themes.length + useCases.length + 1` so it never goes stale again. Then:

Run: `rtk proxy grep -c '<loc>' dist/sitemap.xml`
Expected: `40`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: pin the 30-theme lineup and verified build counts"
```
