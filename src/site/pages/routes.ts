import { themes } from '../../themes/registry'
import { convertPages, useCases } from './copy'

/** Extensionless routes the generator emits (samples are NOT routes — noindexed assets). */
export const GENERATED_ROUTES: readonly string[] = [
  '/themes',
  ...themes.map(t => `/themes/${t.id}`),
  ...useCases.map(u => `/use-cases/${u.slug}`),
  ...convertPages.map(c => `/convert/${c.slug}`),
]

/** Every canonical route on the site — the sitemap's exact contents. */
export const ALL_ROUTES: readonly string[] = ['/', '/editor', '/privacy', '/terms', ...GENERATED_ROUTES]

/** '/themes' -> 'themes.html'; '/themes/paper' -> 'themes/paper.html' (host clean-URLs). */
export function routeToFile(route: string): string {
  return `${route.replace(/^\//, '')}.html`
}
