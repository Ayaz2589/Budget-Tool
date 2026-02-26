# Tasks: Desktop Modal Layout Optimization

**Input**: Design documents from `/specs/024-desktop-modal-layouts/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: TDD approach — tests are written first and must fail before implementation.

**Organization**: Tasks grouped by user story. US1 is the MVP foundation. US2 depends on US1 wide-tier modals being in place. US3 is polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites — no new dependencies needed

- [x] T001 Verify Tailwind `max-w-md`, `max-w-xl`, `max-w-2xl` classes are available by checking they are standard Tailwind v4 utilities (no custom config needed)

**Checkpoint**: Tailwind width utilities confirmed, ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Write TDD tests for the new `desktopModalSize` prop before any implementation

**⚠️ CRITICAL**: Tests must be written and verified to FAIL before Phase 3 implementation

- [x] T002 Add tests to `test/components/ui/sheet.test.tsx` for SheetContent `desktopModalSize` prop: (1) default renders with `max-w-md` when `desktopVariant="modal"`, (2) `desktopModalSize="standard"` renders with `max-w-xl`, (3) `desktopModalSize="wide"` renders with `max-w-2xl`, (4) prop is ignored on mobile, (5) prop is ignored when `desktopVariant="sheet"`
- [x] T003 Run `bun test test/components/ui/sheet.test.tsx` and verify all new tests FAIL (implementation not yet done)

**Checkpoint**: Foundation ready — failing tests document expected behavior, implementation can begin

---

## Phase 3: User Story 1 - Appropriate Modal Widths Per Form Complexity (Priority: P1) 🎯 MVP

**Goal**: Each modal uses a width tier (compact/standard/wide) appropriate to its content complexity. Mobile unchanged.

**Independent Test**: Open modals from each tier on desktop — compact (Expense Actions), standard (Add Income), wide (Add Transaction) — and verify different widths. On mobile, all should remain full-screen sheets.

### Implementation for User Story 1

- [x] T004 [US1] Add `desktopModalSize?: "compact" | "standard" | "wide"` prop to SheetContent in `src/components/ui/sheet.tsx` — default `"compact"`, map to `max-w-md`/`max-w-xl`/`max-w-2xl` in the desktop modal rendering path
- [x] T005 [US1] Run `bun test test/components/ui/sheet.test.tsx` and verify all desktopModalSize tests now PASS

### Assign Width Tiers to Consumers

- [x] T006 [US1] Add `desktopModalSize="wide"` to SheetContent in `src/components/AddTransactionDialog.tsx`
- [x] T007 [P] [US1] Add `desktopModalSize="wide"` to SheetContent in `src/pages/transactions/EditTransactionDialog.tsx`
- [x] T008 [P] [US1] Add `desktopModalSize="wide"` to SheetContent in `src/pages/transactions/FiltersAndActionsDialog.tsx`
- [x] T009 [P] [US1] Add `desktopModalSize="standard"` to SheetContent in `src/pages/transactions/EditTransferDialog.tsx`
- [x] T010 [P] [US1] Add `desktopModalSize="standard"` to SheetContent in `src/pages/income/AddIncomeDialog.tsx`
- [x] T011 [P] [US1] Add `desktopModalSize="standard"` to SheetContent in `src/pages/income/EditIncomeDialog.tsx`
- [x] T012 [P] [US1] Add `desktopModalSize="standard"` to SheetContent in `src/pages/debt/AddDebtDialog.tsx`
- [x] T013 [P] [US1] Add `desktopModalSize="standard"` to SheetContent in `src/pages/mortgage/AddMortgagePaymentDialog.tsx`
- [x] T014 [P] [US1] Add `desktopModalSize="standard"` to the preset editor SheetContent (first usage) in `src/pages/presets/PresetsPage.tsx` — preset actions SheetContent (second usage) stays compact (default)

### Verification

- [x] T015 [US1] Run `bun test` to verify all tests pass — no regressions
- [x] T016 [US1] Run `bun run build` to verify TypeScript compilation succeeds

**Checkpoint**: US1 complete. All 15 modals use appropriate width tiers. Compact dialogs unchanged (default). All tests green.

---

## Phase 4: User Story 2 - Multi-Column Layouts for Complex Forms (Priority: P2)

**Goal**: Complex forms (wide tier) use two-column grid layouts on desktop to group related fields logically and reduce scrolling. Standard-tier EditTransferDialog gets 2-column pairing for from/to owners.

**Independent Test**: Open Edit Transaction on desktop — date and amount should be side by side, source and category side by side, description full-width. Resize below 768px — everything collapses to single column.

### Implementation for User Story 2

- [x] T017 [US2] Update form field grid in `src/pages/transactions/EditTransactionDialog.tsx`: change `grid gap-4` wrapper to `grid grid-cols-1 md:grid-cols-2 gap-4`, add `md:col-span-2` to description field, and ensure owner+split section spans full width
- [x] T018 [US2] Update filter field grid in `src/pages/transactions/FiltersAndActionsDialog.tsx`: change `grid grid-cols-1 gap-3` to `grid grid-cols-1 md:grid-cols-2 gap-3`, add `md:col-span-2` to search description field and "include transfers" checkbox
- [x] T019 [US2] Update field grid in `src/components/add-transaction/TransactionFormRow.tsx`: change `grid grid-cols-1 gap-2` to `grid grid-cols-1 md:grid-cols-2 gap-2`, add `md:col-span-2` to description field, ensure type selector and preset selector span full width
- [x] T020 [US2] Update field grid in `src/pages/transactions/EditTransferDialog.tsx`: change `grid gap-4` to `grid grid-cols-1 md:grid-cols-2 gap-4`, pair date+amount and from+to owners on same rows, add `md:col-span-2` to transfer note and validation message

### Verification

- [x] T021 [US2] Run `bun test` to verify all tests pass after layout changes
- [x] T022 [US2] Run `bun run build` to verify TypeScript compilation succeeds

**Checkpoint**: US2 complete. Complex forms use multi-column grids on desktop. All fields collapse to single column on mobile.

---

## Phase 5: User Story 3 - Consistent Visual Polish (Priority: P3)

**Goal**: Consistent internal spacing and visual rhythm across all modals. Standard/wide tiers use slightly wider padding for breathing room.

**Independent Test**: Open modals from Transactions, Income, and Debt pages on desktop — padding, gap, and header/footer alignment should be visually consistent within each tier.

### Implementation for User Story 3

- [x] T023 [P] [US3] Update form content padding in `src/pages/transactions/EditTransactionDialog.tsx`: adjust container from `px-4` to `px-5` for wider modal breathing room
- [x] T024 [P] [US3] Update form content padding in `src/pages/transactions/FiltersAndActionsDialog.tsx`: adjust container from `px-4` to `px-5`
- [x] T025 [P] [US3] Update form content padding in `src/pages/transactions/EditTransferDialog.tsx`: adjust container from `px-4` to `px-5`
- [x] T026 [P] [US3] Update form content padding in `src/pages/income/AddIncomeDialog.tsx`: verify consistent spacing with other standard-tier modals
- [x] T027 [P] [US3] Update form content padding in `src/pages/income/EditIncomeDialog.tsx`: verify consistent spacing with other standard-tier modals
- [x] T028 [P] [US3] Update form content padding in `src/pages/debt/AddDebtDialog.tsx`: verify consistent spacing with other standard-tier modals
- [x] T029 [P] [US3] Update form content padding in `src/pages/mortgage/AddMortgagePaymentDialog.tsx`: verify consistent spacing with other standard-tier modals

### Verification

- [x] T030 [US3] Run `bun test` to verify all tests pass after spacing adjustments
- [x] T031 [US3] Run `bun run build` to verify TypeScript compilation and production build succeed

**Checkpoint**: US3 complete. All modals have consistent spacing within their tier. Visual rhythm is uniform.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T032 Verify action dialogs (ExpenseActionsDialog, TransferActionsDialog, IncomeActionsDialog, DebtActionsDialog, MortgagePaymentActionsDialog, Preset Actions in PresetsPage.tsx) still render at compact width on desktop (no `desktopModalSize` added — default)
- [x] T033 Verify DashboardFilters (`src/pages/dashboard/DashboardFilters.tsx`) and DsWidgetCatalog (`src/components/ds/DsWidgetCatalog.tsx`) still render as side sheets on desktop (no `desktopVariant` added)
- [x] T034 Run `bun run lint` to verify no lint errors introduced
- [x] T035 Manual verification checklist: (1) wide modal centered with 672px width, (2) standard modal centered with 576px width, (3) compact modal centered with 448px width, (4) multi-column fields on desktop for complex forms, (5) single-column on mobile for all forms, (6) open/close animations smooth at all sizes, (7) long forms scroll internally, (8) nested dialogs layer correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — immediate
- **Foundational (Phase 2)**: Depends on Phase 1 — writes failing tests
- **US1 (Phase 3)**: Depends on Phase 2 — implements size prop + assigns tiers
- **US2 (Phase 4)**: Depends on Phase 3 — needs wide-tier modals for multi-column space
- **US3 (Phase 5)**: Can start after Phase 3 — spacing adjustments are independent of layout changes
- **Polish (Phase 6)**: Depends on Phases 4 and 5 — final verification

### User Story Dependencies

- **US1 (P1)**: Foundational phase must complete first. Delivers the core `desktopModalSize` mechanism.
- **US2 (P2)**: Depends on US1 (wide modals must exist for multi-column layouts to have space). Form layout changes are independent of each other.
- **US3 (P3)**: Depends on US1 (size tiers must exist). Can run in parallel with US2.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Core SheetContent change before consumer updates
- Verify tests pass after each implementation step

### Parallel Opportunities

- **Phase 3 (US1)**: Consumer tier assignments T006–T014 are marked [P] — they modify different files
- **Phase 4 (US2)**: Layout changes T017–T020 modify different files but are not marked [P] because each requires careful field-by-field layout decisions
- **Phase 5 (US3)**: All spacing tasks T023–T029 are marked [P] — they modify different files
- **US2 and US3 can run in parallel** after US1 completes

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify Tailwind utilities)
2. Complete Phase 2: Write failing TDD tests
3. Complete Phase 3: Implement SheetContent size prop + assign tiers
4. **STOP and VALIDATE**: All modals at correct widths on desktop
5. All existing tests pass — deploy/demo ready

### Incremental Delivery

1. Phase 1+2 → Foundation + failing tests ready
2. Phase 3 (US1) → Width tiers working on all modals → MVP!
3. Phase 4 (US2) → Multi-column layouts for complex forms → Full layout optimization
4. Phase 5 (US3) → Consistent spacing polish → Feature complete
5. Phase 6 → Final verification

---

## Notes

- [P] tasks = different files, no dependencies — safe to parallelize
- [Story] label maps task to specific user story for traceability
- TDD enforced: tests written first (Phase 2), must fail, then implementation makes them pass (Phase 3)
- Compact-tier dialogs (6 action dialogs) need ZERO code changes — compact is the default
- Only 9 consumer files need `desktopModalSize` prop updates (standard and wide tiers)
- Only 4 form files need multi-column layout changes (US2)
- Commit after each phase checkpoint for safe incremental delivery
