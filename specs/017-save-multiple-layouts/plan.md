# Implementation Plan: Save Multiple Layouts

**Branch**: `017-save-multiple-layouts` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-save-multiple-layouts/spec.md`

## Summary

Allow users to save, name, switch between, delete, and rename up to 10 dashboard widget layouts. The active layout continues to use the existing `DashboardLayoutContext` state and localStorage key. A new `budget-tool-saved-layouts` key stores the named collection. The UI is a compact Select dropdown in the dashboard section header, with Dialog for save/rename and AlertDialog for delete confirmation.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: react-grid-layout v2.2.2, shadcn/ui (Select, Dialog, AlertDialog), i18next, lucide-react
**Storage**: localStorage (two keys: existing `budget-tool-dashboard-layout` + new `budget-tool-saved-layouts`)
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (desktop + mobile browsers)
**Project Type**: Web application (client-only SPA)
**Performance Goals**: Layout switch < 1s, no page reload
**Constraints**: No backend, all data in localStorage (~5MB limit), max 10 layouts (~40KB total)
**Scale/Scope**: Single user, 14 widgets, 10 saved layouts max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First | PASS | Select dropdown is always visible. Save dialog has validation feedback. Empty state shows "Default" with save prompt. |
| II. Mobile-First Parity | PASS | Layout switcher hidden on mobile (layouts are desktop-grid only). Mobile uses `mobileOrder` which is part of the saved snapshot — switching layouts also updates mobile order. |
| III. Financial Correctness | N/A | No financial calculations involved. |
| IV. Safe Destructive Actions | PASS | Delete uses AlertDialog confirmation. Default layout cannot be deleted. |
| V. Accessibility | PASS | Select uses Radix UI (keyboard-navigable). Dialog/AlertDialog follow ARIA patterns. Focus management built-in. |
| VI. Incremental Refactoring | PASS | Tests written first for context CRUD, then UI integration. Existing tests unmodified. |
| VII. Simplicity | PASS | Extends existing context (no new provider). Uses existing UI components (Select, Dialog, AlertDialog). Two localStorage keys (existing + one new). No abstractions beyond what's needed. |

**Post-Phase 1 re-check**: All gates still pass. No new complexity introduced — one new component (`DsLayoutSwitcher`), types added to existing file, context extended in-place.

## Project Structure

### Documentation (this feature)

```text
specs/017-save-multiple-layouts/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: storage strategy, UI decisions, migration
├── data-model.md        # Phase 1: SavedLayoutEntry, SavedLayoutCollection
├── quickstart.md        # Phase 1: development guide
├── contracts/
│   └── layout-collection.md  # Phase 1: context API contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types/widget.ts                          # Add SavedLayoutEntry, SavedLayoutCollection types
├── lib/storage.ts                           # Add SAVED_LAYOUTS key
├── context/DashboardLayoutContext.tsx        # Extend with collection state + CRUD methods
├── components/ds/DsLayoutSwitcher.tsx        # NEW: layout switcher component
├── pages/dashboard/Dashboard.tsx             # Integrate DsLayoutSwitcher in header
└── locales/en.json (+ 6 locales)            # Add layout management i18n keys

test/
└── context/DashboardLayoutContext.savedLayouts.test.ts  # NEW: collection CRUD tests
```

**Structure Decision**: Existing single-project web app structure. One new component file, one new test file. All other changes are extensions to existing files.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
