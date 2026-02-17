<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 (template) → 1.0.0 (initial ratification)
  Modified principles: N/A (all new)
  Added sections:
    - 7 Core Principles (I–VII)
    - Technology Constraints
    - Development Workflow
    - Governance
  Removed sections: None (first fill)
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

### VI. Incremental Refactoring Discipline

Code changes MUST follow the incremental refactor cycle. Large rewrites
are prohibited:

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
- `src/lib/` — pure helpers by domain (`math/`, `parsers/`, `sheets/`)
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

## Development Workflow

**Branch strategy:** Feature branches off `main`. PRs required for merge.

**CI pipeline (GitHub Actions):**
1. **Financial Guard** — `bun run test:financial` (11 critical files). MUST
   pass before job 2 starts.
2. **Full Test + Build** — `bun test` then `tsc -b && vite build`.

**Local development cycle:**
1. `bun dev` — Vite dev server
2. Make changes following incremental refactor discipline (Principle VI)
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

**Version**: 1.0.0 | **Ratified**: 2026-02-16 | **Last Amended**: 2026-02-16
