# Tasks: Dashboard Widget Redesign

**Input**: Design documents from `/specs/005-widget-redesign/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested. Existing tests must pass (SC-004). Each implementation task includes writing/updating tests per Constitution Principle VI.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Verify environment and establish baseline

- [x] T001 Verify branch `005-widget-redesign` is checked out and run `bun test` to confirm all existing tests pass
- [x] T002 Run `bun run build` to confirm TypeScript compilation succeeds as baseline

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the DsWidgetCard wrapper and integrate it into the widget shell. MUST complete before any user story work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Create `DsWidgetCard` component in `src/components/ds/DsWidgetCard.tsx` — accepts `size: WidgetSize` and `children`, renders shadcn `Card` with `surface="raised"` and density mapped from size (sm→compact, md→default, lg→comfortable). Provides size-responsive padding: sm=px-3/py-2, md=px-4/py-3, lg=px-5/py-4.
- [x] T004 Export `DsWidgetCard` from `src/components/ds/index.ts`
- [x] T005 Integrate `DsWidgetCard` into `DsWidgetShell` in `src/components/ds/DsWidgetShell.tsx` — wrap `{children}` with `<DsWidgetCard size={size}>` so all 14 widgets automatically receive card styling
- [x] T006 Simplify `DsMetricCard` in `src/components/ds/DsMetricCard.tsx` — remove internal `Card` wrapper (now provided by DsWidgetShell → DsWidgetCard). Keep metric layout (title, value, subtitle, tone) but render as a plain container instead of a Card.
- [x] T007 Update `DsChartCard` in `src/components/ds/DsChartCard.tsx` — accept `size?: WidgetSize` prop. Remove any existing container styling that conflicts with the outer DsWidgetCard.
- [x] T008 Run `bun test` and `bun run build` to verify foundational changes don't break existing tests

**Checkpoint**: DsWidgetCard wrapper is live. All 14 widgets now render inside a consistent Card. Existing functionality preserved.

---

## Phase 3: User Story 1 — Widgets Display Correctly at All Sizes (Priority: P1) MVP

**Goal**: All 14 widgets render without cropping, overflow, or truncation at sm/md/lg. Each size tier shows purpose-built content.

**Independent Test**: Resize each widget through S/M/L in edit mode and verify no content is clipped, overflowed, or illegible at any size.

### Add Size Support to Chart Widgets (currently missing)

- [x] T009 [P] [US1] Add `size?: WidgetSize` prop to `DashboardCashFlowChart` in `src/pages/dashboard/DashboardCashFlowChart.tsx` — sm: show total income vs total expense as two summary numbers with delta. md: render bar chart without legend. lg: full bar chart with legend, axis labels, and tooltips. Default to md layout for unrecognized sizes (FR-017).
- [x] T010 [P] [US1] Add `size?: WidgetSize` prop to `DashboardNetCashFlowChart` in `src/pages/dashboard/DashboardNetCashFlowChart.tsx` — sm: show current month net cash flow as single metric value. md: render area chart without legend. lg: full area chart with legend and reference line. Default to md layout for unrecognized sizes.
- [x] T011 [P] [US1] Add `size?: WidgetSize` prop to `DashboardCategoryChart` in `src/pages/dashboard/DashboardCategoryChart.tsx` — sm: show top category name and percentage as text. md: render pie chart with truncated legend (top 4). lg: full donut chart with complete legend. Default to md layout for unrecognized sizes.
- [x] T012 [P] [US1] Add `size?: WidgetSize` prop to `DashboardOwnerSplit` in `src/pages/dashboard/DashboardOwnerSplit.tsx` — sm: show owner count and largest contributor name/amount as text. md: render pie chart only. lg: full pie chart with expandable per-owner detail rows. Default to md layout for unrecognized sizes.
- [x] T013 [P] [US1] Add `size?: WidgetSize` prop to `DashboardQuickAdd` in `src/pages/dashboard/DashboardQuickAdd.tsx` — sm: horizontal scroll with compact pills (h-7, px-2), icon-only add button. md: wrap layout with standard pills (h-9, px-3). lg: wrap layout showing all presets without scrolling. Default to md layout for unrecognized sizes.

### Update Widget Registry

- [x] T014 [US1] Update render functions in `src/lib/widgetRegistry.tsx` to pass `size` parameter to all 14 widgets consistently. Currently 5 chart/quick-add widgets don't receive size — fix by passing `size` as prop in their render calls. Ensure all registry entries follow the same structure (type, label, icon, defaultSize, minH, render) per FR-018.

### Enhance lg Variants for KPI Widgets

- [x] T015 [P] [US1] Enhance `WidgetKpiNetCashFlow` lg variant in `src/pages/dashboard/widgets/WidgetKpiNetCashFlow.tsx` — at lg: show help tooltip, subtitle with comparison text, and tone icon alongside color. Ensure unrecognized sizes fall back to md layout.
- [x] T016 [P] [US1] Enhance `WidgetKpiTotalSpent` lg variant in `src/pages/dashboard/widgets/WidgetKpiTotalSpent.tsx` — at lg: show help tooltip, delta label, and expense scope definition text. Ensure unrecognized sizes fall back to md layout.
- [x] T017 [P] [US1] Enhance `WidgetKpiTotalIncome` lg variant in `src/pages/dashboard/widgets/WidgetKpiTotalIncome.tsx` — at lg: show help tooltip and subtitle with comparison delta. Ensure unrecognized sizes fall back to md layout.
- [x] T018 [P] [US1] Enhance `WidgetKpiTotalDebt` lg variant in `src/pages/dashboard/widgets/WidgetKpiTotalDebt.tsx` — at lg: show help tooltip and formatted subtitle with debt details. Ensure unrecognized sizes fall back to md layout.

### Enhance lg Variants for List Widgets

- [x] T019 [P] [US1] Enhance `WidgetDebtSnapshot` lg variant in `src/pages/dashboard/widgets/WidgetDebtSnapshot.tsx` — at lg: show all debt rows with owner subtitle, progress bars, and full metadata. At sm: add "show more" indicator when items are truncated.
- [x] T020 [P] [US1] Enhance `WidgetSpendBySource` lg variant in `src/pages/dashboard/widgets/WidgetSpendBySource.tsx` — at lg: show all sources with percentage breakdown and extended metadata. At sm: add "show more" indicator when items are truncated.
- [x] T021 [P] [US1] Enhance `WidgetOwnerTransfers` lg variant in `src/pages/dashboard/widgets/WidgetOwnerTransfers.tsx` — at lg: show all transfers with date, note, and from/to detail. At sm: add "show more" indicator when items are truncated.
- [x] T022 [US1] Review `WidgetRecentActivity` in `src/pages/dashboard/widgets/WidgetRecentActivity.tsx` — already has 3-tier support (sm:2/md:3/lg:5 items). Verify lg shows full metadata (date, category, owner, description). Add "show more" indicator at sm when items are truncated.
- [x] T023 [P] [US1] Enhance `WidgetSmartInsights` lg variant in `src/pages/dashboard/widgets/WidgetSmartInsights.tsx` — at lg: show all insights with expanded detail text rather than truncated summaries. At sm: add "show more" indicator when items are truncated.

### Adjust Grid Heights

- [x] T024 [US1] Review and update `minH` values in `src/lib/widgetRegistry.tsx` for each widget at each size tier to ensure content fits without overflow. Adjust based on actual rendered content heights after size variants are built.

### Verify

- [x] T025 [US1] Run `bun test` and `bun run build` to verify US1 changes don't break existing tests or compilation

**Checkpoint**: All 14 widgets display purpose-built content at sm/md/lg. No cropping or overflow at any size. 42 widget-size combinations verified.

---

## Phase 4: User Story 2 — Consistent Card Wrapping for Visual Hierarchy (Priority: P2)

**Goal**: All widgets wrapped in consistent Card styling with size-responsive padding matching the design system.

**Independent Test**: Visually inspect all 14 widgets at each size tier and confirm uniform card styling (borders, shadows, radii, padding).

- [x] T026 [US2] Verify `DsWidgetCard` renders consistent `surface="raised"` Card across all 14 widgets — confirm background, border, shadow, and corner radius match design system tokens in both light and dark themes. Adjust if any widget's internal styling conflicts.
- [x] T027 [US2] Verify size-responsive padding: inspect each widget at sm (compact padding), md (standard), lg (comfortable). Ensure small widgets maximize content area and large widgets don't feel cramped. Fine-tune padding values in `src/components/ds/DsWidgetCard.tsx` if needed.
- [x] T028 [US2] Verify dark theme card rendering — toggle to dark mode and confirm all 14 widgets render with correct `--card` background, `--card-foreground` text, and `--border` styling from `src/index.css` dark theme tokens.
- [x] T029 [US2] Run `bun test` and `bun run build` to verify US2 changes pass

**Checkpoint**: All widgets have uniform visual hierarchy via Card wrapper. Padding adapts cleanly per size tier.

---

## Phase 5: User Story 3 — Extensible Widget Architecture (Priority: P3)

**Goal**: Standardize the widget creation pattern so adding a new widget requires only a registry entry + render component. No infrastructure modifications needed.

**Independent Test**: Create a minimal test widget following the pattern and verify it automatically receives card wrapping, edit controls, size support, and mobile layout — without modifying DsWidgetShell, DashboardGrid, DashboardMobileGrid, or DsWidgetCard.

- [x] T030 [US3] Audit all 14 widget render functions in `src/lib/widgetRegistry.tsx` — verify every entry follows the same structure: `{ type, label, icon, defaultSize, minH: Record<WidgetSize, number>, render: (props, size) => ReactNode }`. Fix any inconsistencies (FR-018).
- [x] T031 [US3] Verify that DsWidgetShell, DashboardGrid, and DashboardMobileGrid reference ONLY the widget registry for widget metadata — no widget-specific logic (labels, icons, sizing) should be hardcoded in shell or grid code (FR-016, FR-018).
- [x] T032 [US3] Ensure all 14 widget render components default to md layout when an unrecognized size value is passed — add a fallback pattern like `const effectiveSize = ["sm","md","lg"].includes(size) ? size : "md"` or use md as the default in switch/if statements (FR-017).
- [x] T033 [US3] Verify that `DsWidgetCatalog` in `src/components/ds/DsWidgetCatalog.tsx` dynamically reads from the widget registry (ALL_WIDGET_TYPES) — no hardcoded widget list. New widgets added to the registry should automatically appear in the catalog.
- [x] T034 [US3] Run `bun test` and `bun run build` to verify US3 changes pass

**Checkpoint**: Widget architecture is standardized. Adding a new widget requires only a registry entry + render component (FR-015, SC-007).

---

## Phase 6: User Story 4 — Smooth Size Transitions (Priority: P4)

**Goal**: Widget size changes in edit mode cause immediate, clean re-renders with no flash, blank state, or layout jank.

**Independent Test**: Enter edit mode, cycle each widget through S → M → L → S and confirm content adapts instantly.

- [x] T035 [US4] Verify that resizing a chart widget from lg to sm replaces the chart with the summary metric (not a shrunken chart). Test all 4 chart widgets in `src/pages/dashboard/DashboardCashFlowChart.tsx`, `DashboardNetCashFlowChart.tsx`, `DashboardCategoryChart.tsx`, `DashboardOwnerSplit.tsx`.
- [x] T036 [US4] Verify that resizing any widget via S/M/L buttons in DsWidgetShell re-renders within 200ms with no loading state, blank frame, or stale content. Test by cycling all 14 widgets through size tiers in edit mode.
- [x] T037 [US4] Verify grid re-flow: when a widget changes from lg (12-col) to sm (4-col), adjacent widgets fill the freed space correctly via react-grid-layout compaction in `src/pages/dashboard/DashboardGrid.tsx`.

**Checkpoint**: Size transitions work smoothly. Chart→summary transitions are clean. Grid re-flows without jank.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, mobile, and final validation

- [x] T038 [P] Handle long currency values in KPI widgets — add text truncation with ellipsis or responsive font scaling in `src/pages/dashboard/widgets/WidgetKpiNetCashFlow.tsx`, `WidgetKpiTotalSpent.tsx`, `WidgetKpiTotalIncome.tsx`, `WidgetKpiTotalDebt.tsx` to prevent overflow at sm size with 10+ digit values.
- [x] T039 [P] Handle empty data states at all sizes — verify `DsEmptyState` renders proportionally within `DsWidgetCard` at sm/md/lg for all widgets that support empty states. Ensure widget-level empty states include a context-appropriate action per Constitution Principle I.
- [x] T040 [P] Handle single-owner edge case in `src/pages/dashboard/DashboardOwnerSplit.tsx` — ensure visualization adapts when only one owner exists (skip pie chart, show single-owner summary at all sizes).
- [x] T041 [P] Handle many-presets edge case in `src/pages/dashboard/DashboardQuickAdd.tsx` at sm size — ensure horizontal scroll or truncation with count indicator when presets exceed available width.
- [x] T042 Verify mobile rendering uses medium layout variant by default in `src/pages/dashboard/DashboardMobileGrid.tsx` (FR-013). Confirm widgets display correctly at full viewport width.
- [x] T043 Run full test suite (`bun test`), TypeScript build (`bun run build`), and lint (`bun run lint`) to confirm zero regressions
- [x] T044 Run quickstart.md validation checklist — verify all 8 items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify baseline
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (DsWidgetCard must exist)
- **US2 (Phase 4)**: Depends on Phase 2 + Phase 3 (card wrapping verified after widgets are rebuilt)
- **US3 (Phase 5)**: Depends on Phase 2 + Phase 3 (architecture audit after widgets are standardized)
- **US4 (Phase 6)**: Depends on Phase 3 (size transitions tested after widgets have size variants)
- **Polish (Phase 7)**: Depends on Phases 3–6

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P2)**: Depends on Phase 2 completion (DsWidgetCard). Light dependency on US1 for full verification.
- **US3 (P3)**: Depends on Phase 3 (registry audit meaningful after all widgets are updated)
- **US4 (P4)**: Depends on US1 (needs size variants to exist before testing transitions)

### Within Each User Story

- Chart widget size additions (T009–T013) can run in parallel [P]
- KPI lg enhancements (T015–T018) can run in parallel [P]
- List lg enhancements (T019–T023) can run in parallel [P]
- Registry update (T014) should follow chart/quick-add size additions
- Height adjustment (T024) should follow all size variant work

### Parallel Opportunities

```
Phase 2 (sequential): T003 → T004 → T005 → T006/T007 [P] → T008

Phase 3 — Batch 1 (parallel):
  T009, T010, T011, T012, T013  (5 chart/quick-add widgets, different files)

Phase 3 — Batch 2 (after Batch 1):
  T014  (registry update, depends on T009–T013)

Phase 3 — Batch 3 (parallel, after T014):
  T015, T016, T017, T018  (4 KPI lg variants, different files)
  T019, T020, T021, T022, T023  (5 list lg variants, different files)

Phase 3 — Batch 4:
  T024 → T025  (heights then verify)

Phase 5 (sequential): T030 → T031 → T032 → T033 → T034

Phase 7 (parallel):
  T038, T039, T040, T041  (different files, independent edge cases)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T008)
3. Complete Phase 3: User Story 1 (T009–T025)
4. **STOP and VALIDATE**: All 14 widgets render correctly at sm/md/lg
5. This alone delivers the core value — widgets no longer crop or overflow

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready (consistent card wrapper live)
2. Add US1 → Correct display at all sizes (MVP!)
3. Add US2 → Visual consistency verified and polished
4. Add US3 → Extensible architecture standardized
5. Add US4 → Smooth transitions verified
6. Add Polish → Edge cases handled, full validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Chart widgets at sm show summary metrics, NOT squeezed charts
- DsWidgetCard is the single source of card styling for all widgets
- All widget render components MUST default to md layout for unrecognized sizes (FR-017)
- Widget registry is the single source of truth for all widget metadata (FR-018)
