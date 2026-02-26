# Implementation Plan: Desktop Modal Layout Optimization

**Branch**: `024-desktop-modal-layouts` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-desktop-modal-layouts/spec.md`

## Summary

Widen desktop modals from a single 448px size to three context-appropriate tiers: compact (448px) for action dialogs, standard (576px) for simple forms, and wide (672px) for complex forms. Add multi-column grid layouts to complex forms (Add/Edit Transaction, Filters, Edit Transfer) to reduce scrolling and group related fields logically. Implementation adds a `desktopModalSize` prop to SheetContent and updates form layouts in 4 consumer files.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: framer-motion ^12.34.0 (already installed), @radix-ui/react-dialog, Tailwind CSS v4, shadcn/ui
**Storage**: N/A (purely presentational change)
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (React SPA, Vite 7)
**Project Type**: Web application (SPA)
**Performance Goals**: Animation at 60fps, no layout shift on open
**Constraints**: Mobile behavior must remain unchanged; existing tests must pass without modification
**Scale/Scope**: 1 core component modified (sheet.tsx) + 9 consumer files updated for size prop + 4 form files updated for multi-column layout

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First Development | PASS | Width tiers match content complexity; multi-column reduces cognitive load and scrolling |
| II. Mobile-First Parity | PASS | Mobile behavior explicitly preserved (full-screen sheet unchanged). Desktop gets optimized layouts. |
| III. Financial Correctness | PASS | No financial logic changes |
| IV. Safe Destructive Actions | PASS | No change to delete/confirmation flows |
| V. Accessibility | PASS | Radix Dialog manages focus trapping, Escape, aria attributes — all preserved |
| VI. Incremental Refactoring & TDD | PASS | TDD approach: tests first for size prop, then SheetContent change, then consumer updates |
| VII. Simplicity | PASS | One prop addition to existing component, Tailwind responsive classes for layouts, no new abstractions |

**Post-Phase 1 re-check**: All gates still pass. No new state management, no new components, no new files beyond test updates.

## Project Structure

### Documentation (this feature)

```text
specs/024-desktop-modal-layouts/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── sheet-content-api.ts
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ui/
│   │   └── sheet.tsx                      # MODIFIED: add desktopModalSize prop
│   ├── AddTransactionDialog.tsx           # MODIFIED: wide tier + layout reference
│   └── add-transaction/
│       └── TransactionFormRow.tsx          # MODIFIED: multi-column grid in rows
├── pages/
│   ├── transactions/
│   │   ├── EditTransactionDialog.tsx       # MODIFIED: wide tier + multi-column grid
│   │   ├── EditTransferDialog.tsx          # MODIFIED: standard tier + 2-column pairs
│   │   ├── FiltersAndActionsDialog.tsx     # MODIFIED: wide tier + multi-column grid
│   │   ├── ExpenseActionsDialog.tsx        # UNCHANGED (compact is default)
│   │   └── TransferActionsDialog.tsx       # UNCHANGED (compact is default)
│   ├── income/
│   │   ├── AddIncomeDialog.tsx             # MODIFIED: standard tier
│   │   ├── EditIncomeDialog.tsx            # MODIFIED: standard tier
│   │   └── IncomeActionsDialog.tsx         # UNCHANGED (compact is default)
│   ├── debt/
│   │   ├── AddDebtDialog.tsx               # MODIFIED: standard tier
│   │   └── DebtActionsDialog.tsx           # UNCHANGED (compact is default)
│   ├── mortgage/
│   │   ├── AddMortgagePaymentDialog.tsx    # MODIFIED: standard tier
│   │   └── MortgagePaymentActionsDialog.tsx # UNCHANGED (compact is default)
│   └── presets/
│       └── PresetsPage.tsx                 # MODIFIED: standard tier (preset editor only)

test/
└── components/
    └── ui/
        └── sheet.test.tsx                  # MODIFIED: add desktopModalSize tests
```

**Structure Decision**: No new files. All changes are modifications to existing files, consistent with Constitution Principle VI (prefer editing existing files). Action dialogs that use compact (default) need no code changes.

## Complexity Tracking

No violations. Feature uses a single prop addition to an existing component and Tailwind responsive utilities for layout — no new abstractions, no new state management, no new libraries.

## Key Design Decisions (from research.md)

1. **Strategy**: Add `desktopModalSize` prop to SheetContent mapping to Tailwind `max-w-*` classes
2. **Width mapping**: compact → `max-w-md` (448px), standard → `max-w-xl` (576px), wide → `max-w-2xl` (672px)
3. **Consumer className conflicts**: Resolved by modal path's base classes overriding sheet-specific ones via `cn()` merge order
4. **Multi-column approach**: Pure Tailwind responsive classes (`md:grid-cols-2`) — no `useMediaQuery` needed in form components
5. **Field grouping**: Date+Amount, Source+Category, Description full-width, Owner+Split below
6. **Compact dialogs unchanged**: Default size is `"compact"`, so 6 action dialogs need zero code changes
7. **Spacing**: Forms in standard/wide tiers use `px-5` for breathing room; compact stays at `px-4`
