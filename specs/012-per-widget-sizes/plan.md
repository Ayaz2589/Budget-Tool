# Implementation Plan: Per-Widget Size Presets (S/M/L)

**Branch**: `012-per-widget-sizes` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-per-widget-sizes/spec.md`

## Summary

Replace the 7-value global `WidgetSize` type (`sm|wide|md|tall|wide-lg|lg|xl`) with a 3-value system (`sm|md|lg`). Move dimension definitions from a single global `SIZE_TO_DIMS` map into per-widget `sizeDims` entries in the widget registry. This lets each widget define what S, M, L means in grid columns × rows while presenting users with a clean 3-button picker. Existing localStorage layouts migrate from v4→v5 via a size-name mapping.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: react-grid-layout v2.2.2, @radix-ui/react-popover, framer-motion, lucide-react, i18next
**Storage**: localStorage (JSON, layout version 4 → 5)
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (desktop + mobile), deployed on Vercel
**Project Type**: Web (single SPA, no backend)
**Performance Goals**: No regressions — resize/drag remain immediate (<16ms frame)
**Constraints**: No new dependencies. Migration must be non-destructive.
**Scale/Scope**: 14 widgets, ~20 files changed, layout version bump

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First | PASS | Simplifying 7 cryptic labels to 3 universal ones directly improves UX |
| II. Mobile-First Parity | PASS | Mobile long-press popover gets same S/M/L picker |
| III. Financial Correctness | N/A | No financial calculations affected |
| IV. Safe Destructive Actions | PASS | Migration is non-destructive; preserves positions |
| V. Accessibility | PASS | Fewer buttons = simpler keyboard navigation; labels remain clear |
| VI. Incremental Refactoring | PASS | Type change + registry change + per-widget updates can be done incrementally |
| VII. Simplicity | PASS | Reducing from 7 sizes to 3 is a net simplification. Per-widget dims replace a global map — same complexity, more flexibility |

No violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/012-per-widget-sizes/
├── plan.md              # This file
├── research.md          # Phase 0: codebase research findings
├── data-model.md        # Phase 1: type and data changes
├── quickstart.md        # Phase 1: implementation guide
├── checklists/
│   └── requirements.md  # Requirements verification checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (files changed)

```text
src/
├── types/
│   └── widget.ts                          # WidgetSize type: 7 → 3 values
├── lib/
│   ├── widgetRegistry.tsx                 # Add sizeDims, remove allowedSizes
│   └── defaultLayout.ts                   # Update sizes + version 4 → 5
├── context/
│   └── DashboardLayoutContext.tsx          # Remove SIZE_TO_DIMS, add migration v4→v5
├── components/ds/
│   ├── DsWidgetShell.tsx                  # SIZE_LABELS: 7 → 3 entries
│   └── DsWidgetCard.tsx                   # SIZE_PADDING, SIZE_DENSITY: 7 → 3 entries
├── pages/dashboard/
│   ├── DashboardMobileGrid.tsx            # SIZE_LABELS: 7 → 3 entries
│   └── widgets/                           # 12 widget files with size branches
│       ├── NetCashFlow.tsx
│       ├── TotalSpent.tsx
│       ├── TotalIncome.tsx
│       ├── TotalDebt.tsx
│       ├── SmartInsights.tsx
│       ├── CashFlowChart.tsx
│       ├── NetTrendChart.tsx
│       ├── CategoryChart.tsx
│       ├── OwnerSplitChart.tsx
│       ├── DebtSnapshot.tsx
│       ├── SpendBySource.tsx
│       ├── RecentActivity.tsx
│       └── OwnerTransfers.tsx
test/
└── (no existing test files reference old size names)
```

**Structure Decision**: Pure refactor within the existing structure. No new files or directories needed in `src/`. All changes are edits to existing files.
