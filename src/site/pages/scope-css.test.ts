// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { themes } from '../../themes/registry'
import { scopedSampleCss } from './scope-css'

describe('scopedSampleCss', () => {
  it.each(themes.map(t => [t.id, t] as const))('scopes %s under its class with no root/body leaks', (_id, theme) => {
    const css = scopedSampleCss(theme)
    expect(css.startsWith(`.mds-theme-${theme.id} {`)).toBe(true)
    // no un-nested :root/body selectors may survive (they would style the host page)
    expect(css).not.toMatch(/^\s*:root\b/m)
    expect(css).not.toMatch(/^\s*html,\s*body\b/m)
    expect(css).not.toMatch(/^\s*body\s*\{/m)
    // @page cannot nest inside a style rule — must be stripped for embeds
    expect(css).not.toContain('@page')
    // theme accent is applied for the embed (render() normally does this via knobs)
    expect(css).toContain(`--mds-accent: ${theme.defaultAccent}`)
  })

  it('keeps @media print nested but drops nothing else structural', () => {
    const css = scopedSampleCss(themes[0]!)
    expect(css).toContain('@media print')
    expect(css).toContain('.mds-content') // structural class untouched
  })
})
