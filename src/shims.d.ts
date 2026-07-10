declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it'
  const plugin: (md: MarkdownIt, opts?: { enabled?: boolean; label?: boolean }) => void
  export default plugin
}
declare module 'markdown-it-footnote' {
  import type MarkdownIt from 'markdown-it'
  const plugin: (md: MarkdownIt) => void
  export default plugin
}
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: unknown)
    window: unknown
  }
}
