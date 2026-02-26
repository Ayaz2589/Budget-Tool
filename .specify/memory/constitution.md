<!--
  Sync Impact Report
  ==================
  Version change: 1.1.0 → 1.2.0 (MINOR — TDD mandate + Linear ticket tracking)
  Modified principles: VI (added TDD mandate)
  Added sections:
    - Feature tracking (Linear ticket creation) in Development Workflow
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md       ✅ No updates needed (generic)
    - .specify/templates/spec-template.md        ✅ No updates needed (generic)
    - .specify/templates/tasks-template.md       ✅ No updates needed (generic)
  Follow-up TODOs: None
-->

# Ortho Constitution

## Core Principles

### I. UX-First Development

Every feature MUST be designed from the user's perspective before
implementation begins. UX quality is non-negotiable:

- Empty states MUST be actionable — never dead ends. Every `DsEmptyState`
  MUST include a primary action that unblocks the user. States MUST be
  context-aware (e.g., detect missing prerequisites and redirect accordingly).
- Progressive disclosure MUST be applied: `DsHelpTooltip` on every KPI card
  and section header, `DsCreatableSelect` for inline creation without
  leaving the current flow, and guided onboarding for first-time users.
- Visual feedback MUST be immediate and informative: color-coded metric
  tones (positive/negative), deterministic category colors across charts,
  animated sync status indicators with minimum visible duration to prevent
  flash.
- Performance MUST not degrade UX: prefer lazy rendering patterns (e.g.,
  `InlineSelectCell` mounts heavy components only on interaction, not on
  every row render).

### II. Mobile-First Parity

Every page MUST have a distinct mobile and desktop rendering path. Mobile
is not a degraded experience — it is a first-class target:

- Use `md:hidden` / `hidden md:block` to provide separate mobile and
  desktop layouts. Tables on desktop become card lists on mobile.
- Mobile MUST use flattened edge-to-edge cards (`flatten-mobile-cards`),
  a fixed bottom nav with overflow sheet, and floating action bars
  (`DsActionBar`) positioned above the bottom nav with safe-area insets.
- Bottom-sheet dialogs (`DsSheetActions`) MUST replace context menus on
  mobile. Sheet panels MUST handle `safe-area-inset-bottom` automatically.
- Haptic feedback (`navigator.vibrate`) SHOULD be triggered on primary
  mobile interactions for tactile confirmation.

### III. Financial Correctness (NON-NEGOTIABLE)

All financial calculations MUST produce correct, deterministic results.
This is the hardest constraint in the system:

- Core math (`src/lib/math/core.ts`) MUST use guarded arithmetic: NaN
  checks on every input, `safeDivide` for all division, `roundTo` for
  banker-safe rounding, and `clamp` to prevent negative balances.
- Allocation splitting MUST use penny-adjustment to eliminate
  floating-point drift across owners.
- 11 financial guard test files MUST pass before any other CI work
  proceeds. These tests gate the entire pipeline.
- Mortgage expenses MUST be excluded from spending breakdowns via
  `isMortgageCategory()` — they are tracked separately.

### IV. Safe Destructive Actions

All destructive operations MUST require explicit user confirmation.
There is no undo/redo — the confirmation dialog is the only safety net:

- Single deletes MUST show the exact record being removed (date,
  description, amount).
- Bulk deletes MUST warn with the count of affected records.
- "Delete all data" MUST use the most forceful confirmation pattern.
- Sheet-panel flows MUST separate context display from the delete
  trigger — show the record first, then offer Edit/Delete in a
  sticky footer (`DsSheetActions`).

### V. Accessibility

Accessibility MUST be layered into every interactive element, not
bolted on after the fact:

- All clickable table rows MUST have `role="button"`, `tabIndex={0}`,
  computed `aria-label` (reading the full record), and keyboard
  activation (`Enter`/`Space`).
- Status indicators MUST use `role="status"` and `aria-live="polite"`.
- Screen-reader-only text (`sr-only`) MUST be used where visual context
  is sufficient but auditory context is not.
- Focus rings MUST use `focus-visible:ring-2` with the theme's
  `--focus-ring` variable.

### VI. Incremental Refactoring Discipline & Test-Driven Development

Code changes MUST follow the incremental refactor cycle. Large rewrites
are prohibited. All new features MUST use test-driven development (TDD):

- **TDD cycle**: Write failing tests FIRST that define expected behavior,
  verify they fail, then implement code to make them pass. Tests MUST
  exist and fail before any implementation begins.
- Add or update tests FIRST, then change code, then run `bun test`
  after each change.
- New features MUST NOT break existing tests. The CI pipeline enforces
  this: financial guard tests → full test suite → TypeScript build.
- TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`) MUST
  remain enabled. No `@ts-ignore` or `any` casts without justification.
- Prefer editing existing files over creating new ones. Only create
  new files when the feature genuinely requires them.

### VII. Simplicity

Complexity MUST be justified. The right amount of complexity is the
minimum needed for the current task:

- No Redux, no Zustand — React Context with `useReducer` is sufficient.
- No backend database — localStorage with optional Google Sheets sync
  is the persistence layer.
- No abstraction layers for one-time operations. Three similar lines
  of code are better than a premature abstraction.
- Do not design for hypothetical future requirements. Solve the
  problem at hand.

## Technology Constraints

**Stack (locked):**
- React 19, TypeScript 5.x (strict), Vite 7, Tailwind CSS v4, shadcn/ui
- Bun (package manager, test runner, script runner)
- No backend — all data in `localStorage`
- Google Sheets API for optional sync (client-side OAuth)
- i18next for internationalization (7 languages)
- OKLCH color space for theming (light/dark via `.dark` class)

**File organization:**
- `src/lib/` — pure helpers organized into subdirectories: `domain/` (business logic), `export/`, `format/` (UI display), `google/`, `import/`, `math/`, `parsers/`, `platform/` (runtime/browser), `sheets/`, `widgets/`
- `src/components/ui/` — shadcn/ui (do not modify manually)
- `src/components/ds/` — custom design system (16 components)
- `src/context/` — one file per domain context
- `src/pages/` — one directory per route
- `test/` — mirrors `src/` structure
- Path alias `@/` maps to `src/`

**Prohibited:**
- External state management libraries
- Backend services or server-side rendering
- `@ts-ignore` or `any` without documented justification
- Skipping pre-commit hooks (`--no-verify`)
- Committing secrets (`.env`, credentials, API keys)

## Dashboard Widget System

The dashboard uses a widget-based architecture with 14 widgets rendered
via `react-grid-layout` on a 24-column responsive grid. All widget
behavior is governed by four key files:

**Architecture:**

- `src/lib/widgetRegistry.tsx` — single registry mapping each
  `WidgetType` to its label, icon, `sizeDims`, and `render()` function.
  The registry is the **source of truth** for widget dimensions.
- `src/lib/defaultLayout.ts` — default 24-column layout (version 6)
  used for new users and as the reset target. Exports
  `ALL_WIDGET_TYPES` for validation.
- `src/context/DashboardLayoutContext.tsx` — layout state management,
  localStorage persistence, and version migration chain.
- `src/pages/dashboard/DashboardGrid.tsx` — desktop grid rendering via
  `ResponsiveGridLayout` (24 cols at lg/md, 12 at sm, 1 at xs/xxs).

**Widget types (14):**

- KPI (5): `net-cash-flow`, `total-spent`, `total-income`,
  `total-debt`, `smart-insights`
- Chart (4): `cash-flow-chart`, `net-trend-chart`, `category-chart`,
  `owner-split-chart`
- List (4): `debt-snapshot`, `spend-by-source`, `owner-transfers`,
  `recent-activity`
- Form (1): `quick-add`

**Sizing rules:**

- Every widget supports exactly 3 sizes: `sm`, `md`, `lg`.
- Each widget defines its own `sizeDims: Record<WidgetSize, {w, h}>`
  in the registry. Shared constants (`KPI_DIMS`, `CHART_WIDE_DIMS`,
  `LIST_DIMS`) cover common patterns; per-widget overrides exist for
  `quick-add`, `net-trend-chart`, `category-chart`, `owner-split-chart`.
- On resize, `resizeWidget()` fetches dimensions from the registry
  and applies them — the registry is always authoritative.
- Widget components MUST respond to the `size` prop to adapt their
  content density, chart heights, and layout (e.g., side-by-side at
  md, full-width at lg).

**Grid configuration:**

- 24 columns at lg/md breakpoints, 12 at sm, 1 at xs/xxs
- `rowHeight: 48`, `margin: [8, 8]`, `compactType: "vertical"`
- Draggable via `.react-grid-dragHandleExample` handle, not resizable
- `onLayoutChange` persists only `x` and `y` — dimensions come from
  the registry via `resizeWidget()`.

**Layout persistence and migration:**

- Layouts are stored as JSON in localStorage at a versioned schema.
- `validateLayout()` runs on load and applies the full migration
  chain: v3→v4 (ID renames) → v4→v5 (size normalization) → v5→v6
  (16-col to 24-col scaling via 1.5x factor on x and w).
- After migration, dimensions are re-synchronized from the registry
  and boundary-clamped (`x + w <= 24`).
- New widgets added to the registry are automatically merged into
  existing layouts from `DEFAULT_LAYOUT`.
- Version 6 MUST be returned from `validateLayout()`.

**Adding a new widget:**

1. Add the `WidgetType` string to the union in `src/types/widget.ts`.
2. Create the widget component in `src/pages/dashboard/widgets/`.
3. Register it in `WIDGET_REGISTRY` with label, icon, `sizeDims`,
   and `render()`.
4. Add it to `DEFAULT_LAYOUT.desktopGrid` and `mobileOrder`.
5. Bump the layout version and add a migration if existing layouts
   need updating.

**Mobile rendering:**

- Mobile uses a vertical flex column (`DashboardMobileGrid`), not
  a grid layout. Order is controlled by `mobileOrder` array.
- Long-press (500ms) opens a popover with Move Up/Down, size
  selector, and hide button.
- Mobile and desktop share the same layout state in context.

**UI components:**

- `DsWidgetShell` — wraps every widget with drag handle (desktop)
  and overflow menu (size picker S/M/L + hide button).
- `DsWidgetCard` — card wrapper applying size-based padding
  (`px-4 py-3` at sm/md, `px-5 py-4` at lg) and density.
- `DsMetricCard` — KPI display with title, value, optional subtitle,
  optional sparkline, and tone coloring (positive/negative/neutral).

## Development Workflow

**Branch strategy:** Feature branches off `main`. PRs required for merge.

**Feature tracking:** When a new feature spec is created (via `/speckit.specify`),
a corresponding Linear ticket MUST be created in the Ortho team. The ticket
MUST be updated to Done when the feature PR is merged.

**CI pipeline (GitHub Actions):**
1. **Financial Guard** — `bun run test:financial` (11 critical files). MUST
   pass before job 2 starts.
2. **Full Test + Build** — `bun test` then `tsc -b && vite build`.

**Local development cycle:**
1. `bun dev` — Vite dev server
2. Make changes following TDD and incremental refactor discipline (Principle VI)
3. `bun test` — verify all tests pass after each change
4. `bun run build` — verify TypeScript and production build
5. `bun run lint` — verify no lint errors

**Commit discipline:**
- Husky pre-commit hooks MUST NOT be bypassed
- Commit messages MUST be descriptive and follow conventional style
- Do not commit generated files, secrets, or large binaries

**Testing standards:**
- Bun test runner + React Testing Library + happy-dom
- Financial math functions MUST have dedicated guard tests
- Component tests MUST use `@testing-library/react` patterns
- Tests live in `test/` mirroring `src/` structure

## Governance

This constitution is the authoritative source of project principles.
It supersedes ad-hoc decisions and informal conventions:

- **Amendments** require updating this document, incrementing the version
  (MAJOR for principle removal/redefinition, MINOR for new principles or
  material expansion, PATCH for clarifications), and propagating changes
  to dependent templates via the `/speckit.constitution` command.
- **Compliance** is enforced by CI (financial guard tests, TypeScript
  strict mode, ESLint) and by code review against these principles.
- **Complexity justification**: any deviation from Principle VII (Simplicity)
  MUST be documented in the plan's Complexity Tracking table with
  rationale and rejected alternatives.
- **Runtime guidance**: see `CLAUDE.md` for AI-assisted development
  conventions that complement this constitution.

**Version**: 1.2.0 | **Ratified**: 2026-02-16 | **Last Amended**: 2026-02-26
