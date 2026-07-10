import { markdown } from '@codemirror/lang-markdown'
import { basicSetup, EditorView } from 'codemirror'
import { render } from '../pipeline/render'
import type { RenderError } from '../pipeline/types'
import { themes } from '../themes/registry'
import './app.css'
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

export async function mount(root: HTMLElement): Promise<void> {
  const initial: AppState = { markdown: SAMPLE_MARKDOWN, themeId: themes[0]!.id, knobs: {} }
  const store = createStore(initial)

  // --- layout ---------------------------------------------------------------
  root.innerHTML = ''
  const app = el('div', { class: 'app', 'data-view': 'split' })
  const toolbar = el('header', { class: 'toolbar' })
  const brand = el('span', { class: 'brand' }, 'markdown.style')
  const themeBtn = el('button', { class: 'btn', 'aria-haspopup': 'dialog' }, 'Theme')
  const accentInput = el('input', { type: 'color', 'aria-label': 'Accent color', class: 'knob-accent' })
  const fontRange = el('input', { type: 'range', min: '0.7', max: '1.5', step: '0.05', 'aria-label': 'Font size', class: 'knob' })
  const widthRange = el('input', { type: 'range', min: '480', max: '1400', step: '20', 'aria-label': 'Page width', class: 'knob' })
  const spacer = el('span', { class: 'spacer' })
  const openBtn = el('button', { class: 'btn' }, 'Open file')
  const resetBtn = el('button', { class: 'btn' }, 'Reset to sample')
  const copyBtn = el('button', { class: 'btn' }, 'Copy HTML')
  const downloadBtn = el('button', { class: 'btn btn-primary' }, 'Download HTML')
  const printBtn = el('button', { class: 'btn btn-primary' }, 'Print or save as PDF')
  const viewToggle = el('button', { class: 'btn view-toggle', 'aria-label': 'Toggle editor and preview' }, 'Preview')
  toolbar.append(brand, themeBtn, accentInput, fontRange, widthRange, spacer, openBtn, resetBtn, copyBtn, downloadBtn, printBtn, viewToggle)

  const panes = el('main', { class: 'panes' })
  const editorPane = el('section', { class: 'pane pane-editor', 'aria-label': 'Markdown editor' })
  const previewPane = el('section', { class: 'pane pane-preview', 'aria-label': 'Preview' })
  // security invariant (spec §2): script-free content + no allow-scripts;
  // allow-same-origin is required for the knob fast-path into contentDocument
  const iframe = el('iframe', { sandbox: 'allow-same-origin', title: 'Document preview' })
  previewPane.append(iframe)
  panes.append(editorPane, previewPane)

  const notices = el('div', { class: 'notices', role: 'status', 'aria-live': 'polite' })
  const fileInput = el('input', { type: 'file', accept: '.md,.markdown,.txt', class: 'visually-hidden', 'aria-label': 'Open markdown file' })
  const dialog = el('dialog', { class: 'theme-dialog', 'aria-label': 'Choose a theme' })
  app.append(toolbar, panes, notices, dialog, fileInput)
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

  store.onQuotaWarning(() => notice('Autosave unavailable (storage full) — your work stays in this tab only'))

  // --- knobs --------------------------------------------------------------------
  function currentKnobs(): AppState['knobs'] {
    return {
      accent: accentInput.value || undefined,
      fontScale: Number(fontRange.value),
      pageWidth: Number(widthRange.value),
    }
  }
  function initKnobControls(): void {
    const { knobs, themeId } = store.get()
    accentInput.value = knobs.accent ?? themes.find(t => t.id === themeId)?.defaultAccent ?? '#0f62fe'
    fontRange.value = String(knobs.fontScale ?? 1)
    widthRange.value = String(knobs.pageWidth ?? 760)
  }
  for (const input of [accentInput, fontRange, widthRange]) {
    input.addEventListener('input', () => {
      const knobs = currentKnobs()
      store.set({ knobs })
      preview.applyKnobs(knobs)
    })
  }

  // --- theme picker ----------------------------------------------------------------
  let thumbsBuilt = false
  async function buildThumbs(): Promise<void> {
    if (thumbsBuilt) return
    thumbsBuilt = true
    for (const theme of themes) {
      const card = el('button', { class: 'theme-card', 'data-theme': theme.id })
      const thumb = el('iframe', { sandbox: '', class: 'theme-thumb', title: `${theme.name} preview`, loading: 'lazy' })
      const name = el('span', { class: 'theme-name' }, theme.name)
      const desc = el('span', { class: 'theme-desc' }, theme.description)
      card.append(thumb, name, desc)
      dialog.append(card)
      const { html } = await render(THUMB_MARKDOWN, theme.id)
      ;(thumb as HTMLIFrameElement).srcdoc = html
      card.addEventListener('click', () => {
        store.set({ themeId: theme.id, knobs: {} })
        initKnobControls()
        void preview.renderNow(store.get())
        dialog.close()
      })
    }
  }
  themeBtn.addEventListener('click', () => {
    void buildThumbs()
    dialog.showModal()
  })

  // --- exports ------------------------------------------------------------------------
  async function withDocument(action: (html: string, title: string) => void | Promise<void>): Promise<void> {
    const state = store.get()
    if (!state.markdown.trim()) {
      notice('Nothing to export — the document is empty')
      return
    }
    const { html, title } = await render(state.markdown, state.themeId, state.knobs)
    await action(html, title)
  }
  downloadBtn.addEventListener('click', () => void withDocument((html, title) => downloadHtml(html, title)))
  printBtn.addEventListener('click', () =>
    void withDocument(html => {
      if (!printDocument(html)) notice('Popup blocked — allow popups for this site to print')
    }),
  )
  copyBtn.addEventListener('click', () =>
    void withDocument(async html => {
      notice((await copyHtml(html)) ? 'HTML copied to clipboard' : 'Copy failed — clipboard unavailable')
    }),
  )

  // --- file open / drag-drop -------------------------------------------------------------
  async function acceptFile(file: File): Promise<void> {
    if (!isMarkdownFile(file.name)) {
      notice('Unsupported file — use .md, .markdown, or .txt')
      return
    }
    try {
      const { text, warning } = await loadMarkdownFile(file)
      if (warning) notice(warning)
      setEditorText(text)
    } catch {
      notice('Could not read the file — try again') // spec §7: read failures toast
    }
  }
  openBtn.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (file) void acceptFile(file)
  })
  for (const evt of ['dragover', 'drop'] as const) {
    app.addEventListener(evt, e => {
      e.preventDefault()
      if (evt === 'drop') {
        const file = (e as DragEvent).dataTransfer?.files?.[0]
        if (file) void acceptFile(file)
      }
    })
  }

  // --- misc -----------------------------------------------------------------------------
  resetBtn.addEventListener('click', () => {
    store.set({ markdown: SAMPLE_MARKDOWN, themeId: themes[0]!.id, knobs: {} })
    setEditorText(SAMPLE_MARKDOWN)
    initKnobControls()
    void preview.renderNow(store.get())
  })
  viewToggle.addEventListener('click', () => {
    const next = app.dataset.view === 'preview' ? 'editor' : 'preview'
    app.dataset.view = next
    viewToggle.textContent = next === 'preview' ? 'Editor' : 'Preview'
  })

  initKnobControls()
  await preview.renderNow(store.get())
}

const appRoot = document.getElementById('app')
if (appRoot) void mount(appRoot)
