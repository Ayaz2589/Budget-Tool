# Feature Specification: Generic Sheets Database Library

**Feature Branch**: `003-generic-sheets-db`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "Refactor sheets-db to be a generic, app-agnostic Google Sheets persistence library. Move all Ortho-specific domain logic out of src/lib/sheets-db/ and into the host app layer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generic Schema Definition and Row Mapping (Priority: P1)

As a library consumer, I can define a typed schema (sheet names, column headers, row-to-entity mappers) for any domain — not just budgeting — and the library handles all Google Sheets I/O without knowing what the data represents.

**Why this priority**: This is the foundation. Without a generic schema system, every other feature remains hardcoded to Ortho's budget entities. A generic schema definition unlocks reuse for any application domain.

**Independent Test**: Define a schema for a completely different domain (e.g., a contacts list with name, email, phone columns), register it with the library, write records, read them back, and verify round-trip integrity — all without modifying any library code.

**Acceptance Scenarios**:

1. **Given** a consumer defines a schema with sheet name "Contacts" and columns ["name", "email", "phone"], **When** they create a client with that schema, **Then** the library can write and read Contact records without any contacts-specific code in the library.
2. **Given** a consumer defines two schemas for different entity types (e.g., Contacts and Orders), **When** they create a client, **Then** each entity type maps to its own sheet with independent column definitions.
3. **Given** a consumer defines a schema with a custom row-to-entity mapper that handles type coercion (e.g., parsing "123.45" to a number), **When** records are read from the sheet, **Then** the mapper is applied and entities have correctly typed fields.
4. **Given** a consumer defines a schema with an entity-to-row mapper, **When** records are written to the sheet, **Then** the mapper serializes entities to string arrays matching the column layout.

---

### User Story 2 - Ortho Domain Layer Migration (Priority: P1)

As the Ortho application, all budget-specific logic (expenses, income, debts, debt payments, owner transfers, presets, totals, mortgage) is moved out of `sheets-db` into an Ortho-owned domain layer that uses the generic library primitives. The existing sync behavior is preserved with zero user-facing changes.

**Why this priority**: Equal priority with US1 because both are required for the refactor to be complete. Moving Ortho's domain logic out is the whole point — the library becomes generic only when domain code is extracted.

**Independent Test**: Run the full existing test suite (`bun test`) after migration. All 646+ tests pass. Sync to Google Sheets works identically — push and pull produce the same sheet contents as before.

**Acceptance Scenarios**:

1. **Given** the Ortho app defines its expense schema using the generic library's schema definition API, **When** expenses are synced to Sheets, **Then** the sheet layout (columns, headers, ranges) is identical to the current implementation.
2. **Given** the Ortho domain layer defines validators for each entity type, **When** invalid data is written, **Then** the same validation errors are thrown as today.
3. **Given** the Ortho app uses the generic library's batch sync primitive, **When** a full sync is triggered, **Then** the same clear-then-write sequence executes with identical API calls.
4. **Given** the migration is complete, **When** `src/lib/sheets-db/` is scanned, **Then** zero files reference Ortho-specific concepts (expense, income, debt, budget, mortgage, owner, preset, totals).

---

### User Story 3 - Generic Batch Operations (Priority: P2)

As a library consumer, I can perform batch operations (clear all sheets, write all sheets, sync all sheets) using the generic schema definitions without the library knowing about specific entity types.

**Why this priority**: Batch sync is critical for the Ortho use case (and any app that needs atomic-style multi-sheet writes), but it depends on US1's schema system being in place first.

**Independent Test**: Define 3 schemas for unrelated entity types, populate them with test data, call a generic `batchSync` that clears and rewrites all sheets, and verify the data round-trips correctly.

**Acceptance Scenarios**:

1. **Given** a consumer has registered 3 entity schemas, **When** they call `batchSync` with data for all 3, **Then** the library clears all registered sheets and writes all data in two API calls (one batchClear, one batchUpdate).
2. **Given** a consumer has registered schemas and one sheet write fails mid-batch, **When** the error propagates, **Then** it includes the sheet name and entity type that failed.
3. **Given** a consumer calls `batchSync` with an empty array for one entity, **When** the sync completes, **Then** that sheet is cleared but no data rows are written (headers only, if configured).

---

### User Story 4 - Pluggable Validation and Formatting (Priority: P3)

As a library consumer, I can register custom validators per entity type and custom sheet formatting rules, and the library applies them at the correct points in the write/read lifecycle.

**Why this priority**: Validation and formatting are important for data integrity and presentation, but the library can function without them (they enhance, not enable). This is the polish layer.

**Independent Test**: Register a custom validator that rejects records with a missing "email" field, attempt to write a record without email, and verify the library throws a validation error before making any API call.

**Acceptance Scenarios**:

1. **Given** a consumer registers a validator for the "Contacts" schema, **When** a record fails validation, **Then** the library throws a `VALIDATION_ERROR` with field-level issues before any network call.
2. **Given** a consumer registers formatting rules (bold headers, currency columns), **When** `applyFormatting` is called, **Then** the library sends the correct Sheets API formatting requests using the registered rules.
3. **Given** no validator is registered for a schema, **When** records are written, **Then** the library writes them without validation (opt-in behavior).

---

### Edge Cases

- What happens when a consumer defines a schema with zero columns? The library rejects it at registration time with a clear error.
- What happens when a sheet has extra columns not in the schema? The library ignores them (forward-compatible reads).
- What happens when a sheet has fewer columns than the schema? Missing columns are treated as empty/undefined values.
- What happens when two schemas reference the same sheet name? The library rejects the duplicate at registration time.
- What happens when the consumer's row mapper throws an error? The library wraps it in a `VALIDATION_ERROR` with the row index for debugging.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The library MUST provide a schema definition API where consumers declare sheet name, column headers, and row-to-entity/entity-to-row mapping functions per entity type.
- **FR-002**: The library MUST provide generic read, write, append, and clear operations that work with any schema-defined entity type.
- **FR-003**: The library MUST provide a write mutex that serializes all write operations to prevent interleaved API calls, regardless of entity type.
- **FR-004**: The library MUST provide batch operations (batchClear + batchUpdate) that operate across all registered schemas in two API calls.
- **FR-005**: The library MUST provide an `ensureSchema` operation that creates missing sheets based on registered schema definitions.
- **FR-006**: The library MUST preserve the existing typed error system (SheetsDbError with kind discriminant) for all error scenarios.
- **FR-007**: The library MUST provide generic utility functions for common data transformations (date normalization, amount parsing, ID generation, header validation).
- **FR-008**: The library MUST allow consumers to register optional validators per entity type, called before write operations.
- **FR-009**: The library MUST allow consumers to register optional formatting rules per sheet, applied via `applyFormatting`.
- **FR-010**: The library MUST have zero imports from any host application — all domain types and logic come from the consumer via configuration.
- **FR-011**: The Ortho application MUST define its own domain layer using the generic library's APIs to reproduce all current sync behavior.
- **FR-012**: The library MUST export a `createSheetsClient` factory that accepts schema definitions and returns a typed client with per-entity repository accessors.

### Key Entities

- **SchemaDefinition**: Declares how a single entity type maps to a Google Sheet — includes sheet name, column headers, row-to-entity mapper, entity-to-row mapper, optional validator, and optional formatting rules.
- **SheetsDbClient**: The main client object returned by the factory, providing typed repository accessors for each registered schema plus batch operations, schema management, and formatting.
- **Repository**: A bound set of read/write/append/clear operations for a single entity type, derived from a SchemaDefinition.
- **TransportContext**: Internal connection state (OAuth token + spreadsheet ID) used by all operations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The `src/lib/sheets-db/` directory contains zero references to Ortho-specific domain concepts (expense, income, debt, mortgage, budget, owner, preset, totals) — verified by automated text scan.
- **SC-002**: All existing tests pass (646+ tests, 0 failures) after the migration, confirming zero user-facing behavior changes.
- **SC-003**: A new entity type can be added by a consumer in under 5 minutes by defining a schema (sheet name, columns, mappers) — no library code changes required.
- **SC-004**: The library's public API surface has no more than 15 exported symbols (types + functions), keeping it simple and learnable.
- **SC-005**: The generic library compiles independently with zero `@/` path alias imports and zero imports from outside its own directory.

## Assumptions

- The library targets browser-side usage (client-side `fetch`), consistent with Ortho's current architecture. No Node.js-specific APIs are required.
- The schema definition API uses TypeScript generics to preserve type safety — consumers get fully typed repositories without casting.
- The Ortho domain layer will live at `src/lib/sheets-db-ortho/` or a similar adjacent directory, separate from the generic library.
- The existing write mutex pattern (Promise chain) is sufficient for concurrency control — no upgrade to Web Workers or SharedArrayBuffer is needed.
- Sheet formatting (bold headers, currency columns) remains an opt-in feature managed through consumer-provided formatting rules, not built into the library core.
