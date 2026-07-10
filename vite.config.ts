import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      // MPA: Plan 4 adds the landing page and static routes as further inputs
      input: { editor: resolve(import.meta.dirname, 'editor.html') },
    },
  },
})
