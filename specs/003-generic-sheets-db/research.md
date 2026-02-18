# Research: Generic Sheets Database Library

**Feature**: 003-generic-sheets-db
**Date**: 2026-02-18

## R1: Schema Definition Pattern

**Decision**: Use a `SheetSchema<T>` interface where consumers provide sheet metadata (name, ranges, headers) plus `parseRow` and `toRow` mapper functions.

**Rationale**: Analysis of all 6 domain modules (expenses, income, debts, transfers, totals, data-blob) reveals an identical pattern: read rows → map to entity, entity → map to row. The only variation is field positions, types, and optional column detection. A single generic interface captures all of this without the library knowing any domain concepts.

**Alternatives considered**:
- **Decorator/annotation pattern**: Too complex for a pure-function library with no classes. Rejected per Constitution Principle VII (Simplicity).
- **Builder pattern**: `schema().sheet("Expenses").columns([...]).build()` — adds runtime overhead and indirection without meaningful benefit over a plain interface. Rejected.
- **Convention-based (auto-map by field name)**: Fragile when column order differs from field order, can't handle legacy format detection. Rejected.

## R2: Client Factory Generics

**Decision**: `createSheetsClient<S extends Record<string, SheetSchema<any>>>(config)` returns a client where `client.repo("expenses")` is typed as `Repository<Expense>` via mapped types.

**Rationale**: TypeScript's `Record<string, SheetSchema<any>>` with mapped types `{ [K in keyof S]: Repository<InferEntity<S[K]>> }` gives consumers fully typed repositories without casting. The consumer defines schemas as a const object; TypeScript infers entity types from the `parseRow` return type.

**Alternatives considered**:
- **Separate `createRepository()` calls per entity**: Loses the ability to do batch operations across all registered schemas. Rejected.
- **Class-based client with `.register()` method**: Mutable registration complicates TypeScript inference and lifecycle management. Rejected.

## R3: Batch Sync Generalization

**Decision**: `batchSync` iterates over registered schemas, calling each schema's `toRow` mapper to build the batch payload. The consumer passes a `Record<string, T[]>` keyed by schema name.

**Rationale**: The current `syncAllSheetsBatch` imports `buildExpensesValues`, `buildIncomeValues`, etc. — but each just maps entities to rows and prepends headers. The generic version does this via schema iteration: `schemas.map(s => ({ range: s.writeRange, values: [s.headers, ...data[key].map(s.toRow)] }))`.

**Alternatives considered**:
- **Consumer builds the batch payload manually**: Defeats the purpose of the library providing batch primitives. Rejected.
- **Middleware/plugin pattern for batch hooks**: Over-engineered for the current use case. Rejected per Principle VII.

## R4: Normalize Module Split

**Decision**: Keep generic utilities (date normalization, amount parsing, ID generation, header validation) in `sheets-db/utils.ts`. Move all domain-specific validators and parsers (validateExpense, normalizeCategoryFromSheet, parseOwner, validateExpenseSource) to `src/lib/ortho-sheets/`.

**Rationale**: Grep analysis shows 9 generic functions and 8 domain-specific functions in normalize.ts. The generic ones reference no Ortho concepts; the domain ones import Ortho types. Clean separation at the function level.

**Alternatives considered**:
- **Keep all normalization in the library with plugin points**: Adds complexity for something that's cleanly separable. Rejected.
- **Remove utilities entirely, let consumers handle all parsing**: Date/amount parsing is universally needed for any Sheets use case. Keeping it generic adds real value.

## R5: Ortho Domain Layer Location

**Decision**: `src/lib/ortho-sheets/` as a sibling to `src/lib/sheets-db/`.

**Rationale**: Follows the existing `src/lib/` convention (each subdirectory is a focused module). The name `ortho-sheets` clearly communicates "Ortho's Google Sheets domain layer". Keeping it separate from `sheets-db/` maintains the library boundary.

**Alternatives considered**:
- **Inline in context files**: Scatters domain logic across 4+ context files, making it hard to test and reason about. Rejected.
- **`src/lib/sheets-db/ortho/` subdirectory**: Violates the "zero domain imports" goal — the domain code would live inside the library directory. Rejected.
- **`src/lib/budget-sheets/`**: Less descriptive than `ortho-sheets` and could be confused with a generic budgeting library. Rejected.

## R6: Special Schemas (Totals, Data Blob)

**Decision**: Totals (write-only) and Data Blob (single-cell read/write) are modeled as schemas with restricted operations. The schema interface includes optional `readOnly` and `writeOnly` flags. The `append` method throws if `appendSupported` is false.

**Rationale**: Currently, totals has no `readAll` and data-blob uses a single cell. Both fit the schema pattern with minor flags: totals is `writeOnly: true` (no parseRow needed), data-blob has a simple single-cell read/write that can be a degenerate schema with 1 column.

**Alternatives considered**:
- **Separate interfaces for write-only and read-write**: Adds interface proliferation for two edge cases. Rejected per Principle VII.
- **Exclude from schema system, handle as special cases**: Breaks the "iterate all schemas for batch sync" pattern. Rejected.

## R7: Formatting Abstraction

**Decision**: Formatting rules are an optional property on `SheetSchema<T>`. The consumer provides an array of formatting request objects (column ranges, number formats, bold headers). The library's `applyFormatting` iterates schemas and sends a single `batchUpdate` with all formatting requests.

**Rationale**: The current `applyFormatting` in formatting.ts builds `repeatCellRequest` objects per sheet. This maps cleanly to a schema-level config: each schema declares its formatting needs, and the library aggregates them.

**Alternatives considered**:
- **Consumer calls Sheets API directly for formatting**: Loses the library's error handling and batching. Rejected.
- **Built-in formatting presets (currency, percent, date)**: Over-engineers the library for Ortho's specific needs. Consumer-defined rules are more flexible. Rejected.
