# Research: Per-Widget Size Presets (S/M/L)

**Feature**: 012-per-widget-sizes
**Date**: 2026-02-21

## R1: Size Migration Strategy

**Decision**: Map old sizes to new using a static lookup, preserving positions.

**Rationale**: The 7 old sizes collapse cleanly into 3 categories:
- Small group: `sm` → `sm`
- Medium group: `wide`, `md`, `tall` → `md`
- Large group: `wide-lg`, `lg`, `xl` → `lg`

This mapping was chosen because:
- `wide` (4×2) is closest to `md` behavior — a wider-than-small variant
- `tall` (4×12) is an outlier used only for list widgets; collapsing to `md` and letting per-widget dims handle the height is cleaner than preserving the extreme height
- `wide-lg` (8×4) is only used by `net-trend-chart`; `lg` is the natural bucket

**Alternatives considered**:
- Per-widget migration (custom mapping per widget type): Rejected — adds complexity with no real benefit since the static mapping works for all 14 widgets
- Dimension-based migration (find closest S/M/L by grid area): Rejected — fragile and surprising when `tall` (4×12 = 48 cells) would map to `lg` instead of `md`

## R2: Per-Widget Dimension Lookup

**Decision**: Add `sizeDims: Record<WidgetSize, { w: number; h: number }>` to each `WidgetRegistryEntry`. Remove global `SIZE_TO_DIMS`.

**Rationale**: The layout context currently does `SIZE_TO_DIMS[size]` to get dimensions. Changing this to `WIDGET_REGISTRY[widgetId].sizeDims[size]` is a minimal change — same lookup pattern, just widget-aware. The registry already exists and is imported everywhere sizes are used.

**Alternatives considered**:
- Separate `WIDGET_DIMS` constant outside the registry: Rejected — splits related data across two locations
- Dimension function `getDims(widgetId, size)`: Rejected — unnecessary indirection when a simple property access suffices

## R3: Widget Size Branch Simplification

**Decision**: Map old size branches to new equivalents. Use actual grid dimensions for content decisions where needed.

**Findings from codebase analysis** (20 files reference old sizes):

| Widget | Current branches | New mapping |
|--------|-----------------|-------------|
| NetCashFlow | `sm \| wide` → simple; `md` → full | `sm` → simple; `md \| lg` → full |
| TotalSpent | `sm \| wide` → simple; else → full | `sm` → simple; `md \| lg` → full |
| TotalIncome | `sm \| wide` → simple; else → full | `sm` → simple; `md \| lg` → full |
| TotalDebt | `sm \| wide` → simple; else → full | `sm` → simple; `md \| lg` → full |
| SmartInsights | `sm \| wide` → simple; else → full | `sm` → simple; `md \| lg` → full |
| CashFlowChart | `sm`/`md`/`lg`/`xl` branches | `sm`/`md`/`lg` branches (merge lg+xl into lg) |
| NetTrendChart | `sm`/`wide-lg`/`md` + `lg` title | `sm`/`md`/`lg` (wide-lg→md, lg title stays) |
| CategoryChart | `xl` special branch | `lg` special branch |
| OwnerSplitChart | `xl \| lg` branches | `lg` branch |
| DebtSnapshot | `xl \| tall` / `lg` / else | `lg` / `md` / `sm` |
| SpendBySource | `xl \| tall` / `lg` / else | `lg` / `md` / `sm` |
| RecentActivity | `xl \| tall` / `lg` / else | `lg` / `md` / `sm` |
| OwnerTransfers | `xl \| tall` / `lg` / else | `lg` / `md` / `sm` |

## R4: SIZE_ORDER and clampToAllowed Removal

**Decision**: Remove `SIZE_ORDER` and `clampToAllowed()` since `allowedSizes` is being removed.

**Rationale**: With all widgets supporting exactly 3 sizes (sm, md, lg), there's no need to clamp to an allowed subset. The `clampToAllowed` function existed to handle the case where a widget's persisted size wasn't in its `allowedSizes` — that scenario no longer exists.

## R5: Layout Version Migration Pattern

**Decision**: Follow the existing v3→v4 migration pattern already in `DashboardLayoutContext.tsx`.

**Rationale**: The codebase already has `ID_MIGRATION` (v3→v4) at lines 46-56 of DashboardLayoutContext.tsx. The v4→v5 migration follows the same pattern: iterate layout items, map size names, update version. This is proven, tested infrastructure.

## R6: Default Layout Updates

**Decision**: Update `defaultLayout.ts` to use new size names and bump version to 5. Recalculate w/h from per-widget sizeDims.

**Current default layout sizes and their new equivalents**:
- KPIs (net-cash-flow, total-spent, total-income, total-debt): `wide` → `md` (dims: 4×2)
- quick-add, debt-snapshot, spend-by-source, recent-activity: `md` → `md` (dims: 4×3 for quick-add, 4×3 for others)
- cash-flow-chart: `xl` → `lg` (dims: 8×12)
- net-trend-chart: `wide-lg` → `md` (dims: 8×4)
- category-chart, owner-split-chart: `xl` → `lg` (dims: 8×12)
- owner-transfers: `md` → `md` (dims: 4×3)
- smart-insights: `wide` → `md` (dims: 4×2)

Note: After migration, the w/h values in the default layout must match the per-widget sizeDims for the assigned size. This means some w/h values may change if the new size's dims differ from the old.
