# Feature Specification: Widget Creator Function

**Feature Branch**: `018-widget-creator`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Create a widget creator function that takes in sizes for S M L with optional custom styles"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Widget with Standard Sizes (Priority: P1)

A developer wants to add a new dashboard widget. Instead of manually assembling a registry entry with repeated boilerplate (type duplication, icon wrapping, size dimensions, render function signature), the developer calls a creator function with the widget's core identity (type, label, icon), its S/M/L grid dimensions, and a render function. The creator returns a fully-formed registry entry ready to be placed in `WIDGET_REGISTRY`.

**Why this priority**: This is the core value — eliminating the repetitive, error-prone boilerplate in the current 14-widget registry and providing a consistent creation pattern for future widgets.

**Independent Test**: Can be fully tested by creating a widget entry via the creator function and verifying the returned object matches the `WidgetRegistryEntry` interface with correct type, label, icon, sizeDims, defaultSize, and render function.

**Acceptance Scenarios**:

1. **Given** a developer calls the creator with type, label, icon, size dimensions (S/M/L widths and heights), and a render function, **When** the creator returns, **Then** the result is a valid `WidgetRegistryEntry` with all fields populated correctly.
2. **Given** a developer provides only the required arguments, **When** the creator returns, **Then** the `defaultSize` is set to `"md"` and the render function wraps the provided component correctly.
3. **Given** a developer specifies a custom `defaultSize` of `"lg"`, **When** the creator returns, **Then** the entry uses `"lg"` as the default size.

---

### User Story 2 - Create a Widget with Custom Styles (Priority: P2)

A developer wants a widget that uses custom styling beyond the default widget card appearance. The developer passes an optional styles/className override to the creator function, and the render output applies those styles to the widget wrapper.

**Why this priority**: Enables visual differentiation for specialized widgets (e.g., a chart widget needing no padding, or a KPI widget with a colored background) without forking the creation pattern.

**Acceptance Scenarios**:

1. **Given** a developer provides optional custom styles (className string) to the creator, **When** the widget renders, **Then** the custom styles are applied to the widget card wrapper alongside the default styles.
2. **Given** a developer does not provide custom styles, **When** the widget renders, **Then** only the default widget card styling is applied.

---

### User Story 3 - Migrate Existing Widgets to Creator (Priority: P3)

A developer migrates all 14 existing widgets in `WIDGET_REGISTRY` to use the new creator function. The dashboard renders identically before and after migration — no visual regressions, same layout behavior, same size switching.

**Why this priority**: Validates the creator function works in practice across all widget categories (KPI, chart, list) and ensures it's a drop-in replacement, not just a theoretical improvement.

**Acceptance Scenarios**:

1. **Given** all 14 widgets are migrated to use the creator, **When** the dashboard loads, **Then** all widgets render with the same appearance and behavior as before.
2. **Given** all 14 widgets use the creator, **When** a widget is resized (S/M/L), **Then** the grid dimensions match the original `SizeDims` values exactly.
3. **Given** the migration is complete, **When** the full test suite runs, **Then** all existing tests pass without modification.

---

### Edge Cases

- What happens when a developer provides size dimensions with zero or negative values? The creator should accept them without error (layout validation is handled elsewhere).
- What happens when the render function returns null? The widget shell should handle this gracefully (existing behavior — no change needed).
- What happens when custom styles conflict with required widget shell styles? Custom styles should be additive, applied via className merge so the shell structure remains intact.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a creator function that accepts a widget's type identifier, display label, icon, individual size dimensions as flat top-level `sm`, `md`, and `lg` parameters (each with `w` and `h`), and a render function, and returns a complete widget registry entry. The creator assembles the `sizeDims` object internally from the three size parameters.
- **FR-002**: The creator function MUST accept an optional `defaultSize` parameter, defaulting to `"md"` when not provided.
- **FR-003**: The creator function MUST accept an optional `className` parameter for custom styling that gets applied to the widget card wrapper.
- **FR-004**: The returned registry entry MUST conform to the existing `WidgetRegistryEntry` interface without modifications to the interface itself.
- **FR-005**: The creator function MUST support all existing size dimension values — developers pass the individual `sm`, `md`, `lg` values directly (e.g., `sm: { w: 3, h: 2 }`) rather than a nested `sizeDims` object. Shared presets like `KPI_DIMS` can be spread into the options if desired.
- **FR-006**: All 14 existing widgets MUST be migrated to use the creator function, producing identical registry entries to the current manual definitions.
- **FR-007**: The creator function MUST be a pure function with no side effects — it returns data, it does not mutate the registry.

### Key Entities

- **Widget Registry Entry**: The output of the creator — contains type, label, icon, defaultSize, sizeDims, and render function. Conforms to existing `WidgetRegistryEntry` interface.
- **Size Dimensions**: Three flat parameters (`sm`, `md`, `lg`), each containing `{ w: number; h: number }`. The creator assembles these into the `sizeDims` record internally. Shared presets (`KPI_DIMS`, `CHART_WIDE_DIMS`, `LIST_DIMS`) remain available as named constants and can be spread into the options object.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Adding a new widget requires calling a single function with 5-6 arguments instead of manually constructing an 6-field object — reducing boilerplate per widget by at least 30%.
- **SC-002**: All 14 existing widgets are migrated to use the creator with zero visual or behavioral regressions (all existing tests pass).
- **SC-003**: The creator function itself has full test coverage — every parameter combination (required-only, with custom styles, with custom defaultSize) is verified.
- **SC-004**: No changes to the `WidgetRegistryEntry` interface, `DsWidgetShell`, `DsWidgetCard`, `DashboardGrid`, or any rendering pipeline — the creator is purely an authoring convenience.

## Clarifications

### Session 2026-02-22

- Q: How should the S/M/L sizes be passed to createWidget? → A: Flat top-level params — `sm`, `md`, `lg` as separate options. The creator assembles `sizeDims` internally.

## Assumptions

- The creator function is a developer-facing utility, not a user-facing feature. There is no UI for "creating widgets" at runtime.
- The existing `SizeDims` type and preset constants (`KPI_DIMS`, `CHART_WIDE_DIMS`, `LIST_DIMS`) remain as-is. They can be spread into the creator options (e.g., `createWidget({ ...KPI_DIMS, ... })`) since the presets already have `sm`, `md`, `lg` keys matching the expected flat parameters.
- The `className` override is applied at the `DsWidgetCard` level via the existing `className` prop, not as inline styles.
- The `WidgetType` union type is not modified — new widget types are still added manually to the type definition.
