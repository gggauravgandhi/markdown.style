import { themes } from '../../themes/registry'
import { convertPages, useCases } from './copy'
import { SITE_ORIGIN } from './shell'

/** robots.txt policy is an owner ruling (2026-07-10): keep verbatim, only the origin is derived. */
export function buildRobots(): string {
  return `# markdown.style: all crawlers welcome (owner ruling 2026-07-10)
User-agent: *
Allow: /

# AI citation/search bots: explicitly welcome
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: Claude-User
Allow: /

# AI training bots: allowed (training exposure may help LLM recommendation)
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`
}

/** A map for AI crawlers, not an essay. Every fact and URL here is derived, never hand typed. */
export function buildLlms(): string {
  const useCaseLines = useCases.map(u => `- ${u.h1}: ${SITE_ORIGIN}/use-cases/${u.slug}`).join('\n')
  const convertLines = convertPages.map(c => `- ${c.h1}: ${SITE_ORIGIN}/convert/${c.slug}`).join('\n')

  return `# markdown.style

> Free browser tool that turns AI-generated markdown (ChatGPT, Claude, etc.) into a styled document. Pick one of ${themes.length} themes, then export it. 100% client-side: nothing is uploaded to a server.

## Exports
- Self-contained HTML file (styles inlined, no external requests)
- Copy the rendered HTML to the clipboard
- Print, or save as PDF, via the browser's own print dialog
- Download the edited markdown

Free, no signup, no usage limits, entirely client-side, open source.

## Key pages
- Editor: ${SITE_ORIGIN}/editor
- Theme gallery (${themes.length} themes): ${SITE_ORIGIN}/themes
- Privacy: ${SITE_ORIGIN}/privacy
- Terms: ${SITE_ORIGIN}/terms

## Use cases
${useCaseLines}

## Convert
${convertLines}

## Privacy
Rendering and export happen locally in the browser; markdown and generated documents are never uploaded. If pasted markdown references remote images, the browser will still fetch those images directly from their source.
`
}
