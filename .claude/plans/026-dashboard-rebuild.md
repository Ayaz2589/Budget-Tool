## Plan: Category-Focused Dashboard Widgets

**What:** Three new category-focused widgets for the dashboard: Spend by Category, Category Trends, and Top 5 Categories.
**Why:** The new hierarchical category system (Food > Groceries, etc.) provides rich data that isn't surfaced on the dashboard yet.

### Existing Infrastructure

- `categorySlices` already computed in `useDashboardData.ts` via `buildCategoryBreakdown()` — returns `{ label, value }[]` for current month
- Category registry (`src/lib/categories/registry.ts`) provides icons, colors, parent/sub hierarchy
- Widget pattern: component in `widgets/`, registered in `widgetRegistry.tsx`, data piped from `useDashboardData`
- DS components: `DsChartCard`, `DsLegendList`, `DsDataRow`, `DsEmptyState`
- Recharts: `BarChart`, `PieChart`, `LineChart` all available

### Acceptance Criteria

**Widget 1: Spend by Category (bar chart)**
- [ ] Horizontal bar chart showing spend per category, sorted by amount descending
- [ ] Uses parent-level grouping (e.g., "Food" aggregates Groceries + Dining Out + Coffee)
- [ ] Shows category icon and color from registry
- [ ] Empty state when no expenses exist
- [ ] Registered in widget registry

**Widget 2: Category Trends (line chart)**
- [ ] Line chart showing spend per parent category across months (uses dashboard range: current/6/12)
- [ ] New selector `buildCategoryTrends()` in `dashboardSelectors.ts` that returns per-category monthly totals
- [ ] Each line colored by the category's registry color
- [ ] Legend showing category names
- [ ] Empty state when insufficient data

**Widget 3: Top 5 Categories (ranked list)**
- [ ] Ranked list of the 5 highest-spend categories for the selected period
- [ ] Shows rank number, category icon, name, amount, and percentage of total
- [ ] Progress bar showing relative spend
- [ ] Uses existing `categorySlices` data (no new selector needed)
- [ ] Empty state when no expenses exist

**Integration:**
- [ ] All three widgets added to `DashboardFixedLayout.tsx` below the KPI row
- [ ] Tests for each widget component
- [ ] Tests for any new selector functions

### Implementation Steps (TDD)

Each step follows red-green-refactor: write failing test → implement → verify green → refactor.

1. **`buildParentCategoryBreakdown()` selector**
   - Write tests: groups subcategories by parent, sorts descending, handles empty/uncategorized
   - Run tests — confirm red
   - Implement in `dashboardSelectors.ts`
   - Run tests — confirm green

2. **`buildCategoryTrends()` selector**
   - Write tests: returns per-parent-category monthly totals across a range of months, respects expense scope, handles empty data
   - Run tests — confirm red
   - Implement in `dashboardSelectors.ts`
   - Run tests — confirm green

3. **Wire new selectors into `useDashboardData.ts`**
   - No dedicated test — verified by widget component tests in steps 4–6

4. **`SpendByCategoryChart` widget**
   - Write tests: renders bars for each parent category, shows empty state when no data, displays category names
   - Run tests — confirm red
   - Implement component
   - Run tests — confirm green

5. **`CategoryTrendsChart` widget**
   - Write tests: renders lines per category, shows empty state, displays legend
   - Run tests — confirm red
   - Implement component
   - Run tests — confirm green

6. **`TopCategories` widget**
   - Write tests: renders top 5 ranked items with name/amount/percentage, shows empty state, caps at 5 even with more data
   - Run tests — confirm red
   - Implement component
   - Run tests — confirm green

7. **Register widgets in `widgetRegistry.tsx`**

8. **Add widgets to `DashboardFixedLayout.tsx`**
   - Update existing Dashboard test to verify new widgets render

### Gotchas

- `categorySlices` uses composite keys like "Food > Groceries" — need to parse and group by parent for the bar chart
- Category Trends needs multi-month data; current `buildCategoryBreakdown` only does single month — need a new selector that iterates over `monthKeys`
- Category colors in registry are Tailwind classes (`bg-green-500`), but Recharts needs CSS color values — may need a mapping or use `getCategoryColorClass` with a lookup
- The dashboard `range` setting controls how many months to show — Category Trends must respect this
