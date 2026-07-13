import katex from 'katex'
import type MarkdownIt from 'markdown-it'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'

// Replaces @vscode/markdown-it-katex: that fork's bundled KaTeX lexer breaks
// under Vite's dep optimizer (control words truncate to one letter, found in
// browser QA 2026-07-10). Delimiter rules follow the pandoc-style convention
// (opening $ not followed by space; closing $ not preceded by space nor
// followed by a digit); rendering calls our own pinned katex directly.
// `trust` is left at its default (false), so \href/\includegraphics stay blocked.

const KATEX_OPTS = { throwOnError: false, errorColor: '#b91c1c' } as const

function isValidDelim(state: StateInline, pos: number): { canOpen: boolean; canClose: boolean } {
  const prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1
  const nextChar = pos + 1 <= state.posMax ? state.src.charCodeAt(pos + 1) : -1
  return {
    // opening $ must not be followed by whitespace
    canOpen: nextChar !== 0x20 && nextChar !== 0x09,
    // closing $ must not be preceded by whitespace or followed by a digit ($5 vs $x$5)
    canClose: !(prevChar === 0x20 || prevChar === 0x09 || (nextChar >= 0x30 && nextChar <= 0x39)),
  }
}

function mathInline(state: StateInline, silent: boolean): boolean {
  if (state.src[state.pos] !== '$') return false
  if (!isValidDelim(state, state.pos).canOpen) {
    if (!silent) state.pending += '$'
    state.pos += 1
    return true
  }
  const start = state.pos + 1
  let match = start
  while ((match = state.src.indexOf('$', match)) !== -1) {
    // even number of backslashes before the $ means it is a real delimiter
    let pos = match - 1
    while (state.src[pos] === '\\') pos -= 1
    if ((match - pos) % 2 === 1) break
    match += 1
  }
  if (match === -1) {
    if (!silent) state.pending += '$'
    state.pos = start
    return true
  }
  if (match - start === 0) {
    if (!silent) state.pending += '$$'
    state.pos = start + 1
    return true
  }
  if (!isValidDelim(state, match).canClose) {
    if (!silent) state.pending += '$'
    state.pos = start
    return true
  }
  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }
  state.pos = match + 1
  return true
}

/** Mid-paragraph `$$...$$` renders as inline display math (matches the old fork). */
function mathInlineBlock(state: StateInline, silent: boolean): boolean {
  if (state.src.slice(state.pos, state.pos + 2) !== '$$') return false
  let pos = state.pos + 2
  let found = -1
  while (pos < state.posMax - 1) {
    if (state.src[pos] === '\\') {
      pos += 2 // skip escaped char
      continue
    }
    if (state.src.slice(pos, pos + 2) === '$$') {
      found = pos
      break
    }
    pos += 1
  }
  if (found === -1 || found === state.pos + 2) return false // no close, or empty $$$$
  if (!silent) {
    const token = state.push('math_inline_block', 'math', 0)
    token.markup = '$$'
    token.content = state.src.slice(state.pos + 2, found)
  }
  state.pos = found + 2
  return true
}

function mathBlock(state: StateBlock, start: number, end: number, silent: boolean): boolean {
  let pos = state.bMarks[start]! + state.tShift[start]!
  let max = state.eMarks[start]!
  if (pos + 2 > max || state.src.slice(pos, pos + 2) !== '$$') return false
  if (silent) return true
  pos += 2
  let firstLine = state.src.slice(pos, max)
  let found = false
  let lastLine = ''
  if (firstLine.trim().endsWith('$$')) {
    firstLine = firstLine.trim().slice(0, -2)
    found = true
  }
  let next = start
  while (!found) {
    next += 1
    if (next >= end) break
    pos = state.bMarks[next]! + state.tShift[next]!
    max = state.eMarks[next]!
    if (pos < max && state.tShift[next]! < state.blkIndent) break
    const line = state.src.slice(pos, max)
    if (line.trim().endsWith('$$')) {
      lastLine = line.trim().slice(0, -2)
      found = true
    }
  }
  state.line = next + 1
  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content =
    (firstLine.trim() ? `${firstLine}\n` : '') +
    state.getLines(start + 1, next, state.tShift[start]!, true) +
    (lastLine.trim() ? lastLine : '')
  token.map = [start, state.line]
  token.markup = '$$'
  return true
}

export function mathPlugin(md: MarkdownIt): void {
  // $$ inline-block must be tried before single-$ inline
  md.inline.ruler.after('escape', 'math_inline_block', mathInlineBlock)
  md.inline.ruler.after('math_inline_block', 'math_inline', mathInline)
  md.block.ruler.after('blockquote', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules.math_inline = (tokens, idx) =>
    katex.renderToString(tokens[idx]!.content, KATEX_OPTS)
  md.renderer.rules.math_inline_block = (tokens, idx) =>
    katex.renderToString(tokens[idx]!.content, { ...KATEX_OPTS, displayMode: true })
  md.renderer.rules.math_block = (tokens, idx) =>
    `<p class="mds-math-block">${katex.renderToString(tokens[idx]!.content, { ...KATEX_OPTS, displayMode: true })}</p>\n`
}
