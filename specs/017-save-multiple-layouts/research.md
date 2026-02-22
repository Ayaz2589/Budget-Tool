# Research: Save Multiple Layouts

## R1: Storage Strategy

**Decision**: Store the entire layout collection (active ID + array of named snapshots) as a single JSON blob under one new localStorage key `budget-tool-saved-layouts`. Keep the existing `budget-tool-dashboard-layout` key for the active working layout (backward compatible).

**Rationale**: A single key avoids orphaned entries, simplifies quota estimation, and makes the collection atomic. The existing key continues to work for the active layout, preserving backward compatibility with the current `DashboardLayoutContext` load/save path. The saved-layouts key stores immutable snapshots; the active key stores the live, mutable copy.

**Alternatives considered**:
- Separate key per layout (`budget-tool-layout-<id>`): More fragile, harder to enumerate, risk of orphaned keys if delete fails mid-operation.
- Replace existing key with multi-layout object: Would break backward compatibility and require rewriting the entire load/validate/persist chain.

## R2: Data Model for Saved Layouts

**Decision**: Use a flat collection object with a UUID-based `id` per saved layout plus a reserved `"default"` entry that is never user-deletable.

```
{
  activeId: string,          // ID of the currently selected layout
  layouts: SavedLayoutEntry[]  // ordered by creation time
}
```

Each `SavedLayoutEntry`:
```
{
  id: string,                // crypto.randomUUID() or "default"
  name: string,              // user-visible label, max 30 chars
  layout: DashboardLayout,   // full v7 snapshot
  createdAt: number          // Date.now() timestamp
}
```

**Rationale**: UUIDs avoid name-collision issues and decouple identity from display name (enabling rename). The `"default"` ID is reserved and always populated from `DEFAULT_LAYOUT` at load time, ensuring it cannot be stale.

**Alternatives considered**:
- Name-based keys: Renaming would require migrating references. UUID is simpler.
- Incremental numeric IDs: Require a counter; UUIDs are stateless.

## R3: UI Location for Layout Switcher

**Decision**: Add a compact Select dropdown in the dashboard section header, next to the existing "Manage Widgets" (Grid2X2) button. Desktop only — on mobile, layouts are managed via the widget catalog sheet.

**Rationale**: The section header already has the grid icon and currency selector. A small Select fits the established pattern (matches the currency selector styling: `h-8 rounded-full`). It's always visible without extra clicks, satisfying SC-001 (under 3 interactions).

**Alternatives considered**:
- DsActionBar (bottom bar): Too crowded; action bar is for primary CRUD actions.
- Separate settings page: Too many clicks; violates SC-001.
- Popover with custom list: More flexible but overkill; shadcn Select already handles the use case.

## R4: Migration Path from Single to Multi Layout

**Decision**: On first load, if the new `budget-tool-saved-layouts` key is absent but the old `budget-tool-dashboard-layout` key exists, migrate by wrapping the existing layout as a single entry named "My Layout" alongside the factory default. Set `activeId` to the migrated layout's ID.

**Rationale**: Zero-friction upgrade for existing users. Their current customized layout is preserved and named, and the factory default is always available.

**Alternatives considered**:
- Discard existing layout: Unacceptable — users lose customizations.
- Prompt user to name their layout: Adds friction to first load; "My Layout" is a reasonable default name.

## R5: Save Flow UX

**Decision**: Use a Dialog with a text input for the layout name. If the name matches an existing layout, show an inline warning and offer "Overwrite" or "Save as new". Trigger: a "Save" button in the layout switcher dropdown (footer area of the Select popover, or a separate icon button).

**Rationale**: Dialog is the existing pattern for user input (EditTransactionDialog, AddIncomeDialog). Inline overwrite detection avoids a second confirmation step. The save trigger is co-located with the switcher for discoverability.

**Alternatives considered**:
- Auto-save with undo: Complex undo system violates Simplicity principle.
- Sheet panel: Overkill for a single text input.

## R6: Confirmation Patterns

**Decision**: Use AlertDialog for delete confirmation (matches existing reset-layout pattern in Dashboard.tsx). No confirmation needed for switch (instant, no data loss since active layout is auto-saved). No confirmation for rename (non-destructive).

**Rationale**: Constitution Principle IV requires confirmation for destructive actions. Switching layouts is not destructive because live edits already auto-save to the active layout.

## R7: Layout Limit

**Decision**: Hard limit of 10 saved layouts (including default). Show a toast/inline message when limit is reached. The save button is disabled when at capacity.

**Rationale**: 10 layouts is generous for personal use. Each layout is ~2-4KB of JSON; 10 layouts = ~40KB, well within localStorage's 5MB typical limit. Keeps the Select dropdown scannable.
