# Feature Specification: Centralize Widget Library

**Feature Branch**: `019-centralize-widget-lib`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Move all widget-related logic to libs under widgets. Centralize this logic."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consolidate Widget Utility Files (Priority: P1)

A developer working on widget functionality currently navigates between multiple separate files scattered across `src/lib/` and `src/types/` to find widget-related logic. After this change, all widget utility files (registry, factory, default layout, type definitions) live under a single `src/lib/widgets/` directory. Imports throughout the codebase are updated to reflect the new paths.

**Why this priority**: This is the core value — organizing widget logic into one discoverable location reduces cognitive overhead and makes the widget subsystem easier to maintain and extend.

**Independent Test**: Can be fully tested by verifying all existing tests pass after the file moves and import updates, confirming zero behavioral regressions.

**Acceptance Scenarios**:

1. **Given** the widget-related files exist in scattered locations, **When** the migration is complete, **Then** all widget utility files reside under `src/lib/widgets/` and all imports across the codebase resolve correctly.
2. **Given** the migration is complete, **When** the full test suite runs, **Then** all existing tests pass without modification to test assertions (only import paths change).
3. **Given** the migration is complete, **When** a developer searches for widget logic, **Then** all widget utilities are discoverable under a single directory.

---

### User Story 2 - Provide a Barrel Export (Priority: P2)

A developer importing widget utilities currently needs to know the exact file each export lives in. After this change, a barrel `index.ts` file re-exports all public symbols from `src/lib/widgets/`, allowing a single import path for common widget utilities.

**Why this priority**: Simplifies import statements and provides a single entry point, but is an ergonomic improvement on top of the core reorganization.

**Independent Test**: Can be fully tested by verifying that imports via the barrel path resolve correctly and that the build succeeds.

**Acceptance Scenarios**:

1. **Given** the barrel file exists, **When** a developer imports widget utilities from the barrel path, **Then** all public symbols (registry, factory, default layout, types) are accessible.
2. **Given** the barrel file exists, **When** the build runs, **Then** no circular dependency or resolution errors occur.

---

### Edge Cases

- What happens when existing import paths reference the old locations? All imports across the codebase must be updated; stale imports will cause build failures caught by the build step.
- What happens when tests import from old paths? Test files must also have their imports updated to the new paths.
- What happens with path aliases? The existing `@/` alias continues to work — only the path segments after `@/` change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All widget utility files MUST be relocated under a single `src/lib/widgets/` directory.
- **FR-002**: The following files MUST be moved:
  - Widget registry (currently `src/lib/widgetRegistry.tsx`)
  - Widget factory (currently `src/lib/createWidget.tsx`)
  - Default layout (currently `src/lib/defaultLayout.ts`)
  - Widget types (currently `src/types/widget.ts`)
- **FR-003**: All import statements across the codebase (source files and test files) MUST be updated to reflect the new file locations.
- **FR-004**: A barrel export file MUST be created that re-exports all public symbols from the widget module files.
- **FR-005**: The move MUST be a pure reorganization — no logic changes, no API changes, no behavioral changes.
- **FR-006**: The existing `@/` path alias MUST continue to work with the new directory structure.
- **FR-007**: No changes to the `WidgetRegistryEntry` interface, `DsWidgetShell`, `DsWidgetCard`, `DashboardGrid`, or any rendering pipeline — this is purely a file organization change.

### Key Entities

- **Widget Registry**: The record mapping widget types to their metadata and render functions. Currently in `widgetRegistry.tsx`.
- **Widget Factory**: The `createWidget` function and `CreateWidgetOptions` interface. Currently in `createWidget.tsx`.
- **Default Layout**: The default grid positions and mobile ordering for widgets. Currently in `defaultLayout.ts`.
- **Widget Types**: Type definitions (`WidgetType`, `WidgetSize`, `SizeDims`, `WidgetRegistryEntry`, `WidgetLayoutItem`, `DashboardLayout`). Currently in `widget.ts`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All widget utility files are located under a single directory, reducing the number of locations a developer must search from 3+ directories to 1.
- **SC-002**: All existing tests pass without changes to test assertions — only import paths are updated.
- **SC-003**: The build succeeds with zero errors after the migration.
- **SC-004**: No runtime behavioral changes — the application functions identically before and after the migration.

## Assumptions

- The `src/lib/widgets/` directory does not currently exist and will be created as part of this feature.
- The `@/` path alias maps to `src/` and does not require reconfiguration.
- Widget component files (e.g., `src/pages/dashboard/widgets/*.tsx`) are NOT part of this move — only the shared utility/lib files are relocated.
- Design system widget components (`DsWidgetShell`, `DsWidgetCard`, `DsWidgetCatalog`) remain in `src/components/ds/` and are not moved.
- The `storage.ts` file is a general-purpose utility and is not widget-specific enough to move.
