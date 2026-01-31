# Data model

## Core types

Defined in **src/lib/types.ts**.

| Type | Description |
|------|-------------|
| **ExpenseSource** | Union: `"amex"` \| `"amex-gold"` \| `"chase"` \| `"apple"` \| `"manual"` \| `"td"`. |
| **Expense** | id, date (YYYY-MM-DD), amount, description, category, source (ExpenseSource), cardMember? |
| **Income** | id, date, amount, description, category, owner?, recurringAmount?, recurringFrequency?, recurringDayOfMonth?, recurringStartDate? |
| **Debt** | id, name, initialAmount, startDate?, owner?, recurringAmount?, recurringFrequency?, recurringDayOfMonth?, recurringStartDate? |
| **DebtPayment** | id, debtId, date, amount, note? |
| **PresetTransaction** | id, source (ExpenseSource), description, category, cardMember |

**ALL_EXPENSE_SOURCES** — Array of all ExpenseSource values; used for defaults and Settings card sources.

## localStorage keys

| Key | Content |
|-----|---------|
| **budget-tool-data** | JSON: expenses, income, debts, debtPayments, iOweNova, cardSources. |
| **budget-tool-rules** | JSON: rules array. |
| **budget-tool-preset-transactions** | JSON: preset transactions array. |
| **budget-tool-spreadsheet-id** | Spreadsheet ID string. |
| **budget-tool-google-access-token** | JSON: { access_token, expires_at? }. |
| **ortho-locale** | Locale string (en, es, bn, zh, ko, hi, ja). |

## Minified payload (V2 blob)

Used in PDF export/import and Google Sheets Data tab. Format: string prefix `V2` + Base64(gzip(JSON(payload))).

**Minified keys in payload:**

| Key | Meaning |
|-----|---------|
| e | expenses (array of minified expense objects) |
| i | income |
| d | debts |
| dp | debtPayments |
| r | rules |
| pt | presetTransactions |
| ec | expenseCategoriesWithColors (array of { n, c }) |
| ic | incomeCategoriesWithColors (array of { n, c }) |
| sc | cardSources (string array) |

**Per-item short keys (e.g. expense):** i (id), d (date), a (amount), desc (description), c (category), s (source), cm (cardMember).

Build/expand: **src/lib/minifiedPayload.ts** — `buildMinifiedPayload`, `expandPayload`, `serializeToBlob`, `parseFromBlob`.
