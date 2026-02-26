# Research: Desktop Modal with Animated Transitions

**Branch**: `023-desktop-modal-animations` | **Date**: 2026-02-26

## Decision 1: Implementation Strategy — Modify SheetContent vs New Component

**Decision**: Add a `desktopVariant` prop to `SheetContent` in `src/components/ui/sheet.tsx`.

**Rationale**:
- Sheet and Dialog both use `@radix-ui/react-dialog` underneath — they are the same Radix primitive with different presentation
- `SheetContent` already uses `useMediaQuery("(max-width: 767px)")` for mobile detection — the viewport-aware plumbing exists
- Adding `desktopVariant?: "sheet" | "modal"` (default: `"sheet"`) keeps backward compatibility — action sheets and other non-form sheets remain unchanged
- Only FR-008 forms need to pass `desktopVariant="modal"` (~10 files)
- Creating a new DS component adds an unnecessary abstraction layer (violates Constitution Principle VII: Simplicity)

**Alternatives considered**:
- **Global SheetContent change (all sheets become modals on desktop)**: Rejected because FR-009 requires action/confirmation sheets to remain unchanged, and DashboardFilters/DsWidgetCatalog should stay as side panels
- **New `DsFormModal` DS component**: Rejected because it creates an abstraction for what is a presentation variant of the same primitive — the Sheet already handles responsive behavior
- **Replace Sheet with Dialog per-file**: Rejected because it requires rewriting imports and restructuring every form, and `DsSheetHeader` would need duplication

## Decision 2: Framer-Motion Integration Approach

**Decision**: Use `AnimatePresence` + `motion.div` wrapping the modal content, co-existing with the Radix Dialog portal.

**Rationale**:
- Radix Dialog manages focus trapping, Escape key, overlay click, and accessibility — these must not be disrupted
- framer-motion's `AnimatePresence` handles exit animations (the hard part — Radix removes DOM on close)
- The TourPage already uses this exact pattern: `AnimatePresence` + `motion.div` with variant definitions
- The Radix `data-[state=open/closed]` CSS animations must be disabled when framer-motion is active (to avoid double-animation)

**Alternatives considered**:
- **CSS-only animations (Tailwind `animate-in`/`animate-out`)**: Already in use. Rejected because the user explicitly requested framer-motion for richer animation control
- **Replace Radix Dialog entirely with framer-motion + custom focus trap**: Rejected because it would break accessibility, Sheet/Dialog parity, and existing tests that rely on `role="dialog"`

## Decision 3: Animation Specification

**Decision**: Fade + scale, matching TourPage precedent, 250ms duration.

**Rationale**:
- TourPage desktop variants use `{ opacity: 0, y: 12, scale: 0.985 }` → `{ opacity: 1, y: 0, scale: 1 }` — this is the established framer-motion pattern in the codebase
- For modal dialogs, a slightly more pronounced scale (0.95 → 1.0) feels appropriate for a container appearing from the center
- 250ms is the sweet spot between 200ms (current CSS animations) and 300ms (feels sluggish)

**Animation variants**:
```
Open:  { opacity: 0, scale: 0.95 } → { opacity: 1, scale: 1 }
Close: { opacity: 1, scale: 1 } → { opacity: 0, scale: 0.95 }
Backdrop: { opacity: 0 } → { opacity: 1 } (in sync)
Duration: 250ms, ease: easeOut
```

## Decision 4: DsSheetHeader and DsSheetActions Compatibility

**Decision**: No changes needed to either component.

**Rationale**:
- `DsSheetActions` is a pure layout component with zero Sheet/Dialog imports — fully portable
- `DsSheetHeader` imports `SheetHeader`, `SheetTitle`, `SheetDescription` from sheet.tsx, but these are thin wrappers around `DialogPrimitive.Title` and `DialogPrimitive.Description` — the same Radix primitives. They render correctly regardless of whether the parent is a sheet-style or modal-style container
- The visual styling (border-bottom header, padded content) works in both side-panel and centered-modal layouts

## Decision 5: Form Width in Modal Mode

**Decision**: Use `max-w-md` (448px) for desktop modals, up from `max-w-sm` (384px) used in sheets.

**Rationale**:
- Side sheets appear narrow because they share the viewport with page content — 384px is appropriate
- Centered modals take visual focus of the entire viewport — 384px feels cramped, 448px provides breathing room for form fields while staying compact
- Consistent with the existing Dialog component which uses `sm:max-w-lg` (512px) — modals can be a bit wider than sheets

## Decision 6: Which Files to Convert

**Decision**: Convert 13 Sheet usages in 12 files (PresetsPage has 2 Sheets).

**Forms (add `desktopVariant="modal"`):**

| File | Form |
|------|------|
| `src/components/AddTransactionDialog.tsx` | Add Transaction |
| `src/pages/transactions/EditTransactionDialog.tsx` | Edit Transaction |
| `src/pages/transactions/EditTransferDialog.tsx` | Edit Transfer |
| `src/pages/transactions/FiltersAndActionsDialog.tsx` | Filters & Actions |
| `src/pages/transactions/ExpenseActionsDialog.tsx` | Expense Actions |
| `src/pages/transactions/TransferActionsDialog.tsx` | Transfer Actions |
| `src/pages/income/AddIncomeDialog.tsx` | Add Income |
| `src/pages/income/EditIncomeDialog.tsx` | Edit Income |
| `src/pages/income/IncomeActionsDialog.tsx` | Income Actions |
| `src/pages/debt/AddDebtDialog.tsx` | Add Debt |
| `src/pages/debt/DebtActionsDialog.tsx` | Debt Actions |
| `src/pages/mortgage/AddMortgagePaymentDialog.tsx` | Add Mortgage Payment |
| `src/pages/mortgage/MortgagePaymentActionsDialog.tsx` | Mortgage Payment Actions |
| `src/pages/presets/PresetsPage.tsx` | Preset Editor + Preset Actions (2 Sheets) |

**Sheets left unchanged (not in FR-008 scope):**
- `src/pages/dashboard/DashboardFilters.tsx` — settings panel, not a form
- `src/components/ds/DsWidgetCatalog.tsx` — widget catalog, not a form

**Already a Dialog (no conversion needed):**
- `src/pages/debt/AddPaymentDialog.tsx` — already uses Dialog component

## Decision 7: Test Strategy

**Decision**: Existing tests require no changes. Add one new test for the responsive behavior.

**Rationale**:
- All tests use `getByRole("dialog")` / `within(dialog)` — both Sheet and Dialog render `role="dialog"` via Radix
- Tests do NOT assert on animation classes, positioning, or slide direction
- Tests render in happy-dom which doesn't have `matchMedia` — `useMediaQuery` returns `false` (desktop) by default, which means tests will exercise the new modal path automatically
- One new test should verify the `desktopVariant` prop behavior at the SheetContent level
