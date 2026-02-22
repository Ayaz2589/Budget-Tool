# Feature Specification: Always-On Widget Controls

**Feature Branch**: `011-always-on-widget-controls`
**Created**: 2026-02-21
**Status**: Draft
**Input**: Remove the global dashboard edit mode toggle. Replace with always-available contextual widget controls: drag-and-drop via handle, resize/hide via popover, mobile reorder via long-press popover.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resize a Widget Without Entering Edit Mode (Priority: P1)

A user viewing their dashboard wants to make a chart widget larger. They click the overflow ("...") button on the widget, select a different size from the popover, and the widget resizes immediately. No mode toggle, no "Done" button — the dashboard stays in its normal viewing state throughout.

**Why this priority**: This is the core value proposition. Removing the edit-mode ceremony for the most common customization action (resizing) directly reduces friction.

**Independent Test**: Can be fully tested by clicking the overflow button on any widget and selecting a size option. Delivers immediate layout change with zero mode-switching.

**Acceptance Scenarios**:

1. **Given** a dashboard with visible widgets, **When** the user clicks the "..." button on a widget, **Then** a popover appears showing the allowed size options (e.g., S, W, M for a KPI widget) and a "Hide" action
2. **Given** the popover is open, **When** the user selects a different size, **Then** the widget resizes to that size, the grid reflows, and the popover closes
3. **Given** the popover is open, **When** the user clicks outside the popover or presses Escape, **Then** the popover dismisses without any changes

---

### User Story 2 - Drag a Widget to a New Position (Priority: P1)

A user wants to move a widget to a different spot on their dashboard. On desktop, they grab the drag handle on the widget and drag it to the desired position. The grid reflows around the dragged widget. No edit mode is needed.

**Why this priority**: Drag-and-drop reordering is the second most common layout action alongside resizing. Making it always available eliminates the biggest friction point.

**Independent Test**: Can be fully tested by dragging any widget by its handle to a new grid position and verifying the layout persists.

**Acceptance Scenarios**:

1. **Given** a desktop dashboard, **When** the user hovers over a widget, **Then** a drag handle appears (subtle, non-intrusive)
2. **Given** a visible drag handle, **When** the user clicks and drags the handle, **Then** the widget moves with the cursor and other widgets reflow
3. **Given** the user drops the widget in a new position, **Then** the new layout is persisted to localStorage
4. **Given** a desktop dashboard, **When** the user clicks and drags on widget content (not the handle), **Then** no drag occurs (prevents accidental reordering)

---

### User Story 3 - Hide a Widget (Priority: P2)

A user wants to remove a widget they don't use. They click the "..." overflow button, select "Hide", and the widget disappears from the grid. They can re-add it later from the "Manage widgets" catalog in the dashboard header.

**Why this priority**: Hiding widgets is less frequent than resize or drag, but still needs to be accessible without a mode toggle.

**Independent Test**: Can be tested by hiding a widget via the popover and confirming it disappears, then re-adding it from the catalog.

**Acceptance Scenarios**:

1. **Given** the overflow popover is open, **When** the user clicks "Hide", **Then** the widget is removed from the grid and the layout reflows
2. **Given** a widget was hidden, **When** the user opens "Manage widgets" from the dashboard header, **Then** the hidden widget appears as available to re-add

---

### User Story 4 - Mobile Widget Reorder and Customize (Priority: P2)

A mobile user wants to rearrange or resize widgets. They long-press on a widget, which opens a popover with move-up, move-down, resize, and hide options. Direct touch-dragging does not trigger widget movement (prevents conflict with page scrolling).

**Why this priority**: Mobile is a secondary viewport but must have parity for customization. Long-press is the established mobile pattern for contextual actions.

**Independent Test**: Can be tested on a mobile viewport by long-pressing a widget and using the popover to reorder or resize.

**Acceptance Scenarios**:

1. **Given** a mobile dashboard, **When** the user long-presses a widget (approximately 500ms), **Then** a popover appears with: Move Up, Move Down, size options, and Hide
2. **Given** the mobile popover is open, **When** the user taps "Move Up", **Then** the widget swaps position with the widget above it and the popover closes
3. **Given** the mobile popover is open on the topmost widget, **Then** the "Move Up" option is disabled
4. **Given** a mobile dashboard, **When** the user scrolls normally (without long-press), **Then** no widget movement or popover is triggered

---

### User Story 5 - Remove Edit Mode UI Entirely (Priority: P1)

The dashboard header no longer shows "Edit layout" / "Done" buttons. The "Manage widgets" button remains accessible in the header for re-showing hidden widgets and resetting the layout.

**Why this priority**: Removing the mode toggle is the prerequisite for the always-on model. Without this, the UX is confusing (two ways to do the same thing).

**Independent Test**: Can be verified by inspecting the dashboard header — no edit mode toggle exists, but "Manage widgets" and "Reset layout" remain.

**Acceptance Scenarios**:

1. **Given** the dashboard page, **When** the user views the header, **Then** there is no "Edit layout" or "Done" button
2. **Given** the dashboard page, **When** the user clicks "Manage widgets", **Then** the widget catalog opens showing all widgets with visibility toggles
3. **Given** the dashboard, **Then** no widgets display ring highlights, extra padding, or other edit-mode visual indicators

---

### Edge Cases

- What happens when a user opens the popover on a widget that has only one allowed size? The popover still opens but the size selector shows only the one option (visually indicating no resize is possible), and the "Hide" action is still available.
- What happens if the user long-presses on mobile and then scrolls? The long-press is cancelled if the finger moves beyond a small threshold before the timer fires.
- What happens when all widgets are hidden? The existing "No widgets visible" empty state with "Manage widgets" link continues to appear.
- What happens if the drag handle overlaps with interactive widget content (buttons, links)? The drag handle is positioned in a dedicated area (top-right corner of the widget) that does not overlap with widget content.
- What happens if the user opens a popover on one widget, then clicks the "..." on another widget? The first popover closes and the second opens.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each widget MUST display an overflow button ("...") that opens a popover with resize and hide controls
- **FR-002**: The overflow button MUST be visible on hover (desktop) and always visible (mobile)
- **FR-003**: The popover MUST contain allowed size options for the widget and a "Hide widget" action
- **FR-004**: Selecting a size in the popover MUST immediately resize the widget and close the popover
- **FR-005**: The popover MUST dismiss on outside click, Escape key, or after selecting an action
- **FR-006**: Desktop widgets MUST be draggable at all times via a drag handle, without requiring a mode toggle
- **FR-007**: The drag handle MUST appear on hover (desktop) and be positioned so it does not overlap widget content
- **FR-008**: Dragging by widget content (not the handle) MUST NOT initiate a drag operation
- **FR-009**: On mobile, long-press (approximately 500ms) on a widget MUST open a popover with: Move Up, Move Down, size options, and Hide
- **FR-010**: Mobile widgets MUST NOT be directly draggable (to prevent conflict with page scrolling)
- **FR-011**: Move Up and Move Down MUST be disabled when the widget is at the respective boundary
- **FR-012**: The global edit mode state (`isEditing`, `startEditing`, `stopEditing`) MUST be removed from the layout context
- **FR-013**: The "Edit layout" and "Done" buttons MUST be removed from the dashboard header
- **FR-014**: The "Manage widgets" catalog MUST remain accessible from the dashboard header
- **FR-015**: Edit-mode visual indicators (ring highlights, extra padding, +1h height bump on sm widgets) MUST be removed
- **FR-016**: Layout changes (drag, resize, hide) MUST persist to localStorage immediately
- **FR-017**: Unused i18n keys related to edit mode (e.g., `widget.editLayout`, `widget.doneEditing`, `widget.editingHint`) MUST be removed

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can resize a widget in 2 interactions (click overflow, select size) instead of the current 4 (click Edit, select size, click Done)
- **SC-002**: Users can reposition a widget in 1 interaction (drag handle) instead of the current 2 (click Edit, then drag)
- **SC-003**: All existing widget customization capabilities (resize, hide, show, reorder, reset) remain functional after edit mode removal
- **SC-004**: No accidental widget movement occurs during normal page scrolling on mobile
- **SC-005**: No accidental widget drag occurs when clicking/interacting with widget content on desktop
- **SC-006**: Dashboard loads without any edit-mode visual artifacts (no ring highlights, no extra padding, no height adjustments)
- **SC-007**: Existing persisted user layouts (localStorage) continue to work without migration issues

### Assumptions

- The existing shadcn/ui Popover component is suitable for the overflow popover. If not available, a similar radix-based popover or dropdown-menu will be used.
- Long-press detection on mobile uses a ~500ms threshold, consistent with platform conventions.
- The "Manage widgets" catalog and "Reset layout" functionality remain unchanged in behavior — only the edit-mode toggle is removed.
- The drag handle visual treatment (e.g., a grip icon) matches the existing GripVertical icon but transitions from edit-mode-only to always-on-hover.
