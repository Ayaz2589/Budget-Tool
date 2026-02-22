# Tasks: Always-On Widget Controls

**Input**: Design documents from `/specs/011-always-on-widget-controls/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Test tasks included for the new `useLongPress` hook only (new code). Existing widget behavior is verified via build + manual quickstart scenarios.

**Organization**: Tasks grouped by user story. US1/US2/US3 share DsWidgetShell.tsx rewrite and are co-implemented. US4 (mobile) and US5 (edit mode removal) are independent phases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create shared infrastructure needed by user stories

- [x] T001 Create `useLongPress` hook with 500ms threshold, 10px cancel radius, and optional haptic feedback in `src/hooks/useLongPress.ts`
- [x] T002 Write tests for `useLongPress` hook covering: fires after 500ms, cancels on move > 10px, cancels on early touchend, cleans up on unmount in `test/hooks/useLongPress.test.ts`

**Checkpoint**: Long-press hook ready for US4 (Mobile Reorder)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational tasks — all shared changes are co-located with their user stories to maintain incremental buildability. The context cleanup (removing `isEditing`) is deferred to US5 after all consumers are updated.

**⚠️ NOTE**: User stories must execute in order (Phase 3 → 4 → 5) because DsWidgetShell.tsx is rewritten in Phase 3, consumed in Phase 4, and the context interface is cleaned in Phase 5 after all consumers are updated.

---

## Phase 3: US1 - Resize via Popover + US2 - Always-On Drag + US3 - Hide Widget (Priority: P1/P2) 🎯 MVP

**Goal**: Replace the edit-mode toolbar in DsWidgetShell with always-available hover controls: a drag handle (top-left, hover-visible on desktop) and an overflow "..." popover (top-right) containing size selector and hide action. Drag is always enabled in DashboardGrid.

**Independent Test**: Hover any widget → see drag handle and "..." button appear. Click "..." → popover with size buttons and "Hide widget". Click a size → widget resizes immediately. Drag via handle → widget moves. Click "Hide" → widget disappears.

### Implementation

- [x] T003 [US1] Rewrite `DsWidgetShell` in `src/components/ds/DsWidgetShell.tsx`: remove `isEditing` prop from interface, remove `AnimatePresence` edit toolbar entirely, add a `group` class to the outer wrapper for hover detection
- [x] T004 [US2] Add always-on drag handle to `DsWidgetShell` in `src/components/ds/DsWidgetShell.tsx`: render `GripVertical` icon with class `react-grid-dragHandleExample` in top-left corner of widget, positioned absolutely, `opacity-0 group-hover:opacity-100 transition-opacity` on desktop, always visible on mobile
- [x] T005 [US1] Add overflow popover trigger to `DsWidgetShell` in `src/components/ds/DsWidgetShell.tsx`: render `MoreHorizontal` icon button in top-right corner, `opacity-0 group-hover:opacity-100` on desktop, always visible on mobile, wrapped in `Popover`/`PopoverTrigger` from `src/components/ui/popover.tsx`
- [x] T006 [US1] Add popover content to `DsWidgetShell` in `src/components/ds/DsWidgetShell.tsx`: `PopoverContent` with widget label, size selector buttons (reuse existing `SIZE_LABELS` and `registry.allowedSizes`), and "Hide widget" button. Selecting a size calls `onResize` and closes popover. Hide calls `onHide` and closes popover.
- [x] T007 [US3] Wire hide action in popover: ensure `onHide` callback in `DsWidgetShell` closes the popover after calling the hide handler (use Radix `onOpenChange` controlled state)
- [x] T008 [US2] Update `DashboardGrid` in `src/pages/dashboard/DashboardGrid.tsx`: set `isDraggable={true}` (remove `isEditing` conditional), remove the `isEditing && item.size === "sm" ? item.h + 1 : item.h` height bump from `rglLayouts`, remove `isEditing` from `useDashboardLayout()` destructuring, remove edit-mode padding from outer div
- [x] T009 [US1] Remove `isEditing` prop from `DsWidgetShell` usage in `DashboardGrid` in `src/pages/dashboard/DashboardGrid.tsx`: remove `isEditing={isEditing}` from the `<DsWidgetShell>` JSX
- [x] T010 [US1] Remove edit-mode ring highlight and shadow from `DsWidgetShell` in `src/components/ds/DsWidgetShell.tsx`: delete the conditional `isEditing && "ring-2 ring-primary/20 bg-card shadow-sm"` class

**Checkpoint**: Desktop resize-via-popover, always-on drag, and hide all work. Build passes (`bun run build`).

---

## Phase 4: US4 - Mobile Widget Reorder and Customize (Priority: P2)

**Goal**: Mobile users long-press a widget to open a popover with move-up, move-down, size selector, and hide. No direct touch-dragging.

**Independent Test**: On mobile viewport, long-press a widget → popover opens with Move Up, Move Down, size options, Hide. Tap "Move Down" → widget swaps. Normal scrolling is unaffected.

### Implementation

- [x] T011 [US4] Update `DashboardMobileGrid` in `src/pages/dashboard/DashboardMobileGrid.tsx`: remove `isEditing` from `useDashboardLayout()` destructuring, remove `isEditing` prop from `<DsWidgetShell>`
- [x] T012 [US4] Add long-press handler to each widget in `DashboardMobileGrid` in `src/pages/dashboard/DashboardMobileGrid.tsx`: import `useLongPress` from `src/hooks/useLongPress.ts`, attach touch handlers to each widget wrapper, manage popover open state per widget
- [x] T013 [US4] Add mobile popover to `DashboardMobileGrid` in `src/pages/dashboard/DashboardMobileGrid.tsx`: when long-press fires, open a `Popover` anchored to the widget with: Move Up button (disabled if `isFirst`), Move Down button (disabled if `isLast`), size selector (using `WIDGET_REGISTRY[id].allowedSizes`), and "Hide widget" action. Each action calls its handler and closes the popover.

**Checkpoint**: Mobile long-press popover works. Normal scrolling unaffected. Build passes.

---

## Phase 5: US5 - Remove Edit Mode UI Entirely (Priority: P1)

**Goal**: Remove Edit/Done buttons from dashboard header, remove `isEditing` state from context, clean up i18n keys. "Manage widgets" and "Reset layout" remain always accessible.

**Independent Test**: Dashboard header has no "Edit layout" or "Done" button. "Manage widgets" and "Reset layout" are always visible. No edit-mode visual indicators anywhere.

### Implementation

- [x] T014 [US5] Update dashboard header in `src/pages/dashboard/Dashboard.tsx`: remove `isEditing`, `startEditing`, `stopEditing` from `useDashboardLayout()` destructuring. Replace the conditional header actions (Edit mode vs normal mode) with a single always-visible action bar containing: "Manage widgets", "Reset layout", "Add expense", "Add income", "Settings" buttons. Remove the `isEditing && (...)` editing hint banner.
- [x] T015 [US5] Remove `isEditing` state, `startEditing`, `stopEditing` from context interface and provider in `src/context/DashboardLayoutContext.tsx`: delete `isEditing` from `DashboardLayoutContextValue`, delete `useState(false)` for isEditing, delete `startEditing`/`stopEditing` callbacks, remove from provider value object
- [x] T016 [US5] Update `handleReset` in `src/pages/dashboard/Dashboard.tsx`: remove `stopEditing()` call from the reset handler (no longer exists)
- [x] T017 [P] [US5] Remove edit-mode i18n keys from `src/locales/en.json`: delete `widget.editLayout`, `widget.doneEditing`, `widget.editingHint`
- [x] T018 [P] [US5] Remove edit-mode i18n keys from `src/locales/es.json`: delete `widget.editLayout`, `widget.doneEditing`, `widget.editingHint`
- [x] T019 [P] [US5] Remove edit-mode i18n keys from `src/locales/hi.json`: delete `widget.editLayout`, `widget.doneEditing`, `widget.editingHint`
- [x] T020 [P] [US5] Remove edit-mode i18n keys from `src/locales/bn.json`: delete `widget.editLayout`, `widget.doneEditing`, `widget.editingHint`
- [x] T021 [P] [US5] Remove edit-mode i18n keys from `src/locales/ja.json`: delete `widget.editLayout`, `widget.doneEditing`, `widget.editingHint`
- [x] T022 [P] [US5] Remove edit-mode i18n keys from `src/locales/ko.json`: delete `widget.editLayout`, `widget.doneEditing`, `widget.editingHint`
- [x] T023 [P] [US5] Remove edit-mode i18n keys from `src/locales/zh.json`: delete `widget.editLayout`, `widget.doneEditing`, `widget.editingHint`

**Checkpoint**: No edit mode exists. Context is clean. i18n has no stale keys. Build passes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all stories

- [x] T024 Run `bun run build` to verify TypeScript compiles clean with no unused variable errors in `src/`
- [x] T025 Run `bun test` to verify all existing tests pass (538+ tests) in `test/`
- [x] T026 Grep for stale references to `isEditing`, `startEditing`, `stopEditing`, `editLayout`, `doneEditing`, `editingHint` across `src/` to confirm complete removal
- [x] T027 Run quickstart.md verification scenarios (8 scenarios) to validate feature end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Phase 3 (US1+US2+US3)**: No dependency on Phase 1 (useLongPress not needed for desktop)
- **Phase 4 (US4)**: Depends on Phase 1 (useLongPress hook) AND Phase 3 (DsWidgetShell rewrite)
- **Phase 5 (US5)**: Depends on Phase 3 AND Phase 4 (all consumers must stop using isEditing before context removal)
- **Polish (Phase 6)**: Depends on all previous phases

### User Story Dependencies

- **US1 (Resize via Popover, P1)**: Phase 3 — No dependencies on other stories
- **US2 (Always-on Drag, P1)**: Phase 3 — Co-implemented with US1 in same file
- **US3 (Hide Widget, P2)**: Phase 3 — Co-implemented with US1 in same popover
- **US4 (Mobile Reorder, P2)**: Phase 4 — Depends on Phase 1 (hook) and Phase 3 (shell rewrite)
- **US5 (Remove Edit Mode, P1)**: Phase 5 — Depends on Phase 3 + 4 (all isEditing consumers updated first)

### Within Each Phase

- Phase 3: T003 → T004 → T005 → T006 → T007 (sequential, same file) then T008/T009 (DashboardGrid, can follow T003) then T010
- Phase 4: T011 → T012 → T013 (sequential, same file)
- Phase 5: T014 → T015 → T016 (sequential dependency), T017–T023 in parallel (separate locale files)

### Parallel Opportunities

- **Phase 1**: T001 and T002 are sequential (write hook, then test)
- **Phase 1 + Phase 3**: Can run in parallel (different files, no dependency)
- **Phase 5 i18n**: T017–T023 can all run in parallel (7 separate locale files)
- **Phase 6**: T024–T026 can run in parallel

---

## Parallel Example: Phase 5 i18n Cleanup

```bash
# All locale cleanups can run simultaneously:
Task: "Remove edit-mode i18n keys from src/locales/en.json"  # T017
Task: "Remove edit-mode i18n keys from src/locales/es.json"  # T018
Task: "Remove edit-mode i18n keys from src/locales/hi.json"  # T019
Task: "Remove edit-mode i18n keys from src/locales/bn.json"  # T020
Task: "Remove edit-mode i18n keys from src/locales/ja.json"  # T021
Task: "Remove edit-mode i18n keys from src/locales/ko.json"  # T022
Task: "Remove edit-mode i18n keys from src/locales/zh.json"  # T023
```

---

## Implementation Strategy

### MVP First (Phase 3: US1+US2+US3)

1. Complete Phase 1: useLongPress hook (can run in parallel with Phase 3)
2. Complete Phase 3: Rewrite DsWidgetShell + DashboardGrid
3. **STOP and VALIDATE**: Desktop resize, drag, and hide all work without edit mode
4. Build passes, existing tests pass

### Incremental Delivery

1. Phase 1 + Phase 3 → Desktop controls work (MVP!)
2. Phase 4 → Mobile long-press popover works
3. Phase 5 → Edit mode fully removed from codebase
4. Phase 6 → Full verification, stale reference cleanup

### Single Developer Strategy

Execute phases sequentially (1 → 3 → 4 → 5 → 6). Within each phase, follow task order. Build and test after each phase checkpoint.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1/US2/US3 are co-implemented in Phase 3 (same file: DsWidgetShell.tsx)
- The `isEditing` removal from context (T015) is intentionally last — all consumers must be updated first
- No localStorage migration needed (layout version stays at 4)
- Commit after each phase checkpoint
