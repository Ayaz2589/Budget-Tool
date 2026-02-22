# Contract: handleLayoutChange (updated)

**Purpose**: Persist widget position changes only when triggered by the lg breakpoint.

## Current Signature

```
handleLayoutChange(currentLayout: Layout[]) → void
```

## Updated Signature

```
handleLayoutChange(currentLayout: Layout[], allLayouts: Record<string, Layout[]>) → void
```

## Behavior

1. If `hasInteracted` is false → return (no-op, prevents mount-time persistence)
2. Extract `allLayouts.lg` as the source of truth
3. If `allLayouts.lg` is undefined or empty → return (breakpoint not lg)
4. Map `layout.desktopGrid` items: for each visible item, find its match in `allLayouts.lg` by `i === id` and update `x` and `y`
5. Call `updateDesktopGrid(updated)` to persist

## Key Constraint

Only `allLayouts.lg` is used for persistence. Changes from `md` and `sm` breakpoints are ignored entirely, preventing derived layout reflows from corrupting the saved layout.
