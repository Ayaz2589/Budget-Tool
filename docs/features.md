# Features

## Page tours

- **Entry:** A help icon (with optional "new" dot badge) appears in the header of each main app page (Dashboard, Transactions, Import, Income, Debt, Mortgage, Rules, Settings).
- **Behavior:** Clicking the icon starts a step-by-step tour that highlights key areas of the page (driver.js). The badge is shown until the user has opened the tour once for that page; "seen" state is stored per page in localStorage (`budget-tool-tour-seen-<pageId>`).
- **Backing:** `src/components/PageTourTrigger.tsx`, `src/lib/runPageTour.ts`, `src/lib/pageTourSteps.ts`. Tour copy is under `tour.*` in locale files.

## Auth

- **Entry:** `/auth` route; `AuthGate` wraps all app routes; `LoginPage` at `src/pages/auth/LoginPage.tsx`.
- **Flow:** Unauthenticated users are redirected to `/auth`. Sign in with Google; token and expiry stored; 401 or expiry clears session and redirects to `/auth`.
- **Backing:** `GoogleAuthContext` (`src/context/GoogleAuthContext.tsx`), `@react-oauth/google`.

## Dashboard

- **Entry:** `/` (index), `src/pages/dashboard/Dashboard.tsx`.
- **Backing:** `src/lib/totals.ts` (computeMonthTotals, computeAllTotals), `src/lib/rules.ts` (getDashboardWarnings). Sections: SummaryCards, DebtSection, ByMonthSection, OverviewSection, SpendingByTypeSection, MonthSelector.
- **Settings in-dashboard:** supports
  - month selection from available data months
  - range selection (current / 6 / 12)
  - expense scope (all vs exclude mortgage)
  - debt-payment include/exclude toggle
  - view mode (household vs individual owner)
- **Owner/household scoping:** uses `src/lib/financialModel.ts` so owner-mode calculations are allocation-aware and consistent with transactions totals.

## Transactions

- **Entry:** `/transactions`, `src/pages/transactions/TransactionsPage.tsx`.
- **Backing:** BudgetContext (expenses), RulesContext, PresetTransactionsContext. Components: ExpensesByMonthTable, ExpensesByMonthList, TransactionsToolbar, FiltersAndActionsDialog, AddTransactionDialog, DeleteTransactionDialogs, ExpenseActionsDialog, SyncConfirmDialog.
- **Owner filtering math:** owner filter uses shared `src/lib/financialModel.ts` logic:
  - allocation-aware expense amounts
  - signed owner-transfer impact (sent positive, received negative)
- **Add transaction:** `src/components/AddTransactionDialog.tsx` — multi-row table, source/category from cardSources and expenseCategories.

## Import

- **Entry:** `/import`, `src/pages/import/ImportPage.tsx`.
- **Backing:** `src/lib/parsers/` (amex, apple, chase, index), `src/lib/pdfExport.ts` (parseExportedPdfData), `src/lib/importDedup.ts`, `src/lib/rules.ts` (applyRulesToExpenses). Import sources filtered by cardSources; CSV and Chase PDF and exported PDF (V2) supported.

## Income

- **Entry:** `/income`, `src/pages/income/IncomePage.tsx`.
- **Backing:** BudgetContext (income). Components: IncomeTable, IncomeList, AddIncomeDialog, EditIncomeDialog, IncomeActionsDialog.

## Debt

- **Entry:** `/debt`, `src/pages/debt/DebtPage.tsx`.
- **Backing:** BudgetContext (debts, debtPayments), `src/lib/debtUtils.ts`. Components: DebtList, DebtListMobile, AddDebtDialog, AddPaymentDialog, DebtActionsDialog, EditRecurringDialog.

## Mortgage

- **Entry:** `/mortgage`, `src/pages/mortgage/MortgagePage.tsx`.
- **Backing:** BudgetContext (expenses with category Mortgage). Components: MortgagePaymentsTable, MortgagePaymentsList, AddMortgagePaymentDialog, DeleteMortgagePaymentDialog, MortgagePaymentActionsDialog.

## Rules

- **Entry:** `/rules`, `src/pages/rules/RulesPage.tsx`.
- **Backing:** `src/lib/rules.ts` (conditions, actions, applyRulesToExpenses), RulesContext, PresetTransactionsContext. Source options filtered by cardSources.

## Settings

- **Entry:** `/settings`, `src/pages/settings/SettingsPage.tsx`.
- **Backing:** BudgetContext (categories, cardSources), GoogleAuthContext. Cards: GoogleSheetsCard, CardSourcesCard, ExpenseCategoriesCard, IncomeCategoriesCard. Delete-all-data with confirmation.

## Google Sheets sync

- **Entry:** Settings → Google Sheets card. Sync to Sheets (push), Restore from Sheet (pull).
- **Backing:** `src/lib/googleSheets.ts` (ensureSheetsExist, clearAndWrite*, read*, writeDataBlob, readDataBlob), `src/lib/minifiedPayload.ts` (serializeToBlob, parseFromBlob). Data blob (V2) includes expenses, income, debts, debtPayments, rules, presets, cardSources.

## PDF export / import

- **Backing:** `src/lib/pdfExport.ts` (downloadTransactionsAndIncomePdf, parseExportedPdfData), `src/lib/pdfText.ts` (extractTextFromPdf), `src/lib/minifiedPayload.ts`. Export embeds V2 blob; import parses V2 and optionally restores cardSources, rules, presets.
