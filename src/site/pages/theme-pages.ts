import { CATEGORY_LABELS, getTheme, themes, type Category } from '../../themes/registry'
import type { ThemeCopy } from './copy'
import { themeCopy } from './copy'
import { scopedSampleCss } from './scope-css'
import { escapeHtml, pageShell } from './shell'

function sampleEmbed(themeId: string, sampleBody: string, label: string): string {
  // the matching scoped css travels via pageShell's extraCss (style-in-body is non-conforming)
  return `<figure class="sample-embed" role="group" aria-label="${escapeHtml(label)}">
<div class="mds-theme-${themeId}"><div class="mds-content">
${sampleBody}
</div></div>
</figure>`
}

export function buildThemePage(copy: ThemeCopy, sampleBody: string): string {
  const theme = getTheme(copy.id)
  const related = copy.pairWith
    .map(id => {
      const rc = themeCopy.find(c => c.id === id)!
      return `<li><a href="/themes/${id}">${escapeHtml(getTheme(id).name)}</a> — ${escapeHtml(rc.whoItSuits.split('—')[0]!.trim())}</li>`
    })
    .join('\n')
  const main = `<section class="hero" aria-label="Introduction" style="border-top:0">
  <h1>${escapeHtml(copy.h1)}</h1>
  <p class="lede">${escapeHtml(copy.intro)}</p>
  <div class="cta-row">
    <a class="btn-cta" href="/editor?theme=${copy.id}">Use ${escapeHtml(theme.name)} on my markdown</a>
    <a class="btn-ghost" href="/samples/${copy.id}.html">Open the exported file</a>
  </div>
</section>

<section aria-label="Sample document">
  <h2>What does the ${escapeHtml(theme.name)} theme look like?</h2>
  <p class="answer">This is a complete sample report rendered in ${escapeHtml(theme.name)} — the exact output the editor downloads, embedded here unmodified.</p>
${sampleEmbed(copy.id, sampleBody, `Sample document rendered in the ${theme.name} theme`)}
</section>

<section aria-label="Who it suits">
  <h2>Who is the ${escapeHtml(theme.name)} theme for?</h2>
  <p class="answer">${escapeHtml(copy.whoItSuits)}</p>
</section>

<section aria-label="Related themes">
  <h2>Which themes pair well with it?</h2>
  <ul>
${related}
  </ul>
  <p class="answer">Part of the ${escapeHtml(CATEGORY_LABELS[theme.category])} collection: <a href="/themes#${theme.category}">see the rest of the category</a>.</p>
  <p><a class="btn-ghost" href="/themes">Browse all themes →</a></p>
</section>`
  return pageShell({
    title: copy.title,
    description: copy.description,
    path: `/themes/${copy.id}`,
    main,
    extraCss: scopedSampleCss(theme),
  })
}

export function buildThemesHub(samples: ReadonlyMap<string, string>): string {
  const card = (t: (typeof themes)[number]): string => `<li>
<a class="theme-card-link" href="/themes/${t.id}">
  <div class="mini-preview" aria-hidden="true">
    <div class="mds-theme-${t.id}"><div class="mds-content">
${samples.get(t.id) ?? ''}
    </div></div>
  </div>
  <span class="theme-card-meta"><strong>${escapeHtml(t.name)}</strong><span class="desc">${escapeHtml(t.description)}</span></span>
</a>
</li>`
  const sections = (Object.keys(CATEGORY_LABELS) as Category[])
    .map(category => {
      const group = themes.filter(t => t.category === category)
      if (group.length === 0) return ''
      return `<section aria-label="${escapeHtml(CATEGORY_LABELS[category])}" id="${category}">
  <h2>${escapeHtml(CATEGORY_LABELS[category])} (${group.length})</h2>
  <ul class="theme-grid">
${group.map(card).join('\n')}
  </ul>
</section>`
    })
    .filter(Boolean)
    .join('\n\n')
  const main = `<section class="hero" aria-label="Introduction" style="border-top:0">
  <h1>What do the markdown.style themes look like?</h1>
  <p class="lede">${themes.length} designed looks in six categories, each previewed below on the same real report. Click any theme for the full sample and a one-click way to apply it to your own markdown.</p>
</section>

${sections}

<section aria-label="Next steps">
  <h2>How do I use one of these on my own document?</h2>
  <p class="answer">Open any theme page and click “Use this theme”, or go straight to the <a href="/editor">editor</a> and paste your markdown — the theme picker previews every theme live. See a worked example: <a href="/use-cases/chatgpt-report">a ChatGPT research answer styled into a report</a>, or the two-step paths to <a href="/convert/markdown-to-pdf">PDF</a> and <a href="/convert/markdown-to-html">a single HTML file</a>.</p>
</section>`
  return pageShell({
    title: 'Themes — designed looks for LLM markdown, by category — markdown.style',
    description: 'Compare all markdown.style themes on the same real report, organized by use case: business reports, technical docs, academic papers, editorial longform, minimal, and bold.',
    path: '/themes',
    main,
    extraCss: themes.map(t => scopedSampleCss(t)).join('\n'),
  })
}
