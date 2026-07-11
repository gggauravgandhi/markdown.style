import { beforeEach, describe, expect, it, vi } from 'vitest'
import { themes } from '../themes/registry'
import { mount } from './main'

// CodeMirror needs a couple of layout APIs jsdom lacks.
beforeEach(() => {
  localStorage.clear()
  history.replaceState(null, '', '/')
  document.body.innerHTML = '<div id="app"></div>'
  Range.prototype.getClientRects ??= () => ({ length: 0, item: () => null, [Symbol.iterator]: Array.prototype[Symbol.iterator] }) as unknown as DOMRectList
  Range.prototype.getBoundingClientRect ??= () => new DOMRect()
  // jsdom has no <dialog> modal support
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false }
})

describe('editor app shell', () => {
  it('mounts toolbar controls, editor, and sandboxed preview', async () => {
    await mount(document.getElementById('app')!)
    const iframe = document.querySelector<HTMLIFrameElement>('.pane-preview iframe')!
    expect(iframe.getAttribute('sandbox')).toBe('allow-same-origin') // security invariant — never add allow-scripts
    expect(iframe.title).toBe('Document preview')
    expect(document.querySelector('.cm-editor')).toBeTruthy()
    const buttons = [...document.querySelectorAll('button')].map(b => b.textContent?.trim())
    for (const label of ['Download HTML', 'Print or save as PDF', 'Copy HTML', 'Open file', 'Reset to sample']) {
      expect(buttons, label).toContain(label)
    }
    // theme button shows the active theme, not a bare "Theme"
    expect(buttons).toContain('Theme: Paper')
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

describe('theme dialog', () => {
  it('opens labelled, marks the active theme, and closes from its header', async () => {
    await mount(document.getElementById('app')!)
    const themeBtn = [...document.querySelectorAll('button')].find(b => b.textContent?.startsWith('Theme:'))!
    themeBtn.click()
    const dialog = document.querySelector('dialog')!
    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('aria-labelledby')).toBe('theme-dialog-title')
    expect(dialog.querySelector('h2#theme-dialog-title')?.textContent).toBe('Choose a theme')
    await vi.waitFor(() => expect(dialog.querySelectorAll('.theme-card')).toHaveLength(themes.length))
    // one heading per populated category, cards grouped beneath
    expect(dialog.querySelectorAll('.theme-cat')).toHaveLength(new Set(themes.map(t => t.category)).size)
    // jsdom has no IntersectionObserver, so the eager fallback must fill every thumbnail
    await vi.waitFor(() => {
      for (const thumb of dialog.querySelectorAll<HTMLIFrameElement>('.theme-thumb')) {
        expect(thumb.srcdoc).toContain('<!doctype html>')
      }
    })
    // the active theme is visibly marked, not just remembered
    await vi.waitFor(() =>
      expect(dialog.querySelector('[aria-current="true"]')?.getAttribute('data-theme')).toBe(themes[0]!.id),
    )
    dialog.querySelector<HTMLButtonElement>('.dialog-head button')!.click()
    expect(dialog.open).toBe(false)
  }, 20_000)
})

describe('drag and drop affordance', () => {
  it('shows the drop hint only while dragging over the app', async () => {
    await mount(document.getElementById('app')!)
    const app = document.querySelector<HTMLElement>('.app')!
    expect(app.dataset.dragging).toBeUndefined()
    app.dispatchEvent(new Event('dragenter', { bubbles: true }))
    expect(app.dataset.dragging).toBe('true')
    app.dispatchEvent(new Event('dragleave', { bubbles: true }))
    expect(app.dataset.dragging).toBeUndefined()
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
    const buttons = [...document.querySelectorAll('button')].map(b => b.textContent?.trim())
    expect(buttons).toContain('Theme: Pop')
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
