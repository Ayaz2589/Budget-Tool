# Quickstart: Always-On Widget Controls

**Feature**: 011-always-on-widget-controls | **Date**: 2026-02-21

## Overview

This guide describes how to verify the always-on widget controls feature after implementation.

## Prerequisites

- `bun install` completed
- `bun dev` running at localhost

## Verification Scenarios

### 1. Desktop: Resize a Widget via Popover

1. Open the dashboard at `/dashboard`
2. Hover over any widget — a drag handle (grip icon, top-left) and overflow button ("...", top-right) should fade in
3. Click the "..." button → a popover opens showing:
   - Widget name and icon
   - Size selector buttons (e.g., S, W, M for a KPI widget)
   - "Hide widget" action
4. Click a different size → widget resizes immediately, popover closes, grid reflows
5. Press Escape or click outside → popover dismisses with no changes

**Expected**: 2 interactions to resize (click "...", select size). No edit mode toggle visible.

### 2. Desktop: Drag a Widget

1. Hover over any widget — the drag handle (grip icon) appears
2. Click and hold the grip icon, drag to a new position
3. Other widgets reflow around the dragged widget
4. Release — the new position persists (check localStorage key `ortho-dashboard-layout`)

**Expected**: 1 interaction to reposition. No edit mode needed.

### 3. Desktop: No Accidental Drag

1. Click on widget content (chart bars, text, buttons) — no drag should initiate
2. Scroll the page — no widget movement

**Expected**: Only the grip handle initiates drag (FR-008).

### 4. Mobile: Long-Press Popover

1. Open dashboard on a mobile viewport (< 768px) or use Chrome DevTools device emulation
2. Long-press (~500ms) on any widget → popover opens with:
   - Move Up / Move Down buttons (top/bottom boundary-disabled)
   - Size selector buttons
   - "Hide widget" action
3. Tap "Move Up" → widget swaps with the one above, popover closes
4. Long-press the topmost widget → "Move Up" is disabled

**Expected**: Long-press is the mobile entry point for all widget controls.

### 5. Mobile: No Scroll Conflict

1. On mobile viewport, scroll the page normally (swipe up/down without long-pressing)
2. No widget movement or popover should trigger

**Expected**: Normal scrolling is unaffected (FR-010).

### 6. Hide and Re-Show a Widget

1. Click "..." on any widget → click "Hide widget"
2. Widget disappears, grid reflows
3. Click "Manage widgets" in the dashboard header
4. The hidden widget appears with an "Add" button
5. Click "Add" → widget reappears

**Expected**: Hide/show cycle works without edit mode.

### 7. No Edit Mode Artifacts

1. Verify the dashboard header has NO "Edit layout" or "Done" button
2. Verify NO widgets have ring highlights, extra padding, or visual edit indicators
3. Verify "Manage widgets" and "Reset layout" are accessible from the header

**Expected**: Clean, mode-free dashboard appearance (FR-012 through FR-015).

### 8. Layout Persistence

1. Resize a widget, drag another to a new position, hide a third
2. Refresh the page
3. All changes persist (layout loaded from localStorage)

**Expected**: Layout version stays at 4, no migration needed (SC-007).

## Key Files to Inspect

| File | What Changed |
|------|-------------|
| `src/context/DashboardLayoutContext.tsx` | `isEditing`, `startEditing`, `stopEditing` removed |
| `src/components/ds/DsWidgetShell.tsx` | Edit toolbar replaced with hover controls + popover |
| `src/pages/dashboard/DashboardGrid.tsx` | `isDraggable={true}` always, height bump removed |
| `src/pages/dashboard/DashboardMobileGrid.tsx` | `isEditing` removed, long-press handler added |
| `src/pages/dashboard/Dashboard.tsx` | Edit/Done buttons removed, Manage/Reset always visible |
| `src/hooks/useLongPress.ts` | New: long-press detection hook |
| `src/locales/*.json` | Edit-mode keys removed |

## Build Verification

```bash
bun run build    # TypeScript strict + Vite build (should be clean)
bun test         # All tests pass
```
