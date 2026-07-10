import DOMPurify from 'dompurify'

/**
 * Belt-and-braces pass over user-authored markdown output (spec §2).
 * Runs before slot filling: slot elements carry data-* attrs, which
 * DOMPurify keeps (ALLOW_DATA_ATTR default) while comments would be stripped.
 * svg+mathMl profiles keep KaTeX MathML output intact.
 */
export function sanitizeBody(body: string): string {
  return DOMPurify.sanitize(body, {
    USE_PROFILES: { html: true, svg: true, svgFilters: true, mathMl: true },
  })
}
