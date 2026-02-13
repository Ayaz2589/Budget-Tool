# Testing

## Commands

- Run financial guard subset: `bun run test:financial`
- Run full suite: `bun test`
- Build check: `npm run build`

Use financial guard first, then full suite and build before merge:

1. `bun run test:financial` for equation-critical coverage.
2. `bun test` for full logic/UI coverage.
3. `npm run build` for type/build regressions.

## Test Environment

- Runner: `bun:test`
- DOM: `happy-dom`
- Setup: `test/setup.ts` initializes i18n + testing-library matchers

## Test Layers

### Unit

`test/lib/*` and selector utility tests focus on pure logic:

- currency/date formatting
- import/export parsers
- sheets/drive helper behavior
- dashboard and transaction selectors

### Component/Page

`test/components/*` and `test/pages/*` validate:

- dialog/sheet interactions
- table/list rendering
- filter and form behavior
- routing guards and auth-aware page behavior

### Integration

`test/integration/AppFlows.test.tsx` covers cross-page user flow behavior using provider + router composition (not just isolated components).

## Refactor Guardrails

When refactoring:

1. Move deterministic logic into pure modules first.
2. Add or update unit tests for extracted functions.
3. Keep page behavior parity with component/page tests.
4. Add at least one integration assertion when flow spans pages/providers.

## Common Pitfalls

- Multiple matching elements in dialogs/sheets: use scoped queries (`within`) or pick visible instance intentionally.
- Recharts warnings in tests are expected when container dimensions are zero in DOM simulation; they are not failures.
- Missing dialog description warnings should be treated as accessibility debt and fixed when touching that dialog.
