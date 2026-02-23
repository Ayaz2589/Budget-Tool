# Feature Specification: Migrate Google Sync to genjutsu-db

**Feature Branch**: `020-sync-genjutsu-db`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Update the Google sync to use genjutsu-db"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Push Data to Google Sheets via Structured Models (Priority: P1)

A user clicks "Sync to Sheets" (or auto-sync triggers). The system pushes all budget data (expenses, mortgage, income, debts, debt payments, owner transfers, preset transactions, totals, and the V2 data blob) to Google Sheets using the genjutsu-db library's typed model definitions and batch sync instead of hand-rolled HTTP calls. The user sees the same sync status indicators (syncing, success, error) and the same sheet structure (9 tabs with identical column schemas) as before.

**Why this priority**: Push-to-sheets is the most frequently used sync operation and touches all 9 sheet tabs. Migrating it first proves the genjutsu-db integration end-to-end and validates the model definitions against real data.

**Independent Test**: Can be fully tested by syncing budget data to a connected Google Sheet and verifying all 9 tabs contain correctly formatted data with identical column headers and values as the current implementation.

**Acceptance Scenarios**:

1. **Given** a user has budget data and a linked Google Sheet, **When** they trigger a sync, **Then** all 9 sheet tabs are populated with correctly structured data (same headers, same column order, same values).
2. **Given** a sync is triggered, **When** the sync completes, **Then** the total number of Google Sheets API requests is equal to or fewer than the current implementation (currently 2 batch calls for data + 1 for formatting + 1 for ensure sheets).
3. **Given** a sync is triggered, **When** a rate limit (429) error occurs, **Then** the system retries with exponential backoff identical to current behavior (3s base, 30s max).
4. **Given** a sync is triggered, **When** an authentication error (401) occurs, **Then** the user's session is cleared and they are prompted to re-authenticate.

---

### User Story 2 - Pull Data from Google Sheets via Structured Models (Priority: P2)

A user clicks "Pull from Sheets". The system reads data from Google Sheets using genjutsu-db's typed repository reads instead of raw HTTP calls. The V2 blob fast path is preserved: if the Data sheet contains a V2 blob, it is used for full state restoration. Otherwise, the system falls back to reading individual sheet tabs via genjutsu-db repositories. Deduplication, category harvesting, and incremental merge logic remain identical.

**Why this priority**: Pull is used less frequently than push but is critical for multi-device workflows and data recovery. It must maintain the V2 blob fast path and sheet-by-sheet fallback.

**Independent Test**: Can be fully tested by pulling data from a Google Sheet (both with and without a V2 blob) and verifying the imported records match expectations with no duplicates.

**Acceptance Scenarios**:

1. **Given** a linked Google Sheet with a V2 data blob, **When** the user pulls, **Then** full state is restored from the blob (expenses, income, debts, payments, transfers, presets, categories, owners, card sources, currency settings).
2. **Given** a linked Google Sheet without a V2 blob, **When** the user pulls, **Then** data is read from individual sheet tabs and merged into the app without duplicates.
3. **Given** the app already has some records, **When** the user pulls, **Then** only new records (not already present by dedup key) are added.

---

### User Story 3 - Sheet Setup and Schema Management via genjutsu-db (Priority: P3)

When a user creates a new Google Sheet or links an existing one, the system uses genjutsu-db's schema management to ensure all required sheet tabs exist with correct headers and formatting. This replaces the hand-rolled `ensureSheetsExist()` and `applySheetsFormatting()` calls.

**Why this priority**: Sheet setup happens once per sheet lifecycle, so it's lower frequency than push/pull. However, it must still create all 9 tabs with correct headers and apply formatting (bold headers, currency formats, alignment).

**Independent Test**: Can be fully tested by creating a new Google Sheet and verifying all 9 tabs are created with correct headers and formatting applied.

**Acceptance Scenarios**:

1. **Given** a user creates a new Ortho sheet, **When** the sheet is created, **Then** all 9 required tabs exist with correct header rows.
2. **Given** an existing sheet is missing some tabs, **When** the user links it, **Then** the missing tabs are created automatically.
3. **Given** a sheet is set up, **When** formatting is applied, **Then** headers are bold, amount columns show currency format, and savings rate shows percent format.

---

### User Story 4 - Eliminate Custom HTTP Transport Layer (Priority: P4)

The 12-file `src/lib/sheets/` module is replaced by genjutsu-db model definitions and client usage. The custom `api.ts` (HTTP wrappers), `constants.ts` (ranges), `sync.ts` (batch operations), and per-domain read/write modules are removed. Utility functions shared with other parts of the app (e.g., `generateId`, `parseAmount`, `normalizeDate`) are preserved or imported from genjutsu-db's re-exported utilities.

**Why this priority**: Code reduction is the long-term maintenance benefit but has no user-visible impact. It depends on all other stories being complete.

**Independent Test**: Can be verified by confirming the `src/lib/sheets/` directory is removed (or reduced to minimal glue code), the build succeeds, and all tests pass.

**Acceptance Scenarios**:

1. **Given** the migration is complete, **When** the build runs, **Then** no imports reference the old `src/lib/sheets/` modules (or the module is deleted entirely).
2. **Given** the migration is complete, **When** all tests run, **Then** all existing sync-related tests pass without behavioral changes.

---

### Edge Cases

- What happens when the user has a Google Sheet created by the old implementation? The new implementation MUST read and write the exact same column schemas, so existing sheets remain fully compatible.
- What happens when genjutsu-db encounters a legacy row without an ID column (expenses)? The legacy detection logic (`hasIdColumn()`) must be preserved in the model's `parseRow` or equivalent.
- What happens when the V2 data blob is corrupt or missing? The fallback to per-sheet reads must still work.
- What happens when the Totals sheet has dynamic owner columns? The Totals sheet has a variable number of columns based on owner count, so it cannot use a static model definition — it needs special handling.
- What happens with the minified payload serialization/deserialization? The `serializeToBlob()` and `parseFromBlob()` functions are NOT part of the sheets layer and must be preserved as-is.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define genjutsu-db models for each of the 7 transactional sheet tabs (Expenses, Mortgage, Income, Debts, DebtPayments, OwnerTransfers, PresetTransactions) with schemas matching the current column definitions exactly.
- **FR-002**: System MUST use genjutsu-db's `batchSync()` for push operations, replacing the custom `syncAllSheetsBatch()` function.
- **FR-003**: System MUST use genjutsu-db's `readAll()` or equivalent for pull operations, replacing the per-domain `readXxxFromSheet()` functions.
- **FR-004**: System MUST preserve the V2 data blob read/write path (Data!A1 cell) for fast pull and full state backup.
- **FR-005**: System MUST preserve the Totals sheet write path, which has dynamic columns based on owner count.
- **FR-006**: System MUST use genjutsu-db's `ensureSchema()` to create missing sheet tabs, replacing `ensureSheetsExist()`.
- **FR-007**: System MUST use genjutsu-db's `applyFormatting()` to apply header and cell formatting, replacing `applySheetsFormatting()`.
- **FR-008**: System MUST use genjutsu-db's token provider pattern for authentication, enabling automatic 401 retry.
- **FR-009**: System MUST preserve all existing error handling behavior: 401 → session clear, 429 → exponential backoff, other errors → error status.
- **FR-010**: System MUST maintain backward compatibility with existing Google Sheets — no changes to sheet tab names, column headers, column order, or data formats.
- **FR-011**: System MUST preserve the auto-sync debounce (2s), interval (5 min), and change detection (signature comparison) behavior unchanged.
- **FR-012**: System MUST preserve the deduplication logic on pull (key = date|description|amount for expenses/income, ID-based for other domains).
- **FR-013**: System MUST preserve legacy row support for expenses without an ID column.
- **FR-014**: Utility functions used outside the sheets layer (`generateId`, `parseAmount`, `normalizeDate`, `extractSpreadsheetId`) MUST remain available — either re-exported from genjutsu-db or preserved in the codebase.

### Key Entities

- **Expense Model**: ID, Date, Amount, Description, Category, Source, Owner — maps to Expenses and Mortgage tabs.
- **Income Model**: Date, Amount, Description, Category, Owner — maps to Income tab.
- **Debt Model**: Id, Name, Initial Amount, Start Date, Owner — maps to Debts tab.
- **DebtPayment Model**: Id, Debt Id, Date, Amount, Note — maps to DebtPayments tab.
- **OwnerTransfer Model**: Id, Date, From Owner, To Owner, Amount, Note — maps to OwnerTransfers tab.
- **PresetTransaction Model**: Id, Source, Description, Category, Owner — maps to PresetTransactions tab.
- **Data Blob**: Single-cell storage (Data!A1) for compressed full-state snapshot — not a model, handled as raw cell read/write.
- **Totals**: Dynamic-column summary sheet — not a standard model due to variable column count.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users experience identical sync behavior — same status indicators, same error messages, same auto-sync timing.
- **SC-002**: All existing Google Sheets remain fully compatible — a user can sync with an existing sheet without any migration or manual changes.
- **SC-003**: The number of source files in the sheets sync layer is reduced by at least 50% (from 12 files to 6 or fewer).
- **SC-004**: All existing tests pass without changes to test assertions — only import paths and internal wiring change.
- **SC-005**: The build succeeds with zero errors after the migration.

## Assumptions

- The `genjutsu-db` package is published and installable via `bun add genjutsu-db`.
- genjutsu-db's `batchSync()` performs the same two-phase clear-then-write pattern as the current `syncAllSheetsBatch()`.
- genjutsu-db re-exports utility functions (`generateId`, `parseAmount`, `normalizeDate`, `extractSpreadsheetId`, `hasIdColumn`, `findMissingHeaders`) that the budget-tool currently defines in `src/lib/sheets/api.ts` and `src/lib/sheets/validate.ts`.
- The Data blob (V2 compressed payload) and Totals sheet (dynamic columns) will need custom handling outside of standard genjutsu-db models, since they don't fit the standard row-per-record pattern.
- The `SyncContext` and `SheetSetupContext` orchestration logic (auto-sync, change detection, rate limiting, queue management) remains in React context code and is NOT replaced by genjutsu-db — only the underlying sheet I/O calls change.
- The `src/lib/minifiedPayload.ts` (V2 blob serialization) and `src/lib/googleDrive.ts` (Drive folder operations) are NOT part of this migration.
