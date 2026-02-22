# Research: 24-Column Dashboard Grid

## Decision: Column Count

- **Chosen**: 24 columns (up from 16)
- **Rationale**: 24 is the standard grid size used by most design systems (Material UI, Ant Design, Bootstrap). It divides cleanly by 2, 3, 4, 6, 8, 12 — enabling 1/2, 1/3, 1/4, 1/6, 1/8, 1/12 width fractions. The 1.5x ratio from 16 makes migration arithmetic clean.
- **Alternatives**: 20 columns (rejected — doesn't divide by 3 or 6), 32 columns (rejected — overkill, too granular for 14 widgets)

## Decision: Migration Factor

- **Chosen**: Multiply x and w by 1.5, round to nearest integer
- **Rationale**: 16 × 1.5 = 24 exactly. Most current w values (2, 4, 6, 8) multiply cleanly: 2→3, 4→6, 6→9, 8→12. No current widget uses w=5 or w=7.
- **Edge case**: If any user has a manually-tweaked w that doesn't multiply cleanly, `Math.round()` produces acceptable results.

## Decision: Version Bump

- **Chosen**: Version 5 → 6
- **Rationale**: Follows existing migration pattern (v3→v4 for ID renames, v4→v5 for size simplification). The validateLayout function already handles multi-version migration chains.

## Current Grid Column Usage

All places where `16` is hard-coded:

1. `src/pages/dashboard/DashboardGrid.tsx:70` — `cols={{ lg: 16, md: 16, sm: 8, xs: 1, xxs: 1 }}`
2. `src/context/DashboardLayoutContext.tsx:90-92` — boundary guard `if (item.x + item.w > 16)`
3. `src/lib/defaultLayout.ts:4` — comment only

## Current Widget Dimensions (16-col)

| Widget | S (w×h) | M (w×h) | L (w×h) |
|--------|---------|---------|---------|
| KPI widgets (5) | 2×2 | 4×2 | 4×3 |
| quick-add | 4×3 | 8×4 | 8×6 |
| cash-flow-chart | 4×3 | 8×6 | 8×8 |
| net-trend-chart | 4×3 | 6×3 | 8×6 |
| category-chart | 4×3 | 6×4 | 8×8 |
| owner-split-chart | 4×3 | 6×4 | 8×8 |
| list widgets (4) | 4×3 | 4×6 | 8×6 |

## Proposed Widget Dimensions (24-col)

Applying 1.5x to widths, keeping heights unchanged:

| Widget | S (w×h) | M (w×h) | L (w×h) |
|--------|---------|---------|---------|
| KPI widgets (5) | 3×2 | 6×2 | 6×3 |
| quick-add | 6×3 | 12×4 | 12×6 |
| cash-flow-chart | 6×3 | 12×6 | 12×8 |
| net-trend-chart | 6×3 | 9×3 | 12×6 |
| category-chart | 6×3 | 9×4 | 12×8 |
| owner-split-chart | 6×3 | 9×4 | 12×8 |
| list widgets (4) | 6×3 | 6×6 | 12×6 |

## Files That Change

1. `src/pages/dashboard/DashboardGrid.tsx` — cols 16→24, sm breakpoint 8→12
2. `src/lib/widgetRegistry.tsx` — all sizeDims w values ×1.5
3. `src/lib/defaultLayout.ts` — all x/w values ×1.5, version 5→6
4. `src/context/DashboardLayoutContext.tsx` — boundary guard 16→24, add v5→v6 migration, accept version 6, return version 6
