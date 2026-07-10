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
