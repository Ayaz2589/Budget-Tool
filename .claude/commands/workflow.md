---
name: workflow
description: Main development workflow. Use when starting any new feature request or implementation task. Works with any project.
---

# Development Workflow

## 0. Discover project context

### Check for CLAUDE.md

Look for `CLAUDE.md` in the project root.

**If it does NOT exist**, run first-time setup:

1. Check for `ARCHITECTURE.md`. If missing, tell the user: "No ARCHITECTURE.md found. Running /audit to generate one." Then run the `/audit` skill on the current project directory.

2. After ARCHITECTURE.md exists, ask the user to provide the following (all in one question):
   - **Stack**: Framework, language, test runner (e.g., "Next.js 15 / TypeScript / Vitest")
   - **Test command**: How to run a single test file (e.g., "npx vitest run <file>")
   - **Backend path**: Relative path to the backend if this is a frontend project (e.g., "../api"), or "none" if this IS the backend or has no separate backend
   - **Package manager**: npm, yarn, pnpm, bun, poetry, etc.

3. Generate a minimal `CLAUDE.md`:
   ```markdown
   # CLAUDE.md

   This file provides guidance to Claude Code when working with code in this repository.

   ## Project Overview

   <1 sentence from ARCHITECTURE.md's opening description>

   - **[ARCHITECTURE.md](./ARCHITECTURE.md)** — how the system works

   ## Commands

   ```bash
   <test command>        # Run a single test file
   <build command>       # Production build (from package.json/pyproject.toml)
   <lint command>        # Lint (from package.json/pyproject.toml)
   ```

   ## Key Constraints

   - **Package manager**: <package manager>
   - **No `any` types** in new code
   ```

4. Tell the user: "Created CLAUDE.md — review and customize it after this session."

**If it exists**, read it.

### Load project context

Read `CLAUDE.md` and `ARCHITECTURE.md` to extract:
- **Stack**: Framework, language, test runner
- **Test command**: How to run tests
- **Backend path**: Where the API lives (if applicable)
- **Naming conventions**: File naming, component patterns
- **Key constraints**: Things to never violate

If a constitution file exists at `.specify/memory/constitution.md`, note its location — it will be read in Phase 2.

Store these as the **project context** used throughout the workflow.

---

## Context Management

The workflow maintains a checkpoint at `.claude/plans/active-checkpoint.md` to survive context compression and session breaks.

**On start:** If the checkpoint exists, read it and offer to resume. Otherwise proceed from Phase 1.

**Checkpoint format:**
```markdown
## Workflow Checkpoint
**Feature:** [name]
**Path:** Claude Plan | Spec-Kit
**Artifact:** .claude/plans/NNN-short-name.md | specs/NNN-short-name/
**Last updated:** [date]

### Phase Status
- [x] Phase 1: Specify — completed
- [ ] Phase 2: Implement — in progress (T003 of 7)
- [ ] Review
- [ ] Wrap-up

### Current State
- **Completed:** T001, T002
- **In progress:** T003
- **Files modified:** [list of files]
- **Key decisions:** [brief notes]
- **Next:** [what to do next]
```

Write/update after each phase and each task. Delete after wrap-up completes.

---

## Phase 1: Specify

Assess complexity to pick the right path:

| Use Spec-Kit when | Use Claude Plan when |
|---|---|
| Multiple moving parts | Self-contained change |
| Architecture impact | No structural changes |
| Mission-critical | Low-risk feature |
| Multi-session scope | Single-session scope |

**Claude Plan path:** Save to `.claude/plans/NNN-short-name.md`:
```
## Plan: [Feature name]
**What:** [description]  **Why:** [problem it solves]

**Acceptance criteria:**
- [ ] ...

**Implementation steps:**
1. ...

**Gotchas:** ...
```

**Spec-Kit path:** Run in order (if `/speckit.*` commands are available):
1. `/speckit.constitution` (review existing, don't recreate)
2. `/speckit.specify` → `spec.md`
3. `/speckit.clarify` (skip for spikes)
4. `/speckit.plan` → `plan.md`
5. `/speckit.analyze` (fix misalignments before continuing)
6. `/speckit.tasks` → `tasks.md`

If Spec-Kit commands are not available, use the Claude Plan path.

---

## Phase 2: Implement

**Before writing any code**, read these files to understand the system and its rules:
1. `ARCHITECTURE.md` — system design, data flows, and existing patterns
2. `.specify/memory/constitution.md` — if it exists, these are NON-NEGOTIABLE principles and constraints

**All implementation MUST follow TDD:**
1. Write a failing test that defines the expected behavior
2. Run it — confirm it fails
3. Write the minimum code to make it pass
4. Refactor while keeping tests green

No implementation code may be written without a corresponding failing test first.

**If the feature involves API calls:** Before writing tests, read the backend route and schema files (discovered from ARCHITECTURE.md) to verify the contract. Flag mismatches before implementing.

**Claude Plan path:**
- For each acceptance criteria:
  1. Write the failing test first (using the project's test runner from CLAUDE.md)
  2. Run it — confirm it fails
  3. Implement to make it pass
  4. Check off the criteria in the plan file
- Commit after each criteria or logical group

**Spec-Kit path:**
- Run `/speckit.implement` — tasks in dependency order
- Each task follows TDD: failing test → implement → pass → commit

**After implementation:** Run `/review` if available, otherwise self-review:
- All tests pass
- No type errors (run build command from CLAUDE.md)
- Lint passes
- Every new function/component has tests
- Naming conventions from CLAUDE.md followed

---

## Wrap-up

1. **Remember** — Save useful learnings:
   - Permanent conventions → CLAUDE.md or `.claude/rules/`
   - Scoped rules → `.claude/rules/` with `paths:` frontmatter
   - Patterns/insights → auto memory
   - Ephemeral context → `CLAUDE.local.md`

2. **Self-improve** — If the session surfaced skill gaps, friction, or missing knowledge, apply fixes to CLAUDE.md, rules, or memory. Present a summary of what changed. If nothing notable, say "Nothing to improve" and wrap up.

3. **Clean up** — Delete `.claude/plans/active-checkpoint.md`.
