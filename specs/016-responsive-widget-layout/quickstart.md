# Quickstart: Responsive Widget Layout

**Feature**: 016-responsive-widget-layout
**Branch**: `016-responsive-widget-layout`

## What This Feature Does

Fixes broken/overlapping dashboard widgets at tablet viewport widths (768px-1200px) by computing derived layouts for the `md` and `sm` breakpoints from the user's `lg` layout at render time.

## Files to Change

| File | Change |
|------|--------|
| `src/pages/dashboard/DashboardGrid.tsx` | Add `deriveSmLayout()`, update `rglLayouts` memo, update `handleLayoutChange` signature |
| `test/pages/dashboard/deriveSmLayout.test.ts` | New unit test file for the scaling function |

## Files NOT Changed

| File | Reason |
|------|--------|
| `src/context/DashboardLayoutContext.tsx` | Still stores single `desktopGrid` — no changes needed |
| `src/types/widget.ts` | No type changes needed |
| `src/lib/widgetRegistry.tsx` | Widget dimensions unchanged |
| `src/lib/defaultLayout.ts` | Default positions unchanged |
| `src/pages/dashboard/Dashboard.tsx` | Mobile breakpoint switch unchanged |

## Implementation Steps

1. **Add `deriveSmLayout` helper** to `DashboardGrid.tsx` (pure function, top-level)
2. **Update `rglLayouts` memo** to return `{ lg, md: lg, sm: deriveSmLayout(lg) }`
3. **Update `handleLayoutChange`** to use two-argument signature and only persist from `allLayouts.lg`
4. **Add unit tests** for `deriveSmLayout` covering scaling, clamping, and edge cases
5. **Run `bun test` and `bun run build`** to verify no regressions

## Verification Checklist

- [ ] Resize from >1200px to 768px — widgets reflow cleanly
- [ ] Resize back up — layout restores exactly
- [ ] Drag widget at lg, resize down/up — position persists
- [ ] No overlaps at any width 768-1200px
- [ ] `bun test` passes
- [ ] `bun run build` succeeds
