import { describe, expect, it } from 'vitest'
import { render } from '../pipeline/render'
import { themes } from './registry'

const SMOKE_DOC = `# Theme Smoke

Body text with a [link](https://example.com), \`inline code\`, and **bold**.

| Col | Val |
|-----|-----|
| a   | 1   |

- [x] task done

\`\`\`ts
const n: number = 1
\`\`\`

> quoted line
`

// Renders through the REAL pipeline per theme. This is the enforcement point
// for shikiTheme validity: an invalid bundled-theme name throws inside
// highlightFences (the fallback there retries the language, not the theme).
describe('every registry theme renders end-to-end', () => {
  it.each(themes.map(t => [t.id, t] as const))('theme %s', async (_id, theme) => {
    const { html, errors } = await render(SMOKE_DOC, theme.id)
    expect(errors).toEqual([])
    expect(html).toContain('shiki')                    // code fence highlighted
    expect(html).toContain(theme.css.slice(0, 40))     // this theme's css inlined
    expect(html).not.toMatch(/url\(\s*['"]?(?!data:)/) // self-contained (no webfonts)
    expect(html).not.toMatch(/<script/i)
  })
})

describe('registered lineup', () => {
  it('slate and carbon exist', () => {
    const ids = themes.map(t => t.id)
    expect(ids).toContain('slate')
    expect(ids).toContain('carbon')
  })

  it('swiss and contrast exist', () => {
    const ids = themes.map(t => t.id)
    expect(ids).toContain('swiss')
    expect(ids).toContain('contrast')
  })

  it('editorial and scholar exist', () => {
    const ids = themes.map(t => t.id)
    expect(ids).toContain('editorial')
    expect(ids).toContain('scholar')
  })

  it('pop exists', () => {
    expect(themes.map(t => t.id)).toContain('pop')
  })
})
