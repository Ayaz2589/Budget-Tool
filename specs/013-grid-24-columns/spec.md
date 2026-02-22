# Feature Specification: 24-Column Dashboard Grid

**Feature Branch**: `013-grid-24-columns`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "can we make the grid size 24 instead of 16, this will let us add more widget dimensions"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Finer-Grained Widget Sizing (Priority: P1)

As a user arranging my dashboard, I want widgets to have more granular width options so I can create layouts that better fit the content of each widget. With a 24-column grid, widgets can be placed at widths like 5, 6, 7, 9, 10, or 12 columns instead of being limited to multiples of the current coarser grid.

**Why this priority**: This is the core value of the change. More columns means more possible widget widths, allowing each widget's S/M/L dimensions to be tuned more precisely without jumping between sizes that feel too small or too large.

**Independent Test**: Resize any widget between S, M, and L and verify that each size occupies the expected fraction of the dashboard width. Widgets should snap cleanly to the new column boundaries.

**Acceptance Scenarios**:

1. **Given** the dashboard is loaded, **When** I view any widget, **Then** it occupies the correct number of columns out of 24 for its current size
2. **Given** a widget is set to size M, **When** I compare its width to the total dashboard width, **Then** it occupies the expected proportion (e.g., 8/24 = 1/3 or 12/24 = 1/2 depending on the widget)
3. **Given** I resize a widget from S to L, **When** the layout updates, **Then** the widget smoothly transitions to its new column span without overlapping other widgets

---

### User Story 2 - Existing Layout Migration (Priority: P1)

As a returning user with a saved dashboard layout, I want my existing widget arrangement to be preserved when the grid changes from 16 to 24 columns. Widget positions and relative sizes should migrate automatically without me needing to reconfigure anything.

**Why this priority**: Without migration, every existing user loses their dashboard layout on update, creating a poor experience.

**Independent Test**: Save a layout under the current 16-column grid, apply the migration, and verify that all widgets appear at proportionally equivalent positions and widths in the 24-column grid.

**Acceptance Scenarios**:

1. **Given** a saved layout with version 5 (16-column grid), **When** the app loads with the 24-column grid, **Then** all widget positions are scaled proportionally (x and w values multiplied by 1.5) and the layout version is bumped to 6
2. **Given** a widget at position x=0, w=8 in the 16-column grid, **When** migration runs, **Then** it is placed at x=0, w=12 in the 24-column grid
3. **Given** a widget at position x=8, w=4 in the 16-column grid, **When** migration runs, **Then** it is placed at x=12, w=6 in the 24-column grid
4. **Given** the migration has already been applied (version 6), **When** the app loads again, **Then** no further migration occurs

---

### Edge Cases

- What happens when a 16-column x or w value does not scale to a whole number in 24 columns? (e.g., w=5 in 16-col = w=7.5 in 24-col) — Round to the nearest integer, clamping to minimum width of 2
- What happens when a scaled widget would extend beyond column 24? — Clamp x so that x + w <= 24, shifting the widget left if necessary
- What happens when multiple widgets overlap after migration? — Let the grid layout engine resolve collisions by pushing widgets down, same as current behavior
- How does mobile layout behave? — Mobile layout uses a single-column stack and is unaffected by the column count change

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard grid MUST use 24 columns instead of 16
- **FR-002**: Each widget's per-size dimensions (S/M/L) MUST be updated to use 24-column values that preserve or improve the visual proportions from the 16-column layout
- **FR-003**: The default layout MUST be updated with 24-column positions and widths for all widgets
- **FR-004**: Saved layouts with version 5 (16-column) MUST be automatically migrated to version 6 (24-column) by scaling x and w values by a factor of 1.5
- **FR-005**: Migrated x and w values that are not whole numbers MUST be rounded to the nearest integer
- **FR-006**: After migration, no widget's position MUST exceed the 24-column boundary (x + w <= 24)
- **FR-007**: The layout version MUST be bumped from 5 to 6 after successful migration
- **FR-008**: Layouts already at version 6 or higher MUST NOT be re-migrated
- **FR-009**: Widget height (h) values MUST remain unchanged during migration — only horizontal values (x, w) are scaled
- **FR-010**: The size picker (S/M/L) MUST continue to function identically from the user's perspective

### Key Entities

- **Grid Configuration**: The number of columns used by the dashboard layout engine (changing from 16 to 24)
- **Widget Size Dimensions (sizeDims)**: Per-widget mapping of S/M/L to grid width and height values — widths need updating for the 24-column grid
- **Layout Version**: Persisted version number used to trigger one-time migrations (5 → 6)
- **Default Layout**: The initial arrangement of widgets for new users, defined in 24-column coordinates

## Assumptions

- The 1.5x scaling factor (16 * 1.5 = 24) produces clean conversions for most current widget widths (2→3, 4→6, 6→9, 8→12)
- Widget widths of 5 in the old grid (if any exist) will round to 8 (7.5 rounded up) which is an acceptable approximation
- The minimum widget width remains 2 columns (now representing 2/24 = 8.3% of the dashboard instead of 2/16 = 12.5%)
- Mobile layout is unaffected since it uses a single-column stack

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All widgets render at their correct 24-column widths with no visual overlap or clipping
- **SC-002**: Existing users' saved layouts migrate seamlessly — 100% of widgets appear at proportionally correct positions after migration
- **SC-003**: The size picker continues to offer exactly 3 options (S, M, L) per widget with no user-facing change
- **SC-004**: Dashboard loads with no errors or layout resets for both new and returning users
- **SC-005**: All existing tests continue to pass after the grid change
