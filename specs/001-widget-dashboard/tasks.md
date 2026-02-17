# Tasks: Widget-Based Dashboard

**Input**: Design documents from `/specs/001-widget-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/widget-system.ts, quickstart.md

**Tests**: Not explicitly requested in the feature specification. Tests omitted from task list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install dependency and establish shared types

- [x] T001 Install `react-grid-layout` v2 via `bun add react-grid-layout`
- [x] T002 Import react-grid-layout and react-resizable CSS styles in `src/index.css` using `@import "react-grid-layout/css/styles.css"` and `@import "react-resizable/css/styles.css"`
- [x] T003 Add `DASHBOARD_LAYOUT: "budget-tool-dashboard-layout"` to `STORAGE_KEYS` in `src/lib/storage.ts`
- [x] T004 Create shared TypeScript types (`WidgetType` union, `WidgetSize`, `WidgetLayoutItem`, `DashboardLayout`, `WidgetRegistryEntry`) in `src/types/widget.ts` per the contracts in `specs/001-widget-dashboard/contracts/widget-system.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create default layout constant in `src/lib/defaultLayout.ts` that defines `DEFAULT_LAYOUT: DashboardLayout` with all 14 widgets positioned on a 12-column grid matching the current dashboard order: 4 KPI cards at top (each `w:3, h:2`), Quick Add bar (`w:12, h:2`), 2 chart pairs in rows (`w:6, h:5` each), then 5 data sections (`w:6, h:4` each). Include `mobileOrder` array with all widget IDs in the same top-to-bottom order.
- [x] T006 [P] Create widget registry in `src/lib/widgetRegistry.ts` that exports a `WIDGET_REGISTRY: Record<WidgetType, WidgetRegistryEntry>` map. Each entry defines: `type`, `label` (i18n key), `icon` (lucide-react icon), `defaultSize` ("md"), `minH` per size preset, and a `render` function stub that returns the existing dashboard component for that widget type. Import icons from `lucide-react`.
- [x] T007 [P] Create `DashboardLayoutContext` in `src/context/DashboardLayoutContext.tsx` implementing the `DashboardLayoutContextValue` interface from the contracts. Use `useState` with a lazy initializer that reads from `storage.getItem(STORAGE_KEYS.DASHBOARD_LAYOUT)` and falls back to `DEFAULT_LAYOUT`. Persist layout changes via `useEffect` calling `storage.setItem`. Expose: `layout`, `isEditing`, `startEditing`, `stopEditing`, `updateDesktopGrid`, `updateMobileOrder`, `resizeWidget`, `hideWidget`, `showWidget`, `resetToDefault`. Include layout validation on load: check `version`, filter out unknown widget IDs, merge new widget types from registry at default positions.
- [x] T008 Extract individual KPI card components from `src/pages/dashboard/DashboardKpiCards.tsx` into four standalone components: `WidgetKpiNetCashFlow`, `WidgetKpiTotalSpent`, `WidgetKpiTotalIncome`, `WidgetKpiTotalDebt` in `src/pages/dashboard/widgets/`. Each receives its specific props from `useDashboardData` and renders a `DsMetricCard`. Keep the existing `DashboardKpiCards` working by having it import and compose the four new components — do NOT break the current dashboard.
- [x] T009 Extract accordion items from `src/pages/dashboard/DashboardDebtSnapshot.tsx` into standalone components: `WidgetDebtSnapshot`, `WidgetSpendBySource`, `WidgetOwnerTransfers`, `WidgetRecentActivity` in `src/pages/dashboard/widgets/`. Each renders its content without the `AccordionItem` wrapper. Keep the existing `DashboardDebtSnapshot` working by having it import and compose the extracted components inside `AccordionItem` wrappers — do NOT break the current dashboard.
- [x] T010 Add i18n keys for all 14 widget labels to `src/locales/en.json` (and stub keys in other locale files). Keys follow pattern `widget.kpiNetCashFlow`, `widget.chartCashFlow`, etc.

**Checkpoint**: Foundation ready — all widget types extracted, registry defined, context created, default layout established. The current dashboard still renders identically.

---

## Phase 3: User Story 1 — Rearrange Dashboard Layout (Priority: P1) MVP

**Goal**: Users can enter edit mode, drag widgets to new grid positions, and the layout persists across sessions.

**Independent Test**: Enter edit mode, drag a widget from one position to another, exit edit mode, refresh the page, and verify the widget remains in the new position.

### Implementation for User Story 1

- [x] T011 [US1] Create `DsWidgetShell` component in `src/components/ds/DsWidgetShell.tsx`. Wraps each widget with: a drag handle bar (visible only in edit mode, using `GripVertical` icon from lucide-react), the widget label, and a card container. In non-edit mode, renders children with no edit chrome. Props: `widgetType`, `size`, `isEditing`, `children`. Add `role="region"`, `aria-label` with the widget label, and `tabIndex={0}` for accessibility.
- [x] T012 [US1] Create `DashboardGrid` component in `src/pages/dashboard/DashboardGrid.tsx`. Import `ResponsiveGridLayout` from `react-grid-layout`. Configure with `cols: { lg: 12, md: 12, sm: 6, xs: 1, xxs: 1 }`, `rowHeight: 40`, `compactType: "vertical"`, `isDraggable` and `isResizable` controlled by `isEditing` from `DashboardLayoutContext`. Map each visible `WidgetLayoutItem` from context to a `<div key={item.id}>` wrapping `DsWidgetShell` → widget registry `render()` call. Wire `onLayoutChange` callback to `updateDesktopGrid` in context.
- [x] T013 [US1] Add an "Edit Layout" toggle button to the dashboard header in `src/pages/dashboard/Dashboard.tsx`. Use the `LayoutGrid` icon from lucide-react. When clicked, calls `startEditing()` from `DashboardLayoutContext`. In edit mode, show a "Done" button that calls `stopEditing()`. Position the button alongside existing action buttons (Add Expense, Add Income, Settings).
- [x] T014 [US1] Wrap the dashboard page with `DashboardLayoutProvider` in `src/pages/dashboard/Dashboard.tsx`. Replace the static JSX layout (KPI cards grid, chart rows, accordion) with the `DashboardGrid` component. Pass `useDashboardData()` return value as props to `DashboardGrid` so widget render functions receive data. Ensure `DashboardFilters`, `AddTransactionDialog`, `AddIncomeDialog`, and `DsActionBar` remain outside the grid — they are not widgets.
- [x] T015 [US1] Add edit mode visual feedback: when `isEditing` is true, add a subtle border/outline and background tint to each `DsWidgetShell` using Tailwind classes. Use `framer-motion` `AnimatePresence` for smooth transition of drag handle appearance. Add a semi-transparent overlay bar at the top of the dashboard saying "Editing layout — drag widgets to rearrange" that shows only in edit mode.

**Checkpoint**: User Story 1 complete — users can enter edit mode, drag widgets on the grid, exit edit mode, and their layout persists across page refreshes. All dashboard data and filters still work.

---

## Phase 4: User Story 2 — Resize Widgets (Priority: P2)

**Goal**: Users can change each widget's size between small, regular, and large. The grid reflows and the widget adapts its content presentation.

**Independent Test**: Select a widget in edit mode, cycle through small → regular → large sizes, verify the grid reflows and the widget shows condensed, standard, and detailed views respectively.

### Implementation for User Story 2

- [x] T016 [US2] Add a size selector to `DsWidgetShell` in `src/components/ds/DsWidgetShell.tsx`. Show three size buttons (`S`, `M`, `L`) in the drag handle bar during edit mode. Highlight the current size. On click, call `onResize(size)` prop. Add new props: `onResize: (size: WidgetSize) => void`.
- [x] T017 [US2] Wire the size selector: in `DashboardGrid` (`src/pages/dashboard/DashboardGrid.tsx`), pass an `onResize` callback to each `DsWidgetShell` that calls `resizeWidget(widgetId, newSize)` from `DashboardLayoutContext`. The `resizeWidget` action must update the `w` and `h` values of the item based on the size preset mapping (sm: `w=4`, md: `w=6`, lg: `w=12`, with height from `WIDGET_REGISTRY[type].minH[size]`).
- [x] T018 [P] [US2] Implement size-responsive rendering for KPI widgets in `src/pages/dashboard/widgets/WidgetKpiNetCashFlow.tsx` (and the other 3 KPI widgets). Accept a `size: WidgetSize` prop. At `sm`: show only value and trend indicator. At `md`: show the current full view (value, subtitle, label). At `lg`: show value, subtitle, label, and a sparkline or additional context (e.g., last 3 months trend).
- [x] T019 [P] [US2] Implement size-responsive rendering for chart widgets. In `src/pages/dashboard/DashboardCashFlowChart.tsx`, `DashboardNetCashFlowChart.tsx`, `DashboardCategoryChart.tsx`, `DashboardOwnerSplit.tsx`: accept a `size: WidgetSize` prop. At `sm`: show a mini chart or single summary stat. At `md`: show the current standard chart. At `lg`: show the chart with expanded legend, larger labels, or additional data series.
- [x] T020 [P] [US2] Implement size-responsive rendering for data section widgets in `src/pages/dashboard/widgets/WidgetDebtSnapshot.tsx` (and the other 4 data widgets). Accept a `size: WidgetSize` prop. At `sm`: show top 2–3 items only with compact formatting. At `md`: show the current standard view. At `lg`: show all items with additional detail columns.

**Checkpoint**: User Story 2 complete — users can resize any widget, the grid reflows automatically, and each widget shows appropriate content density for its size.

---

## Phase 5: User Story 3 — Show and Hide Widgets (Priority: P3)

**Goal**: Users can hide widgets they don't need and restore them from a widget catalog.

**Independent Test**: Hide a widget, verify it disappears, open the widget catalog, restore it, verify it reappears.

### Implementation for User Story 3

- [x] T021 [US3] Add a hide button (`X` or `EyeOff` icon) to `DsWidgetShell` in `src/components/ds/DsWidgetShell.tsx`. Visible only in edit mode. On click, calls `onHide()` prop.
- [x] T022 [US3] Wire the hide action: in `DashboardGrid` (`src/pages/dashboard/DashboardGrid.tsx`), pass `onHide` to each `DsWidgetShell` that calls `hideWidget(widgetId)` from `DashboardLayoutContext`. The `hideWidget` action sets `visible: false` on the item and removes it from `mobileOrder`.
- [x] T023 [US3] Create `DsWidgetCatalog` component in `src/components/ds/DsWidgetCatalog.tsx`. Uses the shadcn `Sheet` component (slide-in panel). Lists all widget types from `WIDGET_REGISTRY` grouped visually. Each entry shows: icon, label, and a toggle/add button. Visible widgets show a checkmark; hidden widgets show an "Add" button. Clicking "Add" calls `onShow(widgetId)`. Props per `WidgetCatalogProps` contract.
- [x] T024 [US3] Add a "Manage Widgets" button to the edit mode toolbar in `src/pages/dashboard/Dashboard.tsx` (next to the "Done" button). On click, opens the `DsWidgetCatalog` sheet. Wire `showWidget` from `DashboardLayoutContext` as the `onShow` handler. The `showWidget` action sets `visible: true` and appends the widget to the end of `desktopGrid` at the next available position (use `react-grid-layout` compaction) and to `mobileOrder`.

**Checkpoint**: User Story 3 complete — users can hide widgets to declutter, and restore them from the catalog.

---

## Phase 6: User Story 4 — Reset to Default Layout (Priority: P4)

**Goal**: Users can reset their layout to the system default with one action after confirmation.

**Independent Test**: Customize the layout (move, resize, hide), trigger reset, confirm, verify all widgets return to default positions, sizes, and visibility.

### Implementation for User Story 4

- [x] T025 [US4] Add a "Reset Layout" button to the edit mode toolbar in `src/pages/dashboard/Dashboard.tsx`. Use the `RotateCcw` icon from lucide-react. Position it in the edit mode action bar alongside "Manage Widgets" and "Done".
- [x] T026 [US4] Implement reset confirmation dialog. Use the existing shadcn `AlertDialog` component. When "Reset Layout" is clicked, show a dialog: title "Reset to default layout?", description "This will restore all widgets to their original positions, sizes, and visibility. Your current layout will be lost.", with "Cancel" and "Reset" buttons. On confirm, call `resetToDefault()` from `DashboardLayoutContext` then call `stopEditing()`.

**Checkpoint**: User Story 4 complete — users have a safety net to restore the default layout.

---

## Phase 7: User Story 5 — Mobile Dashboard Reordering (Priority: P5)

**Goal**: Mobile users see a single-column layout and can reorder widgets using move-up/move-down buttons.

**Independent Test**: On a mobile viewport, enter edit mode, move a widget up in the stack, verify the new order persists and desktop layout is unaffected.

### Implementation for User Story 5

- [x] T027 [US5] Create a mobile-specific dashboard renderer in `src/pages/dashboard/DashboardMobileGrid.tsx`. Reads `mobileOrder` from `DashboardLayoutContext`. Renders widgets in a vertical `flex-col` stack, each wrapped in `DsWidgetShell`. All widgets render at full width. Use a `useMediaQuery` hook (or `window.matchMedia("(max-width: 767px)")`) to detect mobile viewport.
- [x] T028 [US5] Add move-up/move-down buttons to `DsWidgetShell` in `src/components/ds/DsWidgetShell.tsx`. Visible only in edit mode on mobile (detect via the same media query). Use `ChevronUp` and `ChevronDown` icons from lucide-react. Disable "up" on the first widget and "down" on the last. On click, calls new props: `onMoveUp()` and `onMoveDown()`.
- [x] T029 [US5] Wire mobile reordering in `DashboardMobileGrid` (`src/pages/dashboard/DashboardMobileGrid.tsx`). Each widget's `onMoveUp` / `onMoveDown` swaps the widget's position in the `mobileOrder` array and calls `updateMobileOrder()` from `DashboardLayoutContext`.
- [x] T030 [US5] In `src/pages/dashboard/Dashboard.tsx`, conditionally render `DashboardMobileGrid` on mobile viewports and `DashboardGrid` on desktop viewports. Both share the same `DashboardLayoutContext` but read different layout fields (`mobileOrder` vs `desktopGrid`). Ensure the mobile `DsActionBar` (floating action buttons) remains functional.

**Checkpoint**: User Story 5 complete — mobile users can reorder their widgets, and mobile/desktop layouts are independent.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T031 [P] Add comprehensive accessibility attributes across all widget components: `aria-grabbed` and `aria-dropeffect` on drag handles in edit mode, `role="status"` on edit mode indicator bar, `aria-live="polite"` on layout change announcements, keyboard activation (`Enter`/`Space`) for all edit mode buttons in `src/components/ds/DsWidgetShell.tsx`
- [x] T032 [P] Handle layout migration edge cases in `DashboardLayoutContext` (`src/context/DashboardLayoutContext.tsx`): gracefully ignore unknown widget IDs from saved layouts (forward compatibility), merge newly added widget types from registry at default positions, clamp `x + w` values that exceed 12 columns, discard layouts with unrecognized `version` and fall back to default
- [x] T033 [P] Add empty state handling: when all widgets are hidden, show a `DsEmptyState` in the dashboard with message "No widgets visible" and a primary action button "Manage Widgets" that opens the catalog. In `src/pages/dashboard/DashboardGrid.tsx` and `src/pages/dashboard/DashboardMobileGrid.tsx`.
- [x] T034 Verify all existing tests pass with `bun test`. Verify TypeScript build with `bun run build`. Verify lint with `bun run lint`. Fix any regressions introduced by the component extraction (T008, T009) or Dashboard.tsx refactor (T014).
- [x] T035 Add i18n translations for edit mode UI strings (edit/done buttons, reset dialog, widget catalog title, empty state message, move-up/move-down labels) to all 7 locale files in `src/locales/`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) — MVP target
- **User Story 2 (Phase 4)**: Depends on User Story 1 (needs DsWidgetShell and DashboardGrid)
- **User Story 3 (Phase 5)**: Depends on User Story 1 (needs DsWidgetShell and DashboardGrid)
- **User Story 4 (Phase 6)**: Depends on User Story 1 (needs edit mode toolbar)
- **User Story 5 (Phase 7)**: Depends on User Story 1 (needs DsWidgetShell and context)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational only — the MVP
- **User Story 2 (P2)**: Depends on US1 (needs the grid and widget shell to add size controls)
- **User Story 3 (P3)**: Depends on US1 (needs the grid and widget shell to add hide button). Can run in PARALLEL with US2.
- **User Story 4 (P4)**: Depends on US1 (needs the edit mode toolbar). Can run in PARALLEL with US2 and US3.
- **User Story 5 (P5)**: Depends on US1 (needs context and widget shell). Can run in PARALLEL with US2, US3, US4.

### Within Each User Story

- Core component creation before wiring
- Context actions before UI that calls them
- Desktop before mobile

### Parallel Opportunities

- **Phase 2**: T006 (registry) and T007 (context) can run in parallel. T008 (KPI extraction) and T009 (accordion extraction) can run in parallel.
- **Phase 3**: T011 (widget shell) must precede T012 (grid) which must precede T014 (dashboard refactor). T015 (visual feedback) can start after T011.
- **Phase 4**: T018, T019, T020 (size-responsive rendering per widget type) can all run in parallel.
- **After US1**: US2, US3, US4, US5 can all run in parallel (they modify different parts of DsWidgetShell and add different UI).

---

## Parallel Example: User Story 2

```text
# These three tasks modify different widget files and can run in parallel:
Task T018: Size-responsive KPI widgets in src/pages/dashboard/widgets/
Task T019: Size-responsive chart widgets in src/pages/dashboard/Dashboard*.tsx
Task T020: Size-responsive data section widgets in src/pages/dashboard/widgets/
```

## Parallel Example: Foundational Phase

```text
# These tasks create different files with no dependencies between them:
Task T006: Widget registry in src/lib/widgetRegistry.ts
Task T007: Layout context in src/context/DashboardLayoutContext.tsx

# These tasks also modify different files:
Task T008: Extract KPI cards from src/pages/dashboard/DashboardKpiCards.tsx
Task T009: Extract accordion items from src/pages/dashboard/DashboardDebtSnapshot.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T010)
3. Complete Phase 3: User Story 1 (T011–T015)
4. **STOP and VALIDATE**: Enter edit mode, drag widgets, exit, refresh — layout persists
5. Deploy/demo if ready — users get a customizable grid layout

### Incremental Delivery

1. Setup + Foundational → Foundation ready, existing dashboard unchanged
2. User Story 1 → Drag-and-drop grid with edit mode (MVP!)
3. User Story 2 → Widget resizing (sm/md/lg)
4. User Story 3 → Show/hide with widget catalog
5. User Story 4 → Reset to default safety net
6. User Story 5 → Mobile reordering
7. Polish → Accessibility, edge cases, i18n completion
8. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after US1 (the foundational grid)
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Existing dashboard MUST keep working throughout Phases 1–2 (no breaking changes until T014 swaps in the grid)
- The `react-grid-layout` CSS import (T002) is required — without it, the grid renders incorrectly
