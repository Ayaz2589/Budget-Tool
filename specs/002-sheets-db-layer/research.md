# Research: Google Sheets Database Layer

**Feature Branch**: `002-sheets-db-layer`
**Date**: 2026-02-18

## R-001: Module Location and Naming

**Decision**: Create `src/lib/sheets-db/` as a new directory alongside the existing `src/lib/sheets/`. Migrate incrementally, then remove `src/lib/sheets/` and update the barrel re-export at `src/lib/googleSheets.ts`.

**Rationale**: A new directory avoids breaking existing imports during the transition. The `-db` suffix signals that this module operates as a data access layer, not just a collection of Sheets API helpers. The name also distinguishes it from the old module during the migration period.

**Alternatives considered**:
- Refactor `src/lib/sheets/` in place: Rejected because it would break all existing imports simultaneously, violating incremental refactoring discipline (Constitution Principle VI).
- Name `src/lib/ortho-db/`: Rejected because it implies multi-backend support which is not in scope. The module is still Google Sheets-specific.

## R-002: Type Ownership Strategy

**Decision**: Define all entity types (`Expense`, `Income`, `Debt`, `DebtPayment`, `OwnerTransfer`, `PresetTransaction`, `MonthTotals`, `SheetIds`, `ExpenseSource`) inside `src/lib/sheets-db/types.ts`. The host app will import these types from the data layer instead of from `@/types/core`.

**Rationale**: For the module to be extractable as a library, it must own its type definitions. Importing from the host app's type system creates a hard dependency that prevents extraction. The host app's existing `@/types/core.ts` may still define its own types for app-level concerns, but the data layer's types become the source of truth for persistence-related shapes.

**Alternatives considered**:
- Keep importing from `@/types/core`: Rejected because it violates FR-008 (zero external imports) and prevents library extraction.
- Use generic `Record<string, unknown>` instead of typed interfaces: Rejected because it sacrifices type safety which is core to the module's validation guarantees.
- Accept types as generics/parameters: Rejected as over-engineered for a single known schema. The types ARE the module's schema definition.

## R-003: Utility Internalization

**Decision**: Copy `tryRepairDate` and `isValidDate` from `src/lib/dateRepair.ts` into the data layer's normalization module. Copy `ALL_EXPENSE_SOURCES` constant into the data layer's types module. These are the only two external runtime dependencies.

**Rationale**: Both utilities are small (< 30 lines each) and intrinsic to data normalization — they belong inside the data layer. Copying eliminates the last external runtime imports. The host app's `dateRepair.ts` can remain for its own use.

**Alternatives considered**:
- Inject utilities via configuration: Rejected as over-engineered. These are stable, small functions with no reason to vary.
- Import from a shared package: Rejected because no shared package exists and creating one for two small functions adds unnecessary infrastructure.

## R-004: Client/Connection Pattern

**Decision**: Use a factory function `createSheetsClient(config)` that returns an object with all database operations bound to the connection config (token + spreadsheetId). The config is passed once at creation time.

```
const client = createSheetsClient({ token, spreadsheetId });
await client.expenses.readAll();
await client.expenses.writeAll(expenses);
await client.batchSync(payload);
```

**Rationale**: This mirrors how database clients work (e.g., `createClient(connectionString)` in Postgres, `new Firestore(config)` in Firebase). It eliminates the current pattern of passing `token` and `spreadsheetId` as the first two arguments to every function call. A plain object (not a class) keeps it simple per Constitution Principle VII.

**Alternatives considered**:
- Class-based `SheetsDatabase` with methods: Rejected as unnecessarily OOP for a module that is essentially a collection of pure functions bound to config.
- Keep passing token/spreadsheetId to each function: Rejected because it leaks connection management to every caller and is error-prone.
- Singleton module with `init()`: Rejected because it prevents multiple concurrent connections (e.g., testing).

## R-005: Error Taxonomy

**Decision**: Define a discriminated union of error types that the data layer surfaces to callers:

- `AuthError` — 401 responses, expired/invalid token
- `RateLimitError` — 429 responses, includes retry-after timing
- `NetworkError` — fetch failures, timeouts, DNS errors
- `ValidationError` — input records failing required-field or format checks
- `SchemaError` — missing sheet tabs, unexpected column layout
- `SheetsApiError` — other Google Sheets API errors (4xx/5xx not covered above)

**Rationale**: The current implementation catches errors but surfaces them as generic strings. Typed errors let callers implement appropriate recovery strategies (retry for rate limits, re-auth for auth errors, alert for validation errors). This is a fundamental database-layer responsibility.

**Alternatives considered**:
- Return `Result<T, E>` tuples: Rejected as non-idiomatic in the TypeScript/React ecosystem where `try/catch` with typed errors is standard.
- Throw generic Error with error codes: Rejected because it forces `instanceof` or code-string matching which is brittle.

## R-006: Backward Compatibility During Migration

**Decision**: The migration follows three phases:
1. **Build**: Create `src/lib/sheets-db/` with all functionality, passing all tests via its own test suite.
2. **Bridge**: Update `src/lib/googleSheets.ts` barrel to re-export from `sheets-db/` instead of `sheets/`.
3. **Remove**: Delete `src/lib/sheets/` once all consumers import through the barrel or directly from `sheets-db/`.

**Rationale**: This preserves the existing `@/lib/googleSheets` import path that all consumers use, meaning consumer code changes are deferred until the barrel is swapped. No big-bang migration.

**Alternatives considered**:
- Update all consumers simultaneously: Rejected because it's a large, risky change that violates incremental refactoring.
- Keep both modules permanently: Rejected because dual code paths create maintenance burden.

## R-007: Concurrency Control

**Decision**: The data layer will expose a `withLock()` mechanism — a simple in-memory mutex that serializes write operations. Read operations are not locked (readers don't conflict). The caller is responsible for choosing whether to use locking; the batch sync operation uses it internally.

**Rationale**: The current implementation handles concurrency at the SyncContext level (queue syncs, reject duplicates). Moving basic write serialization into the data layer formalizes this as a database guarantee. An in-memory mutex is sufficient because the app runs in a single browser tab — cross-tab coordination remains out of scope.

**Alternatives considered**:
- No concurrency control (leave to caller): Rejected because write interleaving is a data corruption risk that the data layer should prevent.
- Cross-tab locking via localStorage: Rejected as out of scope and complex. The existing app already handles single-tab sync.

## R-008: Blob Serialization Ownership

**Decision**: The data blob serialization/deserialization (`serializeToBlob`, `parseFromBlob` from `minifiedPayload.ts`) stays OUTSIDE the data layer. The data layer provides `readBlob()` and `writeBlob()` that accept/return raw strings. The SyncContext continues to handle serialization.

**Rationale**: The blob format is an app-level concern (it encodes app-specific settings like category colors, UI preferences). The data layer should not know about the blob's internal structure — it just stores and retrieves an opaque string. This keeps the data layer generic and avoids pulling in the complex minified payload logic.

**Alternatives considered**:
- Internalize blob serialization: Rejected because it would require the data layer to know about app-specific settings (colors, UI format, currency), violating separation of concerns.
- Remove blob support entirely: Rejected because it's a critical backup/restore mechanism.

## R-009: Totals Computation Ownership

**Decision**: Totals computation (`computeAllTotals`, `computeGrandTotals` from `src/lib/totals.ts`) stays OUTSIDE the data layer. The data layer provides `writeTotals()` that accepts pre-computed totals data. The SyncContext computes totals before calling the data layer.

**Rationale**: Totals computation requires business logic (mortgage exclusion, owner splitting, savings rates) that belongs in the app domain, not the persistence layer. The data layer just writes what it's given.

**Alternatives considered**:
- Internalize totals computation: Rejected because it couples the data layer to business rules, making it app-specific rather than extractable.

## R-010: Mortgage Category Logic

**Decision**: The mortgage category check (`isMortgageCategory` from `src/lib/mortgageCategory.ts`) stays OUTSIDE the data layer. The data layer stores expenses without distinguishing between mortgage and non-mortgage. The partition into separate sheets is handled by the caller providing two separate expense arrays.

**Rationale**: Whether an expense is "mortgage" is a business rule, not a storage concern. The current implementation already receives mortgage expenses as a separate field in `SyncPayload`. The data layer continues this pattern — it writes to the Mortgage sheet whatever the caller puts in the mortgage array.

**Alternatives considered**:
- Internalize mortgage detection: Rejected because it embeds a business categorization rule in the storage layer.
