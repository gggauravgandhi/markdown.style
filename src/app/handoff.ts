/**
 * One-shot markdown handoff from the landing page to the editor.
 *
 * The landing gateway cannot write `mds-state-v1` directly: that key is the
 * editor's autosaved document, and clobbering it would silently destroy work
 * the visitor never asked us to touch. Instead the gateway parks the pasted
 * text here, the editor consumes it once on mount, and normal autosave takes
 * over from there.
 */
export const HANDOFF_KEY = 'mds-handoff-v1'

export function putHandoff(markdown: string): void {
  try {
    localStorage.setItem(HANDOFF_KEY, markdown)
  } catch {
    // storage full or blocked: the editor simply opens on the saved document
  }
}

/** Reads and clears the handoff; returns null when there is nothing waiting. */
export function takeHandoff(): string | null {
  try {
    const text = localStorage.getItem(HANDOFF_KEY)
    localStorage.removeItem(HANDOFF_KEY)
    return text && text.trim() ? text : null
  } catch {
    return null
  }
}
