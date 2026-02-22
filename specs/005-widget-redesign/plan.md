# Implementation Plan: Dashboard Widget Redesign

**Branch**: `005-widget-redesign` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-widget-redesign/spec.md`

## Summary

Rebuild all 14 dashboard widgets to render correctly at small (4-col), medium (6-col), and large (12-col) grid sizes. Currently, 5 of 14 widgets (4 chart widgets + Quick Add) ignore the `size` parameter entirely, and the remaining 9 have only basic size differentiation (sm vs. non-sm). The redesign will:

1. Add a unified `DsWidgetCard` wrapper providing consistent Card styling with size-responsive padding across all widgets.
2. Add full three-tier size support (sm/md/lg) to all 5 widgets that currently lack it.
3. Enhance the existing 9 size-aware widgets with distinct lg variants (most currently treat md and lg identically).
4. Ensure chart widgets at small size show a summary metric instead of a squeezed chart.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: react-grid-layout, recharts, shadcn/ui Card, Tailwind CSS v4, lucide-react
**Storage**: N/A (presentation-only change; localStorage layout persistence unchanged)
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web application (frontend only)
**Performance Goals**: Widget re-render on size change < 200ms (SC-002)
**Constraints**: No new dependencies; use existing Card component and design tokens
**Scale/Scope**: 14 widgets x 3 sizes = 42 widget-size combinations to validate

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First Development | PASS | Designing size variants from user perspective first; empty states required at all sizes (FR-011) |
| II. Mobile-First Parity | PASS | Mobile uses medium variant as default (FR-013); separate mobile/desktop rendering paths preserved |
| III. Financial Correctness | PASS | No math changes — presentation redesign only (FR-014) |
| IV. Safe Destructive Actions | N/A | No destructive operations in this feature |
| V. Accessibility | PASS | Existing a11y attributes preserved; Card wrapper uses semantic markup; focus rings maintained |
| VI. Incremental Refactoring | PASS | Widgets rebuilt one-by-one with tests first; existing tests must not break (SC-004) |
| VII. Simplicity | PASS | Single DsWidgetCard wrapper, no new state management; size logic stays in each widget |

**Post-Phase 1 Re-check**: No violations. The DsWidgetCard component is justified — it replaces inconsistent ad-hoc wrapper divs across 14 widgets with a single reusable component. This reduces complexity.

## Project Structure

### Documentation (this feature)

```text
specs/005-widget-redesign/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: codebase research findings
├── data-model.md        # Phase 1: widget size mapping reference
├── quickstart.md        # Phase 1: development setup guide
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ds/
│   │   ├── DsWidgetCard.tsx          # NEW: Unified card wrapper with size-responsive padding
│   │   ├── DsWidgetShell.tsx         # MODIFY: Integrate DsWidgetCard as inner wrapper
│   │   ├── DsMetricCard.tsx          # MODIFY: Accept size prop for padding adaptation
│   │   ├── DsChartCard.tsx           # MODIFY: Accept size prop, add Card wrapper
│   │   └── index.ts                  # MODIFY: Export DsWidgetCard
│   └── ui/
│       └── card.tsx                  # READ-ONLY: Existing Card component (surface/density variants)
├── pages/
│   └── dashboard/
│       ├── DashboardCashFlowChart.tsx    # MODIFY: Add size prop, sm=summary metric
│       ├── DashboardNetCashFlowChart.tsx # MODIFY: Add size prop, sm=summary metric
│       ├── DashboardCategoryChart.tsx    # MODIFY: Add size prop, sm=summary metric
│       ├── DashboardOwnerSplit.tsx       # MODIFY: Add size prop, sm=summary metric
│       ├── DashboardQuickAdd.tsx         # MODIFY: Add size prop, adapt pill layout
│       └── widgets/
│           ├── WidgetKpiNetCashFlow.tsx  # MODIFY: Add lg variant
│           ├── WidgetKpiTotalSpent.tsx   # MODIFY: Add lg variant
│           ├── WidgetKpiTotalIncome.tsx  # MODIFY: Add lg variant
│           ├── WidgetKpiTotalDebt.tsx    # MODIFY: Add lg variant
│           ├── WidgetDebtSnapshot.tsx    # MODIFY: Enhance lg variant
│           ├── WidgetSpendBySource.tsx   # MODIFY: Enhance lg variant
│           ├── WidgetOwnerTransfers.tsx  # MODIFY: Enhance lg variant
│           ├── WidgetRecentActivity.tsx  # MODIFY: Already has sm/md/lg, review
│           └── WidgetSmartInsights.tsx   # MODIFY: Enhance lg variant
├── lib/
│   └── widgetRegistry.tsx               # MODIFY: Pass size to all render functions consistently
└── types/
    └── widget.ts                        # READ-ONLY: Types unchanged

test/
├── components/
│   └── ds/
│       └── DsWidgetCard.test.tsx        # NEW: Card wrapper tests
└── pages/
    └── dashboard/
        ├── Dashboard.test.tsx           # MODIFY: Update for new card wrapper structure
        └── widgets/
            ├── WidgetKpiNetCashFlow.test.tsx     # NEW: Size variant tests
            ├── WidgetKpiTotalSpent.test.tsx      # NEW: Size variant tests
            ├── WidgetDebtSnapshot.test.tsx       # NEW: Size variant tests
            ├── WidgetRecentActivity.test.tsx     # NEW: Size variant tests
            ├── DashboardCashFlowChart.test.tsx   # NEW: Size variant tests
            ├── DashboardCategoryChart.test.tsx   # NEW: Size variant tests
            └── DashboardQuickAdd.test.tsx        # NEW: Size variant tests
```

**Structure Decision**: All changes fit within the existing `src/pages/dashboard/` and `src/components/ds/` directories. No new directories needed except test files for new/modified components.

## Design Decisions

### 0. Extensible Widget Architecture

The redesign standardizes the widget creation pattern so new widgets require exactly two steps:

1. **Registry entry** in `src/lib/widgetRegistry.tsx`: `{ type, label, icon, defaultSize, minH, render }`
2. **Render component**: A function `(props: Record<string, unknown>, size: WidgetSize) => ReactNode`

Everything else — card wrapping (DsWidgetCard), edit-mode controls (DsWidgetShell), grid placement (DashboardGrid), mobile layout (DashboardMobileGrid), and catalog listing (DsWidgetCatalog) — is inherited automatically. No infrastructure code needs modification.

**Key architectural constraints**:
- The widget registry is the single source of truth for all widget metadata (FR-018). Widget type, label, icon, sizes, and render function live only there.
- The `size` parameter MUST be passed to every render function. Widgets default to their medium layout for unrecognized sizes (FR-017).
- DsWidgetShell + DsWidgetCard handle all container concerns. Widgets never wrap themselves in cards or manage their own padding.
- The `WidgetType` union type and `DEFAULT_LAYOUT` must be updated when adding a widget, but these are the only additional touchpoints.

### 1. DsWidgetCard — Unified Card Wrapper

A new `DsWidgetCard` component wraps each widget's content inside the existing `DsWidgetShell`. It uses the shadcn `Card` component with size-responsive padding:

| Size | Card Density | Padding | Rationale |
|------|-------------|---------|-----------|
| sm   | compact     | px-3 py-2 | Maximize content area in 4-col width |
| md   | default     | px-4 py-3 | Standard breathing room for 6-col |
| lg   | comfortable | px-5 py-4 | Full content with generous spacing |

The Card uses `surface="raised"` for visual hierarchy (background, border, shadow from design system tokens).

### 2. Chart Widgets at Small Size — Summary Metric Pattern

Instead of rendering a squeezed chart, small-size chart widgets display a summary metric:

| Chart Widget | Small Size Display |
|-------------|-------------------|
| Cash Flow (bar) | Total income vs. total expense as two numbers with delta |
| Net Trend (area) | Current month net cash flow as single KPI |
| Category (pie) | Top category name + percentage |
| Owner Split (pie) | Owner count + largest contributor name |

At medium size, charts render with reduced legends. At large size, full chart with all legends and tooltips.

### 3. Widget Registry — Size Passing Consistency

Currently 5 widgets don't receive `size`. The registry render functions will be updated to pass `size` to all 14 widgets. No signature change needed — `size` is already the second parameter.

### 4. Integration Point — DsWidgetShell

`DsWidgetShell` currently renders `{children}` directly. It will be updated to wrap children in `DsWidgetCard`:

```
DsWidgetShell (edit controls, header)
  └── DsWidgetCard size={size} (card styling, padding)
       └── {children} (widget content)
```

This means individual widgets no longer need their own card/container styling — they receive it from the shell.

### 5. Empty States

All widgets already use `DsEmptyState` for zero-data cases. The card wrapper will contain the empty state at every size. No empty-state logic changes needed — just ensure `DsEmptyState` renders proportionally within the card.

## Complexity Tracking

> No violations. All changes use existing patterns and components.

| Decision | Justification | Simpler Alternative |
|----------|--------------|---------------------|
| New DsWidgetCard component | Replaces 14 ad-hoc wrapper divs with 1 reusable component | Inline card styles in each widget — rejected because it's 14x duplication |
| Standardized render contract | Enforces consistent (props, size) signature for all widgets | Let each widget define its own prop interface — rejected because it breaks extensibility and requires per-widget knowledge in the grid/shell |
