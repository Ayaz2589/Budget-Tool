# Tasks: Per-Widget Size Presets (S/M/L)

**Input**: Design documents from `/specs/012-per-widget-sizes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No test tasks included (not requested in spec). Existing tests will be verified in Polish phase.

**Organization**: Tasks grouped by user story. US2 (Per-Widget Dimensions) is a prerequisite for US1 (Simplified Size Picker) since the UI needs per-widget dims to function. US3 (localStorage Migration) depends on the registry having sizeDims.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Narrow the WidgetSize type and add SizeDims — blocks all subsequent work

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Simplify `WidgetSize` from 7 values to `"sm" | "md" | "lg"`, add `SizeDims` type as `Record<WidgetSize, { w: number; h: number }>`, and replace `allowedSizes: WidgetSize[]` with `sizeDims: SizeDims` in `WidgetRegistryEntry` interface in src/types/widget.ts

**Checkpoint**: Types compile (with expected errors in downstream files that still reference old sizes/properties)

---

## Phase 2: User Story 2 — Per-Widget Dimensions (Priority: P1) MVP

**Goal**: Each widget defines its own grid dimensions for S, M, L via `sizeDims` in the registry. The global `SIZE_TO_DIMS` is removed and all dimension lookups use per-widget registry entries.

**Independent Test**: Verify that the registry has `sizeDims` for every widget, and that `resizeWidget()` / `validateLayout()` use `registry[id].sizeDims[size]` instead of the removed global map.

### Implementation for User Story 2

- [x] T002 [US2] Add `sizeDims` to all 14 widget entries per the dimension table in data-model.md, remove `allowedSizes` from all entries, and update `defaultSize` values (`wide`→`md`, `wide-lg`→`md`, `xl`→`lg`) in src/lib/widgetRegistry.tsx
- [x] T003 [US2] Remove `SIZE_TO_DIMS` constant, `SIZE_ORDER` constant, and `clampToAllowed()` function; update `resizeWidget()` and `validateLayout()` to look up dimensions via `WIDGET_REGISTRY[id].sizeDims[size]` instead of `SIZE_TO_DIMS[size]` in src/context/DashboardLayoutContext.tsx
- [x] T004 [US2] Bump layout version from 4 to 5, update all size names (`wide`→`md`, `wide-lg`→`md`, `xl`→`lg`), and update w/h values to match per-widget sizeDims for the assigned size in src/lib/defaultLayout.ts

**Checkpoint**: `bun run build` passes. Dimension lookup is per-widget. Default layout uses new sizes.

---

## Phase 3: User Story 1 — Simplified Size Picker (Priority: P1)

**Goal**: The size picker shows exactly 3 options (S, M, L) for every widget. Widget components only branch on `sm`, `md`, `lg`.

**Independent Test**: Open the overflow popover on any widget and verify 3 options. Select "L" on a KPI → 4×3, select "L" on a chart → 8×12.

### Implementation for User Story 1

- [x] T005 [P] [US1] Simplify `SIZE_LABELS` to 3 entries (`{ sm: "S", md: "M", lg: "L" }`), remove `allowedSizes` filtering from the size picker — iterate all 3 sizes directly in src/components/ds/DsWidgetShell.tsx
- [x] T006 [P] [US1] Simplify `SIZE_PADDING` to 3 entries (`sm`→`"px-4 py-3"`, `md`→`"px-4 py-3"`, `lg`→`"px-5 py-4"`) and `SIZE_DENSITY` to 3 entries (`sm`→`"compact"`, `md`→`"default"`, `lg`→`"comfortable"`) in src/components/ds/DsWidgetCard.tsx
- [x] T007 [P] [US1] Simplify `SIZE_LABELS` to 3 entries and remove `allowedSizes` filtering in src/pages/dashboard/DashboardMobileGrid.tsx
- [x] T008 [P] [US1] Simplify size branches in KPI widgets: change `size === "sm" || size === "wide"` to `size === "sm"` in src/pages/dashboard/widgets/NetCashFlow.tsx, TotalSpent.tsx, TotalIncome.tsx, TotalDebt.tsx, and SmartInsights.tsx
- [x] T009 [P] [US1] Simplify size branches in src/pages/dashboard/widgets/CashFlowChart.tsx: merge `xl` branch into `lg` (replace `effectiveSize === "xl"` with `effectiveSize === "lg"`), update chart height for lg
- [x] T010 [P] [US1] Simplify size branches in src/pages/dashboard/widgets/NetTrendChart.tsx: replace `wide-lg` references with `md`, keep `lg` title logic
- [x] T011 [P] [US1] Simplify size branches in src/pages/dashboard/widgets/CategoryChart.tsx (`xl`→`lg`) and OwnerSplitChart.tsx (merge `xl | lg` into `lg`)
- [x] T012 [P] [US1] Simplify size branches in list widgets: change `size === "xl" || size === "tall"` to `size === "lg"` in src/pages/dashboard/widgets/DebtSnapshot.tsx, SpendBySource.tsx, RecentActivity.tsx, and OwnerTransfers.tsx

**Checkpoint**: `bun run build` passes. Size picker shows S/M/L. No old size names in widget components.

---

## Phase 4: User Story 3 — localStorage Migration (Priority: P2)

**Goal**: Existing users with version-4 localStorage layouts auto-migrate to version 5 with correct S/M/L size names, preserving widget positions.

**Independent Test**: Create a localStorage payload with version 4 and old size names (wide, tall, wide-lg, xl), load the app, verify layout renders with new sizes and positions preserved.

### Implementation for User Story 3

- [x] T013 [US3] Add `SIZE_MIGRATION` constant mapping old→new size names and add v4→v5 migration block in `validateLayout()` (after existing v3→v4 migration): iterate items, map sizes via `SIZE_MIGRATION`, update w/h from `WIDGET_REGISTRY[id].sizeDims[newSize]`, preserve x/y, set version to 5 in src/context/DashboardLayoutContext.tsx

**Checkpoint**: Version-4 layouts migrate correctly. Version-5+ layouts are untouched.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify no old size references remain, update i18n, confirm all tests pass

- [x] T014 Check for and update any i18n keys referencing old size names in src/locales/*.json files
- [x] T015 Grep src/ for old size names (`"wide"`, `"tall"`, `"wide-lg"`, `"xl"`) and remove any remaining references
- [x] T016 Run `bun test`, `bun run build`, and `bun run lint` to verify everything passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US2 (Phase 2)**: Depends on Phase 1 (types must exist) — BLOCKS US1 and US3
- **US1 (Phase 3)**: Depends on Phase 2 (needs sizeDims in registry, needs globals removed)
- **US3 (Phase 4)**: Depends on Phase 2 (needs sizeDims in registry for dimension lookup during migration)
- **Polish (Phase 5)**: Depends on Phases 3 and 4

### User Story Dependencies

- **US2 (P1)**: Starts after Foundational — architectural prerequisite for US1 and US3
- **US1 (P1)**: Starts after US2 — can run in parallel with US3 (different files except DashboardLayoutContext.tsx which is modified in T003 before T013)
- **US3 (P2)**: Starts after US2 — can run in parallel with US1

### Within Each Phase

- Phase 2: T002 → T003 → T004 (sequential — registry before context before default layout)
- Phase 3: T005–T012 all marked [P] — can run in parallel (all different files)
- Phase 4: Single task T013
- Phase 5: T014–T015 [P] then T016 final validation

### Parallel Opportunities

- **Phase 3 is highly parallel**: All 8 tasks (T005–T012) touch different files and can execute simultaneously
- **Phase 3 and Phase 4 can overlap**: US1 widget changes (T008–T012) don't conflict with US3 migration (T013)
- **Phase 5 T014–T015**: Can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# All Phase 3 tasks can launch together after Phase 2 completes:
Task: "Simplify SIZE_LABELS in src/components/ds/DsWidgetShell.tsx"
Task: "Simplify SIZE_PADDING/SIZE_DENSITY in src/components/ds/DsWidgetCard.tsx"
Task: "Simplify SIZE_LABELS in src/pages/dashboard/DashboardMobileGrid.tsx"
Task: "Simplify KPI widget branches (5 files)"
Task: "Simplify CashFlowChart branches"
Task: "Simplify NetTrendChart branches"
Task: "Simplify CategoryChart + OwnerSplitChart branches"
Task: "Simplify list widget branches (4 files)"
```

---

## Implementation Strategy

### MVP First (US2 Only)

1. Complete Phase 1: Foundational types
2. Complete Phase 2: US2 — Per-Widget Dimensions
3. **STOP and VALIDATE**: `bun run build` passes, dimensions are per-widget
4. This alone delivers the architectural improvement

### Incremental Delivery

1. Phase 1 → Types ready
2. Phase 2 → US2 done → Per-widget dims working (MVP!)
3. Phase 3 → US1 done → Clean S/M/L picker visible to users
4. Phase 4 → US3 done → Existing users' layouts preserved
5. Phase 5 → Polish → No old size references, all tests green

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Phase 3 is the most parallelizable phase (8 independent file edits)
- The only shared file across phases is src/context/DashboardLayoutContext.tsx (T003 in Phase 2, T013 in Phase 4) — these are sequential by phase order
- Commit after each phase completion for clean rollback points
