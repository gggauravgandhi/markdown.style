// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { escapeHtml, pageShell, SITE_ORIGIN } from './shell'

describe('pageShell', () => {
  const html = pageShell({
    title: 'Test page — markdown.style',
    description: 'A test description that is long enough to look like real page copy for the assertions.',
    path: '/themes/paper',
    main: '<h1>Heading</h1><p>Body</p>',
    extraCss: '.mds-theme-test { color: red; }',
  })

  it('carries the marketing-page head invariants', () => {
    expect(html).toMatch(/^<!doctype html>/i)
    expect(html).toContain('<meta charset="utf-8">')
    expect(html).toContain(`<link rel="canonical" href="${SITE_ORIGIN}/themes/paper">`)
    expect(html).toContain('<meta property="og:title"')
    expect(html).toContain(`<meta property="og:url" content="${SITE_ORIGIN}/themes/paper">`)
    expect(html).toContain('<meta property="og:image" content="https://markdown.style/og.png">')
    expect(html).toContain('<meta name="description"')
  })

  it('is zero-JS and self-contained (inline css, no external origins)', () => {
    expect(html).not.toContain('<script')
    expect(html).toContain('<style>') // site.css inlined
    expect(html).not.toContain('href="/src/') // no dev-server asset links
    expect(html).not.toMatch(/(href|src)="https?:\/\/(?!markdown\.style[/"])/)
  })

  it('places extraCss in the head, before </style>', () => {
    const headEnd = html.indexOf('</head>')
    expect(html.indexOf('.mds-theme-test')).toBeGreaterThan(-1)
    expect(html.indexOf('.mds-theme-test')).toBeLessThan(headEnd)
  })

  it('has the site header, footer, trust badge, and the page main', () => {
    expect(html).toContain('class="brand"')
    expect(html).toContain('href="/editor"')
    expect(html).toContain('no upload')
    expect(html).toContain('<h1>Heading</h1>')
    expect(html).toContain('href="/privacy"')
  })

  it('escapeHtml escapes the dangerous four', () => {
    expect(escapeHtml('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
  })
})
