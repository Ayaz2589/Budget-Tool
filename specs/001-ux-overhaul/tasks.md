# Tasks: UX Overhaul — Reduce Clicks, Surface Financial Data

**Input**: Design documents from `/specs/001-ux-overhaul/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Foundation (Shared Infrastructure)

**Purpose**: Create reusable components and i18n keys that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 [P] Create `DsCreatableSelect` component (Popover + scrollable option list + inline create input) in `src/components/ds/DsCreatableSelect.tsx`
- [ ] T002 [P] Extend `DsEmptyState` with optional `actions?: ReactNode` prop in `src/components/ds/DsEmptyState.tsx`
- [ ] T003 [P] Add ~15 new i18n translation keys to `src/locales/en.json`
- [ ] T004 Export `DsCreatableSelect` from `src/components/ds/index.ts`

**Checkpoint**: Foundation ready — `bun run build` passes, new components importable → **commit**

---

## Phase 2: User Story 1 — Dashboard Quick-Add (Priority: P1) 🎯 MVP

**Goal**: Users can add transactions and income directly from the dashboard without navigating away. Preset templates appear as tappable chips for 2-tap entry.

**Independent Test**: Open dashboard → tap add button → fill form → save → verify transaction appears in transaction list. Create a preset → tap its chip on dashboard → confirm pre-filled form → save.

### Implementation for User Story 1

- [ ] T005 [US1] Add `initialPresetId?: string` prop to `AddTransactionDialogProps` in `src/types/transactions-ui.ts`
- [ ] T006 [US1] Wire `initialPresetId` in `AddTransactionDialog` — auto-apply preset to first row on open in `src/components/AddTransactionDialog.tsx`
- [ ] T007 [US1] Create `DashboardQuickAdd.tsx` preset chip strip (horizontal scroll, category dot + description + amount, trailing "+" chip) in `src/pages/dashboard/DashboardQuickAdd.tsx`
- [ ] T008 [US1] Add `addTransactionOpen` / `addIncomeOpen` / `selectedPresetId` state to `Dashboard.tsx` in `src/pages/dashboard/Dashboard.tsx`
- [ ] T009 [US1] Render `AddTransactionDialog` + `AddIncomeDialog` in Dashboard with state bindings in `src/pages/dashboard/Dashboard.tsx`
- [ ] T010 [US1] Expand mobile `DsActionBar` with 3 FABs (settings, income, expense) in `src/pages/dashboard/Dashboard.tsx`
- [ ] T011 [US1] Add desktop `DsSectionHeader` action buttons ("Add Expense", "Add Income") in `src/pages/dashboard/Dashboard.tsx`
- [ ] T012 [US1] Wire `DashboardQuickAdd` chip tap → open dialog with preset pre-filled in `src/pages/dashboard/Dashboard.tsx`

**Checkpoint**: Dashboard quick-add fully functional — `bun run build` + `bun test` pass → **commit**

---

## Phase 3: User Story 2 — Inline Table Editing (Priority: P1)

**Goal**: Desktop users can change category and owner directly in table cells via inline dropdowns, reducing the edit flow from 3 steps to 2 clicks.

**Independent Test**: Open transactions page at desktop width → click category cell → select different category → verify change persists. Confirm mobile still uses actions sheet.

### Implementation for User Story 2

- [ ] T013 [P] [US2] Add `onUpdateCategory`, `onUpdateOwner`, `expenseCategories`, `ownerOptions` props to `ExpensesByMonthTable` in `src/pages/transactions/ExpensesByMonthTable.tsx`
- [ ] T014 [US2] Replace category/owner table cells with inline `Select` (borderless, transparent bg, hover highlight) + `e.stopPropagation()` in `src/pages/transactions/ExpensesByMonthTable.tsx`
- [ ] T015 [US2] Wire inline-edit callbacks (`onUpdateCategory`, `onUpdateOwner`) from `TransactionsPage.tsx` to `ExpensesByMonthTable` in `src/pages/transactions/TransactionsPage.tsx`
- [ ] T016 [P] [US2] Add `onUpdateCategory`, `onUpdateOwner`, `incomeCategories`, `ownerOptions` props to `IncomeTable` in `src/pages/income/IncomeTable.tsx`
- [ ] T017 [US2] Replace category/owner cells with inline `Select` + `e.stopPropagation()` in `src/pages/income/IncomeTable.tsx`
- [ ] T018 [US2] Wire inline-edit callbacks from `IncomePage.tsx` to `IncomeTable` in `src/pages/income/IncomePage.tsx`

**Checkpoint**: Inline editing works on both expense and income desktop tables — `bun run build` + `bun test` pass → **commit**

---

## Phase 4: User Story 3 — Contextual Add-Missing (Priority: P2)

**Goal**: Users can create new categories and owners inline from any dropdown without leaving the current form. Import dialog supports per-item selection of missing metadata.

**Independent Test**: Open add-transaction form → open category dropdown → type new name → click Add → verify it appears in form and Settings. Import CSV with unknown categories → verify per-item checkboxes in missing metadata dialog.

### Implementation for User Story 3

- [ ] T019 [P] [US3] Replace `Select` with `DsCreatableSelect` for category + owner in `src/components/add-transaction/TransactionFormRow.tsx`
- [ ] T020 [P] [US3] Replace `Select` with `DsCreatableSelect` for category + owner in `src/pages/transactions/EditTransactionDialog.tsx`
- [ ] T021 [P] [US3] Replace `Select` with `DsCreatableSelect` for category + owner in `src/pages/income/AddIncomeDialog.tsx`
- [ ] T022 [P] [US3] Replace `Select` with `DsCreatableSelect` for category + owner in `src/pages/presets/PresetsPage.tsx`
- [ ] T023 [US3] Thread `onCreateExpenseCategory` / `onCreateIncomeCategory` / `onCreateOwner` callbacks from parent components using `useBudget()` setters
- [ ] T024 [US3] Add granular selection state (`Set<string>` per category type) to import reducer in `src/pages/import/useImportState.ts`
- [ ] T025 [US3] Update missing metadata dialog with per-item checkboxes + "Select All" / "Deselect All" + dynamic "Add N selected" button in `src/pages/import/ImportPage.tsx`

**Checkpoint**: Creatable selects work in all forms, granular import selection works — `bun run build` + `bun test` pass → **commit**

---

## Phase 5: User Story 4 — Smarter Empty States (Priority: P2)

**Goal**: Empty pages show contextual guidance text and action buttons that lead to the primary creation flow, reducing time-to-first-value for new users.

**Independent Test**: Clear all data → navigate to each page (Transactions, Income, Presets, Debt) → verify guidance text and action buttons → click buttons and verify they open the correct flow.

### Implementation for User Story 4

- [ ] T026 [P] [US4] Update `TransactionsPage` empty state with "Add Transaction" + "Import CSV" buttons in `src/pages/transactions/TransactionsPage.tsx`
- [ ] T027 [P] [US4] Update `IncomePage` empty state with "Add Income" button in `src/pages/income/IncomePage.tsx`
- [ ] T028 [P] [US4] Update `PresetsPage` empty state (2 variants: no categories → "Go to Settings", no presets → "Add Preset") in `src/pages/presets/PresetsPage.tsx`
- [ ] T029 [P] [US4] Update `DebtPage` empty state with "Add Debt" button in `src/pages/debt/DebtPage.tsx`

**Checkpoint**: All empty states show guidance + action buttons — `bun run build` + `bun test` pass → **commit**

---

## Phase 6: Polish & Verification

**Purpose**: Final verification across all user stories

- [ ] T030 Run `bun run build` — verify no TypeScript errors
- [ ] T031 Run `bun test` — verify all tests pass (537+)
- [ ] T032 Visual QA: mobile dashboard FABs, desktop header buttons, preset chips, inline editing, creatable selects, empty states, import dialog

**Checkpoint**: All phases verified — final **commit**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundation (Phase 1)**: No dependencies — can start immediately. BLOCKS all user stories.
- **US1 — Dashboard Quick-Add (Phase 2)**: Depends on Phase 1 completion
- **US2 — Inline Editing (Phase 3)**: Depends on Phase 1 completion. Independent of Phase 2.
- **US3 — Contextual Add-Missing (Phase 4)**: Depends on Phase 1 (`DsCreatableSelect`). Independent of Phases 2–3.
- **US4 — Smarter Empty States (Phase 5)**: Depends on Phase 1 (`DsEmptyState` actions prop). Independent of Phases 2–4.
- **Polish (Phase 6)**: Depends on all previous phases

### Within Each User Story

- Core component changes before wiring/integration
- Parent component changes after child props are defined
- Commit after each phase checkpoint

### Parallel Opportunities

- T001, T002, T003 can all run in parallel (different files)
- T013 + T016 can run in parallel (different table components)
- T019, T020, T021, T022 can all run in parallel (different form files)
- T026, T027, T028, T029 can all run in parallel (different page files)
- After Phase 1, US1–US4 phases could theoretically run in parallel (no cross-dependencies)

---

## Implementation Strategy

### Sequential Delivery (Recommended)

1. Complete Phase 1: Foundation → **commit**
2. Complete Phase 2: US1 Dashboard Quick-Add → **commit**
3. Complete Phase 3: US2 Inline Editing → **commit**
4. Complete Phase 4: US3 Contextual Add-Missing → **commit**
5. Complete Phase 5: US4 Smarter Empty States → **commit**
6. Complete Phase 6: Polish → **commit**

Each phase delivers incremental value and leaves the app in a working state.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each phase checkpoint — app must build and tests must pass at every gate
- No new context providers needed — all state changes use existing `useBudget()` setters
- `DsCreatableSelect` uses `Popover` (not Radix `Select`) because Radix Select can't embed inputs
- Inline table editing is desktop-only — mobile retains existing actions sheet pattern
