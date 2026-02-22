# Feature Specification: Per-Widget Size Presets (S/M/L)

**Feature Branch**: `012-per-widget-sizes`
**Created**: 2026-02-21
**Status**: Draft
**Input**: Simplify widget sizing from 7 global sizes (sm, wide, md, tall, wide-lg, lg, xl) to 3 universal labels (S, M, L) where each widget independently defines its own grid dimensions for each size.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Simplified Size Picker (Priority: P1)

A user opens the widget popover to resize a widget. Instead of seeing cryptic 2-7 letter codes (S, W, M, T, WL, L, XL), they see exactly 3 clear options: **S**, **M**, **L**. Every widget offers all 3 sizes. The user picks one and the widget resizes immediately.

**Why this priority**: This is the primary UX improvement. The current 7-size system with abbreviated labels is confusing — users don't know what "W" or "WL" means. Reducing to 3 universally understood labels removes all ambiguity.

**Independent Test**: Can be fully tested by opening the size picker on any widget and verifying exactly 3 options (S, M, L) are displayed, each resizing the widget to the correct dimensions.

**Acceptance Scenarios**:

1. **Given** a dashboard with visible widgets, **When** the user opens the overflow popover on any widget, **Then** the size picker shows exactly 3 options labeled "S", "M", "L"
2. **Given** the popover is open on a KPI widget (e.g., total-spent), **When** the user selects "L", **Then** the widget resizes to 4×3 grid cells (the KPI-specific large dimension)
3. **Given** the popover is open on a chart widget (e.g., cash-flow-chart), **When** the user selects "L", **Then** the widget resizes to 8×12 grid cells (the chart-specific large dimension)
4. **Given** the popover is open, **When** the user selects the size that is already active, **Then** nothing changes and the popover closes

---

### User Story 2 - Per-Widget Dimensions (Priority: P1)

Each widget type defines its own grid dimensions for S, M, and L. A "Large" KPI card is compact (4×3), while a "Large" chart is expansive (8×12). Developers can tune each widget's sizes independently in the widget registry without affecting other widgets.

**Why this priority**: This is the core architectural change that makes the simplified labels work correctly. Without per-widget dimensions, "Large" would mean the same thing for a tiny KPI card and a full chart, wasting space or cramping content.

**Independent Test**: Can be tested by verifying that selecting "L" on a KPI widget and "L" on a chart widget produces different grid dimensions, each appropriate to its content type.

**Acceptance Scenarios**:

1. **Given** the widget registry, **When** a developer inspects a KPI widget entry (e.g., net-cash-flow), **Then** it defines `sizeDims` with S=2×2, M=4×2, L=4×3
2. **Given** the widget registry, **When** a developer inspects a chart widget entry (e.g., cash-flow-chart), **Then** it defines `sizeDims` with S=4×3, M=8×6, L=8×12
3. **Given** two widgets with different `sizeDims`, **When** both are set to "M", **Then** they render at their respective widget-specific M dimensions
4. **Given** the global `SIZE_TO_DIMS` mapping is removed, **When** the layout context resolves widget dimensions, **Then** it looks up dimensions from the widget's registry entry via `sizeDims`

---

### User Story 3 - localStorage Migration (Priority: P2)

An existing user who has a saved dashboard layout with old size names (e.g., `wide`, `tall`, `wide-lg`, `xl`) opens the app. Their layout migrates automatically to the new S/M/L system. Widget positions are preserved; sizes are mapped to the closest S/M/L equivalent.

**Why this priority**: Without migration, existing users lose their dashboard customizations on upgrade. This is essential for a smooth upgrade but is lower priority than the core sizing change since it only runs once per user.

**Independent Test**: Can be tested by creating a localStorage payload with old size names, loading the app, and verifying the layout renders correctly with the new size names.

**Acceptance Scenarios**:

1. **Given** a saved layout with version 4 containing `wide` and `tall` sizes, **When** the app loads, **Then** the layout is migrated: `sm`→`sm`, `wide`→`md`, `md`→`md`, `tall`→`md`, `wide-lg`→`lg`, `lg`→`lg`, `xl`→`lg`
2. **Given** a migrated layout, **Then** widget positions (x, y) are preserved from the original layout
3. **Given** a migrated layout, **Then** the layout version is updated to 5
4. **Given** a layout that is already version 5 or higher, **When** the app loads, **Then** no migration is performed

---

### Edge Cases

- What happens when a widget's migrated size produces dimensions that overflow the grid? The grid reflows using react-grid-layout's collision resolution, same as today.
- What happens if a user clears localStorage and gets the default layout? The default layout uses the new size names and version 5 directly; no migration needed.
- What happens to the mobile size picker? Mobile popover (long-press) also shows S, M, L — same 3 options as desktop.
- What happens to widget-specific rendering branches that checked for old size names (e.g., `wide`, `tall`)? They are simplified to check `sm`, `md`, `lg` only. Content density adapts based on the actual dimensions rather than named sizes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `WidgetSize` type MUST be simplified from `"sm" | "wide" | "md" | "tall" | "wide-lg" | "lg" | "xl"` to `"sm" | "md" | "lg"`
- **FR-002**: Every widget entry in the registry MUST define a `sizeDims` property mapping each size (`sm`, `md`, `lg`) to grid dimensions `{ w: number; h: number }`
- **FR-003**: The global `SIZE_TO_DIMS` mapping MUST be removed from the layout context; dimension lookup MUST use the per-widget `sizeDims` from the registry
- **FR-004**: The size picker UI MUST display exactly 3 options labeled "S", "M", "L" for every widget
- **FR-005**: The `allowedSizes` property MUST be removed from widget registry entries — all widgets support all 3 sizes
- **FR-006**: The `SIZE_LABELS` mapping MUST be updated to `{ sm: "S", md: "M", lg: "L" }`
- **FR-007**: The `SIZE_PADDING` and `SIZE_DENSITY` mappings in `DsWidgetCard` MUST be simplified to 3 entries matching the new sizes
- **FR-008**: The default layout version MUST be bumped from 4 to 5
- **FR-009**: A migration function MUST convert version-4 layouts to version-5 by mapping old size names: `sm`→`sm`, `wide`→`md`, `md`→`md`, `tall`→`md`, `wide-lg`→`lg`, `lg`→`lg`, `xl`→`lg`
- **FR-010**: Migration MUST preserve widget positions (x, y coordinates) from the original layout
- **FR-011**: Widget components that branch on size MUST be updated to handle only `sm`, `md`, `lg` values
- **FR-012**: i18n size-related keys MUST be updated if any exist for the old size names

### Key Entities

- **WidgetSize**: Union type `"sm" | "md" | "lg"` — the 3 universal size labels
- **SizeDims**: Per-widget mapping `Record<WidgetSize, { w: number; h: number }>` — each widget defines its own grid dimensions for each size
- **WidgetRegistryEntry**: Extended with `sizeDims: SizeDims` property, `allowedSizes` removed

### Per-Widget Dimension Table

| Widget | S (w×h) | M (w×h) | L (w×h) |
|--------|---------|---------|---------|
| net-cash-flow | 2×2 | 4×2 | 4×3 |
| total-spent | 2×2 | 4×2 | 4×3 |
| total-income | 2×2 | 4×2 | 4×3 |
| total-debt | 2×2 | 4×2 | 4×3 |
| quick-add | 4×3 | 8×4 | 8×6 |
| cash-flow-chart | 4×3 | 8×6 | 8×12 |
| net-trend-chart | 4×3 | 8×4 | 8×6 |
| category-chart | 4×3 | 8×6 | 8×12 |
| owner-split-chart | 4×3 | 8×6 | 8×12 |
| debt-snapshot | 4×3 | 4×6 | 8×6 |
| spend-by-source | 4×3 | 4×6 | 8×6 |
| owner-transfers | 4×3 | 4×6 | 8×6 |
| recent-activity | 4×3 | 4×6 | 8×6 |
| smart-insights | 2×2 | 4×2 | 4×3 |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The size picker shows exactly 3 options (S, M, L) for every widget — no more, no fewer
- **SC-002**: Selecting "L" on a KPI widget (e.g., total-spent) produces a 4×3 grid cell, while selecting "L" on a chart widget (e.g., cash-flow-chart) produces an 8×12 grid cell — proving per-widget sizing works
- **SC-003**: TypeScript compilation passes with no errors after `WidgetSize` is reduced to 3 values
- **SC-004**: Existing users with version-4 localStorage layouts see their dashboard preserved (correct positions, reasonable sizes) after automatic migration
- **SC-005**: The default layout version is 5 and new users get the default layout without any migration step
- **SC-006**: No references to old size names (`wide`, `tall`, `wide-lg`, `xl`) remain in the codebase after implementation
