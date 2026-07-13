import { afterEach, describe, expect, it, vi } from 'vitest'
import { HANDOFF_KEY, putHandoff, takeHandoff } from './handoff'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('handoff', () => {
  it('round-trips markdown from put to take', () => {
    putHandoff('# Hello')
    expect(takeHandoff()).toBe('# Hello')
  })

  it('clears the key after a successful take', () => {
    putHandoff('# Hello')
    takeHandoff()
    expect(localStorage.getItem(HANDOFF_KEY)).toBeNull()
  })

  it('returns null when nothing is waiting', () => {
    expect(takeHandoff()).toBeNull()
  })

  it('returns null for empty or whitespace-only content', () => {
    putHandoff('   \n  ')
    expect(takeHandoff()).toBeNull()
  })

  it('survives a throwing localStorage on read and write', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(takeHandoff()).toBeNull()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => putHandoff('# x')).not.toThrow()
  })
})
