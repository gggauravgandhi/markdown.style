import { describe, expect, it } from 'vitest'
import { baseCss, getTheme, themes } from './registry'

const REQUIRED_PROPS = ['--mds-bg', '--mds-fg', '--mds-font-body', '--mds-font-heading']

describe('theme registry', () => {
  it('has at least one theme with unique ids', () => {
    expect(themes.length).toBeGreaterThanOrEqual(1)
    expect(new Set(themes.map(t => t.id)).size).toBe(themes.length)
  })

  it('getTheme falls back to the first theme for unknown ids', () => {
    expect(getTheme('nope-does-not-exist').id).toBe(themes[0]!.id)
    expect(getTheme('paper').id).toBe('paper')
  })

  it.each(themes.map(t => [t.id, t] as const))('theme %s satisfies the theme contract', (_id, theme) => {
    for (const prop of REQUIRED_PROPS) {
      expect(theme.css, `missing ${prop}`).toContain(`${prop}:`)
    }
    expect(theme.css).toContain('@media print')
    expect(theme.defaultAccent).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('base css defines knob defaults and print scaffolding', () => {
    expect(baseCss).toContain('--mds-font-scale')
    expect(baseCss).toContain('--mds-page-width')
    expect(baseCss).toContain('--mds-accent')
    expect(baseCss).toContain('@page')
    expect(baseCss).toContain('break-inside: avoid')
    expect(baseCss).toContain("li:has(> input[type='checkbox'])")
  })

  it('content layout is flowing blocks — no flex/grid on content wrapper (Paged.js constraint)', () => {
    const contentRule = baseCss.slice(baseCss.indexOf('.mds-content'))
    expect(contentRule.slice(0, contentRule.indexOf('}'))).not.toMatch(/display:\s*(flex|grid)/)
  })
})
