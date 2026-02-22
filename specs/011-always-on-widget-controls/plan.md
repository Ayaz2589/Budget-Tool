# Implementation Plan: Always-On Widget Controls

**Branch**: `011-always-on-widget-controls` | **Date**: 2026-02-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-always-on-widget-controls/spec.md`

## Summary

Remove the global dashboard edit mode toggle and replace with always-available contextual widget controls. Drag-and-drop becomes always-on via the existing drag handle. Resize and hide move into a Radix Popover triggered by an overflow ("...") button. Mobile reordering uses a long-press popover with move-up/move-down, resize, and hide. The `isEditing` state, `startEditing`/`stopEditing` callbacks, and all edit-mode visual artifacts (ring highlights, extra padding, +1h height bump) are removed entirely.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: react-grid-layout v2.2.2, @radix-ui/react-popover (already installed via shadcn/ui), framer-motion, lucide-react, i18next
**Storage**: localStorage (dashboard layout persisted as JSON, version 4)
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (desktop + mobile browsers)
**Project Type**: Web (single SPA)
**Performance Goals**: Instant resize/drag response (<100ms perceived); no layout jank during drag
**Constraints**: No backend, no new runtime dependencies; mobile must not conflict with page scrolling
**Scale/Scope**: 14 widgets, 1 dashboard page, ~8 files modified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First Development | PASS | Feature is entirely UX-driven — reducing friction from 4 clicks to 2 for resize, 2 to 1 for drag. Popover provides progressive disclosure. |
| II. Mobile-First Parity | PASS | Mobile gets long-press popover with move-up/down, resize, hide — full parity with desktop. No direct drag on mobile (prevents scroll conflict). |
| III. Financial Correctness | N/A | No financial calculations affected. |
| IV. Safe Destructive Actions | PASS | "Hide" is reversible via Manage Widgets catalog. No permanent delete actions. |
| V. Accessibility | PASS | Popover trigger gets aria-label, size buttons get aria-pressed, keyboard-accessible (Escape to dismiss). Drag handle maintains existing keyboard support. |
| VI. Incremental Refactoring | PASS | Changes are file-by-file; build/test after each step. No big-bang rewrite. |
| VII. Simplicity | PASS | Removes complexity (isEditing state, conditional rendering). Uses existing shadcn/ui Popover — no new abstractions. |

**Gate result**: PASS — all principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/011-always-on-widget-controls/
├── plan.md              # This file
├── research.md          # Phase 0: technical research
├── data-model.md        # Phase 1: data model changes
├── quickstart.md        # Phase 1: integration guide
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ds/
│   │   ├── DsWidgetShell.tsx        # MODIFY: Replace edit toolbar with popover + always-on drag handle
│   │   └── DsWidgetCard.tsx         # NO CHANGE
│   └── ui/
│       └── popover.tsx              # NO CHANGE (already exists)
├── context/
│   └── DashboardLayoutContext.tsx    # MODIFY: Remove isEditing, startEditing, stopEditing
├── pages/
│   └── dashboard/
│       ├── Dashboard.tsx            # MODIFY: Remove edit mode toggle buttons, editing hint banner
│       ├── DashboardGrid.tsx        # MODIFY: isDraggable={true} always, remove isEditing height bump
│       └── DashboardMobileGrid.tsx  # MODIFY: Remove isEditing prop, add long-press handler
├── hooks/
│   └── useLongPress.ts             # NEW: Long-press detection hook for mobile
├── locales/
│   ├── en.json                     # MODIFY: Remove edit-mode keys, add popover keys
│   ├── es.json                     # MODIFY: Same
│   ├── hi.json                     # MODIFY: Same
│   ├── bn.json                     # MODIFY: Same
│   ├── ja.json                     # MODIFY: Same
│   ├── ko.json                     # MODIFY: Same
│   └── zh.json                     # MODIFY: Same
└── types/
    └── widget.ts                   # NO CHANGE

test/
└── hooks/
    └── useLongPress.test.ts        # NEW: Tests for long-press hook
```

**Structure Decision**: Single web project. All changes are within the existing `src/` structure. One new file (`useLongPress.ts` hook) is genuinely required — no existing hook handles long-press with cancellation. One new test file for the hook.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
