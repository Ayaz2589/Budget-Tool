# Architecture

## Runtime Composition

`App.tsx` composes providers in this order:

1. `BudgetProvider`
2. `PresetTransactionsProvider`
3. `GoogleOAuthProvider` (when client id exists) or fallback provider
4. `GoogleAuthProvider`

Then routing is mounted via `BrowserRouter`.

## Routing Model

Public routes:

- `/` (landing gate)
- `/tour`
- `/auth`

Authenticated routes are nested under `/dashboard` and rendered through `Layout` + `AuthGate`:

- `/dashboard` (dashboard)
- `/dashboard/import` (data import/export page)
- `/dashboard/transactions`
- `/dashboard/income`
- `/dashboard/debt`
- `/dashboard/mortgage`
- `/dashboard/presets`
- `/dashboard/about`
- `/dashboard/settings`

## State Boundaries

### BudgetContext

Owns canonical app data:

- expenses, income, debts, debt payments, owner transfers
- categories, owners, card sources
- UI format settings (locale, display currency, date format)

Responsibilities:

- mutation APIs for all financial entities
- localStorage persistence
- FX-backed currency display settings hydration

### PresetTransactionsContext

Owns presets only. Keeps preset operations isolated from core budget reducer concerns.

### GoogleAuthContext

Owns auth and external sync concerns:

- OAuth token/session
- Google Sheets sync/pull
- queue-safe autosync state
- Drive-backed sheet discovery/creation flow

This keeps external I/O out of budget mutation logic.

## Refactor Pattern: Orchestrator + Pure Selectors

Feature pages should follow:

- **Page component:** orchestrates UI state and invokes pure selectors/helpers.
- **Selector/helper modules:** pure projections, filtering, sorting, grouping.

Current reference implementation:

- `src/pages/transactions/TransactionsPage.tsx`
- `src/pages/transactions/transactionsLedger.ts`

`transactionsLedger.ts` now centralizes transaction row projection and filter/sort/group logic as pure functions, improving testability and reducing render-time coupling.

## Shared Module Strategy

- Use barrel exports for feature-level imports (`src/components`, `src/context`, `src/pages`, `src/types`).
- Keep low-level modules private unless they represent a stable public contract.
- Prefer pure utilities in `src/lib/*` and avoid hidden side effects.

## Testing Strategy

Three layers:

1. **Unit tests:** pure utilities/selectors (`test/lib`, `test/pages/*/*selectors*`, `test/components/addTransactionUtils.test.ts`)
2. **Component/page tests:** interaction and rendering (`test/components`, `test/pages`)
3. **Integration tests:** multi-page workflow sanity checks (`test/integration/AppFlows.test.tsx`)

This gives fast feedback at unit level while protecting cross-page regressions.
