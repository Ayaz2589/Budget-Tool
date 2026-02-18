# Tasks: Generic Sheets Database Library

**Input**: Design documents from `/specs/003-generic-sheets-db/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/client-api.ts, quickstart.md

**Tests**: Included per Constitution Principle VI — incremental refactoring requires tests first, then code, then `bun test` after each change.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (web)**: `src/`, `test/` at repository root
- Generic library: `src/lib/sheets-db/`
- Ortho domain layer: `src/lib/ortho-sheets/`
- Tests: `test/lib/sheets-db/`, `test/lib/ortho-sheets/`

---

## Phase 1: Setup

**Purpose**: Create directory structure for the new Ortho domain layer module

- [ ] T001 Create directory structure for `src/lib/ortho-sheets/`, `src/lib/ortho-sheets/schemas/`, and `test/lib/ortho-sheets/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the generic library types and extract generic utilities. These MUST be complete before any user story work begins.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Define generic library types (`SheetSchema<T>`, `FormattingRule`, `InferEntity<S>`, `Repository<T>`, `SheetsClientConfig<S>`, `SheetsClient<S>`) in `src/lib/sheets-db/types.ts` — replace all domain-specific types (Expense, Income, etc.) with the generic interfaces from `contracts/client-api.ts`. Domain types will move to ortho-sheets in US2.
- [ ] T003 [P] Extract generic utility functions from `src/lib/sheets-db/normalize.ts` into `src/lib/sheets-db/utils.ts` — move `isValidDate`, `tryRepairDate`, `serialToIsoDate`, `normalizeDate`, `looksLikeIsoDate`, `parseAmount`, `hasIdColumn`, `findMissingHeaders`, `generateId` (from transport.ts). Keep only generic, domain-agnostic functions. Remove the old normalize.ts after extraction.
- [ ] T004 [P] Write tests for generic utility functions in `test/lib/sheets-db/utils.test.ts` — migrate existing generic test cases from `test/lib/sheets-db/normalize.test.ts` (date repair, parseAmount, hasIdColumn, findMissingHeaders, looksLikeIsoDate). Remove domain-specific validation tests (those move to ortho-sheets tests in US2).
- [ ] T005 Update `src/lib/sheets-db/transport.ts` — remove `generateId` (moved to utils.ts). Keep all other transport functions unchanged. Update internal imports if any reference normalize.ts.

**Checkpoint**: Generic types defined, utility functions extracted, transport updated. Run `bun test test/lib/sheets-db/` to verify.

---

## Phase 3: User Story 1 — Generic Schema Definition and Row Mapping (Priority: P1) MVP

**Goal**: The library accepts `SheetSchema<T>` definitions and returns typed `Repository<T>` instances. Zero domain knowledge required.

**Independent Test**: Define a "Contacts" schema with name/email/phone columns, create a client, write records, read them back, verify round-trip — without any library code changes.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US1] Write generic client factory tests in `test/lib/sheets-db/client.test.ts` — replace existing domain-specific tests with generic schema tests: create client with a Contacts schema, verify `repo("contacts")` returns a Repository with readAll/writeAll/append methods, verify schema validation rejects empty sheetName/headers/duplicate sheet names, verify `extractSpreadsheetId` still works.
- [ ] T007 [P] [US1] Write generic repository tests in `test/lib/sheets-db/client.test.ts` — test readAll calls parseRow on each sheet row, test writeAll calls toRow + clears + writes, test append throws when appendSupported is false, test parseRow returning null skips the row, test toRow mapper error is wrapped in VALIDATION_ERROR with row index.

### Implementation for User Story 1

- [ ] T008 [US1] Refactor `src/lib/sheets-db/client.ts` — replace the hardcoded domain repository composition with a generic `createSheetsClient<S>(config)` factory. Implement: (1) schema validation at creation time (reject empty sheetName, empty headers, duplicate sheet names), (2) `repo(key)` method that returns a generic `Repository<T>` built from the schema's parseRow/toRow/validate, (3) write mutex (keep existing Promise chain pattern), (4) `ensureSchema()` that creates missing sheets from registered schema sheetNames, (5) stub `batchSync` and `applyFormatting` (implemented in US3/US4). Reads route through `getSheetValues` + `schema.parseRow`. Writes route through `schema.toRow` + `updateSheet` via `withWriteLock`.
- [ ] T009 [US1] Update `src/lib/sheets-db/index.ts` barrel — export `createSheetsClient`, generic types (`SheetSchema`, `FormattingRule`, `Repository`, `SheetsClient`, `SheetsClientConfig`, `InferEntity`), error types (`SheetsDbError`, `isSheetsDbError`, `SheetsDbErrorKind`, `ValidationIssue`), error factories (`validationError`, `schemaError`), utilities (`extractSpreadsheetId`, `generateId`, `isValidDate`, `normalizeDate`, `parseAmount`, `hasIdColumn`, `findMissingHeaders`). Remove all domain-specific type exports (Expense, Income, etc.).

**Checkpoint**: Generic client factory works with any schema. `bun test test/lib/sheets-db/client.test.ts` passes with non-Ortho schemas.

---

## Phase 4: User Story 2 — Ortho Domain Layer Migration (Priority: P1)

**Goal**: All Ortho-specific domain logic moves out of `sheets-db/` into `ortho-sheets/`. Existing sync behavior preserved with zero user-facing changes.

**Independent Test**: Run `bun test` — all 646+ tests pass. Grep `src/lib/sheets-db/` for domain terms — zero matches.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US2] Write Ortho schema round-trip tests in `test/lib/ortho-sheets/schemas.test.ts` — for each entity (expense, mortgage, income, debt, debtPayment, ownerTransfer, preset, totals, dataBlob): create test data, call `schema.toRow()`, then `schema.parseRow()` on the result, verify entity fields are preserved. Port existing round-trip assertions from `test/lib/sheets-db/expenses.test.ts`, `income.test.ts`, `debts.test.ts`, `transfers.test.ts`.
- [ ] T011 [P] [US2] Write Ortho domain validation tests in `test/lib/ortho-sheets/normalize.test.ts` — move existing domain validation tests from `test/lib/sheets-db/normalize.test.ts`: validateExpense, validateIncome, validateDebt, validateDebtPayment, validateOwnerTransfer, validatePresetTransaction, validateExpenseSource, normalizeCategoryFromSheet, parseOwner.

### Implementation for User Story 2

- [ ] T012 [US2] Create `src/lib/ortho-sheets/types.ts` — move all domain entity types from `src/lib/sheets-db/types.ts`: Expense, Income, Debt, DebtPayment, OwnerTransfer, PresetTransaction, ExpenseSource, ExpenseAllocation, MonthTotals, SheetIds, SyncPayload, ALL_EXPENSE_SOURCES. No field changes.
- [ ] T013 [US2] Create `src/lib/ortho-sheets/normalize.ts` — move domain-specific functions from `src/lib/sheets-db/normalize.ts`: normalizeCategoryFromSheet, parseOwner, validateExpenseSource, validateExpense, validateIncome, validateDebt, validateDebtPayment, validateOwnerTransfer, validatePresetTransaction. Import generic utilities (normalizeDate, parseAmount, etc.) from `@/lib/sheets-db`.
- [ ] T014 [P] [US2] Create `src/lib/ortho-sheets/schemas/expenses.ts` — define `expenseSchema: SheetSchema<Expense>` and `mortgageSchema: SheetSchema<Expense>` using the generic interface. Move parsing logic from `src/lib/sheets-db/expenses.ts` into `parseRow`, serialization into `toRow`, validation into `validate`. Import normalize helpers from `../normalize`.
- [ ] T015 [P] [US2] Create `src/lib/ortho-sheets/schemas/income.ts` — define `incomeSchema: SheetSchema<Income>`. Move parsing logic from `src/lib/sheets-db/income.ts`.
- [ ] T016 [P] [US2] Create `src/lib/ortho-sheets/schemas/debts.ts` — define `debtSchema: SheetSchema<Debt>` and `debtPaymentSchema: SheetSchema<DebtPayment>`. Move parsing logic from `src/lib/sheets-db/debts.ts`.
- [ ] T017 [P] [US2] Create `src/lib/ortho-sheets/schemas/transfers.ts` — define `ownerTransferSchema: SheetSchema<OwnerTransfer>` and `presetSchema: SheetSchema<PresetTransaction>`. Move parsing logic from `src/lib/sheets-db/transfers.ts`.
- [ ] T018 [P] [US2] Create `src/lib/ortho-sheets/schemas/totals.ts` — define `totalsSchema: SheetSchema<MonthTotals>`. Move build logic from `src/lib/sheets-db/totals.ts`. This is write-only (parseRow returns null or is unused).
- [ ] T019 [P] [US2] Create `src/lib/ortho-sheets/schemas/data-blob.ts` — define `dataBlobSchema: SheetSchema<string>`. Move logic from `src/lib/sheets-db/data-blob.ts`. Single-cell read/write.
- [ ] T020 [US2] Create `src/lib/ortho-sheets/schemas/index.ts` — export `ORTHO_SCHEMAS` constant aggregating all schemas: `{ expenses: expenseSchema, mortgage: mortgageSchema, income: incomeSchema, debts: debtSchema, debtPayments: debtPaymentSchema, ownerTransfers: ownerTransferSchema, presets: presetSchema, totals: totalsSchema, dataBlob: dataBlobSchema }`.
- [ ] T021 [US2] Create `src/lib/ortho-sheets/index.ts` — export `createOrthoSheetsClient(config)` factory that wraps `createSheetsClient` with `ORTHO_SCHEMAS`. Re-export domain types, validators, and schema constants.
- [ ] T022 [US2] Update `src/context/SyncContext.tsx` — replace `import { createSheetsClient, isSheetsDbError } from "@/lib/sheets-db"` with `import { createOrthoSheetsClient } from "@/lib/ortho-sheets"` and `import { isSheetsDbError } from "@/lib/sheets-db"`. Update `runSync` and `pullFromSheet` to use `createOrthoSheetsClient` and `db.repo("expenses").readAll()` pattern.
- [ ] T023 [US2] Update `src/lib/googleSheets.ts` barrel — re-export from `./ortho-sheets` instead of `./sheets-db` for domain-specific types. Keep `extractSpreadsheetId` and `isSheetsDbError` from `./sheets-db`.
- [ ] T024 [US2] Remove old domain files from `src/lib/sheets-db/` — delete `expenses.ts`, `income.ts`, `debts.ts`, `transfers.ts`, `totals.ts`, `data-blob.ts`, `formatting.ts`, `schema.ts`, `normalize.ts`. These are now in ortho-sheets.
- [ ] T025 [US2] Remove old domain test files — delete `test/lib/sheets-db/expenses.test.ts`, `income.test.ts`, `debts.test.ts`, `transfers.test.ts`, `sync.test.ts` (domain-specific tests). Keep `errors.test.ts` and `utils.test.ts`. Update or remove `test/lib/sheets-db/normalize.test.ts` (domain tests moved to ortho-sheets).

**Checkpoint**: Zero domain references in `src/lib/sheets-db/`. All Ortho domain logic in `src/lib/ortho-sheets/`. Run `bun test` — all tests pass.

---

## Phase 5: User Story 3 — Generic Batch Operations (Priority: P2)

**Goal**: `batchSync` iterates registered schemas generically. `ensureSchema` creates sheets from schema definitions. No domain knowledge required.

**Independent Test**: Define 3 unrelated schemas, call `batchSync` with test data for all 3, verify 2 API calls (batchClear + batchUpdate) with correct ranges and row data.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T026 [P] [US3] Write generic batch sync tests in `test/lib/sheets-db/sync.test.ts` — test batchSync with multiple schemas (clear all ranges + write all data), test empty payload for one schema (sheet cleared, no data), test batchSync error includes sheet name context, test ensureSchema creates missing sheets from schema.sheetName list. Use non-Ortho schemas (Contacts, Orders, etc.).
- [ ] T027 [P] [US3] Write concurrency test in `test/lib/sheets-db/client.test.ts` — add test: two concurrent `batchSync` calls execute sequentially (second waits for first), not interleaved.

### Implementation for User Story 3

- [ ] T028 [US3] Refactor `src/lib/sheets-db/sync.ts` — replace domain-specific imports (`buildExpensesValues`, `buildIncomeValues`, etc.) with a generic `batchSyncSchemas(ctx, schemas, payload)` function that iterates schemas, calls `schema.toRow` to build row values, prepends `schema.headers`, and constructs batchClear + batchUpdate API calls. Accept `Record<string, unknown[]>` payload keyed by schema key.
- [ ] T029 [US3] Wire `batchSync` and `ensureSchema` into `src/lib/sheets-db/client.ts` — replace stubs with real implementations. `batchSync` delegates to `batchSyncSchemas` via write mutex. `ensureSchema` reads spreadsheet metadata and creates missing sheets from `Object.values(schemas).map(s => s.sheetName)`.
- [ ] T030 [US3] Write Ortho batch sync integration test in `test/lib/ortho-sheets/integration.test.ts` — create `createOrthoSheetsClient`, call `batchSync` with Ortho payload, verify correct API calls match the current behavior (same ranges, same row format).

**Checkpoint**: Generic batch sync works with any schema set. Ortho batch sync produces identical API calls to before. `bun test` passes.

---

## Phase 6: User Story 4 — Pluggable Validation and Formatting (Priority: P3)

**Goal**: Consumers can register optional validators and formatting rules per schema. The library applies them at the correct lifecycle points.

**Independent Test**: Register a validator that rejects missing "email", attempt write, verify VALIDATION_ERROR thrown before any network call.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T031 [P] [US4] Write validation integration tests in `test/lib/sheets-db/client.test.ts` — test: schema with validator rejects invalid record before API call, schema without validator writes without validation, validator error is wrapped in VALIDATION_ERROR.
- [ ] T032 [P] [US4] Write formatting tests in `test/lib/sheets-db/client.test.ts` — test: `applyFormatting` builds repeatCell requests from schema.formatting + schema.headerFormatting, sends single batchUpdate API call, schemas with no formatting are skipped.

### Implementation for User Story 4

- [ ] T033 [US4] Implement generic validation in `src/lib/sheets-db/client.ts` — in the `writeAll` and `append` methods of the generic repository builder, if `schema.validate` is defined, call it for each record before any transport call. Wrap mapper errors (from `parseRow`/`toRow`) in `VALIDATION_ERROR` with row index.
- [ ] T034 [US4] Implement generic `applyFormatting` in `src/lib/sheets-db/client.ts` — iterate all schemas, for each schema with `formatting` or `headerFormatting`, build `repeatCell` request objects (same structure as current `formatting.ts`). Fetch sheet IDs via metadata API, map schema.sheetName → sheetId. Send single `batchUpdate` with all formatting requests.
- [ ] T035 [US4] Create `src/lib/ortho-sheets/formatting.ts` — define Ortho-specific formatting rules as `FormattingRule[]` arrays for each schema (expenses: currency col 2-3, income: currency col 1-2, debts: currency cols, totals: currency + percent col 11, etc.). Attach these to the corresponding schema definitions in `schemas/*.ts`.

**Checkpoint**: Validation and formatting work generically. Ortho formatting produces identical API calls. `bun test` passes.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, CI readiness, cleanup

- [ ] T036 Run financial guard tests (`bun run test:financial`) — all 11 critical test files must pass.
- [ ] T037 Run full test suite (`bun test`) — verify zero failures across all test files.
- [ ] T038 Run TypeScript build (`bun run build`) — verify no type errors with strict mode.
- [ ] T039 Run linter (`bun run lint`) — fix any lint errors in new and modified files.
- [ ] T040 Verify `src/lib/sheets-db/` has zero domain references — grep for "expense", "income", "debt", "mortgage", "budget", "owner", "preset", "totals" (case-insensitive). Must return zero matches (SC-001).
- [ ] T041 Verify `src/lib/sheets-db/` has zero external imports — grep for `from "@/` or `from "../` paths reaching outside sheets-db/. Must return zero matches (SC-005).
- [ ] T042 Count public API exports from `src/lib/sheets-db/index.ts` — must be ≤ 15 symbols (SC-004).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — delivers generic schema MVP
- **US2 (Phase 4)**: Depends on US1 (needs generic factory to define schemas against)
- **US3 (Phase 5)**: Depends on US1 (needs generic client for batch sync)
- **US4 (Phase 6)**: Depends on US1 (needs generic client for validation/formatting hooks)
- **Polish (Phase 7)**: Depends on US2 completion (migration must be done before final validation)

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P1)**: Depends on US1 — needs generic factory to define Ortho schemas against
- **US3 (P2)**: Depends on US1 — needs generic client. Can run in parallel with US2.
- **US4 (P3)**: Depends on US1 — needs generic client. Can run in parallel with US2/US3.

### Within Each User Story

- Tests MUST be written and FAIL before implementation begins
- Types/interfaces before implementations
- Library code before consumer migration
- All implementations before old file removal

### Parallel Opportunities

- **Phase 2**: T003 (utils) and T004 (utils tests) can run in parallel with T005 (transport update)
- **Phase 3 (US1)**: T006 and T007 (tests) run in parallel
- **Phase 4 (US2)**: T010 and T011 (tests) run in parallel. T014-T019 (schema files) all run in parallel
- **Phase 5 (US3)**: T026 and T027 (tests) run in parallel. US3 can run in parallel with US2 after US1 is done
- **Phase 6 (US4)**: T031 and T032 (tests) run in parallel. US4 can run in parallel with US2/US3

---

## Parallel Example: User Story 2

```bash
# Launch all schema implementations in parallel:
Task: "Create expense schema in src/lib/ortho-sheets/schemas/expenses.ts"
Task: "Create income schema in src/lib/ortho-sheets/schemas/income.ts"
Task: "Create debts schema in src/lib/ortho-sheets/schemas/debts.ts"
Task: "Create transfers schema in src/lib/ortho-sheets/schemas/transfers.ts"
Task: "Create totals schema in src/lib/ortho-sheets/schemas/totals.ts"
Task: "Create data-blob schema in src/lib/ortho-sheets/schemas/data-blob.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T005)
3. Complete Phase 3: US1 — generic schema + client factory (T006-T009)
4. **STOP and VALIDATE**: Run `bun test test/lib/sheets-db/` — generic client works with non-Ortho schemas
5. The generic library is functional independently — Ortho still uses old domain modules

### Incremental Delivery

1. Setup + Foundational → Generic library types ready
2. US1 → Generic client factory works → Validate with Contacts schema (MVP!)
3. US2 → Ortho domain extracted → All tests pass with zero behavior changes
4. US3 → Batch sync generalized → Ortho batch sync identical
5. US4 → Validation + formatting pluggable → Ortho formatting identical
6. Polish → CI green, lint clean, zero domain references in sheets-db

### Key Risk: US2 Consumer Migration

T022 (SyncContext update) is the highest-risk task — it changes the import source and client creation pattern for the most complex consumer. Plan extra time and run `bun test` after each function migration within SyncContext.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Constitution Principle VI)
- Run `bun test` after each task or logical group
- Run `bun run test:financial` before and after Phase 4 to ensure financial guard tests remain green
- Stop at any checkpoint to validate story independently
- Existing `src/lib/sheets-db/` domain files are NOT removed until T024 — both modules coexist during development
