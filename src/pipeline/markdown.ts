import MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'
import type { Fence, MarkdownPass } from './types'

/** Strip a leading YAML frontmatter block (--- ... ---) if present at position 0. */
export function stripFrontmatter(src: string): string {
  return src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
}

/**
 * Cheap gate for lazy-loading KaTeX. False positives only cost an unneeded
 * plugin load, so this is intentionally permissive, but a lone $amount must
 * not trigger (inline math requires both $ on one line).
 */
export function hasMath(src: string): boolean {
  return /\$\$[\s\S]+?\$\$/.test(src) || /\$[^$\n]+\$/.test(src)
}

export async function markdownToHtml(src: string): Promise<MarkdownPass> {
  const md = new MarkdownIt({
    html: false, // security boundary: never enable (spec §2)
    linkify: true,
    typographer: true,
  })
  md.use(taskLists, { enabled: false, label: true })
  md.use(footnote)

  const usedMath = hasMath(src)
  if (usedMath) {
    // lazy: math.ts statically imports katex, keeping it out of the base graph
    const { mathPlugin } = await import('./math')
    md.use(mathPlugin)
  }

  const codeFences: Fence[] = []
  const mermaidFences: Fence[] = []

  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]!
    const lang = (token.info.trim().split(/\s+/)[0] ?? '').toLowerCase()
    if (lang === 'mermaid') {
      const index = mermaidFences.length
      mermaidFences.push({ index, lang, code: token.content })
      return `<div data-mds-slot="mermaid:${index}"></div>\n`
    }
    const index = codeFences.length
    codeFences.push({ index, lang, code: token.content })
    return `<pre data-mds-slot="code:${index}"></pre>\n`
  }

  return { body: md.render(src), codeFences, mermaidFences, usedMath }
}
