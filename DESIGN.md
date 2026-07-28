---
name: OnlyPing
description: Videos techniques de ping-pong vendues par des entraineurs verifies.
colors:
  bg: "#EEF0F5"
  surface: "#FBFBFD"
  surface-alt: "#E9ECF2"
  line: "#DDE1E9"
  ink: "#10182B"
  ink-muted: "#5B6478"
  ink-faint: "#8A93A6"
  accent: "#CE6A3E"
  accent-deep: "#B0552E"
  success: "#1F9D55"
  success-bg: "#E7F6ED"
  danger: "#DC2626"
  danger-bg: "#FDECEC"
  info: "#2563EB"
  info-bg: "#E7EEFC"
  chip-service-bg: "#E7EEFC"
  chip-service-text: "#2C4C9B"
  chip-revers-bg: "#E6F5EC"
  chip-revers-text: "#1F7A45"
  chip-coupdroit-bg: "#F1E9FC"
  chip-coupdroit-text: "#6B3FA0"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontWeight: 600
    lineHeight: 1.15
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  card-video:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: OnlyPing

## Overview

**Creative North Star: "The Center Line"**

OnlyPing is redesigned around the one line that structures every ping-pong table: the center line. The product becomes a clean, well-lit, structured surface — closer to a modern sport-tech SaaS dashboard than the previous dim graphite room — because the audience is not just spectators, it's players and coaches doing a job (browsing, buying, publishing, managing payouts). Structure and legibility lead; energy is reserved for one color.

That one color is a competition-ball orange: **Accent**. Everything else is quiet — neutral surfaces, a calm navy-black ink, soft dividing lines — so that price tags, primary actions, and active states read instantly as "the thing to do here." Light and dark are both first-class: the same structure, ink and accent hold in both, only the surface/background values invert.

**Key Characteristics:**
- Structured, editorial-grade neutrals (not a single dim graphite wash) with a true light theme and a true dark theme, switchable by the user.
- One saturated accent — competition-ball orange — spent only on price, primary actions, and active/selected states.
- Soft, restrained elevation (gentle shadows on cards) instead of flat borders alone — reads as a considered product, not a bare admin tool.
- Geometric display type (Space Grotesk) over a neutral, highly-legible body face (Inter) — professional, not playful.

## Colors

Palette is neutral-first with a single warm accent; category tags use quiet, low-saturation tints rather than competing with the accent.

### Primary
- **Accent** (`#CE6A3E` light / `#FF7A3D` dark): the one saturated color, a muted terracotta in light (kept a notch darker/less neon so it doesn't glare against the light neutrals) and a brighter true orange in dark (needs the extra brightness to read against a dark surface). Price, primary buttons, active nav state, focus rings, selected filters. Deepens to **Accent, Deep** (`#B0552E` light / `#D1551F` dark) on hover.

### Neutral
- **Bg** (`#EEF0F5` light / `#0A0F1C` dark): page background.
- **Surface** (`#FBFBFD` light / `#121A2B` dark): cards, header, forms, panels. Deliberately not pure white — an off-white keeps `bg`/`surface` from collapsing into a single flat white field.
- **Surface, Alt** (`#E9ECF2` light / `#1A2338` dark): recessed fills — inputs, table headers, chip backgrounds' neutral base.
- **Line** (`#DDE1E9` light / `#232D45` dark): all hairline borders and dividers.
- **Ink** (`#10182B` light / `#EAF0FA` dark): primary text and headings.
- **Ink, Muted** (`#5B6478` light / `#93A0B8` dark): secondary text, meta, captions.
- **Ink, Faint** (`#8A93A6` light / `#5E6A82` dark): placeholders, disabled, least important labels.

### Named Rules
**The One Accent Rule.** Orange marks the single decisive element per view: a price, the primary CTA, an active tab/filter, a focus ring. If two elements compete for it, one loses the accent.

**The Invert, Don't Recolor Rule.** Moving between light and dark never changes which token a component uses — only what `bg`/`surface`/`ink` resolve to. A component authored against the semantic tokens is correct in both themes by construction.

## Typography

**Display Font:** Space Grotesk (weight 600–700), fallback sans-serif
**Body Font:** Inter (weight 400–600), fallback sans-serif

**Character:** A geometric, slightly technical display face for headlines over a neutral, highly-legible body face — this is the professional register the redesign is asking for: precise, not decorative.

### Hierarchy
- **Display** (600–700, `text-4xl`–`text-6xl`, tight leading): hero headline, page `h1`.
- **Headline** (600, `text-2xl`–`text-3xl`): section titles, `h2`/`h3`.
- **Title** (600, `text-lg`): card titles, form legends, stat labels.
- **Body** (400–500, `text-sm`–`text-base`): descriptions, labels, table content.
- **Label** (500–600, `text-xs`, uppercase, wide tracking): category/level tags, eyebrow text, table headers.

## Layout

Wide content containers (`max-w-7xl` standard pages, `max-w-4xl` legal/reading pages), with generous but not excessive padding (`px-4`, `py-12`–`16` on section level). Grids scale from 1 column on mobile to 2–4 on desktop for catalogue/dashboard listings. Standard Tailwind breakpoints (640/768/1024/1280) drive stacking-to-grid transitions.

## Elevation & Depth

A deliberate departure from the previous flat/border-only system: surfaces now carry a soft resting shadow plus a hairline border, and lift slightly further on hover for interactive cards. In dark theme, shadow is nearly invisible against a dark page, so depth there leans on the `surface` vs `bg` contrast and a slightly lighter hairline border rather than shadow alone.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px rgba(16,24,43,0.04), 0 1px 1px rgba(16,24,43,0.03)`): default card/panel elevation.
- **Raised** (`box-shadow: 0 12px 28px rgba(16,24,43,0.10)`): hover state on interactive cards (video card, coach card), and the sticky header once the page has scrolled.

### Named Rules
**The Quiet Lift Rule.** Elevation communicates interactivity, not decoration: only elements a user can act on (cards linking somewhere, buttons) lift on hover. Static display panels (stat tiles, table wrappers) keep the resting shadow only.

## Shapes

- **Small** (`8px`): inputs, thumbnails, small inline controls, checkboxes.
- **Medium** (`12px`): the standard card/panel radius — video cards, forms, stat tiles, tables.
- **Large** (`20px`): hero panels and any full-bleed feature block.
- **Pill** (`9999px`): every button, tag, badge, and nav item.

## Components

### Buttons
- **Shape:** pill.
- **Primary:** Accent background, white text, `12px 24px` padding, weight 600; hover deepens to Accent Deep; focus-visible gets a 2px accent outline with offset.
- **Secondary:** `surface-alt` background, `ink` text, no border; hover darkens slightly toward `line`.
- **Ghost:** transparent, `line` border, `ink` text; hover fills to `surface-alt`.
- **Feel:** crisp and fast — 150ms color/shadow transitions, no bounce.

### Chips (category + status tags)
- **Style:** filled pill, low-saturation tint background with a matching darker/lighter text color (never accent orange — chips stay quiet so Accent stays singular).
- **Category roles:** Service → blue tint, Revers → green tint, Coup droit → violet tint.
- **Status roles:** success (paid), danger (refunded/disputed), info (pending/neutral status) reuse the semantic success/danger/info pair.

### Cards / Containers
- **Corner Style:** `12px` standard, `20px` for hero/feature panels.
- **Background:** `surface`.
- **Border:** `line` hairline, always present alongside the shadow (belt and suspenders on light backgrounds where shadow alone can read as too soft).
- **Shadow Strategy:** Resting by default, Raised on hover for clickable cards (see Elevation & Depth).
- **Internal Padding:** `16px` card, `24px`–`32px` form/feature panel.

### Inputs / Fields
- **Style:** `surface-alt` background, `line` border, `8px` radius, `ink` text, `ink-faint` placeholder.
- **Focus:** border becomes `accent`, plus a subtle accent-tinted focus ring (`box-shadow: 0 0 0 3px rgba(206,106,62,0.15)` in light).
- **Error:** border and helper text switch to `danger`.

### Navigation
- **Style:** sticky header, `surface` background, `line` bottom hairline, Raised shadow once scrolled. Links use `ink-muted`, brightening to `ink` on hover/active; the active route gets a small accent underline dot or bottom border, not a full accent fill (keeps the header calm). The theme toggle (sun/moon) and primary CTA live at the end of the nav.

## Do's and Don'ts

### Do:
- **Do** spend Accent on exactly one decisive element per view — The One Accent Rule.
- **Do** author every component against the semantic tokens (`bg`, `surface`, `ink`, ...) so it inverts correctly between light and dark automatically.
- **Do** give interactive cards a hover lift (Raised shadow); keep static panels at Resting.

### Don't:
- **Don't** reintroduce the previous graphite/gold palette or the flat-only, border-as-only-depth system — this redesign replaces both.
- **Don't** use Accent for category chips or status tags; they stay in their own quiet tint family.
- **Don't** hardcode a hex color in a component; every color must resolve through a semantic token so theme switching stays correct.

## Theming (Light / Dark)

Implemented as CSS custom properties on `:root` (light values, default) overridden inside `:root[data-theme="dark"]`, with a small inline script setting `data-theme` before paint from `localStorage` (fallback: `prefers-color-scheme`). Tailwind consumes the same tokens via `theme.extend.colors` mapped to `var(--color-*)`, so every utility class (`bg-surface`, `text-ink-muted`, `border-line`, ...) is theme-correct without any `dark:` variants sprinkled through markup.

| Token | Light | Dark |
|---|---|---|
| `bg` | `#EEF0F5` | `#0A0F1C` |
| `surface` | `#FBFBFD` | `#121A2B` |
| `surface-alt` | `#E9ECF2` | `#1A2338` |
| `line` | `#DDE1E9` | `#232D45` |
| `ink` | `#10182B` | `#EAF0FA` |
| `ink-muted` | `#5B6478` | `#93A0B8` |
| `ink-faint` | `#8A93A6` | `#5E6A82` |
| `accent` / `accent-deep` | `#CE6A3E` / `#B0552E` | `#FF7A3D` / `#D1551F` |
| `success` / `success-bg` | `#1F9D55` / `#E7F6ED` | `#34D399` / `#0F2A1E` |
| `danger` / `danger-bg` | `#DC2626` / `#FDECEC` | `#F87171` / `#3A1414` |
| `info` / `info-bg` | `#2563EB` / `#E7EEFC` | `#60A5FA` / `#16223D` |
| `chip-service` bg/text | `#E7EEFC` / `#2C4C9B` | `#1B2740` / `#8FB0F5` |
| `chip-revers` bg/text | `#E6F5EC` / `#1F7A45` | `#16301F` / `#66D394` |
| `chip-coupdroit` bg/text | `#F1E9FC` / `#6B3FA0` | `#2A1B3D` / `#C79EF0` |
