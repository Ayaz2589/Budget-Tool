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
- **Sync** expenses, income, and totals to a **Google Sheet** (manual “Sync to Google Sheets” from Settings).

The app replaces a manual Google Sheet workflow while keeping a similar structure (Expenses table, Income table, Totals sheet).

---

## 2. Goals & User Context

- **Users:** You and your wife (Tasnuva / “Nova”).
- **Spending split:** Track what is yours, hers, shared (50/50), and mortgage.
- **Multi-family home:** Track **mortgage** and **tenant income** (e.g. Rent category).
- **Single source of truth:** Data lives in the app (and optionally in a Google Sheet after sync). The app does **not** read from the Sheet; it only writes to it.

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
| `source`      | string  | `amex` \| `chase` \| `apple` \| `manual`.                                            |
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

- **List:** All expenses with filters (month, source, category). Inline category dropdown per row; delete single row.
- **Bulk actions:** Checkboxes, “Select all” (filtered), **Delete selected**, **Delete all** (with confirmation).
- **Display:** Category dropdowns are **wider** and **color-coded** (e.g. My Purchase = blue, Tasnuva’s = rose, 50/50 = amber, Mortgage = slate). **Staggered row colors** (alternating subtle background) for readability.

### 4.5 Income

- **Add income:** Form (date, amount, description, category). List of income entries with edit category and delete.
- **Categories:** Rent, Paycheck, Bonus, Other (color-coded in dropdowns).

### 4.6 Dashboard

- **Summary cards:** Total Earned, Total Spent, Total Spent w/o Mortgage, 50/50 Split, Tasnuva’s Purchases, My Spending, etc., for the selected period (e.g. current month or all).
- **Totals:** Sourced from `lib/totals.ts` (see below).

### 4.7 Totals Logic

- **Per month:** totalEarned, totalSpent, totalSpentWithoutMortgage, total5050Spent, split5050 (half of 50/50), tasnuvasPurchase, tasnuvasTotalSpending (her purchases + her half of 50/50), iOweNova (manual per month), myTotalSpendingWithoutMortgage, totalSaved, personalSavingsRate, hysa, investingSp500, investingTotal.
- **My total spending:** Expenses in categories other than Tasnuva’s, 50/50, and Mortgage, plus your half of 50/50.
- **I Owe Nova, HYSA, Investing:** Stored per month in app state and included in Totals; editable in UI where implemented.

### 4.8 Google Sheets Sync

- **Auth:** Google OAuth (e.g. `@react-oauth/google`). Requires `VITE_GOOGLE_CLIENT_ID` in `.env`. If not set, app shows a fallback and does not initialize the Google client (avoids “Missing required parameter client_id”).
- **Spreadsheet:** User pastes spreadsheet ID or URL in Settings. App can use an **empty** sheet; it creates/ensures required sheets and structure.
- **Sync action:** **“Sync to Google Sheets”** in Settings. Pushes current state: clears and writes **Expenses** table, **Income** table, and **Totals** sheet (monthly rows + TOTALS row). **App is source of truth;** sync overwrites Sheet data with app data.
- **Formatting:** Left-align cells, **Amount** columns as currency ($), **header row** bold and larger font (applied via Sheets API `batchUpdate` after data write).
- **When sync runs:** Only when the user clicks the sync button. No automatic or periodic sync.

### 4.9 Persistence

- **localStorage:** Expenses, income, category rules, I Owe Nova (and related state), and spreadsheet ID are persisted so they survive refresh. No expiry; data stays until the user or browser clears storage.
- **Clearing localStorage:** Wipes all app data (transactions, income, rules, spreadsheet ID). **Does not** change the Google Sheet. If the user then syncs, the app overwrites the Sheet with the current (empty) app data.

### 4.10 Settings

- **Google:** Connect/disconnect, set spreadsheet URL/ID, **Sync to Google Sheets**. Sync error message displayed on failure.
- **OAuth testing:** For “Access blocked: app has not completed verification,” add test users in the Google Cloud OAuth consent screen so they can sign in.

---

## 5. Technical Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **State:** React context (BudgetContext, RulesContext, GoogleAuthContext); localStorage for persistence.
- **No backend:** All logic and storage in the browser; Google Sheets API called from the client with the user’s OAuth token.

---

## 6. Out of Scope / Not Done

- **Chase CSV:** Parser not implemented; dropdown and import flow do not include Chase.
- **Auto-detect CSV source:** Removed; user must select American Express or Apple Card manually.
- **Encryption of localStorage:** Discussed but not implemented; data is stored in plain JSON.
- **Reading from Google Sheets:** App only writes to the Sheet; it does not import from Sheets.
- **Recurring / scheduled sync:** Sync is manual only.

---

## 7. File / Module Overview

| Area            | Path / files                                                                 |
| --------------- | ---------------------------------------------------------------------------- |
| Types           | `src/lib/types.ts` (Expense, Income, categories)                             |
| Parsers         | `src/lib/parsers/amex.ts`, `apple.ts`, `index.ts` (no Chase)                 |
| Category rules  | `src/lib/categoryRules.ts` (pattern + baseline)                              |
| Totals          | `src/lib/totals.ts`                                                          |
| Google Sheets   | `src/lib/googleSheets.ts`                                                    |
| Category colors | `src/lib/categoryColors.tsx` (colors + CategoryOption component)             |
| Context         | `src/context/BudgetContext.tsx`, `RulesContext.tsx`, `GoogleAuthContext.tsx` |
| Pages           | Dashboard, Import, Transactions, Income, Category Rules, Settings            |

---

This PRD summarizes what was built so far and is intended to stay in sync with the codebase as the product evolves.
