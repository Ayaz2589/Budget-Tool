# Modules (file tree)

One-line description per file or logical module. Use this to find where logic lives (e.g. "Where is sync?" → GoogleAuthContext + googleSheets).

## src/

- **App.tsx** — Root routes: /auth (AuthLoginRoute), AuthGate wrapping Layout and nested routes (/, import, transactions, income, debt, mortgage, rules, settings).
- **main.tsx** — Entry: React root, I18nextProvider, App.
- **i18n.ts** — i18next config; locales loaded from src/locales/.
- **index.css** — Tailwind and theme variables.

## src/context/

- **BudgetContext.tsx** — Global state: expenses, income, debts, debtPayments, expenseCategories, incomeCategories, cardSources, iOweNova; persistence to localStorage (budget-tool-data); add/update/remove and setExpenseCategories, setIncomeCategories, setCardSources.
- **PresetTransactionsContext.tsx** — Preset transactions state; persistence to localStorage (budget-tool-preset-transactions).
- **RulesContext.tsx** — Rules state; persistence to localStorage (budget-tool-rules).
- **GoogleAuthContext.tsx** — Google OAuth (useGoogleLogin); token and expiry persistence; userProfile fetch; signIn, signOut; syncToSheets, pullFromSheet; clearSession on 401 or expiry; GoogleAuthProviderFallback when client ID not set.

## src/lib/

- **types.ts** — Expense, Income, Debt, DebtPayment, PresetTransaction, ExpenseSource, ALL_EXPENSE_SOURCES, DEFAULT_*_CATEGORIES.
- **sourceLabels.ts** — Centralized EXPENSE_SOURCE_LOCALE_KEYS and EXPENSE_SOURCE_DISPLAY_LABELS for i18n and PDF/Rules labels.
- **totals.ts** — computeMonthTotals, computeAllTotals, computeGrandTotals, getMonthLabel.
- **rules.ts** — Rule type; conditions (source, cardMember, amount, categoryTotal); actions (setCategory, showWarning); applyRulesToExpenses, getDashboardWarnings.
- **minifiedPayload.ts** — buildMinifiedPayload, expandPayload, serializeToBlob, parseFromBlob; short keys (e, i, d, dp, r, pt, ec, ic, sc).
- **googleSheets.ts** — Sheets API: ensureSheetsExist, clearAndWrite* (Expenses, Mortgage, Income, Debts, DebtPayments, Rules, Presets), writeDataBlob, readDataBlob, read*FromSheet, writeTotalsSheet, getSheetIds, applySheetsFormatting, extractSpreadsheetId; VALID_EXPENSE_SOURCES for parsing.
- **pdfExport.ts** — downloadTransactionsAndIncomePdf (builds PDF with V2 blob), parseExportedPdfData (extracts V2 blob from PDF text); SOURCE_LABELS for table display.
- **pdfText.ts** — extractTextFromPdf (pdfjs-dist).
- **format.ts** — formatCurrency, formatPercent.
- **dateRepair.ts** — isValidDate, tryRepairDate.
- **debtUtils.ts** — getDebtBalance, applyRecurringPayments.
- **categoryColors.tsx** — getCategoryColor, CategoryOption component.
- **importDedup.ts** — filterOutExistingExpenses.
- **utils.ts** — cn (classnames).
- **parsers/amex.ts** — Parse Amex CSV; returns ParseResult (expenses, source).
- **parsers/apple.ts** — Parse Apple Card CSV.
- **parsers/chase.ts** — Parse Chase PDF text.
- **parsers/index.ts** — parseCsv, detectCsvSource, CsvSource type; re-exports parsers.

## src/components/

- **Layout.tsx** — Sidebar (desktop), header + bottom nav (mobile), language switcher, sign-in/sign-out; Outlet for main content; redirect to /auth when isSignedIn goes false.
- **AddTransactionDialog.tsx** — Multi-row add transaction dialog; source from cardSources, categories from expenseCategories; presets from PresetTransactionsContext.
- **ui/** — shadcn components (button, card, dialog, input, select, table, tabs, accordion, chart, checkbox, label).
- **cards/SourceIcon.tsx** — Renders icon for ExpenseSource (Amex, Amex Gold, Chase, Apple, manual/td null).
- **cards/*.tsx** — AmexPlatinumCardIcon, AmexGoldCardIcon, AppleCardIcon, ChaseCardIcon; index re-exports.

## src/pages/

- **auth/AuthGate.tsx** — When !isSignedIn redirects to /auth; when signed in renders Outlet. AuthLoginRoute: when signed in redirects to /; else renders LoginPage.
- **auth/LoginPage.tsx** — Full-page login: two-column layout (form left, value prop right), Google sign-in button.
- **dashboard/Dashboard.tsx** — Month selector, summary cards, debt section, by-month section, overview, spending by type.
- **dashboard/*.tsx** — ByMonthList, ByMonthSection, DebtSection, MonthSelector, OverviewSection, SpendingByTypeSection, SummaryCards.
- **transactions/TransactionsPage.tsx** — Toolbar, filters, expenses by month (table/list), add transaction, delete dialogs, sync confirm.
- **transactions/*.tsx** — DeleteTransactionDialogs, ExpenseActionsDialog, ExpensesByMonthList, ExpensesByMonthTable, FiltersAndActionsDialog, SyncConfirmDialog, TransactionsToolbar.
- **import/ImportPage.tsx** — File input, source selection (filtered by cardSources), preview, add to transactions.
- **import/ImportSourceCard.tsx** — Source buttons (card sources + pdf-export), file button, preview stats.
- **import/ImportPreviewCard.tsx** — Preview tables for expenses, income, debts, debt payments.
- **income/IncomePage.tsx** — Income table/list, add/edit dialogs, PDF download.
- **income/*.tsx** — AddIncomeDialog, EditIncomeDialog, IncomeActionsDialog, IncomeList, IncomeTable.
- **debt/DebtPage.tsx** — Debt list (desktop/mobile), add debt/payment, edit recurring.
- **debt/*.tsx** — AddDebtDialog, AddPaymentDialog, DebtActionsDialog, DebtList, DebtListMobile, EditRecurringDialog.
- **mortgage/MortgagePage.tsx** — Mortgage payments table/list, add/delete payment dialogs.
- **mortgage/*.tsx** — AddMortgagePaymentDialog, DeleteMortgagePaymentDialog, MortgagePaymentActionsDialog, MortgagePaymentsList, MortgagePaymentsTable.
- **rules/RulesPage.tsx** — Rules list (reorder, toggle, delete), rule editor dialog, preset transactions card; source options from cardSources.
- **settings/SettingsPage.tsx** — Google Sheets card, CardSourcesCard, ExpenseCategoriesCard, IncomeCategoriesCard, delete all data.
- **settings/*.tsx** — CardSourcesCard, ExpenseCategoriesCard, GoogleSheetsCard, IncomeCategoriesCard.
