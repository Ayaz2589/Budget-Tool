# Feature Specification: Dashboard Widget Redesign

**Feature Branch**: `005-widget-redesign`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "Dashboard Widget Redesign — Rebuild all dashboard widgets to display properly at small, medium, and large dimensions with card wrappers for visual hierarchy."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Widgets Display Correctly at All Sizes (Priority: P1)

A user opens the dashboard and sees all widgets rendering cleanly within their assigned size (small, medium, or large). No content is cropped, truncated, or overflowing. Each widget adapts its layout — showing less detail at small and more at large — so every size tier is useful rather than a broken subset of the full view.

**Why this priority**: This is the core problem. Widgets currently crop and overflow at certain sizes, making the resizable dashboard unreliable. Fixing this is the entire purpose of the feature.

**Independent Test**: Can be fully tested by resizing each of the 14 widgets through S/M/L and verifying no content is clipped, overflowed, or illegible at any size.

**Acceptance Scenarios**:

1. **Given** a KPI widget (Net Cash Flow, Total Spent, Total Income, Total Debt) at small size, **When** the dashboard renders, **Then** the widget shows the metric value and title without truncation, omitting secondary details (help tooltips, comparison text) if space is insufficient.
2. **Given** a chart widget (Income vs Expenses, Net Cash Flow Trend, Category Breakdown, Owner Split) at small size, **When** the dashboard renders, **Then** the widget shows a compact visualization (e.g., simplified chart or summary value) that fits entirely within the widget bounds.
3. **Given** a chart widget at large size, **When** the dashboard renders, **Then** the widget shows the full chart with legends, axis labels, and tooltips.
4. **Given** a list widget (Debt Snapshot, Spend by Source, Owner Transfers, Recent Activity, Smart Insights) at small size, **When** the dashboard renders, **Then** the widget shows a summary count or top items with a "show more" indicator, without vertical overflow.
5. **Given** any widget at medium size, **When** the dashboard renders, **Then** the widget shows a balanced layout that is the default useful view — neither stripped down nor padded.

---

### User Story 2 - Consistent Card Wrapping for Visual Hierarchy (Priority: P2)

Each widget is wrapped in a consistent card component that provides uniform border radius, padding, background, and spacing. The card wrapper adapts its internal padding based on widget size so that small widgets don't have excessive whitespace and large widgets don't feel cramped.

**Why this priority**: Visual consistency across all widgets creates a polished, professional dashboard. This is foundational to the redesign but secondary to fixing the actual content display issues.

**Independent Test**: Can be tested by visually inspecting all 14 widgets at each size tier and confirming uniform card styling (borders, shadows, radii, padding) matches the design system.

**Acceptance Scenarios**:

1. **Given** any widget at any size, **When** the dashboard renders, **Then** the widget is wrapped in a card with consistent styling (background, border, shadow, corner radius) matching the app's design system.
2. **Given** a widget at small size, **When** the card renders, **Then** internal padding is compact (reduced from the medium default) to maximize usable content area.
3. **Given** a widget at large size, **When** the card renders, **Then** internal padding is comfortable, providing breathing room for the expanded content.

---

### User Story 3 - Extensible Widget Architecture (Priority: P3)

A developer wants to add a new widget to the dashboard. They follow a clear, repeatable pattern: define the widget in the registry with its type, label, icon, default size, and size-specific minimum heights, then implement a single render component that receives data and a size prop. The widget automatically inherits card wrapping, edit-mode controls, size transitions, and grid/mobile placement — without touching shell, grid, or layout code.

**Why this priority**: The current widget system has no consistent pattern for building new widgets. Some use DsMetricCard, some use DsChartCard, some use raw divs. Standardizing the architecture makes future widgets trivial to add and ensures all widgets benefit from the same foundation.

**Independent Test**: Can be tested by creating a minimal "hello world" widget following the documented pattern and verifying it renders correctly at all three sizes with card wrapping, edit controls, and mobile support — without modifying any infrastructure code.

**Acceptance Scenarios**:

1. **Given** a developer adding a new widget, **When** they define it in the widget registry and create a render component that accepts `(props, size)`, **Then** the widget automatically appears in the widget catalog, renders inside a card wrapper, supports S/M/L sizing, and works in both desktop grid and mobile layouts.
2. **Given** a new widget component, **When** it renders at each size, **Then** it receives the correct `size` prop and the card wrapper provides appropriate padding without the widget needing to manage its own container styling.
3. **Given** the widget registry, **When** a developer reads it, **Then** every widget follows the same structure (type, label, icon, defaultSize, minH, render) making the pattern self-documenting.

---

### User Story 4 - Smooth Size Transitions (Priority: P4)

When a user switches a widget between small, medium, and large in edit mode, the widget transitions its layout cleanly. The grid re-flows without visual glitches, and the widget's content adapts immediately to the new size without requiring a page refresh.

**Why this priority**: A smooth editing experience makes the customization feature feel complete and reliable. However, the core value is correct display, not transition polish.

**Independent Test**: Can be tested by entering edit mode, cycling each widget through S → M → L → S and confirming the content adapts instantly without layout jank, blank states, or stale renders.

**Acceptance Scenarios**:

1. **Given** a widget in edit mode, **When** the user clicks a different size (S, M, or L), **Then** the widget immediately re-renders with the appropriate layout for that size without a loading state or flash.
2. **Given** a chart widget resized from large to small, **When** the transition completes, **Then** the chart is replaced with a compact representation (not a shrunken full chart).

---

### Edge Cases

- What happens when a KPI widget receives an extremely long currency value (e.g., 10+ digits)? The value should truncate with an ellipsis or reduce font size rather than overflowing.
- How does a chart widget behave at small size when there is no data? It should show a compact empty state message, not a broken chart placeholder.
- What happens when the Quick Add widget has many presets at small size? It should show a scrollable or truncated list with a count indicator.
- How do list widgets (Debt Snapshot, Recent Activity) handle zero items at each size? They should show a centered empty state message proportional to the widget size.
- What happens when the Owner Split widget has only one owner? It should adapt its visualization for the single-owner case at all sizes.
- What if a developer creates a new widget but forgets to handle one of the three sizes? The widget should fall back gracefully to its medium layout rather than crash or render broken content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each of the 14 dashboard widgets MUST render without content cropping, overflow, or truncation at small (4-column), medium (6-column), and large (12-column) grid widths.
- **FR-002**: Each widget MUST define three distinct layout variants — small, medium, and large — where each variant is purpose-built for its size rather than a scaled version of another.
- **FR-003**: KPI widgets (Net Cash Flow, Total Spent, Total Income, Total Debt) at small size MUST display the metric title and formatted value. Secondary elements (help tooltips, comparison text, subtitles) MAY be hidden at small size.
- **FR-004**: Chart widgets (Income vs Expenses, Net Cash Flow Trend, Category Breakdown, Owner Split) at small size MUST show either a simplified mini-chart or a summary metric. They MUST NOT render a full chart squeezed into a small container.
- **FR-005**: Chart widgets at large size MUST display the full chart with legends, axis labels, and interactive tooltips.
- **FR-006**: List widgets (Debt Snapshot, Spend by Source, Owner Transfers, Recent Activity, Smart Insights) at small size MUST show a summary (count or top 1-2 items). At large size they MUST show the full list content.
- **FR-007**: The Quick Add widget MUST adapt its preset pill layout to the available width — wrapping or scrolling horizontally at small size, showing more pills at larger sizes.
- **FR-008**: All widgets MUST be wrapped in a card component that provides consistent visual styling (background, border, corner radius, shadow) from the existing design system.
- **FR-009**: Card wrapper padding MUST be size-responsive — compact at small size, standard at medium, comfortable at large.
- **FR-010**: Widget size changes (via the S/M/L selector in edit mode) MUST cause the widget to re-render immediately with the correct layout variant.
- **FR-011**: All widget layouts MUST handle empty data states gracefully at every size, showing an appropriately sized empty state message.
- **FR-012**: All widget layouts MUST support both light and dark themes without additional configuration.
- **FR-013**: Mobile widget rendering MUST use the medium layout variant as the default, adapting to the full viewport width.
- **FR-014**: Existing widget functionality (data display, interactions, tooltips) MUST be preserved — this is a layout/presentation redesign, not a feature change.
- **FR-015**: Adding a new widget MUST require only two steps: (1) adding an entry to the widget registry with type, label, icon, defaultSize, minH, and render function, and (2) creating a render component that accepts `(props: Record<string, unknown>, size: WidgetSize)`. The widget MUST automatically receive card wrapping, edit-mode controls, grid placement, and mobile layout support without modifying infrastructure code.
- **FR-016**: The widget render contract MUST enforce a consistent signature — `(props, size) => ReactNode` — so that all widgets receive dashboard data and size uniformly. The card wrapper, shell, and grid MUST be decoupled from individual widget implementations.
- **FR-017**: Widget render components MUST default to the medium layout when an unrecognized size is provided, ensuring graceful degradation for future size tiers or developer errors.
- **FR-018**: The widget registry MUST serve as the single source of truth for all widget metadata (type, label, icon, sizes, render function). No widget configuration MUST be scattered across grid, mobile, or shell code.

### Key Entities

- **Widget**: A self-contained dashboard unit with an ID, type, label, icon, default size, and three layout variants (small/medium/large). Defined in the widget registry. The registry entry is the only place a widget's metadata lives.
- **Widget Size**: One of three tiers — small (4 grid columns), medium (6 grid columns), large (12 grid columns) — each with defined minimum heights per widget.
- **Widget Layout Item**: A widget's position, size, and visibility state within the dashboard grid. Persisted to localStorage.
- **Card Wrapper**: A design-system component that provides consistent visual container styling around each widget's content, with size-responsive padding. Applied automatically by the widget shell — individual widgets never manage their own card.
- **Widget Render Contract**: The standard function signature `(props: Record<string, unknown>, size: WidgetSize) => ReactNode` that all widgets implement. This is the only interface a widget author needs to know.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 14 widgets display without visible content cropping or overflow at each of the three sizes (42 total widget-size combinations verified).
- **SC-002**: Users can resize any widget through all three size tiers in edit mode and see the correct layout within 200ms, with no blank or broken intermediate states.
- **SC-003**: All widgets maintain visual consistency — uniform card styling (borders, shadows, radii) across every widget at every size.
- **SC-004**: No existing dashboard test regressions — all current tests continue to pass after the redesign.
- **SC-005**: Each widget's content is legible and useful at every size tier — small provides at-a-glance info, medium provides the standard view, large provides full detail.
- **SC-006**: Empty data states render cleanly at all sizes for all widgets that support empty states.
- **SC-007**: A new widget can be added by creating one registry entry and one render component — no modifications to the shell, grid, mobile layout, or card wrapper code.
- **SC-008**: All 14 widgets follow an identical registry structure and render contract, making the pattern self-documenting for future developers.

## Assumptions

- The existing grid system (12-column, 40px row height) and size-to-column mapping (sm=4, md=6, lg=12) remain unchanged.
- The widget registry architecture is refined but not fundamentally changed — the existing `WidgetRegistryEntry` type and render function signature are preserved and standardized.
- The layout context, persistence, and edit mode UX (drag, resize selector, hide/show) are not changing.
- The 14 existing widget types remain the same — no widgets are being added or removed.
- Mobile layout continues to use a simple vertical stack with medium-width rendering.
- The design system's existing card component and color tokens are the basis for the card wrapper styling.
- Performance is not a primary concern since the number of widgets and data volume are small (personal budgeting app for couples).
