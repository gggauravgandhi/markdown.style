import { render } from '../pipeline/render'
import type { Knobs, RenderError } from '../pipeline/types'
import type { AppState } from './store'

export const RENDER_DEBOUNCE_MS = 200

export function createPreview(
  iframe: HTMLIFrameElement,
  onErrors: (errors: RenderError[]) => void,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let seq = 0

  async function renderNow(state: AppState): Promise<void> {
    const ticket = ++seq
    const result = await render(state.markdown, state.themeId, state.knobs)
    if (ticket !== seq) return // superseded by a newer render — drop
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
