import type { ConvertCopy } from './copy'
import { convertPages, useCases } from './copy'
import { pageSchema } from './schema'
import { escapeHtml, pageShell } from './shell'

export function buildConvertPage(copy: ConvertCopy): string {
  const other = convertPages.find(c => c.slug !== copy.slug)!
  const sections = copy.sections
    .map(s => `<section><h2>${escapeHtml(s.q)}</h2><p class="answer">${escapeHtml(s.a)}</p></section>`)
    .join('\n')
  const workedExamples = useCases
    .map(u => `<li><a href="/use-cases/${u.slug}">${escapeHtml(u.h1)}</a></li>`)
    .join('\n')
  const main = `<section class="hero" aria-label="Introduction" style="border-top:0">
  <h1>${escapeHtml(copy.h1)}</h1>
  <p class="lede">${escapeHtml(copy.intro)}</p>
  <div class="cta-row">
    <a class="btn-cta" href="/editor">Open the editor</a>
    <a class="btn-ghost" href="/themes">Browse all themes</a>
  </div>
</section>

${sections}

<section aria-label="Worked examples">
  <h2>Worked examples</h2>
  <ul>
${workedExamples}
  </ul>
  <p class="answer">Prefer the other output? <a href="/convert/${other.slug}">${escapeHtml(other.h1)}</a>.</p>
</section>`
  const path = `/convert/${copy.slug}`
  return pageShell({
    title: copy.title,
    description: copy.description,
    path,
    main,
    // no middle crumb: /convert is not a route, and a breadcrumb item must resolve
    jsonLd: pageSchema({ path, title: copy.title, description: copy.description, trail: [{ name: copy.h1 }] }),
  })
}
