# Feature Specification: Save Multiple Layouts

**Feature Branch**: `017-save-multiple-layouts`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "allow users to save multiple layouts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save Current Layout (Priority: P1)

A user has customized their dashboard — moved widgets, resized them, hidden some — and wants to save this arrangement as a named preset so they can return to it later.

**Why this priority**: This is the core capability. Without saving, there is nothing to load or manage.

**Independent Test**: User customizes the dashboard, clicks "Save layout", enters a name, and confirms. The layout name appears in the layout list. Refreshing the page and selecting that name restores the exact arrangement.

**Acceptance Scenarios**:

1. **Given** a customized dashboard, **When** the user saves the layout with the name "Work Mode", **Then** the layout is persisted and appears in the list of saved layouts.
2. **Given** an existing saved layout named "Work Mode", **When** the user modifies the dashboard and saves again with the same name, **Then** the system asks whether to overwrite or save as new, and the user's choice is honored.
3. **Given** the user attempts to save with an empty name, **Then** the system prevents saving and indicates the name is required.

---

### User Story 2 - Switch Between Saved Layouts (Priority: P1)

A user has saved multiple layouts (e.g., "Overview", "Analysis", "Compact") and wants to quickly switch between them from the dashboard.

**Why this priority**: Switching is the primary reason to save — without it, saving has no value.

**Independent Test**: Given two or more saved layouts, user selects a different layout from the switcher and the dashboard immediately reflects that layout's widget arrangement, sizes, and visibility.

**Acceptance Scenarios**:

1. **Given** two saved layouts "Overview" and "Analysis", **When** the user selects "Analysis", **Then** the dashboard updates to show the "Analysis" widget arrangement.
2. **Given** the user is viewing "Overview" and has unsaved changes, **When** the user switches to "Analysis", **Then** the unsaved changes to "Overview" are discarded (the user was editing the live layout, not the saved snapshot).
3. **Given** only the default layout exists (no saved layouts), **When** the user opens the switcher, **Then** only "Default" is listed with an option to save the current layout.

---

### User Story 3 - Delete a Saved Layout (Priority: P2)

A user wants to remove a saved layout they no longer need.

**Why this priority**: Necessary for housekeeping, but secondary to save and switch.

**Independent Test**: User deletes a saved layout and confirms it no longer appears in the list.

**Acceptance Scenarios**:

1. **Given** a saved layout named "Old Layout", **When** the user deletes it and confirms, **Then** it is removed from the list.
2. **Given** the user is currently viewing "Old Layout" and deletes it, **When** the deletion completes, **Then** the dashboard switches to the default layout.
3. **Given** only the "Default" layout exists, **Then** the delete option is not available for it (the default layout cannot be deleted).

---

### User Story 4 - Rename a Saved Layout (Priority: P3)

A user wants to rename an existing saved layout without losing its arrangement.

**Why this priority**: Nice-to-have for organization. Lower priority because users can delete and re-save.

**Independent Test**: User renames "Layout A" to "Layout B", and the layout retains all widget positions and settings under the new name.

**Acceptance Scenarios**:

1. **Given** a saved layout named "Layout A", **When** the user renames it to "Layout B", **Then** the list shows "Layout B" with the same arrangement.
2. **Given** a saved layout named "Layout A" and another named "Layout B", **When** the user tries to rename "Layout A" to "Layout B", **Then** the system prevents the rename and indicates the name is already taken.

---

### Edge Cases

- What happens when the user reaches the maximum number of saved layouts? The system limits saved layouts to 10 and shows a message when the limit is reached.
- What happens when localStorage is full? The system shows an error message indicating storage is full and the layout could not be saved.
- What happens when a saved layout references widgets that have since been removed from the app (e.g., after an update)? The existing migration system handles this — unknown widgets are filtered out and new widgets are added at default positions.
- What happens when two layouts have the same name? The system enforces unique names. Duplicate names are rejected at save/rename time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to save the current dashboard layout under a user-provided name.
- **FR-002**: System MUST allow users to switch between saved layouts, immediately updating the dashboard.
- **FR-003**: System MUST allow users to delete any saved layout except the default.
- **FR-004**: System MUST allow users to rename any saved layout, enforcing unique names.
- **FR-005**: System MUST persist all saved layouts across browser sessions.
- **FR-006**: System MUST always have a "Default" layout that cannot be deleted or renamed. This is the factory-reset layout.
- **FR-007**: System MUST apply the existing version migration logic when loading saved layouts (so layouts saved at v7 still work at v8+).
- **FR-008**: System MUST limit the total number of saved layouts to 10 (including default).
- **FR-009**: System MUST indicate which layout is currently active.
- **FR-010**: System MUST provide the layout switcher in the existing dashboard toolbar area, accessible with minimal clicks.

### Key Entities

- **SavedLayout**: A named dashboard layout. Contains a unique name and a full `DashboardLayout` snapshot (version, desktop grid positions, mobile order).
- **Layout Collection**: The set of all saved layouts plus the active layout identifier. Persisted as a single unit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can save, switch, and delete layouts in under 3 interactions each.
- **SC-002**: Switching layouts updates the dashboard in under 1 second with no page reload.
- **SC-003**: All existing tests continue to pass — no regressions to current layout functionality.
- **SC-004**: Saved layouts survive browser refresh and app updates (via migration).
- **SC-005**: The feature works at all supported breakpoints (desktop, tablet, mobile).

## Assumptions

- Layout names are plain text, max 30 characters. No emoji or special formatting needed.
- The 10-layout limit is sufficient for personal use. This can be revisited if users request more.
- "Default" layout always reflects the app's built-in factory default, not a user-modified snapshot. Resetting to default restores the factory layout.
- Unsaved changes to the active layout are not preserved when switching — the dashboard always reflects the last-saved state of the selected layout. Live edits (drag, resize, hide) update the active layout in real time as they do today.
