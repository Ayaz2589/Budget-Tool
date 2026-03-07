---
name: review
description: Code review skill. Verifies correctness, convention compliance, and test quality. Discovers project rules from CLAUDE.md and ARCHITECTURE.md.
---

# Review

## 0. Load project context

Read `CLAUDE.md` to discover:
- **Test command** (e.g., `npm test`, `npx vitest run`, `pytest`)
- **Build command** (e.g., `npm run build`)
- **Lint command** (e.g., `npm run lint`)
- **Key constraints** (naming conventions, path aliases, forbidden patterns)

Read `ARCHITECTURE.md` to discover:
- **Backend path** (if this is a frontend project with a separate backend)
- **API contract locations** (route files, schema files)
- **Key patterns** (component architecture, auth flow, state management)

If `.specify/memory/constitution.md` exists, read it — these are NON-NEGOTIABLE rules.

If `CLAUDE.md` doesn't exist, tell the user: "No CLAUDE.md found. Run `/workflow` first to set up the project." Then stop.

---

Run all tests first using the test command from CLAUDE.md. If tests fail, fix before continuing.

---

### 1. TDD Compliance (hard gate)

- Every new function, component, action, and utility MUST have a corresponding test
- No implementation file should exist without a test file
- If any new code lacks tests, this is a **blocking failure** — return to Phase 2 to write failing tests first

### 2. Acceptance Criteria

- Load the plan (`.claude/plans/NNN-short-name.md`) or spec-kit artifacts (`specs/NNN-short-name/tasks.md`, `spec.md`, `plan.md`)
- Verify every acceptance criteria item is satisfied
- Check for missed edge cases called out in the plan or spec

---

### 3. Convention Compliance (hard gate)

Read the rules from `CLAUDE.md` (Key Constraints section) and the constitution (if it exists). Verify ALL conventions are followed.

Common checks (apply those relevant to the project):
- **Type safety** — no `any` types in new code unless documented
- **Path aliases** — no deep relative imports crossing more than one `../`
- **Server/client separation** — server components don't import client-side APIs
- **Naming conventions** — files, functions, and components follow the project's naming rules
- **Styling** — follows the project's styling approach (Tailwind, CSS modules, etc.)
- **State management** — follows the project's state management pattern

Flag anything that violates the project's documented constraints.

---

### 4. API Contract (hard gate — when API-related files are modified)

If the project has a backend (discovered from ARCHITECTURE.md), cross-reference changes:
- Read the backend route files — verify endpoint URL, HTTP method, and params match
- Read the backend schema files — verify response shape matches frontend types
- Check auth patterns are followed
- Check error handling covers expected error codes

Skip this section if no backend exists or no API-related files were modified.

---

### 5. Test Quality (hard gate)

- Tests mirror source structure (not co-located)
- Test names describe behavior: `should [do x] when [condition]`
- Meaningful assertions — no lone `toBeTruthy()` or empty expects
- Coverage target on new code (check CLAUDE.md for specific threshold)
- All acceptance criteria have corresponding tests

---

### 6. Code Smells (soft gate)

- Unnecessary complexity or functions doing too much
- Duplicated logic that should be abstracted
- Unused imports or dead code from implementation

Fix minor smells in place. Log significant ones for wrap-up.

---

### Resolution

- **Hard gate failures** → fix, re-run `/review`
- **All clear** → return to `/workflow` and proceed to wrap-up
