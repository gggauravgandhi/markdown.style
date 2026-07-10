import { describe, expect, it } from 'vitest'
import { hasMath, markdownToHtml, stripFrontmatter } from './markdown'

describe('stripFrontmatter', () => {
  it('removes a leading YAML block', () => {
    expect(stripFrontmatter('---\ntitle: x\ndraft: true\n---\n# Hi')).toBe('# Hi')
  })
  it('leaves documents without frontmatter untouched', () => {
    expect(stripFrontmatter('# Hi\n\n---\n\nrule above')).toBe('# Hi\n\n---\n\nrule above')
  })
  it('does not treat a mid-document --- as frontmatter', () => {
    const src = 'intro\n---\nkey: value\n---\n'
    expect(stripFrontmatter(src)).toBe(src)
  })
})

describe('hasMath', () => {
  it('detects display math', () => {
    expect(hasMath('before\n$$\nE = mc^2\n$$\nafter')).toBe(true)
  })
  it('detects inline math', () => {
    expect(hasMath('the value $x^2$ grows')).toBe(true)
  })
  it('is false for plain text and lone dollar amounts', () => {
    expect(hasMath('costs $5 and\nthen $6 next line')).toBe(false)
    expect(hasMath('no math here')).toBe(false)
  })
})

describe('markdownToHtml', () => {
  it('renders GFM tables', async () => {
    const { body } = await markdownToHtml('| a | b |\n|---|---|\n| 1 | 2 |')
    expect(body).toContain('<table>')
    expect(body).toContain('<td>1</td>')
  })

  it('renders task lists with checkboxes', async () => {
    const { body } = await markdownToHtml('- [x] done\n- [ ] todo')
    expect(body).toContain('type="checkbox"')
    expect(body).toContain('checked')
  })

  it('renders strikethrough and autolinks', async () => {
    const { body } = await markdownToHtml('~~gone~~ visit https://example.com now')
    expect(body).toContain('<s>gone</s>')
    expect(body).toContain('<a href="https://example.com">')
  })

  it('renders footnotes', async () => {
    const { body } = await markdownToHtml('claim[^1]\n\n[^1]: source')
    expect(body).toContain('footnote')
  })

  it('escapes raw HTML instead of passing it through', async () => {
    const { body } = await markdownToHtml('hello <script>alert(1)</script> <b>bold?</b>')
    expect(body).not.toContain('<script>')
    expect(body).not.toContain('<b>')
    expect(body).toContain('&lt;script&gt;')
  })

  it('refuses javascript: links', async () => {
    const { body } = await markdownToHtml('[click](javascript:alert(1))')
    expect(body).not.toContain('href="javascript:')
  })

  it('replaces code fences with slot elements and collects them', async () => {
    const src = '```ts\nconst a: number = 1\n```\n\n```\nplain\n```'
    const pass = await markdownToHtml(src)
    expect(pass.body).toContain('<pre data-mds-slot="code:0"></pre>')
    expect(pass.body).toContain('<pre data-mds-slot="code:1"></pre>')
    expect(pass.codeFences).toEqual([
      { index: 0, lang: 'ts', code: 'const a: number = 1\n' },
      { index: 1, lang: '', code: 'plain\n' },
    ])
  })

  it('routes mermaid fences to their own slots', async () => {
    const pass = await markdownToHtml('```mermaid\ngraph TD\nA-->B\n```')
    expect(pass.body).toContain('<div data-mds-slot="mermaid:0"></div>')
    expect(pass.mermaidFences).toEqual([{ index: 0, lang: 'mermaid', code: 'graph TD\nA-->B\n' }])
    expect(pass.codeFences).toEqual([])
  })

  it('renders KaTeX when math present and flags usedMath', async () => {
    const pass = await markdownToHtml('inline $x^2$ math')
    expect(pass.usedMath).toBe(true)
    expect(pass.body).toContain('katex')
  })

  it('renders LaTeX control words to real glyphs (not truncated)', async () => {
    // regression: the old @vscode/markdown-it-katex fork truncated control
    // words to one letter under Vite's optimizer (\cdot rendered as "d",
    // \alpha as literal "\a"). Assert genuine KaTeX output instead of a wrapper.
    const { body } = await markdownToHtml('inline $a \\cdot b$ and $\\alpha + \\sum_{i=1}^{n} i$')
    expect(body).toContain('⋅') // ⋅  (\cdot)
    expect(body).toContain('α') // α  (\alpha)
    expect(body).not.toContain('#b91c1c') // no KaTeX parse-error color
  })

  it('renders display math ($$) as a block', async () => {
    const { body } = await markdownToHtml('before\n\n$$\n\\frac{1}{2}\n$$\n\nafter')
    expect(body).toContain('mds-math-block')
    expect(body).not.toContain('#b91c1c')
  })

  it('renders mid-paragraph $$...$$ as inline display math', async () => {
    // the removed fork supported this; keep it (LLM output sometimes inlines $$)
    const { body } = await markdownToHtml('the formula $$x^2$$ is neat')
    expect(body).toContain('katex')
    expect(body).not.toContain('$$x^2$$') // not left as literal text
    expect(body).not.toContain('#b91c1c')
  })

  it('leaves lone dollar amounts as text (no false math)', async () => {
    const { body } = await markdownToHtml('it costs $5 and then $6 today')
    expect(body).not.toContain('katex')
  })

  it('does not flag usedMath for plain documents', async () => {
    const pass = await markdownToHtml('plain paragraph')
    expect(pass.usedMath).toBe(false)
  })
})
