/** Strip a leading YAML frontmatter block (--- ... ---) if present at position 0. */
export function stripFrontmatter(src: string): string {
  return src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
}

/**
 * Cheap gate for lazy-loading KaTeX. False positives only cost an unneeded
 * plugin load, so this is intentionally permissive — but a lone $amount must
 * not trigger (inline math requires both $ on one line).
 */
export function hasMath(src: string): boolean {
  return /\$\$[\s\S]+?\$\$/.test(src) || /\$[^$\n]+\$/.test(src)
}
