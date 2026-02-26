# Research: Desktop Modal Layout Optimization

**Branch**: `024-desktop-modal-layouts` | **Date**: 2026-02-26

## Decision 1: Width Tier Implementation Strategy

**Decision**: Use the `desktopModalSize` prop on SheetContent (new prop) that maps to Tailwind `max-w-*` classes in the modal rendering path. Three values: `"compact"` (default, `max-w-md` = 448px), `"standard"` (`max-w-xl` = 576px), `"wide"` (`max-w-2xl` = 672px).

**Rationale**: The modal rendering path in `sheet.tsx` already applies `max-w-md` as a base class. Adding a size prop follows the same pattern as `desktopVariant` — consumers pass one prop, SheetContent handles the mapping. Tailwind's built-in scale provides the exact pixel values needed without custom config.

**Alternatives considered**:
- Override via consumer `className` with `!max-w-2xl` — rejected because `!important` overrides are fragile and the base class in `sheet.tsx` would conflict
- CSS custom property `--modal-width` — rejected, adds unnecessary complexity vs simple class mapping
- Separate width prop in pixels — rejected, not aligned with Tailwind utility approach

## Decision 2: Consumer className Conflict Resolution

**Decision**: Consumer classNames that include sheet-specific classes (`h-full`, `w-[85vw]`, `max-w-sm`, `border-l`, `rounded-l-2xl`) are intended for the mobile/sheet rendering path. The modal path should ignore these via conditional className application — consumers pass separate `className` and `modalClassName` props, or (simpler) the existing `className` continues to work because the modal path's base classes override sheet-specific ones, and consumers can use responsive utilities.

**Chosen approach**: Keep single `className` prop. The modal rendering path already uses `cn()` to merge, and the modal's `fixed inset-0 m-auto` positioning makes sheet-specific classes like `h-full`, `border-l`, `rounded-l-2xl` harmless (they get overridden by the modal's centered positioning). The key conflict is `max-w-sm` from consumers — this will be overridden by the modal path's size class. Consumer classNames like `p-0`, `gap-0`, `flex flex-col`, `overflow-hidden` are still useful in modal mode.

**Rationale**: Minimizes consumer changes. Adding a separate `modalClassName` creates API complexity. The `cn()` merge with the new size classes handles width correctly.

## Decision 3: Multi-Column Layout Strategy

**Decision**: Use Tailwind responsive grid classes (`grid-cols-1 md:grid-cols-2`) directly in the form components. No `useMediaQuery` hook needed in form components — pure CSS responsive classes are sufficient since the modal is already wide enough at `md` breakpoint (768px+).

**Rationale**:
- Tailwind's `md:` responsive prefix already targets `min-width: 768px`, matching the desktop modal breakpoint
- The modal is fixed-position and centered — its internal width matches the `max-w-*` class, not the viewport
- However, since modal content doesn't create a container query context, and `md:` checks viewport width (not modal width), this works correctly: at 768px+ viewport, the modal is in modal mode AND the wide variant has enough space for 2 columns
- Avoids adding `useMediaQuery` imports to every form component

**Alternatives considered**:
- `useMediaQuery` hook in each form — rejected, adds runtime JS for something CSS handles natively
- Container queries (`@container`) — rejected, not widely used in codebase, adds complexity
- Conditional rendering with `isMobile` — rejected, same as useMediaQuery, unnecessary

## Decision 4: Form Field Grouping

**Decision**: Group fields following financial form conventions:
- **Date + Amount**: Always paired (the "when" and "how much")
- **Source + Category**: Always paired (the "from where" and "what type")
- **Description**: Full width (free text benefits from space)
- **Owner + Split**: Below description, split controls may span full width
- **Filters**: Pair complementary filters (month+type, source+category, owner+search)

**Rationale**: Standard UX practice for financial forms. Related fields adjacent reduces cognitive load. Full-width for description/search maximizes input space for free text.

## Decision 5: Sheet-Specific Classes in Modal Mode

**Decision**: The consumer `className` strings contain many sheet-specific classes (`h-full`, `w-[85vw]`, `max-w-sm`, `border-l`, `rounded-l-2xl`). Rather than changing every consumer's className, the modal rendering path in `sheet.tsx` should apply its own base classes with higher specificity, effectively overriding the sheet-specific ones.

**Analysis of consumer classes in modal context**:
- `h-full` → overridden by modal's `h-fit max-h-[90vh]`
- `w-[85vw]` → overridden by modal's `w-full max-w-{size}`
- `max-w-sm` → overridden by modal's size-specific `max-w-{md|xl|2xl}`
- `border-l` → harmless (no visible effect on centered modal)
- `rounded-l-2xl` → overridden by modal's `rounded-xl`
- `p-0`, `gap-0`, `flex flex-col`, `overflow-hidden` → still useful in modal mode

**Conclusion**: No consumer className changes needed for width tiers (US1). Only multi-column layout changes (US2) require editing form components.

## Decision 6: Which Forms Get Multi-Column Layouts

**Decision**: Only forms with 6+ fields in "wide" tier get multi-column layouts:

| Form | Fields | Width Tier | Layout |
|------|--------|------------|--------|
| AddTransactionDialog | 8+ per row | Wide | 2-column grid per row |
| EditTransactionDialog | 8+ | Wide | 2-column grid |
| FiltersAndActionsDialog | 7 | Wide | 2-column grid |
| EditTransferDialog | 5 | Standard | 2-column (date+amount, from+to) |
| AddIncomeDialog | 5 | Standard | Single column |
| EditIncomeDialog | 5 | Standard | Single column |
| AddDebtDialog | 4 | Standard | Single column |
| AddMortgagePaymentDialog | 3 | Standard | Single column |
| Preset Editor | 5 | Standard | Single column |
| All Action Dialogs | 0-2 editable | Compact | Single column |

**Rationale**: EditTransferDialog gets 2-column because from/to owners side-by-side is a natural UX pattern for transfers. Other standard-tier forms have too few fields (3-5) to benefit from 2 columns — they'd look unbalanced.

## Decision 7: Consistent Spacing Values

**Decision**: Standardize internal spacing across all modal tiers:
- Modal padding: `p-0` (DsSheetHeader and DsSheetActions handle their own padding)
- Form content area: `px-5 pt-4 pb-6` (slightly wider than current `px-4` for standard/wide tiers)
- Field gap: `gap-4` for standard/wide, `gap-5` for action dialogs (existing pattern)
- Section gap: `gap-6` between form sections

**Rationale**: Current forms use `px-4` which works at 448px but feels tight at 576-672px. Bumping to `px-5` (20px) provides breathing room. Keeping `px-4` on compact tier since it's still 448px.
