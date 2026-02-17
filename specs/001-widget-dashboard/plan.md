# Implementation Plan: Widget-Based Dashboard

**Branch**: `001-widget-dashboard` | **Date**: 2026-02-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-widget-dashboard/spec.md`

## Summary

Transform Ortho's static dashboard into a widget-based system where all 14 dashboard elements (4 KPI cards, Quick Add bar, 4 charts, 5 data sections) become independent, draggable, resizable widgets on a customizable grid. Uses `react-grid-layout` v2 for the grid engine with layout persistence in `localStorage`. Desktop gets a full 12-column drag-and-drop grid; mobile gets a single-column layout with move-up/move-down reordering. An explicit edit mode prevents accidental rearrangement during daily use.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19, Vite 7
**Primary Dependencies**: `react-grid-layout` v2 (new), `framer-motion` (existing — edit mode animations)
**Storage**: `localStorage` via existing `StorageAdapter` (`src/lib/storage.ts`)
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (desktop + mobile browsers)
**Project Type**: Web (single SPA, no backend)
**Performance Goals**: Dashboard load with saved layout must be imperceptibly different from current static load. Edit mode transitions under 200ms.
**Constraints**: No backend, all data in `localStorage`. No external state libraries. Presentation-layer change only — financial calculations unchanged.
**Scale/Scope**: 14 widget types, ~6 new files, ~5 modified files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First Development | PASS | Edit mode with drag handles, visual indicators. Widget catalog for discoverability. Lazy rendering preserved — widgets only render their content, not edit chrome, outside edit mode. |
| II. Mobile-First Parity | PASS | Separate mobile single-column layout (FR-012). Move-up/move-down buttons instead of unreliable touch drag. Independent desktop/mobile layout storage (FR-013). |
| III. Financial Correctness | PASS | Presentation-layer only — no changes to financial math, selectors, or data flow. FR-015 explicitly requires all calculations remain identical. |
| IV. Safe Destructive Actions | PASS | "Reset to Default" requires confirmation dialog (US4). Hiding a widget is non-destructive (reversible via catalog). No data deletion. |
| V. Accessibility | PASS | Widget shells will have `role="button"`, `tabIndex={0}`, `aria-label` with widget name. Drag handles get `aria-grabbed`/`aria-dropeffect`. Size controls accessible via keyboard. Focus rings via `--focus-ring`. |
| VI. Incremental Refactoring | PASS | Existing dashboard components are wrapped in widget shells — not rewritten. Tests added first for layout context and registry, then components refactored incrementally. |
| VII. Simplicity | PASS | `react-grid-layout` provides drag+resize+responsive out of the box — avoids building a custom grid engine. New context follows existing pattern. No new state library. See Complexity Tracking for the one new dependency justification. |

**Post-Phase 1 re-check**: All gates still pass. The data model adds one `localStorage` key and one context — minimal surface area. No new patterns introduced beyond what the codebase already uses.

## Project Structure

### Documentation (this feature)

```text
specs/001-widget-dashboard/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: library evaluation and decisions
├── data-model.md        # Phase 1: entity definitions and storage schema
├── quickstart.md        # Phase 1: setup and build order guide
├── contracts/
│   └── widget-system.ts # Phase 1: TypeScript interface contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── context/
│   └── DashboardLayoutContext.tsx    # NEW — layout state, edit mode, persistence
├── lib/
│   ├── widgetRegistry.ts            # NEW — widget type definitions and render map
│   ├── defaultLayout.ts             # NEW — default layout constant
│   └── storage.ts                   # MODIFY — add DASHBOARD_LAYOUT key
├── components/
│   └── ds/
│       ├── DsWidgetShell.tsx        # NEW — edit mode wrapper per widget
│       └── DsWidgetCatalog.tsx      # NEW — add/restore hidden widgets panel
├── pages/
│   └── dashboard/
│       ├── Dashboard.tsx            # MODIFY — replace static layout with grid
│       ├── DashboardGrid.tsx        # NEW — react-grid-layout integration
│       ├── DashboardKpiCards.tsx     # MODIFY — extract individual KPI widgets
│       └── DashboardDebtSnapshot.tsx # MODIFY — split accordion into widgets

test/
├── context/
│   └── DashboardLayoutContext.test.ts  # NEW
├── lib/
│   ├── widgetRegistry.test.ts          # NEW
│   └── defaultLayout.test.ts           # NEW
├── components/
│   └── ds/
│       └── DsWidgetShell.test.tsx      # NEW
└── pages/
    └── dashboard/
        └── DashboardGrid.test.tsx      # NEW
```

**Structure Decision**: Follows the existing single SPA structure. New files are placed in their natural locations per the app's conventions (`src/context/` for contexts, `src/lib/` for pure logic, `src/components/ds/` for design system components, `src/pages/dashboard/` for dashboard-specific components). No new top-level directories.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New dependency: `react-grid-layout` v2 | Provides drag-and-drop, resize, responsive breakpoints, and layout serialization out of the box — the four core capabilities this feature requires | Building a custom grid engine with CSS Grid + native drag events would require implementing collision detection, cell snapping, resize handles, and layout compaction from scratch — a multi-week effort that produces worse UX. This is the simpler choice, not the complex one. |
