import { themes } from '../../themes/registry'
import { SITE_ORIGIN } from './shell'

/**
 * JSON-LD for the generated pages. Deliberately narrow.
 *
 * What is here and why:
 *   BreadcrumbList: the only schema on this site that still produces a visible
 *     Google SERP feature. FAQ and HowTo rich results were deprecated in 2023.
 *   WebPage + isPartOf: gives the 40-odd generated pages one entity graph
 *     instead of leaving them as orphan documents.
 *   ItemList (hub only): lets an answer engine enumerate the styles when asked
 *     "what themes does markdown.style have".
 *
 * What is deliberately absent, and must stay absent:
 *   FAQPage and HowTo: no rich result since 2023, so they buy nothing.
 *   aggregateRating and Review: there are no ratings. Inventing them is a policy
 *     violation, not a growth tactic.
 *   SearchAction: it advertises a sitelinks searchbox, and there is no site search.
 * Every node below must describe content that is actually visible on the page.
 */

export const WEBSITE_ID = `${SITE_ORIGIN}/#website`

export interface Crumb {
  name: string
  /** omitted on the current page: the last crumb carries no link, per Google's spec */
  path?: string
}

function breadcrumbs(trail: readonly Crumb[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: `${SITE_ORIGIN}${c.path}` } : {}),
    })),
  }
}

function webPage(path: string, title: string, description: string): object {
  const url = path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': url,
    url,
    name: title,
    description,
    isPartOf: { '@id': WEBSITE_ID },
    primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/og.png` },
  }
}

/** The hub enumerates every style, so an answer engine can list them on request. */
function themeItemList(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'markdown.style document styles',
    numberOfItems: themes.length,
    itemListElement: themes.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: `${SITE_ORIGIN}/themes/${t.id}`,
    })),
  }
}

/**
 * Every generated page gets a WebPage node and a breadcrumb trail. `trail` is the
 * path BELOW the site root: the Home crumb is prepended here so no caller can
 * forget it, and the final crumb is the current page (no link).
 */
export function pageSchema(opts: {
  path: string
  title: string
  description: string
  trail: readonly Crumb[]
  includeThemeList?: boolean
}): string {
  const { path, title, description, trail, includeThemeList = false } = opts
  const nodes: object[] = [
    webPage(path, title, description),
    breadcrumbs([{ name: 'markdown.style', path: '/' }, ...trail]),
  ]
  if (includeThemeList) nodes.push(themeItemList())
  return `<script type="application/ld+json">\n${JSON.stringify(nodes, null, 2)}\n</script>`
}
