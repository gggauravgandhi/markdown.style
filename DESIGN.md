---
name: markdown.style
description: LLM markdown to designed documents, entirely in the browser
colors:
  press-indigo: "#4338ca"
  indigo-wash: "#eef0ff"
  proofing-blue: "#6d8dff"
  ink-on-accent: "#10131f"
  sheet-white: "#ffffff"
  headline-ink: "#0e0f2e"
  body-ink: "#17181c"
  annotation-gray: "#5c6470"
  hairline: "#e5e8ec"
  night-slab: "#101014"
  galley-iron: "#1a1a21"
  rule-iron: "#2a2a33"
  proof-white: "#e8e8ee"
  setoff-gray: "#9a9aa8"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "2.7em"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.5em"
    fontWeight: 700
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  body-app:
    fontFamily: "system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  control: "6px"
  card: "8px"
  panel: "10px"
  dialog: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-cta:
    backgroundColor: "{colors.press-indigo}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.card}"
    padding: "10px 20px"
  button-cta-hover:
    backgroundColor: "{colors.headline-ink}"
    textColor: "{colors.sheet-white}"
  app-button:
    backgroundColor: "transparent"
    textColor: "{colors.proof-white}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  app-button-primary:
    backgroundColor: "{colors.proofing-blue}"
    textColor: "{colors.ink-on-accent}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  app-button-secondary:
    textColor: "{colors.proofing-blue}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  app-button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.setoff-gray}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  notice:
    backgroundColor: "{colors.galley-iron}"
    textColor: "{colors.proof-white}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
---

# Design System: markdown.style

## 1. Overview

**Creative North Star: "The Galley Proof"**

The moment raw copy becomes a page. Everything in markdown.style is staged around that transformation: plain monospace text on the left, the designed sheet on the right, and the instant where one becomes the other. The interface is the production room, not the publication; it stays dim, exact, and out of the way so the proof itself carries all the light.

Two chrome surfaces serve one voice. The editor is a dark workbench (product register: quiet, dense, instrument-like), and the marketing pages are a bright specimen sheet (brand register: typographic, unhurried, show-don't-tell). Both reject the same things, pulled straight from PRODUCT.md: plain converter utilities with no identity, generic AI-startup SaaS (gradient heroes, glassmorphism, purple-on-black), and corporate enterprise chrome.

**Key Characteristics:**
- The document is the hero; chrome recedes on both surfaces.
- Flat, border-defined construction; zero decorative shadows.
- System type everywhere in the chrome; the document themes carry the expressive typography.
- One accent per surface, spent on actions and state, never on decoration.
- Refined and restrained components: quiet until touched, subtle fills on interaction, no lifts or glows.

## 2. Colors

Two disciplined palettes, one per surface, sharing a single indigo-family voice.

### Primary
- **Press Indigo** (#4338ca): the marketing accent. CTAs, links, focus rings, step markers on light pages. Its hover state is Headline Ink, not a lighter indigo.
- **Proofing Blue** (#6d8dff): the editor accent, tuned for dark chrome. Primary action fill, slider thumbs, focus outlines, selection highlights. Text set on it uses Ink-on-Accent (#10131f), never white (white fails AA at 3.2:1).
- **Indigo Wash** (#eef0ff): quiet indigo tint for step-number chips and code-sample backgrounds on light pages.

### Neutral
- **Sheet White** (#ffffff): marketing page background, and the preview canvas where the document renders.
- **Headline Ink** (#0e0f2e): marketing headings; the darkest value on light surfaces.
- **Body Ink** (#17181c): marketing body text.
- **Annotation Gray** (#5c6470): secondary text on light surfaces.
- **Hairline** (#e5e8ec): rules, card borders, dividers on light surfaces.
- **Night Slab** (#101014): editor app background; near-black with a cool cast, never pure #000.
- **Galley Iron** (#1a1a21): raised dark surface; toolbar, dialog, toasts.
- **Rule Iron** (#2a2a33): borders and dividers on dark chrome.
- **Proof White** (#e8e8ee): primary text on dark chrome.
- **Set-off Gray** (#9a9aa8): secondary text and labels on dark chrome (6.1:1 on Galley Iron).

### Named Rules
**The One Accent Rule.** Each surface gets exactly one accent, spent on primary actions, current state, and focus. If an element is not interactive or stateful, it does not get accent color.
**The Dark Text on Accent Rule.** Proofing Blue fills always carry Ink-on-Accent text. White-on-periwinkle is prohibited; it fails WCAG AA.

## 3. Typography

**Display Font:** system-ui stack (native to every platform)
**Body Font:** system-ui stack
**Editor Font:** the platform monospace stack, via CodeMirror

**Character:** Deliberately invisible. The chrome uses system type at zero payload because the product's document themes are the typographic performance; the stage crew does not wear costumes.

### Hierarchy
- **Display** (700, 2.7em, 1.12, -0.02em): marketing hero headline only.
- **Headline** (700, 1.5em, -0.01em): marketing section headings, set in Headline Ink.
- **Body** (400, 17px, 1.65): marketing prose, capped at a 42em measure (`.answer`, `.lede`).
- **Body-app** (400, 14px, 1.5): all editor chrome text and controls.
- **Label** (400, 12px): toolbar micro-labels and card descriptions, in the muted neutral of the surface.

### Named Rules
**The Stage Crew Rule.** No display or decorative fonts in chrome, ever. Expressive typography lives exclusively inside the rendered document themes.

## 4. Elevation

Flat by construction. Depth is conveyed by 1px borders (Hairline on light, Rule Iron on dark) and one surface step (Night Slab to Galley Iron). There are no box-shadows anywhere in either chrome. The single permitted depth effect is the modal backdrop dim, rgba(0, 0, 0, 0.55), which isolates the theme dialog.

### Named Rules
**The Flat Galley Rule.** Surfaces are flat at rest and flat on hover. Interaction feedback is a fill change, never a lift, glow, or shadow.

## 5. Components

Refined and restrained: quiet until touched, state changes are subtle fills, never lifts or glows.

### Buttons
- **Shape:** gently rounded (6px on dark chrome, 8px for the marketing CTA).
- **Marketing CTA:** Press Indigo fill, Sheet White text, 10px 20px padding; hover shifts to Headline Ink.
- **App primary:** Proofing Blue fill, Ink-on-Accent text, weight 600, min-height 34px; hover brightens to #859fff, active deepens to #5c7df2.
- **App secondary:** transparent with a 45%-alpha Proofing Blue border and Proofing Blue text; hover adds a 12%-alpha blue fill.
- **App default:** transparent with Rule Iron border; hover adds a 7%-alpha white fill.
- **App ghost:** borderless Set-off Gray text for semi-destructive or tertiary actions; hover restores Proof White.
- **Focus:** 2px accent outline, 2px offset, on every variant. Transitions 150ms ease-out, disabled under `prefers-reduced-motion`.

### Toolbar Knobs
- **Style:** visible 12px micro-label plus native control (color swatch 36x34px, range slider 110px wide) wrapped in a real `<label>`.
- **State:** live `title` tooltips carry current values; `accent-color` themes the native controls.

### Cards / Containers
- **Corner Style:** 8px (theme cards in dialog), 10px (marketing cards and embeds), 12px (dialog panel).
- **Background:** surface color of the host; never a third invented layer.
- **Border:** always 1px in the surface's rule color; hover swaps border color to the surface accent.
- **Internal Padding:** 8px (dense dialog cards) to 14px (marketing strip cards).

### Inputs / Fields
- **Style:** native controls themed with `accent-color`; 1px Rule Iron border on the color swatch.
- **Focus:** 2px accent outline, 2px offset. No glow.

### Navigation
- **Marketing:** single-row header, brand left, muted links right that resolve to Body Ink on hover; one CTA button maximum.
- **Editor:** grouped toolbar (styling group, file group, export group) with 16px between groups, 8px within; brand links back to the landing page.

### The Preview Split (signature)
The editor's defining component: dark editing pane left, Sheet White document canvas right, divided by a single Rule Iron line. The white pane is the galley proof; nothing in the chrome may outshine it.

## 6. Do's and Don'ts

### Do:
- **Do** spend accent color only on actions, selection, and focus (The One Accent Rule).
- **Do** set Ink-on-Accent (#10131f) text on every Proofing Blue fill.
- **Do** keep every interactive element at 4.5:1 contrast or better, with a visible 2px focus outline.
- **Do** use 1px borders and surface steps for depth (The Flat Galley Rule).
- **Do** give every control a visible label; aria-only labeling is a last resort, not a default.
- **Do** respect `prefers-reduced-motion` on every transition, and keep transitions between 150 and 250ms.

### Don't:
- **Don't** look like a "plain converter utility": no identity-free white pages with a lone form and button (PRODUCT.md anti-reference).
- **Don't** look like "generic AI-startup SaaS": no gradient heroes, no glassmorphism cards, no purple-on-black, no hero metrics (PRODUCT.md anti-reference).
- **Don't** look like a "corporate enterprise tool": no heavy nav, feature matrices, or stock-photo trust sections (PRODUCT.md anti-reference).
- **Don't** use side-stripe borders: `border-left` wider than 1px as a colored accent on toasts, callouts, or cards is prohibited; use a full 1px border plus background tint instead.
- **Don't** use gradient text, box-shadows, or decorative blur anywhere in chrome.
- **Don't** put display fonts or marketing voice inside the editor chrome.
- **Don't** use an em dash. Anywhere. Not in marketing copy, UI strings, theme descriptions, sample documents, docs, or code comments. Use a comma, a colon, parentheses, or two sentences. A repo test walks every tracked file and fails on one.
- **Don't** use pure #000 anywhere; the darkest chrome value is Night Slab (#101014).
