import { describe, expect, it } from 'vitest'
import { sanitizeBody } from './sanitize'

describe('sanitizeBody', () => {
  it('strips script tags', async () => {
    expect(await sanitizeBody('<p>ok</p><script>alert(1)</script>')).toBe('<p>ok</p>')
  })

  it('strips event handler attributes', async () => {
    const out = await sanitizeBody('<img src="x.png" onerror="alert(1)"><p onclick="x()">t</p>')
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('onclick')
  })

  it('strips javascript: URLs', async () => {
    expect(await sanitizeBody('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:')
  })

  it('keeps slot elements with data attributes', async () => {
    const body = '<pre data-mds-slot="code:0"></pre><div data-mds-slot="mermaid:0"></div>'
    expect(await sanitizeBody(body)).toBe(body)
  })

  it('keeps KaTeX-style spans with inline styles and MathML', async () => {
    const body = '<span class="katex" style="margin-right:0.1em">x</span><math><mi>x</mi></math>'
    const out = await sanitizeBody(body)
    expect(out).toContain('class="katex"')
    expect(out).toContain('style=')
    expect(out).toContain('<math>')
  })

  it('keeps tables, task-list checkboxes, and images', async () => {
    const body = '<table><tbody><tr><td>1</td></tr></tbody></table><input type="checkbox" checked disabled><img src="https://x/y.png" alt="a">'
    const out = await sanitizeBody(body)
    expect(out).toContain('<table>')
    expect(out).toContain('checkbox')
    expect(out).toContain('<img')
  })

  it('strips onload from SVG', async () => {
    expect(await sanitizeBody('<svg onload="alert(1)"><circle r="1"/></svg>')).not.toContain('onload')
  })

  it('strips script tags inside SVG', async () => {
    expect(await sanitizeBody('<svg><script>alert(1)</script></svg>')).not.toContain('<script')
  })

  it('strips javascript: URLs from SVG use href/xlink:href', async () => {
    expect(await sanitizeBody('<svg><use href="javascript:alert(1)"/></svg>')).not.toContain('javascript:')
    expect(await sanitizeBody('<svg><use xlink:href="javascript:alert(1)"/></svg>')).not.toContain('javascript:')
  })

  it('strips javascript: URLs from SVG animate attribute values', async () => {
    expect(await sanitizeBody('<svg><animate attributeName="href" values="javascript:alert(1)"/></svg>')).not.toContain('javascript:')
  })
})
