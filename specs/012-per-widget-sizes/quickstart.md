# Quickstart: Per-Widget Size Presets (S/M/L)

**Feature**: 012-per-widget-sizes
**Date**: 2026-02-21

## Implementation Order

### Step 1: Update types (src/types/widget.ts)

1. Change `WidgetSize` from 7 values to `"sm" | "md" | "lg"`
2. Add `SizeDims` type: `Record<WidgetSize, { w: number; h: number }>`
3. Replace `allowedSizes: WidgetSize[]` with `sizeDims: SizeDims` in `WidgetRegistryEntry`

### Step 2: Update widget registry (src/lib/widgetRegistry.tsx)

For each of the 14 widgets:
1. Remove `allowedSizes` property
2. Add `sizeDims` with per-widget dimensions from the data model table
3. Update `defaultSize` — any `wide` → `md`, any `wide-lg` → `md`, any `xl` → `lg`

### Step 3: Update layout context (src/context/DashboardLayoutContext.tsx)

1. Remove `SIZE_TO_DIMS` constant
2. Remove `SIZE_ORDER` constant
3. Remove `clampToAllowed()` function
4. Add `SIZE_MIGRATION` constant for v4→v5 mapping
5. Update `validateLayout()`:
   - Add v4→v5 migration (after existing v3→v4 migration)
   - Replace `SIZE_TO_DIMS[size]` lookups with `WIDGET_REGISTRY[id].sizeDims[size]`
   - Update version check from 4 to 5
6. Update `resizeWidget()` to use registry `sizeDims` for dimension lookup

### Step 4: Update default layout (src/lib/defaultLayout.ts)

1. Bump version from 4 to 5
2. Update all size names: `wide` → `md`, `wide-lg` → `md`, `xl` → `lg`
3. Update w/h values to match per-widget sizeDims for the assigned size

### Step 5: Update UI components

**DsWidgetShell.tsx**:
1. Simplify `SIZE_LABELS` to 3 entries
2. Remove `allowedSizes` filtering — iterate all 3 sizes directly

**DsWidgetCard.tsx**:
1. Simplify `SIZE_PADDING` to 3 entries
2. Simplify `SIZE_DENSITY` to 3 entries

**DashboardMobileGrid.tsx**:
1. Simplify `SIZE_LABELS` to 3 entries
2. Remove `allowedSizes` filtering

### Step 6: Update widget components (12 files)

For each widget, simplify size branches:

**KPI widgets** (NetCashFlow, TotalSpent, TotalIncome, TotalDebt, SmartInsights):
- `size === "sm" || size === "wide"` → `size === "sm"`

**Chart widgets** (CashFlowChart, NetTrendChart, CategoryChart, OwnerSplitChart):
- Replace `xl`/`wide-lg` references with `lg`/`md` equivalents
- Merge branches where old sizes collapse to the same new size

**List widgets** (DebtSnapshot, SpendBySource, RecentActivity, OwnerTransfers):
- `size === "xl" || size === "tall"` → `size === "lg"`
- `size === "lg"` stays as-is
- Remaining maps to `sm` or `md`

### Step 7: Run verification

```bash
bun test           # All tests pass
bun run build      # TypeScript + Vite build passes
bun run lint       # No lint errors
```

Then grep for old size names to confirm none remain:
```bash
grep -r '"wide"\|"tall"\|"wide-lg"\|"xl"' src/
```

## Key Files Reference

| File | Change |
|------|--------|
| `src/types/widget.ts` | Type narrowing + SizeDims type |
| `src/lib/widgetRegistry.tsx` | sizeDims per widget, remove allowedSizes |
| `src/context/DashboardLayoutContext.tsx` | Remove globals, add migration |
| `src/lib/defaultLayout.ts` | Version bump, new size names |
| `src/components/ds/DsWidgetShell.tsx` | SIZE_LABELS simplification |
| `src/components/ds/DsWidgetCard.tsx` | SIZE_PADDING, SIZE_DENSITY simplification |
| `src/pages/dashboard/DashboardMobileGrid.tsx` | SIZE_LABELS simplification |
| `src/pages/dashboard/widgets/*.tsx` | Size branch simplification (12 files) |
