export function filenameFor(title: string, ext = 'html'): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'document'}.${ext}`
}

export function downloadHtml(html: string, title: string): void {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filenameFor(title)
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadMarkdown(markdown: string, title: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filenameFor(title, 'md')
  a.click()
  URL.revokeObjectURL(url)
}

export async function copyHtml(html: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(html)
    return true
  } catch {
    return false
  }
}

/**
 * Print via a fresh tab — never the preview iframe (spec §2: cross-browser
 * iframe-print quirks). Waits for fonts (KaTeX) before invoking the dialog.
 * Returns false when the popup was blocked so the caller can show a notice.
 */
export function printDocument(html: string): boolean {
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  const doPrint = (): void => {
    // close the tab once the dialog is dismissed (printed or canceled); the
    // handler lives on the window object, never inside the document, so the
    // printed artifact stays script-free
    win.addEventListener('afterprint', () => win.close())
    win.focus()
    win.print()
  }
  if (win.document.readyState === 'complete') {
    void win.document.fonts.ready.then(doPrint)
  } else {
    win.addEventListener('load', () => void win.document.fonts.ready.then(doPrint))
  }
  return true
}
