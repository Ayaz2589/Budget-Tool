# Data Model: Save Multiple Layouts

## Entities

### SavedLayoutEntry

A named snapshot of a dashboard layout.

| Field       | Type              | Constraints                                       |
|-------------|-------------------|---------------------------------------------------|
| id          | string            | UUID via `crypto.randomUUID()`, or `"default"`    |
| name        | string            | 1-30 characters, unique within collection         |
| layout      | DashboardLayout   | Full v7 snapshot (desktopGrid + mobileOrder)      |
| createdAt   | number            | Unix timestamp (ms) via `Date.now()`              |

**Validation rules**:
- `name` must be non-empty, trimmed, max 30 characters
- `name` must be unique (case-insensitive) across all entries in the collection
- `id: "default"` is reserved — the default entry always uses the factory `DEFAULT_LAYOUT`
- `layout` must pass the existing `validateLayout()` migration chain on load

### SavedLayoutCollection

The persisted collection of all saved layouts.

| Field       | Type                  | Constraints                                 |
|-------------|-----------------------|---------------------------------------------|
| activeId    | string                | Must reference an existing entry's `id`     |
| layouts     | SavedLayoutEntry[]    | 1-10 entries, always includes `"default"`   |

**Validation rules**:
- `layouts` must always contain exactly one entry with `id: "default"`
- `activeId` must match an existing entry; if not found, falls back to `"default"`
- Array is ordered by `createdAt` ascending (default first)
- Maximum 10 entries (including default)

## State Transitions

```
[No saved-layouts key in localStorage]
  ↓ (first load)
  Migrate: wrap existing single layout as "My Layout" + factory default
  ↓
[Collection with default + migrated layout]

[User saves layout]
  ↓
  Validate name (non-empty, unique, ≤30 chars)
  → Success: append new SavedLayoutEntry, persist
  → Name exists: prompt overwrite or save-as-new
  → At limit (10): show error, block save

[User switches layout]
  ↓
  Set activeId to target layout's id
  Replace working layout in DashboardLayoutContext with snapshot copy
  Persist collection

[User deletes layout]
  ↓
  Confirm via AlertDialog
  → If activeId === deleted id: set activeId to "default"
  Remove entry from layouts array
  Persist collection

[User renames layout]
  ↓
  Validate new name (non-empty, unique, ≤30 chars)
  Update entry's name field
  Persist collection
```

## Storage Schema

**Key**: `budget-tool-saved-layouts`

```json
{
  "activeId": "abc-123-uuid",
  "layouts": [
    {
      "id": "default",
      "name": "Default",
      "layout": { "version": 7, "desktopGrid": [...], "mobileOrder": [...] },
      "createdAt": 0
    },
    {
      "id": "abc-123-uuid",
      "name": "Work Mode",
      "layout": { "version": 7, "desktopGrid": [...], "mobileOrder": [...] },
      "createdAt": 1740268800000
    }
  ]
}
```

**Key**: `budget-tool-dashboard-layout` (existing, unchanged)

Continues to hold the active working layout. The context reads/writes this key as before. On layout switch, the context replaces this key's contents with the selected snapshot.

## Relationship to Existing Types

```
SavedLayoutCollection
  └── layouts: SavedLayoutEntry[]
        └── layout: DashboardLayout        (existing, src/types/widget.ts)
              ├── version: number           (currently 7)
              ├── desktopGrid: WidgetLayoutItem[]
              └── mobileOrder: WidgetType[]
```

No changes to `DashboardLayout`, `WidgetLayoutItem`, or `WidgetType` types.
