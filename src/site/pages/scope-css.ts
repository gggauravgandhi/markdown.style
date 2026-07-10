import { baseCss, type Theme } from '../../themes/registry'

/**
 * Rewrites document-level selectors to `&` and wraps the sheet in a scope
 * class, using native CSS nesting. Only used for samples embedded inline in
 * static marketing pages — standalone exports keep the unscoped sheet.
 * Relies on the theme-CSS convention (enforced by scope-css.test.ts) that
 * `:root`, `body`, and `html, body` selectors start their line.
 */
function rescopeDocumentSelectors(css: string): string {
  return css
    .replace(/^(\s*)html,\s*body\b/gm, '$1&')
    .replace(/^(\s*):root\b/gm, '$1&')
    .replace(/^(\s*)body\b/gm, '$1&')
    // @page cannot nest inside a style rule; drop it (embeds are not print targets)
    .replace(/^@page\s*\{[^}]*\}/gm, '')
}

export function scopedSampleCss(theme: Theme): string {
  const scope = `.mds-theme-${theme.id}`
  const sheet = rescopeDocumentSelectors(`${baseCss}\n${theme.css}`)
  // headings first: host-page selectors like `section h2` (0,0,2) would beat
  // INHERITED theme colors; this nested pin (0,1,1) restores the theme's fg
  // while later theme rules of equal specificity still override it
  return `${scope} {
h1, h2, h3, h4, h5, h6 { color: inherit; }
${sheet}
}
${scope} { --mds-accent: ${theme.defaultAccent}; }`
}
