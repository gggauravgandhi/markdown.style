import { describe, expect, it } from 'vitest'
import { render } from './render'

const FULL_DOC = `---
generator: llm
---
# Q3 Report

Revenue grew. See https://example.com and ~~old numbers~~.

| Region | Growth |
|--------|--------|
| EU     | 14%    |

- [x] reviewed
- [ ] shipped

Inline $E=mc^2$ math.

\`\`\`ts
const total: number = 42
\`\`\`

\`\`\`mermaid
graph TD
A-->B
\`\`\`

> Onward.[^1]

[^1]: A footnote.
`

describe('render (integration)', () => {
  it('renders the full feature set into one document', async () => {
    const { html, title, errors } = await render(FULL_DOC, 'paper')
    expect(title).toBe('Q3 Report')
    expect(html).toContain('<table>')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('katex')
    expect(html).toContain('shiki')
    expect(html).toContain('data:font/woff2;base64,') // math present → fonts inlined
    // jsdom cannot render mermaid — it must degrade to a visible error block
    expect(html).toContain('mds-error')
    expect(errors.length).toBeGreaterThanOrEqual(1)
    expect(html).not.toContain('data-mds-slot')
  })

  it('is script-free and self-contained (export guarantee)', async () => {
    const { html } = await render(FULL_DOC, 'paper')
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/\son\w+=/i)
    expect(html).not.toContain('javascript:')
    // no external url() refs in CSS — fonts/backgrounds must be data: or none
    const cssUrls = [...html.matchAll(/url\(\s*['"]?(?!data:)([^'")]+)/g)]
    expect(cssUrls).toEqual([])
  })

  it('omits katex css for math-free documents', async () => {
    const { html } = await render('# Plain\n\njust text', 'paper')
    expect(html).not.toContain('data:font/woff2')
  })

  it('survives hostile input without throwing (XSS corpus)', async () => {
    const hostile = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '[x](javascript:alert(1))',
      '<iframe src="https://evil"></iframe>',
      '`$`<svg onload=alert(1)>',
      '[x]("><script>alert(1)</script>)',
    ].join('\n\n')
    const { html } = await render(hostile, 'paper')
    expect(html).not.toMatch(/<script/i)
    // escaped text legitimately contains the substring "onerror" — only a
    // handler inside a LIVE tag is a failure, so anchor the match to a real tag
    expect(html).not.toMatch(/<\w+[^>]*\son\w+=/i)
    expect(html).not.toContain('<iframe')
  })

  it('handles empty input', async () => {
    const { html, title, errors } = await render('', 'paper')
    expect(title).toBe('Document')
    expect(errors).toEqual([])
    expect(html).toContain('<main class="mds-content">')
  })

  it('falls back to the first theme for unknown theme ids', async () => {
    const { html } = await render('# X', 'not-a-theme')
    expect(html).toContain('--mds-bg')
  })

  it('applies the theme defaultAccent when no accent knob is set', async () => {
    const { html } = await render('# X', 'paper')
    expect(html).toContain(':root { --mds-accent: #8b3a2f;')
  })

  it('user accent knob overrides the theme default', async () => {
    const { html } = await render('# X', 'paper', { accent: '#112233' })
    expect(html).toContain(':root { --mds-accent: #112233;')
    expect(html).not.toContain('#8b3a2f;')
  })
})
