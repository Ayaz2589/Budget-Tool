# Tasks: Desktop Modal with Animated Transitions

**Input**: Design documents from `/specs/023-desktop-modal-animations/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: TDD approach — tests are written first and must fail before implementation.

**Organization**: Tasks grouped by user story. US1 and US2 are combined (both P1, inseparable implementation).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify prerequisites are in place — no new dependencies needed

- [ ] T001 Verify framer-motion is installed and importable by checking `node_modules/framer-motion` exists and `package.json` lists it

**Checkpoint**: framer-motion confirmed available, ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Write TDD tests for the core SheetContent `desktopVariant` prop before any implementation

**⚠️ CRITICAL**: Tests must be written and verified to FAIL before Phase 3 implementation

- [ ] T002 Create test file `test/components/ui/sheet.test.tsx` with tests for SheetContent `desktopVariant` prop: (1) default renders as side sheet (existing behavior), (2) `desktopVariant="modal"` renders with centered modal positioning classes, (3) close button and overlay dismiss still work in modal mode, (4) `role="dialog"` is present in both modes
- [ ] T003 Run `bun test test/components/ui/sheet.test.tsx` and verify all new tests FAIL (implementation not yet done)

**Checkpoint**: Foundation ready — failing tests document expected behavior, implementation can begin

---

## Phase 3: User Stories 1 & 2 - Desktop Modal + Animated Transitions (Priority: P1) 🎯 MVP

**Goal**: SheetContent renders as a centered modal with framer-motion fade+scale animations on desktop when `desktopVariant="modal"` is passed. Mobile behavior unchanged.

**Independent Test**: Open any Sheet with `desktopVariant="modal"` on a desktop viewport — it should appear centered with animation. On mobile, it should remain a full-screen sheet.

### Implementation for User Stories 1 & 2

- [ ] T004 [US1] Add `desktopVariant?: "sheet" | "modal"` prop to SheetContent in `src/components/ui/sheet.tsx` — default value `"sheet"` for backward compatibility
- [ ] T005 [US2] Import `AnimatePresence` and `motion` from `framer-motion` in `src/components/ui/sheet.tsx` and define modal animation variants: open `{ opacity: 0, scale: 0.95 }` → `{ opacity: 1, scale: 1 }`, close reverse, backdrop fade, 250ms easeOut
- [ ] T006 [US1] Implement desktop modal rendering path in SheetContent (`src/components/ui/sheet.tsx`): when `!isMobile && desktopVariant === "modal"`, render as fixed centered overlay with `max-w-md`, max-height `90vh`, internal scroll, dimmed backdrop — disable Tailwind `animate-in`/`animate-out` classes in this mode
- [ ] T007 [US2] Wrap modal content with `AnimatePresence` + `motion.div` in `src/components/ui/sheet.tsx` for the modal rendering path — backdrop uses separate `motion.div` with fade variant synced to content animation
- [ ] T008 [US1] Add `desktopVariant="modal"` to SheetContent in `src/components/AddTransactionDialog.tsx` as first consumer proof — verify it renders as centered modal on desktop, full-screen sheet on mobile
- [ ] T009 Run `bun test test/components/ui/sheet.test.tsx` and verify all tests now PASS
- [ ] T010 Run `bun test` to verify all existing tests (569+) still pass — no regressions

**Checkpoint**: US1+US2 complete. AddTransactionDialog renders as animated centered modal on desktop. All tests green.

---

## Phase 4: User Story 3 - Consistent Modal Design Across All Pages (Priority: P2)

**Goal**: Every add/edit/action form across Transactions, Income, Debt, Mortgage, and Presets pages uses `desktopVariant="modal"` for consistent desktop modal presentation.

**Independent Test**: Open add/edit forms on each of the 5 pages on desktop — all should appear as identical centered modals with the same animation.

### Tests for User Story 3

- [ ] T011 [US3] Run existing tests for each page after conversion to verify no regressions: `bun test test/components/AddTransactionDialog.test.tsx test/components/EditTransactionDialog.test.tsx test/pages/transactions/ test/pages/income/ test/pages/debt/ test/pages/mortgage/ test/pages/presets/`

### Implementation for User Story 3 — Transactions

- [ ] T012 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/transactions/EditTransactionDialog.tsx`
- [ ] T013 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/transactions/EditTransferDialog.tsx`
- [ ] T014 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/transactions/FiltersAndActionsDialog.tsx`
- [ ] T015 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/transactions/ExpenseActionsDialog.tsx`
- [ ] T016 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/transactions/TransferActionsDialog.tsx`

### Implementation for User Story 3 — Income

- [ ] T017 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/income/AddIncomeDialog.tsx`
- [ ] T018 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/income/EditIncomeDialog.tsx`
- [ ] T019 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/income/IncomeActionsDialog.tsx`

### Implementation for User Story 3 — Debt

- [ ] T020 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/debt/AddDebtDialog.tsx`
- [ ] T021 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/debt/DebtActionsDialog.tsx`

### Implementation for User Story 3 — Mortgage

- [ ] T022 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/mortgage/AddMortgagePaymentDialog.tsx`
- [ ] T023 [P] [US3] Add `desktopVariant="modal"` to SheetContent in `src/pages/mortgage/MortgagePaymentActionsDialog.tsx`

### Implementation for User Story 3 — Presets

- [ ] T024 [P] [US3] Add `desktopVariant="modal"` to both SheetContent usages (preset editor + preset actions) in `src/pages/presets/PresetsPage.tsx`

### Verification

- [ ] T025 [US3] Run full test suite `bun test` and verify all tests pass after all consumer conversions
- [ ] T026 [US3] Run `bun run build` to verify TypeScript compilation and production build succeed

**Checkpoint**: All 15 Sheet usages across 14 files now use `desktopVariant="modal"`. All pages consistent.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [ ] T027 Verify DashboardFilters (`src/pages/dashboard/DashboardFilters.tsx`) and DsWidgetCatalog (`src/components/ds/DsWidgetCatalog.tsx`) still render as side sheets on desktop (no `desktopVariant` added — they should be unchanged)
- [ ] T028 Run `bun run lint` to verify no lint errors introduced
- [ ] T029 Manual verification checklist: (1) desktop modal centered with backdrop, (2) open/close animations smooth, (3) mobile full-screen sheet preserved, (4) Escape/Cancel/X/backdrop-click all close with animation, (5) long form scrolls internally, (6) nested dialogs layer correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — immediate
- **Foundational (Phase 2)**: Depends on Phase 1 — writes failing tests
- **US1+US2 (Phase 3)**: Depends on Phase 2 — implements core SheetContent change
- **US3 (Phase 4)**: Depends on Phase 3 — applies prop to all consumers
- **Polish (Phase 5)**: Depends on Phase 4 — final verification

### User Story Dependencies

- **US1+US2 (P1)**: Foundational phase must complete first. Delivers the core SheetContent `desktopVariant` mechanism + animation.
- **US3 (P2)**: Depends on US1+US2 completion (the `desktopVariant` prop must exist). Then all consumer updates are independent of each other.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Core SheetContent change before any consumer updates
- Verify tests pass after each implementation step

### Parallel Opportunities

- **Phase 4 (US3)**: All consumer file updates (T012–T024) are marked [P] — they modify different files with no dependencies on each other. All 13 tasks can execute in parallel.

---

## Parallel Example: User Story 3

```bash
# All consumer conversions can run in parallel (different files):
Task: "Add desktopVariant='modal' to EditTransactionDialog.tsx"
Task: "Add desktopVariant='modal' to EditTransferDialog.tsx"
Task: "Add desktopVariant='modal' to FiltersAndActionsDialog.tsx"
Task: "Add desktopVariant='modal' to ExpenseActionsDialog.tsx"
Task: "Add desktopVariant='modal' to AddIncomeDialog.tsx"
Task: "Add desktopVariant='modal' to EditIncomeDialog.tsx"
# ... (all 13 tasks simultaneously)
```

---

## Implementation Strategy

### MVP First (User Stories 1+2 Only)

1. Complete Phase 1: Setup (verify framer-motion)
2. Complete Phase 2: Write failing TDD tests
3. Complete Phase 3: Implement SheetContent + first consumer proof
4. **STOP and VALIDATE**: AddTransactionDialog works as centered modal on desktop
5. All existing tests pass — deploy/demo ready

### Incremental Delivery

1. Phase 1+2 → Foundation + failing tests ready
2. Phase 3 (US1+US2) → Core modal + animation working on one form → MVP!
3. Phase 4 (US3) → All forms converted → Full feature complete
4. Phase 5 → Polish and final verification

---

## Notes

- [P] tasks = different files, no dependencies — safe to parallelize
- [Story] label maps task to specific user story for traceability
- TDD enforced: tests written first (Phase 2), must fail, then implementation makes them pass (Phase 3)
- Each consumer update (Phase 4) is a one-line prop addition — low risk, high parallelism
- Commit after each phase checkpoint for safe incremental delivery
- `DashboardFilters` and `DsWidgetCatalog` are intentionally NOT converted (they remain side sheets)
