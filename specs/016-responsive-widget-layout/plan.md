# Implementation Plan: Responsive Widget Layout

**Branch**: `016-responsive-widget-layout` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-responsive-widget-layout/spec.md`

## Summary

Fix broken/overlapping dashboard widgets at tablet viewports (768px-1200px) by computing derived `md` and `sm` breakpoint layouts from the user's `lg` layout at render time. The `lg` layout remains the single source of truth — derived layouts are ephemeral and never persisted.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: react-grid-layout v2.2.2 (`Responsive` + `WidthProvider`), Tailwind CSS v4, shadcn/ui
**Storage**: localStorage (no changes — existing `DashboardLayout` schema v6)
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (desktop + tablet browsers, 768px+)
**Project Type**: Web (single-page React app)
**Performance Goals**: Instant layout reflow on resize (derived in useMemo, no async work)
**Constraints**: No new persisted data. No new dependencies. Must not break existing tests.
**Scale/Scope**: 1 file modified (`DashboardGrid.tsx`), 1 new test file, ~40 lines of code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First Development | PASS | Directly improves UX by eliminating broken layouts on tablets |
| II. Mobile-First Parity | PASS | Respects existing mobile/desktop split at 768px. Improves tablet range. |
| III. Financial Correctness | N/A | No financial calculations affected |
| IV. Safe Destructive Actions | N/A | No destructive actions added |
| V. Accessibility | PASS | No accessibility changes — widgets remain accessible at all breakpoints |
| VI. Incremental Refactoring | PASS | Single file change, test-first approach, no large rewrites |
| VII. Simplicity | PASS | Pure function + memo. No new state, no new abstractions, no new dependencies |

**Post-Phase 1 re-check**: All gates still pass. The design adds a single pure helper function and modifies one callback — minimal complexity increase.

## Project Structure

### Documentation (this feature)

```text
specs/016-responsive-widget-layout/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity documentation
├── quickstart.md        # Phase 1: implementation guide
├── contracts/           # Phase 1: function contracts
│   ├── derive-layout.md
│   └── layout-change-handler.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── pages/
│   └── dashboard/
│       └── DashboardGrid.tsx    # MODIFIED: add deriveSmLayout, update rglLayouts, update handleLayoutChange

test/
└── pages/
    └── dashboard/
        └── deriveSmLayout.test.ts  # NEW: unit tests for layout derivation
```

**Structure Decision**: This feature modifies a single existing component file and adds one test file. No new directories, modules, or abstractions needed.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
