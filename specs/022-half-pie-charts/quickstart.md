# Quickstart: Half-Pie Charts with Gaps & Rounded Corners

**Branch**: `022-half-pie-charts` | **Date**: 2026-02-23

## Overview

Convert the 2 dashboard pie charts (Category Chart, Owner Split Chart) from full-circle pies to half-pie (semicircle) charts with rounded segment corners and visible gaps between segments.

## Prerequisites

- Bun installed
- On branch `022-half-pie-charts`
- recharts v2.15.4 (already in project, no install needed)

## Quick Start

```bash
git checkout 022-half-pie-charts
bun install
bun dev
```

Navigate to `/dashboard` with expense data to see pie charts.

## What Changes

### Files Modified (3)

| File | Change |
|------|--------|
| `src/pages/dashboard/widgets/CategoryChart.tsx` | Add half-pie props to 2 `<Pie>` instances, adjust container heights |
| `src/pages/dashboard/widgets/OwnerSplitChart.tsx` | Add half-pie props to 1 `<Pie>` instance, adjust container heights |
| `src/lib/widgets/widgetRegistry.tsx` | Reduce lg height from 8 to 6 rows for both chart widgets |

### Key Pie Props Added

```tsx
<Pie
  startAngle={180}     // semicircle: left edge
  endAngle={0}         // semicircle: right edge
  cx="50%"             // center horizontally
  cy="80%"             // push center down to fill space
  cornerRadius={6}     // rounded segment corners
  paddingAngle={4}     // gap between segments
/>
```

## Verification

1. Open dashboard with expense data
2. Confirm Category Chart renders as semicircle at md and lg sizes
3. Confirm Owner Split Chart renders as semicircle at md and lg sizes
4. Verify rounded corners visible on segments
5. Verify gaps between segments
6. Check tooltips still work on hover
7. Check legend still displays correctly
8. Toggle dark mode — colors should render correctly
9. Check sm size — should remain text-only (no chart)

## Testing

```bash
bun test                    # All tests
bun run test:financial      # Financial guard tests (must pass)
bun run build               # TypeScript check + build
```
