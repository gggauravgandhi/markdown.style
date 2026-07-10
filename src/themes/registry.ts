import type { MermaidTheme } from '../pipeline/types'
import baseCssRaw from './_base.css?raw'
import carbonCss from './carbon.css?raw'
import paperCss from './paper.css?raw'
import slateCss from './slate.css?raw'

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
  {
    id: 'slate',
    name: 'Slate',
    description: 'Modern product-doc sans — clean, neutral, engineered.',
    defaultAccent: '#0969da',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: slateCss,
  },
  {
    id: 'carbon',
    name: 'Carbon',
    description: 'Dark technical — terminal-adjacent, low glare, prints light.',
    defaultAccent: '#2f81f7',
    shikiTheme: 'github-dark',
    mermaidTheme: 'dark',
    css: carbonCss,
  },
]

export function getTheme(id: string): Theme {
  return themes.find(t => t.id === id) ?? themes[0]!
}
