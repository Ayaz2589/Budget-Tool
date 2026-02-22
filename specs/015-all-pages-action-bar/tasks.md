# Tasks: All Pages Action Bar

**Input**: Design documents from `/specs/015-all-pages-action-bar/`

## Phase 1: User Story 1 — Standard Pages (Priority: P1)

- [x] T001 [P] [US1] Pass `mobileOnly={false}` to DsActionBar and remove desktop header button in src/pages/income/IncomePage.tsx
- [x] T002 [P] [US1] Pass `mobileOnly={false}` to DsActionBar and remove desktop header button in src/pages/debt/DebtPage.tsx
- [x] T003 [P] [US1] Pass `mobileOnly={false}` to DsActionBar and remove desktop header button in src/pages/mortgage/MortgagePage.tsx
- [x] T004 [P] [US1] Pass `mobileOnly={false}` to DsActionBar and remove desktop header button in src/pages/presets/PresetsPage.tsx

## Phase 2: User Story 2 — Transactions Page (Priority: P2)

- [x] T005 [US2] Pass `mobileOnly={false}` to DsActionBar and remove TransactionsToolbar from header in src/pages/transactions/TransactionsPage.tsx

## Phase 3: User Story 3 — Import Page (Priority: P3)

- [x] T006 [US3] Pass `mobileOnly={false}` to DsActionBar and remove desktop header button in src/pages/import/ImportPage.tsx

## Phase 4: Polish

- [x] T007 Run `bun run build` to verify TypeScript compilation
- [x] T008 Run `bun test` to verify no test regressions
