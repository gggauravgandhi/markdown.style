# X posts

## How to use this

Post 5 to 7 of these over two weeks. One every 2 to 3 days, never two in one day.
Rewrite a line before reposting anything so it does not look automated (this file is
not a script, it is a starting point). Replies drive reach more than the post does:
reply to everyone who responds for the first hour after posting.

---

## Pinned launch post

```
Every time I asked Claude to reformat an answer, it rewrote half the content too: new sentences, dropped points, drift. So I built markdown.style. Paste the markdown, pick a style, export a document. It changes how it looks, never what it says. Free, no signup, browser only.
```

275 characters. Media: screenshot of the editor split view, raw markdown on the left,
styled document on the right.

Why it works: names the exact failure (rewrite, not reformat) instead of a generic "I
built a tool" opener, then spells out the actual mechanic (paste, pick, export) so a
cold profile visitor knows what the product does without clicking through.

---

## The rest

### 1. Pain

```
ChatGPT hands you a clean doc. Then twenty minutes disappear making it sendable: tables that hold together, headings that look like headings, code that isn't Times New Roman. markdown.style does that part. Paste in, pick a style, export.
```

237 characters. Media: screenshot of the editor split view (source left, rendered
right).

Why it works: opens on a feeling this audience has had within the hour, names the
specific annoyances instead of a vague "formatting is hard," and resolves in one
plain sentence with no pitch language.

### 2. Shows, not tells: export mechanics

```
Paste markdown from ChatGPT or Claude. Pick a style. Export one self-contained HTML file: CSS inlined, no tracking scripts, nothing uploaded anywhere. Sanitized with DOMPurify, so the file you download is script-free, not just script-light.
```

240 characters. Media: gif of pasting markdown, picking a theme, and downloading the
HTML file.

Why it works: walks the actual flow instead of adjectives. "CSS inlined" and
"DOMPurify" are specific enough that a skeptical developer reads it as a real
architecture description, and the close (script-free vs. script-light) is a
distinction a technical reader will notice and appreciate.

### 3. Candid about a limitation: the PDF tradeoff

```
No one-click PDF button on markdown.style. On purpose. JS PDF libraries rasterize fonts, break ligatures, make text unselectable. The browser's print engine does better. Export goes: styled HTML, then Cmd+P, Save as PDF. Slower to explain, better output. Trade I'd make again.
```

276 characters. Media: none, or a screenshot of the browser's Save as PDF dialog over
a styled document.

Why it works: this audience has been burned by janky JS-generated PDFs and respects
an engineer who names a tradeoff instead of hiding a limitation behind marketing
language. Admitting the extra click up front, with the concrete reason, reads as
competence, not a missing feature.

### 4. Technical, verifiable

```
markdown.style's marketing pages ship:

- 0 JavaScript
- 0 third-party requests
- 0 backend

Generated at build time from one theme registry. Open devtools and sort by domain. Every request is the page itself. Nothing phones home.
```

234 characters. Media: screenshot of the devtools network tab sorted by domain, showing
only same-origin requests. Do NOT screenshot an "empty" network tab and do not claim one:
the page still loads its own document and stylesheet. The true, defensible claim is that
nothing third-party is fetched. Someone will open devtools to check, and being caught
overstating this costs more than the post gains.

Why it works: a list of zeros is scannable in a feed and each line is independently
checkable, which matters to an audience that opens devtools before retweeting
anything. The claim is scoped to the marketing pages, not the whole tool, so it holds
up under scrutiny.

### 5. Quotable, no link

```
You don't have a formatting problem. You have a "I asked it to fix the font and it rewrote my second paragraph" problem.
```

120 characters. Media: none, this line should stand alone.

Why it works: short, dry, reframes the real complaint in the user's own voice. No
product mention at all, so it earns attention on the observation, which is what gets
quote tweeted rather than scrolled past.

### 6. Candid about a real bug

```
Shipped "eight themes" in markdown.style's copy. Twice. Both times I'd added more themes and forgot the hardcoded number in a headline. Fixed it by deriving every count from the registry length instead, and added a test that fails the build if a stale number creeps back in.
```

274 characters. Media: none, or a screenshot of the failing test output for the
stale-count regression.

Why it works: a specific, admitted, twice-repeated mistake is far more convincing
than a vague "lessons learned" post. The fix was structural (single source of truth
plus a regression test), which is the kind of detail engineers respect, and it is a
verifiable bug pulled from the project's own history, not an invented anecdote.

---

## Media worth making

- **Theme switcher, live**: same markdown, cycling through a few styles in one clip.
  The fastest way to show the core value without a sentence of copy.
- **Component gallery on a theme page**: the page that shows every markdown element
  (tables, footnotes, code, math, a diagram) rendered side by side with its raw
  source. Good for the technical posts, it doubles as proof the renderer handles real
  AI output, not a cherry-picked snippet.
- **Before and after**: a raw ChatGPT markdown dump next to the exported document.
  Works for both pain posts and the pinned post.
- **Devtools network tab, empty**: for the zero-JS claim. Genuinely check-able, which
  is why it lands with this audience.

The og image already exists, so a plain link (no screenshot attached) still renders a
real card when shared. Attach media only when it adds something a link preview does
not already show.

---

## Do not

- No em dashes. Ever. It reads as AI-written to this audience, and a repo test fails
  the build on one.
- No engagement bait ("what do you think?", fake urgency, thread emoji).
- No hashtag stuffing. One or two, only if they genuinely aid discovery, most of
  these posts need zero.
- Do not tag OpenAI, Anthropic, or Google, or imply any partnership or integration.
  The product reads their markdown, nothing more.
- Do not claim a one-click PDF download. There is no PDF export button. Export goes
  through the browser's own print dialog (Save as PDF). Say so plainly if it comes
  up, do not soften it into something it is not.
- Do not claim the tool "never makes a network request," full stop. If a user's
  markdown references a remote image, the browser fetches it, same as any page
  would. Scope privacy claims to what the tool itself does: no upload, no tracking,
  no backend.
