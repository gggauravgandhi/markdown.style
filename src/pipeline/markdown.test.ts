import { describe, expect, it } from 'vitest'
import { hasMath, stripFrontmatter } from './markdown'

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
