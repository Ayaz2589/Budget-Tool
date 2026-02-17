# Feature Specification: UX Overhaul — Reduce Clicks, Surface Financial Data

**Feature Branch**: `001-ux-overhaul`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "Implement better UX into the application. Users should always have their most important data as few clicks away as possible. We have a lot of financial data that we can use. What would make our users' life easier."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dashboard Quick-Add (Priority: P1)

A user is reviewing their dashboard and sees their spending summary. They just paid for groceries and want to log it immediately without leaving the dashboard. They tap the "+" button, fill in the amount and category, and save — all without navigating to the Transactions page.

Separately, a user who buys coffee every morning has a preset saved for it. They see a "Coffee" chip on the dashboard, tap it, confirm the amount, and save in 2 taps.

**Why P1**: The dashboard is the most-visited page. Letting users add transactions without navigation removes the single biggest point of friction in the daily workflow.

**Independent Test**: Can be fully tested by opening the dashboard, tapping the add button, filling the form, and verifying the transaction appears in the transaction list. Presets can be tested by creating a preset first, then tapping its chip on the dashboard.

**Acceptance Scenarios**:

1. **Given** user is on the dashboard (mobile), **When** they tap the "+" FAB, **Then** the add-transaction sheet opens with a blank form
2. **Given** user is on the dashboard (desktop), **When** they click "Add Expense" in the header, **Then** the add-transaction sheet opens
3. **Given** user is on the dashboard (mobile), **When** they tap the wallet FAB, **Then** the add-income sheet opens
4. **Given** user has presets and is on the dashboard, **When** they tap a preset chip, **Then** the add-transaction sheet opens with the preset's category, source, owner, and amount pre-filled
5. **Given** user has no presets, **When** they view the dashboard, **Then** the preset chip strip is not shown
6. **Given** user fills the form from the dashboard and saves, **When** they return to the transaction list, **Then** the new entry is visible

---

### User Story 2 — Inline Table Editing (Priority: P1)

A user is reviewing their transaction list on desktop and notices an expense was categorized as "Dining" when it should be "Groceries." Instead of clicking the row, waiting for the actions sheet to open, changing the dropdown, and closing the sheet, they simply click the category cell directly in the table and select the correct category from an inline dropdown.

**Why P1**: Changing category and owner are the two most common edits. The current 3-step modal flow (tap row → actions sheet → change select) creates unnecessary friction for the most frequent interaction.

**Independent Test**: Can be tested by opening the transactions page on a desktop-width screen, clicking a category cell, selecting a different category, and verifying the change persists. Mobile users continue using the existing actions sheet unchanged.

**Acceptance Scenarios**:

1. **Given** user is on transactions page (desktop), **When** they click a category cell, **Then** an inline dropdown appears with all available categories
2. **Given** user selects a new category from the inline dropdown, **When** the dropdown closes, **Then** the category is updated immediately (no save button needed)
3. **Given** user clicks an owner cell on desktop, **When** they select a different owner, **Then** the owner is updated immediately
4. **Given** user clicks any other part of the row (date, amount, description), **When** the row is clicked, **Then** the actions sheet opens as before
5. **Given** user is on transactions page (mobile), **When** they tap a row, **Then** the existing actions sheet opens (no inline editing on mobile)
6. **Given** user is on the income page (desktop), **When** they click a category or owner cell, **Then** the same inline editing behavior applies

---

### User Story 3 — Contextual Add-Missing (Priority: P2)

A user is adding a new expense and needs the category "Pet Care" which doesn't exist yet. Instead of abandoning the form, navigating to Settings, adding the category, and returning, they see a "Create new…" option at the bottom of the category dropdown. They type "Pet Care," tap Add, and the category is created and selected in one step.

Similarly, when importing bank data, a user sees a list of 5 missing categories. Instead of an all-or-nothing "Add All" button, they can individually check the ones they want to keep and skip the ones that look like import artifacts.

**Why P2**: Eliminates context-switching during the two main data entry flows (manual add and import). Less frequent than US1/US2 but high-frustration when it occurs.

**Independent Test**: Can be tested by opening the add-transaction form, scrolling to the bottom of the category dropdown, typing a new name, and verifying it appears in both the form and the Settings categories list. Import granularity can be tested by importing a CSV with unknown categories and verifying per-item selection works.

**Acceptance Scenarios**:

1. **Given** user is adding a transaction, **When** they open the category dropdown, **Then** they see all existing categories plus a "Create new…" input row at the bottom
2. **Given** user types a new category name and clicks Add, **When** the action completes, **Then** the new category is created in settings and selected in the form
3. **Given** user types a name that already exists, **When** they try to add it, **Then** the existing category is selected (no duplicate created)
4. **Given** user is adding income, **When** they open the category or owner dropdown, **Then** the same "Create new…" pattern is available
5. **Given** user imports a CSV with 3 missing expense categories and 2 missing owners, **When** the missing metadata dialog appears, **Then** each item has an individual checkbox (all checked by default)
6. **Given** user unchecks 2 of 3 missing categories, **When** they click "Add 3 selected," **Then** only the checked items are added to settings; unchecked categories are normalized to "Uncategorized" on the imported transactions

---

### User Story 4 — Smarter Empty States (Priority: P2)

A new user opens the Transactions page for the first time and sees "No transactions." Instead of a dead end, they see a helpful description ("Add a transaction manually or import from a bank statement") with two buttons: "Add Transaction" and "Import CSV." They immediately know what to do.

**Why P2**: First-time users are the most confused and the most likely to abandon. Guided empty states reduce time-to-first-value. Lower priority than US1/US2 because experienced users rarely see empty states.

**Independent Test**: Can be tested by clearing all data, navigating to each page (Transactions, Income, Presets, Debt), and verifying each shows appropriate guidance text and action buttons that function correctly.

**Acceptance Scenarios**:

1. **Given** user has no transactions, **When** they view the Transactions page, **Then** they see a hint message and "Add Transaction" + "Import CSV" buttons
2. **Given** user clicks "Add Transaction" on the empty state, **When** the button is clicked, **Then** the add-transaction dialog opens
3. **Given** user clicks "Import CSV" on the empty state, **When** the button is clicked, **Then** they are navigated to the Import page
4. **Given** user has no income entries, **When** they view the Income page, **Then** they see a hint and an "Add Income" button
5. **Given** user has no presets and no categories, **When** they view the Presets page, **Then** they see guidance to set up categories first with a "Go to Settings" button
6. **Given** user has categories but no presets, **When** they view the Presets page, **Then** they see an "Add Preset" button with an explanation of what presets do
7. **Given** user has no debts, **When** they view the Debt page, **Then** they see a hint and an "Add Debt" button

---

### Edge Cases

- What happens when the user creates a category/owner with leading/trailing whitespace? The system trims whitespace before creating.
- What happens when the dashboard has both presets and the add-transaction dialog open simultaneously? Only one sheet should be open at a time.
- What happens when a desktop user resizes their browser below the mobile breakpoint while an inline select is open? The select should close gracefully; mobile users fall back to the actions sheet.
- What happens when all widgets are hidden on the dashboard and the user tries to quick-add? Quick-add buttons are independent of widgets and always available.
- What happens if the import CSV has 50+ missing categories? The checkbox list should be scrollable with "Select All" / "Deselect All" toggles for bulk management.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow adding transactions directly from the dashboard page via action buttons
- **FR-002**: System MUST allow adding income directly from the dashboard page via action buttons
- **FR-003**: System MUST display saved preset templates as tappable chips on the dashboard when presets exist
- **FR-004**: Tapping a preset chip MUST open the add-transaction form with the preset's fields pre-filled
- **FR-005**: Desktop table views MUST support inline category editing via dropdown without opening a side sheet
- **FR-006**: Desktop table views MUST support inline owner editing via dropdown without opening a side sheet
- **FR-007**: Mobile table/list views MUST retain the existing actions sheet pattern (no inline editing)
- **FR-008**: All category and owner dropdown fields MUST include a "create new" option that adds the item to settings inline
- **FR-009**: Newly created categories/owners MUST be immediately available in all dropdowns across the app without refresh
- **FR-010**: The import missing-metadata dialog MUST allow individual item selection via checkboxes
- **FR-011**: The import dialog MUST provide "Select All" and "Deselect All" bulk actions
- **FR-012**: Empty state pages MUST display contextual guidance text explaining what the page is for
- **FR-013**: Empty state pages MUST include at least one primary action button to get started
- **FR-014**: All user-facing text MUST use i18n translation keys (no hardcoded strings)

### Key Entities

- **PresetTransaction**: Saved template with source, amount, category, owner — surfaced as dashboard chips
- **WidgetConfig**: Existing dashboard configuration (order + visibility) — independent of quick-add
- **DsCreatableSelect**: New reusable dropdown component — supports all existing options plus inline creation of new items

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a transaction from the dashboard in under 15 seconds (currently requires page navigation + 2 clicks = ~30 seconds)
- **SC-002**: Users can change an expense category on desktop in 2 clicks (currently 3 steps: tap row → actions sheet → select)
- **SC-003**: Users can create a new category and assign it during transaction entry without any page navigation (currently requires leaving the form)
- **SC-004**: 100% of empty state pages show at least one actionable button that leads to the primary creation flow
- **SC-005**: Import metadata selection supports per-item granularity (currently all-or-nothing)
- **SC-006**: All existing tests continue to pass; no regression in core financial calculations
