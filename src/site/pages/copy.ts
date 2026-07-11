/** SEO copy for the generated pages. Answer-first; question-led H2s (spec §6). */

export interface ThemeCopy {
  id: string
  title: string
  description: string
  h1: string
  intro: string
  whoItSuits: string
  pairWith: readonly string[]
}

export interface UseCaseCopy {
  slug: string
  themeId: string
  title: string
  description: string
  h1: string
  intro: string
  sections: readonly { q: string; a: string }[]
}

export interface ConvertCopy {
  slug: string
  title: string
  description: string
  h1: string
  intro: string
  sections: readonly { q: string; a: string }[]
}

export const themeCopy: readonly ThemeCopy[] = [
  {
    id: 'paper',
    title: 'Paper theme — style markdown as a warm, book-like report — markdown.style',
    description: 'See a full report rendered in Paper: a warm book serif for AI-written documents meant to be read slowly. Free, in your browser.',
    h1: 'Paper — a warm book serif for reports meant to be read',
    intro: 'Paper sets your markdown like a well-made hardcover: a warm serif, generous line height, and quiet rules. Below is a complete sample report rendered in it — exactly what you would download.',
    whoItSuits: 'Long-form reports, essays, and research summaries — anything an AI wrote that a human should enjoy reading. If the document will be printed and read on paper, start here.',
    pairWith: ['editorial', 'scholar'],
  },
  {
    id: 'slate',
    title: 'Slate theme — clean product-doc styling for markdown — markdown.style',
    description: 'See a full report rendered in Slate: modern product-doc sans styling for specs, status reports, and technical summaries. Free, in your browser.',
    h1: 'Slate — clean product-doc styling for technical reports',
    intro: 'Slate is the neutral, engineered look of good product documentation: a modern sans, blue accents, tables that behave. Below is a complete sample report rendered in it.',
    whoItSuits: 'Specs, status updates, PRDs, and technical summaries — the workhorse theme when the document just needs to look professionally handled.',
    pairWith: ['carbon', 'swiss'],
  },
  {
    id: 'carbon',
    title: 'Carbon theme — dark technical styling that prints light — markdown.style',
    description: 'See a full report rendered in Carbon: a dark, terminal-adjacent theme for code-heavy markdown that automatically prints on white. Free, in your browser.',
    h1: 'Carbon — dark technical styling that prints light',
    intro: 'Carbon reads like a good terminal: dark background, low glare, headings prefixed like markdown source. Print it and it flips to a light palette automatically. Below is a complete sample rendered in it.',
    whoItSuits: 'Engineering docs, runbooks, code-heavy AI answers, and anything an engineer reads on screen. The print flip means you never hand someone a black rectangle of toner.',
    pairWith: ['slate', 'contrast'],
  },
  {
    id: 'swiss',
    title: 'Swiss theme — minimal typographic markdown styling — markdown.style',
    description: 'See a full report rendered in Swiss: minimal typographic design where whitespace does the work. Free, in your browser.',
    h1: 'Swiss — minimal typography where whitespace does the work',
    intro: 'Swiss strips everything back to type: Helvetica, uppercase labels, one red line. No boxes, no decoration. Below is a complete sample report rendered in it.',
    whoItSuits: 'Strategy memos, design documents, and briefs for readers who notice typography. When in doubt between “more” and “less”, Swiss is the “less”.',
    pairWith: ['contrast', 'slate'],
  },
  {
    id: 'contrast',
    title: 'Contrast theme — bold poster styling for markdown — markdown.style',
    description: 'See a full report rendered in Contrast: hard rules, big type, poster energy for documents that need to land. Free, in your browser.',
    h1: 'Contrast — bold poster energy for documents that shout',
    intro: 'Contrast is zero subtlety by design: black rules, uppercase headings, a slab of accent color. Below is a complete sample report rendered in it.',
    whoItSuits: 'Pitches, one-pagers, launch briefs — short documents that need to be impossible to skim past. Less suited to 40-page reports.',
    pairWith: ['swiss', 'pop'],
  },
  {
    id: 'editorial',
    title: 'Editorial theme — elegant magazine styling for markdown — markdown.style',
    description: 'See a full report rendered in Editorial: display serif headings, pull-quote blockquotes, magazine air. Free, in your browser.',
    h1: 'Editorial — an elegant magazine serif with display headings',
    intro: 'Editorial styles your markdown like a feature article: display serif headings, blockquotes that read as pull quotes, air between everything. Below is a complete sample rendered in it.',
    whoItSuits: 'Newsletters, essays, long reads, and public-facing writeups — documents with an audience rather than a recipient.',
    pairWith: ['paper', 'scholar'],
  },
  {
    id: 'scholar',
    title: 'Scholar theme — academic styling for markdown with footnotes — markdown.style',
    description: 'See a full report rendered in Scholar: justified text, a centered title, and footnotes that feel at home. Free, in your browser.',
    h1: 'Scholar — academic restraint, footnotes at home',
    intro: 'Scholar is the quiet academic register: justified body text, a centered title block, restrained navy accents. Footnotes — which LLMs love to emit — finally look intentional. Below is a complete sample rendered in it.',
    whoItSuits: 'Papers, literature reviews, citation-heavy research answers, and coursework. If the document has footnotes, Scholar was built for it.',
    pairWith: ['paper', 'editorial'],
  },
  {
    id: 'pop',
    title: 'Pop theme — colorful, friendly markdown styling — markdown.style',
    description: 'See a full report rendered in Pop: rounded corners, warm tints, wavy links — a friendly face for internal docs. Free, in your browser.',
    h1: 'Pop — colorful and friendly, rounded and warm',
    intro: 'Pop keeps things human: rounded corners, a warm background tint, wavy link underlines. Serious content, unserious chrome. Below is a complete sample report rendered in it.',
    whoItSuits: 'Team updates, internal newsletters, onboarding docs — places where “approachable” beats “authoritative”.',
    pairWith: ['contrast', 'paper'],
  },
  {
    id: 'boardroom',
    title: 'Boardroom theme — corporate report styling for markdown — markdown.style',
    description: 'See a full report rendered in Boardroom: navy corporate styling for board packs, client reports, and executive summaries. Free, in your browser.',
    h1: 'Boardroom — corporate polish for reports that go up the chain',
    intro: 'Boardroom dresses your markdown for the meeting that matters: a navy-anchored sans, filled table headers, and a double-ruled title. Below is a complete sample report rendered in it.',
    whoItSuits: 'Board packs, client deliverables, and executive summaries — documents where the reader judges rigor by presentation before reading a word.',
    pairWith: ['quarterly', 'slate'],
  },
  {
    id: 'ledger',
    title: 'Ledger theme — financial-statement styling for markdown — markdown.style',
    description: 'See a full report rendered in Ledger: accounting-style rules, tabular numerals, and closing lines for finance-flavored documents. Free, in your browser.',
    h1: 'Ledger — statement styling with numerals that line up',
    intro: 'Ledger borrows the discipline of a financial statement: tabular numerals, hairline rules, and a closing line under every table. Below is a complete sample rendered in it.',
    whoItSuits: 'Budget summaries, financial reviews, and quantitative status reports — any document where columns of numbers must read cleanly.',
    pairWith: ['boardroom', 'swiss'],
  },
  {
    id: 'briefing',
    title: 'Briefing theme — consulting-brief styling for markdown — markdown.style',
    description: 'See a full report rendered in Briefing: numbered sections and decisive charcoal-and-red styling for recommendations that need a verdict. Free, in your browser.',
    h1: 'Briefing — numbered sections that walk the reader to a verdict',
    intro: 'Briefing structures your markdown like a consulting deliverable: auto-numbered sections, a heavy title, and one signal color used sparingly. Below is a complete sample rendered in it.',
    whoItSuits: 'Recommendations, decision memos, and strategy briefs — documents built around a numbered argument rather than a narrative.',
    pairWith: ['boardroom', 'contrast'],
  },
  {
    id: 'memo',
    title: 'Memo theme — classic interoffice styling for markdown — markdown.style',
    description: 'See a full report rendered in Memo: centered memorandum title, small-caps headings, and typewriter code on warm paper. Free, in your browser.',
    h1: 'Memo — the interoffice classic, typeset properly',
    intro: 'Memo gives your markdown the calm authority of a well-run office: a ruled memorandum title, small-caps section heads, and typewriter code. Below is a complete sample rendered in it.',
    whoItSuits: 'Internal updates, policy notes, and one-page decisions — short documents that should feel official without feeling corporate.',
    pairWith: ['ledger', 'paper'],
  },
  {
    id: 'quarterly',
    title: 'Quarterly theme — annual-report styling for markdown — markdown.style',
    description: 'See a full report rendered in Quarterly: display serif headlines, burgundy rules, and annual-report generosity for milestone documents. Free, in your browser.',
    h1: 'Quarterly — annual-report elegance for milestone documents',
    intro: 'Quarterly sets your markdown like the front section of a good annual report: a display serif, burgundy overlines, and room to breathe. Below is a complete sample rendered in it.',
    whoItSuits: 'Quarterly reviews, investor updates, and year-in-review documents — reporting that doubles as a keepsake.',
    pairWith: ['boardroom', 'editorial'],
  },
  {
    id: 'terminal',
    title: 'Terminal theme — amber CRT styling for markdown — markdown.style',
    description: 'See a full report rendered in Terminal: amber-on-black monospace styling that flips to a light palette when printed. Free, in your browser.',
    h1: 'Terminal — amber phosphor for documents that live in the shell',
    intro: 'Terminal renders your markdown like a well-kept CRT: amber monospace on near-black, prompt-prefixed headings, and a print stylesheet that lands on paper in ink-friendly light. Below is a complete sample rendered in it.',
    whoItSuits: 'Runbooks, CLI documentation, and incident notes — documents whose readers already have a terminal open. Printing flips it light automatically.',
    pairWith: ['carbon', 'manual'],
  },
  {
    id: 'blueprint',
    title: 'Blueprint theme — engineering-drawing styling for markdown — markdown.style',
    description: 'See a full report rendered in Blueprint: drafting blues, boxed title, and uppercase annotations for specs and technical plans. Free, in your browser.',
    h1: 'Blueprint — drafting-table discipline for specs and plans',
    intro: 'Blueprint borrows the visual language of an engineering drawing: a boxed title block, uppercase mono annotations, and drafting blues on cool paper. Below is a complete sample rendered in it.',
    whoItSuits: 'Specs, architecture documents, and implementation plans — writing that describes something to be built and benefits from looking like it.',
    pairWith: ['slate', 'manual'],
  },
  {
    id: 'manual',
    title: 'Manual theme — reference-manual styling for markdown — markdown.style',
    description: 'See a full report rendered in Manual: man-page bones, bold sans headings, and code blocks that lead the page. Free, in your browser.',
    h1: 'Manual — reference styling with man-page bones',
    intro: 'Manual sets your markdown like documentation that has shipped with software for decades: uppercase section heads, a serif reading measure, and code that stands proud of the prose. Below is a complete sample rendered in it.',
    whoItSuits: 'API references, how-to guides, and README-grade documentation — anything a reader consults rather than reads cover to cover.',
    pairWith: ['slate', 'terminal'],
  },
  {
    id: 'thesis',
    title: 'Thesis theme — dissertation styling for markdown — markdown.style',
    description: 'See a full report rendered in Thesis: Times lineage, numbered sections, and examiner-grade sobriety. Free, in your browser.',
    h1: 'Thesis — dissertation formality with numbered sections',
    intro: 'Thesis sets your markdown the way graduate schools expect: a Times lineage, automatically numbered sections, justified text, and rules that know when to stop. Below is a complete sample rendered in it.',
    whoItSuits: 'Dissertations, formal literature reviews, and committee-bound documents — writing that will be judged by people who notice margins.',
    pairWith: ['scholar', 'preprint'],
  },
  {
    id: 'preprint',
    title: 'Preprint theme — LaTeX-style markdown rendering — markdown.style',
    description: 'See a full report rendered in Preprint: Computer Modern spirit, booktabs tables, and hyperref-blue links without touching LaTeX. Free, in your browser.',
    h1: 'Preprint — the LaTeX look without the LaTeX',
    intro: 'Preprint borrows what people love about a good arXiv paper: the Computer Modern voice, centered booktabs tables, and quiet blue links. Below is a complete sample rendered in it.',
    whoItSuits: 'Research notes, paper drafts, and technical writeups for readers who live on arXiv — when the content is markdown but the audience expects LaTeX.',
    pairWith: ['thesis', 'scholar'],
  },
  {
    id: 'notebook',
    title: 'Notebook theme — lab-notebook styling for markdown — markdown.style',
    description: 'See a full report rendered in Notebook: warm ruled paper, dashed annotation boxes, and ballpoint-blue accents. Free, in your browser.',
    h1: 'Notebook — a lab notebook that keeps itself legible',
    intro: 'Notebook styles your markdown like a well-kept lab book: warm paper, ballpoint-blue rules, and dashed boxes where observations get taped in. Below is a complete sample rendered in it.',
    whoItSuits: 'Experiment logs, research journals, and working notes — documents that grow daily and still need to read cleanly at review time.',
    pairWith: ['lecture', 'slate'],
  },
  {
    id: 'lecture',
    title: 'Lecture theme — lecture-notes styling for markdown — markdown.style',
    description: 'See a full report rendered in Lecture: crisp humanist sans, tinted key-point blocks, and headings that underline themselves. Free, in your browser.',
    h1: 'Lecture — notes that teach as clearly as they read',
    intro: 'Lecture turns your markdown into the notes everyone borrows before the exam: a crisp humanist sans, tinted key-point blocks, and short accent underlines that keep sections scannable. Below is a complete sample rendered in it.',
    whoItSuits: 'Course notes, tutorials, and study guides — explanatory writing where the key point must be findable in three seconds.',
    pairWith: ['notebook', 'scholar'],
  },
  {
    id: 'gazette',
    title: 'Gazette theme — newspaper styling for markdown — markdown.style',
    description: 'See a full report rendered in Gazette: double-ruled masthead, condensed headlines, and newsroom density. Free, in your browser.',
    h1: 'Gazette — front-page energy for dense reporting',
    intro: 'Gazette lays your markdown out like a broadsheet front page: a double-ruled masthead title, condensed bold headlines, and a measure tuned for density. Below is a complete sample rendered in it.',
    whoItSuits: 'Newsletters, digests, and weekly roundups — documents that carry many stories at once and want the reader to skim like a front page.',
    pairWith: ['editorial', 'columnist'],
  },
  {
    id: 'novella',
    title: 'Novella theme — manuscript styling for markdown — markdown.style',
    description: 'See a full report rendered in Novella: serene serif, first-line indents, and chapter ornaments with nothing else in the way. Free, in your browser.',
    h1: 'Novella — manuscript serenity for writing that flows',
    intro: 'Novella removes everything between the reader and the prose: indented paragraphs, centered chapter heads under a small ornament, and a warm page. Below is a complete sample rendered in it.',
    whoItSuits: 'Fiction drafts, essays, and personal writing — longform where the typography should disappear into the reading.',
    pairWith: ['paper', 'editorial'],
  },
  {
    id: 'columnist',
    title: 'Columnist theme — opinion-page styling for markdown — markdown.style',
    description: 'See a full report rendered in Columnist: oversized pull quotes, byline italics, and an argument that looks like it belongs in print. Free, in your browser.',
    h1: 'Columnist — opinion-page conviction for arguments in print',
    intro: 'Columnist treats every blockquote as a pull quote: oversized, italic, and ruled in your accent color, with byline-style italics under the headline. Below is a complete sample rendered in it.',
    whoItSuits: 'Op-eds, position pieces, and persuasive memos — writing built around quotable lines that deserve to be displayed, not buried.',
    pairWith: ['gazette', 'quarterly'],
  },
  {
    id: 'mist',
    title: 'Mist theme — hairline minimal styling for markdown — markdown.style',
    description: 'See a full report rendered in Mist: feather-light rules, a soft gray-blue voice, and hierarchy you feel more than see. Free, in your browser.',
    h1: 'Mist — minimalism at the hairline weight',
    intro: 'Mist keeps everything at a whisper: hairline rules, a light title weight, and gray-blue restraint. Below is a complete sample rendered in it.',
    whoItSuits: 'Design documents, product notes, and portfolios of thought — for readers who consider heavy borders a personal insult.',
    pairWith: ['swiss', 'airy'],
  },
  {
    id: 'mono',
    title: 'Mono theme — typewriter monospace styling for markdown — markdown.style',
    description: 'See a full report rendered in Mono: one monospace family, two weights, underlined links, and no decoration at all. Free, in your browser.',
    h1: 'Mono — one family, two weights, nothing else',
    intro: 'Mono is the plaintext ideal taken seriously: a single monospace family for everything, underlined links, and ruled headings. Below is a complete sample rendered in it.',
    whoItSuits: 'Changelogs, RFCs, and engineering notes — documents whose authors trust content over costume.',
    pairWith: ['contrast', 'terminal'],
  },
  {
    id: 'airy',
    title: 'Airy theme — whitespace-first styling for markdown — markdown.style',
    description: 'See a full report rendered in Airy: a small measured text block, oversized margins, and section labels in tracked-out caps. Free, in your browser.',
    h1: 'Airy — whitespace doing the heavy lifting',
    intro: 'Airy gives your markdown room: an unhurried line height, tracked-out section labels, and margins most themes would call wasteful. Below is a complete sample rendered in it.',
    whoItSuits: 'Manifestos, letters, and short strategy notes — writing that gains authority from calm. Not the theme for a 40-page appendix.',
    pairWith: ['mist', 'swiss'],
  },
  {
    id: 'neon',
    title: 'Neon theme — electric dark styling for markdown — markdown.style',
    description: 'See a full report rendered in Neon: cyan and magenta on violet-black, flipping to a printable light palette on paper. Free, in your browser.',
    h1: 'Neon — electric dark for documents with a pulse',
    intro: 'Neon runs your markdown through the night: cyan headings, magenta accents, violet-black depth, and a print stylesheet that lands light. Below is a complete sample rendered in it.',
    whoItSuits: 'Launch notes, event recaps, and gaming or creative-tech writeups — documents meant to be read on a screen with the lights down.',
    pairWith: ['pop', 'terminal'],
  },
  {
    id: 'poster',
    title: 'Poster theme — display-type styling for markdown — markdown.style',
    description: 'See a full report rendered in Poster: massive uppercase headlines, thick black rules, and reversed pull blocks. Free, in your browser.',
    h1: 'Poster — headlines that read across the room',
    intro: 'Poster typesets your markdown like something meant for a wall: enormous uppercase headlines, six-pixel rules, and blockquotes reversed out in black. Below is a complete sample rendered in it.',
    whoItSuits: 'Announcements, manifestos, and one-page briefs — short documents that win or lose in the first two seconds.',
    pairWith: ['contrast', 'pop'],
  },
  {
    id: 'riso',
    title: 'Riso theme — risograph two-ink styling for markdown — markdown.style',
    description: 'See a full report rendered in Riso: pink and blue inks overprinting on cream stock, straight from the community print shop. Free, in your browser.',
    h1: 'Riso — two inks, one very charming document',
    intro: 'Riso borrows the community print-shop look: pink headings, blue working text, dotted rules, and cream stock that makes both inks sing. Below is a complete sample rendered in it.',
    whoItSuits: 'Zines, event programs, community updates, and side-project docs — writing that should feel hand-made and a little joyful.',
    pairWith: ['pop', 'retro'],
  },
  {
    id: 'retro',
    title: 'Retro theme — warm 70s styling for markdown — markdown.style',
    description: 'See a full report rendered in Retro: burnt orange, mustard rules, rounded corners, and cream paper straight from 1974. Free, in your browser.',
    h1: 'Retro — 1970s warmth for documents with personality',
    intro: 'Retro pours your markdown a glass of orange juice in 1974: burnt-orange headings, mustard underlines, rounded blocks, and cream paper. Below is a complete sample rendered in it.',
    whoItSuits: 'Newsletters, personal sites turned PDFs, and culture-team documents — anywhere warmth beats formality.',
    pairWith: ['riso', 'paper'],
  },
]

export const useCases: readonly UseCaseCopy[] = [
  {
    slug: 'chatgpt-report',
    themeId: 'slate',
    title: 'Turn a ChatGPT research answer into a styled report — markdown.style',
    description: 'Paste the markdown ChatGPT gives you, pick a theme, and send a designed report instead of a wall of text. Worked example inside. Free, no upload.',
    h1: 'Turn a ChatGPT research answer into a report you can send',
    intro: 'Ask ChatGPT for research and it answers in clean markdown — headings, tables, recommendations. Paste that answer here and it becomes a designed report. Below is a real example: the exact markdown in, the styled result out.',
    sections: [
      {
        q: 'How do I get the markdown out of ChatGPT?',
        a: 'Use the copy button under the answer — it copies markdown, not plain text. If the answer came out as prose, reply “format that as a markdown report with headings and tables” and copy the result.',
      },
      {
        q: 'Can I change how it looks before sending?',
        a: 'Yes — the editor previews live in any of the 30 themes, and you can adjust the accent color, font size, and page width. Export is a self-contained HTML file or a print-to-PDF.',
      },
    ],
  },
  {
    slug: 'meeting-notes',
    themeId: 'paper',
    title: 'Style AI meeting notes into a clean, shareable document — markdown.style',
    description: 'AI notetakers produce markdown — decisions, action items, task lists. Style them into a document worth circulating. Worked example inside. Free, no upload.',
    h1: 'Style AI meeting notes into a document worth circulating',
    intro: 'Every AI notetaker exports the same thing: markdown with decisions, action items, and checkboxes. Paste it here and circulate something that looks deliberate instead. Below is a real example, notes in, document out.',
    sections: [
      {
        q: 'Do task lists and checkboxes render?',
        a: 'Yes — GitHub-style task lists render as real checkboxes, checked and unchecked, in every theme. Action items survive the trip from notetaker to document.',
      },
      {
        q: 'What is the fastest path from meeting to PDF?',
        a: 'Paste the notes, pick a theme (Paper suits minutes), hit Print, and choose “Save as PDF”. Two clicks after paste — no account, nothing uploaded.',
      },
    ],
  },
  {
    slug: 'readme',
    themeId: 'carbon',
    title: 'Preview and style a README outside GitHub — markdown.style',
    description: 'See a README rendered with syntax-highlighted code and real tables outside GitHub, then export it as styled HTML or PDF. Free, no upload.',
    h1: 'Preview a README as a styled document, outside GitHub',
    intro: 'A README is markdown at its densest: code fences, tables, install commands. Paste one here to see it as a designed document — for docs sites, PDF handoffs, or just reading it properly. Below is a real example rendered in Carbon.',
    sections: [
      {
        q: 'Is code syntax-highlighted?',
        a: 'Yes — fenced code blocks are highlighted at render time (Shiki, the same highlighter VS Code uses) in a palette matched to the theme, and the highlighting survives into the exported HTML and PDF.',
      },
      {
        q: 'Can I use this for docs that live outside a repo?',
        a: 'That is the point — the export is one self-contained HTML file with no external requests, so it can be attached, hosted anywhere, or printed without touching GitHub.',
      },
    ],
  },
]

export const convertPages: readonly ConvertCopy[] = [
  {
    slug: 'markdown-to-pdf',
    title: 'Convert markdown to PDF — styled, free, in your browser — markdown.style',
    description: 'Paste markdown, pick one of 30 themes, print to PDF. Tables, code, math, and diagrams styled properly — free, no upload, no watermark.',
    h1: 'Convert markdown to PDF without the plain-white look',
    intro: 'Paste your markdown, pick a theme, press Print, and choose “Save as PDF” — that is the whole workflow. The difference from other converters is design: a real theme styles your tables, code, and headings, with print CSS that keeps them intact across page breaks.',
    sections: [
      {
        q: 'How do I convert markdown to a PDF for free?',
        a: 'Open the editor, paste your markdown, and press “Print or save as PDF”. Your browser’s print dialog does the conversion locally — no account, no upload, no watermark, nothing installed.',
      },
      {
        q: 'Why do most markdown-to-PDF converters look bad?',
        a: 'Because they convert without designing: default fonts, blue links, tables that overflow the page, code blocks sliced in half by page breaks. Here a theme styles every element, and print rules keep tables and code unbroken.',
      },
      {
        q: 'Does it handle tables, code, math, and diagrams?',
        a: 'Yes — GitHub-flavored tables and task lists, syntax-highlighted code, KaTeX math, and Mermaid diagrams all render and print. Exactly the constructs LLM answers are full of.',
      },
    ],
  },
  {
    slug: 'markdown-to-html',
    title: 'Convert markdown to a styled, self-contained HTML file — markdown.style',
    description: 'Turn markdown into one portable HTML file with a real theme, inline styles, and zero external requests. Free, no upload.',
    h1: 'Convert markdown to a single styled HTML file',
    intro: 'Paste markdown, pick a theme, and download one self-contained HTML file: styles inlined, no external requests, opens identically everywhere. It is the portable version of your document — attach it, host it, or hand it off.',
    sections: [
      {
        q: 'What does “self-contained” mean here?',
        a: 'Everything the document needs — theme CSS, syntax-highlighting colors, even math fonts — is embedded in the one file. No CDN links, no tracking, nothing to break when the file moves.',
      },
      {
        q: 'When should I pick HTML over PDF?',
        a: 'HTML when the reader might view on a screen, resize, or copy from the document; PDF when layout must be frozen for print or formal delivery. The same themed render produces both, so you can ship either.',
      },
    ],
  },
]
