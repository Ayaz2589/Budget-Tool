# Quickstart: Dashboard Widget Redesign

**Branch**: `005-widget-redesign`

## Setup

```bash
git checkout 005-widget-redesign
bun install
bun dev
```

## Development Cycle

1. **Run tests in watch mode**: `bun test`
2. **View dashboard**: Open `http://localhost:5173/dashboard`
3. **Test widget sizes**: Click "Edit Layout" → use S/M/L buttons on any widget
4. **Verify**: No content cropping, overflow, or truncation at any size

## Key Files

| File | Purpose |
|------|---------|
| `src/components/ds/DsWidgetCard.tsx` | NEW: Size-responsive card wrapper |
| `src/components/ds/DsWidgetShell.tsx` | Widget shell — integrates DsWidgetCard |
| `src/lib/widgetRegistry.tsx` | Widget registry — all 14 render functions |
| `src/pages/dashboard/widgets/` | Individual widget implementations |
| `src/pages/dashboard/Dashboard*.tsx` | Chart widgets + Quick Add + Grids |

## Implementation Order

1. Create `DsWidgetCard` component + tests
2. Integrate into `DsWidgetShell`
3. Update `DsMetricCard` to remove internal Card (now provided by shell)
4. Add size support to 5 chart/quick-add widgets
5. Enhance lg variants for all 14 widgets
6. Update `DsChartCard` to use Card component
7. Run full test suite: `bun test`
8. Build check: `bun run build`

## Validation Checklist

- [ ] All 42 widget-size combinations render without overflow
- [ ] Card styling consistent across all widgets (borders, shadows, radii)
- [ ] Size transitions work instantly (< 200ms) in edit mode
- [ ] Mobile view uses medium variant correctly
- [ ] Empty states display at all sizes
- [ ] Light and dark themes both work
- [ ] Existing tests pass: `bun test`
- [ ] TypeScript builds: `bun run build`
