export interface Knobs {
  /** CSS color for --mds-accent. Validated in assemble.ts before entering CSS. */
  accent?: string
  /** Multiplier for base font size. Clamped to [0.7, 1.5]. */
  fontScale?: number
  /** Content max-width in px (screen/HTML only, never print paper size). Clamped to [480, 1400]. */
  pageWidth?: number
}

export interface RenderError {
  source: 'mermaid' | 'pipeline'
  message: string
}

/** Shared literal union — mermaid.initialize rejects a bare `string` theme. */
export type MermaidTheme = 'default' | 'dark' | 'neutral' | 'forest'

export interface RenderResult {
  html: string
  title: string
  errors: RenderError[]
}

export interface Fence {
  index: number
  lang: string
  code: string
}

export interface MarkdownPass {
  body: string
  codeFences: Fence[]
  mermaidFences: Fence[]
  usedMath: boolean
}
