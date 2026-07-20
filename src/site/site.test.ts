// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { themes } from '../themes/registry'
import { useCases } from './pages/copy'
import { buildLlms, buildRobots } from './pages/crawl-files'
import { ALL_ROUTES } from './pages/routes'

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
    // no external REQUESTS: nothing the page fetches may be third-party. src (script,
    // img, iframe) and href on <link> (stylesheet, preconnect, font) are fetches.
    // An <a href> is not a fetch; it is navigation on click, so outbound links
    // (the GitHub repo) are allowed and the privacy promise still holds literally.
    expect(html).not.toMatch(/\s(src|srcset)="https?:\/\/(?!markdown\.style[/"])/)
    expect(html).not.toMatch(/<link\b[^>]*href="https?:\/\/(?!markdown\.style[/"])/)
    // exactly one h1
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    // internal links extensionless, never hash-routed
    expect(html).not.toMatch(/href="\/[a-z-]+\.html"/)
    expect(html).not.toContain('href="#/')
  })

  it.each(MARKETING_PAGES)('%s ships zero JS (citable, nothing to execute)', page => {
    // the homepage paste gateway was reverted (the landing CTA just links to the
    // editor), so index.html is back inside the strict zero-script invariant.
    const html = read(page)
    expect(html).not.toMatch(/<script(?! type="application\/ld\+json")/)
  })

  it('landing leads with the AI-generated-Markdown-to-polished-document positioning', () => {
    const html = read('index.html')
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)![1]!
    expect(h1.toLowerCase()).toContain('ai-generated markdown')
    expect(h1.toLowerCase()).toContain('polished document')
    expect(html).toContain('href="/editor"')
    expect(html.toLowerCase()).toContain('not uploaded')
  })

  it('every og:image target actually exists, so shared links are not blank cards', () => {
    // og.png was referenced by index.html and by every generated page while the
    // file did not exist: every share rendered an empty card, and no test noticed,
    // because nothing checked that a meta tag points at real bytes.
    const referenced = new Set<string>()
    for (const page of [...MARKETING_PAGES, 'src/site/pages/shell.ts']) {
      for (const [, url] of read(page).matchAll(/og:image" content="[^"]*?(\/[\w.-]+)"/g)) referenced.add(url!)
    }
    expect(referenced.size).toBeGreaterThan(0)
    for (const url of referenced) {
      expect(existsSync(join(root, 'public', url)), `public${url} is referenced by og:image but missing`).toBe(true)
    }
  })

  it('landing links the real repo, so the open-source claim is verifiable (plan §15)', () => {
    const html = read('index.html')
    // the repo behind `git remote origin`; an invented URL is worse than none
    expect(html).toContain('href="https://github.com/gggauravgandhi/markdown.style"')
  })

  it('every example-gallery link points at a use-case route that actually exists', () => {
    // nothing else covers this: a mistyped slug (/use-cases/architecture) ships a
    // dead link with the suite fully green, since the generator derives its routes
    // from `useCases` and never looks at the hand-written landing markup.
    const html = read('index.html')
    const linked = [...html.matchAll(/href="\/use-cases\/([a-z-]+)"/g)].map(m => m[1]!)
    const slugs = new Set(useCases.map(u => u.slug))
    expect(linked.length).toBeGreaterThan(0)
    for (const slug of linked) expect(slugs, slug).toContain(slug)
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
    const robots = buildRobots()
    expect(robots).toMatch(/User-agent: \*\s+Allow: \//)
    for (const bot of ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User', 'GPTBot', 'ClaudeBot']) {
      expect(robots).toContain(`User-agent: ${bot}`)
    }
    expect(robots).not.toMatch(/Disallow: \/\S/)
    expect(robots).toContain('Sitemap: https://markdown.style/sitemap.xml')
  })

  it('the generator owns sitemap.xml, robots.txt, and llms.txt: no static copies left', () => {
    expect(() => read('public/sitemap.xml')).toThrow()
    expect(() => read('public/robots.txt')).toThrow()
    expect(() => read('public/llms.txt')).toThrow()
  })

  it('llms.txt follows the llmstxt.org format: an H1, and links as [name](url)', () => {
    // the PageSpeed audit fails a bare "- Name: url" list with "no links". The spec
    // wants a single H1, then H2 sections whose items are real markdown links.
    const llms = buildLlms()
    expect(llms.match(/^# .+/m), 'needs exactly one H1').toHaveLength(1)
    const links = [...llms.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)]
    expect(links.length, 'must contain markdown links, not bare URLs').toBeGreaterThan(0)
    expect(llms).toContain('[Editor](https://markdown.style/editor)')
    expect(llms).toContain('[Theme gallery](https://markdown.style/themes)')
  })

  it('llms.txt theme count is derived, never a stale hardcoded number', () => {
    const llms = buildLlms()
    expect(llms).toContain(String(themes.length))
    expect(llms.toLowerCase()).not.toContain('eight')
  })

  it('every markdown.style URL llms.txt lists is a real route (no dead links in the crawler map)', () => {
    const llms = buildLlms()
    // URLs live inside [name](url) now, so stop at the closing paren, and skip
    // off-site links (the GitHub repo) which are not routes of ours to validate.
    const paths = [...llms.matchAll(/\]\(https:\/\/markdown\.style(\/[^)]*)\)/g)].map(m => m[1]!)
    expect(paths.length).toBeGreaterThan(0)
    for (const p of paths) expect(ALL_ROUTES, p).toContain(p)
  })

  it('llms.txt makes no false export capability claim', () => {
    const llms = buildLlms()
    expect(llms).not.toContain('DOCX')
    expect(llms.toLowerCase()).not.toMatch(/one[- ]click[^.]*pdf/)
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

describe('site css', () => {
  it('scopes the nav-link muted color so it never overrides a CTA button', () => {
    // regression (browser QA 2026-07-10): `.site-nav a` out-specified `.btn-cta`,
    // rendering the "Open the editor" button gray-on-purple (WCAG fail).
    const css = read('src/site/site.css')
    expect(css).toContain('.site-nav a:not(.btn-cta)')
    expect(css).not.toMatch(/\.site-nav a\s*\{/) // the unscoped selector must be gone
  })

  it('hub mini-preview padding out-specifies the scoped theme sheet (0,3,0 beats the 0,2,0 tie)', () => {
    const css = read('src/site/site.css')
    expect(css).toContain('.theme-card-link .mini-preview .mds-content')
  })
})

describe('landing ↔ registry sync', () => {
  const html = read('index.html')

  it('links the themes hub from nav and strip section', () => {
    expect(html).toContain('href="/themes"')
  })

  it('theme strip mirrors the featured lineup and links a browse-all page', () => {
    for (const t of themes.filter(t => t.featured)) {
      expect(html, t.id).toContain(
        `<span class="swatch" style="background:${t.defaultAccent}"></span><a href="/themes/${t.id}">${t.name}</a>`,
      )
    }
    expect(html.match(/class="swatch"/g)).toHaveLength(6) // the final featured count, boardroom included
    expect(html).toContain('Browse all 30 themes')
  })
})
