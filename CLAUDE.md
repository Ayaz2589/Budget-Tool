# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Budget Tool (Ortho) — a personal budgeting web app for couples. Built with React 19, TypeScript, Vite, Tailwind CSS v4, and shadcn/ui. Deployed on Vercel. Package manager is **Bun**.

## Commands

```bash
bun install                          # Install dependencies
bun dev                              # Dev server (Vite)
bun run build                        # TypeScript check + Vite build
bun run lint                         # ESLint
bun test                             # Run all tests (watch mode)
bun test test/lib/mathCore.test.ts   # Run a single test file
bun run test:financial               # Financial guard tests (CI-critical subset)
bun test --coverage                  # Coverage report
npx shadcn@latest add <name>         # Add a shadcn/ui component
```

## CI Pipeline

GitHub Actions runs two sequential jobs on PRs and pushes to `main`:
1. **Financial Guard** — runs `test:financial` (11 critical financial test files) and must pass first
2. **Full Test + Build** — runs all tests then builds

## Architecture

### State Management
React Context API with modular providers (no Redux/Zustand). Top-level contexts:
- **BudgetContext** (`src/context/BudgetContext.tsx`) — composes domain-specific sub-contexts and persists to `localStorage`.
- **GoogleAuthContext** (`src/context/GoogleAuthContext.tsx`) — Google OAuth session.
- **PresetTransactionsContext** (`src/context/PresetTransactionsContext.tsx`) — user-defined transaction templates.

Domain sub-contexts (composed by BudgetContext):
- **ExpensesContext** — expense CRUD and state
- **IncomeContext** — income CRUD and state
- **DebtContext** — debt tracking and payments
- **OwnerTransfersContext** — owner split/transfer ledger
- **SettingsContext** — app settings (owners, currency, categories)
- **SyncContext** — Google Sheets sync orchestration
- **SheetSetupContext** — spreadsheet setup and connection

All data lives in `localStorage`. There is no backend database.

### Routing
React Router v7 with an auth gate pattern. Public routes: `/`, `/tour`, `/auth`. Protected routes under `/dashboard/*`.

### Key Data Types (`src/types/core.ts`)
- `Expense` — date, amount, description, category, source (card), optional owner/allocation
- `Income` — date, amount, description, category, optional owner
- `Debt` / `DebtPayment` — debt tracking with payment ledger
- `OwnerTransfer` — ledger entries for splitting expenses between owners
- `ExpenseSource` — union type for card sources (amex, apple, chase, manual, etc.)

### Data Flows
- **Import**: CSV/PDF → bank-specific parser (`src/lib/parsers/`) → dedup (`importDedup.ts`) → preview → merge into context
- **Sync**: Context data → minified payload → Google Sheets API (push) or Sheets → context (pull)
- **Export**: Context data → PDF with V2 machine-readable block (gzip + Base64) or JSON
- **Calculations**: Raw transactions → selector functions (`dashboardSelectors.ts`) → derived totals/charts

### Styling
Tailwind CSS v4 via `@tailwindcss/vite` plugin (no separate tailwind.config). CSS custom properties for theming defined in `src/index.css`. Dark mode via `@dark` variant. Chart colors use `--viz-*` CSS variables.

### Internationalization
i18next with 7 languages. Translation files in `src/locales/`. Stored in `localStorage` key `ortho-locale`. To add a locale: create JSON file in `src/locales/`, register in `src/i18n.ts`, add option in `Layout.tsx`.

## Testing

Bun's built-in test runner + React Testing Library + happy-dom. Tests in `test/` mirror `src/` structure. Setup in `test/setup.ts`. Financial math functions have dedicated guard tests that gate CI.

## Key Conventions

- `src/lib/` contains pure helper functions and I/O modules, organized into subdirectories:
  - `src/lib/math/` — core financial math (`core.ts`)
  - `src/lib/sheets/` — Google Sheets sync (12 modules: api, sync, data, formatting, per-domain files)
  - `src/lib/parsers/` — bank-specific CSV parsers (amex, apple, csv-utils)
- `src/components/ui/` is shadcn/ui components; `src/components/ds/` is the custom design system.
- Path alias `@/` maps to `src/`.
- TypeScript strict mode is enabled (`noUnusedLocals`, `noUnusedParameters`).
- Refactors are done incrementally — add/update tests first, then change code, run `bun test` after each change.
