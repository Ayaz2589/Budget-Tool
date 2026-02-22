# Tasks: Unified Action Bar

**Input**: Design documents from `/specs/014-unified-action-bar/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story. US1 is the MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Foundational

**Purpose**: Update the shared DsActionBar component to support desktop visibility

- [x] T001 Add `mobileOnly` prop (default `true`) to DsActionBar with responsive bottom positioning (`md:bottom-4` when `mobileOnly={false}`) in src/components/ds/DsActionBar.tsx

**Checkpoint**: DsActionBar component now supports both mobile-only and always-visible modes without breaking existing usage on other pages

---

## Phase 2: User Story 1 — Unified Floating Action Bar on Desktop Dashboard (Priority: P1)

**Goal**: Replace the 5 desktop header action buttons with the floating action bar for the 3 primary actions (Settings, Add Income, Add Expense)

**Independent Test**: View the dashboard on a desktop viewport — floating action bar appears at bottom-right with 3 buttons; header no longer has Add Expense, Add Income, or Settings buttons

### Implementation for User Story 1

- [x] T002 [US1] Remove the `isMobile` conditional around DsActionBar and render it unconditionally with `mobileOnly={false}` in src/pages/dashboard/Dashboard.tsx
- [x] T003 [US1] Remove Add Expense, Add Income, Settings, and Reset Layout buttons from DsSectionHeader `actions` prop — keep only Manage Widgets as an icon-only button in src/pages/dashboard/Dashboard.tsx

**Checkpoint**: Desktop dashboard shows floating action bar with 3 primary actions; header shows only title + Manage Widgets icon button

---

## Phase 3: User Story 2 — Retain Widget Management Access (Priority: P2)

**Goal**: Ensure Manage Widgets and Reset Layout remain accessible after header cleanup

**Independent Test**: Open widget catalog from header icon button; verify Reset Layout button appears in catalog sheet footer with confirmation dialog

### Implementation for User Story 2

- [x] T004 [US2] Add `onReset` optional callback prop to DsWidgetCatalog and render a Reset Layout button in the SheetFooter when provided in src/components/ds/DsWidgetCatalog.tsx
- [x] T005 [US2] Pass `onResetRequest={() => setResetDialogOpen(true)}` from Dashboard to DsWidgetCatalog as the `onReset` prop in src/pages/dashboard/Dashboard.tsx

**Checkpoint**: Manage Widgets accessible via header icon; Reset Layout accessible inside widget catalog sheet with confirmation dialog

---

## Phase 4: Polish & Validation

**Purpose**: Verify build, tests, and lint pass

- [x] T006 Run `bun run build` to verify TypeScript compilation and production build
- [x] T007 Run `bun test` to verify no test regressions
- [x] T008 Run `bun run lint` to verify no lint errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on T001 (DsActionBar prop)
- **US2 (Phase 3)**: T004 is independent of US1; T005 depends on T003 (same file)
- **Polish (Phase 4)**: Depends on all implementation phases complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational (T001). No dependency on US2.
- **US2 (P2)**: T004 can run in parallel with US1 (different file). T005 must follow T003 (same file).

### Parallel Opportunities

- T002 and T004 can run in parallel (different files: Dashboard.tsx vs DsWidgetCatalog.tsx)
- T006, T007, T008 can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001: DsActionBar `mobileOnly` prop
2. Complete T002-T003: Dashboard header cleanup + unconditional action bar
3. **VALIDATE**: Desktop shows floating action bar; mobile unchanged

### Full Delivery

4. Complete T004-T005: Reset Layout in widget catalog
5. Complete T006-T008: Build, test, lint validation
