import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore, PERSIST_DELAY_MS, restore, STORAGE_KEY } from './store'

const FALLBACK = { markdown: '# hi', themeId: 'paper', knobs: {} }

describe('store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('starts from fallback when storage is empty', () => {
    expect(createStore(FALLBACK).get()).toEqual(FALLBACK)
  })

  it('set patches state and notifies subscribers', () => {
    const store = createStore(FALLBACK)
    const seen: string[] = []
    store.subscribe(s => seen.push(s.markdown))
    store.set({ markdown: 'changed' })
    expect(store.get().markdown).toBe('changed')
    expect(store.get().themeId).toBe('paper')
    expect(seen).toEqual(['changed'])
  })

  it('knobs patch replaces the knobs object entirely', () => {
    const store = createStore(FALLBACK)
    store.set({ knobs: { accent: '#112233', fontScale: 1.2 } })
    store.set({ knobs: { accent: '#112233' } })
    expect(store.get().knobs).toEqual({ accent: '#112233' })
  })

  it('persists debounced, not on every set', () => {
    const store = createStore(FALLBACK)
    store.set({ markdown: 'a' })
    store.set({ markdown: 'b' })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    vi.advanceTimersByTime(PERSIST_DELAY_MS)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ markdown: 'b' })
  })

  it('restore round-trips persisted state and rejects malformed payloads', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ markdown: 'saved', themeId: 'paper', knobs: { pageWidth: 900 } }))
    expect(restore()).toEqual({ markdown: 'saved', themeId: 'paper', knobs: { pageWidth: 900 } })
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(restore()).toBeNull()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }))
    expect(restore()).toBeNull()
  })

  it('createStore prefers restored state over fallback', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ markdown: 'saved', themeId: 'paper', knobs: {} }))
    expect(createStore(FALLBACK).get().markdown).toBe('saved')
  })

  it('warns exactly once when persistence throws, and keeps working', () => {
    const store = createStore(FALLBACK)
    const warn = vi.fn()
    store.onQuotaWarning(warn)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    store.set({ markdown: 'x' })
    vi.advanceTimersByTime(PERSIST_DELAY_MS)
    store.set({ markdown: 'y' })
    vi.advanceTimersByTime(PERSIST_DELAY_MS)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(store.get().markdown).toBe('y')
    spy.mockRestore()
  })
})
