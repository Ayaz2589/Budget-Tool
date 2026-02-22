# Research: Always-On Widget Controls

**Feature**: 011-always-on-widget-controls | **Date**: 2026-02-21

## R1: Popover Component Choice

**Decision**: Use existing shadcn/ui `Popover` (`@radix-ui/react-popover`), already installed at `src/components/ui/popover.tsx`.

**Rationale**: The Popover component is already in the project, provides built-in Escape-to-dismiss, outside-click-to-dismiss, focus trapping, and animation support. It renders in a portal so it won't be clipped by `overflow: hidden` on widget cards.

**Alternatives considered**:
- `DropdownMenu` — Not installed. Would need `npx shadcn add dropdown-menu`. Provides similar UX but is semantically for menu actions, not mixed content (size selector buttons + actions). Popover is more flexible.
- Custom popover — Unnecessary; Radix Popover covers all requirements.

## R2: Always-On Drag in react-grid-layout

**Decision**: Set `isDraggable={true}` unconditionally on `ResponsiveGridLayout`. Keep `draggableHandle=".react-grid-dragHandleExample"` to restrict drag initiation to the handle only.

**Rationale**: react-grid-layout already supports `draggableHandle` which prevents accidental drags on widget content. The existing `GripVertical` icon with class `react-grid-dragHandleExample` is already the designated handle — it just needs to be rendered outside of the `isEditing` guard.

**Alternatives considered**:
- Making the entire widget draggable — Rejected. FR-008 requires that dragging by widget content must NOT initiate drag. The handle constraint is essential.
- Adding a separate drag library — Rejected. react-grid-layout's built-in drag support is sufficient.

**Key finding**: The current `DashboardGrid.tsx:34` adds `+1h` to sm widgets when editing (`isEditing && item.size === "sm" ? item.h + 1 : item.h`). This was to make room for the edit toolbar. With the toolbar removed, this height bump is no longer needed and should be removed.

## R3: Long-Press Detection on Mobile

**Decision**: Create a custom `useLongPress` hook in `src/hooks/useLongPress.ts`.

**Rationale**: No existing hook in the project handles long-press. The hook needs to:
1. Start a timer on `touchstart` (~500ms threshold)
2. Cancel if finger moves beyond a small threshold (e.g., 10px) before timer fires — prevents conflict with scrolling (FR-010, edge case)
3. Cancel on `touchend` before timer fires
4. Call the callback and optionally trigger `navigator.vibrate(50)` (Constitution II, haptic feedback SHOULD)
5. Clean up on unmount

**Alternatives considered**:
- `use-long-press` npm package — Rejected (Principle VII: no new dependencies for simple operations). The hook is ~30 lines.
- Inline `setTimeout` in component — Rejected. Multiple widgets need the same behavior; a shared hook avoids duplication.

**Implementation notes**:
- Movement threshold: 10px (standard mobile threshold)
- Timer: 500ms (spec requirement, platform convention)
- Haptic: `navigator.vibrate?.(50)` — optional, progressive enhancement

## R4: Drag Handle Visibility (Desktop)

**Decision**: Show drag handle on hover via CSS (`opacity-0 group-hover:opacity-100 transition-opacity`). Always present in DOM for accessibility.

**Rationale**: FR-007 requires the handle to appear on hover and be positioned so it doesn't overlap widget content. Using CSS opacity keeps the handle in the DOM (keyboard-accessible) while hiding it visually until hover. The handle will be positioned in the top-left area of the widget card, outside of the content zone.

**Alternatives considered**:
- Conditional rendering (`{isHovered && <GripVertical />}`) — Rejected. Removes handle from DOM, breaking keyboard accessibility and potentially causing layout shift.
- Always visible — Rejected. Too noisy for a dashboard with 14 widgets.

## R5: Popover Trigger Placement

**Decision**: Overflow "..." button positioned in the top-right corner of the widget, visible on hover (desktop) and always visible (mobile).

**Rationale**: FR-001/FR-002 require an overflow button that appears on hover (desktop) and always on mobile. Top-right is the conventional position for overflow menus. The button uses the existing `MoreHorizontal` Lucide icon.

**Key design**:
- Desktop: `opacity-0 group-hover:opacity-100` (same treatment as drag handle)
- Mobile: `opacity-100` (always visible)
- The drag handle (top-left) and overflow button (top-right) form a symmetric pair that appears on hover
- Both are positioned absolutely within the widget card to avoid consuming content space

## R6: Edit Mode Removal Scope

**Decision**: Remove the following items in order:

1. **DashboardLayoutContext.tsx**: Remove `isEditing` state, `startEditing`, `stopEditing` from context value and provider
2. **Dashboard.tsx**: Remove the `isEditing` conditional rendering in the header actions (Edit/Done buttons), the editing hint banner, and the `startEditing`/`stopEditing` imports. Keep "Manage widgets" and "Reset layout" buttons always accessible.
3. **DashboardGrid.tsx**: Remove `isEditing` from `useDashboardLayout()` destructuring, set `isDraggable={true}`, remove `isEditing && item.size === "sm" ? item.h + 1 : item.h` height bump, remove edit-mode padding
4. **DashboardMobileGrid.tsx**: Remove `isEditing` from `useDashboardLayout()` destructuring and from `DsWidgetShell` props
5. **DsWidgetShell.tsx**: Remove `isEditing` prop entirely, remove the `AnimatePresence` edit toolbar, add always-on drag handle + overflow popover
6. **i18n**: Remove `widget.editLayout`, `widget.doneEditing`, `widget.editingHint` from all 7 locale files

**Alternatives considered**:
- Keeping `isEditing` as a deprecated no-op — Rejected (Principle VII: no backwards-compatibility shims for unused code).

## R7: Mobile Popover Content

**Decision**: Mobile long-press popover contains: Move Up, Move Down (with boundary disabling), size selector (same S/W/M/T/L/XL buttons), and Hide — all in a single popover.

**Rationale**: FR-009 specifies this exact content. The popover replaces both the inline move buttons and the edit-mode toolbar that previously appeared on mobile during editing.

**Implementation**: The popover will use `Popover` with `PopoverContent` positioned via Radix's auto-placement. On mobile, `side="top"` or `side="bottom"` will be auto-chosen. The popover trigger is a transparent overlay on the widget that activates on long-press.

## R8: Existing Layout Persistence Compatibility

**Decision**: No localStorage migration needed. The layout version stays at 4. No schema changes to `WidgetLayoutItem` or `DashboardLayout`.

**Rationale**: This feature only changes UI behavior (how controls are presented), not data structure. Existing persisted layouts continue to work unchanged (SC-007).
