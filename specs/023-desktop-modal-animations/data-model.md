# Data Model: Desktop Modal with Animated Transitions

**Branch**: `023-desktop-modal-animations` | **Date**: 2026-02-26

## Overview

This feature is purely presentational — no new entities, state, or persistence are introduced. The data model impact is limited to component prop changes.

## Component Prop Changes

### SheetContent (modified)

**New prop**: `desktopVariant`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `desktopVariant` | `"sheet" \| "modal"` | `"sheet"` | Controls desktop (768px+) presentation. `"sheet"` = existing slide-in side panel. `"modal"` = centered overlay with framer-motion animation. Mobile behavior is always full-screen sheet regardless of this prop. |

### No State Changes

- No new context providers
- No localStorage schema changes
- No new hooks (reuses existing `useMediaQuery`)
- Dashboard layout version unchanged

### Animation Variants (constants, not persisted)

```
MODAL_VARIANTS = {
  initial: { opacity: 0, scale: 0.95 }
  animate: { opacity: 1, scale: 1 }
  exit:    { opacity: 0, scale: 0.95 }
}

BACKDROP_VARIANTS = {
  initial: { opacity: 0 }
  animate: { opacity: 1 }
  exit:    { opacity: 0 }
}

MODAL_TRANSITION = { duration: 0.25, ease: "easeOut" }
```
