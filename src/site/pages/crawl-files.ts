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
  // llmstxt.org format: H2 sections whose items are markdown links `[name](url): note`.
  // A bare "- Name: url" line does NOT count as a link to the spec's parser, which is
  // why the PageSpeed llms.txt audit reported "no links" on the old format.
  const useCaseLines = useCases.map(u => `- [${u.h1}](${SITE_ORIGIN}/use-cases/${u.slug})`).join('\n')
  const convertLines = convertPages.map(c => `- [${c.h1}](${SITE_ORIGIN}/convert/${c.slug})`).join('\n')

  return `# markdown.style

> Free browser tool that turns AI-generated markdown (ChatGPT, Claude, etc.) into a styled document. Pick one of ${themes.length} themes, then export it. 100% client-side: nothing is uploaded to a server.

Exports are all local: a self-contained HTML file with styles inlined, the rendered HTML copied to the clipboard, print or save as PDF through the browser's own print dialog, and the edited markdown. Free, no signup, no usage limits, open source under the MIT license.

## Key pages
- [Editor](${SITE_ORIGIN}/editor): the tool itself, paste markdown and export a styled document
- [Theme gallery](${SITE_ORIGIN}/themes): all ${themes.length} document styles rendered on one report
- [Privacy](${SITE_ORIGIN}/privacy): what stays local and what does not
- [Terms](${SITE_ORIGIN}/terms): terms of use

## Use cases
${useCaseLines}

## Convert
${convertLines}

## Source
- [GitHub repository](https://github.com/gggauravgandhi/markdown.style): MIT licensed, no backend

## Optional
Rendering and export happen locally in the browser; markdown and generated documents are never uploaded. If pasted markdown references remote images, the browser will still fetch those images directly from their source.
`
}
