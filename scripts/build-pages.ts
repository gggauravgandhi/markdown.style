// Runs after `vite build`: writes the programmatic pages, standalone samples,
// and sitemap straight into dist/. Plain bun; it resolves the pipeline's
// `?raw` css imports natively, so no bundler is involved (verified 2026-07-10).
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { buildAllPages } from '../src/site/pages/build'

const dist = join(import.meta.dir, '..', 'dist')
if (!existsSync(dist)) {
  console.error('dist/ not found: run `vite build` first (or use `bun run build`)')
  process.exit(1)
}
const written = await buildAllPages(dist)
console.log(`wrote ${written.length} files into dist/:\n${written.map(f => `  ${f}`).join('\n')}`)
