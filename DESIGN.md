---
name: Mikael Geraldius Gunawan, portfolio
description: A dark, type-led portfolio: large serif name, plain sans copy, one orange accent for the two focus areas and the action, and one low-poly topic map. Built for internship and job applications in AI and web design.
colors:
  ground: "#0e1115"
  raised: "#151a21"
  deep: "#090b0e"
  ink: "#eef1f5"
  ink-2: "#a7b1be"
  accent: "#ff6b3d"
  accent-ink: "#0e1115"
typography:
  display:
    fontFamily: "Gambarino, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "12vw"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Gambarino, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(2.5rem, 1.5rem + 4vw, 5rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "General Sans, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1.1rem + 1vw, 2rem)"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "General Sans, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1rem + 0.25vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.6
  support:
    fontFamily: "General Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  none: "0px"
spacing:
  margin: "clamp(16px, 3vw, 40px)"
  gap: "clamp(16px, 2vw, 28px)"
  chapter: "clamp(96px, 13vw, 200px)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.none}"
    padding: "0 32px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.accent-ink}"
---

# Design System: Mikael Geraldius Gunawan, portfolio

## Overview

**Creative North Star: "Type on graphite"**

A dark page where the type does the work: the name as large as two lines allow, a plain sentence under it that says what this is, and one orange that means "what he is after, or what you can do": the words *AI* and *web design* and the action. No tiles, boxes or blocks sit behind any text; emphasis is foreground colour and weight only. The one picture-like element is a low-poly topic map of what he has studied, which a visitor can turn and read.

The page refuses the portfolio defaults (stock photography, glow, glass). Real work sits in flat cards, one tone step off the field, each opening its own project page; the cards hold only real projects, never placeholders. Dark is a use-scene decision: a recruiter reading on a screen in the evening, one dense scroll, a 3D map that sits better on a deep field.

Replaces the earlier olive-on-bone system and the short-lived "token tiles" treatment (both retired).

**Key Characteristics:**
- Three graphite fields one step apart (ground, raised, deep); separation by tone, never by line or shadow.
- One accent, orange, as text colour for the two focus areas, as the fill of call-to-action buttons, and on the 3D hubs and the chosen control's underline.
- Two typefaces: Gambarino for the name and headings, General Sans for everything read.
- Flat and square everywhere. No gradients, glows, shadows, rules, glass, or backgrounds behind text.
- Motion only adds entrances; the finished page is the base state.

## Colors

### Fields
- **Ground** (`#0e1115`): hero and Studied. **Raised** (`#151a21`): Education, Work and Contact. **Deep** (`#090b0e`): the Focus chapter holding the map; the 3D fog and terrain fade into it.

### Ink
- **Ink** (`#eef1f5`): all running text. **Ink 2** (`#a7b1be`): supporting text and unchosen controls only (8.9:1 on ground, 8.2:1 on raised).

### Accent
- **Accent** (`#ff6b3d`), 6.7:1 on ground (6.2:1 on raised) as text; **Accent Ink** (`#0e1115`), 6.7:1 on the accent as a fill.

### Named Rules
**The One Accent Rule.** The accent never decorates. It marks the two focus areas and the action.
**The Chapter Field Rule.** Colour changes by whole chapter. The fixed header takes the field of the chapter under its midline (300ms).
**The No Tiles Rule.** Nothing paints a rectangle behind a word, a line or a phrase. Buttons are the only filled controls; the one filled surface is the work card, a whole-field tone step that holds a picture and its words.

## Typography

**Display Font:** Gambarino. **Body Font:** General Sans. Self-hosted, unmodified (see `FONTS.md`).

### Hierarchy (five sizes)
- **Display** (400, 13vw phone / 12vw desktop, 0.9, -0.02em): the name, twice, on two lines.
- **Headline** (400, 40px to 80px, 0.98): section headings, the three numerals, the contact links.
- **Lead** (400, 22px to 32px, 1.4): the hero sentence, the education statement, Studied area names (Gambarino), the contact line.
- **Body** (400, 17px to 20px, 1.6): Focus text, readout, Studied topics, controls, button labels.
- **Support** (500, 16px): header links, map labels, footer line, the facts' captions in ink-2. Sentence case, no uppercase tracking, no monospace.

## Layout

A 12-column grid inside one pair of equal margins (16 to 40px). Hero: name top-left, the role sentence about 50px beneath it, the button at the right on desktop and below on tablet and phone; the hero is at most 780px tall so the gap to the next chapter stays an ordinary section gap. Education: heading left, statement right, three numerals across. Focus: text and controls left, map right. Work ("What I’ve built"): heading and one body line, then the cards. One project is one wide card (picture 7 columns, words 5); two or more sit two to a row, picture above words; below 1024px every card stacks. The project page: a bar (All work, Code on GitHub), the name at display size (capped at 11rem), the lead summary (and any group credit) across eight columns with Year / Platform / Kind stacked in the last four, the screens on a deep panel at full width (phones side by side, web pages stacked), then What it does (eight columns) beside Built with (four), What I learned as two columns of lessons each led by its point in medium weight, and the live site and repo as contact-style links. No part leaves a column empty beside it. Studied: area names left, topics right. Contact: heading and line, the two links at heading size, a call-to-action button, then the name at full width. Chapters are 96 to 200px apart. On phones everything stacks and the hero and contact buttons stay at their natural or full width.

## Elevation & Depth

Flat. Depth exists only inside the 3D map, lit from one side, whose terrain and fog dissolve into the Deep field.

## Components

- **Button:** square, 56px, accent fill, accent-ink text; hover (fine pointers) fills ink; press scales to 0.97 in 160ms. Hero and Contact.
- **Focus controls:** a native radio group and toggle buttons set as plain text. The chosen one is full ink with a 2px accent underline; the rest are ink-2, ink on hover. 44px tall hit areas.
- **Header:** plain 56px bar, wordmark left, five links and a compact Resume button (the standard button at 44px, same hover and press) right, field follows the chapter. Links underline in the accent on hover. At 760px and below the links fold into a hamburger beside Resume: a native popover hanging under the bar, one tone step from it; the bars cross into an X in 200ms and press scales to 0.97 in 160ms.
- **Contact links:** headline size; on hover they turn accent with an underline.
- **Work card:** the Ground field on the raised chapter (a tone step, no line, no shadow, square). A deep panel holds the app's screens, cropped at its foot; beside or under it the name at headline size (the link, stretched over the whole card), the meta line, one body line and "See how I built it" with the accent underline and a drawn arrow. Hover (fine pointers) lifts the field to `#12161c`, raises the screens a few percent and nudges the arrow; press scales the card to 0.99; focus outlines the whole card.
- **Project page:** a fixed page over the site at `#work-<slug>` on the Ground field, with its own sticky 56px bar. Opening pushes a history entry; Back, Escape, "All work" and "Back to all work" close it and return focus to the card. The site behind is inert and holds still. Every page is in the pre-rendered markup, opened by CSS `:target` without script.
- **Topic map:** lazy WebGL scene below the opening. Drag or arrow keys turn it; click selects. The topic list and readout hold the same content and are the no-WebGL fallback.

## Motion

- **Opening:** only the name moves: its two lines rise 32% through their masks over 700ms (expo-out), readable from the first frame. The hero sentence and button are never animated. The name leaves slightly faster than the page on scroll (scroll timeline, transform only, skipped where unsupported).
- **Scroll reveals (below the fold):** every heading, paragraph, fact, list row, the map group, the call-to-action and the footer text rise 24px and fade in once (opacity 600ms ease-out, transform 900ms expo-out). Siblings that enter in the same frame stagger 70ms apart in reading order (capped at four); a lone element has no delay. The hidden state exists only while script runs (`html.js`). Focus landing on a pending item reveals it; at the page end whatever is on screen is revealed; if `IntersectionObserver` is missing, throws or stays silent for 2s, or the app bundle never starts (3s), everything is shown.
- **Anchor navigation:** header links, the logo, the skip link and "Back to top" scroll with an exponential ease-out whose duration is `clamp(250ms + 0.22 × distance, 380ms, 1100ms)`. The hash and a history entry are set and focus moves to the target as with a native jump; the target rests with its top on the header midline (`scroll-padding-top: 28px`). A wheel, touch, key or scrollbar drag stops it where it is; a second click retargets. Under reduced motion the browser's own immediate jump runs. There is no CSS `scroll-behavior`, no library, and no wheel capture.
- **Project page:** the card's screen panel morphs into the page's (View Transition, 560ms, `cubic-bezier(0.32, 0.72, 0, 1)`) while the rest crossfades in 320ms; the page's words rise in reading order 60ms apart from 140ms. Without view transitions the page rises 24px over 420ms. Under reduced motion there is no morph and no travel.
- **Rules:** transform and opacity only. Everything is visible with no script and under `prefers-reduced-motion` (animations removed). The page is pre-rendered at build so it reads before and without script.

## Do's and Don'ts

### Do:
- **Do** emphasise with foreground colour and weight only.
- **Do** keep the accent to the two focus areas and the action.
- **Do** keep every control a real element with a visible focus ring and a 44px target.

### Don't:
- **Don't** put a background, tile, pill, highlight or pseudo-element block behind text.
- **Don't** add placeholder cards, sample work, stock photos or invented proof; a card appears only when Mikael supplies a real project. No tag chips or pills on cards or project pages: tools are a plain line separated by dots.
- **Don't** add eyebrows, index numbers, hairline rules, gradients, shadows, glass, monospace or icon-topped cards.
- **Don't** introduce a third typeface, a second accent, or a sixth type size.
- **Don't** publish the contact details or font files without the checks in `README.md` and `FONTS.md`.
