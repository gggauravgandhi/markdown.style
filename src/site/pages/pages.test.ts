// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderBody } from '../../pipeline/render'
import { CATEGORY_LABELS, themes, type Category } from '../../themes/registry'
import { convertPages, themeCopy, useCases } from './copy'
import { buildConvertPage } from './convert-pages'
import { ALL_ROUTES, GENERATED_ROUTES } from './routes'
import { escapeHtml } from './shell'
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

  it('the hub previews every theme inline and links each theme page', async () => {
    const pages = await pagesPromise
    const hub = pages.get('/themes')!
    for (const t of themes) {
      expect(hub, t.id).toContain(`href="/themes/${t.id}"`)
      expect(hub, t.id).toContain(`mds-theme-${t.id}`)
    }
    expect(hub).not.toContain('<iframe')
    for (const category of Object.keys(CATEGORY_LABELS)) {
      expect(hub).toContain(`id="${category}"`)
      // labels go through escapeHtml before landing in the page (e.g. "Business & Reports" -> "&amp;")
      expect(hub).toContain(escapeHtml(CATEGORY_LABELS[category as Category]))
    }
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
    expect(urls.length).toBeLessThanOrEqual(50) // re-ruled 2026-07-11 (theme expansion spec §1.3)
    expect(urls.length).toBe(4 + GENERATED_ROUTES.length) // '/', '/editor', '/privacy', '/terms' + generated
    expect(urls.length).toBe(40) // 4 static + 36 generated (spec 2026-07-11 §6)
  })
})

describe('themeCopy', () => {
  it('themeCopy is 1:1 with the registry', () => {
    expect(themeCopy.map(c => c.id).sort()).toEqual([...themes.map(t => t.id)].sort())
  })
})
