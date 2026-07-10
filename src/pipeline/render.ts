import { getTheme } from '../themes/registry'
import { assembleDocument, extractTitle } from './assemble'
import { highlightFences } from './highlight'
import { markdownToHtml, stripFrontmatter } from './markdown'
import { renderMermaidFences } from './mermaid'
import { sanitizeBody } from './sanitize'
import type { Knobs, RenderError, RenderResult } from './types'

/**
 * The one function the product hangs off (spec §2).
 * Preview, HTML download, and print all consume this exact string.
 * Order: markdown(+katex) → sanitize user-authored body → fill trusted
 * slots (shiki, mermaid) → assemble. Never throws; errors are annotated.
 */
export async function render(markdown: string, themeId: string, knobs: Knobs = {}): Promise<RenderResult> {
  const theme = getTheme(themeId)
  const src = stripFrontmatter(markdown)
  const pass = await markdownToHtml(src)
  const errors: RenderError[] = []

  let body = sanitizeBody(pass.body)
  if (pass.codeFences.length > 0) {
    body = await highlightFences(body, pass.codeFences, theme.shikiTheme)
  }
  if (pass.mermaidFences.length > 0) {
    const result = await renderMermaidFences(body, pass.mermaidFences, theme.mermaidTheme)
    body = result.body
    errors.push(...result.errors)
  }

  const extraCss = pass.usedMath ? await (await import('./katex-css')).mathCss() : ''
  const title = extractTitle(src)
  const html = assembleDocument({ body, title, themeCss: theme.css, knobs, extraCss })
  return { html, title, errors }
}
