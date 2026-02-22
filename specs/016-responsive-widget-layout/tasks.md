# Tasks: Responsive Widget Layout

**Input**: Design documents from `/specs/016-responsive-widget-layout/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Included per Constitution Principle VI (incremental refactoring: tests first, then code).

**Organization**: Tasks grouped by user story. All changes target a single file (`src/pages/dashboard/DashboardGrid.tsx`) plus one new test file.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Add the `deriveSmLayout` pure function and its tests. This function is needed by US1 (layout scaling) and indirectly by US2/US3 (roundtrip fidelity).

- [x] T001 [P] Write unit tests for `deriveSmLayout` in `test/pages/dashboard/deriveSmLayout.test.ts`. Cover: proportional scaling (w=6 → w=3, w=12 → w=6, w=24 → w=12), minimum width clamping (w=1 stays w=1), position clamping (x+w never exceeds 12), empty input returns empty output, y and h remain unchanged, item order preserved. Use examples from `contracts/derive-layout.md`.
- [x] T002 Add `deriveSmLayout` helper function at module level in `src/pages/dashboard/DashboardGrid.tsx`. Implement per `contracts/derive-layout.md`: `w' = max(1, round(w * 0.5))`, `x' = min(round(x * 0.5), 12 - w')`, y and h unchanged. Export the function for testability.
- [x] T003 Run `bun test test/pages/dashboard/deriveSmLayout.test.ts` — all tests must pass.

**Checkpoint**: `deriveSmLayout` is implemented, tested, and ready to wire into the grid.

---

## Phase 2: User Story 1 — Tablet/Narrow Desktop Dashboard Viewing (Priority: P1)

**Goal**: Widgets reflow cleanly at viewports between 768px and 1200px with no overlapping.

**Independent Test**: Resize browser from >1200px down to 768px — all widgets reflow into 12 columns without overlap.

### Implementation for User Story 1

- [x] T004 [US1] Update `rglLayouts` useMemo in `src/pages/dashboard/DashboardGrid.tsx` to return `{ lg, md: lg, sm: deriveSmLayout(lg) }` instead of `{ lg }`. This provides explicit layout positions for all three breakpoints that RGL renders (md uses same 24-col positions, sm uses scaled 12-col positions).
- [x] T005 [US1] Run `bun test` — all existing tests must still pass (no regressions from providing additional breakpoint layouts).

**Checkpoint**: US1 complete — widgets now have explicit positions at all breakpoints. Resize from >1200px to 768px should show clean reflow.

---

## Phase 3: User Story 2 + User Story 3 — Layout Persistence & Drag Scoping (Priority: P2/P3)

**Goal**: US2 — resizing down and back up restores the exact original layout (zero drift). US3 — only layout changes at the lg breakpoint are persisted; md/sm reflows are ignored.

**Note**: US2 and US3 are the same implementation change — updating `handleLayoutChange` to only persist from the `allLayouts.lg` key. They are grouped together because they share a single code modification.

**Independent Test (US2)**: Arrange widgets at wide viewport, resize down then back up — positions restore exactly.
**Independent Test (US3)**: Observe that no localStorage writes occur when RGL fires onLayoutChange at sm/md breakpoints.

### Implementation for User Stories 2 & 3

- [x] T006 [US2] Update `handleLayoutChange` signature in `src/pages/dashboard/DashboardGrid.tsx` from `(currentLayout: Layout)` to `(_currentLayout: Layout, allLayouts: Record<string, Layout[]>)`. Update the body to read positions from `allLayouts.lg` instead of `currentLayout`. If `allLayouts.lg` is undefined or empty, return early (no-op). Per `contracts/layout-change-handler.md`.
- [x] T007 [US3] Run `bun test` — all existing tests must pass. Then run `bun run build` to verify TypeScript compilation with the updated callback signature.

**Checkpoint**: US2 + US3 complete — only lg breakpoint changes persist. Derived layouts at md/sm are ephemeral.

---

## Phase 4: Polish & Verification

**Purpose**: Final validation across all user stories and edge cases.

- [x] T008 Run `bun test` to confirm all tests pass (existing + new `deriveSmLayout` tests).
- [x] T009 Run `bun run build` to confirm TypeScript strict mode passes and production build succeeds.
- [x] T010 Manual verification per quickstart.md checklist: resize >1200px → 768px (clean reflow), resize back (exact restore), drag at lg + resize roundtrip (persists), no overlaps at any width 768-1200px.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 (needs `deriveSmLayout`)
- **US2 + US3 (Phase 3)**: Depends on Phase 2 (needs `rglLayouts` providing all breakpoints for the updated callback to receive `allLayouts`)
- **Polish (Phase 4)**: Depends on all prior phases

### Within Each Phase

- T001 and T002 can run in parallel (different files)
- T003 depends on T001 + T002
- T004 depends on T002
- T006 depends on T004

### Parallel Opportunities

```text
# Phase 1: These target different files and can run in parallel
T001: test/pages/dashboard/deriveSmLayout.test.ts (NEW)
T002: src/pages/dashboard/DashboardGrid.tsx (MODIFY)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: `deriveSmLayout` function + tests
2. Complete Phase 2: Wire into `rglLayouts` memo
3. **STOP and VALIDATE**: Resize browser — widgets should reflow cleanly
4. At this point, the core bug (overlapping widgets) is fixed

### Full Delivery

1. Complete MVP above
2. Complete Phase 3: Update `handleLayoutChange` for persistence safety
3. Complete Phase 4: Full verification
4. All 3 user stories delivered, all success criteria met

---

## Notes

- All implementation changes are in a single file: `src/pages/dashboard/DashboardGrid.tsx`
- One new test file: `test/pages/dashboard/deriveSmLayout.test.ts`
- Zero new dependencies, zero new persisted data
- Total estimated scope: ~40 lines of production code, ~60 lines of test code
- `deriveSmLayout` must be exported for testability (named export alongside the component)
