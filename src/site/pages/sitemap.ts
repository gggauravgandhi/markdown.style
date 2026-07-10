import { SITE_ORIGIN } from './shell'

export function buildSitemap(routes: readonly string[]): string {
  const urls = routes
    .map(r => `  <url><loc>${r === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${r}`}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}
