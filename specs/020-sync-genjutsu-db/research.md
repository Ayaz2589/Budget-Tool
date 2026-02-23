# Research: Migrate Google Sync to genjutsu-db

## R1: genjutsu-db API Compatibility with Current Sheets Layer

**Decision**: genjutsu-db provides 1:1 replacements for all core operations in the current sheets layer.

**Rationale**: Mapping of current custom functions to genjutsu-db equivalents:

| Current Custom Code | genjutsu-db Equivalent |
|---|---|
| `getSheetValues(token, id, range)` | `db.repo("x").readAll()` |
| `updateSheet(token, id, range, values, append)` | `db.repo("x").writeAll(records)` or `db.repo("x").append(records)` |
| `clearRange(token, id, range)` | Handled internally by `writeAll()` and `batchSync()` |
| `syncAllSheetsBatch(token, id, payload)` | `db.batchSync({ expenses: [...], income: [...], ... })` |
| `ensureSheetsExist(token, id)` | `db.ensureSchema()` |
| `applySheetsFormatting(token, id, sheetIds)` | `db.applyFormatting()` with formatting rules on model schemas |
| `extractSpreadsheetId(url)` | `extractSpreadsheetId(url)` (re-exported from genjutsu-db) |
| `generateId()` | `generateId()` (re-exported from genjutsu-db) |
| `parseAmount(value)` | `parseAmount(value)` (re-exported from genjutsu-db) |
| `normalizeDate(value)` | `normalizeDate(value)` (re-exported from genjutsu-db) |
| `hasIdColumn(row, ...)` | `hasIdColumn(row, ...)` (re-exported from genjutsu-db) |
| `findMissingHeaders(actual, required)` | `findMissingHeaders(actual, required)` (re-exported from genjutsu-db) |

**Alternatives considered**:
- Keep custom layer and just refactor: Rejected — genjutsu-db was extracted from this codebase specifically to centralize this logic.
- Partial adoption (models only, keep transport): Rejected — defeats the purpose; genjutsu-db handles transport internally.

## R2: Data Blob (Data!A1) Handling

**Decision**: Keep V2 blob as a raw cell read/write, not a genjutsu-db model.

**Rationale**: The Data!A1 cell stores a single compressed blob (gzip + Base64), not rows of structured data. genjutsu-db models are row-oriented with headers. The blob is a single value in a single cell — it doesn't fit the model pattern. We'll use genjutsu-db's transport utilities (`getSheetValues`/`updateSheet`) or keep the existing `readDataBlob`/`writeDataBlob` functions with minimal modification to use the genjutsu-db client's auth context.

**Alternatives considered**:
- Define a "Data" model with one row and one column: Overcomplicated, doesn't leverage model features.
- Move blob storage out of Sheets entirely: Out of scope, would break existing sheets.

## R3: Totals Sheet (Dynamic Columns)

**Decision**: Keep Totals as a special-case write using raw sheet operations, not a genjutsu-db model.

**Rationale**: The Totals sheet has a variable number of columns based on the number of owners (per-owner spending and balance columns are generated dynamically). A `defineModel()` schema requires fixed columns known at definition time. The Totals sheet's column count changes when owners are added/removed. We'll keep `buildTotalsValues()` and write via genjutsu-db's batch update mechanism (include in `batchSync` payload as raw values).

**Alternatives considered**:
- Define a Totals model with max-owners columns: Fragile, wastes columns, hard to maintain.
- Skip Totals from batch sync and write separately: Adds an extra API call. Prefer including in batch.

## R4: Token Provider Pattern

**Decision**: Use genjutsu-db's `auth: () => Promise<string>` token provider pattern, sourcing the token from the existing GoogleAuthContext.

**Rationale**: genjutsu-db supports an async token provider function that is called on each request and automatically retries on 401 with a fresh token. The current implementation passes `accessToken` as a string parameter to every function. The token provider pattern eliminates token threading through the call chain.

**Alternatives considered**:
- Pass static token string: Works but doesn't get automatic 401 retry from genjutsu-db.
- Create a new auth wrapper: Unnecessary — genjutsu-db's built-in pattern is sufficient.

## R5: Error Mapping

**Decision**: Map genjutsu-db error kinds to existing SyncContext error handling.

**Rationale**: Current error handling:
- 401 → `clearSession()` (logout)
- 429 → exponential backoff retry
- Other → error status with message

genjutsu-db error mapping:
- `AUTH_ERROR` → `clearSession()` (same as 401)
- `RATE_LIMIT` (with `retryAfterMs`) → use `retryAfterMs` for backoff (more precise than current)
- `PERMISSION_ERROR` → error status "Permission denied"
- `NETWORK_ERROR` → error status "Network error"
- `API_ERROR` → error status with message
- `VALIDATION_ERROR` → should not occur in sync (data is already validated by app)
- `SCHEMA_ERROR` → should not occur at runtime (caught at client creation)

**Alternatives considered**:
- Catch all errors generically: Loses the benefit of typed error kinds.
- Re-throw as custom errors: Unnecessary layer — genjutsu-db errors are already well-typed.

## R6: Legacy Expense Row Support

**Decision**: Use genjutsu-db's raw `SheetSchema` pattern with custom `parseRow` to handle legacy rows without ID columns.

**Rationale**: The current `readExpensesFromSheet()` uses `hasIdColumn()` to detect whether the first column is an ID or a date. Legacy rows (pre-ID format) have `[Date, Amount, Description, Category, Source, Owner]` while modern rows have `[ID, Date, Amount, Description, Category, Source, Owner]`. genjutsu-db's `defineModel()` generates a fixed `parseRow`, but we can override with a custom `SheetSchema` that handles both formats — or use `defineModel()` for the modern format and add a post-processing step for legacy rows.

**Alternatives considered**:
- Force migration of all existing sheets to modern format: Breaking change for users with old sheets.
- Use `defineModel()` only and handle legacy in pre-processing: Viable but less clean.

## R7: Utility Function Import Strategy

**Decision**: Import utility functions directly from `genjutsu-db` package instead of maintaining local copies.

**Rationale**: genjutsu-db re-exports: `generateId`, `parseAmount`, `normalizeDate`, `extractSpreadsheetId`, `hasIdColumn`, `findMissingHeaders`, `isValidDate`, `looksLikeIsoDate`. These are the exact same functions currently in `src/lib/sheets/api.ts` and `src/lib/sheets/validate.ts` (genjutsu-db was extracted from this codebase). Importing from the package eliminates duplication.

Import sites to update:
- `src/lib/sheets/expenses.ts` → uses `parseAmount`, `normalizeDate`, `generateId`, `hasIdColumn`
- `src/lib/sheets/income.ts` → uses `parseAmount`, `normalizeDate`, `generateId`
- `src/lib/sheets/debts.ts` → uses `parseAmount`, `normalizeDate`
- `src/lib/sheets/transfers.ts` → uses `parseAmount`
- `src/lib/sheets/validate.ts` → defines `validateExpenseSource`, `hasIdColumn`, `findMissingHeaders`
- `src/context/SheetSetupContext.tsx` → uses `extractSpreadsheetId`
- Various other files using `generateId`

**Alternatives considered**:
- Keep local copies: Leads to divergence between library and app copies.
- Create a local wrapper that re-exports: Unnecessary indirection.
