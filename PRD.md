# Product Requirements Document (PRD)

## Budget Tool — What Was Done So Far

**Last updated:** 2026-01-31

---

## Summary

Budget Tool (**Ortho**) is a personal budgeting app for a couple: import Amex/Apple Card CSVs, categorize spending (My, Tasnuva's, 50/50, Mortgage), track income, debts, and mortgage payments, sync to Google Sheets, and view a dashboard with monthly totals and charts. Add transactions manually (including multiple at once), manage gambit-style rules (with optional dashboard warnings when category thresholds are met), and use **preset transactions** (templates for quick-fill when adding transactions). Delete and remove actions (income, debt, debt payment, mortgage payment, rule, preset, and “Delete all data” in Settings) **require confirmation** before applying. All app pages are behind **Google sign-in**; unauthenticated users are redirected to **/auth** (login page). Token expiry and 401 from Sheets API clear the session and redirect to /auth. Sign in with Google in the nav (when authenticated). The app supports multiple UI languages (globe dropdown) and a mobile bottom nav for key sections. Data lives in the app and localStorage; Sheets and PDF export/import include expenses, income, debts, debt payments, mortgage, rules, preset transactions, and **card sources** (enabled sources list). The V2 payload includes `cardSources` and categories where applicable. **PDF export** uses a **V2** machine-readable block (JSON payload gzip-compressed and Base64-encoded); **PDF import** accepts only V2 (legacy text format no longer supported). PDFs without a data block (e.g. Chase statements) use a table fallback to parse visible expense/income rows.

---

## 1. Overview

Budget Tool is a personal budgeting application for a couple (you and your wife, Tasnuva) to:

- Import transaction CSVs from **American Express**, **Apple Card**, and **Chase** (Chase PDF parser and CSV import supported); or upload an **exported PDF** (re-import).
- Categorize spending as **My Purchase**, **Tasnuva's Purchases**, **50/50**, or **Mortgage** (and optionally uncategorized).
- Track **income** (e.g. Rent, Paycheck, Bonus) and **expenses** in one place.
- Compute **totals** by month: Total Earned, Total Spent, Total Spent w/o Mortgage, 50/50 Split, Nova’s/your spending, savings rate, etc.
- **Sync** expenses, income, debts, debt payments, mortgage payments, rules, and totals to a **Google Sheet** (manual “Sync to Google Sheets” from Settings). **Restore from Sheet** loads data from the Sheet into the app (e.g. after clearing local storage).
- **Add transactions manually** (date, amount, description, category, source, card member). **Multiple at once:** add several rows in one dialog; **copy** a row to duplicate and edit; remove rows. **Source options** are **configurable** in Settings (Card Sources card); only enabled sources appear in the source dropdown (e.g. Manual, Debit (TD Bank), American Express, Apple Card, Chase). Card member is a dropdown (AYAZ UDDIN / TASNUVA AHMED).
- **View** dashboard and transactions **by month** (month selector, spending-by-month table, **chart visualizations** for earned/spent/saved, spending breakdown, income breakdown, plus monthly bar chart, transactions grouped by month).
- **Google sign-in in the nav:** Sign in with Google at the bottom of the sidebar; when signed in, show the user’s name and avatar (with fallback to initials if the image fails). Same account is used for Google Sheets sync.
- **Language switcher:** Globe dropdown to switch UI language (English, Spanish, Bangla, Chinese, Korean, Hindi, Japanese); preference is saved in localStorage.

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

| Field         | Type   | Description                                                                                                |
| ------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| `id`          | string | Unique ID.                                                                                                 |
| `date`        | string | ISO date `YYYY-MM-DD`.                                                                                     |
| `amount`      | number | Positive.                                                                                                  |
| `description` | string | e.g. "Basement Rent", "Paycheck".                                                                          |
| `category`    | string | Rent, Paycheck, Bonus, Other (defaults).                                                                   |
| `owner`       | string | Ayaz or Tasnuva (optional; default Ayaz for backward compat).                                              |
| `recurring*`  | mixed  | Optional: recurringAmount, recurringFrequency (monthly/biweekly), recurringDayOfMonth, recurringStartDate. |

### 3.3 Categories

- **Expense (default):** My Purchase, Tasnuva's Purchases, 50/50, Mortgage.
- **Income (default):** Rent, Paycheck, Bonus, Other.

Categories are used in dropdowns and for totals logic. Custom categories can be added via rules; totals logic uses the above names for 50/50, Tasnuva’s, and Mortgage.

---

## 4. Features Implemented

### 4.1 CSV & PDF Import

- **Banks supported:** American Express, Apple Card, **Chase** (PDF parser and CSV import). **Exported PDF (re-import)** is also a source option.
- **Flow:** User **selects the source from a dropdown** (Amex, Amex Gold, Apple Card, Chase, or Exported PDF), then chooses a file (CSV or PDF). There is **no auto-detect**; the selected source is always used to parse the file. Only **enabled card sources** (see Settings) appear in the import dropdown; pdf-export is always shown.
- **Parsers:**
  - **Amex:** Columns `Date`, `Description`, `Card Member`, `Account #`, `Amount`. Date `MM/DD/YYYY` or `MM/DD/YY` → `YYYY-MM-DD`. Dedup via hash of date + description + amount + cardMember.
  - **Apple Card:** Columns `Transaction Date`, `Clearing Date`, `Description`, `Merchant`, `Category`, `Type`, `Amount (USD)`, `Purchased By`. Only rows with Type **Purchase** or **Installment** are imported (Payment rows skipped). Quoted CSV fields supported; BOM stripped.
  - **Chase:** PDF parser and CSV import (see `src/lib/parsers/chase.ts`). CSV columns and PDF table extraction supported.
- **After import:** Rules are applied; user sees a **preview** with editable category per row, then clicks **“Add to transactions”** to merge into the app’s transaction list (and persist to localStorage).

### 4.2 Rules (Gambit-style)

- **Structure:** Rules are **If condition → then action**, evaluated **top-to-bottom** (priority order). First match wins; disabled rules are skipped.
- **Scope:** Expenses only (income/debts not covered in MVP).
- **Conditions (MVP):**
  1. **Card Source** (e.g., Chase, Apple Card, Amex, Manual, TD).
  2. **Card Member** (equals or contains, case-insensitive).
  3. **Expense amount threshold** (lt / gte / between).
  4. **Category total threshold** for the **current month** (lt / gte).
- **Actions (MVP):** Set expense category, or **show warning** (for category-total rules; message shown on dashboard).
- **Apply points:** Import preview, manual add, and “Apply rules” on Transactions (uncategorized only). Rules with "show warning" display messages on the dashboard when the category total threshold is met for the current month.
- **UI:** Rules page with a priority-ordered list, enable/disable toggle, reorder controls, and a rule editor dialog. Card Member condition uses a dropdown (AYAZ UDDIN / TASNUVA AHMED). User can override category by editing the expense after rules run. **Delete rule** and **delete preset transaction** each require a confirmation modal.

### 4.2.1 Preset Transactions

- **Rules page:** A “Preset Transactions” card stores templates (source, description, category, card member) for quick-fill when adding transactions. Add and remove presets; **delete preset** requires a confirmation modal. Presets are persisted in localStorage and included in **PDF export/import** and **Google Sheets** sync/restore (PresetTransactions sheet). In the Add Transaction dialog, user can choose a preset to populate a row.

### 4.3 Description Cleanup

- **Clean descriptions:** For Amex/Apple Pay–style descriptions: strip `AplPay ` prefix, remove trailing domain + state (e.g. ` help.uber.com CA`), collapse spaces. Applied in Amex parser and via a **“Clean descriptions”** button on the Transactions page for existing rows.

### 4.4 Transactions UI

- **Add transaction (manual):** "Add transaction" button opens a **nearly full-screen dialog** (94vw × 92vh) with a **compact table layout**: one row per transaction (Source, Date, Amount, Description, Category, Card member, Copy / Remove). User can **add multiple transactions at once**: "Add row" for a blank row; **Copy** on any row duplicates it (inserted below) for editing; remove row when more than one. Submit adds all rows that have a valid amount; empty/invalid rows are skipped. New rows get a generated id and persist like imported transactions. Source options: Manual, Debit (TD Bank), American Express, Apple Card, Chase. Card member dropdown: unique values from existing expenses or default AYAZ UDDIN / TASNUVA AHMED.
- **List:** All expenses (including mortgage) with filters (month, source, category). List is **grouped by month** with a month header row (e.g. "January 2025") above each group. Inline category dropdown per row; delete single row. **Mobile:** card list by month; tap row opens bottom-sheet to change category or delete.
- **Bulk actions:** Checkboxes, “Select all” (filtered), **Delete selected**, **Delete all** (with confirmation).
- **Display:** Source filter and table use friendly labels (e.g. American Express, Apple Card, Debit (TD Bank)). Category dropdowns are **wider** and **color-coded** (e.g. My Purchase = blue, Tasnuva’s = rose, 50/50 = amber, Mortgage = slate). **Staggered row colors** (alternating subtle background) for readability.

### 4.5 Income

- **Add income:** Form (date, amount, description, category, **owner** Ayaz/Tasnuva, optional **recurring** amount/frequency). List of income entries with edit category/owner and delete. **Delete income** (table or mobile action sheet) requires a confirmation modal. **Mobile:** list view + bottom-sheet action dialog for edit/delete/category/owner.
- **Categories:** Rent, Paycheck, Bonus, Other (color-coded in dropdowns).

### 4.5.1 Debt

- **Debt page:** Track debts (e.g. car loan, credit card) and payments. **Add debt:** dialog with name, initial amount owed, optional start date, **owner** (Ayaz or Tasnuva), and optional **recurring payment** (checkbox: when checked, amount and **frequency** — **bi-weekly** (every 14 days from first payment date) or **monthly** (day of month 1–31)). Each debt shows owner, initial amount, and **current balance** (initial minus sum of payments minus recurring deductions). **Set/Edit recurring:** per-debt button; **Make payment:** per-debt dialog (date, amount, optional note); payments listed with remove. **Remove individual debt payment** (list or mobile sheet) requires confirmation. **Delete debt:** confirmation; cascade removes payments. **Mobile:** list + bottom-sheet for payment/recurring/delete.
- **Persistence:** Debts and debt payments in localStorage. **Sync to Google Sheets** writes **Debts** and **DebtPayments** sheets. **Restore from Sheet** merges by id (add-only). **PDF export/import** includes debts and debt payments.

### 4.5.2 Mortgage

- **Mortgage page:** Mortgage payments are tracked separately from general transactions. **Add payment:** dialog (date, amount, optional category). List of mortgage payments (table on desktop, list on mobile) with per-row actions (change category, delete). **Delete:** confirmation dialog. Mortgage expenses are stored as expenses with category Mortgage and synced to a dedicated **Mortgage** sheet; **PDF export/import** and **Google Sheets** sync/restore include the Mortgage sheet.

### 4.6 Dashboard

- **View month:** A "View month" dropdown lets the user select which month's totals to show. Default is current month. Options include the current month plus every month that has expense/income data (newest first).
- **Chart visualizations (selected month):** Three shadcn/Recharts cards above the summary cards, all driven by the selected month:
  1. **Earned vs Spent vs Saved** — Horizontal bar chart (tooltip in currency).
  2. **Spending breakdown** — Donut (pie): 50/50, Tasnuva's (her purchases only), My (your spending excluding 50/50). **Mortgage is excluded** from this breakdown. Only segments with value &gt; 0 shown; legend and currency tooltip.
  3. **Income breakdown** — Stacked horizontal bar by **person** (Ayaz/Tasnuva), stacked by income category (Rent/Paycheck/Bonus/Other) with labeled tooltips.
- **Summary cards:** Total Earned, Total Spent, Total Spent w/o Mortgage, 50/50 Split, Tasnuva's Total Spending, My Total Spending w/o Mortgage, Total Saved, Personal Savings Rate — all for the **selected month**.
- **Debt section:** Accordion with chart showing **remaining vs paid off** (no total debt amount in summary).
- **Warnings:** Dashboard shows rules-based warnings when a category total threshold is met for the current month.
- **Spending by month (table):** Table with one row per month: Month, Total Earned, Total Spent, Spent w/o Mortgage, Total Saved, Savings Rate. Current month row is highlighted.
- **Monthly breakdown (bar chart):** Bar chart (recharts) showing **Total Earned** vs **Total Spent** per month (chronological order). Two bars per month; tooltip formats as currency; legend. Empty state if no data.
- **Totals:** Sourced from `lib/totals.ts` (see below).

### 4.7 Totals Logic

- **Per month:** totalEarned, totalSpent, totalSpentWithoutMortgage, total5050Spent, split5050 (half of 50/50), tasnuvasPurchase, tasnuvasTotalSpending (her purchases + her half of 50/50), iOweNova (manual per month), myTotalSpendingWithoutMortgage, totalSaved, personalSavingsRate, hysa, investingSp500, investingTotal.
- **My total spending:** Expenses in categories other than Tasnuva’s, 50/50, and Mortgage, plus your half of 50/50.
- **I Owe Nova, HYSA, Investing:** Stored per month in app state and included in Totals; editable in UI where implemented.

### 4.8 Google Sign-In & Sheets Sync

- **Nav sign-in:** At the bottom of the sidebar, the app shows either **"Sign in with Google"** or, when signed in, the **user's name and avatar** (profile picture from Google userinfo; fallback to initials if the image fails to load) and a **Sign out** button. Same OAuth scope and account as Google Sheets; user profile (name, picture, email) is fetched after sign-in for display only.
- **Auth:** Google OAuth (e.g. `@react-oauth/google`). Requires `VITE_GOOGLE_CLIENT_ID` in `.env`. If not set, app shows a fallback and does not initialize the Google client (avoids “Missing required parameter client_id”).
- **Spreadsheet:** User pastes spreadsheet ID or URL in Settings. App can use an **empty** sheet; it creates/ensures required sheets and structure.
- **Sync to Google Sheets (push only):** "Sync to Google Sheets" in Settings **overwrites** the Sheet with the app's current state. Clears and writes **Expenses** (6 columns), **Income** (with owner/recurring fields), **Mortgage** sheet, **Debts** sheet, **DebtPayments** sheet, **Rules** sheet (Id, Enabled, Condition, Action), **PresetTransactions** sheet, and **Totals** sheet (monthly rows + TOTALS row). If the user deletes all transactions in the app and syncs, the Sheet is updated to match (empty expenses/income/mortgage/debts/rules/presets).
- **Restore from Sheet (pull only):** "Restore from Sheet" in Settings **reads** the Expenses, Income, Mortgage, Debts, DebtPayments, Rules, and PresetTransactions sheets and **merges** rows into the app (expenses/income add-only by key; mortgage add-only by key; debts and debt payments add-only by id; rules replace the current rule set if any rows exist; presets replace current presets when sheet has data). Use case: e.g. after clearing local storage, load data back from the Sheet. Sheet-originated expenses get `source` and `cardMember` from columns when present; older 4-column sheets default to `manual` / no card member.
- **Formatting:** Left-align cells, **Amount** columns as currency ($), **header row** bold and larger font (applied via Sheets API `batchUpdate` after data write).
- **When sync runs:** Only when the user clicks the sync or restore button. No automatic or periodic sync.

### 4.9 Persistence

- **localStorage:** Expenses, income, mortgage payments, debts, debt payments, rules, preset transactions, I Owe Nova (and related state), spreadsheet ID, and locale preference are persisted so they survive refresh. No expiry; data stays until the user or browser clears storage.
- **Clearing localStorage:** Wipes all app data (transactions, income, debts, rules, preset transactions, spreadsheet ID). **Does not** change the Google Sheet. If the user then syncs, the app overwrites the Sheet with the current (empty) app data.

### 4.10 Settings

- **Google:** Connect/disconnect, set spreadsheet URL/ID. **Restore from Sheet** (pull only: load data from Sheet into app) and **Sync to Google Sheets** (push only: overwrite Sheet with app data). Sync/restore status and error message displayed on failure.
- **Card sources:** A **Card Sources** card lists all expense/card sources (Amex Platinum, Amex Gold, Chase, Apple Card, Manual, Debit (TD Bank)) with checkboxes. Only **enabled** sources appear in transaction source dropdowns, filters, rules, and import. At least one source must remain enabled. Stored in app state and included in PDF/Sheets payloads.
- **Delete all data:** Button with confirmation; on confirm, clears app localStorage (expenses, income, debts, rules, preset transactions, etc.) and reloads the page.
- **OAuth testing:** For “Access blocked: app has not completed verification,” add test users in the Google Cloud OAuth consent screen so they can sign in.
- **Language:** UI language is changed via the globe dropdown in the sidebar (or in the "More" sheet on mobile); preference is saved in localStorage.

---

## 5. Technical Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, recharts (BarChart, PieChart, RadialBarChart; shadcn ChartContainer, ChartTooltipContent, ChartLegend for Dashboard).
- **State:** React context (BudgetContext, RulesContext, GoogleAuthContext); localStorage for persistence.
- **No backend:** All logic and storage in the browser; Google Sheets API and Google userinfo API called from the client with the user’s OAuth token.

---

## 6. Out of Scope / Not Done

- **Chase:** Chase PDF parser and CSV import are implemented; manual transactions can also be tagged with source Chase.
- **Auto-detect CSV source:** Removed; user must select American Express or Apple Card manually.
- **Encryption of localStorage:** Discussed but not implemented; data is stored in plain JSON.
- **Recurring / scheduled sync:** Sync and restore are manual only.

---

## 7. File / Module Overview

| Area            | Path / files                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Types           | `src/lib/types.ts` (Expense, Income, Debt, DebtPayment, ExpenseSource, categories)                       |
| Source labels   | `src/lib/sourceLabels.ts` (EXPENSE_SOURCE_LOCALE_KEYS, EXPENSE_SOURCE_DISPLAY_LABELS, SOURCE_LABEL_KEYS, SOURCE_OPTIONS) |
| Parsers         | `src/lib/parsers/amex.ts`, `apple.ts`, `chase.ts`, `index.ts`                                              |
| Rules engine    | `src/lib/rules.ts` (conditions + actions, priority order)                                                 |
| Totals          | `src/lib/totals.ts` (getMonthLabel exported for Dashboard/Transactions)                                   |
| Google Sheets   | `src/lib/googleSheets.ts` (read/write Expenses, Income, Mortgage, Debts, DebtPayments, Rules, PresetTransactions, Totals, cardSources) |
| PDF export      | `src/lib/pdfExport.ts` (V2: JSON gzip + Base64 between markers; import V2-only; table fallback; payload includes cardSources) |
| Category colors | `src/lib/categoryColors.tsx` (colors + CategoryOption component)                                          |
| Context         | `src/context/BudgetContext.tsx`, `RulesContext.tsx`, `PresetTransactionsContext.tsx`, `GoogleAuthContext.tsx` |
| Layout          | `src/components/Layout.tsx` (sidebar, mobile header + bottom nav + "More" sheet, globe language switcher)  |
| Auth            | `src/pages/auth/AuthGate.tsx` (redirect to /auth when not signed in), `src/pages/auth/LoginPage.tsx` (two-column login, Sign in with Google) |
| Pages           | Dashboard, Import, Transactions, Income, Debt, Mortgage, Rules, Settings (Settings includes **CardSourcesCard** for configurable card sources) |

---

This PRD summarizes what was built so far and is intended to stay in sync with the codebase as the product evolves.
