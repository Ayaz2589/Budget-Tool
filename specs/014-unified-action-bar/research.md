# Research: Unified Action Bar

## R1: DsActionBar Desktop Positioning

**Decision**: Use responsive bottom offset — 84px on mobile (above MobileBottomNav), 16px on desktop (no bottom nav).

**Rationale**: The current `bottom-[calc(env(safe-area-inset-bottom)+84px)]` accounts for the MobileBottomNav's `min-h-[84px]`. On desktop (`md:` breakpoint), there is no bottom nav — the sidebar layout takes over. The action bar should sit near the bottom-right with a small margin.

**Implementation**: Replace `md:hidden` with responsive bottom positioning:
- Mobile: `bottom-[calc(env(safe-area-inset-bottom)+84px)]` (unchanged)
- Desktop: `md:bottom-4` (16px from bottom edge)

**Alternatives considered**:
- Fixed 84px on all breakpoints — rejected because it leaves a large unnecessary gap on desktop
- Absolute positioning within the dashboard scroll container — rejected because the bar should stay fixed during scroll

## R2: Manage Widgets and Reset Layout Placement

**Decision**: Keep "Manage Widgets" as a single icon-only button in the DsSectionHeader. Move "Reset Layout" into the DsWidgetCatalog sheet as a footer action.

**Rationale**:
- "Manage Widgets" is a frequent action that should be one-click accessible. It opens the widget catalog sheet.
- "Reset Layout" is a destructive, infrequent action. Placing it inside the widget catalog sheet (which is already the widget management hub) is discoverable and reduces header clutter.
- This keeps the header clean with just the title, subtitle, currency chip, and a single "Manage Widgets" icon button.

**Alternatives considered**:
- Both in DsWidgetCatalog — rejected because "Manage Widgets" would need a different trigger
- Both in the floating action bar — rejected because these are layout management, not primary transaction actions
- Dropdown menu for widget actions — rejected as unnecessary complexity

## R3: DsActionBar Scope — Dashboard Only vs All Pages

**Decision**: Change is dashboard-only for this feature. Other pages already have their own DsActionBar usage that works correctly.

**Rationale**: The spec specifically targets "the desktop action buttons (add expense, add income, etc.)" which refers to the Dashboard page. Other pages (Transactions, Income, Debt, Mortgage, Import) already use DsActionBar on mobile with `md:hidden` and have their own desktop header buttons. Unifying all pages is a separate concern.

**Alternatives considered**:
- Update DsActionBar component globally (remove `md:hidden`) — rejected because each page has different action sets and some desktop headers have page-specific controls that shouldn't be removed
- This feature could be extended to all pages later as a follow-up

## R4: DsActionBar Component Changes

**Decision**: Make `md:hidden` optional via a new `mobileOnly` prop (defaulting to `true` for backward compatibility). The Dashboard will pass `mobileOnly={false}`.

**Rationale**: Changing the component globally would break all 6 pages that currently rely on `md:hidden` behavior. A prop gives each page control over when to show the action bar on desktop.

**Alternatives considered**:
- Override with className from Dashboard — rejected because `md:hidden` can't be cleanly overridden with Tailwind merge
- Create a separate `DsDesktopActionBar` — rejected as unnecessary duplication (Principle VII)
- Remove `md:hidden` globally and fix all pages — rejected as out of scope
