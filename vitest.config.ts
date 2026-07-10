import { defineConfig } from 'vitest/config'

export default defineConfig({
  // css: true is REQUIRED — without it, `?raw` imports of .css files resolve
  // to empty strings under vitest and Tasks 7/8/10 fail with baffling output.
  test: { environment: 'jsdom', css: true },
})
