# Research: Widget-Based Dashboard

**Feature Branch**: `001-widget-dashboard`
**Date**: 2026-02-17

## Decision 1: Grid Layout Library

**Decision**: Use `react-grid-layout` v2

**Rationale**:
- All required features out of the box: drag-and-drop, resize, responsive breakpoints, layout serialization to JSON
- v2 (Dec 2025) is a complete TypeScript rewrite — native types, no `@types/` needed
- React 19 compatible (peerDeps `>= 16.3.0`, v2 dev deps use `@types/react ^19.2.14`)
- 22k+ GitHub stars, 1.6M weekly downloads, actively maintained
- Layout persistence via `onLayoutChange` callback is a first-class documented pattern with official examples
- Preset sizes map directly to grid units: `w`/`h` integer values (e.g., small=`{w:4,h:3}`, regular=`{w:6,h:4}`, large=`{w:12,h:6}`)
- Built-in responsive breakpoints including single-column via `cols: { xxs: 1 }`

**Alternatives considered**:
- `@dnd-kit/core` — excellent drag-and-drop but does NOT provide grid layout or resize. Building a full grid engine on top would require custom collision detection, cell snapping, resize handles, and compaction — violates Constitution Principle VII (Simplicity). Also has React 19 TypeScript JSX type incompatibility requiring `skipLibCheck`.
- Custom CSS Grid + native drag events — zero dependencies but extremely high engineering effort. Violates Simplicity principle.
- `react-mosaic` — tiling window manager paradigm (binary tree splits), not a fixed-column grid. Wrong model for preset-sized widgets.

**Known risk**: Mobile touch drag via `react-draggable` transitive dependency has documented iOS issues. Mitigation: disable drag-and-drop on mobile viewports; use static single-column layout with a simpler reorder UI (move-up/move-down buttons or a sortable list dialog).

## Decision 2: Layout Persistence Strategy

**Decision**: New `localStorage` key via existing `StorageAdapter` pattern

**Rationale**:
- The app already uses `storage.getItem` / `storage.setItem` through `src/lib/storage.ts` with centralized `STORAGE_KEYS`
- Pattern: `useState(() => loadFromStorage())` initializer + `useEffect` to persist on change
- Layout data is a small JSON object (~2-3 KB for 14 widgets with positions/sizes)
- Separate keys for desktop layout and mobile order

**Alternatives considered**:
- Embedding in the main `budget-tool-data` blob — rejected because layout is UI preference, not financial data. Should not pollute the data export/import pipeline.
- `sessionStorage` — rejected because layout must persist across sessions.

## Decision 3: Edit Mode Pattern

**Decision**: Explicit edit mode toggle (iOS home screen pattern)

**Rationale**:
- Prevents accidental widget rearrangement during normal dashboard use
- Clear visual state change (drag handles, jiggle animation, overlay) signals editability
- `framer-motion` is already installed for animations — can power edit mode visual feedback
- Aligns with Constitution Principle IV (Safe Destructive Actions) — layout changes are intentional

**Alternatives considered**:
- Always-editable grid — rejected because accidental drags during scroll would frustrate users
- Long-press to enter edit — rejected because it's not discoverable and conflicts with mobile scroll

## Decision 4: Mobile Widget Customization

**Decision**: Move-up/move-down buttons in edit mode (no drag-and-drop on mobile)

**Rationale**:
- `react-grid-layout`'s touch drag has documented iOS issues (drag works once then freezes, scroll/drag conflict)
- Move buttons are 100% reliable, accessible, and require no touch gesture disambiguation
- Mobile layout stores only a simple ordered array of widget IDs — much simpler than a full grid layout
- Desktop grid and mobile order are stored independently (FR-013)

**Alternatives considered**:
- Touch drag-and-drop on mobile — rejected due to `react-draggable` iOS bugs and scroll conflict
- Sortable list modal (reorder in a separate dialog) — viable but adds unnecessary UI indirection when move buttons suffice

## Decision 5: Widget Size Mapping

**Decision**: Three preset sizes mapped to grid column/row spans on a 12-column grid

**Rationale**:
- 12-column grid is the standard for responsive layouts (matches Tailwind's grid system)
- Small: 4 columns wide (fits 3 per row) — condensed view
- Regular: 6 columns wide (fits 2 per row) — standard view
- Large: 12 columns wide (full row) — detailed/expanded view
- Height varies by widget type (KPIs shorter than charts)
- `react-grid-layout` uses integer `w`/`h` units natively — no custom logic needed

## Decision 6: Widget Architecture

**Decision**: Widget registry pattern with a render map keyed by widget type ID

**Rationale**:
- Each widget type is registered with: ID, default size, min/max constraints, and a render function
- The render function receives dashboard data props and current size, returns the appropriate view
- Existing components (`DashboardKpiCards`, `DashboardCashFlowChart`, etc.) are wrapped — not rewritten
- New `WidgetShell` wrapper component provides the drag handle, size indicator, and hide button in edit mode
- Aligns with Constitution Principle VI (Incremental Refactoring) — existing components stay intact

## Decision 7: State Management for Layout

**Decision**: New `DashboardLayoutContext` composed into the existing context tree

**Rationale**:
- Follows the app's established pattern: domain-specific contexts composed by `BudgetContext`
- Owns: layout state (positions, sizes, visibility), edit mode toggle, reset action
- Does NOT own: dashboard data (stays in `useDashboardData`) or filters (stays in component state)
- Aligns with Constitution Principle VII (Simplicity) — React Context, no external state library
