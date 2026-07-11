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
        a: 'Yes — the editor previews live in any of the eight themes, and you can adjust the accent color, font size, and page width. Export is a self-contained HTML file or a print-to-PDF.',
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
    description: 'Paste markdown, pick one of eight themes, print to PDF. Tables, code, math, and diagrams styled properly — free, no upload, no watermark.',
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
