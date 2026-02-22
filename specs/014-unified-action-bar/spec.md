# Feature Specification: Unified Action Bar

**Feature Branch**: `014-unified-action-bar`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "lets update the desktop action buttons (add expense add income etc. to use the mobile buttons as well instead of the current setup)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Floating Action Bar on Desktop Dashboard (Priority: P1)

Currently the desktop dashboard has 5 text+icon buttons in the page header (Manage Widgets, Reset Layout, Add Expense, Add Income, Settings). The mobile dashboard uses a compact floating action bar (DsActionBar) with icon-only circular buttons in a pill-shaped container. The user wants the desktop dashboard to use the same floating action bar pattern instead of the header buttons, creating a consistent experience across breakpoints.

The desktop action bar should appear in the same bottom-right position as mobile, containing the same set of quick-action buttons: Settings, Add Income, and Add Expense. The "Manage Widgets" and "Reset Layout" actions should remain accessible but move into the widget popover controls or another secondary location since they are layout management actions, not primary transaction actions.

**Why this priority**: This is the core feature — unifying the action pattern across desktop and mobile. It eliminates the visual mismatch and reduces the header clutter on desktop.

**Independent Test**: Can be tested by viewing the dashboard on a desktop viewport. The floating action bar should appear at the bottom-right with the 3 primary action buttons (Settings, Add Income, Add Expense) and the header should no longer contain those buttons.

**Acceptance Scenarios**:

1. **Given** the user is on the desktop dashboard, **When** the page loads, **Then** a floating action bar with icon-only circular buttons appears in the bottom-right corner containing Settings, Add Income, and Add Expense buttons.
2. **Given** the user is on the desktop dashboard, **When** the page loads, **Then** the header no longer contains the Add Expense, Add Income, or Settings text+icon buttons.
3. **Given** the user clicks the Add Expense button in the floating action bar, **When** the dialog opens, **Then** the Add Transaction dialog appears identically to the current behavior.
4. **Given** the user clicks the Add Income button in the floating action bar, **When** the dialog opens, **Then** the Add Income dialog appears identically to the current behavior.
5. **Given** the user clicks the Settings button in the floating action bar, **When** the panel opens, **Then** the dashboard settings sheet appears identically to the current behavior.

---

### User Story 2 - Retain Widget Management Access on Desktop (Priority: P2)

The "Manage Widgets" and "Reset Layout" buttons are currently in the desktop header. Since the header action buttons are being replaced by the floating action bar (which only contains primary transaction actions), these widget management actions need a new home so they remain accessible.

These actions should move into the existing widget management UI — the widget catalog can remain accessible via a dedicated button in the header (or via the widget shell controls), and "Reset Layout" can be offered within the widget catalog dialog.

**Why this priority**: Secondary to the main visual change but required so no functionality is lost.

**Independent Test**: Can be tested by verifying the Manage Widgets and Reset Layout actions are still reachable from the desktop dashboard through the widget catalog or header controls.

**Acceptance Scenarios**:

1. **Given** the user is on the desktop dashboard, **When** the user looks for widget management controls, **Then** the Manage Widgets action is accessible from the header or another discoverable location.
2. **Given** the user opens the widget catalog, **When** the catalog is displayed, **Then** a Reset Layout option is available within the catalog dialog.

---

### Edge Cases

- What happens when the dashboard is empty (no expenses, income, or debts)? The floating action bar should still appear so the user can add their first transaction.
- What happens on tablet-sized viewports (768px-1199px)? The floating action bar should be shown consistently regardless of viewport width since it replaces the desktop header buttons.
- What happens if the action bar overlaps with dashboard content at the bottom? The action bar should float above content with appropriate z-index and not obscure critical information.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The floating action bar MUST appear on all viewport sizes (mobile and desktop) on the dashboard page, positioned at the bottom-right corner.
- **FR-002**: The floating action bar MUST contain exactly 3 icon-only circular buttons: Settings (SlidersHorizontal icon), Add Income (Wallet icon), and Add Expense (Plus icon), in that order from left to right.
- **FR-003**: The desktop dashboard header MUST no longer render the Add Expense, Add Income, or Settings text+icon buttons.
- **FR-004**: The DsActionBar component MUST remove its `md:hidden` class so it renders on all breakpoints.
- **FR-005**: Each button in the action bar MUST have an accessible aria-label with the translated action name.
- **FR-006**: The Manage Widgets action MUST remain accessible from the desktop dashboard header as a standalone button or from within widget controls.
- **FR-007**: The Reset Layout action MUST remain accessible, either within the widget catalog dialog or alongside the Manage Widgets button.

## Assumptions

- The floating action bar visual design (pill shape, blur background, shadow, rounded buttons) is already approved via the mobile implementation and does not need redesign for desktop.
- The DsActionBar positioning at `bottom-[calc(env(safe-area-inset-bottom)+84px)]` may need adjustment for desktop since there is no mobile bottom navigation bar — this will be addressed during implementation.
- Haptic feedback (triggerHaptic) will be a no-op on desktop browsers that don't support the Vibration API, which is acceptable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users see a single, consistent action bar pattern across mobile and desktop — no text+icon header buttons for the 3 primary actions.
- **SC-002**: All 3 primary actions (Add Expense, Add Income, Settings) are reachable within 1 click from the desktop dashboard.
- **SC-003**: Widget management actions (Manage Widgets, Reset Layout) remain reachable within 2 clicks from the desktop dashboard.
- **SC-004**: The floating action bar does not obscure any widget content when the dashboard is scrolled to the bottom.
- **SC-005**: The unified action bar renders correctly on viewports from 320px to 2560px wide without layout breakage.
