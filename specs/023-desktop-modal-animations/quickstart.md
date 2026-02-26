# Quickstart: Desktop Modal with Animated Transitions

**Branch**: `023-desktop-modal-animations` | **Date**: 2026-02-26

## Prerequisites

- Bun installed
- Node.js 20+
- Repository cloned and on branch `023-desktop-modal-animations`

## Setup

```bash
bun install   # framer-motion already in dependencies, no new packages
bun dev       # Start dev server
```

## Implementation Order (TDD)

### Step 1: Write tests for SheetContent `desktopVariant` prop

Add tests to `test/components/ui/sheet.test.tsx` verifying:
- `desktopVariant="modal"` renders centered (not as side panel)
- `desktopVariant="sheet"` (default) preserves current behavior
- Mobile viewport always renders as sheet regardless of `desktopVariant`

### Step 2: Modify SheetContent in `src/components/ui/sheet.tsx`

- Add `desktopVariant?: "sheet" | "modal"` prop (default: `"sheet"`)
- When desktop + `desktopVariant="modal"`: render centered with framer-motion
- Import `AnimatePresence`, `motion` from `framer-motion`
- Define modal animation variants (fade + scale, 250ms)
- Disable Tailwind CSS `animate-in`/`animate-out` when in modal mode

### Step 3: Update each form to use `desktopVariant="modal"`

Add `desktopVariant="modal"` to `<SheetContent>` in:
1. `src/components/AddTransactionDialog.tsx`
2. `src/pages/transactions/EditTransactionDialog.tsx`
3. `src/pages/transactions/EditTransferDialog.tsx`
4. `src/pages/transactions/FiltersAndActionsDialog.tsx`
5. `src/pages/transactions/ExpenseActionsDialog.tsx`
6. `src/pages/transactions/TransferActionsDialog.tsx`
7. `src/pages/income/AddIncomeDialog.tsx`
8. `src/pages/income/EditIncomeDialog.tsx`
9. `src/pages/income/IncomeActionsDialog.tsx`
10. `src/pages/debt/AddDebtDialog.tsx`
11. `src/pages/debt/DebtActionsDialog.tsx`
12. `src/pages/mortgage/AddMortgagePaymentDialog.tsx`
13. `src/pages/mortgage/MortgagePaymentActionsDialog.tsx`
14. `src/pages/presets/PresetsPage.tsx` (2 Sheet usages)

### Step 4: Run all tests

```bash
bun test                    # All 569+ tests must pass
bun run build               # TypeScript check + Vite build
```

## Key Files

| File | Role |
|------|------|
| `src/components/ui/sheet.tsx` | Core change — add desktopVariant + framer-motion |
| `src/components/ds/DsSheetHeader.tsx` | Unchanged — works in both modes |
| `src/components/ds/DsSheetActions.tsx` | Unchanged — pure layout component |
| `src/hooks/useMediaQuery.ts` | Unchanged — already used by sheet.tsx |
| `src/pages/tour/TourPage.tsx` | Reference — existing framer-motion patterns |

## Verification

1. Open any form on desktop (768px+): should appear as centered modal with fade+scale animation
2. Open same form on mobile (<768px): should appear as full-screen sheet (unchanged)
3. DashboardFilters and DsWidgetCatalog: should remain as side sheets on desktop
4. Close via Cancel, X, Escape, backdrop click: all should animate out
5. Long forms (Add Transaction with many fields): content scrolls, header/footer fixed
