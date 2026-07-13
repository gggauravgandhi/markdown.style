import { describe, expect, it } from 'vitest'
import { assembleDocument, extractTitle } from './assemble'

describe('extractTitle', () => {
  it('takes the first h1 text', () => {
    expect(extractTitle('intro\n\n# Q3 **Sales** `Report`\n\n# Second')).toBe('Q3 Sales Report')
  })
  it('falls back to Document', () => {
    expect(extractTitle('no headings here')).toBe('Document')
  })
})

describe('assembleDocument', () => {
  const base = { body: '<p>hi</p>', title: 'T', themeCss: ':root{--mds-bg:#fff}', knobs: {} }

  it('produces a complete standalone document', () => {
    const html = assembleDocument(base)
    expect(html).toMatch(/^<!doctype html>/)
    expect(html).toContain('<meta charset="utf-8">')
    expect(html).toContain('<title>T</title>')
    expect(html).toContain('<main class="mds-content"><p>hi</p></main>')
    expect(html).toContain(':root{--mds-bg:#fff}')
    expect(html).not.toContain('<script')
  })

  it('escapes the title', () => {
    const html = assembleDocument({ ...base, title: '<script>x</script> & co' })
    expect(html).toContain('<title>&lt;script&gt;x&lt;/script&gt; &amp; co</title>')
  })

  it('emits validated knobs as css variables', () => {
    const html = assembleDocument({ ...base, knobs: { accent: '#ff0000', fontScale: 1.2, pageWidth: 900 } })
    expect(html).toContain('--mds-accent: #ff0000')
    expect(html).toContain('--mds-font-scale: 1.2')
    expect(html).toContain('--mds-page-width: 900px')
  })

  it('clamps numeric knobs to safe ranges', () => {
    const html = assembleDocument({ ...base, knobs: { fontScale: 99, pageWidth: 10 } })
    expect(html).toContain('--mds-font-scale: 1.5')
    expect(html).toContain('--mds-page-width: 480px')
  })

  // NOTE: baseCss (inlined in every document) legitimately declares default
  // --mds-* variables, so assert on the knob OVERRIDE block (`:root { --mds-…`,
  // single-line format unique to knobsToCss); never on bare variable names.
  it('drops CSS-injection attempts in accent', () => {
    const html = assembleDocument({ ...base, knobs: { accent: 'red;}body{background:url(javascript:alert(1))' } })
    expect(html).not.toContain('javascript:alert')
    expect(html).not.toContain('red;}')
    expect(html).not.toContain(':root { --mds-accent')
  })

  it('drops non-finite numeric knobs entirely (no override block)', () => {
    const html = assembleDocument({ ...base, knobs: { fontScale: Number.NaN, pageWidth: Infinity } })
    expect(html).not.toContain(':root { --mds')
  })

  it('includes extraCss when provided', () => {
    const html = assembleDocument({ ...base, extraCss: '.katex{color:red}' })
    expect(html).toContain('.katex{color:red}')
  })
})
