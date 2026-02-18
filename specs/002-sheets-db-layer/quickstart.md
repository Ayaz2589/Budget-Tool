# Quickstart: Google Sheets Database Layer

**Feature Branch**: `002-sheets-db-layer`
**Date**: 2026-02-18

## Overview

The sheets-db module provides a database-style client for persisting budget data to Google Sheets. It abstracts away all Sheets API details (ranges, cells, tabs, batch requests) behind a clean entity-based interface.

## Installation

The module lives at `src/lib/sheets-db/` and is imported via:

```ts
import { createSheetsClient } from "@/lib/sheets-db";
// or via the backward-compatible barrel:
import { createSheetsClient } from "@/lib/googleSheets";
```

No additional dependencies required — the module uses `fetch` directly.

## Basic Usage

### 1. Create a client

```ts
const db = createSheetsClient({
  token: googleAccessToken,
  spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
});
```

### 2. Ensure schema exists

Call once after linking a spreadsheet. Creates any missing sheet tabs:

```ts
await db.ensureSchema();
```

### 3. Read data

```ts
const expenses = await db.expenses.readAll();
const mortgageExpenses = await db.expenses.readMortgage();
const income = await db.income.readAll();
const debts = await db.debts.readAll();
const payments = await db.debtPayments.readAll();
const transfers = await db.ownerTransfers.readAll();
const presets = await db.presets.readAll();
const blob = await db.dataBlob.read();
```

### 4. Write data

```ts
// Overwrite all expenses
await db.expenses.writeAll(myExpenses);

// Append new expenses without clearing
await db.expenses.append(newExpenses);

// Write totals
await db.totals.write(monthlyTotals, grandTotal);

// Write backup blob
await db.dataBlob.write(serializedBlob);
```

### 5. Full batch sync (primary push operation)

```ts
await db.batchSync({
  expenses,
  mortgageExpenses,
  income,
  debts,
  debtPayments,
  ownerTransfers,
  presetTransactions,
  months: monthlyTotals,
  grandTotal,
  dataBlob: serializedBlob,
});
```

### 6. Apply formatting (optional)

```ts
const sheetIds = await db.getSheetIds();
if (sheetIds) {
  await db.applyFormatting(sheetIds);
}
```

## Error Handling

All operations throw `SheetsDbError` with a discriminated `kind` field:

```ts
import { isSheetsDbError } from "@/lib/sheets-db";

try {
  await db.batchSync(payload);
} catch (err) {
  if (isSheetsDbError(err)) {
    switch (err.kind) {
      case "AUTH_ERROR":
        // Token expired — prompt re-authentication
        break;
      case "RATE_LIMIT":
        // Back off and retry after err.retryAfterMs
        break;
      case "VALIDATION_ERROR":
        // Bad data — check err.validationIssues
        break;
      case "NETWORK_ERROR":
        // No internet — show offline indicator
        break;
      case "SCHEMA_ERROR":
        // Missing tabs — call db.ensureSchema()
        break;
    }
  }
}
```

## Types

All entity types are exported from the module:

```ts
import type {
  Expense,
  Income,
  Debt,
  DebtPayment,
  OwnerTransfer,
  PresetTransaction,
  MonthTotals,
  ExpenseSource,
  SheetIds,
  SyncPayload,
  SheetsDbConfig,
  SheetsDbError,
} from "@/lib/sheets-db";
```

## Utility Functions

A few pure utilities are also exported for use outside of a client context:

```ts
import { extractSpreadsheetId } from "@/lib/sheets-db";

const id = extractSpreadsheetId(
  "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit"
);
// → "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
```

## Migration from `src/lib/sheets/`

During the transition period, the existing `@/lib/googleSheets` barrel re-export continues to work. Consumers can migrate at their own pace:

```ts
// Old (still works during transition):
import { readExpensesFromSheet } from "@/lib/googleSheets";
const expenses = await readExpensesFromSheet(token, id, "Expenses!A2:G");

// New:
import { createSheetsClient } from "@/lib/sheets-db";
const db = createSheetsClient({ token, spreadsheetId: id });
const expenses = await db.expenses.readAll();
```
