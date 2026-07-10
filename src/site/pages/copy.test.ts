// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hasMath } from '../../pipeline/markdown'
import { themes } from '../../themes/registry'
import { convertPages, themeCopy, useCases } from './copy'

const samplesDir = join(import.meta.dirname, '..', '..', '..', 'content', 'samples')
const SAMPLE_FILES = ['showcase.md', 'chatgpt-report.md', 'meeting-notes.md', 'readme.md']

describe('sample documents', () => {
  it.each(SAMPLE_FILES)('%s avoids mermaid and math (build/CWV constraints) and is substantial', file => {
    const md = readFileSync(join(samplesDir, file), 'utf8')
    expect(md).not.toContain('```mermaid') // build must not need a browser DOM
    expect(hasMath(md)).toBe(false) // math pulls ~360KB of KaTeX css into every embed
    expect(md.length).toBeGreaterThan(400)
    expect(md).toMatch(/^# /m) // has a title for extractTitle()
  })
})

describe('page copy', () => {
  it('covers every registry theme, in registry order', () => {
    expect(themeCopy.map(c => c.id)).toEqual(themes.map(t => t.id))
  })

  it('use-cases reference real themes and real sample files', () => {
    for (const uc of useCases) {
      expect(themes.some(t => t.id === uc.themeId), uc.slug).toBe(true)
      expect(() => readFileSync(join(samplesDir, `${uc.slug}.md`), 'utf8'), uc.slug).not.toThrow()
    }
  })

  it('theme pairWith ids are real and never self-referential', () => {
    for (const c of themeCopy) {
      for (const id of c.pairWith) {
        expect(themes.some(t => t.id === id), `${c.id} -> ${id}`).toBe(true)
        expect(id).not.toBe(c.id)
      }
    }
  })

  it('titles and descriptions are unique and answer-first sized (anti-doorway)', () => {
    const all = [...themeCopy, ...useCases, ...convertPages]
    const titles = all.map(c => c.title)
    const descriptions = all.map(c => c.description)
    expect(new Set(titles).size).toBe(titles.length)
    expect(new Set(descriptions).size).toBe(descriptions.length)
    for (const c of all) {
      expect(c.description.length, c.title).toBeGreaterThan(70)
      expect(c.description.length, c.title).toBeLessThan(170)
      expect(c.intro.length, c.title).toBeGreaterThan(100)
    }
  })
})
