import { getTheme } from '../../themes/registry'
import type { UseCaseCopy } from './copy'
import { scopedSampleCss } from './scope-css'
import { escapeHtml, pageShell } from './shell'

export function buildUseCasePage(copy: UseCaseCopy, sampleMarkdown: string, sampleBody: string): string {
  const theme = getTheme(copy.themeId)
  const sections = copy.sections
    .map(s => `<section><h2>${escapeHtml(s.q)}</h2><p class="answer">${escapeHtml(s.a)}</p></section>`)
    .join('\n')
  const main = `<section class="hero" aria-label="Introduction" style="border-top:0">
  <h1>${escapeHtml(copy.h1)}</h1>
  <p class="lede">${escapeHtml(copy.intro)}</p>
  <div class="cta-row">
    <a class="btn-cta" href="/editor?theme=${copy.themeId}">Style my markdown like this</a>
    <a class="btn-ghost" href="/themes/${copy.themeId}">About the ${escapeHtml(theme.name)} theme</a>
  </div>
</section>

<section aria-label="Worked example">
  <h2>What goes in, what comes out</h2>
  <p class="answer">The markdown below is the raw input. Under it: the same document rendered in the ${escapeHtml(theme.name)} theme — embedded here exactly as the editor would export it.</p>
  <details class="md-source">
    <summary>See the markdown source</summary>
    <pre>${escapeHtml(sampleMarkdown)}</pre>
  </details>
  <figure class="sample-embed" role="group" aria-label="Rendered result in the ${escapeHtml(theme.name)} theme">
  <div class="mds-theme-${copy.themeId}"><div class="mds-content">
${sampleBody}
  </div></div>
  </figure>
  <p><a href="/samples/${copy.slug}.html">Open the exported file</a> — one self-contained HTML document, no external requests.</p>
</section>

${sections}

<section aria-label="More">
  <h2>More ways in</h2>
  <p class="answer">Browse <a href="/themes">all themes</a>, or go straight to <a href="/convert/markdown-to-pdf">markdown → PDF</a> / <a href="/convert/markdown-to-html">markdown → HTML</a>.</p>
</section>`
  return pageShell({
    title: copy.title,
    description: copy.description,
    path: `/use-cases/${copy.slug}`,
    main,
    extraCss: scopedSampleCss(theme),
  })
}
