import DOMPurify from 'dompurify'

const PURIFY_CONFIG = {
  USE_PROFILES: { html: true, svg: true, svgFilters: true, mathMl: true },
} as const

/** In a browser/jsdom test env, dompurify's default export is ready to use. */
let purify: { sanitize: (src: string, cfg?: typeof PURIFY_CONFIG) => string } | null =
  typeof window !== 'undefined' ? DOMPurify : null

/**
 * Belt-and-braces pass over user-authored markdown output (spec §2).
 * Runs before slot filling: slot elements carry data-* attrs, which
 * DOMPurify keeps (ALLOW_DATA_ATTR default) while comments would be stripped.
 * svg+mathMl profiles keep KaTeX MathML output intact.
 * Async because non-DOM environments (the Plan 4 static build) lazily
 * construct a jsdom window for DOMPurify; browsers never hit that path.
 */
export async function sanitizeBody(body: string): Promise<string> {
  if (!purify) {
    const { JSDOM } = await import(/* @vite-ignore */ 'jsdom')
    purify = DOMPurify(new JSDOM('').window as Parameters<typeof DOMPurify>[0])
  }
  return purify.sanitize(body, PURIFY_CONFIG)
}
