# Reddit post: I built this and use it every day

A first-person "why I made it and how I use it" post. Readability was checked with a script:
Flesch reading ease sits above 60, so it reads easy and does not sound like a press release.

Post it AFTER you have some comment history in a sub. A cold account dropping a link gets removed.
Rewrite the first line for each subreddit so it does not look copy-pasted.

---

## Title options

Pick one. Do not reuse the same title across subs.

- I got tired of asking AI to reformat its own answers, so I built a tool for it. I use it every day.
- I made a free tool that turns AI markdown into a real document. Here is why, and how I use it.
- My AI kept rewriting my content when I asked it to fix the layout. So I built this.

---

## The post

I use ChatGPT and Claude all day. They write great stuff. The problem starts when I need to send it to someone.

What they give back is markdown. Plain text with stars and dashes in it. What I need is a document. So for months I did the dumb thing. I asked the AI to format it too.

That never went well.

I would ask for HTML. It gave me a wall of code. I would ask it to fix the design. It rewrote my content while it was at it. I would fix one typo in the source, and every style choice reset. Each round cost me tokens, time, and sometimes a sentence I liked.

So I built markdown.style. It does one job. You paste the markdown, pick a style, and export. It changes how the words look, never what they say.

Here is how I use it now, from the first day I had it working:

- I draft in ChatGPT or Claude like always.
- I paste the result into markdown.style.
- I pick a style that fits. A report does not look like a research paper. A spec does not look like a memo.
- I tweak the accent color and font size if I feel like it.
- I export. A clean PDF, or a single HTML file I can send.

That is it. I generate the words once. I style them as many times as I want, for free, without asking the model again.

A few honest notes, because you will find them anyway:

- The PDF goes through your browser's print box (Save as PDF). There is no one-click PDF button. I tried the code libraries that make PDFs, and the text came out worse than what the browser does on its own. So I left it out.
- It is not a writing app. The editing is basic on purpose. It is for styling and export, not for replacing your editor.
- Nothing you paste gets uploaded. It all runs in your browser. You can open the network tab and check.

It is free, has no sign-up, and has no limits. The code is on GitHub under an MIT license.

I mostly want to know what breaks. Try it with your last AI answer and tell me where it falls down.

https://markdown.style

---

## Where to post

Read each sub's rules first. Many remove self-promo on sight if you have no history there. Comment in a few
threads before you post your own. Do not hit more than two subs in one day.

### Best fits, start here

| Subreddit | Why it fits | Watch for |
|---|---|---|
| r/SideProject | Made for "I built this" stories. | Friendly. Just do not spam. |
| r/InternetIsBeautiful | A free, no sign-up, useful web tool is the whole point of the sub. | Strict. No sign-up walls, no sales voice. Big reach if it lands. |
| r/ChatGPT | Your users are here. The pain (reformatting AI output) is theirs. | Lead with the problem, not the link. |
| r/ClaudeAI | Same as above, smaller and warmer. | Same. |
| r/coolgithubprojects | Public repo, MIT license, fits cleanly. | Put the repo link in the post. |

### Second wave, a few days later

| Subreddit | Why it fits | Watch for |
|---|---|---|
| r/webdev | Devs like the no-backend, no-JavaScript, all-in-the-browser angle. | Self-promo is often Showoff Saturday only. Check the rule. |
| r/productivity | The "stop redoing work you already paid for" angle plays well. | Keep it about the workflow. |
| r/Markdown | Small, but right on topic. | Low traffic, easy win. |
| r/OpenAI | Overlaps r/ChatGPT. Post a few days apart, never the same day. | Do not paste the same text. |
| r/artificial | Wider AI crowd. | Frame it as a workflow fix, not a launch. |
| r/SaaS or r/EntrepreneurRideAlong | Only if you write it as a build story with real numbers. | They want the story, not the pitch. |

### Not Reddit, but the same week

- **Hacker News**, as a Show HN. It will care about the no-backend, no-upload build. It will ask about the
  license, and the answer is MIT.
- **Product Hunt**. The share image works now, so the card renders.
- **Indie Hackers** and **Dev.to**. Both take the Medium post with light edits.

### Reminders

- Reply to every comment for the first hour. Replies drive reach more than the post does.
- No em dashes. They read as AI-written, and this crowd spots them fast.
- Do not tag OpenAI or Anthropic as if they are partners. The tool just reads their markdown.
