import type { MermaidTheme } from '../pipeline/types'
import baseCssRaw from './_base.css?raw'
import airyCss from './airy.css?raw'
import blueprintCss from './blueprint.css?raw'
import boardroomCss from './boardroom.css?raw'
import briefingCss from './briefing.css?raw'
import carbonCss from './carbon.css?raw'
import columnistCss from './columnist.css?raw'
import contrastCss from './contrast.css?raw'
import editorialCss from './editorial.css?raw'
import gazetteCss from './gazette.css?raw'
import lectureCss from './lecture.css?raw'
import ledgerCss from './ledger.css?raw'
import manualCss from './manual.css?raw'
import memoCss from './memo.css?raw'
import mistCss from './mist.css?raw'
import monoCss from './mono.css?raw'
import neonCss from './neon.css?raw'
import notebookCss from './notebook.css?raw'
import novellaCss from './novella.css?raw'
import paperCss from './paper.css?raw'
import popCss from './pop.css?raw'
import posterCss from './poster.css?raw'
import preprintCss from './preprint.css?raw'
import quarterlyCss from './quarterly.css?raw'
import retroCss from './retro.css?raw'
import risoCss from './riso.css?raw'
import scholarCss from './scholar.css?raw'
import slateCss from './slate.css?raw'
import swissCss from './swiss.css?raw'
import terminalCss from './terminal.css?raw'
import thesisCss from './thesis.css?raw'

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
  {
    id: 'boardroom',
    name: 'Boardroom',
    description: 'Confident corporate report: navy authority, disciplined ruled tables.',
    category: 'business',
    featured: true,
    defaultAccent: '#1f3a5f',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: boardroomCss,
  },
  {
    id: 'ledger',
    name: 'Ledger',
    description: 'Financial-statement style: tabular numerals, hairline table rules.',
    category: 'business',
    defaultAccent: '#1a5c3a',
    shikiTheme: 'everforest-light',
    mermaidTheme: 'forest',
    css: ledgerCss,
  },
  {
    id: 'briefing',
    name: 'Briefing',
    description: 'Consulting brief: numbered sections, decisive charcoal and signal red.',
    category: 'business',
    defaultAccent: '#b3261e',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: briefingCss,
  },
  {
    id: 'memo',
    name: 'Memo',
    description: 'Interoffice memo: small-caps headings, typewriter code, warm paper.',
    category: 'business',
    defaultAccent: '#4a4238',
    shikiTheme: 'solarized-light',
    mermaidTheme: 'neutral',
    css: memoCss,
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    description: 'Annual-report editorial: generous margins, burgundy headlines.',
    category: 'business',
    defaultAccent: '#7c2138',
    shikiTheme: 'rose-pine-dawn',
    mermaidTheme: 'neutral',
    css: quarterlyCss,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Amber phosphor terminal: monospace everything on near-black.',
    category: 'technical',
    defaultAccent: '#d9930d',
    shikiTheme: 'vesper',
    mermaidTheme: 'dark',
    css: terminalCss,
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Engineering drawing: drafting blues, uppercase mono annotations.',
    category: 'technical',
    defaultAccent: '#1e4f91',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: blueprintCss,
  },
  {
    id: 'manual',
    name: 'Manual',
    description: 'Reference manual: man-page structure, no-nonsense hierarchy.',
    category: 'technical',
    defaultAccent: '#8a1f11',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: manualCss,
  },
  {
    id: 'thesis',
    name: 'Thesis',
    description: 'Dissertation formality: Times lineage, numbered headings, sober rules.',
    category: 'academic',
    defaultAccent: '#1e2f5e',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: thesisCss,
  },
  {
    id: 'preprint',
    name: 'Preprint',
    description: 'LaTeX preprint: Computer Modern spirit, justified measure, hyperref links.',
    category: 'academic',
    defaultAccent: '#1a4fd6',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: preprintCss,
  },
  {
    id: 'notebook',
    name: 'Notebook',
    description: 'Lab notebook: ruled callouts, ballpoint-blue annotations.',
    category: 'academic',
    defaultAccent: '#2563eb',
    shikiTheme: 'catppuccin-latte',
    mermaidTheme: 'neutral',
    css: notebookCss,
  },
  {
    id: 'lecture',
    name: 'Lecture',
    description: 'Lecture notes: crisp sans, tinted key-point blocks.',
    category: 'academic',
    defaultAccent: '#0f766e',
    shikiTheme: 'snazzy-light',
    mermaidTheme: 'neutral',
    css: lectureCss,
  },
  {
    id: 'gazette',
    name: 'Gazette',
    description: 'Front-page gazette: condensed headlines, uppercase kickers, dense measure.',
    category: 'editorial',
    defaultAccent: '#9f1239',
    shikiTheme: 'github-light',
    mermaidTheme: 'neutral',
    css: gazetteCss,
  },
  {
    id: 'novella',
    name: 'Novella',
    description: 'Fiction manuscript: serene serif, first-line indents, zero clutter.',
    category: 'editorial',
    defaultAccent: '#6b4226',
    shikiTheme: 'solarized-light',
    mermaidTheme: 'neutral',
    css: novellaCss,
  },
  {
    id: 'columnist',
    name: 'Columnist',
    description: 'Opinion page: assertive pull-quote blockquotes, byline italics.',
    category: 'editorial',
    defaultAccent: '#be123c',
    shikiTheme: 'one-light',
    mermaidTheme: 'neutral',
    css: columnistCss,
  },
  {
    id: 'mist',
    name: 'Mist',
    description: 'Hairline minimal: feather rules, whispered hierarchy.',
    category: 'minimal',
    defaultAccent: '#64748b',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: mistCss,
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Typewriter monospace: one family, two weights, zero decoration.',
    category: 'minimal',
    defaultAccent: '#374151',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: monoCss,
  },
  {
    id: 'airy',
    name: 'Airy',
    description: 'Air and whitespace: a small text block adrift in generous margins.',
    category: 'minimal',
    defaultAccent: '#6366f1',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: airyCss,
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Electric dark: neon cyan on deep violet-black.',
    category: 'bold',
    defaultAccent: '#22d3ee',
    shikiTheme: 'synthwave-84',
    mermaidTheme: 'dark',
    css: neonCss,
  },
  {
    id: 'poster',
    name: 'Poster',
    description: 'Poster type: massive headlines, unapologetic scale jumps.',
    category: 'bold',
    defaultAccent: '#ea580c',
    shikiTheme: 'min-light',
    mermaidTheme: 'neutral',
    css: posterCss,
  },
  {
    id: 'riso',
    name: 'Riso',
    description: 'Risograph print: two-ink overprint charm, tinted paper.',
    category: 'bold',
    defaultAccent: '#ff4d6d',
    shikiTheme: 'catppuccin-latte',
    mermaidTheme: 'neutral',
    css: risoCss,
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Warm 70s: burnt orange, mustard rules, rounded corners.',
    category: 'bold',
    defaultAccent: '#c2410c',
    shikiTheme: 'gruvbox-light-soft',
    mermaidTheme: 'forest',
    css: retroCss,
  },
]

export function getTheme(id: string): Theme {
  return themes.find(t => t.id === id) ?? themes[0]!
}
