# Research: Widget Creator Function

**Feature**: 018-widget-creator | **Date**: 2026-02-22

## R1: Factory Function Pattern

**Decision**: Options object signature over positional arguments.

**Rationale**: With 5 required + 2 optional parameters, positional args become unreadable. An options object is self-documenting and allows optional fields naturally via TypeScript optional properties.

**Alternatives considered**:
- Positional args: `createWidget(type, label, icon, sizeDims, render, defaultSize?, className?)` — too many params, easy to mix up
- Builder pattern: `Widget.type("x").label("y").build()` — over-engineered for a single function call (violates Principle VII)

## R2: className Without Modifying WidgetRegistryEntry

**Decision**: Capture className in the render closure via a wrapper `<div>`.

**Rationale**: The constraint prohibits changes to `WidgetRegistryEntry`, `DsWidgetShell`, `DsWidgetCard`, and `DashboardGrid`. The only extension point is the `render` function itself. When className is provided, the factory returns a new render function that wraps the original output in `<div className={className}>`. When omitted, the original render passes through directly (no extra DOM node).

**Alternatives considered**:
- Adding a `className` field to `WidgetRegistryEntry` — violates spec constraint
- Modifying `DsWidgetShell` to read className from registry — violates spec constraint
- Using `React.cloneElement` to inject className onto render output — fragile, assumes specific element type

## R3: File Location

**Decision**: `src/lib/createWidget.tsx` (new file).

**Rationale**: Follows project convention — `src/lib/` contains pure helpers. Separate from `widgetRegistry.tsx` for clear separation of concerns (factory vs. registry). Uses `.tsx` extension because the className wrapper uses JSX.

**Alternatives considered**:
- Inline in `widgetRegistry.tsx` — conflates the factory with its usage
- `src/lib/widget/createWidget.tsx` — new directory is unnecessary for a single file

## R4: Default Size Value

**Decision**: Default `defaultSize` to `"md"`.

**Rationale**: 10 of 14 existing widgets use `"md"`. Making it the default eliminates the most common explicit parameter.

**Data**:
- `"md"`: net-cash-flow, total-spent, total-income, total-debt, quick-add, net-trend-chart, debt-snapshot, spend-by-source, owner-transfers, recent-activity (10)
- `"lg"`: cash-flow-chart, category-chart, owner-split-chart (3)
- `"sm"`: smart-insights (1)

## R5: Migration Approach

**Decision**: Migrate all 14 widgets in a single pass within `widgetRegistry.tsx`.

**Rationale**: The transformation is mechanical — each entry wraps in `createWidget({...})`. All dimension constants and render functions remain identical. A single-pass migration is simplest and ensures consistency. Build + test verification after migration catches any issues.

**Alternatives considered**:
- Incremental migration (one widget at a time) — unnecessary complexity for a mechanical change
- Leaving old widgets as-is, only using factory for new widgets — defeats the purpose of reducing inconsistency
