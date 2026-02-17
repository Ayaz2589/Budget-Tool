<!--
  Sync Impact Report
  Version change: 0.0.0 → 1.0.0
  Modified principles: N/A (initial ratification)
  Added sections: Core Principles (I–VII), Technology Constraints, Development Workflow, Governance
  Removed sections: All template placeholders replaced
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ Constitution Check section aligns
    - .specify/templates/tasks-template.md ✅ Phase structure compatible
    - .specify/templates/checklist-template.md ✅ No constitution-specific references
  Follow-up TODOs: None
-->

# Ortho Constitution

## Core Principles

### I. Privacy-First, No Backend

All user data MUST live in the browser (localStorage). There is no backend database. External service calls (Google Sheets, Linear, FX rates) are either client-initiated with the user's own OAuth token or proxied through minimal Vercel serverless functions that hold only API keys — never user data. Serverless functions MUST be stateless and MUST NOT persist, log, or forward user financial data to any third party.

### II. Financial Accuracy (NON-NEGOTIABLE)

Money math MUST be deterministic and correct. All financial calculations live in pure functions under `src/lib/math/`. The CI pipeline gates on 11 financial guard test files (`bun run test:financial`) before any other job runs. A failing financial guard test MUST block merge. Rounding, currency conversion, and split logic MUST have dedicated test coverage. No financial calculation may be changed without updating its corresponding guard test first.

### III. Incremental, Test-Gated Changes

Every change follows: read existing code, add or update tests, implement, run `bun test` after each step. The full test suite (537+ tests) and TypeScript build (`bun run build`) MUST pass before any branch is merged. Refactors are done incrementally — never rewrite an entire module in a single commit. Prefer editing existing files over creating new ones.

### IV. Context-Driven State, Not Global Stores

State management uses React Context API with modular, domain-specific providers composed by `BudgetContext`. No Redux, Zustand, or global state libraries. Each domain (expenses, income, debt, settings, sync) has its own context with isolated CRUD and state. New features MUST compose into existing providers or introduce a focused new provider — not expand unrelated contexts.

### V. Simplicity Over Abstraction

Start simple. Do not add features, configuration, or abstractions beyond what is directly requested. Three similar lines of code are better than a premature helper. Error handling and validation belong at system boundaries (user input, external APIs), not at every internal function call. Do not design for hypothetical future requirements.

### VI. Internationalization by Default

All user-facing text MUST use i18next translation keys (`t("namespace.key")`). English (`src/locales/en.json`) is the source of truth. New UI text requires a corresponding key in `en.json`; other locales fall back to English until translated. Hard-coded user-facing strings in components are not permitted.

### VII. Secrets Stay Server-Side

API keys for third-party services MUST NOT be prefixed with `VITE_` (which would bundle them into client JavaScript). Keys that the client needs (e.g., Google Client ID for OAuth) use the `VITE_` prefix. Keys for server-to-server calls (e.g., `LINEAR_API_KEY`) MUST live only in Vercel environment variables and be accessed exclusively from `api/` serverless functions.

## Technology Constraints

- **Stack**: React 19, TypeScript (strict mode), Vite, Tailwind CSS v4, shadcn/ui, Bun
- **Deployment**: Vercel (static SPA + optional `api/` serverless functions)
- **Package manager**: Bun — use `bun add`, `bun test`, `bun run build`
- **Component library**: shadcn/ui for primitives (`src/components/ui/`), custom design system in `src/components/ds/`
- **Charts**: Recharts with shadcn ChartContainer wrappers
- **Path alias**: `@/` maps to `src/`
- **CSS**: Tailwind v4 via `@tailwindcss/vite` plugin; CSS custom properties for theming in `src/index.css`; no separate `tailwind.config`
- **Testing**: Bun test runner + React Testing Library + happy-dom; tests in `test/` mirror `src/` structure

## Development Workflow

1. **Branch per feature**: Create a descriptive branch from `main`; push and open a PR when ready
2. **CI pipeline**: GitHub Actions runs Financial Guard first, then full test suite + build — both MUST pass
3. **Code review**: PRs require passing CI before merge; constitution compliance is checked as part of review
4. **Commit discipline**: Atomic commits with clear messages; do not amend published commits; pre-commit hooks run tests
5. **No secrets in commits**: `.env` MUST NOT be committed; API keys go in Vercel dashboard environment variables

## Governance

This constitution is the highest-authority document for development practices in this repository. When practices in CLAUDE.md, PRD.md, or other docs conflict with this constitution, the constitution prevails. Amendments require:

1. A documented rationale for the change
2. Version bump following semver (MAJOR for principle removal/redefinition, MINOR for additions, PATCH for clarifications)
3. Update to all dependent templates (plan, tasks, checklist) if affected
4. Approval from the project owner

Use CLAUDE.md for runtime development guidance and PRD.md for product requirements. This constitution governs *how* work is done, not *what* is built.

**Version**: 1.0.0 | **Ratified**: 2026-02-16 | **Last Amended**: 2026-02-16
