// Dev-only page renderer: serves the generated pages (theme hub, theme
// pages, use-case pages, convert pages, standalone samples) from `bun run
// dev`, rendered on demand from the same builders `scripts/build-pages.ts`
// uses for production.
//
// This module is loaded by vite.config.ts's plugin via `server.ssrLoadModule`,
// not a plain top-level import: vite.config.ts itself is loaded by the plain
// Node.js `vite` binary (its shebang is `#!/usr/bin/env node` even under
// `bun run`), whose strict ESM resolver doesn't understand this project's
// extensionless imports or the theme registry's `?raw` css imports.
// `ssrLoadModule` instead runs this file through Vite's own dev-server
// module pipeline (the same one that serves /src/main.ts to the browser),
// which handles both natively. Since that pipeline only exists once the dev
// server is running, `vite build` never touches this file at all.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, renderBody } from '../../pipeline/render'
import { themes } from '../../themes/registry'
import { convertPages, themeCopy, useCases, type ConvertCopy, type ThemeCopy, type UseCaseCopy } from './copy'
import { buildConvertPage } from './convert-pages'
import { injectNoindex } from './build'
import { buildThemePage, buildThemesHub } from './theme-pages'
import { buildUseCasePage } from './use-case-pages'

const samplesDir = join(import.meta.dirname, '..', '..', '..', 'content', 'samples')

export type DevRoute =
  | { kind: 'themes-hub' }
  | { kind: 'theme-page'; copy: ThemeCopy }
  | { kind: 'use-case-page'; copy: UseCaseCopy }
  | { kind: 'convert-page'; copy: ConvertCopy }
  | { kind: 'theme-sample'; themeId: string }
  | { kind: 'use-case-sample'; copy: UseCaseCopy }

function stripTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

/** Pure route -> builder resolution, kept separate from the middleware so it's unit-testable. */
export function resolveDevRoute(pathname: string): DevRoute | null {
  const path = stripTrailingSlash(pathname)
  if (path === '/themes') return { kind: 'themes-hub' }

  const themeMatch = path.match(/^\/themes\/([^/]+)$/)
  if (themeMatch) {
    const copy = themeCopy.find(c => c.id === themeMatch[1])
    return copy ? { kind: 'theme-page', copy } : null
  }

  const useCaseMatch = path.match(/^\/use-cases\/([^/]+)$/)
  if (useCaseMatch) {
    const copy = useCases.find(u => u.slug === useCaseMatch[1])
    return copy ? { kind: 'use-case-page', copy } : null
  }

  const convertMatch = path.match(/^\/convert\/([^/]+)$/)
  if (convertMatch) {
    const copy = convertPages.find(c => c.slug === convertMatch[1])
    return copy ? { kind: 'convert-page', copy } : null
  }

  const sampleMatch = path.match(/^\/samples\/([^/]+)\.html$/)
  if (sampleMatch) {
    const id = sampleMatch[1]!
    if (themes.some(t => t.id === id)) return { kind: 'theme-sample', themeId: id }
    const copy = useCases.find(u => u.slug === id)
    return copy ? { kind: 'use-case-sample', copy } : null
  }

  return null
}

// The hub needs a render of every theme's showcase sample (30 renders), too
// slow to redo on every request, so it's cached for the dev session (module
// scope, reset whenever Vite reloads this module graph after a relevant file
// changes; see vite.config.ts). Individual theme pages below are cheap
// enough to always render fresh.
let hubCache: string | null = null

async function renderThemesHub(): Promise<string> {
  if (hubCache) return hubCache
  const showcase = readFileSync(join(samplesDir, 'showcase.md'), 'utf8')
  const sampleBodies = new Map<string, string>()
  for (const t of themes) {
    const { body, errors } = await renderBody(showcase, t.id)
    if (errors.length > 0) throw new Error(`sample render failed for ${t.id}: ${errors[0]!.message}`)
    sampleBodies.set(t.id, body)
  }
  hubCache = buildThemesHub(sampleBodies)
  return hubCache
}

async function renderThemePage(copy: ThemeCopy): Promise<string> {
  const showcase = readFileSync(join(samplesDir, 'showcase.md'), 'utf8')
  const specimen = readFileSync(join(samplesDir, 'specimen.md'), 'utf8')
  const sample = await renderBody(showcase, copy.id)
  if (sample.errors.length > 0) throw new Error(`sample render failed for ${copy.id}: ${sample.errors[0]!.message}`)
  const specimen_ = await renderBody(specimen, copy.id)
  if (specimen_.errors.length > 0) throw new Error(`specimen render failed for ${copy.id}: ${specimen_.errors[0]!.message}`)
  return buildThemePage(copy, sample.body, specimen_.body, specimen)
}

async function renderUseCasePage(copy: UseCaseCopy): Promise<string> {
  const md = readFileSync(join(samplesDir, `${copy.slug}.md`), 'utf8')
  const { body, errors } = await renderBody(md, copy.themeId)
  if (errors.length > 0) throw new Error(`sample render failed for ${copy.slug}: ${errors[0]!.message}`)
  return buildUseCasePage(copy, md, body)
}

async function renderThemeSample(themeId: string): Promise<string> {
  const showcase = readFileSync(join(samplesDir, 'showcase.md'), 'utf8')
  const full = await render(showcase, themeId)
  return injectNoindex(full.html)
}

async function renderUseCaseSample(copy: UseCaseCopy): Promise<string> {
  const md = readFileSync(join(samplesDir, `${copy.slug}.md`), 'utf8')
  const full = await render(md, copy.themeId)
  return injectNoindex(full.html)
}

/** Renders the HTML for a resolved dev route, using the exact same builder functions as the
 *  production `scripts/build-pages.ts`. Throws on a render error rather than serving a broken page. */
export async function renderDevRoute(route: DevRoute): Promise<string> {
  switch (route.kind) {
    case 'themes-hub':
      return renderThemesHub()
    case 'theme-page':
      return renderThemePage(route.copy)
    case 'use-case-page':
      return renderUseCasePage(route.copy)
    case 'convert-page':
      return buildConvertPage(route.copy)
    case 'theme-sample':
      return renderThemeSample(route.themeId)
    case 'use-case-sample':
      return renderUseCaseSample(route.copy)
  }
}
