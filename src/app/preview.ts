import { render } from '../pipeline/render'
import type { Knobs, RenderError } from '../pipeline/types'
import type { AppState } from './store'

export const RENDER_DEBOUNCE_MS = 200

/** Keeps the proof canvas from going blank when the document is empty. */
const EMPTY_PREVIEW_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
html, body { height: 100%; margin: 0; }
body { display: grid; place-items: center; background: #ffffff; color: #5c6470; font: 15px/1.5 system-ui, sans-serif; text-align: center; padding: 24px; }
</style></head><body><p>Paste or type markdown to see your styled document</p></body></html>`

export function createPreview(
  iframe: HTMLIFrameElement,
  onErrors: (errors: RenderError[]) => void,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let seq = 0

  async function renderNow(state: AppState): Promise<void> {
    clearTimeout(timer) // a direct render supersedes any pending debounced one
    const ticket = ++seq
    if (!state.markdown.trim()) {
      // ticket already claimed above, so an in-flight older render still drops
      iframe.srcdoc = EMPTY_PREVIEW_HTML
      return
    }
    let result: Awaited<ReturnType<typeof render>>
    try {
      result = await render(state.markdown, state.themeId, state.knobs)
    } catch {
      if (ticket !== seq) return // a newer render already succeeded; stay silent
      // render() is contracted never to throw, but a broken lazy dep must
      // surface as a visible notice, never a silently blank preview
      onErrors([{ source: 'pipeline', message: 'Preview failed to render. Try reloading.' }])
      return
    }
    if (ticket !== seq) return // superseded by a newer render, drop
    iframe.srcdoc = result.html
    onErrors(result.errors)
  }

  function scheduleRender(state: AppState): void {
    clearTimeout(timer)
    timer = setTimeout(() => void renderNow(state), RENDER_DEBOUNCE_MS)
  }

  /**
   * Knob fast-path (spec §2): mutate css variables on the live preview
   * document instead of re-rendering. Exports call render() fresh, so this
   * can never leak stale values into an exported file.
   */
  function applyKnobs(knobs: Knobs): void {
    const root = iframe.contentDocument?.documentElement
    if (!root) return
    if (knobs.accent) root.style.setProperty('--mds-accent', knobs.accent)
    if (typeof knobs.fontScale === 'number') root.style.setProperty('--mds-font-scale', String(knobs.fontScale))
    if (typeof knobs.pageWidth === 'number') root.style.setProperty('--mds-page-width', `${knobs.pageWidth}px`)
  }

  return { renderNow, scheduleRender, applyKnobs }
}

export type Preview = ReturnType<typeof createPreview>
