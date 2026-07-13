import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { themes } from '../themes/registry'
import { HANDOFF_KEY, putHandoff } from './handoff'
import { mount } from './main'

afterEach(() => vi.restoreAllMocks())

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
    for (const label of ['Download HTML', 'Download Markdown', 'Print or save as PDF', 'Copy HTML', 'Open…', 'Reset to sample', 'New']) {
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

describe('random theme button', () => {
  it('applies a random theme that is never the current one', async () => {
    await mount(document.getElementById('app')!)
    const buttons = () => [...document.querySelectorAll('button')]
    const randomBtn = buttons().find(b => b.textContent === 'Random')!
    expect(randomBtn, 'Random button exists').toBeTruthy()
    const themeLabel = () => buttons().find(b => b.textContent?.startsWith('Theme:'))!.textContent
    for (let i = 0; i < 12; i++) {
      const before = themeLabel()
      randomBtn.click()
      expect(themeLabel()).not.toBe(before) // never lands on the current theme
    }
  })
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

describe('export menu', () => {
  it('opens on trigger click, exports through the open menu, then closes and returns focus', async () => {
    localStorage.setItem('mds-state-v1', JSON.stringify({ markdown: '   ', themeId: 'paper', knobs: {} }))
    await mount(document.getElementById('app')!)
    const trigger = document.getElementById('export-menu-trigger') as HTMLButtonElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    trigger.click()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.closest('.menu')!.hasAttribute('data-open')).toBe(true)
    const download = [...document.querySelectorAll('.menu-item')].find(b => b.textContent === 'Download HTML')!
    download.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.waitFor(() => expect(document.querySelector('[role="status"]')!.textContent).toMatch(/empty/i))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.closest('.menu')!.hasAttribute('data-open')).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })
})

describe('file menu', () => {
  it('New empties the editor document', async () => {
    await mount(document.getElementById('app')!)
    const trigger = document.getElementById('file-menu-trigger') as HTMLButtonElement
    trigger.click()
    const newItem = [...document.querySelectorAll('.menu-item')].find(b => b.textContent === 'New')!
    newItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.waitFor(() => expect(document.querySelector('.cm-content')!.textContent).toBe(''))
  })

  it('Download Markdown downloads a .md file of the current document', async () => {
    await mount(document.getElementById('app')!)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const trigger = document.getElementById('file-menu-trigger') as HTMLButtonElement
    trigger.click()
    const item = [...document.querySelectorAll('.menu-item')].find(b => b.textContent === 'Download Markdown')!
    item.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('Download Markdown shows a notice instead of downloading when the document is empty', async () => {
    localStorage.setItem('mds-state-v1', JSON.stringify({ markdown: '   ', themeId: 'paper', knobs: {} }))
    await mount(document.getElementById('app')!)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const trigger = document.getElementById('file-menu-trigger') as HTMLButtonElement
    trigger.click()
    const item = [...document.querySelectorAll('.menu-item')].find(b => b.textContent === 'Download Markdown')!
    item.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.waitFor(() => expect(document.querySelector('[role="status"]')!.textContent).toMatch(/empty/i))
    expect(click).not.toHaveBeenCalled()
  })
})

describe('landing-page handoff', () => {
  it('opens the editor on handed-off content, taking precedence over the saved document', async () => {
    localStorage.setItem('mds-state-v1', JSON.stringify({ markdown: '# Saved', themeId: 'paper', knobs: {} }))
    putHandoff('# From landing')
    await mount(document.getElementById('app')!)
    expect(document.querySelector('.cm-content')!.textContent).toBe('# From landing')
    expect(localStorage.getItem(HANDOFF_KEY)).toBeNull()
  })

  it('leaves the saved document untouched when no handoff is waiting', async () => {
    localStorage.setItem('mds-state-v1', JSON.stringify({ markdown: '# Saved', themeId: 'paper', knobs: {} }))
    await mount(document.getElementById('app')!)
    expect(document.querySelector('.cm-content')!.textContent).toBe('# Saved')
  })
})

describe('toolbar layout', () => {
  it('theme controls live in the top toolbar; no preview bar or fullscreen button', async () => {
    await mount(document.getElementById('app')!)
    const toolbar = document.querySelector<HTMLElement>('.toolbar')!
    // theme controls returned to the main navigation bar (owner ruling 2026-07-13)
    expect(toolbar.querySelector('.btn-theme')).toBeTruthy()
    expect(toolbar.querySelector('[aria-label="Accent color"]')).toBeTruthy()
    expect(document.querySelector('.preview-bar')).toBeNull()
    expect([...document.querySelectorAll('button')].some(b => b.textContent?.includes('Full screen'))).toBe(false)
  })
})

describe('menu keyboard handling', () => {
  it('Escape closes an open menu and returns focus to its trigger', async () => {
    await mount(document.getElementById('app')!)
    const trigger = document.getElementById('file-menu-trigger') as HTMLButtonElement
    trigger.click()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })
})
