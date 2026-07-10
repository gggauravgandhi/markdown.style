import { describe, expect, it } from 'vitest'
import { highlightFences } from './highlight'

describe('highlightFences', () => {
  it('replaces slots with shiki-highlighted HTML', async () => {
    const body = '<p>before</p>\n<pre data-mds-slot="code:0"></pre>\n<p>after</p>'
    const out = await highlightFences(body, [{ index: 0, lang: 'ts', code: 'const a = 1\n' }], 'github-light')
    expect(out).not.toContain('data-mds-slot')
    expect(out).toContain('shiki')
    expect(out).toContain('<span')
    expect(out).toContain('before')
    expect(out).toContain('after')
  })

  it('falls back to plain text for unknown languages', async () => {
    const body = '<pre data-mds-slot="code:0"></pre>'
    const out = await highlightFences(body, [{ index: 0, lang: 'notalang9', code: 'x y z\n' }], 'github-light')
    expect(out).not.toContain('data-mds-slot')
    expect(out).toContain('x y z')
  })

  it('escapes HTML inside code content', async () => {
    const body = '<pre data-mds-slot="code:0"></pre>'
    const out = await highlightFences(body, [{ index: 0, lang: '', code: '<script>alert(1)</script>\n' }], 'github-light')
    expect(out).not.toContain('<script>')
  })

  it('inserts highlighted HTML literally — $ sequences in code survive', async () => {
    const body = '<p>x</p><pre data-mds-slot="code:0"></pre><p>y</p>'
    const out = await highlightFences(body, [{ index: 0, lang: 'bash', code: 'echo $$ $& then $\'a\'\n' }], 'github-light')
    expect(out).toContain('$$')
    expect(out).not.toContain('data-mds-slot')
    // $` and $' must not splice surrounding document HTML into the code block
    expect(out.match(/<p>x<\/p>/g)).toHaveLength(1)
    expect(out.match(/<p>y<\/p>/g)).toHaveLength(1)
  })
})
