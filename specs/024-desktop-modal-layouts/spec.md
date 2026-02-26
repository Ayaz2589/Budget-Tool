# Feature Specification: Desktop Modal Layout Optimization

**Feature Branch**: `024-desktop-modal-layouts`
**Created**: 2026-02-26
**Status**: Draft
**Input**: User description: "Update desktop modals to be wider with UX-optimized layouts per page"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Appropriate Modal Widths Per Form Complexity (Priority: P1)

When a user opens any add/edit form on desktop, the modal should be sized appropriately for the amount of data being entered. Currently all modals use a single narrow width (448px) regardless of content complexity. Modals should use standard desktop dialog widths — wider for complex multi-field forms and narrower for simple action sheets — so that forms feel spacious and professional rather than cramped.

**Modal width tiers based on content complexity:**

- **Compact** (~448px): Action dialogs that primarily display information with 0–2 editable fields (ExpenseActionsDialog, TransferActionsDialog, IncomeActionsDialog, DebtActionsDialog, MortgagePaymentActionsDialog, Preset Actions)
- **Standard** (~560px): Simple input forms with 3–5 fields in a single column (AddIncomeDialog, EditIncomeDialog, AddDebtDialog, AddMortgagePaymentDialog, EditTransferDialog, Preset Editor)
- **Wide** (~672px): Complex forms with 6+ fields that benefit from multi-column layout or additional breathing room (EditTransactionDialog, FiltersAndActionsDialog, AddTransactionDialog)

**Why this priority**: This is the foundational change — all other layout improvements depend on having the right width established first. Delivers immediate visual improvement across every modal.

**Independent Test**: Open any modal on desktop and verify it uses the appropriate width tier for its content complexity. Compare before/after screenshots to confirm improved spacing.

**Acceptance Scenarios**:

1. **Given** a user on desktop (768px+), **When** they open the Add Transaction form, **Then** the modal appears at the "wide" width with comfortable spacing around all fields
2. **Given** a user on desktop, **When** they open an action dialog (e.g., Expense Actions), **Then** the modal appears at the "compact" width, appropriately sized for its display-heavy content
3. **Given** a user on desktop, **When** they open a simple add form (e.g., Add Income), **Then** the modal appears at the "standard" width with fields that feel properly proportioned
4. **Given** a user on mobile (<768px), **When** they open any form, **Then** the full-screen sheet behavior is completely unchanged regardless of width tier

---

### User Story 2 - Multi-Column Layouts for Complex Forms (Priority: P2)

Complex forms with many fields should use multi-column grid layouts on desktop to reduce vertical scrolling and group related information logically. Users should see related fields side by side (e.g., date and amount, category and owner) rather than a single long vertical stack. This follows UX best practices for form design: group related fields, reduce cognitive load, and minimize scrolling.

**Layout principles per form type:**

- **Add Transaction**: Two-column grid for field pairs (date + amount, source + category, description spanning full width, owner + split controls). Multi-row interface keeps accordion pattern but each row's fields use the grid.
- **Edit Transaction**: Two-column grid with logical field groupings (date + amount on one row, source + category on another, description full-width, owner + split section below)
- **Edit Transfer**: Two-column layout for from/to owners side by side, date + amount paired
- **Filters dialog**: Two-column grid for filter fields, with search spanning full width
- **Simple forms** (Add Income, Add Debt, Add Mortgage Payment, Preset Editor): Remain single-column — their field count does not warrant multi-column layout

**Why this priority**: Multi-column layouts transform the user experience for complex forms by reducing scroll distance and improving scannability. Depends on US1 (wider modals) to have enough horizontal space.

**Independent Test**: Open the Add Transaction and Edit Transaction modals on desktop and verify fields are arranged in a logical two-column grid. Verify that reducing browser width below 768px collapses to the existing mobile layout.

**Acceptance Scenarios**:

1. **Given** a user opens Edit Transaction on desktop, **When** the modal appears, **Then** date and amount fields are on the same row, source and category are on the same row, and description spans full width
2. **Given** a user opens Add Transaction on desktop, **When** they expand a transaction row, **Then** fields within the row use a two-column grid layout
3. **Given** a user opens the Filters dialog on desktop, **When** the modal appears, **Then** filter fields are arranged in a two-column grid with search spanning full width
4. **Given** any multi-column modal on desktop, **When** the user resizes below 768px, **Then** all fields collapse to single-column mobile layout

---

### User Story 3 - Consistent Visual Polish Across All Modals (Priority: P3)

All desktop modals should have consistent internal spacing, padding, and visual rhythm. Headers, form sections, and action footers should be uniformly styled. Action dialogs should have clear visual hierarchy: summary information displayed prominently, editable fields clearly distinguished, and action buttons appropriately weighted (primary vs. destructive).

**Why this priority**: Polish and consistency build on the structural changes from US1 and US2. This is about refinement rather than fundamental layout changes.

**Independent Test**: Open modals from at least 3 different pages (Transactions, Income, Debt) on desktop and verify consistent padding, spacing, and visual treatment. Action dialogs should feel cohesive with add/edit forms.

**Acceptance Scenarios**:

1. **Given** a user opens any add/edit form on desktop, **When** the modal appears, **Then** internal padding and spacing between fields are consistent across all pages
2. **Given** a user opens any action dialog on desktop, **When** the modal appears, **Then** the summary card, editable fields, and action buttons have clear visual hierarchy and consistent styling
3. **Given** a user opens modals across different pages, **When** comparing them visually, **Then** they share the same visual rhythm (padding, gap spacing, header treatment, footer alignment)

---

### Edge Cases

- What happens when a modal's content exceeds the viewport height? The modal must scroll internally with fixed header and footer.
- How do multi-column layouts behave at exactly 768px? At the mobile breakpoint, all layouts collapse to single-column.
- What happens with the Add Transaction multi-row accordion in wide mode? Each expanded row uses the multi-column grid, collapsed rows remain compact summaries.
- How do nested confirmation dialogs (e.g., delete confirmations inside action sheets) interact with wider parent modals? Nested dialogs remain centered and sized independently of parent.
- What happens when a form has very few fields in "standard" width? The modal should still feel well-proportioned with appropriate vertical spacing — it should not feel empty or oversized.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support three modal width tiers on desktop: compact (~448px), standard (~560px), and wide (~672px)
- **FR-002**: Each modal MUST use the width tier appropriate to its content complexity as defined in US1
- **FR-003**: Mobile behavior (<768px) MUST remain completely unchanged — full-screen sheet for all modals regardless of width tier
- **FR-004**: Complex forms (Add Transaction, Edit Transaction, Filters) MUST use multi-column grid layouts on desktop that group related fields logically
- **FR-005**: Simple forms (Add Income, Add Debt, Add Mortgage Payment, Preset Editor) MUST remain single-column layout
- **FR-006**: All modals MUST scroll internally when content exceeds 90% viewport height, with header and action footer remaining visible
- **FR-007**: Multi-column layouts MUST collapse to single-column at the mobile breakpoint
- **FR-008**: Internal padding and spacing MUST be consistent across all modals within the same width tier
- **FR-009**: Action dialogs MUST maintain clear visual hierarchy: read-only summary section, editable fields section, and action buttons section
- **FR-010**: Existing keyboard navigation, focus trapping, and accessibility features MUST be preserved in all layouts

### Assumptions

- The three width tiers (compact/standard/wide) cover all current modal needs. No modal requires full-screen or sidebar-width presentation on desktop.
- Multi-column layouts use a 2-column grid with field spanning where appropriate. No 3+ column layouts are needed.
- The current fade+scale animation works well at all three width tiers without modification.
- "Related fields" grouping follows standard financial form conventions: date pairs with amount, category pairs with owner, description spans full width.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 15 desktop modals use the appropriate width tier — no modal is undersized or oversized for its content
- **SC-002**: Complex forms (Add/Edit Transaction, Filters) require 30% less vertical scrolling on desktop compared to the current single-column layout
- **SC-003**: Users can scan all visible form fields without horizontal scrolling at any supported desktop viewport width (768px+)
- **SC-004**: All existing tests continue to pass without modification — zero regressions
- **SC-005**: Modal open/close animations remain smooth across all width tiers
- **SC-006**: Visual consistency: all modals within the same tier share identical padding, gap, and spacing values
