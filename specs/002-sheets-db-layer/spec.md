# Feature Specification: Google Sheets Database Layer

**Feature Branch**: `002-sheets-db-layer`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "Break out the logic for syncing to Google Sheets into its own subdirectory. Eventually make it its own library. Think about best practices from a database perspective, since this is going to be a pseudo-database."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable Data Persistence Through a Clean Data Layer (Priority: P1)

As a user of the budgeting app, I need my financial data (expenses, income, debts, transfers, presets) to be reliably persisted to and retrieved from Google Sheets through a well-defined data access layer — so that the app has a stable, predictable persistence layer that behaves like a proper database regardless of how it stores data underneath.

**Why this priority**: The core value of the sync feature is reliable persistence. Without a clean separation between "what data to store" and "how to store it in Sheets," the app is tightly coupled to Google Sheets internals. Extracting a data layer with clear contracts is the foundational change that all other stories build on.

**Independent Test**: Can be fully tested by verifying that every domain entity (expenses, income, debts, debt payments, owner transfers, preset transactions, totals, data blob) can be written to and read from the data layer, with the same data returned that was written. Delivers the core guarantee: data in = data out.

**Acceptance Scenarios**:

1. **Given** a set of expense records in the app, **When** the data layer writes them to persistence, **Then** reading them back returns identical records (same IDs, dates, amounts, descriptions, categories, sources, owners).
2. **Given** a data layer initialized with a valid connection (auth token + sheet ID), **When** any read or write operation is called, **Then** the caller never needs to know about sheet ranges, column layouts, or Google Sheets API details.
3. **Given** the data layer is used by the app, **When** a developer inspects the import boundary, **Then** no Google Sheets-specific concepts (ranges, cells, tabs, A1 notation) leak into the consuming code.

---

### User Story 2 - Schema Integrity and Validation (Priority: P2)

As a developer maintaining the budgeting app, I need the data layer to validate data on the way in and normalize data on the way out — so that the persistence layer enforces data integrity the same way a database enforces constraints, preventing corrupt or malformed data from being stored.

**Why this priority**: Without validation at the persistence boundary, bad data silently propagates. A database layer that validates inputs (type checks, required fields, format normalization) and normalizes outputs (date formats, category strings, source enums) is essential for data trust.

**Independent Test**: Can be tested by passing malformed data (missing IDs, invalid dates, unknown expense sources, empty required fields) to write operations and verifying they are rejected or normalized. Can also test that data read from sheets with legacy formats is normalized to current schema.

**Acceptance Scenarios**:

1. **Given** an expense record with an invalid date format, **When** the data layer reads it from storage, **Then** the date is normalized to a standard format or the record is flagged with a repair annotation.
2. **Given** an expense record with an unrecognized source value, **When** the data layer reads it, **Then** the source falls back to a default value rather than propagating an invalid enum.
3. **Given** a legacy row format without an ID column, **When** the data layer reads it, **Then** it detects the legacy format, generates IDs, and returns records in the current schema shape.
4. **Given** a write operation with a record missing a required field (e.g., amount), **When** the write is attempted, **Then** the data layer rejects the record with a clear validation error before any storage call is made.

---

### User Story 3 - Batch Sync with Transactional Semantics (Priority: P2)

As a user syncing my budget data, I need the full sync operation (writing all entity types) to either succeed completely or fail cleanly — so that I never end up with partially written data where some sheets are updated and others are stale.

**Why this priority**: The current batch-clear-then-batch-write approach already aims for this, but formalizing it as a transactional operation in the data layer's contract makes the guarantee explicit and testable. This prevents the most dangerous data corruption scenario: partial writes.

**Independent Test**: Can be tested by simulating a write failure mid-batch and verifying the data layer reports the failure clearly without leaving sheets in an inconsistent intermediate state.

**Acceptance Scenarios**:

1. **Given** a full sync payload covering all entity types, **When** the batch write succeeds, **Then** all sheets contain the latest data and the operation reports success.
2. **Given** a full sync payload, **When** the write fails partway through (e.g., network error after clearing but before writing), **Then** the data layer reports the failure with enough detail for the caller to decide whether to retry.
3. **Given** a sync in progress, **When** a second sync is requested, **Then** the second request is queued or rejected — never interleaved with the first.

---

### User Story 4 - Library-Ready Module Boundary (Priority: P3)

As a developer who wants to eventually extract this as a standalone library, I need the data layer to have zero direct imports from the host application's source tree — so that extracting it into a separate package requires only moving the directory and publishing, with no refactoring of internals.

**Why this priority**: This is the long-term architectural goal. While not immediately user-facing, establishing the boundary now means every subsequent change respects it, avoiding accumulation of new coupling that would make extraction harder later.

**Independent Test**: Can be tested by verifying that the data layer directory contains no imports using the app's path alias (`@/`) and that all app-specific types it needs are defined within its own boundary or passed in via configuration/injection.

**Acceptance Scenarios**:

1. **Given** the data layer directory, **When** scanning all source files for imports, **Then** zero imports reference paths outside the data layer directory (no `@/types`, `@/lib`, or relative paths reaching outside).
2. **Given** the data layer needs domain types (Expense, Income, etc.), **When** they are needed, **Then** they are either defined within the data layer or provided by the consumer through a configuration/adapter pattern.
3. **Given** the data layer directory is copied to a fresh project with no other application code, **When** it is compiled, **Then** it compiles successfully with no missing dependencies beyond its declared peer dependencies.

---

### Edge Cases

- What happens when the Google Sheets API returns a 429 (rate limit) during a batch write? The data layer must surface the rate-limit error to the caller with enough context (retry-after timing) for the caller to implement backoff.
- What happens when a sheet tab is missing (deleted by the user in Google Sheets)? The data layer must detect missing tabs and either recreate them or report the specific missing tab to the caller.
- What happens when the auth token expires mid-operation? The data layer must detect 401 responses and surface an authentication error distinct from other failures.
- What happens when the stored data has more columns than expected (future schema)? The data layer must ignore unknown columns and still parse known columns correctly (forward compatibility).
- What happens when two browser tabs attempt concurrent syncs? The data layer must prevent interleaved writes through request serialization or locking.
- What happens when the Data blob (backup) is corrupt but individual sheet tabs have valid data? The data layer must support falling back to per-sheet reads when the blob fails to parse.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The data layer MUST provide distinct read and write operations for each domain entity: expenses, income, debts, debt payments, owner transfers, preset transactions, totals summaries, and the full-state data blob.
- **FR-002**: The data layer MUST accept a connection configuration (authentication credentials and storage identifier) at initialization, and all operations MUST use this configuration without requiring callers to manage storage-specific details.
- **FR-003**: The data layer MUST validate all records on write, rejecting records that fail required-field checks (e.g., missing ID, missing amount) before any storage operation occurs.
- **FR-004**: The data layer MUST normalize all records on read, handling legacy formats (e.g., rows without ID columns), date format variations, and invalid enum values by applying documented defaults.
- **FR-005**: The data layer MUST support a batch write operation that writes all entity types in a single logical operation, with clear success or failure reporting for the entire batch.
- **FR-006**: The data layer MUST ensure storage schema integrity by verifying required storage locations (sheet tabs) exist before performing read/write operations, and creating missing locations when possible.
- **FR-007**: The data layer MUST expose a public interface that contains no storage-implementation concepts (no sheet ranges, cell references, column indices, or API-specific types).
- **FR-008**: The data layer MUST contain no imports from the host application's source tree — all domain types and utilities it needs must be defined within its own boundary or injected by the consumer.
- **FR-009**: The data layer MUST support reading a full-state backup blob and falling back to per-entity reads when the blob is missing or corrupt.
- **FR-010**: The data layer MUST distinguish between different failure types (authentication errors, rate-limit errors, network errors, validation errors, schema errors) so callers can handle each appropriately.
- **FR-011**: The data layer MUST serialize concurrent write requests, ensuring no two write operations execute simultaneously against the same storage target.
- **FR-012**: The data layer MUST support storage formatting (headers, number formats) as an optional post-write operation that the consumer can invoke independently.

### Key Entities

- **Connection**: Represents an authenticated session to a specific storage target. Holds credentials and storage identifier. All operations are scoped to a connection.
- **Expense**: A financial transaction with ID, date, amount, description, category, source (payment method), and optional owner/allocation fields. Expenses are partitioned into regular and mortgage categories.
- **Income**: An income record with ID, date, amount, description, category, and optional owner.
- **Debt**: A tracked debt with ID, name, initial amount, optional start date, and optional owner.
- **DebtPayment**: A payment against a debt, linking payment ID to debt ID with date, amount, and optional note.
- **OwnerTransfer**: A ledger entry recording a transfer between two owners, with date, amount, and optional note.
- **PresetTransaction**: A reusable transaction template with source, description, optional amount, category, and owner.
- **TotalsSummary**: Aggregated monthly financial summaries including earned/spent totals, per-owner breakdowns, and savings metrics.
- **DataBlob**: A compressed full-state snapshot of all application data, used as a backup/restore mechanism.
- **Schema**: The structural definition of how entities map to storage (column order, required headers, naming conventions). Versioned to support legacy format detection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing sync functionality (push to sheets, pull from sheets, auto-sync, sheet setup) continues to work identically after the refactor — zero user-facing behavior changes.
- **SC-002**: The data layer directory can be compiled in isolation with no imports reaching outside its boundary, verified by static analysis.
- **SC-003**: All domain entity round-trips (write then read) return data identical to the input, validated by automated tests covering every entity type.
- **SC-004**: Legacy data formats (rows without ID columns, non-standard date formats, unrecognized source values) are correctly normalized on read, with 100% of existing test cases passing.
- **SC-005**: Write operations with invalid data (missing required fields, wrong types) are rejected before any storage call is made, verified by validation test cases.
- **SC-006**: Sync operations complete within the same time envelope as the current implementation — no measurable performance regression.
- **SC-007**: A batch write failure is reported to the caller with an error type that distinguishes auth failures, rate limits, network errors, and validation errors.
- **SC-008**: The data layer's public interface exposes zero storage-implementation concepts — no sheet names, ranges, cell references, or API URLs appear in exported types or function signatures.

## Assumptions

- The primary storage backend remains Google Sheets for this iteration. The database-layer abstraction prepares for future backends but does not require implementing alternative storage adapters now.
- The existing V2 blob format (minified JSON + gzip + Base64) is preserved as-is. The data layer wraps it but does not change the serialization format.
- Domain types (Expense, Income, Debt, etc.) will be redefined or re-exported within the data layer's boundary rather than imported from the host app. The host app may need to update its imports to use the data layer's types.
- The auto-sync orchestration (debouncing, intervals, rate-limit backoff) remains in the host app's context layer. The data layer provides the primitives; the app decides when to call them.
- Date repair and mortgage categorization logic that is currently coupled to the sheets module will be extracted into the data layer's own utilities, since they are intrinsic to data normalization.
- The Google Drive integration (folder management, sheet discovery) remains outside the data layer, as it concerns storage provisioning rather than data access.
