import type { MermaidTheme } from '../pipeline/types'
import baseCssRaw from './_base.css?raw'
import paperCss from './paper.css?raw'

export interface Theme {
  id: string
  name: string
  description: string
  defaultAccent: string
  shikiTheme: string
  mermaidTheme: MermaidTheme
  css: string
}

export const baseCss: string = baseCssRaw

export const themes: readonly Theme[] = [
  {
    id: 'paper',
    name: 'Paper',
    description: 'Warm, book-like serif — reads like a well-set hardcover.',
    defaultAccent: '#8b3a2f',
    shikiTheme: 'vitesse-light',
    mermaidTheme: 'neutral',
    css: paperCss,
  },
]

export function getTheme(id: string): Theme {
  return themes.find(t => t.id === id) ?? themes[0]!
}
