# Data Model: Desktop Modal Layout Optimization

**Branch**: `024-desktop-modal-layouts` | **Date**: 2026-02-26

## Overview

This feature is purely presentational — no new entities, state, or persistence are introduced. The data model impact is limited to component prop additions.

## Component Prop Changes

### SheetContent (modified)

**New prop**: `desktopModalSize`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `desktopModalSize` | `"compact" \| "standard" \| "wide"` | `"compact"` | Controls desktop modal width when `desktopVariant="modal"`. `"compact"` = 448px (`max-w-md`), `"standard"` = 576px (`max-w-xl`), `"wide"` = 672px (`max-w-2xl`). Ignored on mobile and when `desktopVariant="sheet"`. |

### No State Changes

- No new context providers
- No localStorage schema changes
- No new hooks
- Dashboard layout version unchanged

### Width Tier Mapping (constants, not persisted)

```
MODAL_SIZE_CLASSES = {
  compact:  "max-w-md"   // 448px — action dialogs
  standard: "max-w-xl"   // 576px — simple input forms
  wide:     "max-w-2xl"  // 672px — complex multi-field forms
}
```
