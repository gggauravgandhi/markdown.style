# Editor App Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The `/editor` SPA — CodeMirror editor + live themed preview + theme picker + three knobs + Download HTML / Print-PDF / Copy exports, all consuming Plan 1's `render()`.

**Architecture:** Vanilla TS Vite app (`editor.html` entry). One store module holds `{ markdown, themeId, knobs }` with debounced localStorage persistence. Preview is an `<iframe sandbox="allow-same-origin">` whose `srcdoc` is the render() string; markdown/theme changes re-render debounced (200ms), knob changes mutate CSS custom properties on the iframe document (no re-render). Exports always call `render()` fresh at click time, so preview staleness can never leak into an export.

**Tech Stack:** existing Plan 1 pipeline; + `codemirror` (meta pkg: basicSetup/EditorView) and `@codemirror/lang-markdown`. No framework.

**Spec:** `docs/superpowers/specs/2026-07-10-markdown-style-design.md` (sections 1, 2, 5, 7)

## Global Constraints

- Use `bun` for everything — never npm/npx/yarn/node.
- `render()` from `src/pipeline/render.ts` is the ONLY producer of preview/export/print HTML. The app never assembles document HTML itself.
- Preview iframe: `sandbox="allow-same-origin"` EXACTLY. `allow-scripts` must NEVER be added (content is script-free by construction; same-origin is required for the knob fast-path into `contentDocument`). A test pins this attribute value.
- Print = `window.open('', '_blank')` + write the render() string + wait `document.fonts.ready` (+ load) + `print()`. NEVER print the preview iframe.
- Markdown/theme changes → full re-render debounced 200ms. Knob changes → CSS variable mutation only (`--mds-accent`, `--mds-font-scale`, `--mds-page-width`), never a full re-render.
- Exports (download/copy/print) call `render()` fresh with current state at click time.
- localStorage: key `mds-state-v1`, persist debounced 500ms, restore on load; quota/availability failure warns ONCE via notice and the app keeps working.
- File open: `.md`/`.markdown`/`.txt`; files >2MB get a warning notice but still load (never a block).
- Empty document + export click → friendly notice, no empty file (spec §7).
- render() `errors[]` surface as a transient notice (e.g. "1 diagram failed to render") — no silent failures.
- A11y: every control keyboard-reachable with an accessible name; notices region `role="status"` `aria-live="polite"`; iframe has `title`.
- No new dependencies beyond `codemirror` + `@codemirror/lang-markdown`.
- TypeScript strict. Vanilla TS/DOM — no framework. Conventional commits, no Co-Authored-By.
- TDD for logic modules (store, exports, file-input, preview scheduling). Pure DOM/visual behavior that jsdom cannot exercise is deferred to Task 7's browser QA checklist — each deferral named explicitly in the task.

## File Structure

```
vite.config.ts        # NEW — MPA input: editor.html
editor.html           # NEW — static head (title/description/canonical), #app mount
src/app/
  main.ts             # UI assembly & wiring (largest file; DOM-only, thin logic)
  app.css             # app chrome styling (toolbar, panes, dialog, notices)
  store.ts            # AppState store: get/set/subscribe + debounced persistence
  sample.ts           # SAMPLE_MARKDOWN (pre-loaded showcase doc) + THUMB_MARKDOWN
  preview.ts          # iframe manager: debounced render, stale-drop, knob fast-path
  exports.ts          # filenameFor, downloadHtml, copyHtml, printDocument
  file-input.ts       # loadMarkdownFile (size warning), isMarkdownFile
src/app/*.test.ts     # colocated vitest tests (jsdom)
```

---

### Task 1: Vite app scaffold

**Files:**
- Create: `vite.config.ts`, `editor.html`, `src/app/app.css` (skeleton), `src/app/main.ts` (skeleton)
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: nothing new
- Produces: `bun run dev` serves the editor at `/editor.html`; `bun run build` emits `dist/editor.html` + assets. `main.ts` exports `mount(root: HTMLElement): Promise<void>` — later tasks fill it in.

- [ ] **Step 1: Install CodeMirror and add scripts**

```bash
bun add codemirror @codemirror/lang-markdown
```

Add to `package.json` scripts (keep existing entries):
```json
"dev": "vite",
"build": "vite build",
"preview": "vite preview"
```

- [ ] **Step 2: Create vite.config.ts**

```ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      // MPA: Plan 4 adds the landing page and static routes as further inputs
      input: { editor: resolve(import.meta.dirname, 'editor.html') },
    },
  },
})
```

- [ ] **Step 3: Create editor.html**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Markdown Editor — markdown.style</title>
<meta name="description" content="Paste markdown, pick a theme, and download styled HTML or save as PDF. Free, no upload — everything happens in your browser.">
<link rel="canonical" href="https://markdown.style/editor">
</head>
<body>
<div id="app"></div>
<script type="module" src="/src/app/main.ts"></script>
</body>
</html>
```

- [ ] **Step 4: Create skeleton main.ts and app.css**

`src/app/main.ts`:
```ts
import './app.css'

export async function mount(root: HTMLElement): Promise<void> {
  root.innerHTML = '<p class="app-loading">markdown.style editor</p>'
}

const appRoot = document.getElementById('app')
if (appRoot) void mount(appRoot)
```

`src/app/app.css`:
```css
/* App chrome only — document styling lives in src/themes (never here). */
:root {
  --app-bg: #101014;
  --app-surface: #1a1a21;
  --app-border: #2a2a33;
  --app-fg: #e8e8ee;
  --app-muted: #9a9aa8;
  --app-accent: #6d8dff;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body { background: var(--app-bg); color: var(--app-fg); font: 14px/1.5 system-ui, sans-serif; }
#app { height: 100%; }
```

- [ ] **Step 5: Verify build, dev entry, and existing suite**

Run: `bun run build`
Expected: succeeds; `dist/editor.html` exists.

Run: `bun run test && bun run typecheck`
Expected: 58/58 pass (nothing broken), typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: vite editor app scaffold with MPA entry"
```

---

### Task 2: Store with debounced persistence

**Files:**
- Create: `src/app/store.ts`
- Test: `src/app/store.test.ts`

**Interfaces:**
- Consumes: `Knobs` from `../pipeline/types`
- Produces (Tasks 5–6 rely on exactly this):
  - `interface AppState { markdown: string; themeId: string; knobs: Knobs }`
  - `createStore(fallback: AppState): Store` where `Store = { get(): AppState; set(patch: Partial<AppState>): void; subscribe(fn: (s: AppState) => void): () => void; onQuotaWarning(fn: () => void): void }`
  - `set` patch semantics: shallow replace per key — passing `knobs` REPLACES the whole knobs object (callers own the full knob set; reset = `set({ knobs: {} })`).
  - `restore(): AppState | null` (exported for tests)
  - Constants: `STORAGE_KEY = 'mds-state-v1'`, `PERSIST_DELAY_MS = 500`

- [ ] **Step 1: Write failing tests**

`src/app/store.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore, PERSIST_DELAY_MS, restore, STORAGE_KEY } from './store'

const FALLBACK = { markdown: '# hi', themeId: 'paper', knobs: {} }

describe('store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('starts from fallback when storage is empty', () => {
    expect(createStore(FALLBACK).get()).toEqual(FALLBACK)
  })

  it('set patches state and notifies subscribers', () => {
    const store = createStore(FALLBACK)
    const seen: string[] = []
    store.subscribe(s => seen.push(s.markdown))
    store.set({ markdown: 'changed' })
    expect(store.get().markdown).toBe('changed')
    expect(store.get().themeId).toBe('paper')
    expect(seen).toEqual(['changed'])
  })

  it('knobs patch replaces the knobs object entirely', () => {
    const store = createStore(FALLBACK)
    store.set({ knobs: { accent: '#112233', fontScale: 1.2 } })
    store.set({ knobs: { accent: '#112233' } })
    expect(store.get().knobs).toEqual({ accent: '#112233' })
  })

  it('persists debounced, not on every set', () => {
    const store = createStore(FALLBACK)
    store.set({ markdown: 'a' })
    store.set({ markdown: 'b' })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    vi.advanceTimersByTime(PERSIST_DELAY_MS)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ markdown: 'b' })
  })

  it('restore round-trips persisted state and rejects malformed payloads', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ markdown: 'saved', themeId: 'paper', knobs: { pageWidth: 900 } }))
    expect(restore()).toEqual({ markdown: 'saved', themeId: 'paper', knobs: { pageWidth: 900 } })
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(restore()).toBeNull()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }))
    expect(restore()).toBeNull()
  })

  it('createStore prefers restored state over fallback', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ markdown: 'saved', themeId: 'paper', knobs: {} }))
    expect(createStore(FALLBACK).get().markdown).toBe('saved')
  })

  it('warns exactly once when persistence throws, and keeps working', () => {
    const store = createStore(FALLBACK)
    const warn = vi.fn()
    store.onQuotaWarning(warn)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    store.set({ markdown: 'x' })
    vi.advanceTimersByTime(PERSIST_DELAY_MS)
    store.set({ markdown: 'y' })
    vi.advanceTimersByTime(PERSIST_DELAY_MS)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(store.get().markdown).toBe('y')
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/app/store.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement store.ts**

```ts
import type { Knobs } from '../pipeline/types'

export interface AppState {
  markdown: string
  themeId: string
  knobs: Knobs
}

export const STORAGE_KEY = 'mds-state-v1'
export const PERSIST_DELAY_MS = 500

export function restore(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (typeof parsed.markdown !== 'string' || typeof parsed.themeId !== 'string') return null
    return { markdown: parsed.markdown, themeId: parsed.themeId, knobs: parsed.knobs ?? {} }
  } catch {
    return null
  }
}

export function createStore(fallback: AppState) {
  let state: AppState = restore() ?? fallback
  const listeners = new Set<(s: AppState) => void>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let warned = false
  let onWarn: (() => void) | null = null

  function persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      if (!warned) {
        warned = true
        onWarn?.()
      }
    }
  }

  return {
    get(): AppState {
      return state
    },
    set(patch: Partial<AppState>): void {
      state = { ...state, ...patch }
      for (const fn of listeners) fn(state)
      clearTimeout(timer)
      timer = setTimeout(persist, PERSIST_DELAY_MS)
    },
    subscribe(fn: (s: AppState) => void): () => void {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    onQuotaWarning(fn: () => void): void {
      onWarn = fn
    },
  }
}

export type Store = ReturnType<typeof createStore>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/app/store.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/store.ts src/app/store.test.ts
git commit -m "feat: app state store with debounced localStorage persistence"
```

---

### Task 3: Sample document & exports module

**Files:**
- Create: `src/app/sample.ts`, `src/app/exports.ts`
- Test: `src/app/exports.test.ts`

**Interfaces:**
- Consumes: nothing (pure/DOM APIs)
- Produces (Task 6 relies on exactly this):
  - `sample.ts`: `SAMPLE_MARKDOWN: string` (showcase doc: h1 title, intro, table, task list, code fence, math, mermaid fence, blockquote, footnote), `THUMB_MARKDOWN: string` (short excerpt for theme thumbnails: h1, short paragraph, small table, tiny code fence — NO mermaid/math, keeps thumbnails instant)
  - `exports.ts`: `filenameFor(title: string): string`; `downloadHtml(html: string, title: string): void`; `copyHtml(html: string): Promise<boolean>`; `printDocument(html: string): boolean` (false when popup blocked)

- [ ] **Step 1: Create sample.ts**

```ts
/** Pre-loaded showcase document — first-visit users see every feature themed. */
export const SAMPLE_MARKDOWN = `# Quarterly Growth Report

*Generated by an LLM — styled by markdown.style.*

Paste your own markdown to replace this sample. Everything renders live: tables, code, math, diagrams.

## Highlights

| Region | Revenue | Growth |
|--------|---------|--------|
| EMEA   | $4.2M   | +14%   |
| APAC   | $3.1M   | +22%   |
| AMER   | $6.8M   | +9%    |

- [x] Consolidate Q3 numbers
- [x] Review regional forecasts
- [ ] Board deck sign-off

## Model

Growth follows $g = r \\cdot (1 - s)$ where $r$ is raw rate and $s$ is churn share:

$$
g_{\\text{net}} = \\sum_{i=1}^{n} r_i (1 - s_i)
$$

## Pipeline

\`\`\`mermaid
graph LR
A[Leads] --> B[Qualified]
B --> C[Proposal]
C --> D[Closed]
\`\`\`

## Implementation note

\`\`\`ts
export function netGrowth(rates: number[], churn: number[]): number {
  return rates.reduce((sum, r, i) => sum + r * (1 - (churn[i] ?? 0)), 0)
}
\`\`\`

> Numbers exclude the acquisition closed after the quarter cutoff.[^1]

[^1]: See the finance memo for reconciliation details.
`

/** Short excerpt for theme-picker thumbnails — no mermaid/math so thumbs render instantly. */
export const THUMB_MARKDOWN = `# The Quick Report

A short paragraph showing body text, a [link](https://example.com), and \`inline code\`.

| Item | Value |
|------|-------|
| One  | 42    |
| Two  | 7     |

\`\`\`ts
const answer = 42
\`\`\`
`
```

- [ ] **Step 2: Write failing tests for exports**

`src/app/exports.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyHtml, downloadHtml, filenameFor, printDocument } from './exports'

afterEach(() => vi.restoreAllMocks())

describe('filenameFor', () => {
  it('slugifies titles', () => {
    expect(filenameFor('Q3 Sales Report!')).toBe('q3-sales-report.html')
  })
  it('falls back for empty/symbol-only titles', () => {
    expect(filenameFor('***')).toBe('document.html')
  })
})

describe('downloadHtml', () => {
  it('clicks an anchor with a blob url and slug filename', () => {
    const clicked: HTMLAnchorElement[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this)
    })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    downloadHtml('<!doctype html><html></html>', 'My Doc')
    expect(clicked).toHaveLength(1)
    expect(clicked[0]!.download).toBe('my-doc.html')
    expect(clicked[0]!.href).toContain('blob:fake')
    expect(revoke).toHaveBeenCalledWith('blob:fake')
  })
})

describe('copyHtml', () => {
  it('resolves true on clipboard success and false on failure', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    expect(await copyHtml('<p>x</p>')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('<p>x</p>')
    writeText.mockRejectedValue(new Error('denied'))
    expect(await copyHtml('<p>x</p>')).toBe(false)
  })
})

describe('printDocument', () => {
  it('returns false when the popup is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    expect(printDocument('<html></html>')).toBe(false)
  })

  it('writes the document and prints after fonts are ready', async () => {
    const doPrint = vi.fn()
    const written: string[] = []
    const fakeWin = {
      focus: vi.fn(),
      print: doPrint,
      addEventListener: vi.fn(),
      document: {
        open: vi.fn(),
        write: (s: string) => written.push(s),
        close: vi.fn(),
        readyState: 'complete',
        fonts: { ready: Promise.resolve() },
      },
    } as unknown as Window
    vi.spyOn(window, 'open').mockReturnValue(fakeWin)
    expect(printDocument('<html><body>doc</body></html>')).toBe(true)
    expect(written.join('')).toContain('doc')
    await Promise.resolve() // let fonts.ready continuation run
    await Promise.resolve()
    expect(doPrint).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `bunx vitest run src/app/exports.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 4: Implement exports.ts**

```ts
export function filenameFor(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'document'}.html`
}

export function downloadHtml(html: string, title: string): void {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filenameFor(title)
  a.click()
  URL.revokeObjectURL(url)
}

export async function copyHtml(html: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(html)
    return true
  } catch {
    return false
  }
}

/**
 * Print via a fresh tab — never the preview iframe (spec §2: cross-browser
 * iframe-print quirks). Waits for fonts (KaTeX) before invoking the dialog.
 * Returns false when the popup was blocked so the caller can show a notice.
 */
export function printDocument(html: string): boolean {
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  const doPrint = (): void => {
    win.focus()
    win.print()
  }
  if (win.document.readyState === 'complete') {
    void win.document.fonts.ready.then(doPrint)
  } else {
    win.addEventListener('load', () => void win.document.fonts.ready.then(doPrint))
  }
  return true
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bunx vitest run src/app/exports.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/app/sample.ts src/app/exports.ts src/app/exports.test.ts
git commit -m "feat: sample documents and export actions (download, copy, print)"
```

---

### Task 4: File input with size guard

**Files:**
- Create: `src/app/file-input.ts`
- Test: `src/app/file-input.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces (Task 6 relies on exactly this):
  - `isMarkdownFile(name: string): boolean` (`.md`/`.markdown`/`.txt`, case-insensitive)
  - `interface FileLoad { text: string; warning?: string }`
  - `loadMarkdownFile(file: File): Promise<FileLoad>` — warning set when >2MB (`MAX_FILE_BYTES` exported), never rejects the load for size.

- [ ] **Step 1: Write failing tests**

`src/app/file-input.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { isMarkdownFile, loadMarkdownFile, MAX_FILE_BYTES } from './file-input'

describe('isMarkdownFile', () => {
  it('accepts md, markdown, txt (case-insensitive)', () => {
    expect(isMarkdownFile('notes.md')).toBe(true)
    expect(isMarkdownFile('REPORT.MARKDOWN')).toBe(true)
    expect(isMarkdownFile('a.txt')).toBe(true)
  })
  it('rejects other extensions', () => {
    expect(isMarkdownFile('image.png')).toBe(false)
    expect(isMarkdownFile('doc.pdf')).toBe(false)
    expect(isMarkdownFile('md')).toBe(false)
  })
})

describe('loadMarkdownFile', () => {
  it('reads text without warning for small files', async () => {
    const file = new File(['# hello'], 'a.md', { type: 'text/markdown' })
    const { text, warning } = await loadMarkdownFile(file)
    expect(text).toBe('# hello')
    expect(warning).toBeUndefined()
  })

  it('warns (but still loads) above the size limit', async () => {
    const big = new File(['x'.repeat(MAX_FILE_BYTES + 1)], 'big.md')
    const { text, warning } = await loadMarkdownFile(big)
    expect(text.length).toBe(MAX_FILE_BYTES + 1)
    expect(warning).toMatch(/large file/i)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/app/file-input.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement file-input.ts**

```ts
export const MAX_FILE_BYTES = 2 * 1024 * 1024

export interface FileLoad {
  text: string
  warning?: string
}

export function isMarkdownFile(name: string): boolean {
  return /\.(md|markdown|txt)$/i.test(name)
}

/** Size guard warns but never blocks (spec §7: oversized input still renders). */
export async function loadMarkdownFile(file: File): Promise<FileLoad> {
  const text = await file.text()
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    return { text, warning: `Large file (${mb} MB) — preview may be slow` }
  }
  return { text }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/app/file-input.test.ts`
Expected: PASS (4 tests). If jsdom lacks `File.prototype.text`, read via `new Response(file).text()` inside `loadMarkdownFile` instead — same behavior, and note it in the report.

- [ ] **Step 5: Commit**

```bash
git add src/app/file-input.ts src/app/file-input.test.ts
git commit -m "feat: markdown file loading with size warning"
```

---

### Task 5: Preview manager

**Files:**
- Create: `src/app/preview.ts`
- Test: `src/app/preview.test.ts`

**Interfaces:**
- Consumes: `render` from `../pipeline/render`; `AppState` from `./store`; `Knobs`, `RenderError` from `../pipeline/types`
- Produces (Task 6 relies on exactly this):
  - `createPreview(iframe: HTMLIFrameElement, onErrors: (errors: RenderError[]) => void): Preview`
  - `Preview = { renderNow(state: AppState): Promise<void>; scheduleRender(state: AppState): void; applyKnobs(knobs: Knobs): void }`
  - `RENDER_DEBOUNCE_MS = 200` exported.
  - Stale-drop guarantee: overlapping `renderNow` calls resolve in call order; only the newest result touches the iframe.

- [ ] **Step 1: Write failing tests**

`src/app/preview.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPreview, RENDER_DEBOUNCE_MS } from './preview'

function makeIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)
  return iframe
}

const STATE = { markdown: '# Title\n\nbody text', themeId: 'paper', knobs: {} }

describe('preview', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('renderNow sets srcdoc to the rendered document and reports errors', async () => {
    const errors: unknown[] = []
    const preview = createPreview(makeIframe(), e => errors.push(...e))
    const iframe = document.querySelector('iframe')!
    await preview.renderNow(STATE)
    expect(iframe.srcdoc).toContain('<!doctype html>')
    expect(iframe.srcdoc).toContain('Title')
    expect(errors).toEqual([]) // no mermaid in STATE
  })

  it('scheduleRender debounces: only the last state within the window renders', async () => {
    vi.useFakeTimers()
    const preview = createPreview(makeIframe(), () => {})
    const iframe = document.querySelector('iframe')!
    preview.scheduleRender({ ...STATE, markdown: '# First' })
    preview.scheduleRender({ ...STATE, markdown: '# Second' })
    await vi.advanceTimersByTimeAsync(RENDER_DEBOUNCE_MS + 10)
    vi.useRealTimers()
    await vi.waitFor(() => expect(iframe.srcdoc).toContain('Second'))
    expect(iframe.srcdoc).not.toContain('First')
  })

  it('stale renders never overwrite newer ones', async () => {
    const preview = createPreview(makeIframe(), () => {})
    const iframe = document.querySelector('iframe')!
    // fire two renders without awaiting the first; the second must win
    const p1 = preview.renderNow({ ...STATE, markdown: '# Old' })
    const p2 = preview.renderNow({ ...STATE, markdown: '# New' })
    await Promise.all([p1, p2])
    expect(iframe.srcdoc).toContain('New')
    expect(iframe.srcdoc).not.toContain('Old')
  })

  it('applyKnobs mutates iframe css variables without touching srcdoc', () => {
    const preview = createPreview(makeIframe(), () => {})
    const iframe = document.querySelector('iframe')!
    // jsdom gives contentDocument for a blank iframe
    preview.applyKnobs({ accent: '#112233', fontScale: 1.2, pageWidth: 900 })
    const root = iframe.contentDocument!.documentElement
    expect(root.style.getPropertyValue('--mds-accent')).toBe('#112233')
    expect(root.style.getPropertyValue('--mds-font-scale')).toBe('1.2')
    expect(root.style.getPropertyValue('--mds-page-width')).toBe('900px')
    expect(iframe.srcdoc).toBe('')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/app/preview.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement preview.ts**

```ts
import { render } from '../pipeline/render'
import type { Knobs, RenderError } from '../pipeline/types'
import type { AppState } from './store'

export const RENDER_DEBOUNCE_MS = 200

export function createPreview(
  iframe: HTMLIFrameElement,
  onErrors: (errors: RenderError[]) => void,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let seq = 0

  async function renderNow(state: AppState): Promise<void> {
    const ticket = ++seq
    const result = await render(state.markdown, state.themeId, state.knobs)
    if (ticket !== seq) return // superseded by a newer render — drop
    iframe.srcdoc = result.html
    onErrors(result.errors)
  }

  function scheduleRender(state: AppState): void {
    clearTimeout(timer)
    timer = setTimeout(() => void renderNow(state), RENDER_DEBOUNCE_MS)
  }

  /**
   * Knob fast-path (spec §2): mutate css variables on the live preview
   * document instead of re-rendering. Exports call render() fresh, so this
   * can never leak stale values into an exported file.
   */
  function applyKnobs(knobs: Knobs): void {
    const root = iframe.contentDocument?.documentElement
    if (!root) return
    if (knobs.accent) root.style.setProperty('--mds-accent', knobs.accent)
    if (typeof knobs.fontScale === 'number') root.style.setProperty('--mds-font-scale', String(knobs.fontScale))
    if (typeof knobs.pageWidth === 'number') root.style.setProperty('--mds-page-width', `${knobs.pageWidth}px`)
  }

  return { renderNow, scheduleRender, applyKnobs }
}

export type Preview = ReturnType<typeof createPreview>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/app/preview.test.ts`
Expected: PASS (4 tests). Note: `render()` runs for real here — STATE has no fences, so no heavy libs load and the tests stay fast.

- [ ] **Step 5: Commit**

```bash
git add src/app/preview.ts src/app/preview.test.ts
git commit -m "feat: preview manager with debounce, stale-drop, knob fast-path"
```

---

### Task 6: UI assembly (main.ts + app.css)

**Files:**
- Modify: `src/app/main.ts` (replace skeleton), `src/app/app.css` (extend)
- Test: `src/app/main.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–5 plus `themes` from `../themes/registry`, `render` from `../pipeline/render`
- Produces: `mount(root: HTMLElement): Promise<void>` — full editor UI. No new exports.

- [ ] **Step 1: Write failing smoke tests**

`src/app/main.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from './main'

// CodeMirror needs a couple of layout APIs jsdom lacks.
beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = '<div id="app"></div>'
  Range.prototype.getClientRects ??= () => ({ length: 0, item: () => null, [Symbol.iterator]: Array.prototype[Symbol.iterator] }) as unknown as DOMRectList
  Range.prototype.getBoundingClientRect ??= () => new DOMRect()
})

describe('editor app shell', () => {
  it('mounts toolbar controls, editor, and sandboxed preview', async () => {
    await mount(document.getElementById('app')!)
    const iframe = document.querySelector<HTMLIFrameElement>('.pane-preview iframe')!
    expect(iframe.getAttribute('sandbox')).toBe('allow-same-origin') // security invariant — never add allow-scripts
    expect(iframe.title).toBe('Document preview')
    expect(document.querySelector('.cm-editor')).toBeTruthy()
    const buttons = [...document.querySelectorAll('button')].map(b => b.textContent?.trim())
    for (const label of ['Theme', 'Download HTML', 'Print or save as PDF', 'Copy HTML', 'Open file', 'Reset to sample']) {
      expect(buttons, label).toContain(label)
    }
    for (const aria of ['Accent color', 'Font size', 'Page width']) {
      expect(document.querySelector(`[aria-label="${aria}"]`), aria).toBeTruthy()
    }
    expect(document.querySelector('[role="status"]')).toBeTruthy()
  })

  it('export with an empty document shows a notice instead of downloading', async () => {
    localStorage.setItem('mds-state-v1', JSON.stringify({ markdown: '   ', themeId: 'paper', knobs: {} }))
    await mount(document.getElementById('app')!)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const download = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Download'))!
    download.click()
    await vi.waitFor(() => expect(document.querySelector('[role="status"]')!.textContent).toMatch(/empty/i))
    expect(click).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/app/main.test.ts`
Expected: FAIL — mount is still the skeleton.

- [ ] **Step 3: Implement main.ts**

```ts
import { markdown } from '@codemirror/lang-markdown'
import { basicSetup, EditorView } from 'codemirror'
import { render } from '../pipeline/render'
import type { RenderError } from '../pipeline/types'
import { themes } from '../themes/registry'
import './app.css'
import { copyHtml, downloadHtml, printDocument } from './exports'
import { isMarkdownFile, loadMarkdownFile } from './file-input'
import { createPreview } from './preview'
import { SAMPLE_MARKDOWN, THUMB_MARKDOWN } from './sample'
import { createStore, type AppState } from './store'

const NOTICE_MS = 4000

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  if (text) node.textContent = text
  return node
}

export async function mount(root: HTMLElement): Promise<void> {
  const initial: AppState = { markdown: SAMPLE_MARKDOWN, themeId: themes[0]!.id, knobs: {} }
  const store = createStore(initial)

  // --- layout ---------------------------------------------------------------
  root.innerHTML = ''
  const app = el('div', { class: 'app', 'data-view': 'split' })
  const toolbar = el('header', { class: 'toolbar' })
  const brand = el('span', { class: 'brand' }, 'markdown.style')
  const themeBtn = el('button', { class: 'btn', 'aria-haspopup': 'dialog' }, 'Theme')
  const accentInput = el('input', { type: 'color', 'aria-label': 'Accent color', class: 'knob-accent' })
  const fontRange = el('input', { type: 'range', min: '0.7', max: '1.5', step: '0.05', 'aria-label': 'Font size', class: 'knob' })
  const widthRange = el('input', { type: 'range', min: '480', max: '1400', step: '20', 'aria-label': 'Page width', class: 'knob' })
  const spacer = el('span', { class: 'spacer' })
  const openBtn = el('button', { class: 'btn' }, 'Open file')
  const resetBtn = el('button', { class: 'btn' }, 'Reset to sample')
  const copyBtn = el('button', { class: 'btn' }, 'Copy HTML')
  const downloadBtn = el('button', { class: 'btn btn-primary' }, 'Download HTML')
  const printBtn = el('button', { class: 'btn btn-primary' }, 'Print or save as PDF')
  const viewToggle = el('button', { class: 'btn view-toggle', 'aria-label': 'Toggle editor and preview' }, 'Preview')
  toolbar.append(brand, themeBtn, accentInput, fontRange, widthRange, spacer, openBtn, resetBtn, copyBtn, downloadBtn, printBtn, viewToggle)

  const panes = el('main', { class: 'panes' })
  const editorPane = el('section', { class: 'pane pane-editor', 'aria-label': 'Markdown editor' })
  const previewPane = el('section', { class: 'pane pane-preview', 'aria-label': 'Preview' })
  // security invariant (spec §2): script-free content + no allow-scripts;
  // allow-same-origin is required for the knob fast-path into contentDocument
  const iframe = el('iframe', { sandbox: 'allow-same-origin', title: 'Document preview' })
  previewPane.append(iframe)
  panes.append(editorPane, previewPane)

  const notices = el('div', { class: 'notices', role: 'status', 'aria-live': 'polite' })
  const fileInput = el('input', { type: 'file', accept: '.md,.markdown,.txt', class: 'visually-hidden', 'aria-label': 'Open markdown file' })
  const dialog = el('dialog', { class: 'theme-dialog', 'aria-label': 'Choose a theme' })
  app.append(toolbar, panes, notices, dialog, fileInput)
  root.append(app)

  function notice(message: string): void {
    const item = el('p', { class: 'notice' }, message)
    notices.append(item)
    setTimeout(() => item.remove(), NOTICE_MS)
  }

  // --- preview + editor -------------------------------------------------------
  const preview = createPreview(iframe as HTMLIFrameElement, (errors: RenderError[]) => {
    if (errors.length > 0) notice(`${errors.length} diagram${errors.length > 1 ? 's' : ''} failed to render`)
  })

  const view = new EditorView({
    doc: store.get().markdown,
    parent: editorPane,
    extensions: [
      basicSetup,
      markdown(),
      EditorView.lineWrapping,
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          store.set({ markdown: update.state.doc.toString() })
          preview.scheduleRender(store.get())
        }
      }),
    ],
  })

  function setEditorText(text: string): void {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } })
  }

  store.onQuotaWarning(() => notice('Autosave unavailable (storage full) — your work stays in this tab only'))

  // --- knobs --------------------------------------------------------------------
  function currentKnobs(): AppState['knobs'] {
    return {
      accent: accentInput.value || undefined,
      fontScale: Number(fontRange.value),
      pageWidth: Number(widthRange.value),
    }
  }
  function initKnobControls(): void {
    const { knobs, themeId } = store.get()
    accentInput.value = knobs.accent ?? themes.find(t => t.id === themeId)?.defaultAccent ?? '#0f62fe'
    fontRange.value = String(knobs.fontScale ?? 1)
    widthRange.value = String(knobs.pageWidth ?? 760)
  }
  for (const input of [accentInput, fontRange, widthRange]) {
    input.addEventListener('input', () => {
      const knobs = currentKnobs()
      store.set({ knobs })
      preview.applyKnobs(knobs)
    })
  }

  // --- theme picker ----------------------------------------------------------------
  let thumbsBuilt = false
  async function buildThumbs(): Promise<void> {
    if (thumbsBuilt) return
    thumbsBuilt = true
    for (const theme of themes) {
      const card = el('button', { class: 'theme-card', 'data-theme': theme.id })
      const thumb = el('iframe', { sandbox: '', class: 'theme-thumb', title: `${theme.name} preview`, loading: 'lazy' })
      const name = el('span', { class: 'theme-name' }, theme.name)
      const desc = el('span', { class: 'theme-desc' }, theme.description)
      card.append(thumb, name, desc)
      dialog.append(card)
      const { html } = await render(THUMB_MARKDOWN, theme.id)
      ;(thumb as HTMLIFrameElement).srcdoc = html
      card.addEventListener('click', () => {
        store.set({ themeId: theme.id, knobs: {} })
        initKnobControls()
        void preview.renderNow(store.get())
        dialog.close()
      })
    }
  }
  themeBtn.addEventListener('click', () => {
    void buildThumbs()
    dialog.showModal()
  })

  // --- exports ------------------------------------------------------------------------
  async function withDocument(action: (html: string, title: string) => void | Promise<void>): Promise<void> {
    const state = store.get()
    if (!state.markdown.trim()) {
      notice('Nothing to export — the document is empty')
      return
    }
    const { html, title } = await render(state.markdown, state.themeId, state.knobs)
    await action(html, title)
  }
  downloadBtn.addEventListener('click', () => void withDocument((html, title) => downloadHtml(html, title)))
  printBtn.addEventListener('click', () =>
    void withDocument(html => {
      if (!printDocument(html)) notice('Popup blocked — allow popups for this site to print')
    }),
  )
  copyBtn.addEventListener('click', () =>
    void withDocument(async html => {
      notice((await copyHtml(html)) ? 'HTML copied to clipboard' : 'Copy failed — clipboard unavailable')
    }),
  )

  // --- file open / drag-drop -------------------------------------------------------------
  async function acceptFile(file: File): Promise<void> {
    if (!isMarkdownFile(file.name)) {
      notice('Unsupported file — use .md, .markdown, or .txt')
      return
    }
    try {
      const { text, warning } = await loadMarkdownFile(file)
      if (warning) notice(warning)
      setEditorText(text)
    } catch {
      notice('Could not read the file — try again') // spec §7: read failures toast
    }
  }
  openBtn.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (file) void acceptFile(file)
  })
  for (const evt of ['dragover', 'drop'] as const) {
    app.addEventListener(evt, e => {
      e.preventDefault()
      if (evt === 'drop') {
        const file = (e as DragEvent).dataTransfer?.files?.[0]
        if (file) void acceptFile(file)
      }
    })
  }

  // --- misc -----------------------------------------------------------------------------
  resetBtn.addEventListener('click', () => {
    store.set({ markdown: SAMPLE_MARKDOWN, themeId: themes[0]!.id, knobs: {} })
    setEditorText(SAMPLE_MARKDOWN)
    initKnobControls()
    void preview.renderNow(store.get())
  })
  viewToggle.addEventListener('click', () => {
    const next = app.dataset.view === 'preview' ? 'editor' : 'preview'
    app.dataset.view = next
    viewToggle.textContent = next === 'preview' ? 'Editor' : 'Preview'
  })

  initKnobControls()
  await preview.renderNow(store.get())
}

const appRoot = document.getElementById('app')
if (appRoot) void mount(appRoot)
```

- [ ] **Step 4: Extend app.css**

Append to `src/app/app.css`:
```css
.app { display: grid; grid-template-rows: auto 1fr; height: 100%; }

.toolbar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 8px 12px; background: var(--app-surface); border-bottom: 1px solid var(--app-border);
}
.brand { font-weight: 700; margin-right: 8px; }
.spacer { flex: 1; }
.btn {
  background: none; border: 1px solid var(--app-border); color: var(--app-fg);
  border-radius: 6px; padding: 6px 12px; font: inherit; cursor: pointer;
}
.btn:hover { border-color: var(--app-accent); }
.btn:focus-visible { outline: 2px solid var(--app-accent); outline-offset: 2px; }
.btn-primary { background: var(--app-accent); border-color: var(--app-accent); color: #fff; }
.knob { width: 90px; accent-color: var(--app-accent); }
.knob-accent { width: 36px; height: 30px; padding: 2px; border: 1px solid var(--app-border); border-radius: 6px; background: none; }

.panes { display: grid; grid-template-columns: 1fr 1fr; min-height: 0; }
.pane { min-width: 0; min-height: 0; overflow: auto; }
.pane-editor { border-right: 1px solid var(--app-border); }
.pane-editor .cm-editor { height: 100%; font-size: 14px; }
.pane-preview iframe { width: 100%; height: 100%; border: 0; background: #fff; }

.view-toggle { display: none; }
@media (max-width: 768px) {
  .view-toggle { display: inline-block; }
  .panes { grid-template-columns: 1fr; }
  .app[data-view='preview'] .pane-editor { display: none; }
  .app[data-view='editor'] .pane-preview,
  .app[data-view='split'] .pane-preview { display: none; }
  .app[data-view='preview'] .pane-preview { display: block; }
}

.theme-dialog {
  border: 1px solid var(--app-border); border-radius: 12px; background: var(--app-surface); color: var(--app-fg);
  display: none; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; padding: 16px; max-width: 760px; width: 90vw;
}
.theme-dialog[open] { display: grid; }
.theme-dialog::backdrop { background: rgba(0, 0, 0, 0.55); }
.theme-card {
  display: grid; gap: 6px; text-align: left; background: var(--app-bg); color: var(--app-fg);
  border: 1px solid var(--app-border); border-radius: 8px; padding: 8px; cursor: pointer; font: inherit;
}
.theme-card:hover, .theme-card:focus-visible { border-color: var(--app-accent); }
.theme-thumb { width: 100%; height: 140px; border: 0; border-radius: 4px; background: #fff; pointer-events: none; }
.theme-name { font-weight: 600; }
.theme-desc { color: var(--app-muted); font-size: 12px; }

.notices { position: fixed; bottom: 16px; right: 16px; display: grid; gap: 8px; z-index: 10; }
.notice {
  margin: 0; background: var(--app-surface); border: 1px solid var(--app-border);
  border-left: 3px solid var(--app-accent); border-radius: 6px; padding: 10px 14px; max-width: 340px;
}

.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
```

- [ ] **Step 5: Run tests, full suite, typecheck, build**

Run: `bunx vitest run src/app/main.test.ts`
Expected: PASS (2 tests). If CodeMirror throws on a missing jsdom API, add the narrowest possible shim next to the existing `Range.prototype` shims in the test file (never a global suppression) and record it in the report.

Run: `bun run test && bun run typecheck && bun run build`
Expected: all pass, clean, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/main.ts src/app/main.test.ts src/app/app.css
git commit -m "feat: editor UI — toolbar, theme picker, knobs, exports, drag-drop"
```

---

### Task 7: Manual browser QA (requires the human)

**Files:** none (checklist task; fixes found here become their own commits)

**Interfaces:** consumes the running app (`bun run dev`, open `http://localhost:5173/editor.html`)

This task CANNOT be completed by an agent alone: browser automation is disabled by default in this environment (owner rule). The executor's job is to start the dev server, present this checklist to the human, and wait. If the human explicitly grants browser-tool permission, the checks may be automated with claude-in-chrome instead.

- [ ] **Step 1: Start dev server** — `bun run dev` (background), confirm the URL serves.

- [ ] **Step 2: Present this checklist to the human:**

**Deferred Plan 1 items (highest priority):**
1. Mermaid happy path: sample doc's `graph LR` renders as an SVG diagram in the preview (jsdom could never verify this).
2. Mermaid temp-element cleanup: in devtools Elements, after several edits to a mermaid fence, confirm no accumulation of orphan `#dmds-mermaid-*` / `#mds-mermaid-*` elements in the app document (`src/pipeline/mermaid.ts` cleanup id needs this empirical check).
3. Hostile mermaid label: paste a mermaid fence whose node label is `A["<img src=x onerror=alert(1)>"]` — NO alert may fire anywhere (securityLevel strict is the sole control).

**Editor QA:**
4. Type in the editor → preview updates ~200ms after typing stops; no flicker while typing.
5. Knobs (accent/font/width) move the preview instantly without a reload.
6. Theme dialog opens with a visible thumbnail; picking a theme re-renders and closes.
7. Download HTML → file opens standalone (double-click from Finder), identical to preview, KaTeX + code colors intact.
8. Print → dialog opens in a fresh tab, page breaks don't split the table/code block, no app chrome anywhere. Check Chrome + Safari (+ Firefox if available).
9. Copy HTML → paste into a text editor shows the full document.
10. Drag a .md file onto the window → loads; a >2MB file → warning notice but loads; a .png → "unsupported" notice.
11. Refresh the page → content, theme, and knobs restore (autosave).
12. Narrow the window below 768px → Editor/Preview toggle appears and works.
13. Keyboard-only pass: Tab reaches every toolbar control, dialog closes on Esc, focus rings visible.

- [ ] **Step 3: Record outcomes** — every failed check becomes a fix commit (with the covering test where jsdom can express one) before this task is marked complete.

---

## Self-Review Notes

- Preview iframe sandbox reasoning documented at the element and pinned by test (Task 6 Step 1) — `allow-same-origin` without `allow-scripts` is the deliberate pairing; the spec's two requirements (sandboxed preview + knob CSS-var fast-path) are only satisfiable together this way.
- Exports never read the preview — `withDocument` renders fresh (Task 6), so the knob fast-path can't leak stale state into files.
- CodeMirror-in-jsdom is a known rough edge: the smoke test ships the two standard `Range` shims and instructs narrow additions only.
- Theme thumbnails use `sandbox=""` (fully locked; no interaction needed) vs the main preview's `allow-same-origin` (knob fast-path needed) — intentional difference.
- `store.set` knobs-replacement semantics are pinned by test (Task 2) because the reset flow depends on it.
