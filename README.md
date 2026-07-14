# markdown.style

Turn AI-generated markdown into a polished document, entirely in your browser.

**[markdown.style](https://markdown.style)**

Paste the markdown ChatGPT, Claude, Gemini, or Copilot gave you, pick a document style, and export. No account, no upload, no usage limits. Your document never leaves the browser.

## Why

Asking an LLM to convert its own answer into designed HTML or a PDF works once. Then you change a heading, dislike the layout, or need a second version, and you are prompting again. markdown.style keeps the content editable and handles presentation locally, so every revision costs nothing.

## What it does

- A library of document styles across six categories: business, technical, academic, editorial, minimal, and bold. The live count is whatever `src/themes/registry.ts` holds; see the [theme gallery](https://markdown.style/themes).
- Renders the markdown AI actually produces: GitHub-flavored tables, task lists, footnotes, syntax-highlighted code, KaTeX math, Mermaid diagrams, images, and nested lists.
- Four exports, all local: a self-contained HTML file, the rendered HTML copied to your clipboard, print or save as PDF through the browser's print dialog, and your edited markdown.
- Tune the accent color and font size. The theme owns the typography.

There is no one-click PDF download. The browser's own print dialog is the PDF path, and it produces better text output than any client-side PDF library.

## Privacy

Parsing, previewing, editing, and exporting all happen in your browser. Nothing is uploaded to markdown.style, there is no account, and there are no analytics or third-party scripts on any page.

One honest caveat: if your markdown references a remote image or link, your browser will fetch it from wherever it is hosted, exactly as any browser would.

## Development

Requires [bun](https://bun.sh).

```bash
bun install
bun run dev        # http://localhost:5173
bun run test       # vitest. NEVER bare `bun test`: that runs Bun's own runner and fails
bunx tsc --noEmit  # typecheck
bun run build      # vite build, then the static page generator
```

`bun run build` runs `vite build` and then `scripts/build-pages.ts`, which renders every theme page, the themes hub, the use-case and convert pages, and the three crawl files (`sitemap.xml`, `robots.txt`, `llms.txt`). All of it derives from the theme registry and the route table, so nothing is hand-maintained and counts cannot go stale.

## Architecture

Three layers, strictly separated:

- **Render pipeline** (`src/pipeline/`): markdown-it, then DOMPurify, then assemble a self-contained document. Its output is script-free and dependency-free. It is the product.
- **Editor** (`src/app/`): vanilla TypeScript and CodeMirror 6. No framework.
- **Static site** (`index.html`, `src/site/`): the marketing and SEO pages, generated at build time and shipped with zero JavaScript.

Themes live in `src/themes/`. Each is a single standalone CSS file plus one registry entry.

## Adding a theme

1. Write `src/themes/<id>.css`. It must define `--mds-bg`, `--mds-fg`, `--mds-font-body`, and `--mds-font-heading`, and include an `@media print` block.
2. Add the registry entry in `src/themes/registry.ts` and the page copy in `src/site/pages/copy.ts`.
3. Run the suite. The end-to-end render test covers every registry entry automatically.

See [CLAUDE.md](CLAUDE.md) for the full set of invariants the tests enforce.

## License

[MIT](LICENSE). Use it, fork it, ship it.
