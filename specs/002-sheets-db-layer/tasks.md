# Tasks: Google Sheets Database Layer

**Input**: Design documents from `/specs/002-sheets-db-layer/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/client-api.ts, quickstart.md

**Tests**: Included per Constitution Principle VI — incremental refactoring requires tests first, then code, then `bun test` after each change.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (web)**: `src/`, `test/` at repository root
- New module: `src/lib/sheets-db/`
- Tests: `test/lib/sheets-db/`
- Bridge: `src/lib/googleSheets.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and establish the module boundary

- [x] T001 Create directory structure for `src/lib/sheets-db/` and `test/lib/sheets-db/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented. These modules are imported by every repository and the client factory.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Define all entity types (Expense, Income, Debt, DebtPayment, OwnerTransfer, PresetTransaction, ExpenseSource, ExpenseAllocation, MonthTotals, SheetIds, SheetsDbConfig, SyncPayload) in `src/lib/sheets-db/types.ts` — copy from `src/types/core.ts`, `src/types/totals.ts`, `src/types/sheets.ts` and include `ALL_EXPENSE_SOURCES` constant. See `specs/002-sheets-db-layer/data-model.md` for field definitions and validation rules.
- [x] T003 [P] Define SheetsDbError class extending Error with `kind: SheetsDbErrorKind` discriminant, `isSheetsDbError()` type guard, and factory functions (`authError`, `rateLimitError`, `networkError`, `validationError`, `schemaError`, `apiError`) in `src/lib/sheets-db/errors.ts` — see `specs/002-sheets-db-layer/contracts/client-api.ts` for the SheetsDbErrorKind union and SheetsDbError interface.
- [x] T004 [P] Define schema constants (SHEET_NAMES, SHEET_RANGES, SHEET_WRITE_RANGES, SHEET_CLEAR_RANGES, ALL_SHEET_TITLES, header arrays per entity) in `src/lib/sheets-db/schema.ts` — migrate from `src/lib/sheets/constants.ts`.
- [x] T005 Implement transport layer (SHEETS_API constant, `getSheetValues()`, `updateSheet()`, `clearRange()`, `extractSpreadsheetId()`, `generateId()`) in `src/lib/sheets-db/transport.ts` — migrate from `src/lib/sheets/api.ts` but wrap HTTP errors in `SheetsDbError` types (AUTH_ERROR for 401, RATE_LIMIT for 429, NETWORK_ERROR for fetch failures, API_ERROR for other 4xx/5xx). Remove the `tryRepairDate` import — that moves to normalize.ts.
- [x] T006 Implement normalization utilities (`tryRepairDate`, `isValidDate`, `normalizeDate`, `looksLikeIsoDate`, `parseAmount`, `normalizeCategoryFromSheet`, `parseOwner`, `validateExpenseSource`, `hasIdColumn`, `findMissingHeaders`) in `src/lib/sheets-db/normalize.ts` — consolidate from `src/lib/sheets/api.ts` (parsing helpers), `src/lib/sheets/validate.ts` (source/header validation), and `src/lib/dateRepair.ts` (date repair). All must use only internal imports.
- [x] T007 Write foundational tests: error construction and `isSheetsDbError` guard in `test/lib/sheets-db/errors.test.ts`, and normalization functions (date repair, parseAmount, validateExpenseSource, hasIdColumn, normalizeCategoryFromSheet, looksLikeIsoDate) in `test/lib/sheets-db/normalize.test.ts` — port existing tests from `test/lib/sheets/validate.test.ts` and expand.

**Checkpoint**: Foundation ready — all shared modules compile with zero external imports. Run `bun test test/lib/sheets-db/` to verify.

---

## Phase 3: User Story 1 — Reliable Data Persistence (Priority: P1) MVP

**Goal**: Every domain entity can be written to and read from Google Sheets through a clean client interface that hides all storage details.

**Independent Test**: Write a set of records via the client, read them back, and verify data round-trip integrity for all entity types.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Write expense repository tests (readAll, readMortgage, writeAll, writeMortgage, append, buildExpensesValues round-trip) in `test/lib/sheets-db/expenses.test.ts` — mock transport layer, verify row→Expense and Expense→row conversions preserve all fields including optional owner/allocation.
- [x] T009 [P] [US1] Write income repository tests (readAll, writeAll, append, buildIncomeValues round-trip) in `test/lib/sheets-db/income.test.ts` — mock transport, verify all Income fields preserved.
- [x] T010 [P] [US1] Write debts repository tests (readDebts, readDebtPayments, writeDebts, writeDebtPayments, buildDebtsValues, buildDebtPaymentsValues) in `test/lib/sheets-db/debts.test.ts` — mock transport, cover Debt and DebtPayment separately.
- [x] T011 [P] [US1] Write transfers repository tests (readOwnerTransfers, readPresets, writeOwnerTransfers, writePresets, build functions) in `test/lib/sheets-db/transfers.test.ts` — mock transport, cover OwnerTransfer and PresetTransaction separately.

### Implementation for User Story 1

- [x] T012 [P] [US1] Implement expense repository in `src/lib/sheets-db/expenses.ts` — migrate from `src/lib/sheets/expenses.ts`. Functions: `readExpenses(transport, range)`, `readMortgage(transport)`, `writeExpenses(transport, expenses)`, `writeMortgage(transport, expenses)`, `appendExpenses(transport, expenses)`, `buildExpensesValues(expenses)`. Use normalize.ts for date/source/category normalization on read. Use schema.ts for ranges. Import only from within sheets-db/.
- [x] T013 [P] [US1] Implement income repository in `src/lib/sheets-db/income.ts` — migrate from `src/lib/sheets/income.ts`. Functions: `readIncome(transport)`, `writeIncome(transport, income)`, `appendIncome(transport, income)`, `buildIncomeValues(income)`.
- [x] T014 [P] [US1] Implement debts repository in `src/lib/sheets-db/debts.ts` — migrate from `src/lib/sheets/debts.ts`. Functions: `readDebts(transport)`, `readDebtPayments(transport)`, `writeDebts(transport, debts)`, `writeDebtPayments(transport, payments)`, `buildDebtsValues(debts)`, `buildDebtPaymentsValues(payments)`.
- [x] T015 [P] [US1] Implement transfers repository in `src/lib/sheets-db/transfers.ts` — migrate from `src/lib/sheets/transfers.ts`. Functions: `readOwnerTransfers(transport)`, `readPresets(transport)`, `writeOwnerTransfers(transport, transfers)`, `writePresets(transport, presets)`, `buildOwnerTransfersValues(transfers)`, `buildPresetsValues(presets)`.
- [x] T016 [P] [US1] Implement totals repository in `src/lib/sheets-db/totals.ts` — migrate from `src/lib/sheets/totals.ts`. Functions: `writeTotals(transport, months, grandTotal)`, `buildTotalsValues(months, grandTotal)`. Write-only (no read).
- [x] T017 [P] [US1] Implement data blob repository in `src/lib/sheets-db/data-blob.ts` — migrate from `src/lib/sheets/data.ts`. Functions: `readDataBlob(transport)`, `writeDataBlob(transport, blob)`. Blob is an opaque string — no serialization logic.
- [x] T018 [US1] Implement `createSheetsClient(config)` factory in `src/lib/sheets-db/client.ts` — compose all repositories into the `SheetsDbClient` interface from `contracts/client-api.ts`. Create internal transport context from config (token + spreadsheetId). Return plain object with `expenses`, `income`, `debts`, `debtPayments`, `ownerTransfers`, `presets`, `totals`, `dataBlob` repository namespaces plus `extractSpreadsheetId` utility. Stub `batchSync`, `ensureSchema`, `getSheetIds`, `applyFormatting` as not-yet-implemented (they come in US3).
- [x] T019 [US1] Create public API barrel in `src/lib/sheets-db/index.ts` — export `createSheetsClient`, all types from `types.ts`, `SheetsDbError` and `isSheetsDbError` from `errors.ts`, and `extractSpreadsheetId` from `transport.ts`.
- [x] T020 [US1] Write client factory integration test in `test/lib/sheets-db/client.test.ts` — verify createSheetsClient returns object with all repository namespaces, verify extractSpreadsheetId works, verify each repository method exists.

**Checkpoint**: All repositories implemented. `bun test test/lib/sheets-db/` passes. Each entity type round-trips correctly (write → read = identical data).

---

## Phase 4: User Story 2 — Schema Integrity and Validation (Priority: P2)

**Goal**: The data layer validates records on write (rejecting bad data before storage) and normalizes records on read (handling legacy formats, repairing dates, defaulting invalid enums).

**Independent Test**: Pass malformed data (missing IDs, invalid dates, unknown expense sources, empty required fields) to write operations and verify they throw `ValidationError`. Pass legacy-format rows to read operations and verify normalization to current schema.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T021 [P] [US2] Write validation tests in `test/lib/sheets-db/normalize.test.ts` — add test cases for: expense missing id (rejects), expense with negative amount (rejects), expense with invalid date (rejects), income missing amount (rejects), debt with empty name (rejects), debtPayment with empty debtId (rejects), ownerTransfer where fromOwner === toOwner (rejects), valid records pass all checks. Each rejection must throw SheetsDbError with kind "VALIDATION_ERROR".
- [x] T022 [P] [US2] Write legacy format normalization tests in `test/lib/sheets-db/expenses.test.ts` — add test cases for: row without ID column (generates ID), serial date number (converts to ISO), corrupted date string (repairs via tryRepairDate), unknown source "amex-platinum" (falls back to "manual"), "Uncategorized" category (normalizes to empty string), extra columns in row (ignored, forward-compatible).

### Implementation for User Story 2

- [x] T023 [US2] Implement write-side validation functions (`validateExpense`, `validateIncome`, `validateDebt`, `validateDebtPayment`, `validateOwnerTransfer`, `validatePresetTransaction`) in `src/lib/sheets-db/normalize.ts` — each checks required fields per `data-model.md` validation rules and throws `validationError()` from errors.ts with field-level issues array.
- [x] T024 [US2] Integrate validation into all repository write paths — update `writeExpenses`, `writeMortgage`, `appendExpenses` in `expenses.ts`, `writeIncome`, `appendIncome` in `income.ts`, `writeDebts`, `writeDebtPayments` in `debts.ts`, `writeOwnerTransfers`, `writePresets` in `transfers.ts` to call respective validation functions before any transport calls.
- [x] T025 [US2] Implement `ensureSchema()` in `src/lib/sheets-db/client.ts` — fetch spreadsheet metadata, compare existing tabs against `ALL_SHEET_TITLES` from schema.ts, create missing tabs via Sheets API `batchUpdate` with `addSheet` requests. Throw `schemaError()` if creation fails.

**Checkpoint**: Validation rejects bad data, normalization handles legacy formats, ensureSchema creates missing tabs. `bun test test/lib/sheets-db/` passes.

---

## Phase 5: User Story 3 — Batch Sync with Transactional Semantics (Priority: P2)

**Goal**: The full sync operation (push all entity types) executes as a single logical operation with clear success/failure reporting, write serialization, and proper sheet formatting.

**Independent Test**: Call `batchSync()` with a full payload and verify all sheets are written. Simulate a mid-batch failure and verify the error includes actionable details. Attempt two concurrent syncs and verify the second is serialized (not interleaved).

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T026 [P] [US3] Write batch sync tests in `test/lib/sheets-db/sync.test.ts` — test cases: successful batch (all sheets written), failure after clear (error includes context), SyncPayload with empty arrays (writes empty sheets correctly). Mock transport layer.
- [x] T027 [P] [US3] Write concurrency test in `test/lib/sheets-db/client.test.ts` — add test: two concurrent `batchSync()` calls — verify they execute sequentially (second waits for first), not interleaved.

### Implementation for User Story 3

- [x] T028 [US3] Implement batch sync orchestration in `src/lib/sheets-db/sync.ts` — migrate from `src/lib/sheets/sync.ts`. Function: `syncAllSheetsBatch(transport, payload)` — batch clear all ranges via `SHEET_CLEAR_RANGES`, then batch update all sheets using `buildExpensesValues`, `buildIncomeValues`, etc. from domain modules. Wrap errors in `SheetsDbError` types. Use `SHEET_WRITE_RANGES` from schema.ts.
- [x] T029 [US3] Implement write mutex in `src/lib/sheets-db/client.ts` — add simple in-memory lock (Promise chain) that serializes all write operations (`batchSync`, `writeAll`, `append`). Read operations bypass the lock.
- [x] T030 [US3] Implement `getSheetIds()` and `applyFormatting()` in `src/lib/sheets-db/formatting.ts` — migrate from `src/lib/sheets/sync.ts` (getSheetIds) and `src/lib/sheets/formatting.ts` (applySheetsFormatting). Return `SheetIds` from spreadsheet metadata. Apply bold headers, currency column formatting, percent column formatting.
- [x] T031 [US3] Wire `batchSync`, `getSheetIds`, `applyFormatting` into `createSheetsClient` in `src/lib/sheets-db/client.ts` — replace stubs from T018 with real implementations. `batchSync` routes through write mutex.

**Checkpoint**: Batch sync works end-to-end. Concurrent writes are serialized. Formatting is applied. `bun test test/lib/sheets-db/` passes.

---

## Phase 6: User Story 4 — Library-Ready Module Boundary (Priority: P3)

**Goal**: The `src/lib/sheets-db/` directory has zero imports from the host app. The barrel re-export is updated. All consumers migrate. The old `src/lib/sheets/` is removed.

**Independent Test**: Scan all `.ts` files in `src/lib/sheets-db/` for `@/` imports — count must be zero. Run `bun run build` to verify the full app compiles. Run `bun test` to verify all tests pass.

### Implementation for User Story 4

- [x] T032 [US4] Audit `src/lib/sheets-db/` for zero external imports — grep all files for `from "@/` or `from "../` paths reaching outside sheets-db/. Fix any violations found (inline the dependency or restructure).
- [x] T033 [US4] Update `src/lib/googleSheets.ts` barrel to re-export from `./sheets-db` instead of `./sheets` — map existing named exports to their sheets-db equivalents. For functions that changed signature (e.g., now require client instead of token+id), export adapter wrappers that preserve the old call signature during transition.
- [x] T034 [US4] Update `src/context/SyncContext.tsx` to use `createSheetsClient` — replace individual function imports with client creation. Create client in sync effect using token + spreadsheetId. Replace `syncAllSheetsBatch(token, id, payload)` with `client.batchSync(payload)`. Replace `readExpensesFromSheet(token, id, range)` with `client.expenses.readAll()`. Update all other read/write calls similarly. Update error handling to use `isSheetsDbError()` and switch on `error.kind`.
- [x] T035 [P] [US4] Update `src/context/SheetSetupContext.tsx` — replace `import { extractSpreadsheetId } from "@/lib/googleSheets"` with `import { extractSpreadsheetId } from "@/lib/sheets-db"`.
- [x] T036 [P] [US4] Update `src/context/GoogleAuthContext.tsx` — replace `import { extractSpreadsheetId } from "@/lib/googleSheets"` with `import { extractSpreadsheetId } from "@/lib/sheets-db"`.
- [x] T037 [P] [US4] Update `src/pages/settings/SettingsPage.tsx` — replace `import { extractSpreadsheetId } from "@/lib/googleSheets"` with `import { extractSpreadsheetId } from "@/lib/sheets-db"`.
- [x] T038 [US4] Migrate existing tests — update `test/lib/googleSheets.test.ts` to import from `@/lib/sheets-db` and adjust test calls to use client interface where needed. Move relevant tests from `test/lib/sheets/validate.test.ts` to `test/lib/sheets-db/normalize.test.ts`.
- [x] T039 [US4] Remove old `src/lib/sheets/` directory and simplify `src/lib/googleSheets.ts` to a thin re-export barrel from `sheets-db/`.
- [x] T040 [US4] Remove `test/lib/sheets/` directory after confirming all tests migrated.

**Checkpoint**: Zero external imports in sheets-db/. All consumers updated. Old module removed. `bun test` and `bun run build` pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, CI readiness, cleanup

- [x] T041 Run financial guard tests (`bun run test:financial`) — all 11 critical test files must pass. This gates the CI pipeline.
- [x] T042 Run full test suite (`bun test`) — verify zero failures across all test files including migrated and new sheets-db tests.
- [x] T043 Run TypeScript build (`bun run build`) — verify no type errors with strict mode (`noUnusedLocals`, `noUnusedParameters`).
- [x] T044 Run linter (`bun run lint`) — fix any lint errors in new and modified files.
- [x] T045 Verify `src/lib/sheets-db/` compiles with no `@/` imports — final static analysis confirming library extractability (SC-002).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — delivers MVP
- **US2 (Phase 4)**: Depends on Phase 2 + T012-T017 (repository implementations from US1)
- **US3 (Phase 5)**: Depends on Phase 2 + T012-T017 (repository implementations from US1)
- **US4 (Phase 6)**: Depends on US1, US2, and US3 (all module functionality must be complete before migration)
- **Polish (Phase 7)**: Depends on US4 completion

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P2)**: Depends on US1 repository implementations (T012-T017) to integrate validation into write paths
- **US3 (P2)**: Depends on US1 repository implementations (T012-T017) for build functions used in batch sync
- **US4 (P3)**: Depends on US1 + US2 + US3 — all module functionality must exist before consumer migration and old module removal

### Within Each User Story

- Tests MUST be written and FAIL before implementation begins
- Foundation modules (types, errors, schema, transport, normalize) before repositories
- Repositories before client factory
- Client factory before public API barrel
- All implementations before consumer migration

### Parallel Opportunities

- **Phase 2**: T003 (errors) and T004 (schema) can run in parallel (different files, no cross-dependency). T005 (transport) depends on T003 (uses error types). T006 (normalize) depends on T002 (uses entity types).
- **Phase 3**: All repository tests (T008-T011) run in parallel. All repository implementations (T012-T017) run in parallel. Client factory (T018) waits for all repos.
- **Phase 4**: Validation tests (T021) and legacy format tests (T022) run in parallel.
- **Phase 5**: Batch sync tests (T026) and concurrency tests (T027) run in parallel.
- **Phase 6**: Consumer updates T035, T036, T037 run in parallel. T034 (SyncContext) is the largest and runs independently.

---

## Parallel Example: User Story 1

```bash
# Launch all repository tests in parallel:
Task: "Write expense repository tests in test/lib/sheets-db/expenses.test.ts"
Task: "Write income repository tests in test/lib/sheets-db/income.test.ts"
Task: "Write debts repository tests in test/lib/sheets-db/debts.test.ts"
Task: "Write transfers repository tests in test/lib/sheets-db/transfers.test.ts"

# Launch all repository implementations in parallel:
Task: "Implement expense repository in src/lib/sheets-db/expenses.ts"
Task: "Implement income repository in src/lib/sheets-db/income.ts"
Task: "Implement debts repository in src/lib/sheets-db/debts.ts"
Task: "Implement transfers repository in src/lib/sheets-db/transfers.ts"
Task: "Implement totals repository in src/lib/sheets-db/totals.ts"
Task: "Implement data blob repository in src/lib/sheets-db/data-blob.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T007)
3. Complete Phase 3: US1 — all repositories + client factory + barrel (T008-T020)
4. **STOP and VALIDATE**: Run `bun test test/lib/sheets-db/` — all round-trip tests pass
5. The new module works independently alongside the old one — no app breakage

### Incremental Delivery

1. Setup + Foundational → Module skeleton compiles
2. US1 → All entity CRUD works through client → Validate round-trips (MVP!)
3. US2 → Write validation + read normalization → Validate edge cases
4. US3 → Batch sync + concurrency + formatting → Validate full sync flow
5. US4 → Consumer migration + old module removal → Validate zero coupling
6. Polish → CI green, lint clean, build passes

### Key Risk: US4 Consumer Migration

T034 (SyncContext update) is the highest-risk task — it's the largest consumer and touches auto-sync, pull-from-sheet, and rate-limit logic. Plan extra time for this task and run `bun test` after each function migration within SyncContext.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Constitution Principle VI)
- Run `bun test` after each task or logical group
- Run `bun run test:financial` before and after Phase 6 to ensure financial guard tests remain green
- Stop at any checkpoint to validate story independently
- Existing `src/lib/sheets/` is NOT modified until Phase 6 — both modules coexist during development
