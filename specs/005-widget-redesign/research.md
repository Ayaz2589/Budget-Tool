# Research: Dashboard Widget Redesign

**Date**: 2026-02-21 | **Branch**: `005-widget-redesign`

## Current Widget System Analysis

### Widget Inventory (14 total)

| # | Widget Type | Category | Has Size Support | Card Wrapper Used |
|---|-------------|----------|-----------------|-------------------|
| 1 | kpi-net-cash-flow | KPI | Yes (sm vs md/lg) | DsMetricCard |
| 2 | kpi-total-spent | KPI | Yes (sm vs md/lg) | DsMetricCard |
| 3 | kpi-total-income | KPI | Yes (sm vs md/lg) | DsMetricCard |
| 4 | kpi-total-debt | KPI | Yes (sm vs md/lg) | DsMetricCard |
| 5 | quick-add | Action | **No** | None (raw div) |
| 6 | chart-cash-flow | Chart | **No** | DsChartCard (section, not Card) |
| 7 | chart-net-trend | Chart | **No** | DsChartCard (section, not Card) |
| 8 | chart-category | Chart | **No** | DsChartCard (section, not Card) |
| 9 | chart-owner-split | Chart | **No** | DsChartCard (section, not Card) |
| 10 | debt-snapshot | List | Yes (sm: 2 items) | None (raw div) |
| 11 | spend-by-source | List | Yes (sm: 3 items) | None (raw div) |
| 12 | owner-transfers | List | Yes (sm: 2 items) | None (raw div) |
| 13 | recent-activity | List | Yes (sm:2/md:3/lg:5) | None (raw div) |
| 14 | smart-insights | List | Yes (sm: 2 items) | None (raw div) |

### Size System

- **Grid**: 12 columns, 40px row height, 12px margin
- **SIZE_TO_W**: `{ sm: 4, md: 6, lg: 12 }`
- **minH per category**:
  - KPI: `{ sm: 2, md: 2, lg: 3 }` (80–120px)
  - Chart: `{ sm: 3, md: 5, lg: 7 }` (120–280px)
  - List: `{ sm: 3, md: 4, lg: 6 }` (120–240px)
  - Quick Add: `{ sm: 2, md: 2, lg: 2 }` (80px)

### Current Size Patterns

**Pattern 1 — Binary (sm vs non-sm)**: Used by 8 widgets. Only distinguishes small from everything else.
```tsx
if (size === "sm") return <CompactVersion />;
return <FullVersion />;  // Same for md and lg
```

**Pattern 2 — Three-tier**: Used by 1 widget (WidgetRecentActivity). Shows 2/3/5 items for sm/md/lg.

**Pattern 3 — No size**: Used by 5 widgets. Renders identically regardless of size.

### Existing Card Components

**DsMetricCard** (`src/components/ds/DsMetricCard.tsx`):
- Uses shadcn `Card` with `surface="flat"`, `density="compact"`
- Props: title, value, subtitle, tone (neutral/positive/negative)
- Responsive padding built-in (px-4/px-5 mobile/desktop)

**DsChartCard** (`src/components/ds/DsChartCard.tsx`):
- **Not actually a Card** — renders as `<section>` with title styling
- No background, border, or shadow
- Just provides a header area above chart content

**shadcn Card** (`src/components/ui/card.tsx`):
- Supports `surface` variant: flat, raised, glass
- Supports `density` variant: compact, default, comfortable
- Has CardHeader, CardContent, CardFooter subcomponents
- `data-slot="card"` attribute for mobile flattening

### Widget Render Flow

```
DashboardGrid → DsWidgetShell → registry.render(props, size) → Widget Component
```

DsWidgetShell provides: edit controls, size selector, drag handle, label/icon header.
Widget Component provides: the actual content (KPI, chart, list, etc.).
**Gap**: No unified card/container between shell and content.

## Decisions

### D1: DsWidgetCard as unified wrapper
- **Decision**: Create `DsWidgetCard` component that uses shadcn `Card` with size-responsive density.
- **Rationale**: 10 of 14 widgets lack proper Card wrapping. Centralizing this eliminates duplication and ensures FR-008 (consistent card styling) and FR-009 (size-responsive padding).
- **Alternatives considered**: (a) Add Card to each widget individually — rejected (14x duplication). (b) Modify DsWidgetShell to include Card — chosen, via composition with DsWidgetCard.

### D2: Chart small-size strategy
- **Decision**: Replace chart with summary metric at small size.
- **Rationale**: Recharts components squeezed into 4-col width (≈280px) are illegible. A summary metric (e.g., "Top: Groceries 34%") is more useful at a glance (FR-004).
- **Alternatives considered**: (a) Mini sparkline chart — rejected (adds complexity, recharts doesn't support well at tiny sizes). (b) Thumbnail image of chart — rejected (not interactive, stale).

### D3: DsMetricCard integration
- **Decision**: DsMetricCard keeps its own Card internally. DsWidgetCard wraps around the widget, but KPI widgets opt out of the DsWidgetCard's Card to avoid double-wrapping.
- **Rationale**: DsMetricCard already has established styling used elsewhere. Changing it risks regressions.
- **Alternative**: Actually, the cleaner approach is to have DsWidgetCard be the ONLY card wrapper, and strip Card from DsMetricCard. This is cleaner but requires updating DsMetricCard consumers. Since DsMetricCard is only used by dashboard KPI widgets, this is safe.
- **Final Decision**: DsWidgetCard wraps all widgets. DsMetricCard is simplified to not include its own Card — it becomes a "metric display" component that expects to be inside a card.

### D4: Where to integrate DsWidgetCard
- **Decision**: Inside DsWidgetShell, wrapping `{children}`.
- **Rationale**: DsWidgetShell already wraps every widget. Adding DsWidgetCard here means all 14 widgets get consistent card styling automatically without modifying each widget file's outer wrapper.

### D5: lg variant enhancement
- **Decision**: All widgets must define distinct lg behavior.
- **Rationale**: Currently 8 of 9 size-aware widgets treat md and lg identically. At lg (full 12-col width), widgets should show expanded content: more items, additional metadata, or fuller visualizations.
- **lg enhancements planned**:
  - KPI widgets: Show help tooltip + subtitle + comparison delta
  - List widgets: Show all items with full metadata (dates, notes, progress bars)
  - Chart widgets: Full chart with legends, axis labels, all tooltips
  - Quick Add: Show all presets without scrolling

## Test Infrastructure

### Existing Tests
- `test/pages/Dashboard.test.tsx` — Integration test (87 lines), renders full dashboard
- `test/pages/dashboard/dashboardSelectors.test.ts` — Selector math tests (325 lines)
- `test/pages/dashboard/dashboardInsights.test.ts` — Insights logic tests (72 lines)

### Test Strategy
- Add per-widget unit tests that render at sm/md/lg and assert correct content
- Test DsWidgetCard padding adaptation at each size
- Existing Dashboard.test.tsx must pass without modification (SC-004)
- Use RTL role-based queries, no snapshots (project convention)
