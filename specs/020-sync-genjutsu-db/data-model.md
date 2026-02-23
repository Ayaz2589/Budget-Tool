# Data Model: Migrate Google Sync to genjutsu-db

## genjutsu-db Model Definitions

Seven domain models map 1:1 to the 7 transactional Google Sheet tabs. Two special cases (Data blob, Totals) are handled outside the model system.

### 1. Expense Model → "Expenses" tab

```
Sheet: "Expenses"
Columns: ID | Date | Amount | Description | Category | Source | Owner
```

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | string | primaryKey | Generated via `generateId()` |
| date | string | required | ISO format (YYYY-MM-DD) |
| amount | number | required | Positive, currency-stripped |
| description | string | required | Free text |
| category | string | optional | Empty string = uncategorized |
| source | string | optional | ExpenseSource union, defaults to "manual" |
| owner | string | optional | Owner name or empty |

**Special**: Legacy rows (pre-ID format) have date in column A. `hasIdColumn()` detection required in parseRow.

### 2. Mortgage Model → "Mortgage" tab

```
Sheet: "Mortgage"
Columns: ID | Date | Amount | Description | Category | Source | Owner
```

Same schema as Expense. Category forced to "Mortgage" on read. Separate tab for reporting isolation.

### 3. Income Model → "Income" tab

```
Sheet: "Income"
Columns: Date | Amount | Description | Category | Owner
```

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| date | string | required | ISO format |
| amount | number | required | Positive |
| description | string | required | Free text |
| category | string | optional | Empty = uncategorized |
| owner | string | optional | Owner name |

**Note**: No ID column in the sheet. IDs are generated client-side on read/import.

### 4. Debt Model → "Debts" tab

```
Sheet: "Debts"
Columns: Id | Name | Initial Amount | Start Date | Owner
```

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | string | primaryKey | Unique debt identifier |
| name | string | required | Debt name/label |
| initialAmount | number | required | Starting balance |
| startDate | string | optional | ISO format |
| owner | string | optional | Owner name |

### 5. DebtPayment Model → "DebtPayments" tab

```
Sheet: "DebtPayments"
Columns: Id | Debt Id | Date | Amount | Note
```

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | string | primaryKey | Unique payment identifier |
| debtId | string | required | References Debt.id |
| date | string | required | ISO format |
| amount | number | required | Payment amount |
| note | string | optional | Free text |

### 6. OwnerTransfer Model → "OwnerTransfers" tab

```
Sheet: "OwnerTransfers"
Columns: Id | Date | From Owner | To Owner | Amount | Note
```

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | string | primaryKey | Unique transfer identifier |
| date | string | required | ISO format |
| fromOwner | string | required | Source owner name |
| toOwner | string | required | Target owner name |
| amount | number | required | Transfer amount |
| note | string | optional | Free text |

### 7. PresetTransaction Model → "PresetTransactions" tab

```
Sheet: "PresetTransactions"
Columns: Id | Source | Description | Category | Owner
```

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | string | primaryKey | Unique preset identifier |
| source | string | optional | Card source |
| description | string | required | Template description |
| category | string | optional | Default category |
| owner | string | optional | Default owner |

## Special Cases (Not Models)

### Data Blob — "Data" tab, cell A1

Single cell containing gzip + Base64 compressed JSON with "V2" prefix. Contains full app state snapshot. Read/written as raw cell value, not a model.

### Totals — "Totals" tab

Dynamic columns based on owner count:
- Fixed: Month, Total Earned, Total Spent, Total Spent w/o Mortgage, Shared Spent
- Dynamic: {Owner}'s Spending (one per owner), {Owner}'s Balance (one per owner)
- Fixed: Total Saved, Personal Savings Rate, HYSA, Investing (S&P 500), Investing Total

Written as raw values via batch update. Not a model due to variable column schema.

## Formatting Rules

Applied via `db.applyFormatting()` on model schemas:

| Sheet | Header Format | Cell Format |
|-------|---------------|-------------|
| All sheets | Bold, 12pt, left-aligned | Left-aligned |
| Expenses/Mortgage | — | Column C (Amount): `$#,##0.00` |
| Income | — | Column B (Amount): `$#,##0.00` |
| Debts | — | Column C (Initial Amount): `$#,##0.00` |
| DebtPayments | — | Column D (Amount): `$#,##0.00` |
| OwnerTransfers | — | Column E (Amount): `$#,##0.00` |
| Totals | Bold, 12pt | Currency columns: `$#,##0.00`, Savings Rate: `0.0%` |

## Relationship to App Types

| genjutsu-db Model | App Type (`src/types/core.ts`) | Mapping |
|---|---|---|
| Expense | `Expense` | Direct — fields match with minor naming differences |
| Income | `Income` | Direct |
| Debt | `Debt` | Direct |
| DebtPayment | `DebtPayment` | Direct |
| OwnerTransfer | `OwnerTransfer` | Direct |
| PresetTransaction | `PresetTransaction` | Direct |

The model's `parseRow()` converts sheet row arrays into app type objects. The model's `toRow()` converts app type objects into sheet row arrays. These replace the manual parsing currently in `expenses.ts`, `income.ts`, `debts.ts`, `transfers.ts`.
