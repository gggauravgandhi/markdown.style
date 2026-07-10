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
  // the accent normally arrives via render() knobs; embeds apply the default
  return `${scope} {\n${sheet}\n}\n${scope} { --mds-accent: ${theme.defaultAccent}; }`
}
