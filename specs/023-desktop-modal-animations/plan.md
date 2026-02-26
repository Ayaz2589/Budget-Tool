# Implementation Plan: Desktop Modal with Animated Transitions

**Branch**: `023-desktop-modal-animations` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-desktop-modal-animations/spec.md`

## Summary

Replace right-side sliding sheets with centered modal overlays on desktop (768px+) for all add/edit forms across Transactions, Income, Debt, Mortgage, and Presets pages. Use framer-motion for smooth open/close animations (fade + scale). Mobile behavior is unchanged. Implementation adds a `desktopVariant` prop to `SheetContent` — consumer files need only one prop addition each.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: framer-motion ^12.23.24 (already installed), @radix-ui/react-dialog ^1.1.15, Tailwind CSS v4, shadcn/ui
**Storage**: N/A (purely presentational change)
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (React SPA, Vite 7)
**Project Type**: Web application (SPA)
**Performance Goals**: Animation at 60fps, < 250ms open/close transition
**Constraints**: Mobile behavior must remain unchanged; existing tests must pass without modification
**Scale/Scope**: 1 core component modified + 14 consumer files updated (1 prop addition each)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First Development | PASS | Modal provides focused form experience; visual feedback via smooth animations |
| II. Mobile-First Parity | PASS | Mobile behavior explicitly preserved (full-screen sheet unchanged). Desktop gets enhanced modal. |
| III. Financial Correctness | PASS | No financial logic changes |
| IV. Safe Destructive Actions | PASS | No change to delete/confirmation dialogs |
| V. Accessibility | PASS | Radix Dialog manages focus trapping, Escape, aria attributes — all preserved |
| VI. Incremental Refactoring | PASS | TDD approach: tests first, then SheetContent change, then consumer updates one at a time |
| VII. Simplicity | PASS | One prop addition to existing component, no new abstractions |

**Post-Phase 1 re-check**: All gates still pass. No new state management, no new components, no new files beyond test additions.

## Project Structure

### Documentation (this feature)

```text
specs/023-desktop-modal-animations/
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
│   │   └── sheet.tsx              # MODIFIED: add desktopVariant prop + framer-motion
│   └── AddTransactionDialog.tsx   # MODIFIED: add desktopVariant="modal"
├── pages/
│   ├── transactions/
│   │   ├── EditTransactionDialog.tsx     # MODIFIED: add desktopVariant="modal"
│   │   ├── EditTransferDialog.tsx        # MODIFIED: add desktopVariant="modal"
│   │   ├── FiltersAndActionsDialog.tsx   # MODIFIED: add desktopVariant="modal"
│   │   ├── ExpenseActionsDialog.tsx      # MODIFIED: add desktopVariant="modal"
│   │   └── TransferActionsDialog.tsx     # MODIFIED: add desktopVariant="modal"
│   ├── income/
│   │   ├── AddIncomeDialog.tsx           # MODIFIED: add desktopVariant="modal"
│   │   ├── EditIncomeDialog.tsx          # MODIFIED: add desktopVariant="modal"
│   │   └── IncomeActionsDialog.tsx       # MODIFIED: add desktopVariant="modal"
│   ├── debt/
│   │   ├── AddDebtDialog.tsx             # MODIFIED: add desktopVariant="modal"
│   │   └── DebtActionsDialog.tsx         # MODIFIED: add desktopVariant="modal"
│   ├── mortgage/
│   │   ├── AddMortgagePaymentDialog.tsx  # MODIFIED: add desktopVariant="modal"
│   │   └── MortgagePaymentActionsDialog.tsx # MODIFIED: add desktopVariant="modal"
│   └── presets/
│       └── PresetsPage.tsx               # MODIFIED: add desktopVariant="modal" (2 Sheets)

test/
└── components/
    └── ui/
        └── sheet.test.tsx                # NEW: SheetContent desktopVariant tests
```

**Structure Decision**: No new directories or files beyond the test file. All changes are modifications to existing files, consistent with Constitution Principle VI (prefer editing existing files).

## Complexity Tracking

No violations. Feature uses a single prop addition to an existing component — no new abstractions, no new state management, no new libraries.

## Key Design Decisions (from research.md)

1. **Strategy**: Add `desktopVariant` prop to `SheetContent` rather than creating a new component
2. **Animation**: framer-motion `AnimatePresence` + `motion.div` wrapping modal content (fade + scale, 250ms)
3. **DS Components**: `DsSheetHeader` and `DsSheetActions` require zero changes — they are portable
4. **Modal width**: `max-w-md` (448px) on desktop, up from `max-w-sm` (384px) used in sheets
5. **Test impact**: Existing tests unaffected — all use `role="dialog"` which is the same Radix primitive
6. **Files unchanged**: `DashboardFilters.tsx` and `DsWidgetCatalog.tsx` keep side-sheet behavior (no `desktopVariant` added)
