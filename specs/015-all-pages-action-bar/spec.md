# Feature Specification: All Pages Action Bar

**Feature Branch**: `015-all-pages-action-bar`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "do this for all the pages"

## Context

Feature 014 unified the Dashboard page's desktop action buttons into a floating action bar matching the mobile pattern. This feature extends that same pattern to all remaining pages: Transactions, Income, Debt, Mortgage, Import, and Presets.

Currently, each of these pages has:
- **Desktop**: Text+icon buttons in the page header (via DsSectionHeader `actions` prop), hidden on mobile with `hidden md:inline-flex`
- **Mobile**: Icon-only circular buttons in a floating action bar (DsActionBar), hidden on desktop with `md:hidden`

After this feature, all pages will show the floating action bar on both mobile and desktop, and the desktop header will no longer contain primary action buttons.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Unified Action Bar on Standard Pages (Priority: P1)

The Income, Debt, Mortgage, and Presets pages each have a single primary action button (e.g., "Add Income", "Add Debt", "Add Payment", "Add Preset"). On desktop, these are currently text+icon buttons in the page header. The user wants these replaced with the floating action bar pattern — a fixed pill-shaped bar at the bottom-right with icon-only circular buttons, consistent with the Dashboard.

**Why this priority**: These 4 pages follow an identical pattern (single add button) and are the simplest to convert. Covers the majority of pages in one pass.

**Independent Test**: Navigate to the Income page on a desktop viewport. Verify the floating action bar appears at the bottom-right with the Add Income icon button, and the header no longer contains the "Add Income" text button.

**Acceptance Scenarios**:

1. **Given** the user is on the Income page on desktop, **When** the page loads, **Then** a floating action bar appears at the bottom-right with a Plus icon button, and the header no longer has the "Add Income" text button.
2. **Given** the user is on the Debt page on desktop, **When** the page loads, **Then** a floating action bar appears at the bottom-right with a Plus icon button, and the header no longer has the "Add Debt" text button.
3. **Given** the user is on the Mortgage page on desktop, **When** the page loads, **Then** a floating action bar appears at the bottom-right with a Plus icon button, and the header no longer has the "Add Payment" text button.
4. **Given** the user is on the Presets page on desktop, **When** the page loads, **Then** a floating action bar appears at the bottom-right with a Plus icon button, and the header no longer has the "Add Preset" text button.
5. **Given** the user clicks any action bar button on desktop, **When** the dialog opens, **Then** it behaves identically to the current desktop button behavior.

---

### User Story 2 — Unified Action Bar on Transactions Page (Priority: P2)

The Transactions page has two desktop buttons: a "Filters & Actions" button (with active filter badge) and an "Add Expense" button, rendered via a TransactionsToolbar component. These should be replaced by showing the floating action bar on desktop with the same 2 icon-only buttons that mobile already uses (SlidersHorizontal for filters, Plus for add).

**Why this priority**: The Transactions page is more complex than standard pages — it has a dedicated toolbar component and a filter-active badge indicator. Requires removing the toolbar from the header and ensuring filter state indicators work in the icon-only format.

**Independent Test**: Navigate to the Transactions page on desktop. Verify the floating action bar appears with 2 buttons (Filters, Add Expense). Apply a filter and verify the filter button still conveys the active state via aria-label.

**Acceptance Scenarios**:

1. **Given** the user is on the Transactions page on desktop, **When** the page loads, **Then** a floating action bar appears with 2 icon buttons: Filters (SlidersHorizontal) and Add Expense (Plus).
2. **Given** the user is on the Transactions page on desktop, **When** the page loads, **Then** the header no longer contains the TransactionsToolbar with text buttons.
3. **Given** the user has active filters on the Transactions page, **When** viewing the floating action bar, **Then** the filter button's accessible label indicates filters are active.

---

### User Story 3 — Unified Action Bar on Import Page (Priority: P3)

The Import page conditionally shows an action button only when a file preview is available. Both the desktop header button and the mobile action bar already follow this pattern. The action bar should show on desktop when a preview exists, using the same conditional rendering.

**Why this priority**: The Import page has unique conditional behavior — the action bar only appears after data is loaded for preview. This is the most different from the standard pattern and should be handled last.

**Independent Test**: Navigate to the Import page on desktop. Verify no action bar appears initially. Import a file. Verify the action bar appears with the import action button.

**Acceptance Scenarios**:

1. **Given** the user is on the Import page on desktop with no file preview, **When** the page loads, **Then** no floating action bar is shown.
2. **Given** the user has imported a file on the Import page on desktop, **When** the preview is displayed, **Then** a floating action bar appears with the import action button.

---

### Edge Cases

- What happens on the Presets page when no expense categories exist? The action bar button should appear but be disabled, matching current mobile behavior.
- What happens on the Import page when the preview is cleared? The action bar should disappear, matching current mobile behavior.
- What happens on the Transactions page when navigating between pages? The action bar should be page-specific and not persist across page transitions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All pages (Income, Debt, Mortgage, Presets, Transactions, Import) MUST show the floating action bar on all viewport sizes, not just mobile.
- **FR-002**: The floating action bar on each page MUST contain the same icon-only buttons currently shown in the mobile action bar for that page.
- **FR-003**: Desktop page headers MUST no longer render primary action text+icon buttons that are duplicated by the floating action bar.
- **FR-004**: Each floating action bar button MUST have an accessible aria-label with the translated action name.
- **FR-005**: The Transactions page floating action bar MUST show a Filters button and an Add Expense button, and the filter button's aria-label MUST indicate when filters are active.
- **FR-006**: The Import page floating action bar MUST only appear when a file preview is available, consistent with current conditional behavior.
- **FR-007**: The Presets page floating action bar button MUST be disabled when no expense categories exist.
- **FR-008**: Mobile behavior on all pages MUST remain unchanged — same buttons, same positioning, same functionality.

## Assumptions

- The DsActionBar component already supports the `mobileOnly` prop (added in feature 014). Each page will pass `mobileOnly={false}` to show the bar on desktop.
- Desktop positioning at `md:bottom-4` (from feature 014) works correctly for all pages since no page has a desktop bottom navigation bar.
- The TransactionsToolbar component on desktop will be removed from the header; its buttons are fully replaced by the floating action bar's icon-only buttons.
- The existing `hidden md:inline-flex` pattern on desktop header buttons will be removed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 6 non-dashboard pages display a floating action bar on both mobile and desktop viewports.
- **SC-002**: All primary actions on every page are reachable within 1 click from the floating action bar on desktop.
- **SC-003**: No page header contains duplicate action buttons that are already in the floating action bar.
- **SC-004**: Mobile behavior on all pages remains identical to the pre-feature state (same buttons, same positioning).
- **SC-005**: The floating action bar renders correctly on viewports from 320px to 2560px wide without layout breakage on any page.
