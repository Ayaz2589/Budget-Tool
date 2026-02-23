# Tasks: Migrate Google Sync to genjutsu-db

**Input**: Design documents from `/specs/020-sync-genjutsu-db/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install genjutsu-db and create foundational model/client files.

- [X] T001 Install genjutsu-db dependency — run `bun add genjutsu-db`
- [X] T002 Create genjutsu-db model definitions for all 7 domain schemas in `src/lib/sheets/models.ts` — Expense, Mortgage, Income, Debt, DebtPayment, OwnerTransfer, PresetTransaction (see data-model.md for exact field definitions and column mappings)
- [X] T003 Create genjutsu-db client factory in `src/lib/sheets/client.ts` — export `createSheetsClient(spreadsheetId, getToken)` that creates a typed client with all 7 model repositories, and export `SheetsClient` type
- [X] T004 Add model formatting rules to each model in `src/lib/sheets/models.ts` — header formatting (bold, 12pt, left-aligned) and currency formatting (`$#,##0.00`) on amount columns per data-model.md formatting table
- [X] T005 Run `bun run build` — verify TypeScript strict mode passes with new files

**Checkpoint**: Model definitions and client factory compile. No behavior changes yet.

---

## Phase 2: User Story 1 — Push Data to Sheets (Priority: P1) 🎯 MVP

**Goal**: Replace `syncAllSheetsBatch()` and per-domain write functions with `db.batchSync()` in SyncContext.

**Independent Test**: Trigger sync-to-sheets and verify all 9 tabs contain correctly structured data.

- [X] T006 [US1] In `src/context/SyncContext.tsx`, import `createSheetsClient` and `isGenjutsuError` — instantiate the client (or create it lazily) using `spreadsheetId` and a token provider function that returns `accessToken`
- [X] T007 [US1] In `src/context/SyncContext.tsx`, replace the `syncAllSheetsBatch()` call in `runSync()` with `db.batchSync({ expenses, mortgage, income, debts, debtPayments, ownerTransfers, presetTransactions })` — convert app-type arrays to model-compatible records before passing
- [X] T008 [US1] In `src/context/SyncContext.tsx`, keep the Data blob write (`writeDataBlob`) and Totals write (`writeTotalsSheet`) as separate calls after `batchSync()` — these are special cases that don't use models
- [X] T009 [US1] In `src/context/SyncContext.tsx`, replace error handling in `runSync()` catch block — use `isGenjutsuError(err)` with `err.kind` switch: `AUTH_ERROR` → `clearSession()`, `RATE_LIMIT` → use `err.retryAfterMs` for backoff, others → error status with message
- [X] T010 [US1] In `src/context/SyncContext.tsx`, replace `ensureSheetsExist()` call with `db.ensureSchema()` before the batch sync
- [X] T011 [US1] In `src/context/SyncContext.tsx`, replace `applySheetsFormatting()` call with `db.applyFormatting()` after the batch sync
- [X] T012 [US1] Run `bun test` — verify all existing tests pass
- [X] T013 [US1] Run `bun run build` — verify TypeScript strict mode passes

**Checkpoint**: Push-to-sheets works via genjutsu-db. Pull still uses old code. Both paths functional.

---

## Phase 3: User Story 2 — Pull Data from Sheets (Priority: P2)

**Goal**: Replace per-domain `readXxxFromSheet()` functions with `db.repo("x").readAll()` in SyncContext pull logic.

**Independent Test**: Pull from a Google Sheet (with and without V2 blob) and verify records merge correctly.

- [X] T014 [US2] In `src/context/SyncContext.tsx`, replace the per-sheet reads in `pullFromSheet()` fallback path — use `db.repo("expenses").readAll()`, `db.repo("mortgage").readAll()`, `db.repo("income").readAll()`, `db.repo("debts").readAll()`, `db.repo("debtPayments").readAll()`, `db.repo("ownerTransfers").readAll()`, `db.repo("presetTransactions").readAll()` instead of the individual `readXxxFromSheet()` calls
- [X] T015 [US2] Preserve V2 blob fast path — keep the `readDataBlob()` call and blob parsing logic unchanged; only the sheet-by-sheet fallback path changes
- [X] T016 [US2] Preserve deduplication logic — the dedup keys (date|description|amount for expenses/income, ID-based for others) remain the same, operating on the records returned by genjutsu-db `readAll()`
- [X] T017 [US2] In `src/context/SyncContext.tsx`, replace error handling in `pullFromSheet()` catch block — use `isGenjutsuError(err)` with same error mapping as push (T009)
- [X] T018 [US2] Run `bun test` — verify all existing tests pass
- [X] T019 [US2] Run `bun run build` — verify TypeScript strict mode passes

**Checkpoint**: Both push and pull work via genjutsu-db. Old per-domain modules no longer called at runtime.

---

## Phase 4: User Story 3 — Sheet Setup and Schema Management (Priority: P3)

**Goal**: Replace `ensureSheetsExist()` in SheetSetupContext with `db.ensureSchema()`.

**Independent Test**: Create a new Google Sheet and verify all 9 tabs are created with correct headers and formatting.

- [X] T020 [US3] In `src/context/SheetSetupContext.tsx`, import `createSheetsClient` and create/use the genjutsu-db client for sheet setup operations
- [X] T021 [US3] In `src/context/SheetSetupContext.tsx`, if `ensureSheetsExist()` is called during sheet creation or linking, replace with `db.ensureSchema()` followed by `db.applyFormatting()`
- [X] T022 [US3] Run `bun test` — verify all existing tests pass
- [X] T023 [US3] Run `bun run build` — verify TypeScript strict mode passes

**Checkpoint**: Sheet setup uses genjutsu-db. All 3 core operations (push, pull, setup) migrated.

---

## Phase 5: User Story 4 — Eliminate Old HTTP Layer (Priority: P4)

**Goal**: Delete the old per-domain sheet modules and update imports to use genjutsu-db utilities.

**Independent Test**: Build succeeds, all tests pass, no imports reference deleted files.

- [X] T024 [US4] Update all import sites for `generateId` — replace `from "@/lib/sheets/api"` or `from "@/lib/sheets"` with `from "genjutsu-db"` across all files that import it (search codebase for all usage sites)
- [X] T025 [US4] Update all import sites for `parseAmount`, `normalizeDate`, `looksLikeIsoDate`, `isValidDate` — replace old sheet imports with `from "genjutsu-db"`
- [X] T026 [US4] Update all import sites for `extractSpreadsheetId` — replace old sheet import with `from "genjutsu-db"` (used in `src/context/SheetSetupContext.tsx` and potentially elsewhere)
- [X] T027 [US4] Update all import sites for `hasIdColumn`, `findMissingHeaders` — replace old sheet imports with `from "genjutsu-db"`
- [X] T028 [US4] Move `validateExpenseSource()` from `src/lib/sheets/validate.ts` to `src/lib/sheets/models.ts` or a local utility (this function is app-specific, not in genjutsu-db)
- [X] T029 [US4] Delete `src/lib/sheets/api.ts` — all exports now come from genjutsu-db or models.ts
- [X] T030 [US4] Delete `src/lib/sheets/constants.ts` — ranges are generated by defineModel()
- [X] T031 [US4] Delete `src/lib/sheets/expenses.ts` — replaced by Expense/Mortgage model repos
- [X] T032 [US4] Delete `src/lib/sheets/income.ts` — replaced by Income model repo
- [X] T033 [US4] Delete `src/lib/sheets/debts.ts` — replaced by Debt/DebtPayment model repos
- [X] T034 [US4] Delete `src/lib/sheets/transfers.ts` — replaced by OwnerTransfer/Preset model repos
- [X] T035 [US4] Delete `src/lib/sheets/sync.ts` — replaced by db.batchSync()
- [X] T036 [US4] Delete `src/lib/sheets/validate.ts` — utilities moved to genjutsu-db or models.ts
- [X] T037 [US4] Update `src/lib/sheets/index.ts` — re-export only the remaining modules (models, client, data, totals, formatting if kept) and re-export genjutsu-db utilities for backward compat if needed
- [X] T038 [US4] Run `bun test` — verify all existing tests pass
- [X] T039 [US4] Run `bun run build` — verify TypeScript strict mode passes with no stale imports

**Checkpoint**: Old HTTP layer deleted. Only models.ts, client.ts, data.ts, totals.ts, and index.ts remain in src/lib/sheets/.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup.

- [X] T040 Run `bun run lint` — verify no new lint errors introduced
- [X] T041 Verify no remaining imports from deleted files — search codebase for old import paths (`@/lib/sheets/api`, `@/lib/sheets/expenses`, `@/lib/sheets/income`, `@/lib/sheets/debts`, `@/lib/sheets/transfers`, `@/lib/sheets/sync`, `@/lib/sheets/validate`, `@/lib/sheets/constants`)
- [X] T042 Final review: confirm SyncContext preserves auto-sync debounce (2s), interval (5min), change detection (signature comparison), and rate limiting (3s–30s backoff) — no orchestration logic changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1 Push)**: Depends on Phase 1 — models and client must exist before SyncContext changes
- **Phase 3 (US2 Pull)**: Depends on Phase 1 — can run in parallel with Phase 2 if desired
- **Phase 4 (US3 Setup)**: Depends on Phase 1 — can run in parallel with Phase 2/3
- **Phase 5 (US4 Cleanup)**: Depends on Phases 2, 3, 4 — old modules cannot be deleted until all callers are migrated
- **Phase 6 (Polish)**: Depends on Phase 5

### User Story Dependencies

- **US1 (Push)**: Depends on models + client (Phase 1). No dependency on other stories.
- **US2 (Pull)**: Depends on models + client (Phase 1). Independent of US1 at code level, but US1 should be validated first for incremental confidence.
- **US3 (Sheet Setup)**: Depends on models + client (Phase 1). Independent of US1/US2.
- **US4 (Cleanup)**: Depends on US1 + US2 + US3 — all callers must be migrated before deleting old code.

### Parallel Opportunities

- T002 and T003 can run in parallel (models.ts and client.ts are separate files)
- T024–T028 (import updates) can all run in parallel (different files)
- T029–T036 (file deletions) can all run in parallel
- US1, US2, US3 could theoretically run in parallel after Phase 1, but sequential (P1→P2→P3) is recommended for incremental validation

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: US1 Push (T006–T013)
3. **STOP and VALIDATE**: Sync to sheets works via genjutsu-db
4. All old read paths still work — zero user-facing risk

### Incremental Delivery

1. Phase 1 → Models + client ready
2. Phase 2 (US1) → Push migrated → Validate sync works
3. Phase 3 (US2) → Pull migrated → Validate pull works
4. Phase 4 (US3) → Setup migrated → Validate sheet creation
5. Phase 5 (US4) → Old code deleted → Clean codebase
6. Phase 6 → Final verification

---

## Notes

- No test tasks included — spec does not request TDD for this migration
- Data blob (Data!A1) and Totals sheet remain as special cases throughout all phases
- `src/lib/minifiedPayload.ts` and `src/lib/googleDrive.ts` are NOT touched by this migration
- Each phase validates with `bun test` + `bun run build` before proceeding
