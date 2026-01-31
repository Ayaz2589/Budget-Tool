# Testing

## How to run

- **Watch mode:** `bun test`
- **Single run:** `bun run test:run` (or `npm run test:run`)

Tests use Bun's built-in test runner. No Jest; assertions and mocks are from `bun:test`.

## Setup

- **test/setup.ts** — Runs before tests. Registers happy-dom (GlobalRegistrator from `@happy-dom/global-registrator`), extends `expect` with `@testing-library/jest-dom` matchers, imports `src/i18n` so locale is initialized.
- **Vite/config** — Test environment uses happy-dom; path alias `@/` points to `src/`.

## Structure

- **test/** mirrors **src/**:
  - **test/lib/** — Unit tests for lib modules (e.g. format.test.ts, totals.test.ts, minifiedPayload.test.ts, rules.test.ts, googleSheets.test.ts, pdfExport.test.ts, parsers/index.test.ts).
  - **test/components/** — Component tests (AddTransactionDialog, Layout).
  - **test/pages/** — Page tests (Dashboard, TransactionsPage, ImportPage, IncomePage, DebtPage, MortgagePage, RulesPage, SettingsPage, auth).

## Conventions

- **Mocking contexts:** Wrap components that use `useBudget`, `useGoogleAuth`, etc. in the corresponding providers, or mock the context with a custom wrapper.
- **Router:** For components that use `useNavigate`, `useLocation`, or `Link`, wrap in `MemoryRouter` (from react-router-dom) in the test.
- **i18n:** setup.ts imports i18n; use `t()` in components. For snapshot or text assertions, ensure locale is set or use default keys.
- **Async:** Use `await` for user events or state updates when testing async behavior.

## Auth tests

- **AuthGate:** When `isSignedIn` is false, expect redirect to `/auth` (Navigate component or location check). When true, expect Outlet (child content).
- **LoginPage:** Renders app name, heading, and sign-in button; mock `useGoogleAuth` with `signIn` jest.fn() and assert it is called on button click.
- **AuthLoginRoute:** When signed in, expect Navigate to `/`. When not signed in, expect LoginPage content.
