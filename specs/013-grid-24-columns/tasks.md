# Tasks: 24-Column Dashboard Grid

**Input**: Design documents from `/specs/013-grid-24-columns/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: No test tasks — not requested in the feature specification. Existing tests will be validated in the Polish phase.

**Organization**: Tasks are grouped by user story. Both stories are P1 but US2 (migration) depends on US1 (grid/dimensions) being complete first.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 — Finer-Grained Widget Sizing (Priority: P1) 🎯 MVP

**Goal**: Change the grid from 16 to 24 columns and update all widget dimensions and default layout to use 24-column values.

**Independent Test**: Open the app with no saved layout. All 14 widgets render at correct 24-column positions. Resize any widget between S/M/L — dimensions match the 24-col sizeDims.

- [x] T001 [P] [US1] Update grid column counts from `{ lg: 16, md: 16, sm: 8 }` to `{ lg: 24, md: 24, sm: 12 }` in `src/pages/dashboard/DashboardGrid.tsx`
- [x] T002 [P] [US1] Scale all `w` values in shared constants (KPI_DIMS, CHART_WIDE_DIMS, LIST_DIMS) and per-widget overrides by 1.5x in `src/lib/widgetRegistry.tsx`
- [x] T003 [US1] Scale all `x` and `w` values by 1.5x and bump version from 5 to 6 in `src/lib/defaultLayout.ts`

**Checkpoint**: New users see correct 24-column layout. Widget S/M/L picker applies correct dimensions.

---

## Phase 2: User Story 2 — Existing Layout Migration (Priority: P1)

**Goal**: Automatically migrate saved v5 layouts to v6 by scaling horizontal values, so returning users see their widgets at proportionally equivalent positions.

**Independent Test**: Seed localStorage with a v5 layout, reload the app. All widgets appear at 1.5x-scaled positions. Layout version is 6. Reload again — no re-migration occurs.

- [x] T004 [US2] Accept version 6 in the version check (add `obj.version !== 6` or equivalent) in `src/context/DashboardLayoutContext.tsx`
- [x] T005 [US2] Add v5→v6 migration block: scale x and w by 1.5, round with `Math.round()` in `src/context/DashboardLayoutContext.tsx`
- [x] T006 [US2] Update boundary guard from 16 to 24 (`item.x + item.w > 24`) in `src/context/DashboardLayoutContext.tsx`
- [x] T007 [US2] Update `validateLayout()` return to version 6 in `src/context/DashboardLayoutContext.tsx`

**Checkpoint**: Returning users' v5 layouts migrate cleanly to v6. Full migration chain v3→v4→v5→v6 works.

---

## Phase 3: Polish & Verification

**Purpose**: Validate the complete implementation across both user stories.

- [x] T008 Run `bun run build` and verify no TypeScript or build errors
- [x] T009 Run `bun test` and verify all existing tests pass
- [x] T010 Run `bun run lint` and verify no new lint errors
- [ ] T011 Run quickstart.md scenarios: new user layout, v5 migration, v3/v4 chain migration, widget resize after migration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: No dependencies — can start immediately
  - T001 and T002 can run in parallel (different files)
  - T003 depends on T002 (needs to know final w values for default layout)
- **Phase 2 (US2)**: Depends on Phase 1 completion (migration must target 24-col grid)
  - T004–T007 are sequential (all in the same file, logically ordered)
- **Phase 3 (Polish)**: Depends on Phase 1 + Phase 2

### Parallel Opportunities

```bash
# Phase 1 — launch T001 and T002 in parallel:
Task: "Update grid cols in src/pages/dashboard/DashboardGrid.tsx"
Task: "Scale sizeDims in src/lib/widgetRegistry.tsx"
# Then T003 after T002 completes

# Phase 3 — launch build, test, lint in parallel:
Task: "Run bun run build"
Task: "Run bun test"
Task: "Run bun run lint"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001–T003 (grid cols + sizeDims + default layout)
2. **STOP and VALIDATE**: New user flow works with 24-col grid
3. Proceed to US2 migration

### Incremental Delivery

1. T001 + T002 (parallel) → Grid and dimensions updated
2. T003 → Default layout updated → MVP complete for new users
3. T004–T007 → Migration complete for returning users
4. T008–T011 → Full verification

---

## Notes

- Only 4 source files change: `DashboardGrid.tsx`, `widgetRegistry.tsx`, `defaultLayout.ts`, `DashboardLayoutContext.tsx`
- All width scaling uses the 1.5x factor (16 × 1.5 = 24)
- Heights (h values) are never modified
- The sm breakpoint also scales: 8 × 1.5 = 12
- Mobile layout (xs/xxs = 1 column) is unaffected
