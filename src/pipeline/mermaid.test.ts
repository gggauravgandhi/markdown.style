import { describe, expect, it } from 'vitest'
import { renderMermaidFences } from './mermaid'

// jsdom lacks SVG layout APIs (getBBox), so even valid diagrams fail here.
// That exercises exactly the path we must guarantee: a visible error block,
// escaped source shown, an error annotation returned, and no throw.
// Happy-path SVG output is verified in a real browser during app QA (Plan 2).
describe('renderMermaidFences', () => {
  it('renders a visible error block instead of throwing', async () => {
    const body = '<div data-mds-slot="mermaid:0"></div>'
    const { body: out, errors } = await renderMermaidFences(
      body,
      [{ index: 0, lang: 'mermaid', code: 'not a diagram <script>x</script>' }],
      'default',
    )
    expect(out).not.toContain('data-mds-slot')
    expect(out).toContain('mds-error')
    expect(out).not.toContain('<script>')
    expect(errors).toHaveLength(1)
    expect(errors[0]!.source).toBe('mermaid')
  })

  it('handles multiple fences independently', async () => {
    const body = '<div data-mds-slot="mermaid:0"></div><div data-mds-slot="mermaid:1"></div>'
    const { body: out, errors } = await renderMermaidFences(
      body,
      [
        { index: 0, lang: 'mermaid', code: 'bad one' },
        { index: 1, lang: 'mermaid', code: 'also bad' },
      ],
      'default',
    )
    expect(out).not.toContain('data-mds-slot')
    expect(errors).toHaveLength(2)
  })
})
