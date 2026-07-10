import { describe, expect, it } from 'vitest'
import { isMarkdownFile, loadMarkdownFile, MAX_FILE_BYTES } from './file-input'

describe('isMarkdownFile', () => {
  it('accepts md, markdown, txt (case-insensitive)', () => {
    expect(isMarkdownFile('notes.md')).toBe(true)
    expect(isMarkdownFile('REPORT.MARKDOWN')).toBe(true)
    expect(isMarkdownFile('a.txt')).toBe(true)
  })
  it('rejects other extensions', () => {
    expect(isMarkdownFile('image.png')).toBe(false)
    expect(isMarkdownFile('doc.pdf')).toBe(false)
    expect(isMarkdownFile('md')).toBe(false)
  })
})

describe('loadMarkdownFile', () => {
  it('reads text without warning for small files', async () => {
    const file = new File(['# hello'], 'a.md', { type: 'text/markdown' })
    const { text, warning } = await loadMarkdownFile(file)
    expect(text).toBe('# hello')
    expect(warning).toBeUndefined()
  })

  it('warns (but still loads) above the size limit', async () => {
    const big = new File(['x'.repeat(MAX_FILE_BYTES + 1)], 'big.md')
    const { text, warning } = await loadMarkdownFile(big)
    expect(text.length).toBe(MAX_FILE_BYTES + 1)
    expect(warning).toMatch(/large file/i)
  })
})
