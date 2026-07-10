import type { Fence } from './types'

/** Fill code slots with Shiki static HTML. Shiki loads lazily (heavy). */
export async function highlightFences(body: string, fences: Fence[], shikiTheme: string): Promise<string> {
  const { codeToHtml } = await import('shiki')
  let out = body
  for (const fence of fences) {
    const lang = fence.lang || 'text'
    let html: string
    try {
      html = await codeToHtml(fence.code, { lang, theme: shikiTheme })
    } catch {
      // unknown language or grammar load failure — plain text, never a blank hole
      html = await codeToHtml(fence.code, { lang: 'text', theme: shikiTheme })
    }
    out = out.replace(`<pre data-mds-slot="code:${fence.index}"></pre>`, html)
  }
  return out
}
