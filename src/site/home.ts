// The one piece of JS on the marketing site: progressive enhancement for the
// homepage paste gateway. Binds to markup index.html provides (see the id
// contract below); does nothing if that markup isn't present.
import { isMarkdownFile, loadMarkdownFile } from '../app/file-input'
import { putHandoff } from '../app/handoff'

const EXAMPLE_MARKDOWN = `# Quarterly Update

Revenue grew 12% quarter over quarter after the March API launch.

## Growth rate

$r = \\frac{P_1 - P_0}{P_0}$

## Rollout

\`\`\`mermaid
graph LR
  A[Draft] --> B[Review] --> C[Publish]
\`\`\`
`

/**
 * Element id contract (implemented by index.html):
 *   #md-input   textarea, the paste target
 *   #md-drop    drop-zone element wrapping the textarea
 *   #md-file    file input, accept=".md,.markdown,.txt"
 *   #md-open    button, triggers the file input
 *   #md-example button, loads EXAMPLE_MARKDOWN
 *   #md-go      button, primary action (disabled until #md-input is non-empty)
 *   #md-error   status region (role=status/aria-live=polite), referenced by
 *               #md-input's aria-describedby
 *
 * Data attributes set on #md-drop for the CSS agent:
 *   data-dragover="true"  while a drag is over the drop zone
 *   data-error="true"     while #md-error holds an error (not a mere notice)
 * Both states are also conveyed via #md-error's text, never by color alone.
 */
export function initGateway(root: Document | HTMLElement, navigate: (path: string) => void = path => { window.location.href = path }): void {
  const input = root.querySelector<HTMLTextAreaElement>('#md-input')
  const drop = root.querySelector<HTMLElement>('#md-drop')
  const fileInput = root.querySelector<HTMLInputElement>('#md-file')
  const openBtn = root.querySelector<HTMLButtonElement>('#md-open')
  const exampleBtn = root.querySelector<HTMLButtonElement>('#md-example')
  const goBtn = root.querySelector<HTMLButtonElement>('#md-go')
  const errorEl = root.querySelector<HTMLElement>('#md-error')
  if (!input || !drop || !fileInput || !openBtn || !exampleBtn || !goBtn || !errorEl) return

  const setStatus = (message: string, isError: boolean): void => {
    errorEl.textContent = message
    if (isError) drop.dataset.error = 'true'
    else delete drop.dataset.error
  }
  const syncGoState = (): void => {
    goBtn.disabled = input.value.trim().length === 0
  }
  syncGoState()

  input.addEventListener('input', () => {
    setStatus('', false)
    syncGoState()
  })

  async function acceptFile(file: File): Promise<void> {
    if (!isMarkdownFile(file.name)) {
      setStatus('Unsupported file. Use .md, .markdown, or .txt.', true)
      return
    }
    try {
      const { text, warning } = await loadMarkdownFile(file)
      input!.value = text // TS loses the outer null-check narrowing across `await`
      setStatus(warning ?? '', false)
      syncGoState()
    } catch {
      setStatus('Could not read the file. Try again.', true)
    }
  }

  openBtn.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (file) void acceptFile(file)
  })

  exampleBtn.addEventListener('click', () => {
    input.value = EXAMPLE_MARKDOWN
    setStatus('', false)
    syncGoState()
  })

  goBtn.addEventListener('click', () => {
    const text = input.value
    if (!text.trim()) return
    putHandoff(text)
    navigate('/editor')
  })

  // Drag depth counter (same problem/fix as src/app/main.ts): dragleave fires
  // on every child boundary, so a bare toggle would flicker.
  let dragDepth = 0
  const endDrag = (): void => {
    dragDepth = 0
    delete drop.dataset.dragover
    if (errorEl.textContent === 'Drop to load markdown') errorEl.textContent = ''
  }
  drop.addEventListener('dragenter', e => {
    e.preventDefault()
    dragDepth++
    drop.dataset.dragover = 'true'
    errorEl.textContent = 'Drop to load markdown'
  })
  drop.addEventListener('dragleave', () => {
    if (--dragDepth <= 0) endDrag()
  })
  drop.addEventListener('dragover', e => e.preventDefault())
  drop.addEventListener('drop', e => {
    e.preventDefault()
    endDrag()
    const file = (e as DragEvent).dataTransfer?.files?.[0]
    if (file) void acceptFile(file)
  })
}

// Auto-run in the browser; no-ops in tests because the gateway markup isn't
// in the document until a test builds its own fixture and calls initGateway.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initGateway(document))
  else initGateway(document)
}
