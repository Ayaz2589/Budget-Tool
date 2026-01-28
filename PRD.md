# Product Requirements Document (PRD)

## Budget Tool — What Was Done So Far

**Last updated:** January 2026

---

## 1. Overview

Budget Tool is a personal budgeting application for a couple (you and your wife, Tasnuva) to:

- Import transaction CSVs from **American Express** and **Apple Card** (Chase not supported yet).
- Categorize spending as **My Purchase**, **Tasnuva's Purchases**, **50/50**, or **Mortgage** (and optionally uncategorized).
- Track **income** (e.g. Rent, Paycheck, Bonus) and **expenses** in one place.
- Compute **totals** by month: Total Earned, Total Spent, Total Spent w/o Mortgage, 50/50 Split, Nova’s/your spending, I Owe Nova, savings, etc.
- **Sync** expenses, income, and totals to a **Google Sheet** (manual “Sync to Google Sheets” from Settings). **Restore from Sheet** loads data from the Sheet into the app (e.g. after clearing local storage).
- **Add transactions manually** (date, amount, description, category, source, card member). Source options: Manual, Debit (TD Bank), American Express, Apple Card, Chase. Card member is a dropdown (from existing data or default AYAZ UDDIN / TASNUVA AHMED).
- **View** dashboard and transactions **by month** (month selector, spending-by-month table, bar chart, transactions grouped by month).

The app replaces a manual Google Sheet workflow while keeping a similar structure (Expenses table, Income table, Totals sheet).

---

## 2. Goals & User Context

- **Users:** You and your wife (Tasnuva / “Nova”).
- **Spending split:** Track what is yours, hers, shared (50/50), and mortgage.
- **Multi-family home:** Track **mortgage** and **tenant income** (e.g. Rent category).
- **Single source of truth:** Data lives in the app. **Sync to Google Sheets** overwrites the Sheet with app data (push only). **Restore from Sheet** pulls data from the Sheet into the app (pull only), e.g. after clearing local storage.

---

## 3. Data Model

### 3.1 Expense

| Field         | Type    | Description                                                                          |
| ------------- | ------- | ------------------------------------------------------------------------------------ |
| `id`          | string  | Unique ID (hash of date + description + amount + cardMember for dedup).              |
| `date`        | string  | ISO date `YYYY-MM-DD`.                                                               |
| `amount`      | number  | Positive (expense amount).                                                           |
| `description` | string  | Cleaned merchant/transaction description.                                            |
| `category`    | string  | One of: My Purchase, Tasnuva's Purchases, 50/50, Mortgage, or empty (Uncategorized). |
| `source`      | string  | `amex` \| `chase` \| `apple` \| `manual` \| `td` (Debit / TD Bank).                  |
| `cardMember`  | string? | Raw from CSV (e.g. "AYAZ UDDIN", "TASNUVA AHMED") for Amex/Apple attribution.        |

### 3.2 Income

| Field         | Type   | Description                              |
| ------------- | ------ | ---------------------------------------- |
| `id`          | string | Unique ID.                               |
| `date`        | string | ISO date `YYYY-MM-DD`.                   |
| `amount`      | number | Positive.                                |
| `description` | string | e.g. "Basement Rent", "Paycheck".        |
| `category`    | string | Rent, Paycheck, Bonus, Other (defaults). |

### 3.3 Categories

- **Expense (default):** My Purchase, Tasnuva's Purchases, 50/50, Mortgage.
- **Income (default):** Rent, Paycheck, Bonus, Other.

Categories are used in dropdowns and for totals logic. Custom categories can be added via rules; totals logic uses the above names for 50/50, Tasnuva’s, and Mortgage.

---

## 4. Features Implemented

### 4.1 CSV Import

- **Banks supported:** American Express, Apple Card. **Chase is not implemented.**
- **Flow:** User **selects the bank from a dropdown** (American Express or Apple Card), then chooses a CSV file. There is **no auto-detect**; the selected bank is always used to parse the file.
- **Parsers:**
  - **Amex:** Columns `Date`, `Description`, `Card Member`, `Account #`, `Amount`. Date `MM/DD/YYYY` or `MM/DD/YY` → `YYYY-MM-DD`. Dedup via hash of date + description + amount + cardMember.
  - **Apple Card:** Columns `Transaction Date`, `Clearing Date`, `Description`, `Merchant`, `Category`, `Type`, `Amount (USD)`, `Purchased By`. Only rows with Type **Purchase** or **Installment** are imported (Payment rows skipped). Quoted CSV fields supported; BOM stripped.
- **After import:** Rules and baseline rules are applied; user sees a **preview** with editable category per row, then clicks **“Add to transactions”** to merge into the app’s transaction list (and persist to localStorage).

### 4.2 Category Rules

- **Pattern rules:** User-defined rules of the form “if description contains pattern (case-insensitive) → set category.” First matching rule wins; only applied to **uncategorized** expenses.
- **Baseline rules (hardcoded, applied after pattern rules):**
  1. **Apple Card** → category **My Purchase**.
  2. **Card Member = TASNUVA AHMED** → **Tasnuva's Purchases**.
  3. **UBER EATS** in description, card member not Tasnuva, amount &lt; $25 → **My Purchase**.
- **UI:** Category Rules page to add/remove pattern rules. “Re-apply rules” on Transactions page reapplies pattern + baseline to uncategorized rows.

### 4.3 Description Cleanup

- **Clean descriptions:** For Amex/Apple Pay–style descriptions: strip `AplPay ` prefix, remove trailing domain + state (e.g. ` help.uber.com CA`), collapse spaces. Applied in Amex parser and via a **“Clean descriptions”** button on the Transactions page for existing rows.

### 4.4 Transactions UI

- **Add transaction (manual):** "Add transaction" button opens a dialog. User enters date, amount, description, category, **source** (Manual, Debit (TD Bank), American Express, Apple Card, Chase), and optional **card member** (dropdown: unique values from existing expenses or default AYAZ UDDIN / TASNUVA AHMED). New rows get a generated id and persist like imported transactions.
- **List:** All expenses with filters (month, source, category). List is **grouped by month** with a month header row (e.g. "January 2025") above each group. Inline category dropdown per row; delete single row.
- **Bulk actions:** Checkboxes, “Select all” (filtered), **Delete selected**, **Delete all** (with confirmation).
- **Display:** Source filter and table use friendly labels (e.g. American Express, Apple Card, Debit (TD Bank)). Category dropdowns are **wider** and **color-coded** (e.g. My Purchase = blue, Tasnuva’s = rose, 50/50 = amber, Mortgage = slate). **Staggered row colors** (alternating subtle background) for readability.

### 4.5 Income

- **Add income:** Form (date, amount, description, category). List of income entries with edit category and delete.
- **Categories:** Rent, Paycheck, Bonus, Other (color-coded in dropdowns).

### 4.6 Dashboard

- **View month:** A "View month" dropdown lets the user select which month's totals to show. Default is current month. Options include the current month plus every month that has expense/income data (newest first).
- **Summary cards:** Total Earned, Total Spent, Total Spent w/o Mortgage, 50/50 Split, Tasnuva's Total Spending, My Total Spending w/o Mortgage, Total Saved, Personal Savings Rate — all for the **selected month**.
- **All-time totals:** Single card with Total Earned, Total Spent, Total Saved across all months.
- **Spending by month (table):** Table with one row per month: Month, Total Earned, Total Spent, Spent w/o Mortgage, Total Saved, Savings Rate. Current month row is highlighted.
- **Monthly breakdown (bar chart):** Bar chart (recharts) showing **Total Earned** vs **Total Spent** per month (chronological order). Two bars per month; tooltip formats as currency; legend. Empty state if no data.
- **Totals:** Sourced from `lib/totals.ts` (see below).

### 4.7 Totals Logic

- **Per month:** totalEarned, totalSpent, totalSpentWithoutMortgage, total5050Spent, split5050 (half of 50/50), tasnuvasPurchase, tasnuvasTotalSpending (her purchases + her half of 50/50), iOweNova (manual per month), myTotalSpendingWithoutMortgage, totalSaved, personalSavingsRate, hysa, investingSp500, investingTotal.
- **My total spending:** Expenses in categories other than Tasnuva’s, 50/50, and Mortgage, plus your half of 50/50.
- **I Owe Nova, HYSA, Investing:** Stored per month in app state and included in Totals; editable in UI where implemented.

### 4.8 Google Sheets Sync

- **Auth:** Google OAuth (e.g. `@react-oauth/google`). Requires `VITE_GOOGLE_CLIENT_ID` in `.env`. If not set, app shows a fallback and does not initialize the Google client (avoids “Missing required parameter client_id”).
- **Spreadsheet:** User pastes spreadsheet ID or URL in Settings. App can use an **empty** sheet; it creates/ensures required sheets and structure.
- **Sync to Google Sheets (push only):** "Sync to Google Sheets" in Settings **overwrites** the Sheet with the app's current state. Clears and writes **Expenses** (6 columns: Date, Amount, Description, Category, **Source**, **Card Member**), **Income** table, and **Totals** sheet (monthly rows + TOTALS row). If the user deletes all transactions in the app and syncs, the Sheet is updated to match (empty expenses/income).
- **Restore from Sheet (pull only):** "Restore from Sheet" in Settings **reads** the Expenses and Income sheets and **merges** rows into the app (add-only by key: date + description + amount). Use case: e.g. after clearing local storage, load data back from the Sheet. Sheet-originated expenses get `source` and `cardMember` from columns when present; older 4-column sheets default to `manual` / no card member.
- **Formatting:** Left-align cells, **Amount** columns as currency ($), **header row** bold and larger font (applied via Sheets API `batchUpdate` after data write).
- **When sync runs:** Only when the user clicks the sync or restore button. No automatic or periodic sync.

### 4.9 Persistence

- **localStorage:** Expenses, income, category rules, I Owe Nova (and related state), and spreadsheet ID are persisted so they survive refresh. No expiry; data stays until the user or browser clears storage.
- **Clearing localStorage:** Wipes all app data (transactions, income, rules, spreadsheet ID). **Does not** change the Google Sheet. If the user then syncs, the app overwrites the Sheet with the current (empty) app data.

### 4.10 Settings

- **Google:** Connect/disconnect, set spreadsheet URL/ID. **Restore from Sheet** (pull only: load data from Sheet into app) and **Sync to Google Sheets** (push only: overwrite Sheet with app data). Sync/restore status and error message displayed on failure.
- **OAuth testing:** For “Access blocked: app has not completed verification,” add test users in the Google Cloud OAuth consent screen so they can sign in.

---

## 5. Technical Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, recharts (Dashboard bar chart).
- **State:** React context (BudgetContext, RulesContext, GoogleAuthContext); localStorage for persistence.
- **No backend:** All logic and storage in the browser; Google Sheets API called from the client with the user’s OAuth token.

---

## 6. Out of Scope / Not Done

- **Chase CSV import:** Parser not implemented; import flow does not include Chase. Manual transactions can be tagged with source Chase.
- **Auto-detect CSV source:** Removed; user must select American Express or Apple Card manually.
- **Encryption of localStorage:** Discussed but not implemented; data is stored in plain JSON.
- **Recurring / scheduled sync:** Sync and restore are manual only.

---

## 7. File / Module Overview

| Area            | Path / files                                                                 |
| --------------- | ---------------------------------------------------------------------------- |
| Types           | `src/lib/types.ts` (Expense, Income, categories)                             |
| Parsers         | `src/lib/parsers/amex.ts`, `apple.ts`, `index.ts` (no Chase)                 |
| Category rules  | `src/lib/categoryRules.ts` (pattern + baseline)                              |
| Totals          | `src/lib/totals.ts` (getMonthLabel exported for Dashboard/Transactions)      |
| Google Sheets   | `src/lib/googleSheets.ts` (read/write Expenses 6-col, Income, Totals)        |
| Category colors | `src/lib/categoryColors.tsx` (colors + CategoryOption component)             |
| Context         | `src/context/BudgetContext.tsx`, `RulesContext.tsx`, `GoogleAuthContext.tsx` |
| Pages           | Dashboard, Import, Transactions, Income, Category Rules, Settings            |

---

This PRD summarizes what was built so far and is intended to stay in sync with the codebase as the product evolves.
