# Quickstart: Save Multiple Layouts

## What This Feature Does

Allows users to save, name, and switch between multiple dashboard widget arrangements. Currently only one layout exists; this adds a collection of up to 10 named layouts with instant switching.

## Key Files to Modify

| File | Change |
|------|--------|
| `src/types/widget.ts` | Add `SavedLayoutEntry` and `SavedLayoutCollection` types |
| `src/lib/storage.ts` | Add `SAVED_LAYOUTS` storage key |
| `src/context/DashboardLayoutContext.tsx` | Add collection state, CRUD methods, migration from single→multi |
| `src/pages/dashboard/Dashboard.tsx` | Add layout switcher UI in section header |
| `src/locales/en.json` (+ 6 other locales) | Add i18n keys for layout management strings |

## New Files

| File | Purpose |
|------|---------|
| `src/components/ds/DsLayoutSwitcher.tsx` | Select dropdown + save/delete/rename UI |
| `test/context/DashboardLayoutContext.savedLayouts.test.ts` | Unit tests for collection CRUD |

## Architecture Decisions

1. **Two localStorage keys**: Existing `budget-tool-dashboard-layout` (active working layout, unchanged) + new `budget-tool-saved-layouts` (collection of snapshots). Backward compatible.
2. **Context extension**: New methods added to existing `DashboardLayoutContextValue`. No new context provider.
3. **UI pattern**: shadcn Select in section header (matches currency selector pattern). Save via Dialog, delete via AlertDialog.
4. **Migration**: First load auto-wraps existing single layout as "My Layout" alongside factory default.

## Development Order

1. Types + storage key
2. Context CRUD logic + migration + tests
3. Layout switcher UI component
4. Integration in Dashboard.tsx
5. i18n keys for all 7 locales
6. End-to-end manual verification

## Verification

```bash
bun test                    # All existing + new tests pass
bun run build               # TypeScript strict mode passes
bun dev                     # Manual: save, switch, delete, rename, refresh persistence
```
