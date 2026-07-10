// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { render } from './render'

describe('render without a DOM (static build environment)', () => {
  it('renders a full document without throwing', async () => {
    const md = '# Build Page\n\n| a |\n|---|\n| 1 |\n\n```ts\nconst x = 1\n```\n\nmath $x^2$ here'
    const { html, title, errors } = await render(md, 'paper')
    expect(title).toBe('Build Page')
    expect(html).toContain('<table>')
    expect(html).toContain('shiki')
    expect(html).toContain('katex')
    expect(errors).toEqual([])
    expect(html).not.toMatch(/<script/i)
  })
})
