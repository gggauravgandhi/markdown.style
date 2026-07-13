// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// House rule: no em dashes anywhere in the repo (copy, UI strings, docs, code
// comments, sample documents). Escape sequence used below on purpose: writing
// the literal character would make this test flag itself.
const EM_DASH = '\u2014'

// docs/plans/ is the user's own input document, explicitly out of scope.
const EXCLUDED_PREFIXES = ['docs/plans/']

function trackedFiles(): string[] {
  const out = execFileSync('git', ['ls-files'], { cwd: process.cwd(), encoding: 'utf8' })
  return out
    .split('\n')
    .filter(Boolean)
    .filter(f => !EXCLUDED_PREFIXES.some(prefix => f.startsWith(prefix)))
}

describe('no em dashes in the repo', () => {
  it('contains zero U+2014 characters in any tracked file', () => {
    const offenders: string[] = []

    for (const file of trackedFiles()) {
      let content: string
      try {
        content = readFileSync(file, 'utf8')
      } catch {
        continue // binary or unreadable files (images, fonts) are not prose
      }
      if (!content.includes(EM_DASH)) continue

      const lineNumber = content.slice(0, content.indexOf(EM_DASH)).split('\n').length
      offenders.push(`${file}:${lineNumber}`)
    }

    expect(offenders, `em dash found in: ${offenders.join(', ')}`).toEqual([])
  })
})
