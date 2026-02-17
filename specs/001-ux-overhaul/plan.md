# Implementation Plan: UX Overhaul

**Branch**: `001-ux-overhaul` | **Date**: 2026-02-16 | **Spec**: [spec.md](spec.md)

## Summary

Reduce click depth and navigation friction across the app by: (1) adding transaction/income entry directly from the dashboard with preset quick-action chips, (2) enabling inline category/owner editing on desktop tables, (3) adding creatable select dropdowns so users can add new categories/owners without leaving forms, and (4) upgrading empty states with action buttons and guidance.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 19, Tailwind CSS v4, shadcn/ui, Radix UI, framer-motion, Recharts
**Storage**: localStorage (via `StorageAdapter` in `src/lib/storage.ts`)
**Testing**: Bun test runner + React Testing Library + happy-dom (537+ tests)
**Target Platform**: Web SPA (Vite, deployed on Vercel)
**Project Type**: Single project (React SPA)
**Performance Goals**: 60fps UI, instant in-page interactions
**Constraints**: No backend, all data in localStorage, offline-capable
**Scale/Scope**: Personal budget app for couples

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Privacy-First, No Backend | PASS | All changes are client-side; no new external calls |
| II. Financial Accuracy | PASS | No changes to financial math in `src/lib/math/` |
| III. Incremental, Test-Gated | PASS | 6 phases with commit after each; `bun test` + `bun run build` at every gate |
| IV. Context-Driven State | PASS | New `DsCreatableSelect` calls existing `useBudget()` setters; no new context providers needed |
| V. Simplicity Over Abstraction | PASS | `DsCreatableSelect` is the only new component; rest is wiring existing components to new locations |
| VI. Internationalization | PASS | All new text uses i18n keys; ~15 new keys in `en.json` |
| VII. Secrets Stay Server-Side | PASS | No secrets involved |

## Project Structure

### Documentation (this feature)

```text
specs/001-ux-overhaul/
├── spec.md
├── plan.md              # This file
├── tasks.md             # Phase 2 output
└── checklists/
    └── requirements.md
```

### Source Code (files to create/modify)

```text
src/
├── components/
│   ├── ds/
│   │   ├── DsCreatableSelect.tsx     # NEW — Popover-based creatable select
│   │   ├── DsEmptyState.tsx          # MOD — add `actions` prop
│   │   └── index.ts                  # MOD — export DsCreatableSelect
│   ├── AddTransactionDialog.tsx      # MOD — add `initialPresetId` prop
│   └── add-transaction/
│       └── TransactionFormRow.tsx    # MOD — use DsCreatableSelect for category/owner
├── pages/
│   ├── dashboard/
│   │   ├── Dashboard.tsx             # MOD — add-transaction/income state, action buttons, preset strip
│   │   └── DashboardQuickAdd.tsx     # NEW — preset chip strip
│   ├── transactions/
│   │   ├── TransactionsPage.tsx      # MOD — pass inline-edit callbacks, update empty state
│   │   ├── ExpensesByMonthTable.tsx  # MOD — inline Select for category/owner
│   │   └── EditTransactionDialog.tsx # MOD — use DsCreatableSelect
│   ├── income/
│   │   ├── IncomePage.tsx            # MOD — pass inline-edit callbacks, update empty state
│   │   ├── IncomeTable.tsx           # MOD — inline Select for category/owner
│   │   └── AddIncomeDialog.tsx       # MOD — use DsCreatableSelect
│   ├── presets/
│   │   └── PresetsPage.tsx           # MOD — use DsCreatableSelect, update empty state
│   ├── debt/
│   │   └── DebtPage.tsx              # MOD — update empty state
│   └── import/
│       ├── ImportPage.tsx            # MOD — checkbox UI for missing metadata
│       └── useImportState.ts         # MOD — granular selection state in reducer
├── types/
│   └── transactions-ui.ts           # MOD — update AddTransactionDialogProps
└── locales/
    └── en.json                       # MOD — ~15 new translation keys

test/
└── [mirror structure for any new tests]
```

## Implementation Phases

### Phase 1 — Foundation (commit gate)
- Create `DsCreatableSelect` component (`Popover` + scrollable option list + inline create input)
- Extend `DsEmptyState` with optional `actions` prop
- Add all new i18n translation keys to `en.json`
- Export `DsCreatableSelect` from `src/components/ds/index.ts`

### Phase 2 — Dashboard Quick-Add [US1] (commit gate)
- Add `addTransactionOpen` / `addIncomeOpen` state to `Dashboard.tsx`
- Render `AddTransactionDialog` + `AddIncomeDialog` in Dashboard
- Expand mobile `DsActionBar` with 3 FABs (settings, income, expense)
- Add desktop header buttons ("Add Expense", "Add Income")
- Create `DashboardQuickAdd.tsx` preset chip strip
- Add `initialPresetId` prop to `AddTransactionDialog`
- Wire preset chip tap → dialog with preset pre-filled

### Phase 3 — Inline Editing [US2] (commit gate)
- Add `onUpdateCategory`, `onUpdateOwner`, `expenseCategories`, `ownerOptions` props to `ExpensesByMonthTable`
- Replace category/owner table cells with inline `Select` (borderless, transparent, hover highlight)
- Stop event propagation on inline cells to prevent actions sheet opening
- Wire callbacks in `TransactionsPage.tsx`
- Repeat for `IncomeTable.tsx` / `IncomePage.tsx`

### Phase 4 — Contextual Add-Missing [US3] (commit gate)
- Replace `Select` with `DsCreatableSelect` in `TransactionFormRow.tsx` (category + owner)
- Replace in `AddIncomeDialog.tsx`, `EditTransactionDialog.tsx`, `PresetsPage.tsx`
- Thread `onCreateExpenseCategory` / `onCreateOwner` callbacks from parent components
- Add granular selection state (`Set<string>` per category type) to `useImportState.ts` reducer
- Update `ImportPage.tsx` missing metadata dialog with per-item checkboxes

### Phase 5 — Empty States [US4] (commit gate)
- Update `TransactionsPage` empty state with "Add Transaction" + "Import CSV" buttons
- Update `IncomePage` empty state with "Add Income" button
- Update `PresetsPage` empty state (2 variants: no categories vs no presets)
- Update `DebtPage` empty state with "Add Debt" button

### Phase 6 — Polish (commit gate)
- Run `bun run build` — verify no TS errors
- Run `bun test` — verify all tests pass
- Visual QA: mobile dashboard FABs, desktop header buttons, preset chips, inline editing, creatable selects, empty states, import dialog
