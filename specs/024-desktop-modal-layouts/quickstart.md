# Quickstart: Desktop Modal Layout Optimization

**Branch**: `024-desktop-modal-layouts` | **Date**: 2026-02-26

## Prerequisites

- Bun installed
- Node.js 20+
- Repository cloned and on branch `024-desktop-modal-layouts`

## Setup

```bash
bun install   # No new packages needed
bun dev       # Start dev server
```

## Implementation Order (TDD)

### Step 1: Write tests for SheetContent `desktopModalSize` prop

Update `test/components/ui/sheet.test.tsx` with tests verifying:
- `desktopModalSize="compact"` (default) renders with `max-w-md`
- `desktopModalSize="standard"` renders with `max-w-xl`
- `desktopModalSize="wide"` renders with `max-w-2xl`
- Prop is ignored on mobile and when `desktopVariant="sheet"`

### Step 2: Add `desktopModalSize` prop to SheetContent

- Add `desktopModalSize?: "compact" | "standard" | "wide"` prop (default: `"compact"`)
- Map to Tailwind classes: compact → `max-w-md`, standard → `max-w-xl`, wide → `max-w-2xl`
- Apply in the desktop modal rendering path only

### Step 3: Assign width tiers to all consumers

Add `desktopModalSize` prop to each SheetContent:
- **Compact** (default, no change needed): ExpenseActionsDialog, TransferActionsDialog, IncomeActionsDialog, DebtActionsDialog, MortgagePaymentActionsDialog, Preset Actions
- **Standard**: AddIncomeDialog, EditIncomeDialog, AddDebtDialog, AddMortgagePaymentDialog, EditTransferDialog, Preset Editor
- **Wide**: AddTransactionDialog, EditTransactionDialog, FiltersAndActionsDialog

### Step 4: Multi-column layouts for complex forms

Update form field grids in wide-tier forms:
1. **EditTransactionDialog**: Change field grid from `grid-cols-1` to `grid-cols-1 md:grid-cols-2` with description spanning full width
2. **FiltersAndActionsDialog**: Change filter grid from `grid-cols-1` to `grid-cols-1 md:grid-cols-2` with search spanning full width
3. **AddTransactionDialog/TransactionFormRow**: Change field grid within each row from `grid-cols-1` to `grid-cols-1 md:grid-cols-2`
4. **EditTransferDialog**: Change field grid to pair date+amount and from+to owners

### Step 5: Run all tests

```bash
bun test                    # All tests must pass
bun run build               # TypeScript check + Vite build
```

## Key Files

| File | Role |
|------|------|
| `src/components/ui/sheet.tsx` | Core change — add desktopModalSize + width mapping |
| `test/components/ui/sheet.test.tsx` | Test updates for new prop |
| `src/components/AddTransactionDialog.tsx` | Wide tier + multi-column layout |
| `src/pages/transactions/EditTransactionDialog.tsx` | Wide tier + multi-column layout |
| `src/pages/transactions/FiltersAndActionsDialog.tsx` | Wide tier + multi-column layout |
| `src/pages/transactions/EditTransferDialog.tsx` | Standard tier + 2-column pairs |
| `src/components/add-transaction/TransactionFormRow.tsx` | Multi-column layout within rows |

## Verification

1. Open Add Transaction on desktop: should be 672px wide with 2-column field grid
2. Open Add Income on desktop: should be 576px wide with single-column fields
3. Open Expense Actions on desktop: should be 448px wide (unchanged)
4. Open any form on mobile: should be full-screen sheet (unchanged)
5. Resize browser across breakpoint: layout should transition cleanly
