# Data Model: Widget Creator Function

**Feature**: 018-widget-creator | **Date**: 2026-02-22

## Entities

### CreateWidgetOptions (input)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| type | WidgetType | Yes | — | Widget identifier (e.g., "net-cash-flow") |
| label | string | Yes | — | i18n translation key (e.g., "widget.netCashFlow") |
| icon | React.ReactNode | Yes | — | Icon element for catalog/shell display |
| sizeDims | SizeDims | Yes | — | Grid dimensions for sm/md/lg sizes |
| render | (props, size) => ReactNode | Yes | — | Widget render function |
| defaultSize | WidgetSize | No | "md" | Initial size when widget is first shown |
| className | string | No | undefined | Custom className applied via wrapper div |

### WidgetRegistryEntry (output — existing, unchanged)

| Field | Type | Description |
|-------|------|-------------|
| type | WidgetType | Widget identifier |
| label | string | i18n key |
| icon | React.ReactNode | Display icon |
| defaultSize | WidgetSize | Default size |
| sizeDims | SizeDims | Dimensions per size |
| render | (props, size) => ReactNode | Render function (may include className wrapper) |

## Relationships

```
CreateWidgetOptions --[createWidget()]--> WidgetRegistryEntry
                                              |
                                              v
                                    WIDGET_REGISTRY[type]
                                              |
                                              v
                              DashboardGrid calls entry.render()
```

## Constraints

- `WidgetRegistryEntry` interface is NOT modified
- `SizeDims` type is `Record<WidgetSize, { w: number; h: number }>`
- `WidgetSize` is `"sm" | "md" | "lg"`
- Shared dimension constants (`KPI_DIMS`, `CHART_WIDE_DIMS`, `LIST_DIMS`) remain in `widgetRegistry.tsx`
