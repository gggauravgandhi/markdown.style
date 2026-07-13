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

export function injectNoindex(html: string): string {
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
  const specimen = readFileSync(join(samplesDir, 'specimen.md'), 'utf8')

  // theme pages + hub share one showcase render per theme; a rendering error
  // in sample content is a build bug; fail loudly, never ship a broken demo
  const sampleBodies = new Map<string, string>()
  const specimenBodies = new Map<string, string>()
  for (const t of themes) {
    const { body, errors } = await renderBody(showcase, t.id)
    if (errors.length > 0) throw new Error(`sample render failed for ${t.id}: ${errors[0]!.message}`)
    sampleBodies.set(t.id, body)
    const specimenResult = await renderBody(specimen, t.id)
    if (specimenResult.errors.length > 0) throw new Error(`specimen render failed for ${t.id}: ${specimenResult.errors[0]!.message}`)
    specimenBodies.set(t.id, specimenResult.body)
    const full = await render(showcase, t.id)
    write(`samples/${t.id}.html`, injectNoindex(full.html))
  }
  write(routeToFile('/themes'), buildThemesHub(sampleBodies))
  for (const c of themeCopy) {
    write(routeToFile(`/themes/${c.id}`), await buildThemePage(c, sampleBodies.get(c.id)!, specimenBodies.get(c.id)!, specimen))
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
