import type { MermaidTheme } from '../pipeline/types'
import baseCssRaw from './_base.css?raw'
import carbonCss from './carbon.css?raw'
import contrastCss from './contrast.css?raw'
import editorialCss from './editorial.css?raw'
import paperCss from './paper.css?raw'
import popCss from './pop.css?raw'
import scholarCss from './scholar.css?raw'
import slateCss from './slate.css?raw'
import swissCss from './swiss.css?raw'

export type Category = 'business' | 'technical' | 'academic' | 'editorial' | 'minimal' | 'bold'

export const CATEGORY_LABELS: Record<Category, string> = {
  business: 'Business & Reports',
  technical: 'Technical & Docs',
  academic: 'Academic & Research',
  editorial: 'Editorial & Longform',
  minimal: 'Minimal & Clean',
  bold: 'Bold & Creative',
}

export interface Theme {
  id: string
  name: string
  description: string
  category: Category
  /** Exactly one theme per category carries this; it drives the landing strip. */
  featured?: true
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
    description: 'Warm, book-like serif: reads like a well-set hardcover.',
    category: 'editorial',
    featured: true,
    defaultAccent: '#8b3a2f',
    shikiTheme: 'vitesse-light',
    mermaidTheme: 'neutral',
    css: paperCss,
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Modern product-doc sans: clean, neutral, engineered.',
    category: 'technical',
    featured: true,
    defaultAccent: '#0969da',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: slateCss,
  },
  {
    id: 'carbon',
    name: 'Carbon',
    description: 'Dark technical: terminal-adjacent, low glare, prints light.',
    category: 'technical',
    defaultAccent: '#2f81f7',
    shikiTheme: 'github-dark',
    mermaidTheme: 'dark',
    css: carbonCss,
  },
  {
    id: 'swiss',
    name: 'Swiss',
    description: 'Minimal typographic: whitespace, uppercase labels, one red line.',
    category: 'minimal',
    featured: true,
    defaultAccent: '#e30613',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: swissCss,
  },
  {
    id: 'contrast',
    name: 'Contrast',
    description: 'Bold poster energy: hard rules, big type, zero subtlety.',
    category: 'minimal',
    defaultAccent: '#ffd400',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: contrastCss,
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Elegant magazine serif: display headings, pull quotes, air.',
    category: 'editorial',
    defaultAccent: '#9a2b2b',
    shikiTheme: 'vitesse-light',
    mermaidTheme: 'neutral',
    css: editorialCss,
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Academic restraint: justified text, centered title, footnotes at home.',
    category: 'academic',
    featured: true,
    defaultAccent: '#1f3a93',
    shikiTheme: 'solarized-light',
    mermaidTheme: 'neutral',
    css: scholarCss,
  },
  {
    id: 'pop',
    name: 'Pop',
    description: 'Colorful and friendly: rounded corners, warm tint, wavy links.',
    category: 'bold',
    featured: true,
    defaultAccent: '#d81b7a',
    shikiTheme: 'catppuccin-latte',
    mermaidTheme: 'forest',
    css: popCss,
  },
]

export function getTheme(id: string): Theme {
  return themes.find(t => t.id === id) ?? themes[0]!
}
