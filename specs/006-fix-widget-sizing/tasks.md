# Tasks: Fix Widget Sizing

**Input**: Design documents from `/specs/006-fix-widget-sizing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested. Existing tests (538) must pass (FR-009).

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Verify environment and establish baseline

- [x] T001 Verify branch `006-fix-widget-sizing` is checked out and run `bun test` to confirm all existing 538 tests pass
- [x] T002 Run `bun run build` to confirm TypeScript compilation succeeds as baseline

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Audit current widget heights to determine correct minH values. MUST complete before any user story work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Run `bun dev` and open `http://localhost:5173/dashboard`. For each of the 14 widgets, enter edit mode and cycle through S → M → L. At each size, use browser dev tools to measure the widget's rendered content height (scroll height of inner content). Record the content heights in a comment at the top of `src/lib/widgetRegistry.tsx` for reference. Note which widget-size combinations currently clip content.
- [x] T004 Compare measured content heights against current `minH` values in `src/lib/widgetRegistry.tsx`. For each widget-size pair, calculate required minH as `ceil(contentHeight / 40) + 1` (where 40 = rowHeight, +1 = safety buffer). Document proposed new minH values.

**Checkpoint**: We have measured data to drive minH value changes. No code changes yet.

---

## Phase 3: User Story 1 — Widget Content Never Cut Off When Resizing (Priority: P1) MVP

**Goal**: All 14 widgets render without any content clipping at sm/md/lg sizes. Content is always fully visible.

**Independent Test**: Enter edit mode, resize each of the 14 widgets through S → M → L → S. At every size, verify all text, charts, and data rows are fully visible without any clipping.

- [x] T005 [US1] Update `minH` values for all 4 KPI widgets (kpi-net-cash-flow, kpi-total-spent, kpi-total-income, kpi-total-debt) in `src/lib/widgetRegistry.tsx` using the measurements from T003/T004. Proposed baseline: sm=2, md=3, lg=4 — adjust based on actual measurements.
- [x] T006 [US1] Update `minH` values for the quick-add widget in `src/lib/widgetRegistry.tsx` using measurements from T003/T004. Proposed baseline: sm=2, md=3, lg=3.
- [x] T007 [US1] Update `minH` values for all 4 chart widgets (chart-cash-flow, chart-net-trend, chart-category, chart-owner-split) in `src/lib/widgetRegistry.tsx` using measurements from T003/T004. Proposed baseline: sm=4, md=7, lg=10 — adjust per widget based on actual measurements.
- [x] T008 [US1] Update `minH` values for all 5 data list widgets (debt-snapshot, spend-by-source, owner-transfers, recent-activity, smart-insights) in `src/lib/widgetRegistry.tsx` using measurements from T003/T004. Proposed baseline: sm=4, md=6, lg=8 — adjust per widget based on actual measurements.
- [x] T009 [US1] Change overflow behavior in `src/components/ds/DsWidgetCard.tsx` — replace `overflow-hidden` with `overflow-y-auto` in the Card className so content scrolls instead of being clipped if it exceeds the grid cell height. Keep `overflow-x-hidden` to prevent horizontal overflow.
- [x] T010 [US1] Verify `src/components/ds/DsWidgetShell.tsx` keeps `overflow-hidden` on the outer container (line ~49) to prevent content bleeding into grid margins. This should NOT be changed — only DsWidgetCard's inner overflow changes.
- [x] T011 [US1] Run `bun test` and `bun run build` to verify minH and overflow changes don't break existing tests
- [x] T012 [US1] Visual verification: run `bun dev`, enter edit mode, and cycle each of the 14 widgets through S → M → L → S. Confirm no content is clipped at any size. If any widget still clips, adjust its minH in `src/lib/widgetRegistry.tsx` and re-verify.

**Checkpoint**: All 42 widget-size combinations display content without clipping (SC-001, SC-003). Overflow safety net is in place.

---

## Phase 4: User Story 2 — Reset Restores Correct Size-Conforming Layout (Priority: P2)

**Goal**: Reset produces a layout where every widget's `w` matches `SIZE_TO_W[size]` and `h` is sufficient for its content.

**Independent Test**: Click "Reset Layout", then enter edit mode and verify each widget's highlighted size button matches its actual column span.

- [x] T013 [US2] Update KPI card entries in `src/lib/defaultLayout.ts` — change from `{ size: "md", w: 3, h: 2 }` to `{ size: "sm", w: 4, h: <minH.sm from registry> }`. Update `x` and `y` positions: 3 KPIs fit per row at w=4 (4+4+4=12), so the 4th KPI wraps to the next row. Recalculate y-positions accordingly.
- [x] T014 [US2] Update Quick Add entry in `src/lib/defaultLayout.ts` — change from `{ size: "md", w: 12, h: 2 }` to `{ size: "lg", w: 12, h: <minH.lg from registry> }`. Update y-position to account for KPI row changes.
- [x] T015 [US2] Update Smart Insights entry in `src/lib/defaultLayout.ts` — change from `{ size: "md", w: 12, h: 4 }` to `{ size: "lg", w: 12, h: <minH.lg from registry> }`. Update y-position.
- [x] T016 [US2] Recalculate all y-positions in `src/lib/defaultLayout.ts` for the remaining widgets (charts, data sections) to account for the new KPI row layout and updated h values. Ensure the `h` value for each widget uses the updated minH from the registry for its assigned size.
- [x] T017 [US2] Verify `resizeWidget()` in `src/context/DashboardLayoutContext.tsx` correctly uses updated minH values — the existing code `const newH = registry ? registry.minH[size] : 4` reads from the registry, so updated minH values should automatically propagate. No code changes expected, just verification.
- [x] T018 [US2] Run `bun test` and `bun run build` to verify default layout changes don't break existing tests
- [x] T019 [US2] Visual verification: run `bun dev`, click "Reset Layout", re-enter edit mode. Verify: (a) each widget's highlighted S/M/L button matches its grid column span, (b) no content is clipped at any widget's default size, (c) the overall layout looks reasonable with the new KPI arrangement.

**Checkpoint**: Reset layout is fully SIZE_TO_W-conforming (SC-002, SC-006). All widgets display content at their default sizes.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, mobile, and final validation

- [x] T020 [P] Verify empty states at all sizes — remove all data (clear localStorage), refresh dashboard, and confirm DsEmptyState messages are fully visible in all 14 widgets at all 3 sizes. No clipping.
- [x] T021 [P] Verify mobile rendering — open dashboard in mobile viewport, confirm all widgets render in vertical stack with full content visible at their assigned sizes. Verify in `src/pages/dashboard/DashboardMobileGrid.tsx` that size is passed correctly (FR-010).
- [x] T022 [P] Verify first-visit default layout — delete `ortho-dashboard-layout` from localStorage, refresh page, confirm layout matches post-reset layout with conforming sizes (SC-006).
- [x] T023 Run full test suite (`bun test`), TypeScript build (`bun run build`), and lint (`bun run lint`) to confirm zero regressions (FR-009, SC-004)
- [x] T024 Run quickstart.md validation checklist — verify all 8 items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify baseline
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (needs measured minH values)
- **US2 (Phase 4)**: Depends on Phase 3 (needs updated minH values in registry to set correct h in default layout)
- **Polish (Phase 5)**: Depends on Phases 3–4

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on US2
- **US2 (P2)**: Depends on US1 completion (default layout h values reference the updated minH from registry)

### Within Each User Story

- Registry minH changes (T005–T008) can run in parallel [different widget types]
- Overflow change (T009) is independent of minH changes
- Visual verification (T012, T019) must follow all code changes in that phase
- Default layout position updates (T013–T016) are sequential (y-positions depend on earlier rows)

### Parallel Opportunities

```
Phase 1 (sequential): T001 → T002

Phase 2 (sequential): T003 → T004

Phase 3 (parallel where marked):
  T005, T006, T007, T008  (4 minH update tasks, different widget groups in same file — sequential in practice)
  T009  (overflow change, different file — can run parallel with T005–T008)
  T010  (verification, no code change)
  T011  (test/build check)
  T012  (visual verification — last)

Phase 4 (sequential):
  T013 → T014 → T015 → T016 → T017 → T018 → T019

Phase 5 (parallel where marked):
  T020, T021, T022  (independent verification tasks)
  T023 → T024  (sequential — tests before quickstart)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify baseline)
2. Complete Phase 2: Foundational (measure content heights)
3. Complete Phase 3: User Story 1 (fix minH + overflow)
4. **STOP and VALIDATE**: All 42 widget-size combinations display without clipping
5. This alone resolves the primary user complaint — content cutoff

### Incremental Delivery

1. Setup + Foundational → Measurements ready
2. User Story 1 → Content never cut off → Commit (MVP!)
3. User Story 2 → Reset layout conforms to sizes → Commit
4. Polish → Edge cases verified, tests pass → Final commit
