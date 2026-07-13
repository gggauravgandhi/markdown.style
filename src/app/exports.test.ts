import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyHtml, downloadHtml, downloadMarkdown, filenameFor, printDocument } from './exports'

afterEach(() => vi.restoreAllMocks())

describe('filenameFor', () => {
  it('slugifies titles', () => {
    expect(filenameFor('Q3 Sales Report!')).toBe('q3-sales-report.html')
  })
  it('falls back for empty/symbol-only titles', () => {
    expect(filenameFor('***')).toBe('document.html')
  })
  it('supports a custom extension', () => {
    expect(filenameFor('My Doc', 'md')).toBe('my-doc.md')
  })
})

describe('downloadHtml', () => {
  it('clicks an anchor with a blob url and slug filename', () => {
    const clicked: HTMLAnchorElement[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this)
    })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    downloadHtml('<!doctype html><html></html>', 'My Doc')
    expect(clicked).toHaveLength(1)
    expect(clicked[0]!.download).toBe('my-doc.html')
    expect(clicked[0]!.href).toContain('blob:fake')
    expect(revoke).toHaveBeenCalledWith('blob:fake')
  })
})

describe('downloadMarkdown', () => {
  it('clicks an anchor with a blob url and a .md slug filename', () => {
    const clicked: HTMLAnchorElement[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this)
    })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    downloadMarkdown('# My Doc', 'My Doc')
    expect(clicked).toHaveLength(1)
    expect(clicked[0]!.download).toBe('my-doc.md')
    expect(clicked[0]!.href).toContain('blob:fake')
    expect(revoke).toHaveBeenCalledWith('blob:fake')
  })
})

describe('copyHtml', () => {
  it('resolves true on clipboard success and false on failure', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    expect(await copyHtml('<p>x</p>')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('<p>x</p>')
    writeText.mockRejectedValue(new Error('denied'))
    expect(await copyHtml('<p>x</p>')).toBe(false)
  })
})

describe('printDocument', () => {
  it('returns false when the popup is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    expect(printDocument('<html></html>')).toBe(false)
  })

  it('writes the document, prints after fonts are ready, and closes the tab after printing', async () => {
    const doPrint = vi.fn()
    const close = vi.fn()
    const listeners: Record<string, () => void> = {}
    const written: string[] = []
    const fakeWin = {
      focus: vi.fn(),
      print: doPrint,
      close,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        listeners[event] = handler
      }),
      document: {
        open: vi.fn(),
        write: (s: string) => written.push(s),
        close: vi.fn(),
        readyState: 'complete',
        fonts: { ready: Promise.resolve() },
      },
    } as unknown as Window
    vi.spyOn(window, 'open').mockReturnValue(fakeWin)
    expect(printDocument('<html><body>doc</body></html>')).toBe(true)
    expect(written.join('')).toContain('doc')
    await Promise.resolve() // let fonts.ready continuation run
    await Promise.resolve()
    expect(doPrint).toHaveBeenCalledTimes(1)
    // the tab closes itself once the print dialog is dismissed
    expect(listeners['afterprint'], 'afterprint handler registered').toBeTruthy()
    listeners['afterprint']!()
    expect(close).toHaveBeenCalledTimes(1)
  })
})
