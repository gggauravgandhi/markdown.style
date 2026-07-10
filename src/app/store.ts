import type { Knobs } from '../pipeline/types'

export interface AppState {
  markdown: string
  themeId: string
  knobs: Knobs
}

export const STORAGE_KEY = 'mds-state-v1'
export const PERSIST_DELAY_MS = 500

export function restore(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (typeof parsed.markdown !== 'string' || typeof parsed.themeId !== 'string') return null
    return { markdown: parsed.markdown, themeId: parsed.themeId, knobs: parsed.knobs ?? {} }
  } catch {
    return null
  }
}

export function createStore(fallback: AppState) {
  let state: AppState = restore() ?? fallback
  const listeners = new Set<(s: AppState) => void>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let warned = false
  let onWarn: (() => void) | null = null

  function persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      if (!warned) {
        warned = true
        onWarn?.()
      }
    }
  }

  return {
    get(): AppState {
      return state
    },
    set(patch: Partial<AppState>): void {
      state = { ...state, ...patch }
      for (const fn of listeners) fn(state)
      clearTimeout(timer)
      timer = setTimeout(persist, PERSIST_DELAY_MS)
    },
    subscribe(fn: (s: AppState) => void): () => void {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    onQuotaWarning(fn: () => void): void {
      onWarn = fn
    },
  }
}

export type Store = ReturnType<typeof createStore>
