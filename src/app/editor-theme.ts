import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from 'codemirror'

/**
 * Dark chrome for the editing pane. Without this, CM6 ships its light
 * defaults (light gutter, light-blue selection, light-tuned token colors)
 * on top of the app's dark surface. Colors map to the app tokens in
 * app.css and the proofing-blue tonal ramp in DESIGN.json.
 */
const chrome = EditorView.theme(
  {
    '&': { backgroundColor: 'transparent', color: 'var(--app-fg)' },
    // caret + active-line carry focus; CM's dotted default outline reads as a glitch
    '&.cm-focused': { outline: 'none' },
    '.cm-content': { caretColor: '#6d8dff' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#6d8dff' },
    '.cm-selectionBackground, .cm-content ::selection': { backgroundColor: 'rgba(109, 141, 255, 0.20)' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: 'rgba(109, 141, 255, 0.30)',
    },
    '.cm-selectionMatch': { backgroundColor: 'rgba(109, 141, 255, 0.14)' },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: 'rgba(109, 141, 255, 0.18)',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
    '.cm-gutters': {
      backgroundColor: 'var(--app-bg)',
      color: 'var(--app-muted)',
      border: 'none',
      borderRight: '1px solid var(--app-border)',
    },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(255, 255, 255, 0.06)', color: 'var(--app-fg)' },
    '.cm-panels': { backgroundColor: 'var(--app-surface)', color: 'var(--app-fg)' },
    '.cm-panels.cm-panels-bottom': { borderTop: '1px solid var(--app-border)' },
    '.cm-searchMatch': { backgroundColor: 'rgba(109, 141, 255, 0.20)' },
    '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: 'rgba(109, 141, 255, 0.35)' },
    '.cm-tooltip': {
      backgroundColor: 'var(--app-surface)',
      color: 'var(--app-fg)',
      border: '1px solid var(--app-border)',
    },
  },
  { dark: true },
)

/** Markdown token colors tuned for the dark pane. */
const markdownHighlight = HighlightStyle.define([
  { tag: t.heading, color: '#e8e8ee', fontWeight: '700' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: [t.link, t.url], color: '#93abff' },
  { tag: t.quote, color: '#9a9aa8', fontStyle: 'italic' },
  { tag: t.monospace, color: '#c1cfff' },
  { tag: [t.processingInstruction, t.meta, t.contentSeparator], color: '#71717f' },
])

export const editorTheme = [chrome, syntaxHighlighting(markdownHighlight)]
