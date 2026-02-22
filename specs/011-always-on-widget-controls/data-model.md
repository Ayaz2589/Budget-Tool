# Data Model: Always-On Widget Controls

**Feature**: 011-always-on-widget-controls | **Date**: 2026-02-21

## Overview

This feature has **no data model changes**. The existing `DashboardLayout`, `WidgetLayoutItem`, `WidgetType`, and `WidgetSize` types remain unchanged. Layout persistence (localStorage version 4) is unaffected.

## Entities (unchanged, for reference)

### WidgetLayoutItem
```typescript
interface WidgetLayoutItem {
  id: WidgetType;     // Widget identifier
  x: number;          // Grid column position
  y: number;          // Grid row position
  w: number;          // Grid column span
  h: number;          // Grid row span
  size: WidgetSize;   // Named size preset (sm, wide, md, tall, lg, xl)
  visible: boolean;   // Whether widget is shown on dashboard
}
```

### DashboardLayout
```typescript
interface DashboardLayout {
  version: number;            // Schema version (currently 4)
  desktopGrid: WidgetLayoutItem[];  // Desktop grid positions and sizes
  mobileOrder: WidgetType[];        // Mobile widget display order
}
```

## State Changes

### Removed State

| State | Location | Replacement |
|-------|----------|-------------|
| `isEditing: boolean` | `DashboardLayoutContext` | Removed entirely — no replacement needed |
| `startEditing: () => void` | `DashboardLayoutContext` | Removed — drag is always on, popover replaces toolbar |
| `stopEditing: () => void` | `DashboardLayoutContext` | Removed — no mode to exit |

### New State (component-local)

| State | Location | Purpose |
|-------|----------|---------|
| Popover open/closed | `DsWidgetShell` (via Radix `Popover` internal state) | Managed by Radix — no explicit state needed |
| Long-press active | `useLongPress` hook (internal ref) | Timer ref, not React state — no re-renders during detection |

## Context Interface Change

### Before
```typescript
interface DashboardLayoutContextValue {
  layout: DashboardLayout;
  isEditing: boolean;
  startEditing: () => void;
  stopEditing: () => void;
  updateDesktopGrid: (items: WidgetLayoutItem[]) => void;
  updateMobileOrder: (order: WidgetType[]) => void;
  resizeWidget: (id: WidgetType, size: WidgetSize) => void;
  hideWidget: (id: WidgetType) => void;
  showWidget: (id: WidgetType) => void;
  resetToDefault: () => void;
}
```

### After
```typescript
interface DashboardLayoutContextValue {
  layout: DashboardLayout;
  updateDesktopGrid: (items: WidgetLayoutItem[]) => void;
  updateMobileOrder: (order: WidgetType[]) => void;
  resizeWidget: (id: WidgetType, size: WidgetSize) => void;
  hideWidget: (id: WidgetType) => void;
  showWidget: (id: WidgetType) => void;
  resetToDefault: () => void;
}
```

Three fields removed: `isEditing`, `startEditing`, `stopEditing`.
