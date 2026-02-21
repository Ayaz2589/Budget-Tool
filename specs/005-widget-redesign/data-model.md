# Data Model: Dashboard Widget Redesign

**Date**: 2026-02-21 | **Branch**: `005-widget-redesign`

## Entities

No new data entities are introduced. This is a presentation-only redesign. Existing types are unchanged.

## Widget Size Mapping Reference

### Size → Grid Dimensions

| Size | Grid Columns (w) | Grid Rows (h) by Category | Approx Width | Approx Height |
|------|------------------|---------------------------|-------------|---------------|
| sm | 4 | KPI: 2, Chart: 3, List: 3, QuickAdd: 2 | ~280px | 80–120px |
| md | 6 | KPI: 2, Chart: 5, List: 4, QuickAdd: 2 | ~440px | 80–200px |
| lg | 12 | KPI: 3, Chart: 7, List: 6, QuickAdd: 2 | ~900px | 80–280px |

*Widths approximate based on 12-col grid in ~960px container with 12px margins.*

### Size → Card Density Mapping

| Size | Card Density | Padding (px/py) | Description |
|------|-------------|----------------|-------------|
| sm | compact | 12px / 8px | Tight padding to maximize content area |
| md | default | 16px / 12px | Standard padding for comfortable reading |
| lg | comfortable | 20px / 16px | Generous padding for full-width content |

### Size → Content Strategy per Widget Category

#### KPI Widgets (4)

| Element | sm | md | lg |
|---------|----|----|-----|
| Title | Text only | Text only | Text + help tooltip |
| Value | Formatted currency | Formatted currency | Formatted currency |
| Subtitle | Hidden | Delta label | Delta label + scope definition |
| Tone indicator | Color only | Color only | Color + icon |

#### Chart Widgets (4)

| Element | sm | md | lg |
|---------|----|----|-----|
| Visualization | Summary metric text | Chart (no legend) | Full chart + legend |
| Title | Short label | Full label | Full label + help tooltip |
| Axis labels | N/A | Minimal | Full |
| Tooltips | N/A | On hover | On hover |
| Empty state | Compact message | Standard DsEmptyState | Full DsEmptyState |

#### List Widgets (5)

| Element | sm | md | lg |
|---------|----|----|-----|
| Items shown | 2 (top items) | 3–4 items | All items |
| Item density | Dense (no subtitle) | Normal | Normal with full metadata |
| Metadata | Hidden | Partial (amount, category) | Full (date, note, owner, progress) |
| Empty state | Compact message | Standard DsEmptyState | Full DsEmptyState |
| Summary | Count badge if truncated | Count if truncated | Full list |

#### Quick Add Widget (1)

| Element | sm | md | lg |
|---------|----|----|-----|
| Pill layout | Horizontal scroll, compact | Wrap, standard pills | Wrap, all visible |
| Pill size | Small (h-7, px-2) | Default (h-9, px-3) | Default (h-9, px-3) |
| Add button | Icon only | Icon + label | Icon + label |

## State Transitions

No new state transitions. The existing `WidgetSize` ("sm" | "md" | "lg") and `WidgetLayoutItem.visible` state remain unchanged. Size changes via `resizeWidget()` in DashboardLayoutContext trigger re-render with the new size prop.
