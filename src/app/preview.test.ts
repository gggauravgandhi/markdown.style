import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPreview, RENDER_DEBOUNCE_MS } from './preview'

function makeIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)
  return iframe
}

const STATE = { markdown: '# Title\n\nbody text', themeId: 'paper', knobs: {} }

describe('preview', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('renderNow sets srcdoc to the rendered document and reports errors', async () => {
    const errors: unknown[] = []
    const preview = createPreview(makeIframe(), e => errors.push(...e))
    const iframe = document.querySelector('iframe')!
    await preview.renderNow(STATE)
    expect(iframe.srcdoc).toContain('<!doctype html>')
    expect(iframe.srcdoc).toContain('Title')
    expect(errors).toEqual([]) // no mermaid in STATE
  })

  it('scheduleRender debounces: only the last state within the window renders', async () => {
    vi.useFakeTimers()
    const preview = createPreview(makeIframe(), () => {})
    const iframe = document.querySelector('iframe')!
    preview.scheduleRender({ ...STATE, markdown: '# First' })
    preview.scheduleRender({ ...STATE, markdown: '# Second' })
    await vi.advanceTimersByTimeAsync(RENDER_DEBOUNCE_MS + 10)
    vi.useRealTimers()
    await vi.waitFor(() => expect(iframe.srcdoc).toContain('Second'))
    expect(iframe.srcdoc).not.toContain('First')
  })

  it('stale renders never overwrite newer ones', async () => {
    const preview = createPreview(makeIframe(), () => {})
    const iframe = document.querySelector('iframe')!
    // fire two renders without awaiting the first; the second must win.
    // markers MUST be strings that cannot appear in theme CSS — 'Old' collides
    // with the paper theme's 'Iowan Old Style' font stack (verified failure).
    const p1 = preview.renderNow({ ...STATE, markdown: '# ZZZStale' })
    const p2 = preview.renderNow({ ...STATE, markdown: '# ZZZFresh' })
    await Promise.all([p1, p2])
    expect(iframe.srcdoc).toContain('ZZZFresh')
    expect(iframe.srcdoc).not.toContain('ZZZStale')
  })

  it('a direct renderNow cancels any pending debounced render', async () => {
    vi.useFakeTimers()
    const preview = createPreview(makeIframe(), () => {})
    const iframe = document.querySelector('iframe')!
    preview.scheduleRender({ ...STATE, markdown: '# ZZZQueued' })
    await preview.renderNow({ ...STATE, markdown: '# ZZZDirect' })
    await vi.advanceTimersByTimeAsync(RENDER_DEBOUNCE_MS + 50)
    vi.useRealTimers()
    expect(iframe.srcdoc).toContain('ZZZDirect')
    expect(iframe.srcdoc).not.toContain('ZZZQueued')
  })

  it('applyKnobs mutates iframe css variables without touching srcdoc', () => {
    const preview = createPreview(makeIframe(), () => {})
    const iframe = document.querySelector('iframe')!
    // jsdom gives contentDocument for a blank iframe
    preview.applyKnobs({ accent: '#112233', fontScale: 1.2, pageWidth: 900 })
    const root = iframe.contentDocument!.documentElement
    expect(root.style.getPropertyValue('--mds-accent')).toBe('#112233')
    expect(root.style.getPropertyValue('--mds-font-scale')).toBe('1.2')
    expect(root.style.getPropertyValue('--mds-page-width')).toBe('900px')
    expect(iframe.srcdoc).toBe('')
  })
})
