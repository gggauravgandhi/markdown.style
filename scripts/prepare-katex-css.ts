// One-shot generator: run `bun run prepare:katex` after installing/upgrading katex.
// Rewrites katex.min.css so every @font-face uses a base64 woff2 data URI and
// drops woff/ttf fallbacks (all modern browsers speak woff2). Output is committed.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = join(import.meta.dir, '..', 'node_modules', 'katex', 'dist')
const css = readFileSync(join(dist, 'katex.min.css'), 'utf8')

const rewritten = css.replace(
  /url\(fonts\/([^)]+?\.woff2)\) format\("woff2"\)[^;}]*/g,
  (_m, file: string) => {
    const b64 = readFileSync(join(dist, 'fonts', file)).toString('base64')
    return `url(data:font/woff2;base64,${b64}) format("woff2")`
  },
)

if (/url\((?!data:)/.test(rewritten)) {
  console.error('ERROR: non-data URLs remain in generated CSS')
  process.exit(1)
}
writeFileSync(join(import.meta.dir, '..', 'src', 'pipeline', 'katex-inline.css'), rewritten)
console.log('wrote src/pipeline/katex-inline.css')
