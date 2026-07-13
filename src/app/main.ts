import { markdown } from '@codemirror/lang-markdown'
import { basicSetup, EditorView } from 'codemirror'
import { render } from '../pipeline/render'
import type { RenderError } from '../pipeline/types'
import { CATEGORY_LABELS, themes, type Category } from '../themes/registry'
import './app.css'
import { editorTheme } from './editor-theme'
import { copyHtml, downloadHtml, printDocument } from './exports'
import { isMarkdownFile, loadMarkdownFile } from './file-input'
import { createPreview } from './preview'
import { SAMPLE_MARKDOWN, THUMB_MARKDOWN } from './sample'
import { createStore, type AppState } from './store'

const NOTICE_MS = 4000

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  if (text) node.textContent = text
  return node
}

function knob(label: string, input: HTMLInputElement): HTMLLabelElement {
  const node = el('label', { class: 'knob-group' })
  node.append(el('span', { class: 'knob-label' }, label), input)
  return node
}

interface MenuItem {
  label: string
  action: () => void
}

export async function mount(root: HTMLElement): Promise<void> {
  const initial: AppState = { markdown: SAMPLE_MARKDOWN, themeId: themes[0]!.id, knobs: {} }
  const store = createStore(initial)

  // --- menus ------------------------------------------------------------------
  // dismiss fns for every menu built by this mount; enforces "only one open at a
  // time" and lets the Escape handler below find whichever menu is open
  const menuHandles: Array<{ wrapper: HTMLDivElement; dismiss: (returnFocus: boolean) => void }> = []

  /** Vanilla menu: trigger + menu-list, both always in the DOM (display:none when closed).
      Disclosure pattern (not role="menu"/"menuitem" — we don't implement arrow-key nav). */
  function buildMenu(
    triggerId: string,
    triggerLabel: string,
    triggerClass: string,
    items: MenuItem[],
    wrapperClass = '',
  ): HTMLDivElement {
    const listId = `${triggerId}-list`
    const trigger = el('button', {
      class: `btn ${triggerClass}`.trim(),
      id: triggerId,
      'aria-expanded': 'false',
      'aria-controls': listId,
    }, triggerLabel)
    const list = el('div', { id: listId, 'aria-labelledby': triggerId, class: 'menu-list' })
    const itemEls = items.map(({ label, action }) => {
      const item = el('button', { class: 'menu-item' }, label)
      item.addEventListener('click', () => {
        action()
        dismiss(true)
      })
      return item
    })
    list.append(...itemEls)
    const wrapper = el('div', { class: `menu ${wrapperClass}`.trim() })
    wrapper.append(trigger, list)

    function dismiss(returnFocus: boolean): void {
      if (!wrapper.dataset.open) return
      delete wrapper.dataset.open
      trigger.setAttribute('aria-expanded', 'false')
      if (returnFocus) trigger.focus()
    }
    function open(): void {
      for (const other of menuHandles) if (other.wrapper !== wrapper) other.dismiss(false)
      wrapper.dataset.open = 'true'
      trigger.setAttribute('aria-expanded', 'true')
      itemEls[0]?.focus()
    }
    trigger.addEventListener('click', () => {
      if (wrapper.dataset.open) dismiss(true)
      else open()
    })
    // disclosure pattern: Tab-ing (or otherwise moving focus) out of the wrapper
    // entirely closes the menu, since we don't trap focus inside it
    wrapper.addEventListener('focusout', e => {
      if (!wrapper.contains(e.relatedTarget as Node)) dismiss(false)
    })
    menuHandles.push({ wrapper, dismiss })
    return wrapper
  }
  // one click listener for every menu built by this mount (not one per buildMenu
  // call); dismiss() no-ops on menus that aren't open, and mount() runs once in
  // production so this never accumulates duplicate listeners. Focus is left alone
  // (fix C): an outside click may be the user clicking into the editor to type.
  document.addEventListener('click', e => {
    for (const { wrapper, dismiss } of menuHandles) {
      if (!wrapper.contains(e.target as Node)) dismiss(false)
    }
  })

  // gallery deep links: /editor?theme=<id> applies the theme (knobs reset,
  // same as picking it in the dialog) and then leaves the URL clean
  const requestedTheme = new URLSearchParams(location.search).get('theme')
  if (requestedTheme && themes.some(t => t.id === requestedTheme)) {
    if (requestedTheme !== store.get().themeId) store.set({ themeId: requestedTheme, knobs: {} })
    history.replaceState(null, '', location.pathname)
  }

  // --- layout ---------------------------------------------------------------
  root.innerHTML = ''
  const app = el('div', { class: 'app', 'data-view': 'split' })
  const toolbar = el('header', { class: 'toolbar' })
  const brand = el('a', { class: 'brand', href: '/' }, 'markdown.style')
  const themeBtn = el('button', { class: 'btn btn-theme', 'aria-haspopup': 'dialog' }, 'Theme')
  const randomBtn = el('button', { class: 'btn', title: 'Try a random theme' }, 'Random')
  const accentInput = el('input', { type: 'color', 'aria-label': 'Accent color', class: 'knob-accent' })
  const fontRange = el('input', { type: 'range', min: '0.7', max: '1.5', step: '0.05', 'aria-label': 'Font size', class: 'knob' })
  const widthRange = el('input', { type: 'range', min: '480', max: '1400', step: '20', 'aria-label': 'Page width', class: 'knob' })
  const spacer = el('span', { class: 'spacer' })
  const viewToggle = el('button', { class: 'btn view-toggle', 'aria-label': 'Toggle editor and preview' }, 'Preview')

  const notices = el('div', { class: 'notices', role: 'status', 'aria-live': 'polite' })
  const fileInput = el('input', { type: 'file', accept: '.md,.markdown,.txt', class: 'visually-hidden', 'aria-label': 'Open markdown file' })
  const dialog = el('dialog', { class: 'theme-dialog', 'aria-labelledby': 'theme-dialog-title' })
  const dialogHead = el('div', { class: 'dialog-head' })
  const dialogClose = el('button', { class: 'btn btn-ghost' }, 'Close')
  dialogHead.append(el('h2', { id: 'theme-dialog-title' }, 'Choose a theme'), dialogClose)
  const themeCards = el('div', { class: 'theme-cards' })
  dialog.append(dialogHead, themeCards)
  const dropHint = el('div', { class: 'drop-hint', 'aria-hidden': 'true' })
  dropHint.append(el('span', {}, 'Drop your markdown file'))

  const fileMenu = buildMenu('file-menu-trigger', 'File', '', [
    { label: 'New', action: () => setEditorText('') },
    { label: 'Open…', action: () => fileInput.click() },
    { label: 'Reset to sample', action: () => resetToSample() },
  ])
  const exportMenu = buildMenu(
    'export-menu-trigger',
    'Export',
    'btn-primary',
    [
      { label: 'Download HTML', action: () => void withDocument((html, title) => downloadHtml(html, title)) },
      {
        label: 'Copy HTML',
        action: () =>
          void withDocument(async html => {
            notice((await copyHtml(html)) ? 'HTML copied to clipboard' : 'Copy failed. Clipboard is unavailable.')
          }),
      },
      {
        label: 'Print or save as PDF',
        action: () =>
          void withDocument(html => {
            if (!printDocument(html)) notice('Popup blocked. Allow popups for this site to print.')
          }),
      },
    ],
    'menu-export',
  )
  toolbar.append(
    brand,
    fileMenu,
    themeBtn,
    randomBtn,
    knob('Accent', accentInput),
    knob('Text', fontRange),
    knob('Width', widthRange),
    spacer,
    viewToggle,
    exportMenu,
  )

  const panes = el('main', { class: 'panes' })
  const editorPane = el('section', { class: 'pane pane-editor', 'aria-label': 'Markdown editor' })
  const previewPane = el('section', { class: 'pane pane-preview', 'aria-label': 'Preview' })
  // security invariant (spec §2): script-free content + no allow-scripts;
  // allow-same-origin is required for the knob fast-path into contentDocument
  const iframe = el('iframe', { sandbox: 'allow-same-origin', title: 'Document preview' })
  previewPane.append(iframe)
  panes.append(editorPane, previewPane)

  app.append(toolbar, panes, notices, dropHint, dialog, fileInput)
  root.append(app)

  function notice(message: string): void {
    const item = el('p', { class: 'notice' }, message)
    notices.append(item)
    setTimeout(() => item.remove(), NOTICE_MS)
  }

  // --- preview + editor -------------------------------------------------------
  const preview = createPreview(iframe as HTMLIFrameElement, (errors: RenderError[]) => {
    if (errors.length === 0) return
    // a whole-pipeline failure carries its own message; diagram failures are counted
    const pipelineError = errors.find(e => e.source === 'pipeline')
    if (pipelineError) {
      notice(pipelineError.message)
      return
    }
    notice(`${errors.length} diagram${errors.length > 1 ? 's' : ''} failed to render`)
  })

  const view = new EditorView({
    doc: store.get().markdown,
    parent: editorPane,
    extensions: [
      basicSetup,
      markdown(),
      EditorView.lineWrapping,
      ...editorTheme,
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          store.set({ markdown: update.state.doc.toString() })
          preview.scheduleRender(store.get())
        }
      }),
    ],
  })

  function setEditorText(text: string): void {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } })
  }

  store.onQuotaWarning(() => notice('Autosave unavailable (storage full). Your work stays in this tab only.'))

  // --- knobs --------------------------------------------------------------------
  function currentKnobs(): AppState['knobs'] {
    return {
      accent: accentInput.value || undefined,
      fontScale: Number(fontRange.value),
      pageWidth: Number(widthRange.value),
    }
  }
  function syncKnobTitles(): void {
    fontRange.title = `Font size ×${Number(fontRange.value).toFixed(2)}`
    widthRange.title = `Page width ${widthRange.value}px`
  }
  function initKnobControls(): void {
    const { knobs, themeId } = store.get()
    const theme = themes.find(t => t.id === themeId)
    themeBtn.textContent = `Theme: ${theme?.name ?? themeId}`
    accentInput.value = knobs.accent ?? theme?.defaultAccent ?? '#0f62fe'
    fontRange.value = String(knobs.fontScale ?? 1)
    widthRange.value = String(knobs.pageWidth ?? 760)
    syncKnobTitles()
  }
  for (const input of [accentInput, fontRange, widthRange]) {
    input.addEventListener('input', () => {
      const knobs = currentKnobs()
      store.set({ knobs })
      preview.applyKnobs(knobs)
      syncKnobTitles()
    })
  }

  /** Switch theme with the same semantics as picking it in the dialog (knobs reset). */
  function applyTheme(themeId: string): void {
    store.set({ themeId, knobs: {} })
    initKnobControls()
    void preview.renderNow(store.get())
  }
  randomBtn.addEventListener('click', () => {
    const pool = themes.filter(t => t.id !== store.get().themeId)
    applyTheme(pool[Math.floor(Math.random() * pool.length)]!.id)
  })

  // --- theme picker ----------------------------------------------------------------
  let thumbsBuilt = false
  async function fillThumb(card: Element): Promise<void> {
    const thumb = card.querySelector<HTMLIFrameElement>('.theme-thumb')
    const id = card.getAttribute('data-theme')
    if (!thumb || !id || thumb.srcdoc) return
    const { html } = await render(THUMB_MARKDOWN, id)
    thumb.srcdoc = html
  }
  async function buildThumbs(): Promise<void> {
    if (thumbsBuilt) return
    thumbsBuilt = true
    const cards: HTMLButtonElement[] = []
    for (const category of Object.keys(CATEGORY_LABELS) as Category[]) {
      const group = themes.filter(t => t.category === category)
      if (group.length === 0) continue
      themeCards.append(el('h3', { class: 'theme-cat' }, CATEGORY_LABELS[category]))
      for (const theme of group) {
        const card = el('button', { class: 'theme-card', 'data-theme': theme.id })
        const thumb = el('iframe', { sandbox: '', class: 'theme-thumb', title: `${theme.name} preview`, loading: 'lazy' })
        card.append(thumb, el('span', { class: 'theme-name' }, theme.name), el('span', { class: 'theme-desc' }, theme.description))
        themeCards.append(card)
        cards.push(card)
        card.addEventListener('click', () => {
          applyTheme(theme.id)
          dialog.close()
        })
      }
    }
    // jsdom and older engines: no IntersectionObserver, render everything now
    if (typeof IntersectionObserver === 'undefined') {
      await Promise.all(cards.map(fillThumb))
      return
    }
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          io.unobserve(entry.target)
          void fillThumb(entry.target)
        }
      },
      { root: dialog, rootMargin: '200px' },
    )
    for (const card of cards) io.observe(card)
  }
  function markActiveCard(): void {
    const { themeId } = store.get()
    for (const card of themeCards.querySelectorAll('.theme-card')) {
      if (card.getAttribute('data-theme') === themeId) card.setAttribute('aria-current', 'true')
      else card.removeAttribute('aria-current')
    }
  }
  themeBtn.addEventListener('click', () => {
    void buildThumbs().then(markActiveCard)
    dialog.showModal()
  })
  dialogClose.addEventListener('click', () => dialog.close())

  // --- exports ------------------------------------------------------------------------
  async function withDocument(action: (html: string, title: string) => void | Promise<void>): Promise<void> {
    const state = store.get()
    if (!state.markdown.trim()) {
      notice('Nothing to export. The document is empty.')
      return
    }
    const { html, title } = await render(state.markdown, state.themeId, state.knobs)
    await action(html, title)
  }

  // --- file open / drag-drop -------------------------------------------------------------
  async function acceptFile(file: File): Promise<void> {
    if (!isMarkdownFile(file.name)) {
      notice('Unsupported file. Use .md, .markdown, or .txt.')
      return
    }
    try {
      const { text, warning } = await loadMarkdownFile(file)
      if (warning) notice(warning)
      setEditorText(text)
    } catch {
      notice('Could not read the file. Try again.') // spec §7: read failures toast
    }
  }
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (file) void acceptFile(file)
  })
  // dragleave fires on every child boundary, so a bare toggle would flicker;
  // count enters/leaves and only hide when the drag truly exits the app
  let dragDepth = 0
  const endDrag = (): void => {
    dragDepth = 0
    delete app.dataset.dragging
  }
  app.addEventListener('dragenter', e => {
    e.preventDefault()
    dragDepth++
    app.dataset.dragging = 'true'
  })
  app.addEventListener('dragleave', () => {
    if (--dragDepth <= 0) endDrag()
  })
  for (const evt of ['dragover', 'drop'] as const) {
    app.addEventListener(evt, e => {
      e.preventDefault()
      if (evt === 'drop') {
        endDrag()
        const file = (e as DragEvent).dataTransfer?.files?.[0]
        if (file) void acceptFile(file)
      }
    })
  }

  // --- misc -----------------------------------------------------------------------------
  function resetToSample(): void {
    store.set({ markdown: SAMPLE_MARKDOWN, themeId: themes[0]!.id, knobs: {} })
    setEditorText(SAMPLE_MARKDOWN)
    initKnobControls()
    void preview.renderNow(store.get())
  }
  viewToggle.addEventListener('click', () => {
    const next = app.dataset.view === 'preview' ? 'editor' : 'preview'
    app.dataset.view = next
    viewToggle.textContent = next === 'preview' ? 'Editor' : 'Preview'
  })

  // Escape priority: the native <dialog> owns Escape while open (return immediately
  // so we don't also close a menu on the same keystroke); otherwise close an open menu
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return
    if (dialog.open) return
    menuHandles.find(m => m.wrapper.dataset.open)?.dismiss(true)
  })

  initKnobControls()
  await preview.renderNow(store.get())
}

const appRoot = document.getElementById('app')
if (appRoot) void mount(appRoot)
