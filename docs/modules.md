# Modules

This document is the current module map after the refactor pass (barrel exports + selector extraction).

## Entry and Routing

- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/main.tsx`** — App bootstrap and i18n wiring.
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/App.tsx`** — Provider composition + router tree.
- Routes:
  - `/` landing gate
  - `/tour`
  - `/auth`
  - `/dashboard` with nested pages: dashboard, data (`import`), transactions, income, debt, mortgage, presets, about, settings.

## Barrel Exports

- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/components/index.ts`**
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/components/ui/index.ts`**
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/context/index.ts`**
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/hooks/index.ts`**
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/index.ts`** plus per-page barrels (`src/pages/*/index.ts`)
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/lib/index.ts`**
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/types/index.ts`**

Use barrels for feature-level imports; only import deep files when a module is intentionally private.

## Context Layer

- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/context/BudgetContext.tsx`**
  - Canonical budget state and mutations.
  - UI format settings (locale/currency/date format), FX hydration, and dummy mode.
  - localStorage persistence for core budget + UI format.
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/context/PresetTransactionsContext.tsx`**
  - Preset CRUD + persistence.
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/context/GoogleAuthContext.tsx`**
  - Google OAuth session.
  - Sheets sync/pull and queue-safe autosync behavior.
  - Drive-assisted sheet setup flow.

## Transactions Refactor (Pure Selectors/Helpers)

- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/transactions/transactionsLedger.ts`**
  - Pure functions for owner options, row projection, filtering, sorting, month grouping, and active filter detection.
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/pages/transactions/TransactionsPage.tsx`**
  - Orchestrates state + dialogs and delegates data logic to `transactionsLedger.ts`.
- **`/Users/ayazuddin/Development/personal/Web/budget-tool/src/components/add-transaction-utils.ts`**
  - Pure helpers extracted from AddTransactionDialog.

## Library Modules

- **Formatting/Input**
  - `src/lib/format.ts`, `src/lib/currencyInput.ts`, `src/lib/dateInput.ts`, `src/lib/fx.ts`
- **Financial model (single source of truth)**
  - `src/lib/financialModel.ts`
  - Owner list derivation, owner-scoped dataset projection, allocation-aware owner amounts, signed owner-transfer impact.
- **Import/Export**
  - `src/lib/jsonExport.ts`, `src/lib/exportString.ts`, `src/lib/minifiedPayload.ts`, `src/lib/pdfExport.ts`
- **Google**
  - `src/lib/googleSheets.ts`, `src/lib/googleDrive.ts`
- **Domain math/selectors**
  - `src/lib/totals.ts`, `src/lib/debtUtils.ts`, `src/lib/ownerAccounting.ts`, `src/lib/importNormalize.ts`

All utility modules should stay pure by default; side effects should be constrained to context/components.

## Component Layer

- **Layout shell:** `src/components/Layout.tsx`
- **Feature dialogs/sheets:** Add/Edit dialogs per page modules.
- **Design system wrappers:** `src/components/ds/*`
- **UI primitives:** `src/components/ui/*`

## Page Modules

- **Dashboard:** `src/pages/dashboard/*` (selectors + insights + UI)
- **Transactions:** `src/pages/transactions/*` (owner filtering now uses shared financial model helpers)
- **Income:** `src/pages/income/*`
- **Debt:** `src/pages/debt/*`
- **Mortgage:** `src/pages/mortgage/*`
- **Data import/export:** `src/pages/import/*`
- **Settings/About/Tour/Auth/Landing:** corresponding page folders
