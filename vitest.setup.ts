import { JSDOM } from 'jsdom'
import { vi } from 'vitest'

// Node v22+'s experimental global localStorage getter returns undefined and
// shadows jsdom's real Storage in vitest's populateGlobal. Tests need a
// GENUINE Storage instance (store.test.ts spies on Storage.prototype).
const dom = new JSDOM('', { url: 'http://localhost/' })
vi.stubGlobal('localStorage', dom.window.localStorage)
vi.stubGlobal('Storage', dom.window.Storage)
