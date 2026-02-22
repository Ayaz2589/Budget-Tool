# Data Model: 24-Column Dashboard Grid

## Entities

### Grid Configuration

The column count is passed directly to `react-grid-layout`'s `ResponsiveGridLayout` component.

| Breakpoint | Current Cols | New Cols |
|------------|-------------|----------|
| lg (≥1200px) | 16 | 24 |
| md (≥996px) | 16 | 24 |
| sm (≥768px) | 8 | 12 |
| xs (≥480px) | 1 | 1 |
| xxs (<480px) | 1 | 1 |

The sm breakpoint scales proportionally (8 × 1.5 = 12) so tablet layouts also benefit from finer granularity.

### Layout Version

| Version | Description | Migration |
|---------|-------------|-----------|
| 3 | Legacy widget IDs | ID_MIGRATION map |
| 4 | Old 7-size system | SIZE_MIGRATION map |
| 5 | S/M/L sizes, 16-col | Current |
| 6 | S/M/L sizes, 24-col | x×1.5, w×1.5 (round) |

### Widget Size Dimensions (sizeDims)

Type: `Record<WidgetSize, { w: number; h: number }>`

All `w` values scale by 1.5x. All `h` values are unchanged.

**Shared constants (24-col):**

```
KPI_DIMS       = { sm: { w: 3, h: 2 }, md: { w: 6, h: 2 }, lg: { w: 6, h: 3 } }
CHART_WIDE_DIMS = { sm: { w: 6, h: 3 }, md: { w: 12, h: 6 }, lg: { w: 12, h: 8 } }
LIST_DIMS      = { sm: { w: 6, h: 3 }, md: { w: 6, h: 6 }, lg: { w: 12, h: 6 } }
```

**Per-widget overrides (24-col):**

```
quick-add:         { sm: { w: 6, h: 3 }, md: { w: 12, h: 4 }, lg: { w: 12, h: 6 } }
net-trend-chart:   { sm: { w: 6, h: 3 }, md: { w: 9, h: 3 },  lg: { w: 12, h: 6 } }
category-chart:    { sm: { w: 6, h: 3 }, md: { w: 9, h: 4 },  lg: { w: 12, h: 8 } }
owner-split-chart: { sm: { w: 6, h: 3 }, md: { w: 9, h: 4 },  lg: { w: 12, h: 8 } }
```

### Default Layout (24-col)

All x and w values from the current default layout are multiplied by 1.5:

| Widget | x | y | w | h | size |
|--------|---|---|---|---|------|
| net-cash-flow | 0 | 0 | 6 | 2 | md |
| total-spent | 6 | 0 | 6 | 2 | md |
| total-income | 12 | 0 | 6 | 2 | md |
| total-debt | 18 | 0 | 6 | 2 | md |
| debt-snapshot | 6 | 2 | 6 | 3 | sm |
| spend-by-source | 12 | 2 | 6 | 3 | sm |
| recent-activity | 18 | 2 | 6 | 3 | sm |
| owner-transfers | 0 | 5 | 6 | 3 | sm |
| smart-insights | 0 | 2 | 6 | 2 | md |
| quick-add | 6 | 5 | 12 | 4 | md |
| cash-flow-chart | 0 | 9 | 12 | 8 | lg |
| net-trend-chart | 12 | 9 | 12 | 6 | md |
| category-chart | 0 | 17 | 12 | 8 | lg |
| owner-split-chart | 12 | 15 | 12 | 8 | lg |
