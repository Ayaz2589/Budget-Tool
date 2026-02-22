# Data Model: Per-Widget Size Presets (S/M/L)

**Feature**: 012-per-widget-sizes
**Date**: 2026-02-21

## Type Changes

### WidgetSize (src/types/widget.ts)

**Before**:
```typescript
export type WidgetSize = "sm" | "wide" | "md" | "tall" | "wide-lg" | "lg" | "xl";
```

**After**:
```typescript
export type WidgetSize = "sm" | "md" | "lg";
```

### SizeDims (new type in src/types/widget.ts)

```typescript
export type SizeDims = Record<WidgetSize, { w: number; h: number }>;
```

### WidgetRegistryEntry (src/types/widget.ts)

**Before**:
```typescript
export interface WidgetRegistryEntry {
  id: WidgetType;
  label: string;
  component: React.ComponentType<WidgetComponentProps>;
  defaultSize: WidgetSize;
  allowedSizes: WidgetSize[];
}
```

**After**:
```typescript
export interface WidgetRegistryEntry {
  id: WidgetType;
  label: string;
  component: React.ComponentType<WidgetComponentProps>;
  defaultSize: WidgetSize;
  sizeDims: SizeDims;
}
```

### WidgetLayoutItem (unchanged)

```typescript
export interface WidgetLayoutItem {
  id: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  size: WidgetSize;  // now only "sm" | "md" | "lg"
  visible: boolean;
}
```

## Constant Changes

### SIZE_TO_DIMS (removed from DashboardLayoutContext.tsx)

The global mapping is deleted. Dimension lookup moves to per-widget registry entries.

### SIZE_ORDER (removed from DashboardLayoutContext.tsx)

No longer needed — all widgets support all 3 sizes.

### clampToAllowed() (removed from DashboardLayoutContext.tsx)

No longer needed — no `allowedSizes` to clamp to.

### SIZE_LABELS (DsWidgetShell.tsx, DashboardMobileGrid.tsx)

**Before**: `{ sm: "S", wide: "W", md: "M", tall: "T", "wide-lg": "WL", lg: "L", xl: "XL" }`
**After**: `{ sm: "S", md: "M", lg: "L" }`

### SIZE_PADDING (DsWidgetCard.tsx)

**Before**: 7 entries
**After**:
```typescript
const SIZE_PADDING: Record<WidgetSize, string> = {
  sm: "px-4 py-3",
  md: "px-4 py-3",
  lg: "px-5 py-4",
};
```

### SIZE_DENSITY (DsWidgetCard.tsx)

**Before**: 7 entries
**After**:
```typescript
const SIZE_DENSITY: Record<WidgetSize, "compact" | "default" | "comfortable"> = {
  sm: "compact",
  md: "default",
  lg: "comfortable",
};
```

## Per-Widget sizeDims Values

| Widget | sm | md | lg |
|--------|----|----|-----|
| net-cash-flow | 2×2 | 4×2 | 4×3 |
| total-spent | 2×2 | 4×2 | 4×3 |
| total-income | 2×2 | 4×2 | 4×3 |
| total-debt | 2×2 | 4×2 | 4×3 |
| smart-insights | 2×2 | 4×2 | 4×3 |
| quick-add | 4×3 | 8×4 | 8×6 |
| cash-flow-chart | 4×3 | 8×6 | 8×12 |
| net-trend-chart | 4×3 | 8×4 | 8×6 |
| category-chart | 4×3 | 8×6 | 8×12 |
| owner-split-chart | 4×3 | 8×6 | 8×12 |
| debt-snapshot | 4×3 | 4×6 | 8×6 |
| spend-by-source | 4×3 | 4×6 | 8×6 |
| owner-transfers | 4×3 | 4×6 | 8×6 |
| recent-activity | 4×3 | 4×6 | 8×6 |

## Migration

### v4 → v5 Size Mapping

```typescript
const SIZE_MIGRATION: Record<string, WidgetSize> = {
  sm: "sm",
  wide: "md",
  md: "md",
  tall: "md",
  "wide-lg": "lg",
  lg: "lg",
  xl: "lg",
};
```

### Migration Function

Applied during `validateLayout()` when stored version < 5:
1. For each layout item, map `item.size` through `SIZE_MIGRATION`
2. Look up new dimensions from the widget's `sizeDims[newSize]`
3. Update `item.w` and `item.h` to match
4. Preserve `item.x` and `item.y`
5. Set layout version to 5

### Layout Version

**Before**: `4`
**After**: `5`
