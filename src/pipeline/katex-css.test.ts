import { describe, expect, it } from 'vitest'
import { mathCss } from './katex-css'

describe('mathCss', () => {
  it('returns katex css with only data: font URLs (self-containment)', async () => {
    const css = await mathCss()
    expect(css).toContain('.katex')
    expect(css).toContain('data:font/woff2;base64,')
    expect(/url\((?!data:)/.test(css)).toBe(false)
  })
})
