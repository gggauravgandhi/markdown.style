import { describe, expect, it } from 'vitest'
import { baseCss, CATEGORY_LABELS, getTheme, themes } from './registry'

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

  it('ships the expanded lineup in category batches, paper first', () => {
    expect(themes.map(t => t.id)).toEqual([
      'paper', 'slate', 'carbon', 'swiss', 'contrast', 'editorial', 'scholar', 'pop',
      'boardroom', 'ledger', 'briefing', 'memo', 'quarterly',
      'terminal', 'blueprint', 'manual',
      'thesis', 'preprint', 'notebook', 'lecture',
      'gazette', 'novella', 'columnist',
      'mist', 'mono', 'airy',
      'neon', 'poster', 'riso', 'retro',
    ])
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

describe('theme polish (plan 4b pre-pass)', () => {
  it('contrast and swiss define their own .mds-error styling', () => {
    for (const id of ['contrast', 'swiss']) {
      expect(getTheme(id).css, id).toContain('.mds-error')
    }
  })

  it('carbon heading prefixes carry empty alt text so screen readers skip them', () => {
    // CSS alt-text syntax: content: '# ' / '' — unsupported browsers drop the
    // declaration entirely (decorative # disappears; heading text unaffected).
    const carbon = getTheme('carbon').css
    expect(carbon).toContain("content: '# ' / ''")
    expect(carbon).toContain("content: '## ' / ''")
    expect(carbon).toContain("content: '### ' / ''")
  })

  it('base print block no longer carries the dead link rule', () => {
    // every theme defines an unconditional `a { color }` later in source order,
    // so the base @media print `a { color: inherit }` could never win — dead code.
    const printBlock = baseCss.slice(baseCss.indexOf('@media print'))
    expect(printBlock).not.toMatch(/^\s*a\s*\{/m)
  })
})

describe('categories', () => {
  it('every theme has a registered category', () => {
    for (const t of themes) expect(Object.keys(CATEGORY_LABELS), t.id).toContain(t.category)
  })

  it('exactly six featured themes, one per category', () => {
    const featured = themes.filter(t => t.featured)
    expect(featured.map(t => t.id).sort()).toEqual(['boardroom', 'paper', 'pop', 'scholar', 'slate', 'swiss'])
    expect(new Set(featured.map(t => t.category)).size).toBe(6)
  })

  it('category population matches the shipped roadmap', () => {
    const count = (c: string) => themes.filter(t => t.category === c).length
    for (const category of Object.keys(CATEGORY_LABELS)) {
      expect(count(category), category).toBe(5)
    }
  })

  it('descriptions carry no em dashes (UI copy rule)', () => {
    for (const t of themes) expect(t.description, t.id).not.toContain('—')
  })
})
