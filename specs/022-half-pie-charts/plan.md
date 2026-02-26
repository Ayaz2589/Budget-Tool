# Implementation Plan: Half-Pie Charts with Gaps & Rounded Corners

**Branch**: `022-half-pie-charts` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-half-pie-charts/spec.md`

## Summary

Convert the 2 dashboard pie charts (Category Chart, Owner Split Chart) from full-circle pies to half-pie (semicircle) charts with rounded segment corners and gaps between segments. This is a purely visual/presentational change — no data model, context, or business logic changes. Uses existing recharts v2.15.4 props: `startAngle={180}`, `endAngle={0}`, `cornerRadius={6}`, `paddingAngle={4}`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19
**Primary Dependencies**: recharts v2.15.4 (already installed, no upgrade needed)
**Storage**: N/A (no data changes)
**Testing**: Bun test runner + React Testing Library + happy-dom
**Target Platform**: Web (Vite 7, deployed on Vercel)
**Project Type**: Web application (single SPA)
**Performance Goals**: No performance impact — same recharts rendering, fewer pixels drawn
**Constraints**: Must preserve existing tooltip, legend, color, and responsive behavior
**Scale/Scope**: 3 files modified, ~20 lines changed total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. UX-First Development | PASS | Visual improvement reduces whitespace, maintains all interactive features (tooltips, legends) |
| II. Mobile-First Parity | PASS | sm size (text-only) unchanged; md/lg sizes both updated; half-pie is more compact for mobile |
| III. Financial Correctness | PASS | No financial calculations touched — purely presentational |
| IV. Safe Destructive Actions | N/A | No destructive operations |
| V. Accessibility | PASS | No accessibility regressions — chart structure and interactions unchanged |
| VI. Incremental Refactoring | PASS | Small, focused change to 3 files; existing tests unaffected |
| VII. Simplicity | PASS | Uses built-in recharts props — no custom renderers, wrappers, or abstractions |

**Post-Phase 1 Re-check**: All gates still pass. No new files created, no new abstractions introduced.

## Project Structure

### Documentation (this feature)

```text
specs/022-half-pie-charts/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: recharts API research
├── quickstart.md        # Phase 1: implementation guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (files modified)

```text
src/
├── pages/
│   └── dashboard/
│       └── widgets/
│           ├── CategoryChart.tsx       # Add half-pie props to 2 <Pie> instances
│           └── OwnerSplitChart.tsx     # Add half-pie props to 1 <Pie> instance
└── lib/
    └── widgets/
        └── widgetRegistry.tsx          # Reduce lg height for pie chart widgets
```

**Structure Decision**: Existing web application structure. No new files or directories — all changes are in-place modifications to 3 existing files.

## Design Decisions

### D1: Half-Pie Angle Configuration

**Props**: `startAngle={180} endAngle={0} cx="50%" cy="80%"`

This produces a top-facing semicircle (flat bottom). The `cy="80%"` pushes the center point down so the arc fills the upper portion of the container without dead whitespace below.

### D2: Rounded Corners

**Prop**: `cornerRadius={6}`

A 6px corner radius provides visibly rounded end caps at both outerRadius values (60px for md, 80px for lg) without overwhelming small segments. Combined with `minAngle={5}` to ensure small segments have enough angular width.

### D3: Segment Gaps

**Prop**: `paddingAngle={4}`

A 4-degree gap between segments creates visible separation. For a 180-degree arc with 5 typical segments, this uses ~16° (9% of budget) — noticeable but balanced.

### D4: Container Height Reduction

Since a half-pie occupies roughly half the vertical space of a full pie, container heights are reduced:
- **lg**: `heightDesktop` from 220→140px, `heightMobile` from 200→140px
- **md**: `heightDesktop` and `heightMobile` remain at 140px (already compact)

Widget registry lg height reduced from `h: 8` to `h: 6` grid rows for both `category-chart` and `owner-split-chart`.

### D5: Zero-Value Segment Filtering

Data passed to `<Pie>` must be filtered to exclude zero-value entries before rendering to prevent sector overlap caused by `paddingAngle` on zero-width segments. Both components already receive pre-filtered data from dashboard selectors, but a defensive filter should be added.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                   |
