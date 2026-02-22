# Quickstart: 24-Column Dashboard Grid

## Scenario 1: New User

1. Open the app for the first time (no localStorage)
2. Dashboard loads with the default layout (version 6, 24-column)
3. All 14 widgets appear at their default positions
4. KPI cards span 6/24 = 25% width each (4 across the top row)
5. Chart widgets span 12/24 = 50% width at L size
6. Resize any widget using S/M/L picker — dimensions match the 24-col sizeDims

## Scenario 2: Returning User (v5 layout)

1. User has a saved layout at version 5 (16-column grid)
2. App loads and validateLayout() detects version 5
3. Migration runs: all x values × 1.5, all w values × 1.5, rounded to nearest int
4. Example: widget at x=0, w=4 → x=0, w=6
5. Example: widget at x=8, w=8 → x=12, w=12
6. Boundary check ensures no widget exceeds column 24
7. Layout version bumped to 6
8. User sees their widgets in the same relative positions, now on the 24-col grid

## Scenario 3: Returning User (v3/v4 layout)

1. User has a very old layout (version 3 or 4)
2. Migration chain: v3→v4 (ID migration) → v4→v5 (size migration) → v5→v6 (column migration)
3. All three migrations run in sequence within validateLayout()
4. User ends up on version 6 with correct IDs, sizes, and positions

## Scenario 4: Widget Resize After Migration

1. User's layout has been migrated to v6
2. User opens widget popover, selects "L" on a chart widget
3. Widget resizes to w=12, h=8 (from 24-col sizeDims)
4. Other widgets reflow to accommodate the size change
5. Layout is saved to localStorage at version 6

## Verification Checklist

- [ ] New user default layout renders correctly on 24-col grid
- [ ] v5 layout migrates to v6 with correct x/w scaling
- [ ] v3/v4 layouts migrate through the full chain to v6
- [ ] Widget S/M/L picker applies correct 24-col dimensions
- [ ] No widget extends past column 24 after migration
- [ ] Mobile layout (single column) is unaffected
- [ ] sm breakpoint (tablet) uses 12 columns instead of 8
- [ ] All existing tests pass
