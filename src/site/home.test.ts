import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HANDOFF_KEY, takeHandoff } from '../app/handoff'
import { initGateway } from './home'

function mountFixture(): { input: HTMLTextAreaElement; drop: HTMLElement; goBtn: HTMLButtonElement; exampleBtn: HTMLButtonElement; errorEl: HTMLElement; fileInput: HTMLInputElement } {
  document.body.innerHTML = `
    <div id="md-drop">
      <textarea id="md-input" aria-describedby="md-error"></textarea>
      <input type="file" id="md-file" accept=".md,.markdown,.txt" />
    </div>
    <button id="md-open">Open a file</button>
    <button id="md-example">Try an example</button>
    <button id="md-go" disabled>Style this Markdown</button>
    <div id="md-error" role="status" aria-live="polite"></div>
  `
  return {
    input: document.querySelector('#md-input')!,
    drop: document.querySelector('#md-drop')!,
    goBtn: document.querySelector('#md-go')!,
    exampleBtn: document.querySelector('#md-example')!,
    errorEl: document.querySelector('#md-error')!,
    fileInput: document.querySelector('#md-file')!,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('initGateway', () => {
  it('does nothing when the gateway markup is absent', () => {
    document.body.innerHTML = '<div></div>'
    expect(() => initGateway(document)).not.toThrow()
  })

  it('disables #md-go until the textarea holds meaningful content, and re-disables when cleared', () => {
    const { input, goBtn } = mountFixture()
    initGateway(document)
    expect(goBtn.disabled).toBe(true)

    input.value = '  '
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(goBtn.disabled).toBe(true) // whitespace-only doesn't count

    input.value = '# Hello'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(goBtn.disabled).toBe(false)

    input.value = ''
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(goBtn.disabled).toBe(true)
  })

  it('clicking #md-go writes the handoff and never puts markdown in the URL', () => {
    const { input, goBtn } = mountFixture()
    const navigate = vi.fn()
    initGateway(document, navigate)

    input.value = '# From the gateway'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    goBtn.click()

    expect(takeHandoff()).toBe('# From the gateway')
    expect(navigate).toHaveBeenCalledWith('/editor')
    expect(navigate.mock.calls[0]![0]).not.toContain('From the gateway')
    expect(localStorage.getItem(HANDOFF_KEY)).toBeNull() // takeHandoff already cleared it
  })

  it('is a no-op when #md-go is clicked with no content', () => {
    const { goBtn } = mountFixture()
    const navigate = vi.fn()
    initGateway(document, navigate)
    goBtn.click()
    expect(navigate).not.toHaveBeenCalled()
    expect(takeHandoff()).toBeNull()
  })

  it('accepts a dropped .md file, fills the textarea, and enables #md-go', async () => {
    const { input, drop, goBtn } = mountFixture()
    initGateway(document)
    const file = new File(['# Dropped content'], 'notes.md', { type: 'text/markdown' })

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent
    Object.defineProperty(dropEvent, 'dataTransfer', { value: { files: [file] } })
    drop.dispatchEvent(dropEvent)
    await vi.waitFor(() => expect(input.value).toBe('# Dropped content'))
    expect(goBtn.disabled).toBe(false)
    expect(drop.dataset.dragover).toBeUndefined()
  })

  it('sets data-dragover on the drop zone while dragging, conveyed via text too', () => {
    const { drop, errorEl } = mountFixture()
    initGateway(document)
    drop.dispatchEvent(new Event('dragenter', { bubbles: true, cancelable: true }))
    expect(drop.dataset.dragover).toBe('true')
    expect(errorEl.textContent).toMatch(/drop/i)
    drop.dispatchEvent(new Event('dragleave', { bubbles: true }))
    expect(drop.dataset.dragover).toBeUndefined()
  })

  it('rejects a bad extension with a visible error and leaves #md-go disabled', async () => {
    const { drop, goBtn, errorEl } = mountFixture()
    initGateway(document)
    const file = new File(['not markdown'], 'notes.exe', { type: 'application/octet-stream' })

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent
    Object.defineProperty(dropEvent, 'dataTransfer', { value: { files: [file] } })
    drop.dispatchEvent(dropEvent)
    await vi.waitFor(() => expect(errorEl.textContent).toMatch(/unsupported/i))
    expect(goBtn.disabled).toBe(true)
    expect(drop.dataset.error).toBe('true')
  })

  it('loads the example document and enables #md-go', () => {
    const { input, exampleBtn, goBtn } = mountFixture()
    initGateway(document)
    exampleBtn.click()
    expect(input.value.length).toBeGreaterThan(0)
    expect(goBtn.disabled).toBe(false)
  })
})
