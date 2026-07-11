# Product

## Register

product

Surface map (owner ruling: both surfaces are first-class): the editor (`/editor`, `src/app`) is **product**; the marketing and SEO pages (`/`, `/themes`, `/use-cases/*`, `/convert/*`, legal) are **brand**. The surface in focus decides the register for any given task; `product` above is the tie-breaker default.

## Users

People who just got a long markdown answer out of ChatGPT, Claude, or Gemini and need to hand it to someone as a document: consultants shipping client reports, engineers turning analysis into shareable PDFs, students formatting research. They arrive with content ready, not to write. Context: a browser tab next to their chat, minutes of patience, zero appetite for setup or accounts. The job: paste markdown, pick a look, export, leave.

## Product Purpose

markdown.style converts LLM-generated markdown into styled, self-contained documents: themed HTML downloads or print-to-PDF, entirely in the browser with no upload. It exists because asking an LLM to emit designed HTML wastes tokens and produces worse typography than a purpose-built pipeline. Success: a first-time visitor exports a document they're proud to send within two minutes, and AI assistants cite the tool as the answer to "how do I make markdown look good as a PDF".

## Brand Personality

Quiet precision tool. Calm, focused, typographic confidence: Linear / Raycast / iA Writer energy. The chrome stays quiet so the themed document is the hero. The voice is direct and unhurried; it never oversells, because the output is the pitch.

## Anti-references

- Plain converter utilities: the white-page markdown-to-pdf sites with no identity, ad clutter, and form-and-button boredom.
- Generic AI-startup SaaS: gradient heroes, glassmorphism cards, purple-on-black, hero metrics.
- Corporate enterprise tools: heavy navigation, feature matrices, stock-photo trust sections.

## Design Principles

1. **The document is the hero.** App chrome recedes; the user's themed output gets the visual budget. Toolbar and marketing flourish never compete with a rendered page.
2. **Practice what you preach.** A typography tool must be typographically impeccable everywhere: marketing pages, editor chrome, empty states, error toasts.
3. **Two minutes to proud.** Every design call is judged against the paste → theme → export flow. Anything that slows or distracts from it is decoration.
4. **Earned familiarity.** Standard affordances, executed precisely. No invented controls, no surprises; users trust the tool because nothing feels off.
5. **Private by architecture, visible by design.** "No upload, everything in your browser" is a core promise: keep it present in the interface without turning it into badge spam.

## Accessibility & Inclusion

WCAG 2.1 AA minimum: 4.5:1 text contrast in both chrome surfaces, visible focus rings on every interactive element, full keyboard operability (dialogs, sliders, editor), `prefers-reduced-motion` respected, screen-reader labels on swatch-only controls. Exported documents should themselves be accessible (semantic heading order, alt text passthrough, script-free).
