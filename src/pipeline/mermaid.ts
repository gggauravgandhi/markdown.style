import type { Fence, MermaidTheme, RenderError } from './types'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function errorBlock(fence: Fence, message: string): string {
  return `<div class="mds-error"><p class="mds-error-title">Mermaid diagram failed: ${escapeHtml(message)}</p><pre><code>${escapeHtml(fence.code)}</code></pre></div>\n`
}

type StageOutput = { html: string; ok: boolean }

/**
 * Fill mermaid slots with inline SVG; any failure becomes a visible error block.
 * Security: output bypasses DOMPurify by design (see Interfaces note) —
 * securityLevel 'strict' is the control; never weaken it.
 */
export async function renderMermaidFences(
  body: string,
  fences: Fence[],
  mermaidTheme: MermaidTheme,
): Promise<{ body: string; errors: RenderError[] }> {
  const errors: RenderError[] = []
  let out = body
  let renderOne: (fence: Fence) => Promise<StageOutput>

  if (typeof document === 'undefined') {
    renderOne = async (fence) => ({
      html: errorBlock(fence, 'diagram requires a browser to render'),
      ok: false,
    })
  } else {
    try {
      const { default: mermaid } = await import('mermaid')
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: mermaidTheme })
      renderOne = async (fence) => {
        const { svg } = await mermaid.render(`mds-mermaid-${fence.index}`, fence.code)
        return { html: `<figure class="mds-mermaid">${svg}</figure>\n`, ok: true }
      }
    } catch {
      renderOne = async (fence) => ({ html: errorBlock(fence, 'mermaid failed to load'), ok: false })
    }
  }

  for (const fence of fences) {
    let result: StageOutput
    try {
      result = await renderOne(fence)
    } catch (e) {
      result = {
        html: errorBlock(fence, e instanceof Error ? e.message.split('\n')[0]! : 'invalid diagram'),
        ok: false,
      }
    }
    if (!result.ok) {
      errors.push({ source: 'mermaid', message: `diagram ${fence.index + 1} failed to render` })
    }
    // mermaid.render can leave an error element behind in the live DOM — remove it.
    // Guarded with typeof: a bare `document?.` still ReferenceErrors when undeclared.
    if (typeof document !== 'undefined') {
      document.getElementById(`dmds-mermaid-${fence.index}`)?.remove()
    }
    // function replacer: user-authored diagram labels can contain $ sequences
    out = out.replace(`<div data-mds-slot="mermaid:${fence.index}"></div>`, () => result.html)
  }
  return { body: out, errors }
}
