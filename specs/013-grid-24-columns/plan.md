# Implementation Plan: 24-Column Dashboard Grid

**Branch**: `013-grid-24-columns` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-grid-24-columns/spec.md`

## Summary

Change the dashboard grid from 16 columns to 24 columns to enable finer-grained widget sizing. Update all widget dimensions (sizeDims), the default layout, and the layout migration logic. Existing user layouts auto-migrate from version 5 to version 6 by scaling horizontal values by 1.5x.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: react-grid-layout v2.2.2, recharts, shadcn/ui
**Storage**: localStorage (dashboard layout persisted as JSON)
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (desktop + mobile)
**Project Type**: Single-page web application
**Constraints**: No backend, all data in localStorage, 14 widgets on dashboard

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First | PASS | Grid change is invisible to users; widget proportions preserved |
| II. Mobile-First | PASS | Mobile uses single-column stack, unaffected. Tablet (sm) scales 8→12 |
| III. Financial Correctness | PASS | No financial math changes |
| IV. Safe Destructive Actions | PASS | No destructive operations |
| V. Accessibility | PASS | No accessibility changes |
| VI. Incremental Refactoring | PASS | 4 files changed, migration chain extends existing pattern |
| VII. Simplicity | PASS | Straightforward 1.5x multiplication, no new abstractions |

## Project Structure

### Documentation (this feature)

```text
specs/013-grid-24-columns/
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

### Source Code (files that change)

```text
src/
├── pages/dashboard/DashboardGrid.tsx        # cols prop: 16→24, sm: 8→12
├── lib/widgetRegistry.tsx                   # sizeDims w values ×1.5
├── lib/defaultLayout.ts                     # x/w values ×1.5, version 5→6
└── context/DashboardLayoutContext.tsx        # v5→v6 migration, boundary 16→24
test/
└── pages/Dashboard.test.tsx                 # Update if layout assertions exist
```

**Structure Decision**: All changes are within existing files. No new files needed.

## Implementation Approach

### Step 1: Update Grid Column Count

Change `DashboardGrid.tsx` cols from `{ lg: 16, md: 16, sm: 8 }` to `{ lg: 24, md: 24, sm: 12 }`.

### Step 2: Update Widget Dimensions

Scale all `w` values in `widgetRegistry.tsx` by 1.5x. Heights unchanged.

Shared constants become:
- `KPI_DIMS`: sm w=3, md w=6, lg w=6
- `CHART_WIDE_DIMS`: sm w=6, md w=12, lg w=12
- `LIST_DIMS`: sm w=6, md w=6, lg w=12

Per-widget overrides: quick-add, net-trend-chart, category-chart, owner-split-chart — see data-model.md.

### Step 3: Update Default Layout

Scale all `x` and `w` values in `defaultLayout.ts` by 1.5x. Bump version to 6. See data-model.md for the complete table.

### Step 4: Add v5→v6 Migration

In `DashboardLayoutContext.tsx`:
1. Accept version 6 in the version check
2. Add v5→v6 migration block: scale x and w by 1.5, round to nearest integer
3. Update boundary guard from 16 to 24
4. Return version 6 from validateLayout()

The migration chain becomes: v3→v4 (IDs) → v4→v5 (sizes) → v5→v6 (columns)

### Step 5: Verify

Run `bun run build`, `bun test`, `bun run lint`.

## Complexity Tracking

No constitution violations. No additional complexity introduced.
