# Quickstart: Migrate Google Sync to genjutsu-db

## Installation

```bash
bun add genjutsu-db
```

## Model Definitions (src/lib/sheets/models.ts)

```typescript
import { defineModel, field } from "genjutsu-db";

export const ExpenseModel = defineModel("Expenses", {
  id: field.string().primaryKey(),
  date: field.string(),
  amount: field.number(),
  description: field.string(),
  category: field.string().optional().default(""),
  source: field.string().optional().default("manual"),
  owner: field.string().optional().default(""),
});

// Mortgage uses same schema, different sheet name
export const MortgageModel = defineModel("Mortgage", {
  id: field.string().primaryKey(),
  date: field.string(),
  amount: field.number(),
  description: field.string(),
  category: field.string().optional().default("Mortgage"),
  source: field.string().optional().default("manual"),
  owner: field.string().optional().default(""),
});

export const IncomeModel = defineModel("Income", {
  date: field.string().primaryKey(), // No ID column — date as PK proxy
  amount: field.number(),
  description: field.string(),
  category: field.string().optional().default(""),
  owner: field.string().optional().default(""),
});

export const DebtModel = defineModel("Debts", {
  id: field.string().primaryKey(),
  name: field.string(),
  initialAmount: field.number(),
  startDate: field.string().optional(),
  owner: field.string().optional().default(""),
});

export const DebtPaymentModel = defineModel("DebtPayments", {
  id: field.string().primaryKey(),
  debtId: field.string(),
  date: field.string(),
  amount: field.number(),
  note: field.string().optional().default(""),
});

export const OwnerTransferModel = defineModel("OwnerTransfers", {
  id: field.string().primaryKey(),
  date: field.string(),
  fromOwner: field.string(),
  toOwner: field.string(),
  amount: field.number(),
  note: field.string().optional().default(""),
});

export const PresetTransactionModel = defineModel("PresetTransactions", {
  id: field.string().primaryKey(),
  source: field.string().optional().default(""),
  description: field.string(),
  category: field.string().optional().default(""),
  owner: field.string().optional().default(""),
});
```

## Client Factory (src/lib/sheets/client.ts)

```typescript
import { createClient } from "genjutsu-db";
import {
  ExpenseModel, MortgageModel, IncomeModel,
  DebtModel, DebtPaymentModel,
  OwnerTransferModel, PresetTransactionModel,
} from "./models";

export function createSheetsClient(spreadsheetId: string, getToken: () => Promise<string>) {
  return createClient({
    spreadsheetId,
    auth: getToken,
    schemas: {
      expenses: ExpenseModel,
      mortgage: MortgageModel,
      income: IncomeModel,
      debts: DebtModel,
      debtPayments: DebtPaymentModel,
      ownerTransfers: OwnerTransferModel,
      presetTransactions: PresetTransactionModel,
    },
  });
}

export type SheetsClient = ReturnType<typeof createSheetsClient>;
```

## Push Usage (in SyncContext)

```typescript
// Before:
await syncAllSheetsBatch(accessToken, spreadsheetId, {
  expenses, mortgageExpenses, income, debts, debtPayments,
  ownerTransfers, presetTransactions, dataBlob, months, grandTotal,
});

// After:
await db.batchSync({
  expenses: regularExpenses,
  mortgage: mortgageExpenses,
  income: incomeRecords,
  debts: debtRecords,
  debtPayments: debtPaymentRecords,
  ownerTransfers: transferRecords,
  presetTransactions: presetRecords,
});
// Data blob and Totals written separately (special cases)
```

## Pull Usage (in SyncContext)

```typescript
// Before:
const expenses = await readExpensesFromSheet(accessToken, spreadsheetId);
const income = await readIncomeFromSheet(accessToken, spreadsheetId);

// After:
const expenses = await db.repo("expenses").readAll();
const income = await db.repo("income").readAll();
```

## Sheet Setup Usage (in SheetSetupContext)

```typescript
// Before:
await ensureSheetsExist(accessToken, spreadsheetId);

// After:
await db.ensureSchema();
await db.applyFormatting();
```

## Error Handling

```typescript
import { isGenjutsuError } from "genjutsu-db";

try {
  await db.batchSync(payload);
} catch (err) {
  if (isGenjutsuError(err)) {
    switch (err.kind) {
      case "AUTH_ERROR":
        clearSession(); // Same as current 401 handling
        break;
      case "RATE_LIMIT":
        scheduleRetry(err.retryAfterMs ?? 3000);
        break;
      default:
        dispatch({ type: "SYNC_ERROR", payload: err.message });
    }
  }
}
```

## Utility Imports

```typescript
// Before:
import { generateId, parseAmount, normalizeDate } from "@/lib/sheets/api";
import { extractSpreadsheetId } from "@/lib/sheets/api";

// After:
import { generateId, parseAmount, normalizeDate, extractSpreadsheetId } from "genjutsu-db";
```
