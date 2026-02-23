# Implementation Plan: Widget Creator Function

**Branch**: `018-widget-creator` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)

## Summary

Create a `createWidget` factory function that eliminates boilerplate when defining widget registry entries. Takes type, label, icon, sizeDims, and render function; optionally accepts defaultSize and className. Migrate all 14 existing widgets to use it.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: None new — uses existing `WidgetRegistryEntry` type
**Storage**: N/A
**Testing**: Bun test runner + React Testing Library
**Target Platform**: Web (Vite SPA)
**Project Type**: Web application (frontend only)
**Performance Goals**: N/A (factory runs once at module load)
**Constraints**: No changes to `WidgetRegistryEntry` interface, `DsWidgetShell`, `DsWidgetCard`, or `DashboardGrid`
**Scale/Scope**: 1 new file, 1 modified file, 1 new test file

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First | N/A | Developer utility, no UI |
| II. Mobile-First Parity | N/A | No rendering changes |
| III. Financial Correctness | N/A | No financial logic |
| IV. Safe Destructive Actions | N/A | No destructive actions |
| V. Accessibility | N/A | No UI changes |
| VI. Incremental Refactoring | PASS | Tests first, then factory, then migration, verify after each step |
| VII. Simplicity | PASS | Single pure function, no abstraction layers, solves concrete repetition |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/018-widget-creator/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── quickstart.md        # Phase 1 output
```

### Source Code

```text
src/lib/createWidget.tsx        # NEW: factory function
src/lib/widgetRegistry.tsx      # MODIFY: migrate 14 entries to use createWidget
test/lib/createWidget.test.tsx  # NEW: unit tests for factory
```

**Structure Decision**: Single new file in `src/lib/` alongside `widgetRegistry.tsx`. No new directories. Test file mirrors `src/` structure.

## Design

### `createWidget` Function

**File**: `src/lib/createWidget.tsx`

**Signature** (options object with flat size params):

```typescript
interface CreateWidgetOptions {
  type: WidgetType;
  label: string;
  icon: React.ReactNode;
  sm: { w: number; h: number };
  md: { w: number; h: number };
  lg: { w: number; h: number };
  render: (props: Record<string, unknown>, size: WidgetSize) => React.ReactNode;
  defaultSize?: WidgetSize;  // defaults to "md"
  className?: string;        // wrapper div className when provided
}

function createWidget(options: CreateWidgetOptions): WidgetRegistryEntry
```

The creator assembles `sizeDims: { sm, md, lg }` internally from the flat params. Shared presets like `KPI_DIMS` can be spread: `createWidget({ ...KPI_DIMS, type: "x", ... })`.

**className handling**: When `className` is provided, the factory wraps the render output in a `<div className={className}>`. When omitted, the render function passes through directly (no extra DOM node). This satisfies the constraint of no changes to `WidgetRegistryEntry` or the rendering pipeline.

### Migration

Each entry transforms from manual object to `createWidget()` call. Shared dimension presets are spread into the options: `createWidget({ ...KPI_DIMS, type: "net-cash-flow", ... })`. Widgets with inline dimensions pass `sm`, `md`, `lg` directly. `defaultSize: "md"` is omitted (matches default). Widgets with non-`"md"` defaults specify explicitly:
- `defaultSize: "lg"`: `cash-flow-chart`, `category-chart`, `owner-split-chart`
- `defaultSize: "sm"`: `smart-insights`

Shared dimension constants (`KPI_DIMS`, `CHART_WIDE_DIMS`, `LIST_DIMS`) remain as-is and are spread into calls.

### Test Plan

**File**: `test/lib/createWidget.test.tsx` (~12 tests)

| Group | Tests |
|-------|-------|
| Required fields | Returns valid entry with correct type, label, icon, sizeDims, render |
| defaultSize | Defaults to "md"; accepts "sm" and "lg" overrides |
| render passthrough | Delegates to input render; passes props and size through |
| className wrapping | No wrapper when omitted; wraps in div when provided |
| Purity | Distinct objects from same args; does not mutate input |
