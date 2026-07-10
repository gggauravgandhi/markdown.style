import { describe, expect, it, vi } from 'vitest'

// Isolated file: mock render() to reject so we can exercise renderNow's
// defensive catch without disturbing the real-render tests in preview.test.ts.
vi.mock('../pipeline/render', () => ({
  render: vi.fn().mockRejectedValue(new Error('lazy dep exploded')),
}))

const { createPreview } = await import('./preview')

describe('preview error path', () => {
  it('surfaces a pipeline notice and leaves srcdoc untouched when render throws', async () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const errs: { source: string; message: string }[] = []
    const preview = createPreview(iframe, e => errs.push(...e))

    await preview.renderNow({ markdown: '# x', themeId: 'paper', knobs: {} })

    expect(errs).toEqual([{ source: 'pipeline', message: 'Preview failed to render — try reloading' }])
    expect(iframe.srcdoc).toBe('')
    document.body.innerHTML = ''
  })
})
