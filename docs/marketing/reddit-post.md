# Reddit launch post

## The post

**Title options.** Pick one. Do not reuse the same title across subreddits.

- I got tired of asking Claude to reformat its own answers, so I built something that styles markdown into a real document
- Paste AI markdown, pick a style, get a document. No signup, nothing uploaded.
- Free tool that turns the markdown ChatGPT and Claude give you into something you can actually send someone

**Body:**

Every time I asked Claude for a technical doc or a report I got back perfectly good markdown, and then spent
twenty minutes trying to make it look like something I could send to another human. Ask it for HTML and you
get a wall of inline styles. Ask it to fix the layout and it regenerates the whole thing, quietly rewording
your content on the way. Paste it into Google Docs and the tables die.

So I built markdown.style. Paste the markdown, pick a document style, export. That is the whole tool.

https://markdown.style

What it does:

- Renders the things AI output is actually full of: tables, footnotes, syntax highlighted code, KaTeX math,
  Mermaid diagrams, task lists.
- A library of document styles across six categories, because a PRD should not look like a research paper,
  and an exec report should not look like a terminal.
- Export a self contained HTML file, copy the rendered HTML, or print to PDF. You can also save your edited
  markdown back out.
- Free, no signup, no limits. Nothing is uploaded. Parsing, rendering and export all happen in your browser,
  and you can confirm that in the network tab.
- MIT licensed, source is on GitHub: https://github.com/gggauravgandhi/markdown.style

Being upfront about the limits, because you will find them anyway:

- PDF goes through your browser's print dialog (Save as PDF). There is no one click PDF download. I tried the
  JavaScript PDF libraries and the text output was noticeably worse than what Chrome's own print engine does
  for free, so I left it alone.
- It is a styling and export tool, not a writing app. The editing is basic on purpose. It is not trying to be
  Obsidian.
- If your markdown references a remote image, your browser fetches that image the same way any page would.
  Everything else stays local.

I built it because the loop of "generate the content once, then keep spending tokens restyling it" is a
stupid way to spend money. Generate once, restyle as often as you want, locally.

Keen to hear what breaks. Especially whether the print output holds together on documents longer than the
ones I tested.

---

## Where to post

Read each subreddit's rules first. Several of these remove a self promo post on sight if you have no history
in the sub, and a removed post is worse than no post. Comment in a few threads before you post yours.

### Post here first

| Subreddit | Why it fits | Watch out for |
|---|---|---|
| r/SideProject | Built for exactly this. Friendly to solo launches. | Low friction. Just do not spam. |
| r/InternetIsBeautiful | A free, no signup, genuinely useful web tool is the entire premise of the sub. | Strict. No signup walls, no marketing voice. High reward if it lands. |
| r/ChatGPT | Your users are here, and the pain (reformatting AI output) is native to them. | Self promo is tolerated when the tool is free and useful. Lead with the problem, not the link. |
| r/ClaudeAI | Same as above, smaller and friendlier. | Same. |
| r/coolgithubprojects | Good fit. MIT licensed, public repo. | Needs the repo link in the post. |

### Second wave, a few days later

| Subreddit | Why it fits | Watch out for |
|---|---|---|
| r/webdev | Devs like the zero backend, zero JavaScript, client side angle. | Self promo is usually restricted to Showoff Saturday. Check the current rule. |
| r/productivity | The "stop redoing work you already paid for" angle plays well. | Keep it about the workflow, not the tool. |
| r/Markdown | Small, but exactly on topic. | Low traffic, easy win. |
| r/OpenAI | Overlaps r/ChatGPT. Post several days apart, never the same day. | Do not paste identical text. |
| r/artificial | Broader AI audience. | Less tool friendly. Frame it as a workflow fix. |
| r/SaaS or r/EntrepreneurRideAlong | Only if you rewrite it as a build story. | These want the story and the numbers, not the pitch. |

### Not Reddit, but the same launch week

- **Hacker News**, as a Show HN. Suggested title: `Show HN: markdown.style, turn AI markdown into a styled
  document in the browser`. HN will care about the no backend, no upload, script free output. HN will ask about the license
  immediately, and the answer is MIT.
- **Product Hunt**. The og image exists now, so the card renders. Add a few screenshots.
- **Lobsters**, only if you have an invite. Tag: `web`.
- **Indie Hackers** and **Dev.to**. Both accept the Medium post with light edits.

### Practical notes

- Do not post to more than two subreddits in one day. The spam filter and the mods both notice.
- Reply to every comment for the first few hours. That is what decides whether the post survives.
- Rewrite the opening paragraph for each subreddit. Copy pasting one post across subs is the fastest way to
  get filtered.
- No em dashes in the post. They read as AI written, and this audience is primed to spot it.
