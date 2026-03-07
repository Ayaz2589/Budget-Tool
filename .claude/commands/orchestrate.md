---
name: orchestrate
description: Run full pipelines (bootstrap a new project or develop a feature) inside a Docker sandbox. Chains skills in order, tracks state via checkpoints, and resumes on failure.
---

## Input

Arguments: `$ARGUMENTS`

Supported modes:
- `/orchestrate` — interactive (asks which mode)
- `/orchestrate bootstrap [name]` — greenfield project pipeline
- `/orchestrate feature [description]` — feature pipeline on existing project
- `/orchestrate resume` — resume from last checkpoint

---

## Mode Selection

Parse `$ARGUMENTS`:

- If starts with `bootstrap` → Bootstrap mode. Remainder is the project name (may be empty).
- If starts with `feature` → Feature mode. Remainder is the feature description (may be empty).
- If starts with `resume` → Resume mode.
- If empty → Use AskUserQuestion:

**What would you like to do?**
- `Bootstrap a new project` — scaffold, design, database, audit — full greenfield pipeline
- `Build a feature` — branch, implement, review, PR — full feature pipeline
- `Resume` — pick up where you left off

---

## Sandbox Requirement

**The sandbox is always set up FIRST, before any other skill runs. This is non-negotiable.**

The orchestrator runs in the current interactive session (handling Q&A with the user), but **all shell commands that modify the project** (installs, builds, migrations, code generation) execute inside a Docker sandbox container.

### What runs WHERE

| Where | What | Examples |
|-------|------|---------|
| **Current session** | Interactive Q&A, file reads, file writes, AskUserQuestion | /plan intake, /scaffold architecture approval, checkpoint updates |
| **Sandbox container** | ALL shell commands that install, build, generate, or modify project files | `bun install`, `bunx create-next-app`, `bunx prisma migrate`, `bun run test`, `git commit` |

**Rule: NEVER run `bun`, `bunx`, `npm`, `npx`, `node`, `prisma`, `git commit`, or any project CLI command directly via Bash. ALWAYS run them through the sandbox.**

### How to run commands in the sandbox

```bash
# Single command
.claude-sandbox/run.sh <command>

# Examples:
.claude-sandbox/run.sh "bun install"
.claude-sandbox/run.sh "bunx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-bun"
.claude-sandbox/run.sh "bunx prisma migrate dev --name init"
.claude-sandbox/run.sh "bun run test"
.claude-sandbox/run.sh "git add -A && git commit -m 'Initial scaffold'"

# If docker-compose exists (has external services like PostgreSQL):
cd .claude-sandbox && docker compose run --rm sandbox <command>
```

The workspace is volume-mounted at `/workspace` — all file changes persist to the local repo.

### Sandbox Setup (Step 0 — ALWAYS runs first)

**Bootstrap mode** (no project yet):
1. Generate `.claude-sandbox/` in the current working directory with:
   - **Dockerfile:** Based on `node:22-bookworm` with Bun, Git, GitHub CLI, and Claude Code CLI pre-installed.
   - **entrypoint.sh:** Runs the provided command, or starts an interactive shell if none given.
   - **run.sh:** `docker run` wrapper with `--env-file .env`, volume mount of parent directory to `/workspace`.
   - **.env.example:** `ANTHROPIC_API_KEY` and `GH_TOKEN` only.
2. **Build the Docker image immediately:** Run `docker build -t <project-name>-sandbox .claude-sandbox/`
3. **Verify the build succeeded.** If it fails, show the error, ask user to fix, retry. Do NOT proceed until the image is built.
4. Tell the user: "Sandbox built. Configure `.claude-sandbox/.env` from `.env.example`."
5. **Wait for user confirmation** that `.env` is ready.
6. **Verify the sandbox works:** Run `.claude-sandbox/run.sh "echo sandbox ready"` and confirm it outputs "sandbox ready".
7. Write checkpoint.

**Feature mode** (project already exists):
1. Check for `.claude-sandbox/` in the project root.
2. If missing: run `/sandbox` to generate it (reads `ARCHITECTURE.md`), then build the image.
3. Verify `.claude-sandbox/.env` exists. If only `.env.example` exists, tell the user to configure it. Wait for confirmation.
4. Verify the sandbox works with an echo test.
5. Write checkpoint.

After `/scaffold` completes (creating `ARCHITECTURE.md`), **rebuild the sandbox** by running `/sandbox` on the new project. This replaces the generic bootstrap sandbox with a project-aware one (correct services, env vars).

---

## Checkpoint

**File:** `.claude/plans/orchestrate-checkpoint.md`

This is separate from workflow's `active-checkpoint.md` — they do not conflict.

**Format:**

```markdown
## Orchestrate Checkpoint
**Mode:** bootstrap | feature
**Project:** <name or path>
**Started:** <date>
**Last updated:** <date>

### Configuration
- **Project type:** <full-stack | api-service>
- **Has database:** yes | no
- **Has auth:** yes | no
- **Has design system:** yes | no
- **Sandbox:** <path to .claude-sandbox/>
- **Feature branch:** <branch name> (feature mode only)
- **Jira key:** <key> (feature mode only, if created)

### Steps
| # | Skill | Status | Notes |
|---|-------|--------|-------|
| 1 | bootstrap sandbox | completed | Generic node:22 + Bun |
| 2 | /plan | completed | 5 features, functional MVP |
| 3 | /scaffold | completed | Next.js + Bun + PostgreSQL |
| 4 | /sandbox (rebuild) | completed | Docker + PostgreSQL service |
| 5 | /design system | in_progress | |
| 6 | /database model | pending | |
| ... | ... | ... | ... |

### Outputs
- plan.path: .claude/plans/001-my-project.md
- scaffold.project_path: /path/to/project
- scaffold.project_type: full-stack
- sandbox.path: /path/to/project/.claude-sandbox
- design.has_system: true
- database.schema_path: prisma/schema.prisma
- ...

### Failure Log
- [2026-03-06 14:23] Step 4 failed: DATABASE_URL not set. Resolution: added to .env
```

**Status values:** `pending` | `in_progress` | `completed` | `skipped` | `failed`

Write the checkpoint after each step completes. Read it on resume.

---

## Mode 1: Bootstrap Pipeline

### Intake

Use a single AskUserQuestion to collect:

**1. Project name** — if not provided in `$ARGUMENTS`, ask for it (lowercase, kebab-case).

**2. Source:**
- `Describe it now` — provide a description in the next prompt
- `Use a spec file` — provide a path to a spec/plan/requirements doc
- `Use an existing plan` — provide path to a `.claude/plans/*.md` file (skips /plan step)

**3. Run /plan first?**
- `Yes` (Recommended) — interactive planning session to define vision, features, and scope before scaffolding
- `Skip` — go straight to scaffolding (use description or spec as-is)

**4. Pipeline scope:**
- `Full pipeline` (Recommended) — runs all applicable steps
- `Custom` — pick which steps to include

If "Custom", show the step list and let the user toggle each on/off.

### Steps

**Step 1: Create bootstrap sandbox**
- Generate `.claude-sandbox/` files (Dockerfile, entrypoint.sh, run.sh, .env.example) using Write tool
- Build the Docker image: `docker build -t <project-name>-sandbox .claude-sandbox/`
- Tell user to configure `.claude-sandbox/.env` from `.env.example`
- Wait for user confirmation
- Verify sandbox: `.claude-sandbox/run.sh "echo sandbox ready"`
- Write checkpoint
- **All subsequent shell commands run INSIDE the sandbox via `.claude-sandbox/run.sh`**

**Step 2: /plan project <name>** (interactive — runs in current session, skippable)
- Skip if: user chose "Skip" in intake, OR source is "Use an existing plan"
- Run the /plan skill interactively (Q&A with user happens in current session)
- Plan is written to `.claude/plans/NNN-<slug>.md` via Write tool (no sandbox needed for file writes)
- Capture output: `plan_path`
- Write checkpoint

**Step 3: /scaffold <name>** (hybrid — Q&A in session, shell commands via sandbox)
- Interactive parts (architecture proposal, approval) happen in the current session
- Shell commands run via sandbox:
  - `.claude-sandbox/run.sh "bunx create-next-app@latest <name> --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-bun"`
  - `.claude-sandbox/run.sh "cd <name> && bun add prisma @prisma/client next-auth@beta @auth/prisma-adapter"`
  - `.claude-sandbox/run.sh "cd <name> && bun add -D vitest"`
- File creation (boilerplate, CLAUDE.md, ARCHITECTURE.md) uses Write tool directly (volume-mounted, same filesystem)
- Git init and commit via sandbox: `.claude-sandbox/run.sh "cd <name> && git init && git add -A && git commit -m 'Initial scaffold'"`
- Capture outputs: `project_path`, `project_type`, `has_database`, `has_auth`, `has_design_system`
- Write checkpoint

**Step 4: Rebuild sandbox with /sandbox <project>**
- Now that `ARCHITECTURE.md` exists, run `/sandbox` skill to regenerate `.claude-sandbox/` with project-aware config
- Rebuild image: `docker build -t <project-name>-sandbox .claude-sandbox/`
- If the project needs external services (e.g., PostgreSQL), the new sandbox includes docker-compose.yml
- Tell user to review updated `.claude-sandbox/.env` for new project-specific vars
- Verify sandbox still works: `.claude-sandbox/run.sh "echo sandbox rebuilt"`
- Write checkpoint

**Step 5: /design system** (hybrid — Q&A in session, skip conditions below)
- Skip if: `project_type` is `api-service`
- Skip if: `has_design_system` is true (already generated during scaffold)
- Skip if: user declined in Custom scope
- Interactive parts in current session, file writes via Write tool
- Any install commands via sandbox: `.claude-sandbox/run.sh "bun add <package>"`
- Git commit via sandbox
- Write checkpoint

**Step 6: /database model** (hybrid, skip if no database)
- Skip if: `has_database` is false
- Auto-feed the architecture proposal (from `ARCHITECTURE.md` Data Model section) as the spec
- Interactive model design in current session, schema file written via Write tool
- Prisma commands via sandbox: `.claude-sandbox/run.sh "bunx prisma generate"`
- Write checkpoint

**Step 7: /database migrate** (sandbox, skip if no model)
- Skip if: Step 6 was skipped or failed
- Run via sandbox: `.claude-sandbox/run.sh "bunx prisma migrate dev --name init"`
- Write checkpoint

**Step 8: /database seed** (hybrid, skip if no migration)
- Skip if: Step 7 was skipped or failed
- Seed file written via Write tool, executed via sandbox: `.claude-sandbox/run.sh "bunx prisma db seed"`
- Write checkpoint

**Step 9: /audit <project>** (current session — reads files, writes ARCHITECTURE.md)
- Validates that `ARCHITECTURE.md` still matches reality after all generation
- Tests run via sandbox: `.claude-sandbox/run.sh "bun run test"`
- Write checkpoint

**Step 10: /design page** (hybrid, optional)
- Ask user: "Would you like to create initial pages using the design system?"
  - `Yes` — ask which pages, design in current session, write files via Write tool
  - `Skip` — move to report
- Write checkpoint

**Step 11: Report** (see Report Format below)

---

## Mode 2: Feature Pipeline

### Intake

Use a single AskUserQuestion to collect:

**1. Feature source:**
- `Describe it now` — provide a description
- `Use a Jira ticket` — provide the Jira key (e.g., EN-123)
- `Use a spec file` — provide a file path
- `Use an existing plan` — provide path to a `.claude/plans/*.md` file (skips /plan step)

**2. Run /plan first?**
- `Yes` (Recommended) — interactive planning session to define scope, sub-tasks, and acceptance criteria
- `Skip` — go straight to implementation (use description or spec as-is)

**3. Create Jira ticket?**
- `Yes` — will run `/jira-ticket` to create one
- `No` — skip Jira integration
- `Already exists` — provide the key

**4. Pipeline scope:**
- `Full pipeline` (Recommended) — runs all applicable steps
- `Custom` — pick which steps to include

### Steps

**Step 0: Load project context + ensure sandbox**
- Read `CLAUDE.md` and `ARCHITECTURE.md` from the current project (via Read tool)
- If either is missing, tell the user and stop
- Extract: stack, test command, database presence, existing design system
- Ensure sandbox exists (see Sandbox Requirement above) — build image if needed
- Verify sandbox: `.claude-sandbox/run.sh "echo sandbox ready"`
- Write checkpoint
- **All subsequent shell commands run via `.claude-sandbox/run.sh`**

**Step 1: /plan feature** (interactive — runs in current session, skippable)
- Skip if: user chose "Skip" in intake, OR source is "Use an existing plan"
- Run the /plan skill interactively (Q&A in current session, file writes via Write tool)
- Capture output: `plan_path`
- Write checkpoint

**Step 2: /jira-ticket** (current session, optional)
- Skip if: user chose "No" or "Already exists" (capture provided key)
- If "Yes": run `/jira-ticket` with the feature description as summary
- Capture: `jira_key`, `jira_url`
- Write checkpoint

**Step 3: Create feature branch** (via sandbox)
- Branch name: `feat/<jira_key>-<slug>` if Jira key exists, else `feat/<slug>`
- Slug: kebab-case from first 5 words of feature description
- Run via sandbox: `.claude-sandbox/run.sh "git checkout -b <branch-name>"`
- Write checkpoint

**Step 4: Analyze feature requirements** (current session)
- Read the feature description/spec/Jira ticket and the plan (from Step 1, if it ran) via Read tool
- If a plan exists, use its sub-tasks and acceptance criteria directly
- Otherwise, determine what's needed: schema changes, new pages, API routes, new components
- Write checkpoint with flags: `needs_schema`, `needs_pages`, `needs_api`

**Step 5: /database model + /database migrate** (hybrid, skip if no schema changes)
- Skip if: `needs_schema` is false
- Schema design interactive in current session, file writes via Write tool
- Prisma commands via sandbox: `.claude-sandbox/run.sh "bunx prisma migrate dev --name <name>"`
- Write checkpoint

**Step 6: /design page** (hybrid, skip if no new UI pages)
- Skip if: `needs_pages` is false or project is API-only
- Design in current session, file writes via Write tool
- Write checkpoint

**Step 7: /workflow** (hybrid — core implementation)
- Interactive specification in current session
- Code written via Write/Edit tools, tests run via sandbox: `.claude-sandbox/run.sh "bun run test"`
- Review runs in current session with sandbox for test verification
- If review fails: auto-loop fix then re-review (up to 3 cycles) before asking user
- Git commits via sandbox: `.claude-sandbox/run.sh "git add -A && git commit -m '...'"`
- Write checkpoint

**Step 8: /audit** (hybrid, skip if architecture unchanged)
- Skip if: no new models, routes, or patterns were added
- File reads/writes in current session, tests via sandbox
- Write checkpoint

**Step 9: /create-pr** (via sandbox)
- Auto-fill PR title with Jira key prefix if available: `[EN-123] Feature description`
- Summary generated from commits on the feature branch
- Run via sandbox: `.claude-sandbox/run.sh "gh pr create --title '...' --body '...'"`
- Capture: `pr_url`
- Write checkpoint

**Step 10: Wrap-up** (current session)
- Save learnings to CLAUDE.md or auto memory if applicable
- Clean up: delete `.claude/plans/orchestrate-checkpoint.md`
- Generate report

---

## Resume Mode

1. Look for `.claude/plans/orchestrate-checkpoint.md`
2. If not found: "No checkpoint found. Nothing to resume." Then stop.
3. Read the checkpoint. Display the step table to the user.
4. Find the last `in_progress` or first `pending` step.
5. Ask the user:
   - `Resume from step N` — continue where you left off
   - `Re-run step N-1` — re-execute the last completed/failed step
   - `Abort` — delete checkpoint and stop
6. Load all outputs from the checkpoint's Outputs section.
7. Verify the sandbox still exists and `.env` is configured.
8. Continue the pipeline from the selected step.

---

## Failure Handling

| Criticality | Examples | Behavior |
|---|---|---|
| **Critical** (cannot skip) | scaffold fails, sandbox creation fails, review hard gate fails | Ask: `Fix and retry` / `Abort`. No auto-skip. |
| **Recoverable** (can retry) | DATABASE_URL missing, Docker not running, dependency install fails | Ask: `Retry` / `Skip` / `Abort`. Max 2 retries. |
| **Non-blocking** (can skip) | Jira MCP not configured, audit finds minor issues, design page fails | Log warning, continue, include in report. |

**Sandbox-specific failures:**
- Docker not running → Tell user to start Docker, then retry
- `.env` not configured → Tell user to fill in `.env`, then retry
- Container build fails → Show build output, ask user to fix Dockerfile or retry

**Review loop:** If `/review` fails inside `/workflow`, the workflow skill handles the fix-and-retry loop (up to 3 cycles). If it still fails after 3 cycles, the orchestrator asks the user to intervene.

All failures are logged in the checkpoint's Failure Log with timestamps.

---

## Report Format

```
## Pipeline Complete

**Mode:** Bootstrap | Feature
**Project:** <name>
**Sandbox:** <.claude-sandbox/ path>
**Steps:** N/M completed, X skipped

### Steps
| # | Skill | Status | Notes |
|---|-------|--------|-------|
| 1 | bootstrap sandbox | completed | Generic node:22 + Bun |
| 2 | /plan | completed | 5 features, functional MVP |
| 3 | /scaffold | completed | Next.js + Bun + PostgreSQL |
| 4 | /sandbox (rebuild) | completed | Docker + PostgreSQL service |
| 5 | /design system | completed | Minimal, deep teal |
| ... | ... | ... | ... |

### Created
- Project: <path>
- Sandbox: <.claude-sandbox/ path>
- Design system: yes/no
- Database: N models, migrated, seeded
- PR: <url> (feature mode)
- Jira: <url> (feature mode)

### Next Steps

**To run inside the sandbox:**
```bash
cd <project>/.claude-sandbox
docker compose run --rm sandbox    # interactive Claude Code session
```

**Or run a specific task:**
```bash
.claude-sandbox/run.sh "implement the login page"
```

1. Review generated code
2. `bun run dev` to start the dev server (inside sandbox or locally)
3. `bun run test` to run tests
```
