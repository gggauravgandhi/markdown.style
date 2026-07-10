# Programmatic SEO Pages (Plan 4b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the programmatic SEO surface — `/themes` gallery hub, 8 theme pages, 3 use-case pages, 2 convert hubs — generated at build time through the product's own `render()` pipeline, plus editor `?theme=` deep links, a generated sitemap, and a theme-polish pre-pass.

**Architecture:** A plain bun script (`scripts/build-pages.ts`) runs after `vite build` and writes static pages straight into `dist/`. Bun natively resolves the project's Vite-style `?raw` CSS imports (verified empirically), so the generator imports the real pipeline directly — no Vite SSR machinery. Rendered sample documents are **inlined into each page's own HTML** with CSS scoped via native nesting (never iframes — AI crawlers don't execute JS and don't merge iframe content), and full standalone exports are also written to `/samples/*.html` (noindexed) as human-facing "view the exported file" demos.

**Tech Stack:** bun, TypeScript strict, existing pipeline (`markdown-it`, Shiki, DOMPurify via jsdom fallback in node), vitest (node env for generator tests, jsdom for editor tests). **No new dependencies.**

## Global Constraints

Copied from the spec (`docs/superpowers/specs/2026-07-10-markdown-style-design.md` §6) and prior owner rulings — every task's requirements implicitly include these:

- Every citable page is **static HTML generated at build time; zero JS** on citable pages (no `<script>` tags at all on generated pages — not even JSON-LD; the landing page keeps its existing JSON-LD).
- **≤25 pages** in the sitemap at launch; cross-linked, **zero orphans**.
- Copy is **answer-first**: each page/section opens with a direct 1–2 sentence answer; H1s/titles/slugs use natural question language.
- **No** FAQPage/HowTo/aggregateRating/SearchAction JSON-LD anywhere.
- Trust badge "100% in your browser · no upload · free" appears on every page.
- Canonicals are absolute `https://markdown.style/...`, extensionless, no trailing slash (matching `privacy.html` → `/privacy` host clean-URL convention; owner must verify Cloudflare Pages clean-URL handling before launch — not a repo concern).
- Sample markdown for static pages contains **no mermaid fences** (build must not need a browser DOM) and **no math** (`$`/`$$` — KaTeX pulls a ~360KB inline-font stylesheet into every render that uses it; static pages must stay light for Core Web Vitals).
- `render()` output stays script-free and self-contained; never weaken `src/pipeline/sanitize.ts` or the iframe sandbox.
- bun for all commands (`bun test`, `bun run build`, `bunx tsc`); never npm/npx/node.
- Don't lead any hero/H1 with "markdown to pdf" **except** the two `/convert/*` hubs, which exist precisely for those queries (spec routes table).
- Commit messages: conventional commits, no Co-Authored-By.

**File/route mapping convention used throughout:** route `/themes` → file `themes.html`; route `/themes/paper` → file `themes/paper.html` (flat `.html` files, same as existing `privacy.html`). Samples live at `samples/<id>.html` and are **excluded from the sitemap and noindexed**.

---

### Task 1: Theme & editor polish pre-pass

These pages publicly showcase the themes, so fix the known rough spots first. All four items were confirmed against the current CSS (all 8 themes define their own unconditional `a { color: ... }` after `_base.css` in source order, so the base print link rule is dead; `contrast.css` and `swiss.css` have no `.mds-error` override and inherit a rounded pink box that clashes with their aesthetics).

**Files:**
- Modify: `src/themes/_base.css` (remove dead print rule)
- Modify: `src/themes/carbon.css` (screen-reader-safe heading prefixes)
- Modify: `src/themes/contrast.css` (theme-consistent `.mds-error`)
- Modify: `src/themes/swiss.css` (theme-consistent `.mds-error`)
- Modify: `src/app/app.css` (theme-dialog thumbnail scaling)
- Test: `src/themes/registry.test.ts` (append new describe block)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing other tasks depend on (pure polish; later tasks embed these CSS files as-is).

- [ ] **Step 1: Write the failing tests**

Append to `src/themes/registry.test.ts`:

```ts
describe('theme polish (plan 4b pre-pass)', () => {
  it('contrast and swiss define their own .mds-error styling', () => {
    for (const id of ['contrast', 'swiss']) {
      expect(getTheme(id).css, id).toContain('.mds-error')
    }
  })

  it('carbon heading prefixes carry empty alt text so screen readers skip them', () => {
    // CSS alt-text syntax: content: '# ' / '' — unsupported browsers drop the
    // declaration entirely (decorative # disappears; heading text unaffected).
    const carbon = getTheme('carbon').css
    expect(carbon).toContain("content: '# ' / ''")
    expect(carbon).toContain("content: '## ' / ''")
    expect(carbon).toContain("content: '### ' / ''")
  })

  it('base print block no longer carries the dead link rule', () => {
    // every theme defines an unconditional `a { color }` later in source order,
    // so the base @media print `a { color: inherit }` could never win — dead code.
    const printBlock = baseCss.slice(baseCss.indexOf('@media print'))
    expect(printBlock).not.toMatch(/^\s*a\s*\{/m)
  })
})
```

(`getTheme` and `baseCss` are already imported by this test file; if not, add them to the existing import from `./registry`.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/themes/registry.test.ts`
Expected: 3 new failures (`.mds-error` missing in contrast/swiss, alt-text syntax missing in carbon, dead rule still present).

- [ ] **Step 3: Make the CSS changes**

In `src/themes/_base.css`, inside `@media print { ... }`, delete only this line (keep everything else):

```css
  a { text-decoration: none; color: inherit; }
```

In `src/themes/carbon.css`, change lines 13/15/17:

```css
h1::before { content: '# ' / ''; color: var(--mds-accent); }
h2::before { content: '## ' / ''; color: var(--mds-accent); }
h3::before { content: '### ' / ''; color: var(--mds-accent); }
```

In `src/themes/contrast.css`, add after the `.footnotes` rule (before `@media print`):

```css
/* errors keep the poster language: hard border, no rounding */
.mds-error { border: 3px solid #b91c1c; border-radius: 0; }
```

In `src/themes/swiss.css`, add after the `.footnotes` rule (before `@media print`):

```css
/* errors stay minimal: a red rule instead of a pink box */
.mds-error { border: 0; border-left: 3px solid #b91c1c; border-radius: 0; background: #ffffff; }
```

In `src/app/app.css`, replace the `.theme-thumb` rule:

```css
/* render at double width and scale down so the sample isn't clipped mid-word;
   transforms are paint-only, so the negative margin returns the layout box
   (grid row) to the 140px the scaled content actually paints */
.theme-thumb { width: 200%; height: 280px; transform: scale(0.5); transform-origin: top left; margin-bottom: -140px; border: 0; border-radius: 4px; background: #fff; pointer-events: none; }
```

and add `overflow: hidden;` to the existing `.theme-card` rule at `src/app/app.css:55` (crops the scaled iframe's horizontal 200% overflow back to the card; the `margin-bottom: -140px` on `.theme-thumb` handles the vertical gap since CSS transforms are paint-only and don't shrink the layout box on their own). This is a visual-only app-chrome change; there is deliberately no unit test for it (matches the untested status of the rest of `app.css`) — it gets eyeballed in Task 8.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/themes/registry.test.ts src/themes/themes-render.test.ts`
Expected: PASS (including the pre-existing theme-contract tests — the print-block test in `themes-render.test.ts` must still pass after the `_base.css` edit).

- [ ] **Step 5: Run the full suite and commit**

Run: `bun test` — expected: all pass (117 + 3 new).

```bash
git add src/themes/_base.css src/themes/carbon.css src/themes/contrast.css src/themes/swiss.css src/app/app.css src/themes/registry.test.ts
git commit -m "fix: theme polish pre-pass — error styling, a11y heading prefixes, dead print rule, thumbnail clipping"
```

---

### Task 2: Extract `renderBody()` from the pipeline

The generator needs the sanitized+highlighted body *without* the full-document assembly (pages inline the body with scoped CSS). Extract the existing steps into an exported `renderBody()` and re-implement `render()` on top of it. **Zero behavior change to `render()`** — the existing render tests are the regression net.

**Files:**
- Modify: `src/pipeline/render.ts`
- Test: `src/pipeline/render.test.ts` (append)

**Interfaces:**
- Consumes: existing pipeline internals (unchanged).
- Produces: `renderBody(markdown: string, themeId: string): Promise<{ body: string; title: string; errors: RenderError[]; usedMath: boolean }>` — consumed by Task 6's `buildAllPages`.

- [ ] **Step 1: Write the failing test**

Append to `src/pipeline/render.test.ts`:

```ts
describe('renderBody', () => {
  it('returns the processed body without document assembly', async () => {
    const { body, title, errors, usedMath } = await renderBody('# Hi\n\n```ts\nconst a = 1\n```', 'paper')
    expect(title).toBe('Hi')
    expect(errors).toEqual([])
    expect(usedMath).toBe(false)
    expect(body).toContain('shiki') // fences highlighted
    expect(body).not.toContain('<!doctype') // not assembled
    expect(body).not.toContain('<style') // no css — caller owns styling
  })
})
```

Add `renderBody` to the existing import from `./render`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/pipeline/render.test.ts`
Expected: FAIL — `renderBody` is not exported.

- [ ] **Step 3: Refactor render.ts**

Replace the body of `src/pipeline/render.ts` (keep the existing file doc comment on `render`):

```ts
import { getTheme } from '../themes/registry'
import { assembleDocument, extractTitle } from './assemble'
import { highlightFences } from './highlight'
import { markdownToHtml, stripFrontmatter } from './markdown'
import { renderMermaidFences } from './mermaid'
import { sanitizeBody } from './sanitize'
import type { Knobs, RenderError, RenderResult } from './types'

/** The processed document body before assembly — used by the static-page generator. */
export async function renderBody(
  markdown: string,
  themeId: string,
): Promise<{ body: string; title: string; errors: RenderError[]; usedMath: boolean }> {
  const theme = getTheme(themeId)
  const src = stripFrontmatter(markdown)
  const pass = await markdownToHtml(src)
  const errors: RenderError[] = []

  let body = await sanitizeBody(pass.body)
  if (pass.codeFences.length > 0) {
    body = await highlightFences(body, pass.codeFences, theme.shikiTheme)
  }
  if (pass.mermaidFences.length > 0) {
    const result = await renderMermaidFences(body, pass.mermaidFences, theme.mermaidTheme)
    body = result.body
    errors.push(...result.errors)
  }
  return { body, title: extractTitle(src), errors, usedMath: pass.usedMath }
}

export async function render(markdown: string, themeId: string, knobs: Knobs = {}): Promise<RenderResult> {
  const theme = getTheme(themeId)
  const { body, title, errors, usedMath } = await renderBody(markdown, themeId)
  const extraCss = usedMath ? await (await import('./katex-css')).mathCss() : ''
  const html = assembleDocument({
    body,
    title,
    themeCss: theme.css,
    knobs: { ...knobs, accent: knobs.accent ?? theme.defaultAccent },
    extraCss,
  })
  return { html, title, errors }
}
```

- [ ] **Step 4: Run the pipeline tests**

Run: `bun test src/pipeline`
Expected: PASS — all existing render/assemble/markdown tests green plus the new one.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/render.ts src/pipeline/render.test.ts
git commit -m "refactor: extract renderBody() for the static-page generator"
```

---

### Task 3: Content — sample documents and page copy

All sample markdown and per-page SEO copy, plus a hygiene test enforcing the content constraints (no mermaid, no math, copy complete and unique).

**Files:**
- Create: `content/samples/showcase.md`
- Create: `content/samples/chatgpt-report.md`
- Create: `content/samples/meeting-notes.md`
- Create: `content/samples/readme.md`
- Create: `src/site/pages/copy.ts`
- Test: `src/site/pages/copy.test.ts`

**Interfaces:**
- Consumes: theme ids from `src/themes/registry.ts` (`themes`).
- Produces (consumed by Tasks 5–6):
  - `interface ThemeCopy { id: string; title: string; description: string; h1: string; intro: string; whoItSuits: string; pairWith: readonly string[] }`
  - `interface UseCaseCopy { slug: string; themeId: string; title: string; description: string; h1: string; intro: string; sections: readonly { q: string; a: string }[] }`
  - `interface ConvertCopy { slug: string; title: string; description: string; h1: string; intro: string; sections: readonly { q: string; a: string }[] }`
  - `export const themeCopy: readonly ThemeCopy[]` (8, ids matching registry order)
  - `export const useCases: readonly UseCaseCopy[]` (3: chatgpt-report/slate, meeting-notes/paper, readme/carbon)
  - `export const convertPages: readonly ConvertCopy[]` (2: markdown-to-pdf, markdown-to-html)
  - Sample file convention: use-case slug ↔ `content/samples/<slug>.md`; theme pages all use `content/samples/showcase.md`.

- [ ] **Step 1: Write the sample documents**

Create `content/samples/showcase.md` (the one document rendered in all 8 themes — exercises headings, table, task list, code, blockquote, footnote, hr, links, inline code; **no mermaid, no math**):

````markdown
# Quarterly Growth Report

*Written by an LLM in seconds — styled by markdown.style.*

This is the markdown an AI assistant hands you: solid structure, zero design. The theme you are looking at is doing all of the visual work.

## Highlights

| Region | Revenue | Growth |
|--------|---------|--------|
| EMEA   | 4.2M    | +14%   |
| APAC   | 3.1M    | +22%   |
| AMER   | 6.8M    | +9%    |

- [x] Consolidate Q3 numbers
- [x] Review regional forecasts
- [ ] Board deck sign-off

## What drove the quarter

Net growth is computed per region as `rate * (1 - churnShare)` and rolled up weekly. The pipeline behind it:

```ts
export function netGrowth(rates: number[], churn: number[]): number {
  return rates.reduce((sum, r, i) => sum + r * (1 - (churn[i] ?? 0)), 0)
}
```

> Numbers exclude the acquisition closed after the quarter cutoff.[^1]

---

Full methodology lives in the [reporting handbook](https://example.com/handbook).

[^1]: See the finance memo for reconciliation details.
````

Create `content/samples/chatgpt-report.md`:

````markdown
# Meal-Kit Market: Competitive Snapshot

*Prepared from a single ChatGPT research prompt.*

## Executive summary

The mid-price meal-kit segment consolidated around three players in 2025. Retention — not acquisition — now separates winners: the leaders keep 40%+ of cohorts past month six while the long tail churns out below 20%.

## The field

| Company | Position | Six-month retention |
|---------|----------|---------------------|
| FreshCrate | Premium, chef-led | 44% |
| WeekBox | Mid-price volume leader | 41% |
| DinnerLoop | Budget, app-first | 19% |

## What the leaders do differently

1. **Menu breadth without SKU explosion** — 30+ weekly recipes from a 60-ingredient pool.
2. **Skip-friendly billing** — pausing is one tap; both leaders report pauses convert back at 70%.
3. **First-box economics** — deep discounts are gone; onboarding boxes are margin-neutral.

## Recommendation

> Enter through the retention side: white-label fulfilment for regional grocers beats a fourth national brand.

Risks worth flagging: ingredient inflation, and the category's exposure to grocery-delivery bundling.
````

Create `content/samples/meeting-notes.md`:

````markdown
# Product Sync — 12 June 2026

**Attendees:** Dana (PM), Luis (Eng), Priya (Design), Sam (Data)

## Decisions

- Ship the export redesign behind a flag on **June 19**.
- Postpone the pricing experiment until the churn dashboard is trusted.
- Adopt the new incident template starting next on-call rotation.

## Action items

- [ ] Luis — flag rollout plan written up by Friday
- [ ] Priya — final empty-state illustrations to eng
- [x] Sam — churn dashboard backfill finished
- [ ] Dana — customer council invites for July

## Notes

Sam walked through the cohort view: activation is flat, but week-two retention moved +3pts since the onboarding change. Luis raised that the export queue needs a dead-letter alarm before the redesign ships — agreed, tracked in the rollout plan.

> Next sync: June 19, same time. Agenda owner: Priya.
````

Create `content/samples/readme.md`:

````markdown
# tidyq

A tiny queue with backpressure, retries, and nothing else.

## Install

```bash
bun add tidyq
```

## Usage

```ts
import { queue } from 'tidyq'

const q = queue({ concurrency: 4, retries: 2 })

for (const job of jobs) q.push(() => process(job))
await q.drain()
```

## Why another queue?

| | tidyq | typical alternative |
|---|---|---|
| Dependencies | 0 | 12+ |
| Size | 1.1 kB | 40 kB+ |
| Backpressure | built-in | plugin |

## API

- `queue(opts)` — create a queue. `concurrency` (default 1), `retries` (default 0).
- `q.push(fn)` — enqueue a task returning a promise.
- `q.drain()` — resolves when the queue is empty.

## License

MIT
````

- [ ] **Step 2: Write the copy module**

Create `src/site/pages/copy.ts`:

```ts
/** SEO copy for the generated pages. Answer-first; question-led H2s (spec §6). */

export interface ThemeCopy {
  id: string
  title: string
  description: string
  h1: string
  intro: string
  whoItSuits: string
  pairWith: readonly string[]
}

export interface UseCaseCopy {
  slug: string
  themeId: string
  title: string
  description: string
  h1: string
  intro: string
  sections: readonly { q: string; a: string }[]
}

export interface ConvertCopy {
  slug: string
  title: string
  description: string
  h1: string
  intro: string
  sections: readonly { q: string; a: string }[]
}

export const themeCopy: readonly ThemeCopy[] = [
  {
    id: 'paper',
    title: 'Paper theme — style markdown as a warm, book-like report — markdown.style',
    description: 'See a full report rendered in Paper: a warm book serif for AI-written documents meant to be read slowly. Free, in your browser.',
    h1: 'Paper — a warm book serif for reports meant to be read',
    intro: 'Paper sets your markdown like a well-made hardcover: a warm serif, generous line height, and quiet rules. Below is a complete sample report rendered in it — exactly what you would download.',
    whoItSuits: 'Long-form reports, essays, and research summaries — anything an AI wrote that a human should enjoy reading. If the document will be printed and read on paper, start here.',
    pairWith: ['editorial', 'scholar'],
  },
  {
    id: 'slate',
    title: 'Slate theme — clean product-doc styling for markdown — markdown.style',
    description: 'See a full report rendered in Slate: modern product-doc sans styling for specs, status reports, and technical summaries. Free, in your browser.',
    h1: 'Slate — clean product-doc styling for technical reports',
    intro: 'Slate is the neutral, engineered look of good product documentation: a modern sans, blue accents, tables that behave. Below is a complete sample report rendered in it.',
    whoItSuits: 'Specs, status updates, PRDs, and technical summaries — the workhorse theme when the document just needs to look professionally handled.',
    pairWith: ['carbon', 'swiss'],
  },
  {
    id: 'carbon',
    title: 'Carbon theme — dark technical styling that prints light — markdown.style',
    description: 'See a full report rendered in Carbon: a dark, terminal-adjacent theme for code-heavy markdown that automatically prints on white. Free, in your browser.',
    h1: 'Carbon — dark technical styling that prints light',
    intro: 'Carbon reads like a good terminal: dark background, low glare, headings prefixed like markdown source. Print it and it flips to a light palette automatically. Below is a complete sample rendered in it.',
    whoItSuits: 'Engineering docs, runbooks, code-heavy AI answers, and anything an engineer reads on screen. The print flip means you never hand someone a black rectangle of toner.',
    pairWith: ['slate', 'contrast'],
  },
  {
    id: 'swiss',
    title: 'Swiss theme — minimal typographic markdown styling — markdown.style',
    description: 'See a full report rendered in Swiss: minimal typographic design where whitespace does the work. Free, in your browser.',
    h1: 'Swiss — minimal typography where whitespace does the work',
    intro: 'Swiss strips everything back to type: Helvetica, uppercase labels, one red line. No boxes, no decoration. Below is a complete sample report rendered in it.',
    whoItSuits: 'Strategy memos, design documents, and briefs for readers who notice typography. When in doubt between “more” and “less”, Swiss is the “less”.',
    pairWith: ['contrast', 'slate'],
  },
  {
    id: 'contrast',
    title: 'Contrast theme — bold poster styling for markdown — markdown.style',
    description: 'See a full report rendered in Contrast: hard rules, big type, poster energy for documents that need to land. Free, in your browser.',
    h1: 'Contrast — bold poster energy for documents that shout',
    intro: 'Contrast is zero subtlety by design: black rules, uppercase headings, a slab of accent color. Below is a complete sample report rendered in it.',
    whoItSuits: 'Pitches, one-pagers, launch briefs — short documents that need to be impossible to skim past. Less suited to 40-page reports.',
    pairWith: ['swiss', 'pop'],
  },
  {
    id: 'editorial',
    title: 'Editorial theme — elegant magazine styling for markdown — markdown.style',
    description: 'See a full report rendered in Editorial: display serif headings, pull-quote blockquotes, magazine air. Free, in your browser.',
    h1: 'Editorial — an elegant magazine serif with display headings',
    intro: 'Editorial styles your markdown like a feature article: display serif headings, blockquotes that read as pull quotes, air between everything. Below is a complete sample rendered in it.',
    whoItSuits: 'Newsletters, essays, long reads, and public-facing writeups — documents with an audience rather than a recipient.',
    pairWith: ['paper', 'scholar'],
  },
  {
    id: 'scholar',
    title: 'Scholar theme — academic styling for markdown with footnotes — markdown.style',
    description: 'See a full report rendered in Scholar: justified text, a centered title, and footnotes that feel at home. Free, in your browser.',
    h1: 'Scholar — academic restraint, footnotes at home',
    intro: 'Scholar is the quiet academic register: justified body text, a centered title block, restrained navy accents. Footnotes — which LLMs love to emit — finally look intentional. Below is a complete sample rendered in it.',
    whoItSuits: 'Papers, literature reviews, citation-heavy research answers, and coursework. If the document has footnotes, Scholar was built for it.',
    pairWith: ['paper', 'editorial'],
  },
  {
    id: 'pop',
    title: 'Pop theme — colorful, friendly markdown styling — markdown.style',
    description: 'See a full report rendered in Pop: rounded corners, warm tints, wavy links — a friendly face for internal docs. Free, in your browser.',
    h1: 'Pop — colorful and friendly, rounded and warm',
    intro: 'Pop keeps things human: rounded corners, a warm background tint, wavy link underlines. Serious content, unserious chrome. Below is a complete sample report rendered in it.',
    whoItSuits: 'Team updates, internal newsletters, onboarding docs — places where “approachable” beats “authoritative”.',
    pairWith: ['contrast', 'paper'],
  },
]

export const useCases: readonly UseCaseCopy[] = [
  {
    slug: 'chatgpt-report',
    themeId: 'slate',
    title: 'Turn a ChatGPT research answer into a styled report — markdown.style',
    description: 'Paste the markdown ChatGPT gives you, pick a theme, and send a designed report instead of a wall of text. Worked example inside. Free, no upload.',
    h1: 'Turn a ChatGPT research answer into a report you can send',
    intro: 'Ask ChatGPT for research and it answers in clean markdown — headings, tables, recommendations. Paste that answer here and it becomes a designed report. Below is a real example: the exact markdown in, the styled result out.',
    sections: [
      {
        q: 'How do I get the markdown out of ChatGPT?',
        a: 'Use the copy button under the answer — it copies markdown, not plain text. If the answer came out as prose, reply “format that as a markdown report with headings and tables” and copy the result.',
      },
      {
        q: 'Can I change how it looks before sending?',
        a: 'Yes — the editor previews live in any of the eight themes, and you can adjust the accent color, font size, and page width. Export is a self-contained HTML file or a print-to-PDF.',
      },
    ],
  },
  {
    slug: 'meeting-notes',
    themeId: 'paper',
    title: 'Style AI meeting notes into a clean, shareable document — markdown.style',
    description: 'AI notetakers produce markdown — decisions, action items, task lists. Style them into a document worth circulating. Worked example inside. Free, no upload.',
    h1: 'Style AI meeting notes into a document worth circulating',
    intro: 'Every AI notetaker exports the same thing: markdown with decisions, action items, and checkboxes. Paste it here and circulate something that looks deliberate instead. Below is a real example, notes in, document out.',
    sections: [
      {
        q: 'Do task lists and checkboxes render?',
        a: 'Yes — GitHub-style task lists render as real checkboxes, checked and unchecked, in every theme. Action items survive the trip from notetaker to document.',
      },
      {
        q: 'What is the fastest path from meeting to PDF?',
        a: 'Paste the notes, pick a theme (Paper suits minutes), hit Print, and choose “Save as PDF”. Two clicks after paste — no account, nothing uploaded.',
      },
    ],
  },
  {
    slug: 'readme',
    themeId: 'carbon',
    title: 'Preview and style a README outside GitHub — markdown.style',
    description: 'See a README rendered with syntax-highlighted code and real tables outside GitHub, then export it as styled HTML or PDF. Free, no upload.',
    h1: 'Preview a README as a styled document, outside GitHub',
    intro: 'A README is markdown at its densest: code fences, tables, install commands. Paste one here to see it as a designed document — for docs sites, PDF handoffs, or just reading it properly. Below is a real example rendered in Carbon.',
    sections: [
      {
        q: 'Is code syntax-highlighted?',
        a: 'Yes — fenced code blocks are highlighted at render time (Shiki, the same highlighter VS Code uses) in a palette matched to the theme, and the highlighting survives into the exported HTML and PDF.',
      },
      {
        q: 'Can I use this for docs that live outside a repo?',
        a: 'That is the point — the export is one self-contained HTML file with no external requests, so it can be attached, hosted anywhere, or printed without touching GitHub.',
      },
    ],
  },
]

export const convertPages: readonly ConvertCopy[] = [
  {
    slug: 'markdown-to-pdf',
    title: 'Convert markdown to PDF — styled, free, in your browser — markdown.style',
    description: 'Paste markdown, pick one of eight themes, print to PDF. Tables, code, math, and diagrams styled properly — free, no upload, no watermark.',
    h1: 'Convert markdown to PDF without the plain-white look',
    intro: 'Paste your markdown, pick a theme, press Print, and choose “Save as PDF” — that is the whole workflow. The difference from other converters is design: a real theme styles your tables, code, and headings, with print CSS that keeps them intact across page breaks.',
    sections: [
      {
        q: 'How do I convert markdown to a PDF for free?',
        a: 'Open the editor, paste your markdown, and press “Print or save as PDF”. Your browser’s print dialog does the conversion locally — no account, no upload, no watermark, nothing installed.',
      },
      {
        q: 'Why do most markdown-to-PDF converters look bad?',
        a: 'Because they convert without designing: default fonts, blue links, tables that overflow the page, code blocks sliced in half by page breaks. Here a theme styles every element, and print rules keep tables and code unbroken.',
      },
      {
        q: 'Does it handle tables, code, math, and diagrams?',
        a: 'Yes — GitHub-flavored tables and task lists, syntax-highlighted code, KaTeX math, and Mermaid diagrams all render and print. Exactly the constructs LLM answers are full of.',
      },
    ],
  },
  {
    slug: 'markdown-to-html',
    title: 'Convert markdown to a styled, self-contained HTML file — markdown.style',
    description: 'Turn markdown into one portable HTML file with a real theme, inline styles, and zero external requests. Free, no upload.',
    h1: 'Convert markdown to a single styled HTML file',
    intro: 'Paste markdown, pick a theme, and download one self-contained HTML file: styles inlined, no external requests, opens identically everywhere. It is the portable version of your document — attach it, host it, or hand it off.',
    sections: [
      {
        q: 'What does “self-contained” mean here?',
        a: 'Everything the document needs — theme CSS, syntax-highlighting colors, even math fonts — is embedded in the one file. No CDN links, no tracking, nothing to break when the file moves.',
      },
      {
        q: 'When should I pick HTML over PDF?',
        a: 'HTML when the reader might view on a screen, resize, or copy from the document; PDF when layout must be frozen for print or formal delivery. The same themed render produces both, so you can ship either.',
      },
    ],
  },
]
```

- [ ] **Step 3: Write the hygiene test**

Create `src/site/pages/copy.test.ts`:

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hasMath } from '../../pipeline/markdown'
import { themes } from '../../themes/registry'
import { convertPages, themeCopy, useCases } from './copy'

const samplesDir = join(import.meta.dirname, '..', '..', '..', 'content', 'samples')
const SAMPLE_FILES = ['showcase.md', 'chatgpt-report.md', 'meeting-notes.md', 'readme.md']

describe('sample documents', () => {
  it.each(SAMPLE_FILES)('%s avoids mermaid and math (build/CWV constraints) and is substantial', file => {
    const md = readFileSync(join(samplesDir, file), 'utf8')
    expect(md).not.toContain('```mermaid') // build must not need a browser DOM
    expect(hasMath(md)).toBe(false) // math pulls ~360KB of KaTeX css into every embed
    expect(md.length).toBeGreaterThan(400)
    expect(md).toMatch(/^# /m) // has a title for extractTitle()
  })
})

describe('page copy', () => {
  it('covers every registry theme, in registry order', () => {
    expect(themeCopy.map(c => c.id)).toEqual(themes.map(t => t.id))
  })

  it('use-cases reference real themes and real sample files', () => {
    for (const uc of useCases) {
      expect(themes.some(t => t.id === uc.themeId), uc.slug).toBe(true)
      expect(() => readFileSync(join(samplesDir, `${uc.slug}.md`), 'utf8'), uc.slug).not.toThrow()
    }
  })

  it('theme pairWith ids are real and never self-referential', () => {
    for (const c of themeCopy) {
      for (const id of c.pairWith) {
        expect(themes.some(t => t.id === id), `${c.id} -> ${id}`).toBe(true)
        expect(id).not.toBe(c.id)
      }
    }
  })

  it('titles and descriptions are unique and answer-first sized (anti-doorway)', () => {
    const all = [...themeCopy, ...useCases, ...convertPages]
    const titles = all.map(c => c.title)
    const descriptions = all.map(c => c.description)
    expect(new Set(titles).size).toBe(titles.length)
    expect(new Set(descriptions).size).toBe(descriptions.length)
    for (const c of all) {
      expect(c.description.length, c.title).toBeGreaterThan(70)
      expect(c.description.length, c.title).toBeLessThan(170)
      expect(c.intro.length, c.title).toBeGreaterThan(100)
    }
  })
})
```

- [ ] **Step 4: Run the tests**

Run: `bun test src/site/pages/copy.test.ts`
Expected: PASS. (If a description length assertion fails, adjust the copy — not the bounds.)

- [ ] **Step 5: Commit**

```bash
git add content/ src/site/pages/copy.ts src/site/pages/copy.test.ts
git commit -m "feat: sample documents and SEO copy for programmatic pages"
```

---

### Task 4: CSS scoping and the shared page shell

Two pure modules: `scopedSampleCss()` (wraps theme CSS in a scope class via native CSS nesting so a rendered sample can live inline in a marketing page) and `pageShell()` (the shared static-page skeleton with the same head invariants as `index.html`, site.css inlined, plus an `extraCss` slot so scoped sample CSS lands in the head — `<style>` in `<body>` is non-conforming HTML).

**Why scoping works:** our theme CSS is written with `:root`, `body`, and `html, body` selectors always at the start of a (possibly indented) line — the transform rewrites those to `&` and wraps everything in `.mds-theme-<id> { ... }`. Native CSS nesting gives nested bare selectors an implicit descendant combinator, and `@media` blocks nest legally inside style rules. `@page` cannot nest — it is dropped by the transform (embeds are not print targets; the standalone `/samples/*.html` files keep it).

**Files:**
- Create: `src/site/pages/scope-css.ts`
- Create: `src/site/pages/shell.ts`
- Test: `src/site/pages/scope-css.test.ts`
- Test: `src/site/pages/shell.test.ts`

**Interfaces:**
- Consumes: `baseCss`, `Theme` from `src/themes/registry.ts`.
- Produces (consumed by Task 5):
  - `scopedSampleCss(theme: Theme): string` — base+theme CSS scoped under `.mds-theme-<id>`, with the theme's default accent applied.
  - `escapeHtml(s: string): string`
  - `pageShell(opts: { title: string; description: string; path: string; main: string; extraCss?: string }): string` — full page HTML; `path` is the extensionless route (e.g. `/themes/paper`) used for the canonical/og URL; `extraCss` is appended inside the head `<style>` (scoped sample CSS goes here).
  - `SITE_ORIGIN = 'https://markdown.style'`

- [ ] **Step 1: Write the failing tests**

Create `src/site/pages/scope-css.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { themes } from '../../themes/registry'
import { scopedSampleCss } from './scope-css'

describe('scopedSampleCss', () => {
  it.each(themes.map(t => [t.id, t] as const))('scopes %s under its class with no root/body leaks', (_id, theme) => {
    const css = scopedSampleCss(theme)
    expect(css.startsWith(`.mds-theme-${theme.id} {`)).toBe(true)
    // no un-nested :root/body selectors may survive (they would style the host page)
    expect(css).not.toMatch(/^\s*:root\b/m)
    expect(css).not.toMatch(/^\s*html,\s*body\b/m)
    expect(css).not.toMatch(/^\s*body\s*\{/m)
    // @page cannot nest inside a style rule — must be stripped for embeds
    expect(css).not.toContain('@page')
    // theme accent is applied for the embed (render() normally does this via knobs)
    expect(css).toContain(`--mds-accent: ${theme.defaultAccent}`)
  })

  it('keeps @media print nested but drops nothing else structural', () => {
    const css = scopedSampleCss(themes[0]!)
    expect(css).toContain('@media print')
    expect(css).toContain('.mds-content') // structural class untouched
  })
})
```

Create `src/site/pages/shell.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { escapeHtml, pageShell, SITE_ORIGIN } from './shell'

describe('pageShell', () => {
  const html = pageShell({
    title: 'Test page — markdown.style',
    description: 'A test description that is long enough to look like real page copy for the assertions.',
    path: '/themes/paper',
    main: '<h1>Heading</h1><p>Body</p>',
    extraCss: '.mds-theme-test { color: red; }',
  })

  it('carries the marketing-page head invariants', () => {
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('<meta charset="utf-8">')
    expect(html).toContain(`<link rel="canonical" href="${SITE_ORIGIN}/themes/paper">`)
    expect(html).toContain('<meta property="og:title"')
    expect(html).toContain(`<meta property="og:url" content="${SITE_ORIGIN}/themes/paper">`)
    expect(html).toContain('<meta property="og:image" content="https://markdown.style/og.png">')
    expect(html).toContain('<meta name="description"')
  })

  it('is zero-JS and self-contained (inline css, no external origins)', () => {
    expect(html).not.toContain('<script')
    expect(html).toContain('<style>') // site.css inlined
    expect(html).not.toContain('href="/src/') // no dev-server asset links
    expect(html).not.toMatch(/(href|src)="https?:\/\/(?!markdown\.style[/"])/)
  })

  it('places extraCss in the head, before </style>', () => {
    const headEnd = html.indexOf('</head>')
    expect(html.indexOf('.mds-theme-test')).toBeGreaterThan(-1)
    expect(html.indexOf('.mds-theme-test')).toBeLessThan(headEnd)
  })

  it('has the site header, footer, trust badge, and the page main', () => {
    expect(html).toContain('class="brand"')
    expect(html).toContain('href="/editor"')
    expect(html).toContain('no upload')
    expect(html).toContain('<h1>Heading</h1>')
    expect(html).toContain('href="/privacy"')
  })

  it('escapeHtml escapes the dangerous four', () => {
    expect(escapeHtml('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/site/pages`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement scope-css.ts**

Create `src/site/pages/scope-css.ts`:

```ts
import { baseCss, type Theme } from '../../themes/registry'

/**
 * Rewrites document-level selectors to `&` and wraps the sheet in a scope
 * class, using native CSS nesting. Only used for samples embedded inline in
 * static marketing pages — standalone exports keep the unscoped sheet.
 * Relies on the theme-CSS convention (enforced by scope-css.test.ts) that
 * `:root`, `body`, and `html, body` selectors start their line.
 */
function rescopeDocumentSelectors(css: string): string {
  return css
    .replace(/^(\s*)html,\s*body\b/gm, '$1&')
    .replace(/^(\s*):root\b/gm, '$1&')
    .replace(/^(\s*)body\b/gm, '$1&')
    // @page cannot nest inside a style rule; drop it (embeds are not print targets)
    .replace(/^@page\s*\{[^}]*\}/gm, '')
}

export function scopedSampleCss(theme: Theme): string {
  const scope = `.mds-theme-${theme.id}`
  const sheet = rescopeDocumentSelectors(`${baseCss}\n${theme.css}`)
  // the accent normally arrives via render() knobs; embeds apply the default
  return `${scope} {\n${sheet}\n}\n${scope} { --mds-accent: ${theme.defaultAccent}; }`
}
```

Note for the implementer: `registry.ts` exports `Theme` as an interface — `import { baseCss, type Theme }` works as-is.

- [ ] **Step 4: Implement shell.ts**

Create `src/site/pages/shell.ts`:

```ts
import siteCss from '../site.css?raw'

export const SITE_ORIGIN = 'https://markdown.style'

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Shared skeleton for generated static pages. Mirrors index.html's head
 * invariants (canonical, og, description) but inlines site.css so the files
 * need no Vite processing and make zero requests beyond themselves.
 * Zero JS by design — AI crawlers do not execute it (spec §6).
 */
export function pageShell(opts: {
  title: string
  description: string
  path: string
  main: string
  extraCss?: string
}): string {
  const { title, description, path, main, extraCss = '' } = opts
  const url = `${SITE_ORIGIN}${path}`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE_ORIGIN}/og.png">
<meta name="twitter:card" content="summary_large_image">
<style>
${siteCss}
${extraCss}
</style>
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">markdown.style</a>
    <nav class="site-nav" aria-label="Site">
      <a href="/themes">Themes</a>
      <a class="btn-cta" href="/editor">Open the editor</a>
    </nav>
  </div>
</header>

<main>
  <div class="wrap">
${main}
    <p class="trust">100% in your browser · no upload · free · no sign-up</p>
  </div>
</main>

<footer class="site-footer">
  <div class="wrap">
    <span>© 2026 markdown.style</span>
    <a href="/themes">Themes</a>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="/editor">Editor</a>
  </div>
</footer>
</body>
</html>
`
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test src/site/pages`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/site/pages/scope-css.ts src/site/pages/shell.ts src/site/pages/scope-css.test.ts src/site/pages/shell.test.ts
git commit -m "feat: css scoping and shared shell for generated static pages"
```

---

### Task 5: Page builders and sitemap

Pure string builders for every generated page plus the sitemap, and the site.css additions they style with. The critical SEO property (advisor-mandated): **the rendered sample text must be present in the page's own HTML bytes** — non-JS AI crawlers must see the demo content without fetching anything else.

**Files:**
- Create: `src/site/pages/routes.ts`
- Create: `src/site/pages/theme-pages.ts`
- Create: `src/site/pages/use-case-pages.ts`
- Create: `src/site/pages/convert-pages.ts`
- Create: `src/site/pages/sitemap.ts`
- Modify: `src/site/site.css` (append component styles)
- Test: `src/site/pages/pages.test.ts`

**Interfaces:**
- Consumes: `renderBody` (Task 2); `themeCopy`, `useCases`, `convertPages`, types (Task 3); `scopedSampleCss`, `pageShell`, `escapeHtml` (Task 4); `themes`, `getTheme` from the registry.
- Produces (consumed by Task 6):
  - `routes.ts`: `GENERATED_ROUTES: readonly string[]`, `ALL_ROUTES: readonly string[]`, `routeToFile(route: string): string`
  - `buildThemesHub(samples: ReadonlyMap<string, string>): string` — map of themeId → rendered sample body
  - `buildThemePage(copy: ThemeCopy, sampleBody: string): string`
  - `buildUseCasePage(copy: UseCaseCopy, sampleMarkdown: string, sampleBody: string): string`
  - `buildConvertPage(copy: ConvertCopy): string`
  - `buildSitemap(routes: readonly string[]): string`

- [ ] **Step 1: Write routes.ts** (tests come with the builders in Step 2 — this module is their fixture)

Create `src/site/pages/routes.ts`:

```ts
import { themes } from '../../themes/registry'
import { convertPages, useCases } from './copy'

/** Extensionless routes the generator emits (samples are NOT routes — noindexed assets). */
export const GENERATED_ROUTES: readonly string[] = [
  '/themes',
  ...themes.map(t => `/themes/${t.id}`),
  ...useCases.map(u => `/use-cases/${u.slug}`),
  ...convertPages.map(c => `/convert/${c.slug}`),
]

/** Every canonical route on the site — the sitemap's exact contents. */
export const ALL_ROUTES: readonly string[] = ['/', '/editor', '/privacy', '/terms', ...GENERATED_ROUTES]

/** '/themes' -> 'themes.html'; '/themes/paper' -> 'themes/paper.html' (host clean-URLs). */
export function routeToFile(route: string): string {
  return `${route.replace(/^\//, '')}.html`
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/site/pages/pages.test.ts`:

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderBody } from '../../pipeline/render'
import { themes } from '../../themes/registry'
import { convertPages, themeCopy, useCases } from './copy'
import { buildConvertPage } from './convert-pages'
import { ALL_ROUTES, GENERATED_ROUTES } from './routes'
import { buildSitemap } from './sitemap'
import { buildThemePage, buildThemesHub } from './theme-pages'
import { buildUseCasePage } from './use-case-pages'

const samplesDir = join(import.meta.dirname, '..', '..', '..', 'content', 'samples')
const showcase = readFileSync(join(samplesDir, 'showcase.md'), 'utf8')

// build everything once; individual tests assert invariants across the set
async function buildAll(): Promise<Map<string, string>> {
  const pages = new Map<string, string>()
  const sampleBodies = new Map<string, string>()
  for (const t of themes) {
    sampleBodies.set(t.id, (await renderBody(showcase, t.id)).body)
  }
  pages.set('/themes', buildThemesHub(sampleBodies))
  for (const c of themeCopy) pages.set(`/themes/${c.id}`, buildThemePage(c, sampleBodies.get(c.id)!))
  for (const u of useCases) {
    const md = readFileSync(join(samplesDir, `${u.slug}.md`), 'utf8')
    const { body } = await renderBody(md, u.themeId)
    pages.set(`/use-cases/${u.slug}`, buildUseCasePage(u, md, body))
  }
  for (const c of convertPages) pages.set(`/convert/${c.slug}`, buildConvertPage(c))
  return pages
}

const pagesPromise = buildAll()

describe('generated page invariants', () => {
  it('every route builds and satisfies the static-page contract', async () => {
    const pages = await pagesPromise
    expect([...pages.keys()].sort()).toEqual([...GENERATED_ROUTES].sort())
    for (const [route, html] of pages) {
      expect(html, route).toMatch(/^<!doctype html>/i)
      expect(html, route).toContain(`<link rel="canonical" href="https://markdown.style${route}">`)
      expect(html, route).not.toContain('<script') // zero JS on citable pages
      // self-contained: nothing may be FETCHED from another origin (sample
      // documents legitimately contain plain <a href> demo links — no request)
      expect(html, route).not.toMatch(/src="https?:\/\/(?!markdown\.style[/"])/)
      expect(html, route).not.toMatch(/<link [^>]*href="https?:\/\/(?!markdown\.style[/"])/)
      expect(html, route).not.toMatch(/href="\/[a-z-]+\.html"/) // internal links extensionless
      expect(html, route).toContain('no upload') // trust badge
      expect(html, route).toContain('href="/editor') // every page routes to the tool
    }
  })

  it('h1 structure: the hero h1 leads, and the only other h1s are inside sample embeds', async () => {
    const pages = await pagesPromise
    for (const [route, html] of pages) {
      const embeds = (html.match(/class="mds-theme-/g) ?? []).length
      const h1s = (html.match(/<h1[\s>]/g) ?? []).length
      // each embedded sample document carries exactly one h1 of its own
      expect(h1s, route).toBe(1 + embeds)
      const firstH1 = html.indexOf('<h1')
      const firstEmbed = html.indexOf('class="mds-theme-')
      expect(firstH1, route).toBeGreaterThan(-1)
      if (firstEmbed !== -1) expect(firstH1, route).toBeLessThan(firstEmbed)
    }
  })

  it('theme pages inline the real rendered sample in their own bytes (SEO-critical)', async () => {
    const pages = await pagesPromise
    for (const t of themes) {
      const html = pages.get(`/themes/${t.id}`)!
      expect(html, t.id).toContain('Quarterly Growth Report') // sample h1 text present inline
      expect(html, t.id).toContain('Consolidate Q3 numbers') // task list came through
      expect(html, t.id).toContain(`mds-theme-${t.id}`) // scoped, not iframed
      expect(html, t.id).not.toContain('<iframe')
      expect(html, t.id).toContain(`href="/editor?theme=${t.id}"`) // deep link into the tool
      expect(html, t.id).toContain(`href="/samples/${t.id}.html"`) // human-facing full export
    }
  })

  it('the hub previews all eight themes inline and links each theme page', async () => {
    const pages = await pagesPromise
    const hub = pages.get('/themes')!
    for (const t of themes) {
      expect(hub, t.id).toContain(`href="/themes/${t.id}"`)
      expect(hub, t.id).toContain(`mds-theme-${t.id}`)
    }
    expect(hub).not.toContain('<iframe')
  })

  it('use-case pages show the markdown source AND the rendered result', async () => {
    const pages = await pagesPromise
    for (const u of useCases) {
      const html = pages.get(`/use-cases/${u.slug}`)!
      expect(html, u.slug).toContain('<details') // escaped source, zero-JS disclosure
      expect(html, u.slug).toContain(`mds-theme-${u.themeId}`)
      expect(html, u.slug).toContain(`href="/editor?theme=${u.themeId}"`)
    }
  })

  it('no generated route is an orphan: every one is linked from another generated page', async () => {
    const pages = await pagesPromise
    const allHtml = [...pages.entries()]
    for (const route of GENERATED_ROUTES) {
      const linkedFrom = allHtml.filter(([r, html]) => r !== route && html.includes(`href="${route}"`))
      expect(linkedFrom.length, route).toBeGreaterThan(0)
    }
  })

  it('convert pages cross-link each other and the themes hub', async () => {
    const pages = await pagesPromise
    expect(pages.get('/convert/markdown-to-pdf')!).toContain('href="/convert/markdown-to-html"')
    expect(pages.get('/convert/markdown-to-html')!).toContain('href="/convert/markdown-to-pdf"')
    for (const c of convertPages) expect(pages.get(`/convert/${c.slug}`)!).toContain('href="/themes"')
  })
})

describe('buildSitemap', () => {
  it('emits exactly the canonical routes, absolute, samples excluded', () => {
    const xml = buildSitemap(ALL_ROUTES)
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1])
    expect(urls).toEqual(ALL_ROUTES.map(r => (r === '/' ? 'https://markdown.style/' : `https://markdown.style${r}`)))
    expect(xml).not.toContain('/samples/')
    expect(urls.length).toBeLessThanOrEqual(25) // spec §6 launch ceiling
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `bun test src/site/pages/pages.test.ts`
Expected: FAIL — builder modules don't exist.

- [ ] **Step 4: Implement the builders**

Create `src/site/pages/theme-pages.ts`:

```ts
import { getTheme, themes } from '../../themes/registry'
import type { ThemeCopy } from './copy'
import { themeCopy } from './copy'
import { scopedSampleCss } from './scope-css'
import { escapeHtml, pageShell } from './shell'

function sampleEmbed(themeId: string, sampleBody: string, label: string): string {
  // the matching scoped css travels via pageShell's extraCss (style-in-body is non-conforming)
  return `<figure class="sample-embed" role="group" aria-label="${escapeHtml(label)}">
<div class="mds-theme-${themeId}"><div class="mds-content">
${sampleBody}
</div></div>
</figure>`
}

export function buildThemePage(copy: ThemeCopy, sampleBody: string): string {
  const theme = getTheme(copy.id)
  const related = copy.pairWith
    .map(id => {
      const rc = themeCopy.find(c => c.id === id)!
      return `<li><a href="/themes/${id}">${escapeHtml(getTheme(id).name)}</a> — ${escapeHtml(rc.whoItSuits.split('—')[0]!.trim())}</li>`
    })
    .join('\n')
  const main = `<section class="hero" aria-label="Introduction" style="border-top:0">
  <h1>${escapeHtml(copy.h1)}</h1>
  <p class="lede">${escapeHtml(copy.intro)}</p>
  <div class="cta-row">
    <a class="btn-cta" href="/editor?theme=${copy.id}">Use ${escapeHtml(theme.name)} on my markdown</a>
    <a class="btn-ghost" href="/samples/${copy.id}.html">Open the exported file</a>
  </div>
</section>

<section aria-label="Sample document">
  <h2>What does the ${escapeHtml(theme.name)} theme look like?</h2>
  <p class="answer">This is a complete sample report rendered in ${escapeHtml(theme.name)} — the exact output the editor downloads, embedded here unmodified.</p>
${sampleEmbed(copy.id, sampleBody, `Sample document rendered in the ${theme.name} theme`)}
</section>

<section aria-label="Who it suits">
  <h2>Who is the ${escapeHtml(theme.name)} theme for?</h2>
  <p class="answer">${escapeHtml(copy.whoItSuits)}</p>
</section>

<section aria-label="Related themes">
  <h2>Which themes pair well with it?</h2>
  <ul>
${related}
  </ul>
  <p><a class="btn-ghost" href="/themes">Browse all eight themes →</a></p>
</section>`
  return pageShell({
    title: copy.title,
    description: copy.description,
    path: `/themes/${copy.id}`,
    main,
    extraCss: scopedSampleCss(theme),
  })
}

export function buildThemesHub(samples: ReadonlyMap<string, string>): string {
  const cards = themes
    .map(t => {
      return `<li>
<a class="theme-card-link" href="/themes/${t.id}">
  <div class="mini-preview" aria-hidden="true">
    <div class="mds-theme-${t.id}"><div class="mds-content">
${samples.get(t.id) ?? ''}
    </div></div>
  </div>
  <span class="theme-card-meta"><strong>${escapeHtml(t.name)}</strong><span class="desc">${escapeHtml(t.description)}</span></span>
</a>
</li>`
    })
    .join('\n')
  const main = `<section class="hero" aria-label="Introduction" style="border-top:0">
  <h1>What do the markdown.style themes look like?</h1>
  <p class="lede">Eight designed looks, each previewed below on the same real report — a warm book serif, a clean product-doc sans, a dark technical theme that prints light, and more. Click any theme for the full sample and a one-click way to apply it to your own markdown.</p>
</section>

<section aria-label="Theme gallery">
  <ul class="theme-grid">
${cards}
  </ul>
</section>

<section aria-label="Next steps">
  <h2>How do I use one of these on my own document?</h2>
  <p class="answer">Open any theme page and click “Use this theme”, or go straight to the <a href="/editor">editor</a> and paste your markdown — the theme picker previews all eight live. See a worked example: <a href="/use-cases/chatgpt-report">a ChatGPT research answer styled into a report</a>, or the two-step paths to <a href="/convert/markdown-to-pdf">PDF</a> and <a href="/convert/markdown-to-html">a single HTML file</a>.</p>
</section>`
  return pageShell({
    title: 'Themes — eight designed looks for LLM markdown — markdown.style',
    description: 'Compare all eight markdown.style themes on the same real report: book serif, product-doc sans, dark technical, minimal Swiss, academic, and more.',
    path: '/themes',
    main,
    extraCss: themes.map(t => scopedSampleCss(t)).join('\n'),
  })
}
```

Create `src/site/pages/use-case-pages.ts`:

```ts
import { getTheme } from '../../themes/registry'
import type { UseCaseCopy } from './copy'
import { scopedSampleCss } from './scope-css'
import { escapeHtml, pageShell } from './shell'

export function buildUseCasePage(copy: UseCaseCopy, sampleMarkdown: string, sampleBody: string): string {
  const theme = getTheme(copy.themeId)
  const sections = copy.sections
    .map(s => `<section><h2>${escapeHtml(s.q)}</h2><p class="answer">${escapeHtml(s.a)}</p></section>`)
    .join('\n')
  const main = `<section class="hero" aria-label="Introduction" style="border-top:0">
  <h1>${escapeHtml(copy.h1)}</h1>
  <p class="lede">${escapeHtml(copy.intro)}</p>
  <div class="cta-row">
    <a class="btn-cta" href="/editor?theme=${copy.themeId}">Style my markdown like this</a>
    <a class="btn-ghost" href="/themes/${copy.themeId}">About the ${escapeHtml(theme.name)} theme</a>
  </div>
</section>

<section aria-label="Worked example">
  <h2>What goes in, what comes out</h2>
  <p class="answer">The markdown below is the raw input. Under it: the same document rendered in the ${escapeHtml(theme.name)} theme — embedded here exactly as the editor would export it.</p>
  <details class="md-source">
    <summary>See the markdown source</summary>
    <pre>${escapeHtml(sampleMarkdown)}</pre>
  </details>
  <figure class="sample-embed" role="group" aria-label="Rendered result in the ${escapeHtml(theme.name)} theme">
  <div class="mds-theme-${copy.themeId}"><div class="mds-content">
${sampleBody}
  </div></div>
  </figure>
  <p><a href="/samples/${copy.slug}.html">Open the exported file</a> — one self-contained HTML document, no external requests.</p>
</section>

${sections}

<section aria-label="More">
  <h2>More ways in</h2>
  <p class="answer">Browse <a href="/themes">all eight themes</a>, or go straight to <a href="/convert/markdown-to-pdf">markdown → PDF</a> / <a href="/convert/markdown-to-html">markdown → HTML</a>.</p>
</section>`
  return pageShell({
    title: copy.title,
    description: copy.description,
    path: `/use-cases/${copy.slug}`,
    main,
    extraCss: scopedSampleCss(theme),
  })
}
```

Create `src/site/pages/convert-pages.ts`:

```ts
import type { ConvertCopy } from './copy'
import { convertPages, useCases } from './copy'
import { escapeHtml, pageShell } from './shell'

export function buildConvertPage(copy: ConvertCopy): string {
  const other = convertPages.find(c => c.slug !== copy.slug)!
  const sections = copy.sections
    .map(s => `<section><h2>${escapeHtml(s.q)}</h2><p class="answer">${escapeHtml(s.a)}</p></section>`)
    .join('\n')
  const workedExamples = useCases
    .map(u => `<li><a href="/use-cases/${u.slug}">${escapeHtml(u.h1)}</a></li>`)
    .join('\n')
  const main = `<section class="hero" aria-label="Introduction" style="border-top:0">
  <h1>${escapeHtml(copy.h1)}</h1>
  <p class="lede">${escapeHtml(copy.intro)}</p>
  <div class="cta-row">
    <a class="btn-cta" href="/editor">Open the editor</a>
    <a class="btn-ghost" href="/themes">See the eight themes</a>
  </div>
</section>

${sections}

<section aria-label="Worked examples">
  <h2>Worked examples</h2>
  <ul>
${workedExamples}
  </ul>
  <p class="answer">Prefer the other output? <a href="/convert/${other.slug}">${escapeHtml(other.h1)}</a>.</p>
</section>`
  return pageShell({ title: copy.title, description: copy.description, path: `/convert/${copy.slug}`, main })
}
```

Create `src/site/pages/sitemap.ts`:

```ts
import { SITE_ORIGIN } from './shell'

export function buildSitemap(routes: readonly string[]): string {
  const urls = routes
    .map(r => `  <url><loc>${r === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${r}`}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}
```

- [ ] **Step 5: Append component styles to site.css**

Append to `src/site/site.css`:

```css
/* --- generated pages: theme gallery + inline sample embeds --- */
.theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; padding: 0; list-style: none; }
.theme-card-link { display: block; text-decoration: none; color: inherit; border: 1px solid var(--site-rule); border-radius: 10px; overflow: hidden; }
.theme-card-link:hover, .theme-card-link:focus-visible { border-color: var(--site-accent); }
.mini-preview { height: 220px; overflow: hidden; pointer-events: none; }
.mini-preview .mds-content { width: 200%; transform: scale(0.5); transform-origin: top left; padding: 24px; }
.theme-card-meta { display: block; padding: 12px 14px; }
.theme-card-meta .desc { display: block; color: var(--site-muted); font-size: 0.9em; margin-top: 2px; }
.sample-embed { margin: 24px 0; border: 1px solid var(--site-rule); border-radius: 10px; overflow: hidden; }
.md-source { margin: 20px 0; }
.md-source summary { cursor: pointer; font-weight: 600; }
.md-source pre { overflow-x: auto; background: var(--site-accent-soft); padding: 16px; border-radius: 8px; font-size: 0.85em; }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun test src/site/pages`
Expected: PASS (pages tests use the real `renderBody` — Shiki bundles its grammars locally; nothing is fetched).

- [ ] **Step 7: Commit**

```bash
git add src/site/pages/routes.ts src/site/pages/theme-pages.ts src/site/pages/use-case-pages.ts src/site/pages/convert-pages.ts src/site/pages/sitemap.ts src/site/site.css src/site/pages/pages.test.ts
git commit -m "feat: page builders and sitemap for programmatic SEO pages"
```

---

### Task 6: Build orchestrator, bun script, and wiring

Ties it together: `buildAllPages(outDir)` writes every page, every standalone sample (noindexed), and the sitemap; `scripts/build-pages.ts` runs it against `dist/`; `package.json` chains it after `vite build`; the static `public/sitemap.xml` is deleted (now generated) and `public/llms.txt` learns about the hub.

**Files:**
- Create: `src/site/pages/build.ts`
- Create: `scripts/build-pages.ts`
- Modify: `package.json` (build script)
- Delete: `public/sitemap.xml`
- Modify: `public/llms.txt` (add themes hub line)
- Modify: `src/site/site.test.ts` (sitemap test now targets the generator)
- Test: `src/site/pages/build.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–5; `render` from `src/pipeline/render.ts` (full standalone samples).
- Produces: `buildAllPages(outDir: string): Promise<string[]>` (returns written paths relative to outDir, sorted); `scripts/build-pages.ts` CLI; `"build": "vite build && bun scripts/build-pages.ts"`.

- [ ] **Step 1: Write the failing test**

Create `src/site/pages/build.test.ts`:

```ts
// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { themes } from '../../themes/registry'
import { buildAllPages } from './build'
import { useCases } from './copy'
import { ALL_ROUTES, GENERATED_ROUTES, routeToFile } from './routes'

const outDir = mkdtempSync(join(tmpdir(), 'mds-pages-'))
afterAll(() => rmSync(outDir, { recursive: true, force: true }))

describe('buildAllPages', () => {
  it('writes exactly the expected file set', async () => {
    const written = await buildAllPages(outDir)
    const expected = [
      ...GENERATED_ROUTES.map(routeToFile),
      ...themes.map(t => `samples/${t.id}.html`),
      ...useCases.map(u => `samples/${u.slug}.html`),
      'sitemap.xml',
    ].sort()
    expect(written).toEqual(expected)
  })

  it('standalone samples are real exports, noindexed', () => {
    for (const t of themes) {
      const html = readFileSync(join(outDir, 'samples', `${t.id}.html`), 'utf8')
      expect(html, t.id).toMatch(/^<!doctype html>/i)
      expect(html, t.id).toContain('<meta name="robots" content="noindex">')
      expect(html, t.id).toContain('Quarterly Growth Report')
      expect(html, t.id).not.toContain('<script')
    }
  })

  it('the written sitemap covers exactly the canonical routes', () => {
    const xml = readFileSync(join(outDir, 'sitemap.xml'), 'utf8')
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1])
    expect(urls).toEqual(ALL_ROUTES.map(r => (r === '/' ? 'https://markdown.style/' : `https://markdown.style${r}`)))
  })

  it('a written theme page carries the inline sample (spot check end-to-end)', () => {
    const html = readFileSync(join(outDir, 'themes', 'paper.html'), 'utf8')
    expect(html).toContain('mds-theme-paper')
    expect(html).toContain('Quarterly Growth Report')
  })
})
```

Test-ordering note: the file-set test runs `buildAllPages` first; the later tests read its output from the same `outDir`. Vitest runs tests in a file sequentially by default — do not add `.concurrent`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/site/pages/build.test.ts`
Expected: FAIL — `build.ts` doesn't exist.

- [ ] **Step 3: Implement build.ts**

Create `src/site/pages/build.ts`:

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { render, renderBody } from '../../pipeline/render'
import { themes } from '../../themes/registry'
import { convertPages, themeCopy, useCases } from './copy'
import { buildConvertPage } from './convert-pages'
import { ALL_ROUTES, routeToFile } from './routes'
import { buildSitemap } from './sitemap'
import { buildThemePage, buildThemesHub } from './theme-pages'
import { buildUseCasePage } from './use-case-pages'

const samplesDir = join(import.meta.dirname, '..', '..', '..', 'content', 'samples')

function injectNoindex(html: string): string {
  // standalone samples are demo assets, not pages: keep them out of the index
  return html.replace('<head>', '<head>\n<meta name="robots" content="noindex">')
}

/** Renders and writes every generated page, sample, and the sitemap into outDir. */
export async function buildAllPages(outDir: string): Promise<string[]> {
  const written: string[] = []
  const write = (rel: string, content: string): void => {
    const path = join(outDir, rel)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
    written.push(rel)
  }

  const showcase = readFileSync(join(samplesDir, 'showcase.md'), 'utf8')

  // theme pages + hub share one showcase render per theme; a rendering error
  // in sample content is a build bug — fail loudly, never ship a broken demo
  const sampleBodies = new Map<string, string>()
  for (const t of themes) {
    const { body, errors } = await renderBody(showcase, t.id)
    if (errors.length > 0) throw new Error(`sample render failed for ${t.id}: ${errors[0]!.message}`)
    sampleBodies.set(t.id, body)
    const full = await render(showcase, t.id)
    write(`samples/${t.id}.html`, injectNoindex(full.html))
  }
  write(routeToFile('/themes'), buildThemesHub(sampleBodies))
  for (const c of themeCopy) {
    write(routeToFile(`/themes/${c.id}`), buildThemePage(c, sampleBodies.get(c.id)!))
  }

  for (const u of useCases) {
    const md = readFileSync(join(samplesDir, `${u.slug}.md`), 'utf8')
    const { body, errors } = await renderBody(md, u.themeId)
    if (errors.length > 0) throw new Error(`sample render failed for ${u.slug}: ${errors[0]!.message}`)
    write(routeToFile(`/use-cases/${u.slug}`), buildUseCasePage(u, md, body))
    const full = await render(md, u.themeId)
    write(`samples/${u.slug}.html`, injectNoindex(full.html))
  }

  for (const c of convertPages) {
    write(routeToFile(`/convert/${c.slug}`), buildConvertPage(c))
  }

  write('sitemap.xml', buildSitemap(ALL_ROUTES))
  return written.sort()
}
```

- [ ] **Step 4: Create the CLI script**

Create `scripts/build-pages.ts`:

```ts
// Runs after `vite build`: writes the programmatic pages, standalone samples,
// and sitemap straight into dist/. Plain bun — it resolves the pipeline's
// `?raw` css imports natively, so no bundler is involved (verified 2026-07-10).
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { buildAllPages } from '../src/site/pages/build'

const dist = join(import.meta.dir, '..', 'dist')
if (!existsSync(dist)) {
  console.error('dist/ not found — run `vite build` first (or use `bun run build`)')
  process.exit(1)
}
const written = await buildAllPages(dist)
console.log(`wrote ${written.length} files into dist/:\n${written.map(f => `  ${f}`).join('\n')}`)
```

- [ ] **Step 5: Wire package.json, delete the static sitemap, update llms.txt**

In `package.json`, change the build script and add a pages-only helper:

```json
"build": "vite build && bun scripts/build-pages.ts",
"build:pages": "bun scripts/build-pages.ts",
```

Delete `public/sitemap.xml` (`git rm public/sitemap.xml`) — the generator owns it now. `public/robots.txt` keeps its `Sitemap:` line unchanged.

In `public/llms.txt`, add one line to the "Key pages" list, after the editor line:

```
- Theme gallery (all eight looks on one report): https://markdown.style/themes
```

- [ ] **Step 6: Update site.test.ts**

In `src/site/site.test.ts`, replace the `'sitemap covers exactly the live routes and every route has a page file'` test (the file `public/sitemap.xml` no longer exists) with:

```ts
  it('the generated sitemap is the single source of routes (static copy removed)', () => {
    expect(() => read('public/sitemap.xml')).toThrow() // generator owns it now
  })
```

(The generator's own coverage lives in `src/site/pages/build.test.ts` — do not duplicate it here.) Keep the robots.txt test unchanged; extend the llms.txt test with:

```ts
    expect(llms).toContain('https://markdown.style/themes')
```

- [ ] **Step 7: Run everything**

Run: `bun test` — expected: all green.
Run: `bunx tsc --noEmit` — expected: clean (`@types/node` and `@types/bun` are already devDependencies; `src/site/site.test.ts` already uses `import.meta.dirname`, so the tsconfig permits it).
Run: `bun run build` — expected: vite build succeeds, then `wrote 26 files into dist/:` (14 route files + 11 samples + sitemap.xml = 26), and `ls dist/themes.html dist/themes dist/use-cases dist/convert dist/samples dist/sitemap.xml` shows everything in place.

- [ ] **Step 8: Commit**

```bash
git add src/site/pages/build.ts scripts/build-pages.ts package.json public/llms.txt src/site/site.test.ts src/site/pages/build.test.ts
git rm public/sitemap.xml
git commit -m "feat: build-time page generation wired into the build; sitemap generated"
```

---

### Task 7: Editor `?theme=` deep link

Gallery pages link to `/editor?theme=<id>`. On mount, a valid `theme` query param overrides the restored theme (same semantics as picking in the theme dialog: knobs reset), then the param is stripped from the URL so later visits restore normally.

**Files:**
- Modify: `src/app/main.ts`
- Test: `src/app/main.test.ts` (append)

**Interfaces:**
- Consumes: `themes` from the registry (already imported in main.ts); `createStore` (unchanged).
- Produces: URL contract `GET /editor?theme=<themeId>` — consumed by the pages built in Task 5 (already emitting these links).

- [ ] **Step 1: Write the failing tests**

Append to `src/app/main.test.ts`:

```ts
describe('?theme= deep link', () => {
  it('applies a valid theme param over restored state and strips it from the URL', async () => {
    localStorage.setItem('mds-state-v1', JSON.stringify({ markdown: '# Keep me', themeId: 'paper', knobs: { accent: '#123456' } }))
    history.replaceState(null, '', '/editor?theme=pop')
    await mount(document.getElementById('app')!)
    // observable via the accent knob: initKnobControls falls back to the active theme's default
    const accent = document.querySelector<HTMLInputElement>('[aria-label="Accent color"]')!
    expect(accent.value).toBe('#d81b7a') // pop's defaultAccent; knobs were reset
    expect(location.search).toBe('') // param stripped
  })

  it('ignores an unknown theme param', async () => {
    localStorage.setItem('mds-state-v1', JSON.stringify({ markdown: '# Keep me', themeId: 'slate', knobs: {} }))
    history.replaceState(null, '', '/editor?theme=neon-vaporwave')
    await mount(document.getElementById('app')!)
    const accent = document.querySelector<HTMLInputElement>('[aria-label="Accent color"]')!
    expect(accent.value).toBe('#0969da') // slate's defaultAccent — untouched
  })
})
```

Also reset the URL between tests — add `history.replaceState(null, '', '/')` to the existing `beforeEach`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/app/main.test.ts`
Expected: the two new tests FAIL (accent stays at the stored theme; search survives).

- [ ] **Step 3: Implement**

In `src/app/main.ts`, inside `mount()`, immediately after `const store = createStore(initial)`:

```ts
  // gallery deep links: /editor?theme=<id> applies the theme (knobs reset,
  // same as picking it in the dialog) and then leaves the URL clean
  const requestedTheme = new URLSearchParams(location.search).get('theme')
  if (requestedTheme && themes.some(t => t.id === requestedTheme)) {
    if (requestedTheme !== store.get().themeId) store.set({ themeId: requestedTheme, knobs: {} })
    history.replaceState(null, '', location.pathname)
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/app/main.test.ts`
Expected: PASS (all four tests in the file).

- [ ] **Step 5: Commit**

```bash
git add src/app/main.ts src/app/main.test.ts
git commit -m "feat: editor ?theme= deep link for gallery pages"
```

---

### Task 8: Landing cross-links, registry-sync test, final verification

The landing page must link the new hub (it is currently the only path in from the homepage) and its hand-written theme strip must be test-locked to the registry so it can't silently drift. Then verify the whole branch end to end.

**Files:**
- Modify: `index.html`
- Modify: `src/site/site.css` (strip link styling)
- Test: `src/site/site.test.ts` (append)

**Interfaces:**
- Consumes: routes from Task 5/6 output (`/themes`, `/themes/<id>`).
- Produces: nothing downstream — this is the final task.

- [ ] **Step 1: Write the failing tests**

Append to `src/site/site.test.ts` (import `themes` from `../themes/registry` at the top — the file is `// @vitest-environment node`; the registry imports CSS via `?raw`, which vitest handles):

```ts
describe('landing ↔ registry sync', () => {
  const html = read('index.html')

  it('links the themes hub from nav and strip section', () => {
    expect(html).toContain('href="/themes"')
  })

  it('theme strip mirrors the registry exactly and links every theme page', () => {
    for (const t of themes) {
      expect(html, t.id).toContain(`href="/themes/${t.id}"`)
      expect(html, t.id).toContain(`>${t.name}<`)
      expect(html, t.id).toContain(`background:${t.defaultAccent}`)
    }
    expect(html.match(/class="swatch"/g)).toHaveLength(themes.length)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/site/site.test.ts`
Expected: FAIL — no `/themes` links yet.

- [ ] **Step 3: Update index.html and site.css**

Three edits to `index.html`:

1. Nav: change `<a href="#themes">Themes</a>` → `<a href="/themes">Themes</a>`.
2. Theme strip: wrap each item's name in a link to its theme page. Replace each `<li>` following this pattern (all 8; names/accents already match the registry):

```html
<li><strong><span class="swatch" style="background:#8b3a2f"></span><a href="/themes/paper">Paper</a></strong><span class="desc">Warm, book-like serif</span></li>
```

3. After the `</ul>` of the theme strip, add:

```html
<p><a class="btn-ghost" href="/themes">Browse all eight themes in detail →</a></p>
```

Append to `src/site/site.css` (near the theme-strip rules) so the new strip links inherit the strong color:

```css
.theme-strip strong a { color: inherit; text-decoration: none; }
.theme-strip strong a:hover, .theme-strip strong a:focus-visible { color: var(--site-accent); text-decoration: underline; }
```

- [ ] **Step 4: Run the full verification battery**

Run, in order, all expected green/clean:

```bash
bun test
bunx tsc --noEmit
bun run build
```

Then inspect the built output (file-level checks, no browser):

```bash
ls dist/themes.html dist/sitemap.xml dist/samples dist/themes dist/use-cases dist/convert
grep -c '<loc>' dist/sitemap.xml            # expected: 18
grep -L 'no upload' dist/themes/*.html dist/use-cases/*.html dist/convert/*.html   # expected: no output (all carry the badge)
grep -l '<script' dist/themes/*.html dist/use-cases/*.html dist/convert/*.html    # expected: no output (zero JS)
grep -c 'noindex' dist/samples/paper.html   # expected: 1
```

- [ ] **Step 5: Commit**

```bash
git add index.html src/site/site.css src/site/site.test.ts
git commit -m "feat: landing links the theme gallery; strip test-locked to the registry"
```

---

## Deviations from the spec (deliberate, with reasons)

- **`content/*.json` → `content/samples/*.md` + `src/site/pages/copy.ts`.** The spec's "content/themes.json / content/use-cases.json" describes the mechanism (content data feeding `render()` at build time), not a serialization mandate; markdown-in-JSON needs escaped newlines and fences, and typed TS copy gets checked by `tsc`.
- **Samples are embedded inline with scoped CSS, not iframed.** Non-JS AI crawlers (the spec's own governing constraint) never merge iframe content into the referencing page; inlining is what makes each page "genuinely unique rendered content" in its own bytes. Standalone `/samples/*.html` files remain as noindexed human-facing demos of the actual export.
- **Sample content additionally bans math** (spec only bans mermaid): any math render embeds ~360KB of KaTeX font CSS, which would sink the static pages' CWV. Enforced by test.
- **Landing theme strip stays hand-authored, locked by a registry-sync test** rather than generated — index.html is a Vite MPA entry and the strip is 8 lines; a test is the cheaper drift guard.

## Out of scope (unchanged from roadmap)

Owner launch assets (og.png 1200×630, favicon, domain + Cloudflare Pages setup — including verifying CF's clean-URL/trailing-slash handling matches the extensionless canonicals); real-device mobile verification; post-launch GEO roadmap items.
