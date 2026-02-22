# Feature Specification: Widget-Based Dashboard

**Feature Branch**: `001-widget-dashboard`
**Created**: 2026-02-17
**Status**: Draft
**Input**: User description: "Widget-based dashboard system for Ortho where users get complete flexibility over their layout. Every element on the dashboard becomes a draggable widget on a customizable grid. Users can rearrange widgets and choose from three size options: small, regular, and large."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rearrange Dashboard Layout (Priority: P1)

A user opens their dashboard and wants to reorganize the layout to put their most important financial information front and center. They enter an edit mode, then drag widgets to new positions on the grid. When they exit edit mode, the layout is saved and persists the next time they open the dashboard.

**Why this priority**: This is the foundational capability of the entire feature. Without drag-and-drop rearrangement on a grid, there is no widget-based dashboard. Every other story depends on the grid system being in place.

**Independent Test**: Can be fully tested by entering edit mode, dragging a widget from one grid position to another, exiting edit mode, refreshing the page, and verifying the widget remains in the new position.

**Acceptance Scenarios**:

1. **Given** a user is viewing their dashboard, **When** they activate edit mode, **Then** all widgets display drag handles and visual indicators showing they are movable.
2. **Given** a user is in edit mode, **When** they drag a widget from position A to position B, **Then** the widget snaps to the new grid position and other widgets reflow to accommodate the change.
3. **Given** a user has rearranged widgets, **When** they exit edit mode, **Then** the new layout is saved and the dashboard displays in the updated arrangement.
4. **Given** a user has previously saved a custom layout, **When** they navigate away and return to the dashboard, **Then** the dashboard loads with their saved layout.

---

### User Story 2 - Resize Widgets (Priority: P2)

A user wants to emphasize specific financial metrics by making certain widgets larger and de-emphasize others by making them smaller. They select a widget and change its size between small, regular, and large. The grid adjusts to accommodate the new size.

**Why this priority**: Resizing is the second core interaction promised by this feature. It allows users to create a truly personalized view by controlling both placement (P1) and scale of their information.

**Independent Test**: Can be fully tested by selecting a widget, changing its size to each of the three options, and verifying the widget renders appropriately at each size while the surrounding grid adjusts.

**Acceptance Scenarios**:

1. **Given** a user is in edit mode and selects a widget, **When** they choose "small" size, **Then** the widget shrinks to occupy the minimum grid footprint and displays a condensed view of its data.
2. **Given** a user is in edit mode and selects a widget, **When** they choose "regular" size, **Then** the widget displays at the standard default size with its full data view.
3. **Given** a user is in edit mode and selects a widget, **When** they choose "large" size, **Then** the widget expands to occupy more grid space and displays an enhanced or more detailed view of its data.
4. **Given** a user has resized a widget, **When** surrounding widgets cannot fit in their current positions, **Then** the grid automatically reflows surrounding widgets to prevent overlap.

---

### User Story 3 - Show and Hide Widgets (Priority: P3)

A user does not find certain dashboard sections relevant to their financial situation and wants to remove them from view. They hide unwanted widgets and can later bring them back from a widget catalog. This keeps the dashboard clean and focused on what matters to each individual.

**Why this priority**: While not as fundamental as dragging or resizing, visibility control completes the customization story. Users who don't track debt, for example, should not have to see debt-related widgets taking up space.

**Independent Test**: Can be fully tested by hiding a widget, verifying it disappears from the dashboard, opening the widget catalog, and re-adding the hidden widget.

**Acceptance Scenarios**:

1. **Given** a user is in edit mode, **When** they choose to hide a widget, **Then** the widget is removed from the dashboard grid and other widgets reflow to fill the space.
2. **Given** a user has hidden one or more widgets, **When** they open the widget catalog, **Then** hidden widgets appear in the catalog as available to add back.
3. **Given** a user is viewing the widget catalog, **When** they select a hidden widget to add back, **Then** the widget reappears on the dashboard in the next available grid position.

---

### User Story 4 - Reset to Default Layout (Priority: P4)

A user has customized their layout but wants to start fresh with the original dashboard arrangement. They trigger a reset action and the dashboard returns to the default layout with all widgets visible at their default sizes and positions.

**Why this priority**: This is a safety net for the customization system. Users need confidence to experiment knowing they can always get back to a known good state.

**Independent Test**: Can be fully tested by customizing the layout (move, resize, hide widgets), triggering reset, and verifying all widgets return to their default positions, sizes, and visibility.

**Acceptance Scenarios**:

1. **Given** a user has a customized layout, **When** they select "Reset to Default," **Then** the system asks for confirmation before proceeding.
2. **Given** a user confirms the reset, **When** the reset completes, **Then** all widgets return to their default positions, default (regular) sizes, and all widgets are visible.

---

### User Story 5 - Mobile Dashboard Reordering (Priority: P5)

A user accesses Ortho on a mobile device and wants to change the order of their dashboard widgets. On mobile, the dashboard displays as a single-column stacked layout. Users can reorder widgets within this column to prioritize what they see first when scrolling.

**Why this priority**: Mobile is a key access point but drag-and-drop grids do not translate well to small screens. A simplified reordering experience ensures mobile users still benefit from customization without a degraded interaction.

**Independent Test**: Can be fully tested on a mobile viewport by entering edit mode, reordering widgets in the single-column layout, and verifying the new order persists.

**Acceptance Scenarios**:

1. **Given** a user is on a mobile device, **When** they view the dashboard, **Then** all widgets display in a single-column stacked layout.
2. **Given** a user is in edit mode on mobile, **When** they drag a widget up or down in the stack, **Then** the widget moves to the new position in the column order.
3. **Given** a user has reordered widgets on mobile, **When** they switch to a desktop viewport, **Then** their desktop grid layout is preserved independently of mobile order.

---

### Edge Cases

- What happens when a user's saved layout references a widget type that has been removed in an app update? The system gracefully ignores unknown widget references and loads remaining widgets in their saved positions.
- What happens when the grid cannot accommodate all visible widgets at their chosen sizes? The grid overflows vertically, allowing the user to scroll, rather than forcing widgets to resize or overlap.
- What happens when a user has no saved layout (first visit or cleared storage)? The system loads the default layout matching the current dashboard arrangement.
- What happens when two widgets are dragged into an overlapping position? The grid system prevents overlap by automatically reflowing displaced widgets to the nearest available position.
- What happens when a user resizes a widget near the edge of the grid? The widget either wraps to the next row or the grid scrolls to accommodate, never truncating widget content.
- What happens when dashboard filters (view mode, owner, month, time range) change? Widgets re-render with updated data but maintain their positions and sizes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all dashboard elements (KPI metrics, charts, data tables, insights) as independent, self-contained widgets on a grid layout.
- **FR-002**: System MUST provide an explicit edit mode that users enter and exit to modify their dashboard layout, preventing accidental rearrangement during normal use.
- **FR-003**: Users MUST be able to drag any widget to a new position on the grid while in edit mode.
- **FR-004**: System MUST snap widgets to grid positions and prevent overlapping widgets at all times.
- **FR-005**: Users MUST be able to set each widget to one of three sizes: small, regular, or large.
- **FR-006**: Each widget MUST adapt its content presentation based on its current size — small shows a condensed summary, regular shows the standard view, and large shows an enhanced or detailed view.
- **FR-007**: System MUST automatically reflow surrounding widgets when a widget is moved or resized, maintaining a gap-free grid without overlaps.
- **FR-008**: System MUST persist the user's layout configuration (widget positions, sizes, and visibility) locally so it survives page refreshes and browser restarts.
- **FR-009**: Users MUST be able to hide individual widgets from the dashboard to remove them from view.
- **FR-010**: System MUST provide a widget catalog that lists all available widgets, indicating which are currently visible and which are hidden, allowing users to restore hidden widgets.
- **FR-011**: System MUST provide a "Reset to Default" action that restores the original widget positions, sizes, and visibility after user confirmation.
- **FR-012**: System MUST render the dashboard as a single-column stacked layout on mobile viewports, with simplified reordering instead of a full grid.
- **FR-013**: System MUST maintain separate layout configurations for desktop grid and mobile column order, so changes on one device type do not override the other.
- **FR-014**: The default layout MUST match the current dashboard arrangement: KPI metrics at top, followed by charts, then detailed data sections.
- **FR-015**: All existing dashboard functionality (data calculations, filters, Google Sheets sync, export capabilities) MUST continue to work identically regardless of widget arrangement.
- **FR-016**: Each widget MUST display a clear visual indicator of its type and content purpose so users can identify widgets at a glance, even at small size.

### Available Widget Types

The following existing dashboard elements become individual widgets:

- **Net Cash Flow KPI** — Displays net cash flow for the selected period with positive/negative indicator.
- **Total Spent KPI** — Displays total spending with month-over-month comparison delta.
- **Total Income KPI** — Displays total income for the selected period.
- **Total Debt Outstanding KPI** — Displays outstanding debt balance with monthly payment amount.
- **Quick Add Bar** — Preset transaction shortcut buttons for rapid data entry.
- **Income vs Expenses Chart** — Grouped bar chart comparing income and expense totals over time.
- **Net Cash Flow Trend Chart** — Area chart showing net cash flow trend across months.
- **Category Spending Breakdown** — Pie/donut chart showing expense distribution by category.
- **Owner Spending Split** — Pie/donut chart with owner expense table showing shared vs individual spending allocation.
- **Debt Snapshot** — Progress-bar list of all debts with remaining balances and payoff progress.
- **Spend by Card Source** — Spending totals grouped by payment source (card type).
- **Owner Transfers** — Recent owner-to-owner transfer activity for the current month.
- **Recent Activity** — The most recent expense entries across all time.
- **Smart Insights** — Auto-generated financial alerts and observations.

### Key Entities

- **Widget**: A self-contained dashboard element with a type identifier, content renderer, and support for three display sizes. Each widget type defines its own condensed (small), standard (regular), and detailed (large) presentation.
- **Dashboard Layout**: A saved configuration describing the set of visible widgets, their grid positions (column and row), and their sizes. One layout exists per device class (desktop, mobile).
- **Widget Catalog**: A registry of all available widget types, used to populate the add/restore interface when users want to show hidden widgets.
- **Layout Preset**: The system-defined default arrangement used for new users and as the reset target.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can rearrange their dashboard layout (drag, drop, and save) in under 30 seconds for a typical 3-widget move.
- **SC-002**: Users can resize any widget between all three size options (small, regular, large) in under 5 seconds per widget.
- **SC-003**: Dashboard loads with the user's saved layout within the same timeframe as the current static dashboard — no perceptible delay added by the customization system.
- **SC-004**: 100% of existing dashboard data and functionality remains accessible through the widget system — no information loss compared to the current dashboard.
- **SC-005**: Users can reset to the default layout in 2 interactions or fewer (enter edit mode + confirm reset).
- **SC-006**: The dashboard remains fully usable on mobile devices with single-column reordering providing the same information access as the desktop grid.
- **SC-007**: Layout configuration persists across browser sessions with zero data loss under normal usage conditions (no storage clearing).

## Assumptions

- The current dashboard layout order (KPIs, charts, accordion sections) serves as a sensible default layout for all new users.
- An explicit edit mode (similar to iOS home screen editing) is preferable to an always-editable grid, preventing accidental layout changes during daily use.
- Each of the four KPI metrics is an independent widget rather than a single grouped widget, giving users maximum flexibility to place individual metrics where they want.
- The existing accordion sections (Debt Snapshot, Spend by Card Source, Owner Transfers, Recent Activity, Smart Insights) each become their own widget, no longer grouped in an accordion.
- Layout data is small enough to store in `localStorage` alongside existing app data without storage concerns.
- Desktop and mobile layouts are independent — customizing one does not affect the other.
- The existing dashboard filters (view mode, owner, month, time range) continue to operate globally across all widgets regardless of layout.
- Widget size primarily affects visual presentation and information density — not which data is fetched or calculated.
