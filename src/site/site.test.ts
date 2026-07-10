// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { themes } from '../themes/registry'

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
    // NOTE: attribute-order-sensitive — JSON-LD scripts must be written exactly
    // as `<script type="application/ld+json">` (type attribute first)
    expect(html).not.toMatch(/<script(?! type="application\/ld\+json")/)
    // no external requests: only same-origin or inline assets
    expect(html).not.toMatch(/(href|src)="https?:\/\/(?!markdown\.style[/"])/)
    // exactly one h1
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    // internal links extensionless, never hash-routed
    expect(html).not.toMatch(/href="\/[a-z-]+\.html"/)
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

  it('the generated sitemap is the single source of routes (static copy removed)', () => {
    expect(() => read('public/sitemap.xml')).toThrow() // generator owns it now
  })

  it('llms.txt describes the tool and lists key pages', () => {
    const llms = read('public/llms.txt')
    expect(llms).toContain('# markdown.style')
    expect(llms).toContain('https://markdown.style/editor')
    expect(llms).toContain('https://markdown.style/themes')
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

  it('theme strip mirrors the registry exactly and links every theme page', () => {
    for (const t of themes) {
      // one structural match per theme: swatch color, link target, and name
      // must sit in the SAME strip item — presence-anywhere would let a
      // cross-wired strip (name A, accent B) slip through
      expect(html, t.id).toContain(
        `<span class="swatch" style="background:${t.defaultAccent}"></span><a href="/themes/${t.id}">${t.name}</a>`,
      )
    }
    expect(html.match(/class="swatch"/g)).toHaveLength(themes.length)
  })
})
