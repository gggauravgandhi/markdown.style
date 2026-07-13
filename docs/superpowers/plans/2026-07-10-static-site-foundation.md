# Static Site Foundation Implementation Plan (Plan 4a)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployable public site: landing page with the research-backed positioning, `/privacy` + `/terms`, robots.txt/sitemap.xml/llms.txt, JSON-LD, every citable page as static HTML. (Plan 4b adds the programmatic theme/use-case/convert pages + their generator.)

**Architecture:** Hand-authored static HTML pages at repo root (`index.html`, `privacy.html`, `terms.html`) added as Vite MPA inputs beside `editor.html`; crawl files in `public/` (copied verbatim by Vite). One shared `src/site/site.css`. A node-environment test suite reads the HTML/crawl files from disk and enforces the SEO invariants mechanically (JSON-LD validity, no FAQPage schema, answer-first hero, robots directives, sitemap↔pages consistency).

**Tech Stack:** static HTML + CSS. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-10-markdown-style-design.md` (section 6, traffic architecture; DON'Ts list is binding)

## Global Constraints

- Use `bun` for everything, never npm/npx/yarn/node.
- **Every citable page is static HTML**, no marketing copy behind client-side rendering; the landing page loads NO JavaScript at all.
- **Positioning (research ruling):** hero = "Turn your ChatGPT or Claude output into a designed report." NEVER lead with "markdown to pdf" as the hero framing. "100% in your browser · no upload · free" appears as a trust line.
- **Copy is answer-first:** each section opens with a direct 1–2 sentence answer; H2s use natural question phrasing.
- **JSON-LD on the landing page:** `WebApplication` (applicationCategory `DeveloperApplication`, offers price "0") + `Organization` + `WebSite`. **NO** `aggregateRating`, NO `review`, NO `SearchAction`, and **NO FAQPage/HowTo schema anywhere** (prose Q&A headings only, research DON'T).
- **robots.txt allows ALL crawlers**, explicit Allow entries for citation bots (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Claude-User) AND training bots (GPTBot, ClaudeBot) allowed, owner ruling 2026-07-10. Sitemap pointer included.
- Canonical URLs use `https://markdown.style/...`; internal links use extensionless paths (`/editor`, `/privacy`), production hosts resolve `.html` clean URLs; NEVER hash routing.
- `sitemap.xml` lists exactly: `/`, `/editor`, `/privacy`, `/terms` (4a scope; 4b extends it).
- OG meta (`og:title`, `og:description`, `og:url`, `og:type`) on every page; `og:image` + `twitter:card` on the LANDING page only (it's the share target; privacy/terms don't need cards). The 1200×630 OG image is a launch asset the OWNER supplies, reference `/og.png` in meta now and record the TODO in the ledger (do not fabricate a binary).
- No analytics, no external requests of any kind from marketing pages.
- A11y basics: semantic landmarks (header/main/footer), one h1 per page, visible focus states.
- TDD: the site-invariants test suite is written FIRST (failing), then pages are authored to satisfy it.
- Conventional commits, no Co-Authored-By.

## File Structure

```
index.html            # NEW: landing (static, zero JS)
privacy.html          # NEW
terms.html            # NEW
public/robots.txt     # NEW: copied verbatim into dist/
public/llms.txt       # NEW
public/sitemap.xml    # NEW (static in 4a; 4b switches to generated)
src/site/site.css     # NEW: shared marketing styling (referenced via /src/site/site.css, Vite-processed)
src/site/site.test.ts # NEW: node-env suite enforcing SEO invariants from disk
vite.config.ts        # MODIFY: add index/privacy/terms MPA inputs
```

---

### Task 1: SEO invariants test suite (failing) + crawl files

**Files:**
- Create: `src/site/site.test.ts`, `public/robots.txt`, `public/llms.txt`, `public/sitemap.xml`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: repo-root HTML files (Task 2/3 create them)
- Produces: the mechanical SEO gate every marketing page must pass; crawl files served at site root.

- [ ] **Step 1: Write the failing test suite**

`src/site/site.test.ts`:
```ts
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '..', '..')
const read = (p: string): string => readFileSync(join(root, p), 'utf8')

const MARKETING_PAGES = ['index.html', 'privacy.html', 'terms.html']

describe('marketing pages', () => {
  it.each(MARKETING_PAGES)('%s is static, self-contained, and canonical', page => {
    const html = read(page)
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('<meta charset="utf-8">')
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/markdown\.style\//)
    expect(html).toMatch(/<meta property="og:title"/)
    expect(html).toMatch(/<meta name="description"/)
    // zero JS on citable pages (AI crawlers don't execute it; there is nothing to execute)
    // NOTE: attribute-order-sensitive, JSON-LD scripts must be written exactly
    // as `<script type="application/ld+json">` (type attribute first)
    expect(html).not.toMatch(/<script(?! type="application\/ld\+json")/)
    // no external requests: only same-origin or inline assets
    expect(html).not.toMatch(/(href|src)="https?:\/\/(?!markdown\.style)/)
    // exactly one h1
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    // internal links extensionless, never hash-routed
    expect(html).not.toContain('href="/editor.html"')
    expect(html).not.toContain('href="#/')
  })

  it('landing leads with the LLM-report positioning, not "markdown to pdf"', () => {
    const html = read('index.html')
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)![1]!
    expect(h1.toLowerCase()).toContain('chatgpt')
    expect(h1.toLowerCase()).toContain('designed report')
    expect(h1.toLowerCase()).not.toContain('markdown to pdf')
    expect(html).toContain('href="/editor"')
    expect(html.toLowerCase()).toContain('no upload')
  })

  it('landing JSON-LD is valid and follows the schema rulings', () => {
    const html = read('index.html')
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    expect(blocks.length).toBeGreaterThanOrEqual(1)
    const types = blocks.flatMap(m => {
      const parsed = JSON.parse(m[1]!) as { '@type': string } | { '@type': string }[]
      return Array.isArray(parsed) ? parsed.map(p => p['@type']) : [parsed['@type']]
    })
    expect(types).toContain('WebApplication')
    expect(types).toContain('Organization')
    expect(types).toContain('WebSite')
    const all = blocks.map(m => m[1]).join('')
    expect(all).toContain('"DeveloperApplication"')
    expect(all).toContain('"price": "0"')
    expect(all).not.toContain('aggregateRating')
    expect(all).not.toContain('FAQPage')
    expect(all).not.toContain('HowTo')
    expect(all).not.toContain('SearchAction')
  })
})

describe('crawl files', () => {
  it('robots.txt allows everyone, names citation bots, points at the sitemap', () => {
    const robots = read('public/robots.txt')
    expect(robots).toMatch(/User-agent: \*\s+Allow: \//)
    for (const bot of ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User', 'GPTBot', 'ClaudeBot']) {
      expect(robots).toContain(`User-agent: ${bot}`)
    }
    expect(robots).not.toMatch(/Disallow: \/\S/)
    expect(robots).toContain('Sitemap: https://markdown.style/sitemap.xml')
  })

  it('sitemap covers exactly the live routes and every route has a page file', () => {
    const sitemap = read('public/sitemap.xml')
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1])
    expect(urls).toEqual([
      'https://markdown.style/',
      'https://markdown.style/editor',
      'https://markdown.style/privacy',
      'https://markdown.style/terms',
    ])
    for (const page of ['index.html', 'editor.html', 'privacy.html', 'terms.html']) {
      expect(() => read(page)).not.toThrow()
    }
  })

  it('llms.txt describes the tool and lists key pages', () => {
    const llms = read('public/llms.txt')
    expect(llms).toContain('# markdown.style')
    expect(llms).toContain('https://markdown.style/editor')
  })
})

describe('vite build inputs', () => {
  it('registers every marketing page as an MPA entry', () => {
    const config = read('vite.config.ts')
    for (const entry of ['index.html', 'editor.html', 'privacy.html', 'terms.html']) {
      expect(config).toContain(entry)
    }
  })
})
```

- [ ] **Step 2: Run to verify failures**

Run: `bunx vitest run src/site/site.test.ts`
Expected: FAIL: pages and crawl files missing.

- [ ] **Step 3: Create public/robots.txt**

```
# markdown.style: all crawlers welcome (owner ruling 2026-07-10)
User-agent: *
Allow: /

# AI citation/search bots: explicitly welcome
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: Claude-User
Allow: /

# AI training bots: allowed (training exposure may help LLM recommendation)
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /

Sitemap: https://markdown.style/sitemap.xml
```

- [ ] **Step 4: Create public/sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://markdown.style/</loc></url>
  <url><loc>https://markdown.style/editor</loc></url>
  <url><loc>https://markdown.style/privacy</loc></url>
  <url><loc>https://markdown.style/terms</loc></url>
</urlset>
```

- [ ] **Step 5: Create public/llms.txt**

```
# markdown.style

> Free browser tool that turns LLM markdown output (ChatGPT, Claude, etc.) into a designed document: pick a theme, download self-contained styled HTML, or print to PDF. 100% client-side, documents never leave the browser.

## Key pages

- Editor (the tool): https://markdown.style/editor
- What it does and why: https://markdown.style/
- Privacy: https://markdown.style/privacy
```

- [ ] **Step 6: Add MPA inputs to vite.config.ts**

```ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        editor: resolve(import.meta.dirname, 'editor.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        terms: resolve(import.meta.dirname, 'terms.html'),
      },
    },
  },
})
```

- [ ] **Step 7: Run the suite, crawl-file tests green, page tests still red**

Run: `bunx vitest run src/site/site.test.ts`
Expected: crawl-file + vite-inputs tests PASS; marketing-page tests FAIL (pages don't exist yet, Tasks 2–3).

- [ ] **Step 8: Commit**

```bash
git add src/site/site.test.ts public/ vite.config.ts
git commit -m "feat: SEO invariant suite, robots/sitemap/llms crawl files"
```

---

### Task 2: Landing page + shared site CSS

**Files:**
- Create: `index.html`, `src/site/site.css`

**Interfaces:**
- Consumes: the Task 1 test suite (its assertions are the acceptance criteria)
- Produces: the public landing page; `site.css` reused by Task 3 pages and Plan 4b.

- [ ] **Step 1: Create src/site/site.css**

```css
/* Marketing pages only, the editor app and rendered documents never load this. */
:root {
  --site-bg: #ffffff;
  --site-fg: #17181c;
  --site-muted: #5c6470;
  --site-rule: #e5e8ec;
  --site-accent: #4338ca;
  --site-accent-soft: #eef0ff;
  --site-ink: #0e0f2e;
}
* { box-sizing: border-box; }
html, body { margin: 0; }
body { background: var(--site-bg); color: var(--site-fg); font: 17px/1.65 system-ui, -apple-system, 'Segoe UI', sans-serif; }
.wrap { max-width: 880px; margin: 0 auto; padding: 0 24px; }

.site-header { border-bottom: 1px solid var(--site-rule); }
.site-header .wrap { display: flex; align-items: center; gap: 24px; padding-top: 16px; padding-bottom: 16px; }
.brand { font-weight: 750; color: var(--site-fg); text-decoration: none; font-size: 1.05em; }
.site-nav { margin-left: auto; display: flex; gap: 20px; align-items: center; }
.site-nav a { color: var(--site-muted); text-decoration: none; }
.site-nav a:hover, .site-nav a:focus-visible { color: var(--site-fg); }

.btn-cta {
  background: var(--site-accent); color: #ffffff; text-decoration: none;
  padding: 10px 20px; border-radius: 8px; font-weight: 600; display: inline-block;
}
.btn-cta:hover { background: var(--site-ink); }
.btn-ghost { color: var(--site-accent); text-decoration: none; font-weight: 600; padding: 10px 4px; display: inline-block; }
a:focus-visible, .btn-cta:focus-visible { outline: 3px solid var(--site-accent); outline-offset: 2px; }

.hero { padding: 72px 0 56px; }
.hero h1 { font-size: 2.7em; line-height: 1.12; letter-spacing: -0.02em; margin: 0 0 0.4em; color: var(--site-ink); }
.hero .lede { font-size: 1.2em; color: var(--site-muted); max-width: 40em; margin: 0 0 1.4em; }
.hero .cta-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.trust { color: var(--site-muted); font-size: 0.95em; margin-top: 20px; }

section { padding: 40px 0; border-top: 1px solid var(--site-rule); }
section h2 { font-size: 1.5em; letter-spacing: -0.01em; color: var(--site-ink); }
.answer { font-size: 1.05em; max-width: 42em; }

.steps { counter-reset: step; list-style: none; padding: 0; display: grid; gap: 16px; }
.steps li { padding-left: 2.2em; position: relative; }
.steps li::before {
  content: counter(step); counter-increment: step;
  position: absolute; left: 0; top: 0.1em;
  width: 1.5em; height: 1.5em; border-radius: 50%;
  background: var(--site-accent-soft); color: var(--site-accent);
  font-weight: 700; text-align: center; line-height: 1.5em; font-size: 0.9em;
}

.theme-strip { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; padding: 0; list-style: none; }
.theme-strip li { border: 1px solid var(--site-rule); border-radius: 10px; padding: 14px; }
.theme-strip .swatch { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
.theme-strip strong { color: var(--site-ink); }
.theme-strip span.desc { display: block; color: var(--site-muted); font-size: 0.9em; margin-top: 4px; }

.site-footer { border-top: 1px solid var(--site-rule); margin-top: 48px; }
.site-footer .wrap { display: flex; gap: 20px; padding-top: 24px; padding-bottom: 32px; color: var(--site-muted); font-size: 0.9em; flex-wrap: wrap; }
.site-footer a { color: var(--site-muted); }

.legal h2 { font-size: 1.2em; margin-top: 2em; }
.legal { padding-bottom: 64px; }

@media (max-width: 640px) {
  .hero { padding: 44px 0 36px; }
  .hero h1 { font-size: 2em; }
}
```

- [ ] **Step 2: Create index.html (full copy, answer-first, question H2s, JSON-LD)**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Turn ChatGPT or Claude output into a designed report, markdown.style</title>
<meta name="description" content="Paste the markdown an AI gave you, pick a theme, and download a styled HTML document or save it as a PDF. Free, no upload, everything happens in your browser.">
<link rel="canonical" href="https://markdown.style/">
<meta property="og:title" content="Turn ChatGPT or Claude output into a designed report">
<meta property="og:description" content="Paste AI markdown, pick a theme, get a styled document or PDF. Free, private, in your browser.">
<meta property="og:url" content="https://markdown.style/">
<meta property="og:type" content="website">
<meta property="og:image" content="https://markdown.style/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/src/site/site.css">
<script type="application/ld+json">
[
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "markdown.style",
    "url": "https://markdown.style/editor",
    "description": "Free browser tool that turns LLM markdown output into a designed document: themed HTML download or print-ready PDF. 100% client-side.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "markdown.style",
    "url": "https://markdown.style/"
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "markdown.style",
    "url": "https://markdown.style/"
  }
]
</script>
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">markdown.style</a>
    <nav class="site-nav" aria-label="Site">
      <a href="#themes">Themes</a>
      <a href="#how">How it works</a>
      <a class="btn-cta" href="/editor">Open the editor</a>
    </nav>
  </div>
</header>

<main>
  <div class="wrap">
    <section class="hero" aria-label="Introduction" style="border-top:0">
      <h1>Turn your ChatGPT or Claude output into a designed report</h1>
      <p class="lede">AI writes great markdown, and then it dies in a plain white PDF. Paste that markdown here, pick a theme, and download a styled document instead. No prompt tokens wasted asking the model for HTML.</p>
      <div class="cta-row">
        <a class="btn-cta" href="/editor">Style my markdown</a>
        <a class="btn-ghost" href="#themes">See the themes</a>
      </div>
      <p class="trust">100% in your browser · no upload · free · no sign-up</p>
    </section>

    <section id="how" aria-label="How it works">
      <h2>How do I turn an AI answer into a PDF?</h2>
      <p class="answer">Paste the markdown into the editor, pick one of eight themes, and hit Print, your browser's "Save as PDF" does the rest. Or download it as a single styled HTML file that looks identical anywhere.</p>
      <ol class="steps">
        <li><strong>Paste or drop</strong> the markdown ChatGPT, Claude, or any LLM gave you. The live preview styles it instantly, tables, code, math, and diagrams included.</li>
        <li><strong>Pick a theme</strong> and tune the accent color, font size, and page width. The structure never changes; only the design does.</li>
        <li><strong>Export</strong>, Download HTML for a self-contained file, or Print for a clean, page-break-aware PDF.</li>
      </ol>
    </section>

    <section aria-label="Why markdown converts badly">
      <h2>Why does markdown look so plain as a PDF?</h2>
      <p class="answer">Most converters apply no design at all: default fonts, blue links, tables that overflow, code blocks split across pages. markdown.style applies a real theme, typography, tables, syntax-highlighted code, KaTeX math, Mermaid diagrams, and print styles that keep tables and code intact across page breaks.</p>
    </section>

    <section id="themes" aria-label="Themes">
      <h2>What do the themes look like?</h2>
      <p class="answer">Eight designed looks, from a warm book-serif to dark technical to bold poster. Every theme styles the whole document, headings, tables, code, quotes, footnotes, and every theme prints cleanly.</p>
      <ul class="theme-strip">
        <li><strong><span class="swatch" style="background:#8b3a2f"></span>Paper</strong><span class="desc">Warm, book-like serif</span></li>
        <li><strong><span class="swatch" style="background:#0969da"></span>Slate</strong><span class="desc">Modern product-doc sans</span></li>
        <li><strong><span class="swatch" style="background:#2f81f7"></span>Carbon</strong><span class="desc">Dark technical, prints light</span></li>
        <li><strong><span class="swatch" style="background:#e30613"></span>Swiss</strong><span class="desc">Minimal typographic</span></li>
        <li><strong><span class="swatch" style="background:#ffd400"></span>Contrast</strong><span class="desc">Bold poster energy</span></li>
        <li><strong><span class="swatch" style="background:#9a2b2b"></span>Editorial</strong><span class="desc">Elegant magazine serif</span></li>
        <li><strong><span class="swatch" style="background:#1f3a93"></span>Scholar</strong><span class="desc">Academic restraint</span></li>
        <li><strong><span class="swatch" style="background:#d81b7a"></span>Pop</strong><span class="desc">Colorful and friendly</span></li>
      </ul>
    </section>

    <section aria-label="Privacy">
      <h2>Is my document uploaded anywhere?</h2>
      <p class="answer">No. The entire pipeline, parsing, theming, exporting, runs in your browser. Nothing you paste ever reaches a server, and there's no account, tracking, or analytics. <a href="/privacy">Read the two-minute privacy page</a>.</p>
    </section>

    <section aria-label="Feature support">
      <h2>Does it handle tables, code, math, and diagrams?</h2>
      <p class="answer">Yes, GitHub-flavored markdown tables and task lists, syntax-highlighted code in any common language, KaTeX math, and Mermaid diagrams all render and export. Exactly the things LLM answers are full of.</p>
      <p><a class="btn-cta" href="/editor">Try it with your last AI answer</a></p>
    </section>
  </div>
</main>

<footer class="site-footer">
  <div class="wrap">
    <span>© 2026 markdown.style</span>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="/editor">Editor</a>
  </div>
</footer>
</body>
</html>
```

- [ ] **Step 3: Run the suite**

Run: `bunx vitest run src/site/site.test.ts`
Expected: landing tests PASS; privacy/terms page tests still FAIL (Task 3).

- [ ] **Step 4: Commit**

```bash
git add index.html src/site/site.css
git commit -m "feat: landing page with answer-first copy and schema rulings"
```

---

### Task 3: Privacy + Terms pages

**Files:**
- Create: `privacy.html`, `terms.html`

**Interfaces:**
- Consumes: `src/site/site.css`, Task 1 test suite
- Produces: the credibility pages the "no upload" claim needs (spec §6).

- [ ] **Step 1: Create privacy.html**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy, markdown.style</title>
<meta name="description" content="markdown.style runs entirely in your browser. Your documents are never uploaded, and there is no tracking, no analytics, and no account.">
<link rel="canonical" href="https://markdown.style/privacy">
<meta property="og:title" content="Privacy, markdown.style">
<meta property="og:description" content="Everything runs in your browser. No uploads, no tracking, no accounts.">
<meta property="og:url" content="https://markdown.style/privacy">
<meta property="og:type" content="website">
<link rel="stylesheet" href="/src/site/site.css">
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">markdown.style</a>
    <nav class="site-nav" aria-label="Site"><a href="/editor">Editor</a></nav>
  </div>
</header>
<main>
  <div class="wrap legal">
    <section class="hero" style="border-top:0; padding-bottom: 8px;">
      <h1>Privacy</h1>
      <p class="lede">Short version: your documents never leave your browser, and we collect nothing.</p>
    </section>

    <h2>What happens to my documents?</h2>
    <p>Everything, parsing, theming, exporting, printing, runs locally in your browser. The markdown you paste or open is never transmitted to a server. There is no server-side processing at all.</p>

    <h2>What is stored on my device?</h2>
    <p>The editor autosaves your current document, chosen theme, and settings to your browser's localStorage so they survive a refresh. That data stays on your device; clear your browser storage for this site to remove it.</p>

    <h2>Do you use cookies, analytics, or trackers?</h2>
    <p>No cookies, no analytics, no fingerprinting, no third-party requests. The pages you're reading load only their own files.</p>

    <h2>What about images referenced in my markdown?</h2>
    <p>If your markdown references an image by URL, your browser fetches that image directly from wherever it's hosted when previewing or opening the exported file, the same as any web page. That request goes from your device to that host, not through us.</p>

    <h2>Questions?</h2>
    <p>This page is the whole policy, there is no hidden data flow to explain. If something seems unclear, the safest summary stands: nothing you write here reaches us.</p>
  </div>
</main>
<footer class="site-footer">
  <div class="wrap">
    <span>© 2026 markdown.style</span>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="/editor">Editor</a>
  </div>
</footer>
</body>
</html>
```

- [ ] **Step 2: Create terms.html**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Terms of Use, markdown.style</title>
<meta name="description" content="Plain-language terms for markdown.style: a free, as-is browser tool. Your content stays yours and stays on your device.">
<link rel="canonical" href="https://markdown.style/terms">
<meta property="og:title" content="Terms of Use, markdown.style">
<meta property="og:description" content="Free, as-is, your content stays yours.">
<meta property="og:url" content="https://markdown.style/terms">
<meta property="og:type" content="website">
<link rel="stylesheet" href="/src/site/site.css">
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">markdown.style</a>
    <nav class="site-nav" aria-label="Site"><a href="/editor">Editor</a></nav>
  </div>
</header>
<main>
  <div class="wrap legal">
    <section class="hero" style="border-top:0; padding-bottom: 8px;">
      <h1>Terms of Use</h1>
      <p class="lede">Plain language, because there isn't much to say about a free local tool.</p>
    </section>

    <h2>The service</h2>
    <p>markdown.style is a free tool that converts markdown into styled documents entirely in your browser. It is provided "as is", without warranties of any kind. We may change or discontinue it at any time.</p>

    <h2>Your content</h2>
    <p>Your documents are yours. Because processing happens on your device, we never receive, store, or license your content in any way.</p>

    <h2>Acceptable use</h2>
    <p>Use the tool for anything lawful. The documents you create are your responsibility, including any content you paste into them.</p>

    <h2>Liability</h2>
    <p>To the maximum extent permitted by law, we're not liable for damages arising from use of the tool, including lost documents. The editor autosaves to your browser, but keep copies of anything important.</p>

    <h2>Changes</h2>
    <p>If these terms change, the updated version will be posted at this address with an updated date. Continued use means acceptance.</p>

    <p><em>Last updated: 2026-07-10</em></p>
  </div>
</main>
<footer class="site-footer">
  <div class="wrap">
    <span>© 2026 markdown.style</span>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="/editor">Editor</a>
  </div>
</footer>
</body>
</html>
```

- [ ] **Step 3: Full verification**

Run: `bunx vitest run src/site/site.test.ts`
Expected: ALL site tests PASS.

Run: `bun run test && bun run typecheck && bun run build`
Expected: full suite green; build emits `dist/index.html`, `dist/privacy.html`, `dist/terms.html`, `dist/editor.html`, plus `robots.txt`/`sitemap.xml`/`llms.txt` copied from `public/`.

- [ ] **Step 4: Commit**

```bash
git add privacy.html terms.html
git commit -m "feat: privacy and terms pages"
```

---

## Self-Review Notes

- The landing page contains zero runtime JS by design (the only `<script>` is JSON-LD, and the test's negative-lookahead regex allows exactly that), the strongest possible answer to "AI crawlers don't execute JavaScript."
- `og:image` points at `/og.png`, which does not exist yet, deliberately: fabricating a binary asset is worse than an honest TODO. **Ledger item: owner supplies a 1200×630 `public/og.png` before launch.**
- The editor deep-link with a theme pre-applied (`/editor?theme=slate`) is NOT used on the landing page because the editor doesn't parse a `theme` query param yet, that lands in Plan 4b alongside the theme gallery pages that need it.
- `index.html`'s theme strip hardcodes the 8 names/accents (duplicating registry data), acceptable for a static zero-JS page; Plan 4b's generator replaces this section's maintenance story.
- Dev-server nuance: extensionless links (`/editor`) 404 on `vite dev` (they resolve on production hosts like Cloudflare Pages). QA on the dev server should navigate to `/editor.html` directly; the plan keeps production-correct hrefs per the spec's path-routing rule.
