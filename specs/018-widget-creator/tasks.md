# Tasks: Widget Creator Function

**Input**: Design documents from `/specs/018-widget-creator/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup needed — no new dependencies, no project initialization required.

*(Skipped — the feature uses only existing project infrastructure.)*

---

## Phase 2: Foundational (Tests)

**Purpose**: Write tests for the `createWidget` factory function FIRST, verify they fail, then implement.

- [x] T001 Create test file `test/lib/createWidget.test.tsx` with all test cases: required fields (returns valid entry with correct type, label, icon, sizeDims, render), defaultSize (defaults to "md", accepts "sm" and "lg" overrides), render passthrough (delegates to input render, passes props and size through), className wrapping (no wrapper when omitted, wraps in div with className when provided), purity (distinct objects from same args, does not mutate input). Target: ~12 tests.
- [x] T002 Run `bun test test/lib/createWidget.test.tsx` — verify all tests FAIL (factory doesn't exist yet)

**Checkpoint**: All tests written and failing, ready for implementation.

---

## Phase 3: User Story 1 — Create a Widget with Standard Sizes (Priority: P1) 🎯 MVP

**Goal**: Implement the `createWidget` factory function that accepts required fields (type, label, icon, sizeDims, render) and optional `defaultSize`, returning a valid `WidgetRegistryEntry`.

**Independent Test**: Call `createWidget` with various argument combinations and verify the returned object matches `WidgetRegistryEntry` shape with correct field values.

- [x] T003 [US1] Implement `createWidget` function in `src/lib/createWidget.tsx` — accepts `CreateWidgetOptions` with flat size params (type, label, icon, sm, md, lg, render, optional defaultSize defaulting to "md"). Assembles `sizeDims: { sm, md, lg }` internally. Returns `WidgetRegistryEntry`. Export both the function and the `CreateWidgetOptions` interface.
- [x] T004 [US1] Run `bun test test/lib/createWidget.test.tsx` — verify all US1-related tests pass (required fields, defaultSize, render passthrough, purity)
- [x] T005 [US1] Run `bun run build` — verify TypeScript strict mode passes

**Checkpoint**: `createWidget` works for standard widget creation. All core tests pass.

---

## Phase 4: User Story 2 — Create a Widget with Custom Styles (Priority: P2)

**Goal**: Add optional `className` parameter to `createWidget` that wraps the render output in a `<div className={className}>` when provided.

**Independent Test**: Call `createWidget` with className and verify the render output is wrapped; call without className and verify no wrapper.

- [x] T006 [US2] Add className handling to `createWidget` in `src/lib/createWidget.tsx` — when `className` is provided, return a new render function that wraps the original render output in `<div className={className}>`; when omitted, pass render through directly (no extra DOM node)
- [x] T007 [US2] Run `bun test test/lib/createWidget.test.tsx` — verify all tests pass including className wrapping tests
- [x] T008 [US2] Run `bun run build` — verify TypeScript strict mode passes

**Checkpoint**: `createWidget` supports both standard and custom-styled widgets. All tests pass.

---

## Phase 5: User Story 3 — Migrate Existing Widgets to Creator (Priority: P3)

**Goal**: Migrate all 14 widgets in `WIDGET_REGISTRY` to use `createWidget()`. Zero visual or behavioral regressions.

**Independent Test**: Run full test suite (`bun test`) and build (`bun run build`) — all 578+ existing tests pass, no TypeScript errors.

- [x] T009 [US3] Add `import { createWidget } from "@/lib/createWidget"` to `src/lib/widgetRegistry.tsx`
- [x] T010 [US3] Migrate KPI widgets (4) to `createWidget()` in `src/lib/widgetRegistry.tsx`: `net-cash-flow`, `total-spent`, `total-income`, `total-debt` — spread `...KPI_DIMS` for flat size params, omit `defaultSize` (defaults to "md")
- [x] T011 [US3] Migrate chart widgets (4) to `createWidget()` in `src/lib/widgetRegistry.tsx`: `cash-flow-chart` (spread `...CHART_WIDE_DIMS`, defaultSize "lg"), `net-trend-chart` (inline sm/md/lg), `category-chart` (inline sm/md/lg, defaultSize "lg"), `owner-split-chart` (inline sm/md/lg, defaultSize "lg")
- [x] T012 [US3] Migrate list widgets (4) to `createWidget()` in `src/lib/widgetRegistry.tsx`: `debt-snapshot`, `spend-by-source`, `owner-transfers`, `recent-activity` — spread `...LIST_DIMS` for flat size params, omit `defaultSize`
- [x] T013 [US3] Migrate remaining widgets (2) to `createWidget()` in `src/lib/widgetRegistry.tsx`: `quick-add` (inline sm/md/lg), `smart-insights` (spread `...KPI_DIMS`, defaultSize "sm")
- [x] T014 [US3] Run `bun test` — verify all tests pass (578+ existing tests + new createWidget tests)
- [x] T015 [US3] Run `bun run build` — verify TypeScript strict mode passes

**Checkpoint**: All 14 widgets migrated. Full test suite passes. No regressions.

---

## Phase 6: Polish

**Purpose**: Final verification and lint check.

- [x] T016 Run `bun run lint` — verify no new lint errors introduced
- [x] T017 Final review: confirm no changes to `WidgetRegistryEntry` interface, `DsWidgetShell`, `DsWidgetCard`, or `DashboardGrid`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — write tests first
- **US1 (Phase 3)**: Depends on Phase 2 (tests must exist before implementation)
- **US2 (Phase 4)**: Depends on Phase 3 (extends the factory function)
- **US3 (Phase 5)**: Depends on Phase 4 (uses complete factory including className support)
- **Polish (Phase 6)**: Depends on Phase 5

### Within Each Phase

- T010–T013 can run in parallel (different widget groups, same file but non-overlapping sections)
- All other tasks are sequential within their phase

### Parallel Opportunities

```bash
# Phase 5: Migrate widget groups in parallel (T010–T013)
Task: "Migrate KPI widgets (4) in src/lib/widgetRegistry.tsx"
Task: "Migrate chart widgets (4) in src/lib/widgetRegistry.tsx"
Task: "Migrate list widgets (4) in src/lib/widgetRegistry.tsx"
Task: "Migrate remaining widgets (2) in src/lib/widgetRegistry.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Write all tests (T001–T002)
2. Complete Phase 3: Implement factory (T003–T005)
3. **STOP and VALIDATE**: Run tests, verify factory works

### Incremental Delivery

1. Phase 2 → Tests written and failing
2. Phase 3 (US1) → Factory works for standard widgets
3. Phase 4 (US2) → Factory supports custom styles
4. Phase 5 (US3) → All 14 widgets migrated, zero regressions
5. Phase 6 → Lint clean, final verification

---

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 17 |
| Phase 2 (Foundational) | 2 tasks |
| Phase 3 (US1 — MVP) | 3 tasks |
| Phase 4 (US2) | 3 tasks |
| Phase 5 (US3) | 7 tasks |
| Phase 6 (Polish) | 2 tasks |
| Files created | 2 (`src/lib/createWidget.tsx`, `test/lib/createWidget.test.tsx`) |
| Files modified | 1 (`src/lib/widgetRegistry.tsx`) |
| Parallel opportunities | T010–T013 (widget migration groups) |

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each phase completion
- The migration (Phase 5) is mechanical — each entry wraps in `createWidget({...})`
- `defaultSize: "md"` is omitted from calls since it matches the default
