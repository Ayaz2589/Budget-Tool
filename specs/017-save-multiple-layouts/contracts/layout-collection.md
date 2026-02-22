# Contract: Layout Collection Context API

This feature extends the existing `DashboardLayoutContext` with layout collection management. No REST API — all operations are local context methods.

## Context Interface Extension

```typescript
// New types (src/types/widget.ts)
interface SavedLayoutEntry {
  id: string;
  name: string;
  layout: DashboardLayout;
  createdAt: number;
}

interface SavedLayoutCollection {
  activeId: string;
  layouts: SavedLayoutEntry[];
}

// Extended context value (src/context/DashboardLayoutContext.tsx)
interface DashboardLayoutContextValue {
  // ... existing methods unchanged ...

  // New: layout collection
  savedLayouts: SavedLayoutEntry[];
  activeLayoutId: string;
  activeLayoutName: string;
  saveLayout: (name: string) => SaveLayoutResult;
  switchLayout: (id: string) => void;
  deleteLayout: (id: string) => void;
  renameLayout: (id: string, newName: string) => RenameResult;
}
```

## Operations

### saveLayout(name: string) → SaveLayoutResult

```typescript
type SaveLayoutResult =
  | { ok: true }
  | { ok: false; reason: "empty_name" | "name_too_long" | "limit_reached" | "storage_error" };
```

**Preconditions**: Name is trimmed, 1-30 chars, collection has < 10 entries.
**Postconditions**: New entry appended to collection with current layout snapshot. `activeId` set to new entry. Persisted to localStorage.
**Duplicate name handling**: Caller checks for duplicates and decides whether to overwrite (by deleting existing + re-saving) or abort.

### switchLayout(id: string) → void

**Preconditions**: `id` exists in collection.
**Postconditions**: `activeId` updated. Working layout replaced with snapshot from selected entry. UI re-renders with new layout.
**Side effects**: Current working layout is NOT auto-saved back to the previous entry. The active layout's live edits (drag, resize, hide) are persisted to the collection entry in real time.

### deleteLayout(id: string) → void

**Preconditions**: `id !== "default"`. Caller must show confirmation dialog before calling.
**Postconditions**: Entry removed. If `activeId === id`, falls back to `"default"`. Persisted.

### renameLayout(id: string, newName: string) → RenameResult

```typescript
type RenameResult =
  | { ok: true }
  | { ok: false; reason: "empty_name" | "name_too_long" | "duplicate_name" };
```

**Preconditions**: `id !== "default"`. New name is trimmed, 1-30 chars, unique.
**Postconditions**: Entry's name updated. Persisted.

## Persistence Contract

| Key | Format | Read | Write |
|-----|--------|------|-------|
| `budget-tool-saved-layouts` | JSON `SavedLayoutCollection` | On provider mount | On every collection mutation |
| `budget-tool-dashboard-layout` | JSON `DashboardLayout` | On provider mount (existing) | On every layout edit (existing) |

**Migration**: If `budget-tool-saved-layouts` is absent on mount:
1. Read existing layout from `budget-tool-dashboard-layout`
2. Create collection: `{ activeId: <uuid>, layouts: [default, migrated] }`
3. Write to `budget-tool-saved-layouts`

## Sync with Active Layout

When the active layout changes via existing operations (drag, resize, hide/show), the corresponding `SavedLayoutEntry.layout` in the collection must also be updated. This ensures switching away and back restores the latest state.

Implementation: The `useEffect` that persists to `budget-tool-dashboard-layout` also updates the active entry in the collection.
