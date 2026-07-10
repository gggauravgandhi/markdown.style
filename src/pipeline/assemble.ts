import { baseCss } from '../themes/registry'
import type { Knobs } from './types'

export function extractTitle(src: string): string {
  const m = src.match(/^#\s+(.+)$/m)
  if (!m) return 'Document'
  return m[1]!.replace(/[*_`~]/g, '').trim() || 'Document'
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Hex, rgb()/hsl() with numeric-ish args, or a bare color keyword. Anything else is dropped. */
const SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20}|(rgb|rgba|hsl|hsla)\([\d\s.,%/deg-]{1,40}\))$/

function knobsToCss(knobs: Knobs): string {
  const lines: string[] = []
  if (knobs.accent && SAFE_COLOR.test(knobs.accent)) lines.push(`--mds-accent: ${knobs.accent};`)
  if (typeof knobs.fontScale === 'number' && Number.isFinite(knobs.fontScale)) {
    lines.push(`--mds-font-scale: ${Math.min(1.5, Math.max(0.7, knobs.fontScale))};`)
  }
  if (typeof knobs.pageWidth === 'number' && Number.isFinite(knobs.pageWidth)) {
    lines.push(`--mds-page-width: ${Math.round(Math.min(1400, Math.max(480, knobs.pageWidth)))}px;`)
  }
  return lines.length ? `:root { ${lines.join(' ')} }` : ''
}

export function assembleDocument(opts: {
  body: string
  title: string
  themeCss: string
  knobs: Knobs
  extraCss?: string
}): string {
  const { body, title, themeCss, knobs, extraCss = '' } = opts
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
${baseCss}
${themeCss}
${knobsToCss(knobs)}
${extraCss}
</style>
</head>
<body>
<main class="mds-content">${body}</main>
</body>
</html>
`
}
