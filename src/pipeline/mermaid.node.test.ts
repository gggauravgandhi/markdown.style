// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { renderMermaidFences } from './mermaid'

describe('renderMermaidFences without a DOM', () => {
  it('degrades to error blocks and annotations (build-time guarantee)', async () => {
    const { body, errors } = await renderMermaidFences(
      '<div data-mds-slot="mermaid:0"></div>',
      [{ index: 0, lang: 'mermaid', code: 'graph TD\nA-->B\n' }],
      'default',
    )
    expect(body).toContain('mds-error')
    expect(body).toContain('requires a browser')
    expect(body).not.toContain('data-mds-slot')
    expect(errors).toEqual([{ source: 'mermaid', message: 'diagram 1 failed to render' }])
  })
})
