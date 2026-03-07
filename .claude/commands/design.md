---
name: design
description: Generate a cohesive design system and UI pages with real visual identity. Avoids generic AI-generated aesthetics by establishing intentional typography, color, and layout choices.
---

## Input

Arguments: `$ARGUMENTS`

Supported commands:
- `/design` — interactive mode (asks what to do)
- `/design system` — create or update the design system
- `/design page` — design a page using the design system

## Stack

This skill assumes:
- **Tailwind CSS v4** for styling (OKLCH color space, `@theme` directive)
- **TypeScript + React** (Next.js or standalone)
- Components use `className` props (no CSS-in-JS)

---

## Design Foundations

These are non-negotiable rules backed by research. Follow them in every decision.

### Anti-Generic Rules

**The goal is to NOT look like generic AI output.** AI tools regress to the mean of millions of sites. Break out by making intentional, opinionated choices:

- **No default Tailwind colors.** Never use raw `blue-500`, `gray-100`. Always use semantic tokens (`primary`, `surface`, `accent`). Use OKLCH + `color-mix()` to generate palettes from a single brand color.
- **No Inter/system font as the only font.** Always pair a display font with a body font. Choose fonts that match the brand personality. None of the design-forward companies (Linear, Vercel, Stripe, Raycast) use default Inter.
- **No uniform card grids.** Vary layout patterns — bento grids, asymmetric columns, full-bleed sections, overlapping elements, editorial layouts. Identical cards at identical sizes = instant AI tell.
- **No generic hero sections.** Avoid "big heading + subtitle + CTA + stock image" unless there's a strong reason. Use split layouts, asymmetric compositions, or editorial arrangements instead.
- **Borders over shadows.** Modern design-forward apps (Linear, Vercel, Supabase) use subtle 1px borders to define regions rather than box-shadow on everything. Reserve shadows for true elevation (modals, dropdowns).
- **Add texture.** Flat solid colors read as AI-generated. Use grainy gradients (SVG `feTurbulence`), noise overlays, subtle patterns, or color-blocked sections for visual depth.
- **One signature visual technique.** Pick one distinctive element and own it — a gradient style, a scroll animation, a grid-breaking layout, a typographic treatment. This creates identity.

### Color Theory

- **60-30-10 rule:** 60% dominant (backgrounds/surfaces), 30% secondary (cards, sidebars, supporting UI), 10% accent (CTAs, active states, links).
- **Design in grayscale first, add color last.** This forces proper hierarchy through spacing, contrast, and typography before color becomes a crutch.
- **3 core colors maximum.** Fewer colors reinforce hierarchy because there's less to distract.
- **Tinted neutrals.** Never use pure gray. Warm grays, cool slates, or brand-tinted neutrals create character. On colored backgrounds, pick a color with the same hue but lower saturation rather than gray text.
- **OKLCH color space.** Perceptually uniform — identical lightness values produce the same perceived brightness, unlike HSL. Generate entire palette from one base color with `color-mix()`.

### WCAG Contrast Requirements (Non-Negotiable)

| Element | Minimum Ratio |
|---|---|
| Normal text (<18px) | 4.5:1 (AA) |
| Large text (>=18px or >=14px bold) | 3:1 (AA) |
| UI components and graphics | 3:1 |
| Focus indicators | 3:1 |

Test contrast in BOTH light and dark themes. Never convey information through color alone (8% of men have color vision deficiency).

### Typography Rules

- **Maximum 2 typefaces** (3 absolute max). Assign clear roles: one for headings, one for body.
- **Font pairing principle:** Contrast, not conflict. Paired fonts should differ in classification (serif vs sans) but share similar x-height and character width. Superfamilies (Roboto + Roboto Slab) always pair well.
- **Modular type scales** (base = 16px):

| Scale | Ratio | Best for |
|---|---|---|
| Minor Third | 1.200 | Apps, dashboards — subtle hierarchy |
| Major Third | 1.250 | Apps, dashboards — moderate hierarchy |
| Perfect Fourth | 1.333 | Content sites, blogs, docs |
| Perfect Fifth | 1.500 | Editorial, marketing, landing pages |

- **Line-height by context:** Body text 1.4-1.65, headings 1.1-1.3, display text (48px+) 1.0-1.15, small text 1.4-1.6. Tighter as size increases.
- **Line length:** 45-85 characters per line, ideal 66. Longer lines need proportionally more line-height.
- **Fluid typography with `clamp()`:** No fixed breakpoint jumps. Use `rem` units so fluid type respects user font-size preferences.

### Visual Hierarchy

**Five levers in order of impact:** size > color/contrast > weight > position > whitespace.

Combine levers, don't multiply. Primary content uses 1-2 levers. Reserve all three (size + weight + color) for the single most important element on the page.

**Scanning patterns:**
- **F-pattern:** Text-heavy pages. Users read first line horizontally, drop down, read shorter horizontal line, scan left edge vertically. Place key content in first two lines and left column.
- **Z-pattern:** Minimal-text/marketing pages. Eye moves top-left → top-right → diagonal to bottom-left → right. Place logo top-left, CTA top-right or bottom-right.
- **Layer-cake:** Users fixate only on headings, skipping body text. Make headings descriptive and scannable.

**Gestalt principles to apply:**
- **Proximity:** Elements near each other are perceived as a group. More space *around* a group than *within* it. Form labels must be closer to their field than to adjacent fields.
- **Similarity:** Elements sharing visual traits (color, shape, size) are perceived as related. All clickable links share the same color. Changing one card's treatment signals it's different (selected, featured).
- **Figure-ground:** Modals use dimmed overlays to push content forward. Cards with borders/shadows float above the surface.
- **Closure:** Partially visible cards at screen edge signal scrollable content.

### Spacing System

- **8px base grid.** All spacing, sizing, padding, and margins use multiples of 8: 8, 16, 24, 32, 48, 64, 80px.
- **4px sub-grid** for fine-tuning: icon alignment, text baselines, small component internals.
- **Constrained scale:** Don't use every multiple. Use deliberate jumps: 4, 8, 12, 16, 24, 32, 48, 64px.
- **Responsive grid:** Mobile 4 columns (16px gutter), tablet 8 columns (24px gutter), desktop 12 columns (24-32px gutter).
- **Break the grid intentionally and sparingly.** Hero sections, full-bleed images, overlapping elements. If everything breaks the grid, there is no grid.

### Animation and Motion

**Duration guidelines:**

| Action | Duration |
|---|---|
| Micro-feedback (toggles, ripples) | 50-100ms |
| Small transitions (tooltips, dropdowns) | 100-150ms |
| Medium transitions (modals, card expand) | 150-250ms |
| Large transitions (page/route changes) | 250-375ms |
| Complex sequences (onboarding) | 375-500ms |

Desktop animations should be faster than mobile (150-200ms vs 225-300ms).

**Easing functions:**

| Context | Easing | CSS |
|---|---|---|
| Entrances (ease-out) | Starts fast, ends gently | `cubic-bezier(0.0, 0.0, 0.2, 1)` |
| Exits (ease-in) | Accelerates away | `cubic-bezier(0.4, 0.0, 1, 1)` |
| On-screen movement | Standard ease-in-out | `cubic-bezier(0.4, 0.0, 0.2, 1)` |

Never use the CSS default `ease`. Create custom curves for brand consistency.

**Reduced motion (WCAG 2.3.3):** Always check `prefers-reduced-motion: reduce`. Replace motion with opacity fades or instant state changes. Never remove functional animations entirely — reduce them.

### Dark Mode

Dark mode is not "invert colors." It requires a separate design pass:

- **Never use pure black (#000000).** Use dark gray (oklch 0.13-0.15) as base. Pure black kills depth expression.
- **Elevation through lightness.** Higher z-index = lighter background. This replaces shadows, which don't read well on dark surfaces.
- **Never use pure white text.** Use off-white (oklch 0.93) to reduce eye strain.
- **Reduce chroma on accent colors.** Saturated colors glow harshly on dark backgrounds — lower the C in OKLCH.
- **Borders replace shadows in dark mode.** Subtle 1px borders (`oklch(1 0 0 / 0.08)`) define elevation instead of box-shadow.
- **Three-tier token architecture:** Reference tokens (primitives) → Semantic tokens (purpose) → Component tokens (scoped). A theme is a new set of semantic-to-reference mappings.

### Accessibility Beyond Color

- **Touch targets:** Minimum 48x48px (recommended), 24x24px (WCAG AA minimum), 8px gap between targets.
- **Focus indicators:** Visible `outline` (not border — outlines don't affect layout), 3:1 contrast ratio.
- **Skip links:** "Skip to main content" as first focusable element on every page.
- **Semantic HTML:** `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` for landmarks. One `<main>` per page.
- **Keyboard navigation:** All interactive elements reachable via Tab. Escape closes modals/dropdowns. No keyboard traps.
- **ARIA live regions:** `aria-live="polite"` for status updates, `role="alert"` for errors. The live region element must exist in DOM before content is injected.
- **Form accessibility:** Labels above inputs (not placeholder-only). Error messages below inputs, using both color and icon. Validate on blur (not while typing). Remove errors immediately when corrected.

### Loading States

| Wait time | Show |
|---|---|
| < 100ms | Nothing — feels instant |
| 100ms-1s | Nothing or subtle indicator |
| 1-2s | Skeleton screen or brief spinner |
| 2-10s | Skeleton screen (preferred) |
| > 10s | Progress bar with percentage |

- **Skeleton screens** for content-heavy pages (feeds, dashboards). Shimmer left-to-right.
- **Spinners** for contained actions (button submit, inline fetch).
- **Optimistic updates** for high-success-rate actions (likes, toggles, bookmarks). Not for payments or deletions.
- **Reserve space** for async content (`aspect-ratio`, explicit `width`/`height`) to prevent layout shift.

---

## Instructions

### 0. Check for existing design system

Look for `src/styles/design-system.ts` or `tailwind.config.ts` with a custom theme.

If a design system exists, read it and use it as context for all operations.

### 1. Determine action

If `$ARGUMENTS` is `system`, go to **Action: Design system**.
If `$ARGUMENTS` is `page`, go to **Action: Design page**.

If `$ARGUMENTS` is empty or unrecognized, use the AskUserQuestion tool:

"What would you like to do?"
- `Create design system` — establish the visual identity (colors, typography, spacing, components)
- `Design a page` — create a page layout using the design system

---

### Action: Design system

Use the AskUserQuestion tool to collect in a single prompt:

**Question 1 — Brand personality (pick 1-2):**
- `Minimal` — clean, lots of whitespace, understated, borders over shadows (e.g., Linear, Notion)
- `Bold` — strong colors, large type, high contrast, confident spacing (e.g., Vercel, Stripe)
- `Editorial` — magazine-like, typographic hierarchy, reading-focused, varied layouts (e.g., Medium, Substack)
- `Playful` — rounded shapes, warm colors, friendly motion, tactile feel (e.g., Slack, Figma, Arc)
- `Luxury` — dark backgrounds, serif fonts, restrained palette, extreme whitespace (e.g., Apple, Aesop)
- `Technical` — monospace accents, dense information, tight spacing, developer-focused (e.g., GitHub, Raycast)

**Question 2 — Primary color direction:**
- A color word or hex code (e.g., "deep teal", "warm orange", "#1a1a2e")
- Or `Surprise me` — generate a palette that fits the personality

**Question 3 — Industry/context:**
- What is the product? (e.g., "project management SaaS", "e-commerce for handmade goods", "developer documentation")
- This informs font choices, imagery style, and component patterns.

**Question 4 — Dark mode:**
- `Yes` — generate light + dark themes (dark-mode-first if personality is Minimal, Technical, or Luxury)
- `Light only` — single theme

**Question 5 — Reference sites (optional):**
- "Any websites whose visual style you admire?" (0-3 URLs)
- If provided, use WebFetch to study their design patterns.

**Then generate the design system:**

#### 1. Color palette

Generate the palette using **OKLCH color space** and `color-mix()`. Start from a single brand color and derive the full palette programmatically.

Follow the **60-30-10 rule:** 60% surfaces, 30% secondary/supporting, 10% accent.

```css
:root {
  /* Brand — derived from user's primary color choice */
  --brand: oklch(<L> <C> <H>);

  /* Full palette generated via color-mix */
  --primary:        var(--brand);
  --primary-hover:  color-mix(in oklch, var(--brand) 85%, black);
  --primary-subtle: color-mix(in oklch, var(--brand) 15%, white);
  --secondary:      oklch(<complementary or analogous>);

  /* Neutrals — tinted with brand hue, never pure gray */
  --surface:        oklch(0.985 0.005 <brand-hue>);
  --surface-raised: oklch(1.0 0 0);
  --surface-sunken: oklch(0.96 0.005 <brand-hue>);
  --border:         oklch(0.88 0.01 <brand-hue>);
  --text:           oklch(0.15 0.01 <brand-hue>);
  --text-secondary: oklch(0.45 0.01 <brand-hue>);
  --text-inverted:  oklch(0.95 0 0);

  /* Feedback — with subtle background variants */
  --success:    oklch(0.55 0.15 145);
  --warning:    oklch(0.65 0.15 85);
  --error:      oklch(0.55 0.2 25);
  --info:       oklch(0.55 0.15 250);
}

[data-theme="dark"] {
  /* Elevation through lightness — higher z = lighter */
  --surface:        oklch(0.13 0.005 <brand-hue>);
  --surface-raised: oklch(0.17 0.005 <brand-hue>);
  --surface-sunken: oklch(0.10 0.005 <brand-hue>);
  --border:         oklch(1 0 0 / 0.08);
  --text:           oklch(0.93 0 0);
  --text-secondary: oklch(0.65 0 0);

  /* Reduced chroma on accents for dark mode */
  --primary:        oklch(<L+0.1> <C-0.04> <H>);
}
```

Verify all text-on-background combinations meet WCAG AA contrast (4.5:1 for body, 3:1 for large text).

#### 2. Typography

Select a font pairing based on personality. Provide the Google Fonts import or variable font files:

```
Display/Heading: <font-name> — <weight range>
  Why: <1 sentence on why this fits the personality>

Body: <font-name> — <weight range>
  Why: <1 sentence>

Mono (if Technical personality): <font-name>
```

Choose a **modular type scale** appropriate to the project:

| Personality | Recommended Scale | Ratio |
|---|---|---|
| Minimal, Technical | Minor Third | 1.200 |
| Bold, Playful | Major Third | 1.250 |
| Editorial, Luxury | Perfect Fourth | 1.333 |

Define the type scale using **fluid typography with `clamp()`**:

```css
--text-display:   clamp(2.5rem, 1.5rem + 4vw, 4.5rem);   /* hero headings */
--text-heading-1: clamp(2rem, 1.25rem + 3vw, 3rem);       /* page titles */
--text-heading-2: clamp(1.5rem, 1rem + 2vw, 2.25rem);     /* section headings */
--text-heading-3: clamp(1.25rem, 1rem + 1vw, 1.75rem);    /* subsections */
--text-body-lg:   clamp(1.125rem, 1rem + 0.5vw, 1.25rem); /* lead paragraphs */
--text-body:      1rem;                                     /* 16px default */
--text-body-sm:   0.875rem;                                 /* secondary text */
--text-caption:   0.75rem;                                  /* labels, metadata */
```

Include line-height and letter-spacing per level:
- Display/heading: line-height 1.1-1.2, letter-spacing -0.02em to -0.01em
- Body: line-height 1.5-1.6, letter-spacing normal
- Caption/small: line-height 1.4-1.5, letter-spacing 0.01em

Set `max-width` on body text containers to enforce 45-85 character line length (typically `65ch`).

#### 3. Spacing and layout

Use the **8px grid** with a constrained scale:

```css
--space-1:  0.25rem;  /* 4px — sub-grid fine-tuning */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */

/* Layout */
--container-max:  80rem;   /* 1280px */
--content-max:    65ch;    /* optimal reading width */
--section-padding: clamp(3rem, 2rem + 5vw, 6rem);
--grid-gap:       var(--space-6);
```

Define the responsive grid:

| Breakpoint | Columns | Gutter | Margin |
|---|---|---|---|
| < 640px (mobile) | 4 | 16px | 16px |
| 640-1024px (tablet) | 8 | 24px | 24px |
| > 1024px (desktop) | 12 | 24-32px | auto (centered) |

#### 4. Component tokens

```css
/* Border radius — matched to personality */
--radius-sm:  0.25rem;   /* 4px — inputs, badges */
--radius-md:  0.5rem;    /* 8px — cards, buttons */
--radius-lg:  0.75rem;   /* 12px — modals, large cards */
--radius-full: 9999px;   /* pills, avatars */
/* Minimal/Technical: 4-8px. Playful: 12-16px. Luxury: 0-4px. */

/* Elevation — light mode uses shadows, dark mode uses lighter surfaces + borders */
--shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
--shadow-md: 0 4px 8px oklch(0 0 0 / 0.08);
--shadow-lg: 0 12px 24px oklch(0 0 0 / 0.12);

/* Focus — accessible, 3:1 contrast minimum */
--focus-ring: 0 0 0 2px var(--surface), 0 0 0 4px var(--primary);

/* Motion — custom curves, never default ease */
--duration-fast:   100ms;
--duration-normal: 200ms;
--duration-slow:   350ms;
--ease-out:        cubic-bezier(0.0, 0.0, 0.2, 1);   /* entrances */
--ease-in:         cubic-bezier(0.4, 0.0, 1, 1);      /* exits */
--ease-standard:   cubic-bezier(0.4, 0.0, 0.2, 1);   /* movement */

/* Border */
--border-width: 1px;
--border-color: var(--border);
```

#### 5. Output files

**`tailwind.config.ts`** — Extended theme with all tokens using OKLCH:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          hover: 'oklch(var(--primary-hover) / <alpha-value>)',
          subtle: 'oklch(var(--primary-subtle) / <alpha-value>)',
        },
        secondary: 'oklch(var(--secondary) / <alpha-value>)',
        surface: {
          DEFAULT: 'oklch(var(--surface) / <alpha-value>)',
          raised: 'oklch(var(--surface-raised) / <alpha-value>)',
          sunken: 'oklch(var(--surface-sunken) / <alpha-value>)',
        },
        border: 'oklch(var(--border) / <alpha-value>)',
        text: {
          DEFAULT: 'oklch(var(--text) / <alpha-value>)',
          secondary: 'oklch(var(--text-secondary) / <alpha-value>)',
          inverted: 'oklch(var(--text-inverted) / <alpha-value>)',
        },
        success: 'oklch(var(--success) / <alpha-value>)',
        warning: 'oklch(var(--warning) / <alpha-value>)',
        error: 'oklch(var(--error) / <alpha-value>)',
        info: 'oklch(var(--info) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        // Fluid type scale with line-height and letter-spacing
        display:   ['var(--text-display)',   { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-1': ['var(--text-heading-1)', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'heading-2': ['var(--text-heading-2)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading-3': ['var(--text-heading-3)', { lineHeight: '1.25', letterSpacing: '-0.005em' }],
        'body-lg':   ['var(--text-body-lg)',   { lineHeight: '1.6' }],
        body:        ['var(--text-body)',       { lineHeight: '1.6' }],
        'body-sm':   ['var(--text-body-sm)',    { lineHeight: '1.5' }],
        caption:     ['var(--text-caption)',    { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      spacing: {
        section: 'var(--section-padding)',
      },
      maxWidth: {
        content: 'var(--content-max)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'ease-out': 'var(--ease-out)',
        'ease-in': 'var(--ease-in)',
        standard: 'var(--ease-standard)',
      },
    },
  },
  plugins: [],
}

export default config
```

**`src/styles/globals.css`** — Font imports, CSS custom properties, base styles, reduced motion:

```css
@import url('https://fonts.googleapis.com/css2?family=<Display>&family=<Body>&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: light;
    /* All CSS custom property definitions from sections above */
  }

  [data-theme="dark"] {
    color-scheme: dark;
    /* Dark mode overrides — only semantic tokens remap */
  }

  /* Respect system preference when no explicit theme set */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      /* Dark mode values */
    }
  }

  body {
    @apply bg-surface text-text font-body text-body antialiased;
  }

  /* Accessible focus indicators */
  :focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  /* Skip link */
  .skip-link {
    @apply absolute -top-10 left-0 z-50 bg-primary text-text-inverted px-4 py-2;
  }
  .skip-link:focus {
    @apply top-0;
  }

  /* Prose container for optimal line length */
  .prose {
    max-width: var(--content-max);
  }
}

/* Reduced motion: replace animations with fades or instant changes */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**`src/styles/design-system.ts`** — Exportable design tokens for JS:

```typescript
export const designSystem = {
  personality: '<chosen personality>',
  typeScale: '<chosen modular scale>',
  fonts: {
    display: '<font-name>',
    body: '<font-name>',
    mono: '<font-name or null>',
  },
  colors: {
    brand: '<oklch value>',
  },
  grid: {
    base: 8,
    columns: { mobile: 4, tablet: 8, desktop: 12 },
  },
  motion: {
    durationFast: 100,
    durationNormal: 200,
    durationSlow: 350,
  },
} as const
```

**`src/components/ui/`** — Core component files styled with design tokens:

- `Button.tsx` — primary, secondary, ghost, destructive variants. Min height 44px (touch target). Proper hover/focus-visible/disabled states. Focus ring from tokens. Transition with custom easing.
- `Card.tsx` — uses `border` by default (not shadow). Surface-raised background. Proper padding from spacing scale. Optional hover state with subtle border color change.
- `Input.tsx` — label above input (never placeholder-only). Focus ring from tokens. Error state with color + icon (not color alone). Min height 44px touch target.
- `Badge.tsx` — status badges using feedback colors with subtle backgrounds.
- `Typography.tsx` — heading and body text components enforcing the type scale. Sets `max-width: 65ch` on body text. Uses fluid sizes.
- `Skeleton.tsx` — loading skeleton with left-to-right shimmer animation. Respects `prefers-reduced-motion`.

Each component must:
- Use semantic color tokens only (never raw Tailwind colors)
- Meet minimum touch target size (48x48px recommended)
- Include `focus-visible` styles
- Use custom easing functions (never default `ease`)
- Include proper ARIA attributes

#### 6. Present and approve

Output the complete design system to the user with:
- Color palette with OKLCH values and visual descriptions
- Font pairing with rationale and type scale preview
- Spacing scale visualization
- Dark mode preview (if applicable)
- Example of how a card, button, and heading look together (described)

Ask for approval:
- `Approve` — write all files
- `Adjust colors` — change the palette
- `Adjust typography` — change fonts
- `Adjust personality` — shift the overall feel
- `Start over` — full redesign

Loop until approved, then write all files.

---

### Action: Design page

**Prerequisite:** A design system must exist. If not, tell the user: "No design system found. Run `/design system` first." Then stop.

Use the AskUserQuestion tool to collect in a single prompt:

**Question 1 — Page type:**
- `Landing page` — marketing/product page
- `Dashboard` — data display, charts, tables
- `Content page` — blog post, article, documentation
- `Form page` — signup, checkout, multi-step form
- `List/catalog page` — product grid, search results
- `Detail page` — single item view (product, profile, order)
- `Settings page` — account/app settings
- `Auth page` — login, signup, forgot password
- `Other` — describe it

**Question 2 — Description:**
"Describe the page content and purpose. What does the user see and do here?"

**Question 3 — Layout preference:**
- `Let me decide` — Claude proposes the layout
- `Asymmetric` — break the grid, varied column widths, bento style
- `Full-bleed` — edge-to-edge sections with contained content
- `Sidebar` — content + sidebar layout
- `Centered` — narrow centered content (editorial style)

**Then generate the page:**

1. Read the design system from `src/styles/design-system.ts` and `tailwind.config.ts`.

2. Plan the page layout applying the Design Foundations:

   **Visual hierarchy planning:**
   - What does the eye hit first, second, third? (size > contrast > weight > position > whitespace)
   - Which scanning pattern fits this page? (F-pattern for text-heavy, Z-pattern for marketing, layer-cake for long-form)
   - Where are the visual anchors? (a bold stat, a pull quote, a featured image)

   **Layout rules (anti-generic):**
   - Vary section heights and padding — not every section the same
   - Use full width strategically — some sections contained, others full-bleed
   - Break alignment intentionally — offset elements, asymmetric grids, bento layouts
   - Use color blocking — alternate surface colors between sections
   - Typography variety — don't use the same heading size for every section
   - Add texture where appropriate — grainy gradient backgrounds, subtle noise, border patterns

   **Page-type-specific patterns:**

   *Landing pages:* Z-pattern scanning. Split-screen hero (not centered). Bento grids for features. Social proof as a muted full-bleed bar. Asymmetric CTAs.

   *Dashboards:* F-pattern scanning. Preattentive visual processing — use bar length and position (not pie charts) for quantitative data. Limit to 5-9 key metrics. Group related data with Gestalt proximity. Use skeleton screens for loading.

   *Form pages:* Single-column layout. Labels above inputs. Validate on blur (not while typing). Show errors below input with color + icon. Multi-step forms show progress indicator. One logical group per step. 65ch max width.

   *Content pages:* Layer-cake scanning. Enforce 45-85 character line length. Generous line-height (1.5-1.6). Pull quotes or callouts break visual monotony. Sticky table of contents for long content.

   *List/catalog pages:* Vary card sizes — feature/hero cards mixed with standard. Use closure principle (partially visible cards signal scroll). Skeleton screens during load. Reserve image space with aspect-ratio.

   *Auth pages:* Centered, narrow form (max 400px). Minimal distractions. Clear error messages inline. Social login buttons visually distinct from primary form.

3. Generate the page component:

   **Component structure:**
   - `src/components/pages/<page-name>/<PageName>Page.tsx` — server component (data fetching)
   - `src/components/pages/<page-name>/<PageName>PageClient.tsx` — client component (interactivity)
   - `src/components/pages/<page-name>/<PageName>PageView.tsx` — pure presentational component
   - `src/app/<route>/page.tsx` — route file

   **Every page must include:**
   - Skip link as first focusable element
   - Semantic HTML landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`)
   - All interactive elements keyboard-accessible
   - Loading states (skeleton screens for async content)
   - Responsive: mobile-first, content-based breakpoints
   - All touch targets minimum 48x48px with 8px gaps
   - `prefers-reduced-motion` respected for any animations
   - `aria-live` regions for dynamic content updates

   **Use design system components:**
   - Import `Button`, `Card`, `Input`, `Badge`, `Typography`, `Skeleton` from `src/components/ui/`
   - Use Tailwind classes from the custom theme — never raw Tailwind defaults
   - All colors must be semantic tokens (`bg-surface-raised`, not `bg-gray-100`)
   - All spacing from the 8px grid (`gap-6`, not `gap-5`)
   - All typography from the fluid type scale
   - All motion with custom easing

4. Present the page structure as an annotated wireframe (ASCII):

   ```
   ┌─────────────────────────────────────────┐
   │ [Skip to content]                       │
   │ <header> Nav: logo left, CTA right      │
   ├─────────────────────────────────────────┤
   │ <main>                                  │
   │                                         │
   │  HERO: Split 60/40 layout               │
   │  Left: Display heading (clamp) + body   │
   │        + primary Button (48px height)   │
   │  Right: Product visual (aspect-ratio)   │
   │  bg-surface, py-section                 │
   │                                         │
   ├─────────────────────────────────────────┤
   │  PROOF: Logo bar                        │
   │  full-bleed bg-surface-sunken           │
   │  Muted, small — not competing with hero │
   ├──────────┬──────────────────────────────┤
   │ FEATURES │                              │
   │ Bento    │  Varied card sizes           │
   │ grid     │  1 large + 2 small + 1 wide  │
   │          │  border (not shadow)          │
   ├──────────┴──────────────────────────────┤
   │  CTA SECTION: full-bleed bg-primary     │
   │  Heading + Button (inverted)            │
   │                                         │
   │ <footer> Links + legal                  │
   └─────────────────────────────────────────┘
   ```

   Annotate with: semantic HTML elements, design tokens used, responsive behavior, scanning pattern.

5. Ask for approval:
   - `Approve` — generate the code
   - `Request changes` — adjust layout/content
   - `Cancel` — stop

6. On approval, write the page files. Include:
   - Placeholder content that reads like real copy (not "Lorem ipsum")
   - Image placeholders with `aspect-ratio` and descriptive `alt` text
   - Responsive: mobile-first with `min-width` breakpoints
   - All accessibility requirements from the checklist above
   - Comments marking where real data/images should replace placeholders

7. Report:
   ```
   ## Page Created

   **Page:** <page-name>
   **Type:** <page-type>
   **Scanning pattern:** <F/Z/layer-cake>
   **Files:**
   - src/components/pages/<page-name>/<PageName>Page.tsx
   - src/components/pages/<page-name>/<PageName>PageClient.tsx
   - src/components/pages/<page-name>/<PageName>PageView.tsx
   - src/app/<route>/page.tsx

   **Design system components used:** Button, Card, Typography, Skeleton, ...

   **Accessibility:**
   - Skip link: yes
   - Keyboard navigation: yes
   - ARIA landmarks: header, main, nav, footer
   - Touch targets: 48x48px minimum
   - Reduced motion: respected
   - Contrast: AA compliant

   **Next steps:**
   1. Replace placeholder content with real copy
   2. Replace image placeholders with actual assets
   3. Connect data fetching in the Page server component
   4. Test with keyboard navigation and screen reader
   ```
