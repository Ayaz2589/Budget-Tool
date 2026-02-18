# Data Model: Google Sheets Database Layer

**Feature Branch**: `002-sheets-db-layer`
**Date**: 2026-02-18

## Entity Definitions

All entity types are defined within the data layer module (`src/lib/sheets-db/types.ts`). These are the canonical persistence-layer types.

### ExpenseSource

A union type representing known payment method sources.

| Value | Description |
| ----- | ----------- |
| `amex` | American Express |
| `amex-gold` | American Express Gold |
| `apple` | Apple Card |
| `visa` | Visa |
| `sapphire` | Chase Sapphire |
| `bank-of-america` | Bank of America |
| `wells-fargo` | Wells Fargo |
| `chase` | Chase |
| `manual` | Manually entered |
| `td` | TD Bank |

**Default**: `manual` (used when an unrecognized source is read from storage).

### Expense

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Unique identifier (generated via `crypto.randomUUID` or equivalent) |
| `date` | `string` | Yes | ISO 8601 date (YYYY-MM-DD) |
| `amount` | `number` | Yes | Positive decimal amount |
| `description` | `string` | Yes | Transaction description |
| `category` | `string` | Yes | User-assigned category (empty string = uncategorized) |
| `source` | `ExpenseSource` | Yes | Payment method |
| `owner` | `string` | No | Name of the owner responsible for this expense |
| `paidByOwner` | `string` | No | Name of the owner who actually paid |
| `allocationMode` | `string` | No | How the expense is split between owners |
| `allocation` | `ExpenseAllocation` | No | Detailed split allocation |

**Validation rules**:
- `id` must be non-empty string
- `date` must parse as valid ISO date
- `amount` must be a finite number > 0
- `source` must be a recognized `ExpenseSource` value (falls back to `manual`)

### Income

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Unique identifier |
| `date` | `string` | Yes | ISO 8601 date |
| `amount` | `number` | Yes | Positive decimal amount |
| `description` | `string` | Yes | Income description |
| `category` | `string` | Yes | User-assigned category |
| `owner` | `string` | No | Name of the owner |

**Validation rules**: Same ID, date, and amount rules as Expense.

### Debt

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Unique identifier |
| `name` | `string` | Yes | Debt name/label |
| `initialAmount` | `number` | Yes | Original debt amount |
| `startDate` | `string` | No | ISO 8601 date when debt was incurred |
| `owner` | `string` | No | Name of the owner |

**Validation rules**:
- `id` must be non-empty string
- `name` must be non-empty string
- `initialAmount` must be a finite number > 0

### DebtPayment

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Unique identifier |
| `debtId` | `string` | Yes | References a `Debt.id` |
| `date` | `string` | Yes | ISO 8601 date |
| `amount` | `number` | Yes | Payment amount |
| `note` | `string` | No | Optional note |

**Validation rules**:
- `id` and `debtId` must be non-empty strings
- `date` must parse as valid ISO date
- `amount` must be a finite number > 0

### OwnerTransfer

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Unique identifier |
| `date` | `string` | Yes | ISO 8601 date |
| `fromOwner` | `string` | Yes | Sending owner |
| `toOwner` | `string` | Yes | Receiving owner |
| `amount` | `number` | Yes | Transfer amount |
| `note` | `string` | No | Optional note |

**Validation rules**:
- `id`, `fromOwner`, `toOwner` must be non-empty strings
- `fromOwner` must differ from `toOwner`
- `date` must parse as valid ISO date
- `amount` must be a finite number > 0

### PresetTransaction

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `id` | `string` | Yes | Unique identifier |
| `source` | `ExpenseSource` | Yes | Default payment method |
| `description` | `string` | Yes | Template description |
| `amount` | `number` | No | Default amount (if fixed) |
| `category` | `string` | Yes | Default category |
| `owner` | `string` | Yes | Default owner |

**Validation rules**:
- `id` must be non-empty string
- `source` must be a recognized `ExpenseSource`

### ExpenseAllocation

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `[ownerName: string]` | `number` | Yes | Percentage or fixed amount per owner |

### MonthTotals

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `monthKey` | `string` | Yes | Month identifier (e.g., "2026-01") |
| `monthLabel` | `string` | Yes | Human-readable label (e.g., "January 2026") |
| `totalEarned` | `number` | Yes | Sum of all income |
| `totalSpent` | `number` | Yes | Sum of all expenses |
| `totalSpentWithoutMortgage` | `number` | Yes | Expenses excluding mortgage |
| `sharedSpent` | `number` | Yes | Shared expenses total |
| `sharedSplit` | `number` | Yes | Per-person share of shared expenses |
| `ownerSpending` | `Record<string, number>` | Yes | Spending per owner |
| `ownerBalances` | `Record<string, number>` | Yes | Balance per owner |
| `totalSaved` | `number` | Yes | Total saved this month |
| `personalSavingsRate` | `number` | Yes | Savings rate percentage |
| `hysa` | `number` | No | High-yield savings account balance |
| `investingSp500` | `number` | No | S&P 500 investment amount |
| `investingTotal` | `number` | No | Total investment amount |

### SheetIds

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `expenses` | `number` | Yes | Numeric sheet ID for Expenses tab |
| `mortgage` | `number` | Yes | Numeric sheet ID for Mortgage tab |
| `income` | `number` | Yes | Numeric sheet ID for Income tab |
| `debts` | `number` | Yes | Numeric sheet ID for Debts tab |
| `debtPayments` | `number` | Yes | Numeric sheet ID for DebtPayments tab |
| `ownerTransfers` | `number` | Yes | Numeric sheet ID for OwnerTransfers tab |
| `presetTransactions` | `number` | Yes | Numeric sheet ID for PresetTransactions tab |
| `totals` | `number` | Yes | Numeric sheet ID for Totals tab |

## Entity Relationships

```
Debt ──< DebtPayment        (one-to-many via debtId)
Expense ──< ExpenseAllocation (one-to-one embedded, optional)
OwnerTransfer: fromOwner ──> Owner, toOwner ──> Owner
PresetTransaction: template for creating Expenses
MonthTotals: derived aggregation from Expense + Income + OwnerTransfer
DataBlob: opaque backup containing all of the above
```

## Storage Schema Mapping

Each entity maps to a Google Sheets tab with fixed column order:

| Entity | Sheet Tab | Column Layout (A→) |
| ------ | --------- | ------------------- |
| Expense | `Expenses` | ID, Date, Amount, Description, Category, Source, Owner |
| Expense (mortgage) | `Mortgage` | ID, Date, Amount, Description, Category, Source, Owner |
| Income | `Income` | ID, Date, Amount, Description, Category, Owner |
| Debt | `Debts` | Id, Name, Initial Amount, Start Date, Owner |
| DebtPayment | `DebtPayments` | Id, Debt Id, Date, Amount, Note |
| OwnerTransfer | `OwnerTransfers` | Id, Date, From Owner, To Owner, Amount, Note |
| PresetTransaction | `PresetTransactions` | Id, Source, Description, Category, Owner |
| MonthTotals | `Totals` | Dynamic columns based on owners |
| DataBlob | `Data` | Single cell A1 (opaque string) |

## Legacy Format Handling

The data layer must detect and handle legacy row formats:

| Format | Detection | Handling |
| ------ | --------- | -------- |
| Modern (with ID) | `row[0]` is not a date AND `row.length >= 7` | Parse normally |
| Legacy (no ID) | `row[0]` looks like a date OR `row.length < 7` | Generate ID, shift column indices |
| Serial date numbers | `row[N]` is a pure number in date column | Convert via serial-to-ISO calculation |
| Corrupted dates | `row[N]` fails ISO parse | Attempt repair, fallback to null |
| Unknown expense source | `source` not in `ALL_EXPENSE_SOURCES` | Fallback to `manual` |
| "Uncategorized" category | String is "Uncategorized" or empty | Normalize to empty string |
