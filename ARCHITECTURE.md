# Budget Tool (Ortho) Architecture

A personal budgeting web app for couples. React 19 SPA with localStorage persistence, Google Sheets sync, CSV import, and PDF/JSON export. Deployed on Vercel.

## Table of Contents

- [System Overview](#system-overview)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Data Layer](#data-layer)
- [Key Patterns](#key-patterns)
- [Domain Flows](#domain-flows)
- [Configuration](#configuration)
- [File Reference](#file-reference)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React 19 SPA                             │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Dashboard │  │ Transactions │  │  Import   │  │ Settings  │  │
│  │ (Widgets) │  │   Ledger     │  │ CSV/PDF   │  │           │  │
│  └─────┬─────┘  └──────┬───────┘  └─────┬─────┘  └─────┬─────┘  │
│        │               │                │              │        │
│  ┌─────▼───────────────▼────────────────▼──────────────▼─────┐  │
│  │              Context API (State Management)               │  │
│  │  BudgetContext ─► Expenses, Income, Debt, Transfers,      │  │
│  │                   Settings, OwnerBalances                 │  │
│  │  GoogleAuthContext ─► OAuth, SheetSetup, Sync             │  │
│  │  PresetTransactionsContext ─► Transaction templates        │  │
│  └──────────┬──────────────────────────┬─────────────────────┘  │
│             │                          │                        │
│  ┌──────────▼──────────┐    ┌──────────▼──────────┐            │
│  │    localStorage     │    │   Google Sheets API  │            │
│  │  (primary storage)  │    │   (via genjutsu-db)  │            │
│  └─────────────────────┘    └──────────┬──────────┘            │
└─────────────────────────────────────────┼───────────────────────┘
                                          │
                              ┌───────────▼───────────┐
                              │   Google Drive API    │
                              │  (folder management)  │
                              └───────────────────────┘
```

The app is a client-side React SPA bundled with Vite and deployed to Vercel. All data lives in `localStorage` — there is no backend database. Optional Google Sheets sync uses the genjutsu-db library to read/write domain data to spreadsheet tabs. CSV import supports Amex and Apple Card statements. Export produces PDF (with embedded machine-readable payload) or JSON.

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Language | TypeScript | ~5.9.3 |
| Framework | React | ^19.2.0 |
| Bundler | Vite | ^7.2.4 |
| Styling | Tailwind CSS v4 | ^4.1.18 |
| Component Library | shadcn/ui + Radix UI | Various |
| Animation | Framer Motion | ^12.23.24 |
| Charts | Recharts | 2.15.4 |
| Routing | React Router | ^7.13.0 |
| i18n | i18next + react-i18next | ^24.2.0 / ^15.1.0 |
| Icons | Lucide React | ^0.563.0 |
| Google Auth | @react-oauth/google | ^0.13.4 |
| Sheets ORM | genjutsu-db | 0.2.0 |
| PDF | jsPDF + jspdf-autotable | ^4.0.0 / ^5.0.7 |
| PDF Parsing | pdfjs-dist | ^5.4.530 |
| Compression | pako | ^2.1.0 |
| Grid Layout | react-grid-layout | ^2.2.2 |
| Testing | Bun test runner + RTL + happy-dom | — |
| Package Manager | Bun | 1.3.6 (CI) |
| Deployment | Vercel | — |

---

## Directory Structure

```
budget-tool/
├── .github/workflows/    # CI pipeline (ci.yml)
├── .husky/               # Git hooks
├── .specify/             # Speckit workflow artifacts
├── docs/                 # Documentation
├── public/               # Static assets
├── scripts/              # Build/utility scripts
├── specs/                # Feature specification files
├── src/
│   ├── components/
│   │   ├── add-transaction/  # Transaction form components
│   │   ├── ds/               # Custom design system (Ds* components)
│   │   ├── layout/           # Sidebar, MobileBottomNav, Avatar
│   │   └── ui/               # shadcn/ui primitives
│   ├── context/              # React Context providers
│   ├── hooks/                # Custom React hooks
│   ├── lib/
│   │   ├── domain/           # Business logic & financial calculations
│   │   ├── export/           # Export pipeline (PDF, JSON, minified)
│   │   ├── format/           # Currency, date, category formatting
│   │   ├── google/           # Google Drive API
│   │   ├── import/           # Import pipeline (dedup, normalize, dummy)
│   │   ├── math/             # Core financial math primitives
│   │   ├── parsers/          # Bank CSV parsers (Amex, Apple)
│   │   ├── platform/         # Storage, theme, FX rates, haptics
│   │   ├── sheets/           # Google Sheets sync (genjutsu-db)
│   │   └── widgets/          # Widget registry, layout, factory
│   ├── locales/              # i18n translation files (7 languages)
│   ├── pages/                # Route page components
│   └── types/                # TypeScript type definitions
├── test/                     # Tests (mirrors src/ structure)
└── Configuration files       # vite.config.ts, tsconfig.json, etc.
```

---

## Data Layer

### Core Types (`src/types/core.ts`)

```
ExpenseSource = "amex" | "amex-gold" | "apple" | "visa" | "sapphire"
              | "bank-of-america" | "wells-fargo" | "chase" | "manual" | "td"

Expense ──┬── id: string
          ├── date: string (ISO YYYY-MM-DD)
          ├── amount: number
          ├── description: string
          ├── category: string
          ├── source: ExpenseSource
          ├── owner?: string (legacy)
          ├── paidByOwner?: string (preferred)
          ├── allocationMode?: "single" | "equal" | "custom"
          └── allocation?: ExpenseAllocation[]

Income ───┬── id: string
          ├── date: string
          ├── amount: number
          ├── description: string
          ├── category: string
          └── owner?: string

Debt ─────┬── id: string
          ├── name: string
          ├── initialAmount: number
          ├── startDate?: string
          └── owner?: string

DebtPayment ┬── id: string
            ├── debtId: string (FK → Debt.id)
            ├── date: string
            ├── amount: number
            └── note?: string

OwnerTransfer ┬── id: string
              ├── date: string
              ├── fromOwner: string
              ├── toOwner: string
              ├── amount: number
              └── note?: string

PresetTransaction ┬── id: string
                  ├── source: ExpenseSource
                  ├── description: string
                  ├── amount?: number
                  ├── category: string
                  └── owner: string
```

### Persistence

All data is stored in `localStorage` under structured keys. On load, expense and income records are validated — entries with non-finite amounts or invalid dates are filtered out with console warnings.

| Key | Contents |
|-----|----------|
| `budget-tool-data` | Full budget state (expenses, income, debts, payments, transfers, categories, owners, card sources, owner balances) |
| `budget-tool-ui-format` | UI format settings (locale, currency, FX rate, date format) |
| `budget-tool-preset-transactions` | Transaction presets |
| `budget-tool-dashboard-layout` | Dashboard widget layout |
| `budget-tool-google-access-token` | OAuth token + expiry |
| `budget-tool-spreadsheet-id` | Connected Google Sheet ID |
| `budget-tool-auto-sync-enabled` | Auto-sync toggle |
| `budget-tool-fx-usd-{CUR}` | Cached FX rates per currency |
| `ortho-theme` | Dark/light theme preference |
| `ortho-locale` | Selected language |
| `budget-tool-dummy-mode` | Dev dummy data toggle |
| `budget-tool-returning-user` | Returning user flag |
| `budget-tool-tour-completed` | Tour completion flag |
| `budget-tool-help-hint-seen` | Help hint dismissed flag |
| `budget-tool-sidebar-collapsed` | Sidebar collapsed state |

### Google Sheets Schema

When synced, data maps to spreadsheet tabs via genjutsu-db models (`src/lib/sheets/models.ts`):

| Tab | Model Fields |
|-----|-------------|
| Expenses | id, date, amount, description, category, source, owner |
| Mortgage | id, date, amount, description, category, source, owner |
| Income | id, date, amount, description, category, owner |
| Debts | id, name, initialAmount, startDate, owner |
| DebtPayments | id, debtId, date, amount, note |
| OwnerTransfers | id, date, fromOwner, toOwner, amount, note |
| PresetTransactions | id, source, description, category, owner |
| Data | Single cell A1 with V2 minified blob (gzip + Base64) |
| Totals | Dynamic columns: monthly summaries per owner |

---

## Key Patterns

### State Management: Composable Context

The app uses React Context API with modular sub-contexts composed into a unified API:

```
App.tsx Provider Hierarchy:
  BudgetProvider
  ├── SettingsProvider
  ├── ExpensesProvider
  ├── IncomeProvider
  ├── DebtProvider
  ├── OwnerTransfersProvider
  └── BudgetComposer → useBudget() hook
      │
      PresetTransactionsProvider → usePresetTransactions()
      │
      GoogleAuthProvider (or Fallback)
      ├── SheetSetupProvider → useSheetSetup()
      └── SyncProvider → useSync()
          └── GoogleAuthComposer → useGoogleAuth()
```

**Sub-context pattern:** Each domain context has its own reducer. Common actions include `ADD`, `UPDATE`, `REMOVE`, `SET`. ExpensesContext additionally supports `ADD_MANY` and `REMOVE_MANY`; IncomeContext supports `ADD_MANY` but not `REMOVE_MANY`; OwnerTransfersContext has only `ADD`, `UPDATE`, `REMOVE`, `SET`; DebtContext uses domain-prefixed actions (`ADD_DEBT`, `ADD_DEBTS`, `REMOVE_DEBT`, `ADD_PAYMENT`, etc.). The `BudgetComposer` reads all sub-contexts and provides a single `useBudget()` hook with backward-compatible methods.

**Cross-concern cascades:** When owners change, BudgetComposer cleans invalid owner refs across all transactions. When categories change, invalid categories are blanked. When card sources change, invalid sources fall back to the first in the list.

### Component Architecture

- **`src/components/ui/`** — shadcn/ui primitives (Button, Card, Dialog, Sheet, etc.) built on Radix UI
- **`src/components/ds/`** — Custom design system components prefixed `Ds*` (DsMetricCard, DsChartCard, DsWidgetShell, DsActionBar, DsEmptyState, DsSplitToggle, etc.)
- **`src/components/layout/`** — App shell (Sidebar, MobileBottomNav, Avatar)
- **`src/pages/`** — Route page components, lazy-loaded with React.lazy + Suspense

### Routing & Auth

React Router v7 with auth gate pattern:

- **Public:** `/` (landing), `/tour`, `/auth`
- **Protected:** `/dashboard/*` — gated by `AuthGate` component
- All dashboard routes are lazy-loaded and wrapped in `ErrorBoundary`
- `AuthGate` checks `useGoogleAuth().isSignedIn`; redirects to `/auth` if not signed in

Dashboard sub-routes: `/dashboard` (index), `/import`, `/transactions`, `/income`, `/debt`, `/mortgage`, `/presets`, `/about`, `/settings`

### Widget System

The dashboard uses a configurable widget grid (`src/lib/widgets/`):

13 widget types across 3 categories:
- **KPIs:** net-cash-flow, total-spent, total-income, total-debt
- **Charts:** cash-flow-chart, net-trend-chart, category-chart, owner-split-chart, owner-expense-by-owner
- **Lists:** debt-snapshot, spend-by-source, owner-transfers, recent-activity

Each widget is registered in `WIDGET_REGISTRY` with type, label, icon, default size, breakpoint dimensions, and render function. Layout is persisted to localStorage and supports desktop grid (react-grid-layout) and mobile single-column modes.

### Currency & Formatting

All amounts stored internally in USD. Display currency conversion uses live FX rates from Frankfurter API (`frankfurter.app`, primary) with Open Exchange Rates (`open.er-api.com`) as fallback, cached in localStorage with 12-hour TTL.

Supported display currencies: USD, EUR, JPY, CAD, MXN, GBP, BDT, INR, KRW, CNY, TWD

`UiFormatSettings` controls locale, currency, FX rate, and date format (`YYYY/MM/DD` or `MM/DD/YYYY`).

### ID Generation

```typescript
`${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
```

---

## Domain Flows

### 1. CSV Import

**Data model:** CSV text -> `ParseResult { expenses: Expense[], source: ExpenseSource, error?: string }`

**Flow:**
1. User uploads CSV file
2. `detectCsvSource()` identifies bank (Amex or Apple Card) by header patterns
3. Bank-specific parser extracts transactions (`parseAmexCsv` / `parseAppleCsv`)
4. `importDedup` checks for duplicates using `date|roundedAmount` Map key with +/-0.01 tolerance
5. Preview shown to user with new vs duplicate counts
6. User confirms; `addExpenses()` merges into BudgetContext

**Key decisions:**
- Dedup uses O(1) Map lookup, not O(n^2) comparison
- Amount tolerance of +/-0.01 handles floating-point edge cases
- Only Amex and Apple Card parsers currently implemented
- Unknown/unsupported CSV formats return `{ expenses: [], source: "manual", error: "unknown-format" }`

### 2. Google Sheets Sync

**Data model:** BudgetContext state <-> 7 genjutsu-db domain sheets + Data blob + Totals sheet

**Flow (Push):**
1. Change detection via JSON signature comparison
2. Auto-sync debounces 2s after changes; periodic check every 5 min
3. `createSheetsClient()` builds genjutsu-db client with auth token
4. Each domain writes to its sheet tab via genjutsu-db repository
5. V2 data blob (gzip + Base64) written to Data sheet cell A1
6. Totals sheet updated with dynamic owner columns

**Flow (Pull):**
1. Read all 7 domain sheets via genjutsu-db
2. Dedup by key on merge into local state
3. V2 data blob read from Data sheet as fallback

**Key decisions:**
- Exponential backoff on Google Sheets API rate limits
- All API calls wrapped with `withTimeout` (30s for Drive API, 60s for sync operations)
- genjutsu-db handles model validation and formatting
- Mortgage expenses stored in separate tab

### 3. Export Pipeline

**PDF Export:**
1. Build visual report with charts and tables (jsPDF + jspdf-autotable)
2. Serialize all data to V2 minified payload (short keys, gzip, Base64)
3. Embed payload as machine-readable block in PDF
4. User can later import from PDF to restore data

**JSON Export:**
- Direct JSON serialization of all transaction data

### 4. Owner Accounting

**Data model:** Expenses with allocation + OwnerTransfers between owners

**Flow:**
1. Each expense has optional `allocationMode`: single (one owner pays), equal (split equally), custom (% or $ per owner)
2. `normalizeExpenseAllocation()` resolves allocation to concrete amounts, scaling to match total
3. `computeOwnerBalance()` builds monthly ledger per owner
4. `OwnerTransfer` records settle debts between owners
5. Dashboard shows per-owner spending, shared expenses, and net balances

### 5. Debt Tracking

**Data model:** `Debt` (principal) + `DebtPayment[]` (payment ledger)

**Flow:**
1. User creates debt with initial amount and optional start date
2. Payments recorded against debt via `debtId` foreign key
3. `getDebtBalance()` = initialAmount - sum(payments)
4. `computeDebtProgress()` = percentage paid off
5. Removing a debt cascades to remove related payments

---

## Configuration

### Vite (`vite.config.ts`)
- Plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`
- Path alias: `@/` -> `./src`
- Optimized deps exclude: `tesseract.js`

### TypeScript (`tsconfig.app.json`)
- Target: ES2022, Module: ESNext, JSX: react-jsx
- Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `erasableSyntaxOnly`
- Module resolution: bundler

### Vercel (`vercel.json`)
- Install: `bun install`, Build: `bun run build`
- SPA rewrite: all routes -> `/index.html`

### CI (`.github/workflows/ci.yml`)
Two sequential jobs on PRs and pushes to `main`:
1. **Financial Guard** — `bun run test:financial` (11 critical test files)
2. **Full Test + Build** — `bun test` then `bun run build`

Node 20.19.0, Bun 1.3.6

### Environment Variables (`.env`)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID

### Theme (`src/index.css`)
CSS custom properties define the design system:
- **Colors:** background, foreground, primary, secondary, accent, destructive, card, popover, muted, border, input, ring
- **Surfaces:** surface-0, surface-1, surface-2
- **Text:** text-primary, text-secondary, text-tertiary
- **Interactive:** interactive-primary, interactive-danger (with hover/active states)
- **Visualization:** viz-income, viz-expense, viz-debt, viz-series-1 through viz-series-5
- **Radius:** base (0.75rem) with sm/md/lg/xl/2xl/3xl/4xl variants
- **Shadows:** shadow-soft, shadow-strong
- **Focus:** focus-ring
- **Borders:** border-subtle, border-strong
- **Controls:** control-surface, control-hover, control-active, control-border
- **Fields:** field-surface, field-shadow
- **Spacing:** space-compact-1/2/3, space-regular-1/2/3
- **Motion:** duration-fast/normal/slow, ease-out/in/standard
- **Typography:** fluid font sizes via `clamp()`, line-height tight (1.2) and regular (1.45), font-sans (Inter), font-mono (JetBrains Mono)
- **Dark mode:** `.dark` class with OKLch color overrides
- **Utility classes:** `.ds-display`, `.ds-heading-1` through `.ds-heading-4`, `.ds-body`, `.ds-body-sm`, `.ds-label`, `.ds-caption`

### i18n (`src/i18n.ts`)
7 languages: English (default), Spanish, Bengali, Chinese, Korean, Hindi, Japanese. Locale persisted in localStorage under `ortho-locale`.

---

## File Reference

### Source Code (`src/`)

| Directory | Key Files | Purpose |
|-----------|-----------|---------|
| `components/ui/` | button, card, dialog, sheet, input, select, popover, tabs, accordion, checkbox, switch, table, tooltip, label, date-picker, month-year-picker, chart, alert-dialog | shadcn/ui primitives |
| `components/ds/` | DsMetricCard, DsChartCard, DsWidgetShell, DsWidgetCard, DsActionBar, DsEmptyState, DsSectionHeader, DsHelpTooltip, DsLegendList, DsSplitToggle, DsCreatableSelect, DsSidebarNavItem, DsSidebarBrand, DsDataRow, DsSheetActions, DsSheetHeader, DsWidgetCatalog, dsSidebarClasses | Custom design system |
| `components/layout/` | Sidebar, MobileBottomNav, Avatar, layoutConstants | App shell |
| `components/add-transaction/` | TransactionFormRow, AllocationEditor, PresetSelector, TransferFields | Transaction form |
| `components/` (root) | Layout, AddTransactionDialog, add-transaction-utils, SheetSetupDialog, SyncStatusIndicator, ErrorBoundary | Top-level components |
| `context/` | BudgetContext, ExpensesContext, IncomeContext, DebtContext, OwnerTransfersContext, SettingsContext, GoogleAuthContext, SheetSetupContext, SyncContext, PresetTransactionsContext, DashboardLayoutContext | State management |
| `hooks/` | useMediaQuery, useLongPress, useTheme | Custom React hooks |
| `lib/domain/` | totals, debtUtils, ownerAccounting, financialModel, mortgageMath, mortgageCategory, validation, dateRepair | Business logic |
| `lib/math/` | core (roundTo, sumAmountsBy, safeDivide, computeNetCashFlow, computeDebtBalance, etc.) | Financial math primitives |
| `lib/export/` | pdfExport, jsonExport, minifiedPayload, exportString, pdfText | Export pipeline |
| `lib/import/` | importDedup, importNormalize, dummyData | Import pipeline |
| `lib/parsers/` | amex, apple, csv-utils, index (detectCsvSource, parseCsv) | Bank CSV parsers |
| `lib/format/` | format (UiFormatSettings, formatCurrency, usdToDisplayAmount), currencyInput, dateInput, categoryColors, sourceLabels | Display formatting |
| `lib/platform/` | storage (StorageAdapter, STORAGE_KEYS), theme, fx, haptics, storageCleanup, withTimeout (TimeoutError) | Runtime utilities |
| `lib/sheets/` | client, models, data, totals | Google Sheets sync |
| `lib/widgets/` | widget (types), widgetRegistry, widgetGroups, defaultLayout, createWidget | Dashboard widgets |
| `lib/google/` | googleDrive | Google Drive API |
| `types/` | core, budget, context, settings, transactions, transactions-ui, debt, income, mortgage, totals, dashboard, ui, auth, sheets, import, payload, category, currency, pdf | Type definitions |
| `locales/` | en, es, bn, zh, ko, hi, ja | Translation files |
| `pages/dashboard/` | Dashboard, DashboardGrid, DashboardMobileGrid, DashboardFilters, DashboardKpiCards, DashboardDebtSnapshot, dashboardSelectors, insightsBuilder, useDashboardData | Dashboard page + data utilities |
| `pages/dashboard/widgets/` | NetCashFlow, TotalSpent, TotalIncome, TotalDebt, CashFlowChart, NetTrendChart, CategoryChart, OwnerSplitChart, OwnerExpenseByOwner, DebtSnapshot, SpendBySource, OwnerTransfers, RecentActivity | Dashboard widget components |
| `pages/transactions/` | TransactionsPage, transactionsLedger, TransactionsToolbar, ExpensesByMonthList, ExpensesByMonthTable, EditTransactionDialog, EditTransferDialog, DeleteTransactionDialogs, ExpenseActionsDialog, TransferActionsDialog, FiltersAndActionsDialog | Transactions page + sub-components |
| `pages/import/` | ImportPage, useImportState, ImportPreviewCard, ImportSourceCard | Import page + sub-components |
| `pages/income/` | IncomePage, IncomeList, IncomeTable, AddIncomeDialog, EditIncomeDialog, IncomeActionsDialog | Income page + sub-components |
| `pages/debt/` | DebtPage, DebtList, DebtListMobile, AddDebtDialog, AddPaymentDialog, DebtActionsDialog | Debt page + sub-components |
| `pages/mortgage/` | MortgagePage, MortgagePaymentsList, MortgagePaymentsTable, MortgageScheduleTable, MortgageScenarioCard, MortgageProfileCard, MortgageAmortizationChart, MortgageYearlySummary, AddMortgagePaymentDialog, DeleteMortgagePaymentDialog, MortgagePaymentActionsDialog | Mortgage page + sub-components |
| `pages/settings/` | SettingsPage, OwnersCard, ExpenseCategoriesCard, IncomeCategoriesCard, CardSourcesCard, GoogleSheetsCard | Settings page + sub-components |
| `pages/` | PresetsPage, AboutPage, LandingPage, LandingRoute, TourPage, AuthGate, LoginPage | Other route pages |

### Tests (`test/`)

| Category | Files | CI-Critical |
|----------|-------|-------------|
| Math | mathCore, totals, debtUtils, ownerAccounting, financialModel, mortgageMath | Yes |
| Format | format, currencyInput, fx | Yes |
| Selectors | dashboardSelectors | Yes |
| Ledger | transactionsLedger | Yes |
| Import/Export | importDedup, importNormalize, jsonExport, pdfExport, minifiedPayload, exportString, exportStringParse | No |
| Parsers | apple, csv-utils, parsers/index | No |
| Platform | storage, storageCleanup, theme, withTimeout, loadStoredBudget | No |
| Components | AddTransactionDialog, DatePicker, MonthYearPicker, Layout, sheet | No |
| Pages | Dashboard, Transactions, Import, Income, Debt, Mortgage, Settings, Presets, Tour, Auth, Landing + sub-components | No |
| Context | BudgetContext | No |
| Integration | AppFlows, importFlow, totalsComputation | No |
| Hooks | useLongPress | No |
| Widgets | createWidget, widgetGroups | No |
| Lib misc | categoryColors, dateInput, dateRepair, dummyData, googleDrive, googleSheets, mortgageCategory, sourceLabels, validation, utils, sheets/validate | No |
