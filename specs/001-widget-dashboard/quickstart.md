# Quickstart: Widget-Based Dashboard

**Feature Branch**: `001-widget-dashboard`
**Date**: 2026-02-17

## Prerequisites

```bash
git checkout 001-widget-dashboard
bun install
```

## New Dependency

```bash
bun add react-grid-layout
```

`react-grid-layout` v2 provides the drag-and-drop grid engine. It ships its own TypeScript types.

**Required CSS import** (add to the app entry point or dashboard page):

```css
/* react-grid-layout base styles */
@import "react-grid-layout/css/styles.css";
@import "react-resizable/css/styles.css";
```

## Key Files to Create

| File | Purpose |
|------|---------|
| `src/context/DashboardLayoutContext.tsx` | Layout state, edit mode, persistence |
| `src/lib/widgetRegistry.ts` | Widget type definitions and render map |
| `src/lib/defaultLayout.ts` | Default layout constant (matches current dashboard) |
| `src/components/ds/DsWidgetShell.tsx` | Edit mode wrapper (drag handle, size control, hide) |
| `src/components/ds/DsWidgetCatalog.tsx` | Add/restore hidden widgets panel |
| `src/pages/dashboard/DashboardGrid.tsx` | Main grid component (wraps react-grid-layout) |

## Key Files to Modify

| File | Change |
|------|--------|
| `src/lib/storage.ts` | Add `DASHBOARD_LAYOUT` to `STORAGE_KEYS` |
| `src/pages/dashboard/Dashboard.tsx` | Replace static layout with `DashboardGrid` |
| `src/pages/dashboard/DashboardKpiCards.tsx` | Extract individual KPI cards as standalone widgets |
| `src/pages/dashboard/DashboardDebtSnapshot.tsx` | Split accordion items into separate widget components |
| `src/i18n.ts` + locale files | Add widget label translations |

## Development Workflow

```bash
# 1. Start dev server
bun dev

# 2. Run tests in watch mode (separate terminal)
bun test

# 3. After each change, verify:
bun test                    # All tests pass
bun run build               # TypeScript + Vite build clean
```

## Architecture Summary

```
DashboardLayoutContext (localStorage persistence)
  │
  ├── DashboardGrid (react-grid-layout ResponsiveGridLayout)
  │     ├── DsWidgetShell (edit mode chrome)
  │     │     └── [Widget content component]
  │     ├── DsWidgetShell
  │     │     └── [Widget content component]
  │     └── ...
  │
  └── DsWidgetCatalog (Sheet/dialog for adding hidden widgets)

useDashboardData() → data props → passed into each widget's render function
```

## Incremental Build Order

1. **Storage key + layout context** — persistence layer (testable in isolation)
2. **Widget registry + default layout** — static config (testable in isolation)
3. **DashboardGrid** — integrate react-grid-layout with context (visual testing)
4. **WidgetShell** — edit mode UI (drag handle, size selector, hide button)
5. **Refactor existing components** — extract KPI cards and accordion items as standalone widgets
6. **Widget catalog** — add/restore hidden widgets
7. **Mobile layout** — single-column mode with move-up/move-down
8. **Reset to default** — confirmation dialog + reset action
