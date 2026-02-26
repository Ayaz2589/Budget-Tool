# Feature Specification: Desktop Modal with Animated Transitions

**Feature Branch**: `023-desktop-modal-animations`
**Created**: 2026-02-26
**Status**: Draft
**Input**: User description: "Update desktop to use a modal instead of a sliding sheet for adding data and functionality in transactions, income, debt, mortgage, presets. Add animations for opening and closing using framer motion."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Desktop Form Modals Replace Sliding Sheets (Priority: P1)

As a desktop user, when I click to add or edit data (transactions, income, debt payments, mortgage payments, or presets), the form appears as a centered modal overlay instead of a right-side sliding sheet, so the experience feels more focused and polished.

**Why this priority**: This is the core behavioral change. Every add/edit form across all five pages must present as a centered modal on desktop viewports. Without this, the feature has no value.

**Independent Test**: Can be verified by opening any add/edit form on a desktop-width viewport and confirming it appears centered rather than sliding in from the right.

**Acceptance Scenarios**:

1. **Given** a desktop viewport (768px+), **When** the user opens any add/edit form (e.g., Add Transaction, Edit Income, Add Debt), **Then** the form appears as a centered modal overlay with a dimmed background.
2. **Given** a desktop viewport, **When** the user opens a form that previously used a right-side sheet, **Then** the modal has a maximum width appropriate for the form content and is vertically centered.
3. **Given** a mobile viewport (below 768px), **When** the user opens the same form, **Then** it continues to appear as a full-screen sheet (existing mobile behavior is preserved).

---

### User Story 2 - Animated Modal Open/Close Transitions (Priority: P1)

As a user, when a modal opens or closes, I see a smooth animation (fade + scale) powered by framer-motion, so the interface feels fluid and modern.

**Why this priority**: Animations are explicitly requested and are the primary differentiator from simply swapping Sheet for Dialog. This is co-equal with Story 1 since the user specifically requested framer-motion animations.

**Independent Test**: Can be verified by opening and closing any form modal and visually confirming smooth animated transitions are present.

**Acceptance Scenarios**:

1. **Given** a desktop viewport, **When** a modal opens, **Then** it animates in with a combined fade-in and scale-up effect over a perceptible but brief duration (approximately 200–300ms).
2. **Given** an open modal, **When** the user closes it (via Cancel button, X button, Escape key, or overlay click), **Then** the modal animates out with a combined fade-out and scale-down effect.
3. **Given** the overlay/backdrop, **When** a modal opens or closes, **Then** the backdrop fades in and out in sync with the modal animation.
4. **Given** a mobile viewport, **When** a form opens or closes, **Then** existing slide-up/full-screen animation behavior is preserved (framer-motion animations apply only to desktop modals).

---

### User Story 3 - Consistent Modal Design Across All Pages (Priority: P2)

As a user navigating between Transactions, Income, Debt, Mortgage, and Presets pages, I see a consistent modal style and animation for all add/edit forms, so the app feels cohesive.

**Why this priority**: Consistency reinforces quality. Once the modal pattern is built (Stories 1–2), applying it uniformly is an extension of the same work.

**Independent Test**: Can be verified by opening add/edit forms across all five pages and confirming identical modal styling, size, and animation behavior.

**Acceptance Scenarios**:

1. **Given** the Transactions page on desktop, **When** the user opens Add Transaction, Edit Transaction, or Edit Transfer, **Then** each appears as an animated centered modal.
2. **Given** the Income page on desktop, **When** the user opens Add Income or Edit Income, **Then** each appears as an animated centered modal.
3. **Given** the Debt page on desktop, **When** the user opens Add Debt or Add Payment, **Then** each appears as an animated centered modal.
4. **Given** the Mortgage page on desktop, **When** the user opens Add Mortgage Payment, **Then** it appears as an animated centered modal.
5. **Given** the Presets page on desktop, **When** the user opens the preset editor, **Then** it appears as an animated centered modal.

---

### Edge Cases

- What happens when the user resizes the browser from desktop to mobile width while a modal is open? The modal should adapt gracefully — either remaining usable or closing and reopening in the mobile layout.
- What happens when a modal contains a long form that exceeds the viewport height? The modal content area should scroll internally while the header and action buttons remain fixed/sticky.
- What happens when the user presses Escape while an animation is in progress? The modal should complete its close animation without interruption or visual glitch.
- What happens when the user opens a confirmation dialog (e.g., delete) from within a modal? The confirmation should layer on top of the existing modal without conflict.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On desktop viewports (768px and above), all add/edit forms MUST render as centered modal overlays instead of right-side sliding sheets.
- **FR-002**: On mobile viewports (below 768px), all add/edit forms MUST retain their current full-screen sheet behavior.
- **FR-003**: Modal open animation MUST use framer-motion with a fade-in + scale-up effect.
- **FR-004**: Modal close animation MUST use framer-motion with a fade-out + scale-down effect.
- **FR-005**: The modal backdrop MUST fade in and out in sync with the modal animation.
- **FR-006**: All existing close interactions MUST continue to work: Cancel button, X/close button, Escape key, and overlay/backdrop click.
- **FR-007**: Modal content that exceeds the viewport height MUST scroll internally with fixed header and sticky action footer.
- **FR-008**: The following forms MUST be converted from sheets to desktop modals:
  - Transactions: AddTransactionDialog, EditTransactionDialog, EditTransferDialog, FiltersAndActionsDialog
  - Income: AddIncomeDialog, EditIncomeDialog
  - Debt: AddDebtDialog, AddPaymentDialog
  - Mortgage: AddMortgagePaymentDialog
  - Presets: Preset editor form
- **FR-009**: Action/confirmation dialogs (e.g., delete confirmations, action menus) MUST remain as centered dialogs — no change to their current behavior.
- **FR-010**: Nested dialogs (e.g., delete confirmation triggered from within a modal) MUST layer correctly on top of the parent modal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 10+ add/edit forms across Transactions, Income, Debt, Mortgage, and Presets pages render as centered modals on desktop viewports.
- **SC-002**: Every modal open and close includes a visible framer-motion animation (no instant appear/disappear).
- **SC-003**: Mobile behavior is unchanged — all forms continue to render as full-screen sheets on viewports below 768px.
- **SC-004**: All existing tests continue to pass after the conversion.
- **SC-005**: No visual glitches or layout shifts during modal open/close animations.
- **SC-006**: Users can complete all existing form workflows (add, edit, cancel) identically to before — only the presentation container changes.

## Assumptions

- The desktop breakpoint is 768px (md), consistent with the existing `useMediaQuery("(max-width: 767px)")` pattern in the app.
- framer-motion v12.23.24 is already installed and available — no new dependency needed.
- The existing `DsSheetHeader` and `DsSheetActions` design system components will be reused or adapted for the modal layout to maintain visual consistency.
- Animation duration of 200–300ms is appropriate; exact timing will be tuned during implementation.
- The modal max-width will match or be similar to the current sheet width (`max-w-sm` / ~384px) to keep form layouts consistent.
