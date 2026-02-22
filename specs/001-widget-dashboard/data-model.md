# Data Model: Widget-Based Dashboard

**Feature Branch**: `001-widget-dashboard`
**Date**: 2026-02-17

## Entities

### WidgetType (enum/union)

Identifies each available widget. Used as the key in the widget registry and layout configuration.

```
"kpi-net-cash-flow"
"kpi-total-spent"
"kpi-total-income"
"kpi-total-debt"
"quick-add"
"chart-cash-flow"
"chart-net-trend"
"chart-category"
"chart-owner-split"
"debt-snapshot"
"spend-by-source"
"owner-transfers"
"recent-activity"
"smart-insights"
```

### WidgetSize (enum)

Three preset display sizes for each widget.

| Value     | Grid Columns (of 12) | Description          |
|-----------|----------------------|----------------------|
| `"sm"`    | 4                    | Condensed summary    |
| `"md"`    | 6                    | Standard view        |
| `"lg"`    | 12                   | Detailed/expanded    |

### WidgetLayoutItem

Represents a single widget's position and configuration in the grid.

| Field      | Type         | Description                                            |
|------------|--------------|--------------------------------------------------------|
| `id`       | WidgetType   | Unique widget identifier                               |
| `x`        | number       | Column position (0-based, 0–11)                        |
| `y`        | number       | Row position (0-based, grows downward)                 |
| `w`        | number       | Width in grid columns (4, 6, or 12)                    |
| `h`        | number       | Height in grid rows (varies by widget type and size)   |
| `size`     | WidgetSize   | Current preset size selection                          |
| `visible`  | boolean      | Whether the widget is shown on the dashboard           |

### DashboardLayout

The complete saved layout configuration.

| Field           | Type                | Description                                      |
|-----------------|---------------------|--------------------------------------------------|
| `version`       | number              | Schema version for future migration (starts at 1)|
| `desktopGrid`   | WidgetLayoutItem[]  | Full grid layout for desktop viewports           |
| `mobileOrder`   | WidgetType[]        | Ordered list of visible widget IDs for mobile    |

### WidgetRegistryEntry

Definition for each widget type in the registry (not persisted — defined in code).

| Field           | Type                          | Description                                       |
|-----------------|-------------------------------|---------------------------------------------------|
| `type`          | WidgetType                    | Unique identifier                                 |
| `label`         | string                        | Display name (i18n key)                           |
| `icon`          | ReactNode                     | Icon for catalog and edit mode                    |
| `defaultSize`   | WidgetSize                    | Initial size when first added                     |
| `minH`          | Record<WidgetSize, number>    | Minimum height per size preset                    |
| `render`        | (props, size) => ReactNode    | Render function receiving dashboard data and size |

## Relationships

```
DashboardLayout
  ├── desktopGrid: WidgetLayoutItem[]  (1:N — one entry per widget)
  │     └── id → WidgetRegistryEntry.type  (references registry)
  └── mobileOrder: WidgetType[]  (ordered subset of visible widget IDs)

WidgetRegistryEntry (code-defined, not persisted)
  └── render() receives data from useDashboardData hook
```

## Validation Rules

1. Each `WidgetLayoutItem.id` must correspond to a known `WidgetType` in the registry. Unknown IDs are silently dropped on load (forward compatibility).
2. `desktopGrid` must contain at most one entry per `WidgetType` — no duplicate widgets.
3. `mobileOrder` must only contain IDs that exist in `desktopGrid` with `visible: true`.
4. `x + w` must not exceed 12 (grid column count). Items exceeding the boundary are clamped on load.
5. No two visible items in `desktopGrid` may overlap (same grid cells). `react-grid-layout` enforces this at runtime; validation on load uses the library's compaction algorithm.
6. `version` must be a positive integer. If missing or unrecognized, the layout is discarded and the default is loaded.

## State Transitions

```
No saved layout (first visit)
  → Load DEFAULT_LAYOUT (code-defined constant)
  → Persist to localStorage

User enters edit mode
  → Layout becomes interactive (drag/resize enabled)
  → No state change until user makes a modification

User moves/resizes/hides widget
  → Update layout state in context
  → Persist to localStorage on every change

User exits edit mode
  → Layout frozen (drag/resize disabled)
  → State already persisted

User resets to default
  → Confirm dialog
  → Replace layout state with DEFAULT_LAYOUT
  → Persist to localStorage

App loads with saved layout
  → Read from localStorage
  → Validate schema version
  → Filter out unknown widget IDs
  → Merge with registry (add any new widgets from updates at default positions)
  → Apply as current layout
```

## Storage

- **Key**: `budget-tool-dashboard-layout` (added to `STORAGE_KEYS` in `src/lib/storage.ts`)
- **Format**: JSON-serialized `DashboardLayout` object
- **Size estimate**: ~1.5 KB for 14 widgets with full position data
- **Migration**: `version` field enables future schema changes. Version 1 is the initial schema.
