import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import type { DevRoute } from './src/site/pages/dev-server'

// Serves the generated pages (theme hub, theme pages, use-case pages,
// convert pages, standalone samples) during `bun run dev` so they aren't
// silently shadowed by index.html. The route/render logic lives in
// dev-server.ts, but it's loaded here via `server.ssrLoadModule` rather than
// a plain import: vite.config.ts itself is loaded by plain Node (the `vite`
// binary's shebang is `#!/usr/bin/env node`), whose strict ESM resolver
// can't handle this project's extensionless imports or the theme registry's
// `?raw` css imports. `ssrLoadModule` runs the file through Vite's own
// running dev pipeline instead, which handles both. `configureServer` only
// fires for the dev server; `vite build` never touches this, so production
// output is unaffected.
function devPagesPlugin(): Plugin {
  return {
    name: 'dev-generated-pages',
    apply: 'serve',
    configureServer(server) {
      // No manual caching here: Vite's own SSR module graph already keeps
      // this cheap (unchanged files aren't re-transpiled) and, crucially,
      // invalidates and re-executes the module when a file it imports
      // changes, so edits to copy.ts, theme-pages.ts, theme CSS, etc. take
      // effect on the next request instead of needing a dev-server restart.
      const loadDevServer = () => server.ssrLoadModule('/src/site/pages/dev-server.ts')
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0]!
        loadDevServer()
          .then(async ({ resolveDevRoute, renderDevRoute }) => {
            const route: DevRoute | null = resolveDevRoute(pathname)
            if (!route) {
              next()
              return
            }
            const html = await renderDevRoute(route)
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
          })
          .catch((err: unknown) => {
            res.statusCode = 500
            res.setHeader('Content-Type', 'text/plain')
            res.end(err instanceof Error ? (err.stack ?? err.message) : String(err))
          })
      })
    },
  }
}

export default defineConfig({
  plugins: [devPagesPlugin()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        editor: resolve(import.meta.dirname, 'editor.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        terms: resolve(import.meta.dirname, 'terms.html'),
      },
    },
  },
})
