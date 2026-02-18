# Quickstart: Generic Sheets Database Library

**Feature**: 003-generic-sheets-db

## Scenario 1: Define a schema and CRUD records (US1)

```typescript
import { createSheetsClient } from "@/lib/sheets-db";
import type { SheetSchema } from "@/lib/sheets-db";

// 1. Define your entity type
interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// 2. Define the schema
const contactSchema: SheetSchema<Contact> = {
  sheetName: "Contacts",
  headers: ["ID", "Name", "Email", "Phone"],
  readRange: "Contacts!A1:D",
  writeRange: "Contacts!A1:D",
  clearRange: "Contacts!A1:D10000",
  appendSupported: true,

  parseRow(row) {
    const id = String(row[0] ?? "").trim();
    const name = String(row[1] ?? "").trim();
    const email = String(row[2] ?? "").trim();
    const phone = String(row[3] ?? "").trim();
    if (!id || !name) return null; // skip invalid rows
    return { id, name, email, phone };
  },

  toRow(contact) {
    return [contact.id, contact.name, contact.email, contact.phone];
  },

  validate(contact) {
    if (!contact.id) throw new Error("ID required");
    if (!contact.name) throw new Error("Name required");
  },
};

// 3. Create client and use it
const db = createSheetsClient({
  token: accessToken,
  spreadsheetId: sheetId,
  schemas: { contacts: contactSchema },
});

// Read
const contacts = await db.repo("contacts").readAll();

// Write
await db.repo("contacts").writeAll(myContacts);

// Append
await db.repo("contacts").append([newContact]);
```

## Scenario 2: Ortho domain layer using the generic library (US2)

```typescript
// src/lib/ortho-sheets/schemas/expenses.ts
import type { SheetSchema } from "@/lib/sheets-db";
import { normalizeDate, parseAmount, hasIdColumn, generateId } from "@/lib/sheets-db";
import type { Expense } from "../types";
import { validateExpense, validateExpenseSource, normalizeCategoryFromSheet } from "../normalize";

export const expenseSchema: SheetSchema<Expense> = {
  sheetName: "Expenses",
  headers: ["ID", "Date", "Amount", "Description", "Category", "Source", "Owner"],
  readRange: "Expenses!A1:G",
  writeRange: "Expenses!A1:G",
  clearRange: "Expenses!A1:G10000",
  appendSupported: true,
  formatting: [
    { startCol: 2, endCol: 3, numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
  ],
  headerFormatting: { bold: true, fontSize: 12, horizontalAlignment: "LEFT" },

  parseRow(row) {
    const looksLikeDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
    const isIdRow = hasIdColumn(row, 4, looksLikeDate);

    let id: string, dateRaw: unknown, amountRaw: unknown;
    let description: string, category: string, source: string, owner: string;

    if (isIdRow) {
      id = String(row[0] ?? "").trim();
      dateRaw = row[1]; amountRaw = row[2];
      description = String(row[3] ?? "").trim();
      category = normalizeCategoryFromSheet(String(row[4] ?? ""));
      source = validateExpenseSource(String(row[5] ?? ""));
      owner = String(row[6] ?? "").trim();
    } else {
      id = generateId();
      dateRaw = row[0]; amountRaw = row[1];
      description = String(row[2] ?? "").trim();
      category = normalizeCategoryFromSheet(String(row[3] ?? ""));
      source = validateExpenseSource(String(row[4] ?? ""));
      owner = String(row[5] ?? "").trim();
    }

    const date = normalizeDate(dateRaw);
    const amount = parseAmount(amountRaw);
    if (!date || amount == null || amount <= 0) return null;

    return { id, date, amount, description, category, source, owner };
  },

  toRow(expense) {
    return [
      expense.id,
      expense.date,
      expense.amount,
      expense.description,
      expense.category || "Uncategorized",
      expense.source,
      expense.owner ?? "",
    ];
  },

  validate: validateExpense,
};
```

```typescript
// src/lib/ortho-sheets/index.ts
import { createSheetsClient } from "@/lib/sheets-db";
import { expenseSchema } from "./schemas/expenses";
import { mortgageSchema } from "./schemas/expenses";
import { incomeSchema } from "./schemas/income";
import { debtSchema, debtPaymentSchema } from "./schemas/debts";
import { ownerTransferSchema, presetSchema } from "./schemas/transfers";
import { totalsSchema } from "./schemas/totals";
import { dataBlobSchema } from "./schemas/data-blob";

export const ORTHO_SCHEMAS = {
  expenses: expenseSchema,
  mortgage: mortgageSchema,
  income: incomeSchema,
  debts: debtSchema,
  debtPayments: debtPaymentSchema,
  ownerTransfers: ownerTransferSchema,
  presets: presetSchema,
  totals: totalsSchema,
  dataBlob: dataBlobSchema,
} as const;

export function createOrthoSheetsClient(config: { token: string; spreadsheetId: string }) {
  return createSheetsClient({ ...config, schemas: ORTHO_SCHEMAS });
}
```

## Scenario 3: Batch sync across all schemas (US3)

```typescript
import { createOrthoSheetsClient } from "@/lib/ortho-sheets";

const db = createOrthoSheetsClient({ token, spreadsheetId });

// Ensure all sheets exist
await db.ensureSchema();

// Batch sync — clears all sheets, writes all data in 2 API calls
await db.batchSync({
  expenses: nonMortgageExpenses,
  mortgage: mortgageExpenses,
  income: allIncome,
  debts: allDebts,
  debtPayments: allPayments,
  ownerTransfers: allTransfers,
  presets: allPresets,
  totals: totalsRows,
  dataBlob: [dataBlobString],
});

// Apply formatting
await db.applyFormatting();
```

## Scenario 4: Consumer migration in SyncContext (US2)

```typescript
// src/context/SyncContext.tsx — before (current)
import { createSheetsClient, isSheetsDbError } from "@/lib/sheets-db";

// src/context/SyncContext.tsx — after (migrated)
import { createOrthoSheetsClient } from "@/lib/ortho-sheets";
import { isSheetsDbError } from "@/lib/sheets-db";

// In runSync:
const db = createOrthoSheetsClient({ token: accessToken, spreadsheetId });
await db.ensureSchema();
await db.batchSync({ expenses, mortgage, income, debts, ... });

// In pullFromSheet:
const expenses = await db.repo("expenses").readAll();
const income = await db.repo("income").readAll();
```

## Scenario 5: Custom validation (US4)

```typescript
import type { SheetSchema } from "@/lib/sheets-db";
import { validationError } from "@/lib/sheets-db";

const orderSchema: SheetSchema<Order> = {
  sheetName: "Orders",
  headers: ["ID", "Customer", "Total", "Status"],
  readRange: "Orders!A1:D",
  writeRange: "Orders!A1:D",
  clearRange: "Orders!A1:D10000",

  parseRow(row) { /* ... */ },
  toRow(order) { /* ... */ },

  // Custom validator — called before every write
  validate(order) {
    const issues = [];
    if (!order.id) issues.push({ field: "id", message: "required" });
    if (order.total <= 0) issues.push({ field: "total", message: "must be positive" });
    if (issues.length > 0) {
      throw validationError(`Invalid Order: ${issues.map(i => i.message).join(", ")}`, issues);
    }
  },
};
```
