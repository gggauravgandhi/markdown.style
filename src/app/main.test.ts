import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from './main'

// CodeMirror needs a couple of layout APIs jsdom lacks.
beforeEach(() => {
  localStorage.clear()
  history.replaceState(null, '', '/')
  document.body.innerHTML = '<div id="app"></div>'
  Range.prototype.getClientRects ??= () => ({ length: 0, item: () => null, [Symbol.iterator]: Array.prototype[Symbol.iterator] }) as unknown as DOMRectList
  Range.prototype.getBoundingClientRect ??= () => new DOMRect()
})

describe('editor app shell', () => {
  it('mounts toolbar controls, editor, and sandboxed preview', async () => {
    await mount(document.getElementById('app')!)
    const iframe = document.querySelector<HTMLIFrameElement>('.pane-preview iframe')!
    expect(iframe.getAttribute('sandbox')).toBe('allow-same-origin') // security invariant — never add allow-scripts
    expect(iframe.title).toBe('Document preview')
    expect(document.querySelector('.cm-editor')).toBeTruthy()
    const buttons = [...document.querySelectorAll('button')].map(b => b.textContent?.trim())
    for (const label of ['Theme', 'Download HTML', 'Print or save as PDF', 'Copy HTML', 'Open file', 'Reset to sample']) {
      expect(buttons, label).toContain(label)
    }
    for (const aria of ['Accent color', 'Font size', 'Page width']) {
      expect(document.querySelector(`[aria-label="${aria}"]`), aria).toBeTruthy()
    }
    expect(document.querySelector('[role="status"]')).toBeTruthy()
  })

  it('export with an empty document shows a notice instead of downloading', async () => {
    localStorage.setItem('mds-state-v1', JSON.stringify({ markdown: '   ', themeId: 'paper', knobs: {} }))
    await mount(document.getElementById('app')!)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const download = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Download'))!
    download.click()
    await vi.waitFor(() => expect(document.querySelector('[role="status"]')!.textContent).toMatch(/empty/i))
    expect(click).not.toHaveBeenCalled()
  })
})

describe('?theme= deep link', () => {
  it('applies a valid theme param over restored state and strips it from the URL', async () => {
    localStorage.setItem('mds-state-v1', JSON.stringify({ markdown: '# Keep me', themeId: 'paper', knobs: { accent: '#123456' } }))
    history.replaceState(null, '', '/editor?theme=pop')
    await mount(document.getElementById('app')!)
    // observable via the accent knob: initKnobControls falls back to the active theme's default
    const accent = document.querySelector<HTMLInputElement>('[aria-label="Accent color"]')!
    expect(accent.value).toBe('#d81b7a') // pop's defaultAccent; knobs were reset
    expect(location.search).toBe('') // param stripped
  })

  it('ignores an unknown theme param', async () => {
    localStorage.setItem('mds-state-v1', JSON.stringify({ markdown: '# Keep me', themeId: 'slate', knobs: {} }))
    history.replaceState(null, '', '/editor?theme=neon-vaporwave')
    await mount(document.getElementById('app')!)
    const accent = document.querySelector<HTMLInputElement>('[aria-label="Accent color"]')!
    expect(accent.value).toBe('#0969da') // slate's defaultAccent — untouched
  })
})
