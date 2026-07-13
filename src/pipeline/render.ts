import { getTheme } from '../themes/registry'
import { assembleDocument, extractTitle } from './assemble'
import { highlightFences } from './highlight'
import { markdownToHtml, stripFrontmatter } from './markdown'
import { renderMermaidFences } from './mermaid'
import { sanitizeBody } from './sanitize'
import type { Knobs, RenderError, RenderResult } from './types'

/** The processed document body before assembly, used by the static-page generator. */
export async function renderBody(
  markdown: string,
  themeId: string,
): Promise<{ body: string; title: string; errors: RenderError[]; usedMath: boolean }> {
  const theme = getTheme(themeId)
  const src = stripFrontmatter(markdown)
  const pass = await markdownToHtml(src)
  const errors: RenderError[] = []

  let body = await sanitizeBody(pass.body)
  if (pass.codeFences.length > 0) {
    body = await highlightFences(body, pass.codeFences, theme.shikiTheme)
  }
  if (pass.mermaidFences.length > 0) {
    const result = await renderMermaidFences(body, pass.mermaidFences, theme.mermaidTheme)
    body = result.body
    errors.push(...result.errors)
  }
  return { body, title: extractTitle(src), errors, usedMath: pass.usedMath }
}

/**
 * The one function the product hangs off (spec §2).
 * Preview, HTML download, and print all consume this exact string.
 * Order: markdown(+katex) → sanitize user-authored body → fill trusted
 * slots (shiki, mermaid) → assemble. Never throws; errors are annotated.
 */
export async function render(markdown: string, themeId: string, knobs: Knobs = {}): Promise<RenderResult> {
  const theme = getTheme(themeId)
  const { body, title, errors, usedMath } = await renderBody(markdown, themeId)
  const extraCss = usedMath ? await (await import('./katex-css')).mathCss() : ''
  const html = assembleDocument({
    body,
    title,
    themeCss: theme.css,
    knobs: { ...knobs, accent: knobs.accent ?? theme.defaultAccent },
    extraCss,
  })
  return { html, title, errors }
}
