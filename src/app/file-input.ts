export const MAX_FILE_BYTES = 2 * 1024 * 1024

export interface FileLoad {
  text: string
  warning?: string
}

export function isMarkdownFile(name: string): boolean {
  return /\.(md|markdown|txt)$/i.test(name)
}

/** Size guard warns but never blocks (spec §7: oversized input still renders). */
export async function loadMarkdownFile(file: File): Promise<FileLoad> {
  const text = await file.text()
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    return { text, warning: `Large file (${mb} MB) — preview may be slow` }
  }
  return { text }
}
