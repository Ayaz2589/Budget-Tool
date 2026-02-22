# Feature Specification: Responsive Widget Layout

**Feature Branch**: `016-responsive-widget-layout`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Fix responsive dashboard widget layout by deriving md and sm breakpoint layouts from the lg layout at render time, preventing broken/overlapping widgets when resizing between 768px and 1200px"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tablet/Narrow Desktop Dashboard Viewing (Priority: P1)

A user accesses their budget dashboard on a tablet or narrow desktop window (768px-1200px wide). The dashboard widgets display in an organized, readable layout with no overlapping or broken positioning. Widgets that were arranged side-by-side on a wide screen automatically reflow into fewer columns while maintaining their relative ordering and proportional sizing.

**Why this priority**: This is the core problem. Users on tablets or resized browser windows currently see broken, overlapping widgets that make the dashboard unusable in the 768px-1200px viewport range.

**Independent Test**: Can be fully tested by resizing a browser window from above 1200px down to 768px and verifying all widgets reflow cleanly without overlap.

**Acceptance Scenarios**:

1. **Given** the dashboard has visible widgets arranged in a 24-column layout, **When** the user resizes their browser to between 996px and 1200px wide, **Then** all widgets remain visible and none overlap or extend beyond the viewport.
2. **Given** the dashboard has visible widgets arranged in a 24-column layout, **When** the user resizes their browser to between 768px and 996px wide, **Then** widgets scale down to fit a narrower column grid (proportional to the original layout) without overlapping.
3. **Given** two widgets are positioned side-by-side in the wide layout, **When** the viewport narrows below 996px and they can no longer fit side-by-side, **Then** they stack vertically in a readable manner rather than overlapping.

---

### User Story 2 - Layout Persistence on Resize Roundtrip (Priority: P2)

A user has customized their dashboard widget positions on a wide screen. They resize their browser down (e.g., to check how it looks on a smaller screen) and then resize back up. Their original wide-screen layout is restored exactly as they arranged it, with no positional drift or rearrangement.

**Why this priority**: Without this, users would lose their carefully arranged dashboard layouts every time they resize, making manual arrangement pointless.

**Independent Test**: Can be tested by arranging widgets, noting positions, resizing down then back up, and comparing positions to the original arrangement.

**Acceptance Scenarios**:

1. **Given** a user has arranged widgets in custom positions at the wide breakpoint, **When** they resize the window below 1200px and then back above 1200px, **Then** all widgets return to their exact previous positions.
2. **Given** a user drags a widget to a new position at the wide breakpoint, **When** they resize down to the narrow breakpoint and back up, **Then** the dragged widget remains in its new position.

---

### User Story 3 - Drag Interaction Scoped to Wide Layout (Priority: P3)

A user drags a widget to rearrange it while viewing the dashboard at a wide viewport (above 1200px). The new position is saved and reflected in subsequent derived layouts for narrower viewports. Layout reflows at narrower viewports do not alter the saved wide layout.

**Why this priority**: Ensures that the single source of truth (wide layout) is only modified by intentional user actions at the canonical viewport size, preventing accidental corruption of the saved layout from auto-reflow events.

**Independent Test**: Can be tested by dragging a widget at wide viewport, verifying it persists, then checking the narrow layout reflects the change proportionally.

**Acceptance Scenarios**:

1. **Given** a user drags a widget at the wide breakpoint, **When** they release the widget, **Then** the new position is persisted and survives a page reload.
2. **Given** the viewport is below 1200px and a layout reflow occurs, **When** the system processes the reflow, **Then** the saved wide layout is not modified.

---

### Edge Cases

- What happens when a widget has the minimum possible width (1 column on wide layout)? It should remain at 1 column on the narrow layout.
- What happens when a very small widget (e.g., 3 columns wide on 24-col) is scaled down? It should shrink proportionally but never go below 1 column.
- What happens when all widgets are full-width (24 columns)? They should become full-width at the narrow breakpoint (12 columns) as well.
- What happens when the user has hidden all widgets? The empty state should display correctly at any viewport width.
- What happens when a widget's scaled position would overflow the narrower column count? Its position should be clamped to stay within bounds.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all visible dashboard widgets without overlap at viewports between 768px and 1200px wide.
- **FR-002**: System MUST derive widget positions for narrower viewports proportionally from the wide (24-column) layout, scaling column positions and widths by the ratio of target columns to source columns.
- **FR-003**: System MUST ensure no widget's position plus width exceeds the available column count at any breakpoint.
- **FR-004**: System MUST clamp widget widths to a minimum of 1 column at any breakpoint.
- **FR-005**: System MUST preserve the user's wide-layout widget positions as the single source of truth and restore them exactly when the viewport returns to the wide breakpoint.
- **FR-006**: System MUST only persist layout changes made at the wide breakpoint (above 1200px). Reflows triggered by viewport changes at narrower breakpoints MUST NOT alter the persisted layout.
- **FR-007**: System MUST apply vertical compaction at narrower breakpoints so that gaps from proportional scaling are collapsed and widgets stack cleanly.
- **FR-008**: System MUST treat viewports below 768px as mobile, rendering widgets in a vertical stack (existing mobile grid behavior), unaffected by this feature.

### Key Entities

- **Desktop Grid Layout**: The canonical set of widget positions (x, y coordinates and w, h dimensions) in a 24-column grid. This is the user-arranged, persisted layout.
- **Derived Layout**: A computed layout for a narrower breakpoint, generated at render time by proportionally scaling the desktop grid layout. Not persisted.
- **Breakpoint**: A viewport width threshold that triggers a different column count for the grid (e.g., 24 columns above 1200px, 12 columns between 768px and 996px).

### Assumptions

- The existing mobile layout (below 768px) is handled separately and is not in scope for this feature.
- The medium breakpoint (996px-1200px) uses the same 24-column count as the wide breakpoint, so positions can be reused as-is (columns just become narrower).
- Vertical compaction is already enabled and will automatically close gaps when widgets are repositioned during scaling.
- Widget height (h) does not need to scale between breakpoints since row height is fixed and content adapts within the available space.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero widget overlaps visible at any viewport width between 768px and 1200px across all default and user-customized layouts.
- **SC-002**: 100% layout fidelity on resize roundtrip — after resizing below 1200px and back above, every widget returns to its exact prior position with zero positional drift.
- **SC-003**: Widget readability maintained at the narrow breakpoint — all widget content (text, charts, numbers) remains legible and not clipped at 768px viewport width.
- **SC-004**: No increase in stored data size — the feature derives layouts at render time without adding new persisted data per breakpoint.
- **SC-005**: All existing automated tests continue to pass with no regressions, and the application builds successfully.
