import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SPECIMENS } from './specimens'

describe('SPECIMENS', () => {
  it('references only local assets that actually exist', () => {
    // the image specimen once pointed at /og.png, which is not in public/: that
    // shipped a broken image onto all 30 theme pages while every test stayed green.
    const publicDir = join(import.meta.dirname, '..', '..', '..', 'public')
    for (const s of SPECIMENS) {
      for (const [, url] of s.markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
        expect(url, `${s.id}: remote image breaks the zero-external-requests rule`).toMatch(/^\//)
        expect(existsSync(join(publicDir, url!)), `${s.id}: public${url} does not exist`).toBe(true)
      }
    }
  })

  it('has unique ids', () => {
    const ids = SPECIMENS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has non-empty markdown for every specimen', () => {
    for (const s of SPECIMENS) {
      expect(s.markdown.trim().length, s.id).toBeGreaterThan(0)
    }
  })

  it('has exactly one specimen containing a mermaid fence', () => {
    const withMermaid = SPECIMENS.filter(s => s.markdown.includes('```mermaid')).map(s => s.id)
    expect(withMermaid).toEqual(['mermaid'])
  })

  it('math specimen contains both inline and block math', () => {
    const math = SPECIMENS.find(s => s.id === 'math')!.markdown
    expect(math).toMatch(/\$\$[\s\S]+?\$\$/)
    expect(math.replace(/\$\$[\s\S]+?\$\$/g, '')).toMatch(/\$[^$\n]+\$/)
  })
})
