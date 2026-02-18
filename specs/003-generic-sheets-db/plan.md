# Implementation Plan: Generic Sheets Database Library

**Branch**: `003-generic-sheets-db` | **Date**: 2026-02-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-generic-sheets-db/spec.md`

## Summary

Refactor `src/lib/sheets-db/` from a domain-specific Google Sheets persistence layer (hardcoded to Ortho's budget entities) into a generic, app-agnostic library. The library provides a schema definition API (`SheetSchema<T>`), a typed client factory (`createSheetsClient`), generic CRUD repositories, batch sync, and utility functions — with zero knowledge of budget/finance concepts. All Ortho-specific domain logic (expenses, income, debts, transfers, totals, mortgage, presets) moves to a new `src/lib/ortho-sheets/` module that defines schemas using the library's primitives.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) + None (pure `fetch`-based, no external libraries)
**Primary Dependencies**: Google Sheets v4 REST API (client-side, no backend)
**Storage**: Google Sheets (remote), localStorage (local — unchanged)
**Testing**: Bun test runner + happy-dom
**Target Platform**: Browser (client-side OAuth, `fetch` API)
**Project Type**: Web application (single SPA)
**Performance Goals**: Identical to current — batch sync in 2 API calls, write mutex for serialization
**Constraints**: Zero external imports in `sheets-db/`, zero `@/` path aliases, TypeScript strict mode
**Scale/Scope**: ~15 library files, ~10 domain layer files, 4 consumer files to update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First | N/A | Library refactor — no UI changes |
| II. Mobile-First | N/A | Library refactor — no UI changes |
| III. Financial Correctness | PASS | Zero changes to financial math. All existing tests must pass. |
| IV. Safe Destructive Actions | N/A | No user-facing destructive operations |
| V. Accessibility | N/A | Library refactor — no UI changes |
| VI. Incremental Refactoring | PASS | Build generic library alongside existing code, migrate consumers incrementally, run tests after each step |
| VII. Simplicity | PASS | Generic schema interface is the minimum abstraction needed. No over-engineering — `SheetSchema<T>` is a single flat interface, not a class hierarchy or builder pattern. |

**Post-design re-check**: All gates pass. The `SheetSchema<T>` interface adds justified complexity (enables library extraction) documented in Complexity Tracking below.

## Project Structure

### Documentation (this feature)

```text
specs/003-generic-sheets-db/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── client-api.ts    # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/lib/sheets-db/              # Generic library (refactored)
├── index.ts                    # Public barrel: createSheetsClient, types, utils
├── types.ts                    # SheetSchema<T>, FormattingRule, SheetsClientConfig, Repository<T>
├── client.ts                   # createSheetsClient factory (generic)
├── transport.ts                # HTTP layer (unchanged)
├── errors.ts                   # SheetsDbError, factories (unchanged)
├── utils.ts                    # Generic utilities (date, amount, headers — extracted from normalize.ts)
└── sync.ts                     # Generic batch sync (iterates schemas)

src/lib/ortho-sheets/           # Ortho domain layer (NEW)
├── index.ts                    # createOrthoSheetsClient, re-exports
├── types.ts                    # Expense, Income, Debt, etc. (moved from sheets-db/types.ts)
├── normalize.ts                # Domain validators + parsers (moved from sheets-db/normalize.ts)
├── schemas/
│   ├── index.ts                # Aggregated ORTHO_SCHEMAS constant
│   ├── expenses.ts             # expenseSchema, mortgageSchema
│   ├── income.ts               # incomeSchema
│   ├── debts.ts                # debtSchema, debtPaymentSchema
│   ├── transfers.ts            # ownerTransferSchema, presetSchema
│   ├── totals.ts               # totalsSchema (write-only)
│   └── data-blob.ts            # dataBlobSchema (single-cell)
└── formatting.ts               # Ortho-specific formatting rules

test/lib/sheets-db/             # Library tests (updated)
├── client.test.ts              # Generic client factory tests
├── sync.test.ts                # Generic batch sync tests
├── utils.test.ts               # Generic utility tests (from normalize.test.ts)
└── errors.test.ts              # Error tests (unchanged)

test/lib/ortho-sheets/          # Domain layer tests (NEW)
├── schemas.test.ts             # Schema definition tests (round-trip per entity)
├── normalize.test.ts           # Domain validator tests (moved)
└── integration.test.ts         # Full Ortho sync integration test
```

**Structure Decision**: Two sibling modules under `src/lib/` — `sheets-db/` (generic library) and `ortho-sheets/` (Ortho domain). This preserves the existing convention where each `src/lib/` subdirectory is a focused, self-contained module. The generic library has zero imports from `ortho-sheets/` or any `@/` path; the domain layer imports from `@/lib/sheets-db`.

### Files Removed

```text
src/lib/sheets-db/schema.ts      # Constants move to ortho-sheets/schemas/
src/lib/sheets-db/normalize.ts   # Split: generic → utils.ts, domain → ortho-sheets/normalize.ts
src/lib/sheets-db/expenses.ts    # Logic moves to ortho-sheets/schemas/expenses.ts
src/lib/sheets-db/income.ts      # Logic moves to ortho-sheets/schemas/income.ts
src/lib/sheets-db/debts.ts       # Logic moves to ortho-sheets/schemas/debts.ts
src/lib/sheets-db/transfers.ts   # Logic moves to ortho-sheets/schemas/transfers.ts
src/lib/sheets-db/totals.ts      # Logic moves to ortho-sheets/schemas/totals.ts
src/lib/sheets-db/data-blob.ts   # Logic moves to ortho-sheets/schemas/data-blob.ts
src/lib/sheets-db/formatting.ts  # Logic moves to ortho-sheets/formatting.ts
```

### Consumer Files Modified

```text
src/context/SyncContext.tsx        # Import from ortho-sheets instead of sheets-db
src/context/SheetSetupContext.tsx   # Import extractSpreadsheetId from sheets-db (unchanged)
src/context/GoogleAuthContext.tsx   # Import extractSpreadsheetId from sheets-db (unchanged)
src/pages/settings/SettingsPage.tsx # Import extractSpreadsheetId from sheets-db (unchanged)
src/lib/googleSheets.ts            # Update barrel to re-export from ortho-sheets
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `SheetSchema<T>` generic interface | Enables library extraction — consumers define domain mapping without library changes | Hardcoded domain modules require library edits for every new entity type |
| `ortho-sheets/` as separate module | Clean boundary between generic library and domain logic | Keeping domain code in sheets-db/ prevents standalone extraction |
| Mapped types for typed repositories | Consumers get `repo("expenses")` typed as `Repository<Expense>` without casting | Manual type assertions are error-prone and lose compile-time safety |
