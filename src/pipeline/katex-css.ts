/** Lazy accessor so the ~1MB CSS string stays out of every non-math render. */
export async function mathCss(): Promise<string> {
  const mod = await import('./katex-inline.css?raw')
  return mod.default
}
