# Tasks: Half-Pie Charts with Gaps & Rounded Corners

**Input**: Design documents from `/specs/022-half-pie-charts/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: No test tasks generated — not explicitly requested in feature specification. Existing tests must continue passing.

**Organization**: US1 (half-pie shape) and US2 (rounded corners & gaps) are both P1 and modify the same `<Pie>` elements. They are combined into a single implementation phase since the props are applied together on each component.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup required — no new dependencies, no new files, no project structure changes.

(Skipped — recharts v2.15.4 already installed, all target files exist.)

---

## Phase 2: Foundational

**Purpose**: No foundational work required — no shared infrastructure, no blocking prerequisites.

(Skipped — purely visual prop changes to existing components.)

---

## Phase 3: User Stories 1 & 2 - Half-Pie Shape + Rounded Corners & Gaps (Priority: P1) MVP

**Goal**: Convert both dashboard pie charts from full-circle to half-pie (semicircle) with rounded segment corners and gaps between segments.

**Independent Test**: Open dashboard with expense data. Confirm both Category Chart and Owner Split Chart render as semicircles with rounded corners and visible gaps at md and lg sizes. Verify tooltips, legends, colors, and dark mode still work. Verify sm size is unchanged.

### Implementation

- [x] T001 [P] [US1] [US2] Update CategoryChart lg `<Pie>` with half-pie and style props in `src/pages/dashboard/widgets/CategoryChart.tsx` — add `startAngle={180} endAngle={0} cx="50%" cy="80%" cornerRadius={6} paddingAngle={4} minAngle={5}` to the lg-size Pie element (line ~91)
- [x] T002 [P] [US1] [US2] Update OwnerSplitChart `<Pie>` with half-pie and style props in `src/pages/dashboard/widgets/OwnerSplitChart.tsx` — add `startAngle={180} endAngle={0} cx="50%" cy="80%" cornerRadius={6} paddingAngle={4} minAngle={5}` to the shared Pie element (line ~125)
- [x] T003 [US1] [US2] Update CategoryChart md `<Pie>` with half-pie and style props in `src/pages/dashboard/widgets/CategoryChart.tsx` — add same props to the md-size Pie element (line ~118)
- [x] T004 [US1] Adjust CategoryChart `ChartContainer` heights in `src/pages/dashboard/widgets/CategoryChart.tsx` — reduce lg heightDesktop from 220→140 and heightMobile from 200→140 (line ~89); md heights already 140 (no change needed)
- [x] T005 [US1] Adjust OwnerSplitChart `ChartContainer` heights in `src/pages/dashboard/widgets/OwnerSplitChart.tsx` — reduce lg heightDesktop from 220→140 (line ~123); md heights already 140 (no change needed)
- [x] T006 [US2] Add defensive zero-value segment filtering before `<Pie>` data in `src/pages/dashboard/widgets/CategoryChart.tsx` and `src/pages/dashboard/widgets/OwnerSplitChart.tsx` — filter out entries where `value <= 0` to prevent paddingAngle overlap on zero-width segments
- [x] T007 [US1] Reduce widget registry lg height for both pie chart widgets in `src/lib/widgets/widgetRegistry.tsx` — change `category-chart` lg from `{ w: 12, h: 8 }` to `{ w: 12, h: 6 }` (line ~144) and `owner-split-chart` lg from `{ w: 12, h: 8 }` to `{ w: 12, h: 6 }` (line ~156)

**Checkpoint**: Both pie charts render as semicircles with rounded corners, gaps, and compact height. All existing behavior (tooltips, legends, colors, sm text-only, dark mode) preserved.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Verify no regressions across the build pipeline

- [x] T008 Run existing test suite with `bun test` to verify no regressions
- [x] T009 Run `bun run build` to verify TypeScript compilation and production build
- [ ] T010 Run quickstart.md visual verification checklist (manual: check both charts at sm/md/lg, light/dark mode, tooltips, legends)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — nothing to set up
- **Foundational (Phase 2)**: Skipped — no blocking prerequisites
- **User Stories (Phase 3)**: Can start immediately
- **Polish (Phase 4)**: Depends on Phase 3 completion

### User Story Dependencies

- **US1 (Half-Pie Shape)** and **US2 (Rounded Corners & Gaps)** are co-implemented — same `<Pie>` props, same files, same phase. No cross-story dependencies.

### Within Phase 3

- T001 and T002 can run in parallel (different files)
- T003 depends on T001 (same file: CategoryChart.tsx)
- T004 depends on T003 (same file: CategoryChart.tsx)
- T005 can run in parallel with T003/T004 (different file: OwnerSplitChart.tsx)
- T006 depends on T001-T005 (touches both files, should be last prop change)
- T007 can run in parallel with T001-T006 (different file: widgetRegistry.tsx)

### Parallel Opportunities

```
Parallel group 1: T001 + T002 + T007 (three different files)
Sequential on CategoryChart: T001 → T003 → T004
Sequential on OwnerSplitChart: T002 → T005
After all prop changes: T006 (both files)
After all implementation: T008 + T009 (parallel build checks)
```

---

## Parallel Example: Phase 3

```bash
# Launch initial parallel tasks (3 different files):
Task: "T001 - Update CategoryChart lg Pie props in CategoryChart.tsx"
Task: "T002 - Update OwnerSplitChart Pie props in OwnerSplitChart.tsx"
Task: "T007 - Reduce widget registry heights in widgetRegistry.tsx"

# Then sequential on each file:
Task: "T003 - Update CategoryChart md Pie props"
Task: "T004 - Adjust CategoryChart container heights"
Task: "T005 - Adjust OwnerSplitChart container heights"

# Final cross-file task:
Task: "T006 - Add zero-value filtering to both components"
```

---

## Implementation Strategy

### MVP First (All in One Phase)

1. Skip Setup + Foundational (nothing needed)
2. Complete Phase 3: All pie chart prop changes + height adjustments
3. **STOP and VALIDATE**: Visual check + build verification (Phase 4)
4. Deploy

### Incremental Delivery

This feature is small enough to deliver in a single increment. All 7 implementation tasks modify 3 files with ~20 lines total. The entire feature can be completed and validated in one pass.

---

## Notes

- [P] tasks = different files, no dependencies
- US1 and US2 are combined because they modify the same `<Pie>` elements
- No new files created — all changes are in-place modifications
- sm widget size is explicitly unchanged (text-only, no chart)
- Existing tests must pass — no test modifications expected
- Commit after Phase 3 completion (all prop changes together form one logical change)
