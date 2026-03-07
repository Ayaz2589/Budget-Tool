/**
 * Design System Tokens — Budget Tool (Ortho)
 *
 * Personality: Minimal (Linear/Notion-inspired)
 * Primary color: Warm Indigo (oklch 0.50 0.18 275)
 * Reference: Monarch Money
 * Themes: Light + Dark
 */

export const designSystem = {
  personality: "minimal",
  typeScale: "minor-third",
  typeScaleRatio: 1.2,

  fonts: {
    display: "Inter",
    body: "Inter",
    mono: "JetBrains Mono",
  },

  colors: {
    brand: "oklch(0.50 0.18 275)",
    brandHue: 275,
    brandChroma: 0.18,
    brandLightness: 0.5,
  },

  grid: {
    base: 8,
    subGrid: 4,
    columns: { mobile: 4, tablet: 8, desktop: 12 },
    gutters: { mobile: 16, tablet: 24, desktop: 24 },
  },

  radius: {
    base: 12,
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  motion: {
    durationFast: 100,
    durationNormal: 180,
    durationSlow: 300,
    easeOut: "cubic-bezier(0.0, 0.0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0.0, 1, 1)",
    easeStandard: "cubic-bezier(0.4, 0.0, 0.2, 1)",
  },

  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
} as const;

export type DesignSystem = typeof designSystem;
