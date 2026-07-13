import { describe, expect, it } from 'vitest'
import { convertPages, themeCopy, useCases } from './copy'
import { resolveDevRoute } from './dev-server'

describe('resolveDevRoute', () => {
  it('maps /themes/paper to the paper theme page, not the homepage', () => {
    const paper = themeCopy.find(c => c.id === 'paper')!
    expect(resolveDevRoute('/themes/paper')).toEqual({ kind: 'theme-page', copy: paper })
  })

  it('leaves an unknown path alone', () => {
    expect(resolveDevRoute('/does-not-exist')).toBeNull()
  })

  it('leaves an unknown theme id alone', () => {
    expect(resolveDevRoute('/themes/not-a-real-theme')).toBeNull()
  })

  it('resolves the themes hub, with or without a trailing slash', () => {
    expect(resolveDevRoute('/themes')).toEqual({ kind: 'themes-hub' })
    expect(resolveDevRoute('/themes/')).toEqual({ kind: 'themes-hub' })
  })

  it('resolves a use-case page', () => {
    const uc = useCases[0]!
    expect(resolveDevRoute(`/use-cases/${uc.slug}`)).toEqual({ kind: 'use-case-page', copy: uc })
  })

  it('resolves a convert page', () => {
    const c = convertPages[0]!
    expect(resolveDevRoute(`/convert/${c.slug}`)).toEqual({ kind: 'convert-page', copy: c })
  })

  it('resolves a standalone sample by theme id', () => {
    expect(resolveDevRoute('/samples/paper.html')).toEqual({ kind: 'theme-sample', themeId: 'paper' })
  })

  it('resolves a standalone sample by use-case slug', () => {
    const uc = useCases[0]!
    expect(resolveDevRoute(`/samples/${uc.slug}.html`)).toEqual({ kind: 'use-case-sample', copy: uc })
  })

  it('leaves an unrelated route alone (never shadows / or /editor)', () => {
    expect(resolveDevRoute('/')).toBeNull()
    expect(resolveDevRoute('/editor')).toBeNull()
  })
})
