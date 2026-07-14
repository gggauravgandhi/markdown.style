import siteCss from '../site.css?raw'

export const SITE_ORIGIN = 'https://markdown.style'

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Shared skeleton for generated static pages. Mirrors index.html's head
 * invariants (canonical, og, description) but inlines site.css so the files
 * need no Vite processing and make zero requests beyond themselves.
 * Zero JS by design: AI crawlers do not execute it (spec §6).
 */
export function pageShell(opts: {
  title: string
  description: string
  path: string
  main: string
  extraCss?: string
  /** JSON-LD from schema.ts. The only <script> a generated page may ever carry. */
  jsonLd?: string
}): string {
  const { title, description, path, main, extraCss = '', jsonLd = '' } = opts
  const url = `${SITE_ORIGIN}${path}`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE_ORIGIN}/og.png">
<meta name="twitter:card" content="summary_large_image">
<style>
${siteCss}
${extraCss}
</style>
${jsonLd}
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">markdown.style</a>
    <nav class="site-nav" aria-label="Site">
      <a href="/themes">Themes</a>
      <a class="btn-cta" href="/editor">Open the editor</a>
    </nav>
  </div>
</header>

<main>
  <div class="wrap">
${main}
    <p class="trust">100% in your browser · no upload · free · no sign-up</p>
  </div>
</main>

<footer class="site-footer">
  <div class="wrap">
    <span>© 2026 markdown.style</span>
    <a href="/themes">Themes</a>
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="/editor">Editor</a>
  </div>
</footer>
</body>
</html>
`
}
