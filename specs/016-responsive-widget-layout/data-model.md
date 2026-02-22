# Data Model: Responsive Widget Layout

**Feature**: 016-responsive-widget-layout
**Date**: 2026-02-22

## Entities

### Desktop Grid Layout (existing, unchanged)

The canonical widget layout. Already persisted in localStorage as part of `DashboardLayout`.

| Field | Type | Description |
|-------|------|-------------|
| version | number | Schema version (currently 6) |
| desktopGrid | WidgetLayoutItem[] | Array of positioned widgets |
| mobileOrder | WidgetType[] | Mobile display order |

### WidgetLayoutItem (existing, unchanged)

| Field | Type | Description |
|-------|------|-------------|
| id | WidgetType | Widget identifier |
| x | number | Column position (0-based, 24-col grid) |
| y | number | Row position (0-based) |
| w | number | Width in columns |
| h | number | Height in rows |
| size | WidgetSize | Display size ("sm", "md", "lg") |
| visible | boolean | Whether widget is shown |

### Derived Layout (new, computed, NOT persisted)

A transient RGL `Layout[]` computed at render time for a specific breakpoint.

| Field | Type | Description |
|-------|------|-------------|
| i | string | Widget ID (maps to WidgetLayoutItem.id) |
| x | number | Scaled column position for target breakpoint |
| y | number | Row position (unchanged from lg) |
| w | number | Scaled width for target breakpoint |
| h | number | Height (unchanged from lg) |

### Breakpoint Configuration (existing, unchanged)

| Breakpoint | Min Width | Columns | Layout Source |
|------------|-----------|---------|---------------|
| lg | 1200px | 24 | User-arranged (persisted) |
| md | 996px | 24 | Copied from lg as-is |
| sm | 768px | 12 | Derived from lg (scale 0.5x) |
| xs | 480px | 1 | Mobile grid (separate component) |
| xxs | 0px | 1 | Mobile grid (separate component) |

## Scaling Rules

For deriving `sm` layout from `lg`:

| Source (24-col) | Target (12-col) | Rule |
|-----------------|-----------------|------|
| w | w' | `max(1, round(w * 0.5))` |
| x | x' | `min(round(x * 0.5), 12 - w')` |
| y | y' | Unchanged |
| h | h' | Unchanged |

## State Transitions

No new state transitions. The existing layout persistence flow remains:

1. User drags widget at lg breakpoint → `onDragStart` sets interaction flag
2. RGL fires `onLayoutChange(currentLayout, allLayouts)` → handler checks if lg breakpoint triggered it
3. If lg: extract x/y positions → update `desktopGrid` in context → persist to localStorage
4. If md/sm: ignore (derived layouts are ephemeral)

## Storage Impact

**None.** No new data stored. Derived layouts exist only in component memory during render.
