# Tasks: Save Multiple Layouts

**Input**: Design documents from `/specs/017-save-multiple-layouts/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/layout-collection.md

**Tests**: Included — context CRUD logic warrants unit tests per constitution Principle VI.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add types and storage key needed by all subsequent work

- [x] T001 [P] Add `SavedLayoutEntry`, `SavedLayoutCollection`, `SaveLayoutResult`, and `RenameResult` types in `src/types/widget.ts` per data-model.md
- [x] T002 [P] Add `SAVED_LAYOUTS: "budget-tool-saved-layouts"` to `STORAGE_KEYS` in `src/lib/storage.ts`
- [x] T003 [P] Add layout management i18n keys to `src/locales/en.json` (`widget.saveLayout`, `widget.layouts`, `widget.defaultLayout`, `widget.deleteLayoutConfirmTitle`, `widget.deleteLayoutConfirmDescription`, `widget.renameLayout`, `widget.layoutName`, `widget.layoutLimitReached`, `widget.layoutSaved`, `widget.layoutNameRequired`, `widget.layoutNameTooLong`, `widget.layoutNameDuplicate`, `widget.overwriteLayout`, `widget.saveAsNew`, `widget.myLayout`)

**Checkpoint**: Types, storage key, and English strings are available for context and UI work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Context collection state, migration from single→multi layout, and active-layout sync. MUST complete before any UI work.

- [x] T004 Write unit tests for collection CRUD operations (load, save, switch, delete, rename, migration) in `test/context/DashboardLayoutContext.savedLayouts.test.tsx` — tests should fail before implementation
- [x] T005 Implement `loadLayoutCollection()` in `src/context/DashboardLayoutContext.tsx` — reads `budget-tool-saved-layouts` from localStorage, validates each entry via existing `validateLayout()`, ensures `"default"` entry always exists with factory `DEFAULT_LAYOUT`, and handles missing-key migration (wraps existing single layout as "My Layout")
- [x] T006 Implement `persistLayoutCollection()` in `src/context/DashboardLayoutContext.tsx` — writes `SavedLayoutCollection` to localStorage, called on every collection mutation
- [x] T007 Add collection state (`savedLayouts`, `activeLayoutId`) to `DashboardLayoutProvider` in `src/context/DashboardLayoutContext.tsx` — initialize from `loadLayoutCollection()`, add `useEffect` to sync active layout edits back to the collection entry
- [x] T008 Implement `saveLayout(name)` method in `src/context/DashboardLayoutContext.tsx` — validates name (trim, 1-30 chars, unique case-insensitive), checks 10-entry limit, snapshots current layout, appends entry with `crypto.randomUUID()`, sets `activeId`, persists
- [x] T009 Implement `switchLayout(id)` method in `src/context/DashboardLayoutContext.tsx` — sets `activeId`, replaces working layout state with `structuredClone` of selected entry's snapshot, persists collection and active layout key
- [x] T010 Verify all T004 tests pass after T005-T009 implementation — run `bun test test/context/DashboardLayoutContext.savedLayouts.test.tsx`

**Checkpoint**: Context fully supports save and switch. All collection CRUD tests pass. No UI yet.

---

## Phase 3: User Story 1 + 2 — Save & Switch Layouts (Priority: P1) MVP

**Goal**: Users can save the current layout with a name and switch between saved layouts from the dashboard header.

**Independent Test**: Customize dashboard, save as "Work Mode", switch to "Default", switch back to "Work Mode" — layout restores exactly. Refresh page — saved layouts persist.

### Implementation

- [x] T011 [US1] [US2] Create `DsLayoutSwitcher` component in `src/components/ds/DsLayoutSwitcher.tsx` — compact Select dropdown showing all saved layouts with active indicator. Includes: save button (opens Dialog for name input with validation), layout list as SelectItems. Follows currency selector pattern (`h-8 rounded-full`). Props: `savedLayouts`, `activeLayoutId`, `onSwitch`, `onSave`.
- [x] T012 [US1] [US2] Add save-layout Dialog inside `DsLayoutSwitcher` — text input for name, validates on submit (empty, too long, duplicate detection with overwrite prompt), calls `onSave(name)`. Uses shadcn `Dialog` + `Input` components.
- [x] T013 [US1] [US2] Integrate `DsLayoutSwitcher` in `src/pages/dashboard/Dashboard.tsx` — place in section header next to the grid icon (desktop only, hidden on mobile). Wire props to context methods (`savedLayouts`, `activeLayoutId`, `saveLayout`, `switchLayout`).
- [x] T014 [US1] [US2] Extend `DashboardLayoutContextValue` interface in `src/context/DashboardLayoutContext.tsx` to expose `savedLayouts`, `activeLayoutId`, `activeLayoutName`, `saveLayout`, `switchLayout`, `deleteLayout`, `renameLayout` — update the context provider's value object.
- [x] T015 [US1] [US2] Run full test suite (`bun test`) and build (`bun run build`) to verify no regressions.

**Checkpoint**: Save and switch are fully functional. This is the MVP — users can save named layouts and switch between them.

---

## Phase 4: User Story 3 — Delete a Saved Layout (Priority: P2)

**Goal**: Users can delete any saved layout except "Default", with confirmation.

**Independent Test**: Save "Temp Layout", delete it via confirmation dialog, verify it disappears from the list. Delete the active layout — verify dashboard falls back to Default.

### Implementation

- [x] T016 [US3] Implement `deleteLayout(id)` method in `src/context/DashboardLayoutContext.tsx` — guards against `id === "default"`, removes entry from collection, falls back `activeId` to `"default"` if deleting the active layout, persists
- [x] T017 [US3] Add delete button per layout item in `DsLayoutSwitcher` (`src/components/ds/DsLayoutSwitcher.tsx`) — `Trash2` icon, hidden for default entry. Opens AlertDialog for confirmation per constitution Principle IV.
- [x] T018 [US3] Add AlertDialog for delete confirmation in `DsLayoutSwitcher` — shows layout name in description, destructive action button. Uses existing AlertDialog pattern from Dashboard.tsx reset confirmation.
- [x] T019 [US3] Add delete-related i18n keys to `src/locales/en.json` if not already covered by T003 (`widget.deleteLayoutConfirmAction`)
- [x] T020 [US3] Run full test suite and build to verify no regressions.

**Checkpoint**: Delete is functional with confirmation. Default is protected.

---

## Phase 5: User Story 4 — Rename a Saved Layout (Priority: P3)

**Goal**: Users can rename any saved layout (except Default), enforcing unique names.

**Independent Test**: Save "Layout A", rename to "Layout B", verify list updates. Try renaming to an existing name — verify rejection with error message.

### Implementation

- [x] T021 [US4] Implement `renameLayout(id, newName)` method in `src/context/DashboardLayoutContext.tsx` — validates new name (trim, 1-30 chars, unique case-insensitive, not default), updates entry, persists
- [x] T022 [US4] Add inline rename UI in `DsLayoutSwitcher` (`src/components/ds/DsLayoutSwitcher.tsx`) — edit icon per layout item (hidden for default), opens small Dialog with text input pre-filled with current name. Validates and calls `onRename(id, newName)`.
- [x] T023 [US4] Run full test suite and build to verify no regressions.

**Checkpoint**: Rename is functional. All four user stories are complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: i18n for remaining locales, accessibility review, final verification

- [x] T024 [P] Add layout management i18n keys to remaining locale files (`src/locales/es.json`, `src/locales/bn.json`, `src/locales/hi.json`, `src/locales/ja.json`, `src/locales/ko.json`, `src/locales/zh.json`)
- [x] T025 Verify accessibility: keyboard navigation through layout switcher Popover, focus management in save/rename Dialog and delete AlertDialog, `aria-label` on icon buttons
- [x] T026 Run full test suite (`bun test`), build (`bun run build`), and lint (`bun run lint`) for final verification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. All 3 tasks are parallel.
- **Foundational (Phase 2)**: Depends on Phase 1 completion. T004 (tests) first, then T005-T009 sequentially, then T010 (verify).
- **US1+US2 (Phase 3)**: Depends on Phase 2 completion. T014 first (context interface), then T011-T013 (UI), then T015 (verify).
- **US3 (Phase 4)**: Depends on Phase 3 completion (needs switcher UI to add delete button).
- **US4 (Phase 5)**: Depends on Phase 3 completion (needs switcher UI to add rename button). Can run in parallel with Phase 4.
- **Polish (Phase 6)**: Depends on all story phases.

### User Story Dependencies

- **US1 + US2 (P1)**: Tightly coupled — save requires switch to demonstrate value. Implemented together as MVP.
- **US3 (P2)**: Independent of US4. Requires the switcher UI from US1+US2.
- **US4 (P3)**: Independent of US3. Requires the switcher UI from US1+US2.

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 — all different files, fully parallel.
- **Phase 4 & 5**: US3 and US4 can run in parallel after Phase 3 completes.
- **Phase 6**: T024 (i18n) can run in parallel with T025 (a11y).

---

## Parallel Example: Phase 1

```bash
# Launch all setup tasks together (different files):
Task: "Add types in src/types/widget.ts"
Task: "Add storage key in src/lib/storage.ts"
Task: "Add i18n keys in src/locales/en.json"
```

## Parallel Example: Phase 4 & 5

```bash
# US3 and US4 can run concurrently after Phase 3:
Task: "US3 — Delete layout (context + UI + AlertDialog)"
Task: "US4 — Rename layout (context + UI + Dialog)"
```

---

## Implementation Strategy

### MVP First (Phase 1 → 2 → 3)

1. Complete Phase 1: Types, storage key, i18n — **3 tasks**
2. Complete Phase 2: Context CRUD + migration + tests — **7 tasks**
3. Complete Phase 3: Save + Switch UI — **5 tasks**
4. **STOP and VALIDATE**: Save a layout, switch between layouts, refresh page
5. Deploy/demo the MVP

### Incremental Delivery

1. Setup + Foundational → Context ready
2. US1+US2 (Save + Switch) → MVP deployed
3. US3 (Delete) → Housekeeping capability
4. US4 (Rename) → Organization capability
5. Polish (i18n, a11y) → Production ready

---

## Notes

- Each user story builds on the DsLayoutSwitcher component — US3 and US4 add buttons/dialogs to it
- The existing `resetToDefault()` method continues to work as-is; it resets the active layout to factory default
- Migration from single to multi happens transparently on first load — no user action required
- Layout collection is ~2-4KB per entry; 10 entries ≈ 40KB — well within localStorage limits
