---
name: plan
description: Interactive planning session that asks in-depth questions to produce a structured project or feature plan. Usable standalone or as part of the orchestrator pipeline.
---

## Input

Arguments: `$ARGUMENTS`

Supported commands:
- `/plan` — interactive (detects context and asks questions)
- `/plan project [name]` — plan a new project from scratch
- `/plan feature [description]` — plan a feature for an existing project

---

## Instructions

Guide the user through a structured planning session using multiple-choice questions, selections, and targeted follow-ups. The goal is to produce a comprehensive plan document before any code is written.

Detect the mode from `$ARGUMENTS`:
- If starts with `project` → Project planning. Remainder is the project name (may be empty).
- If starts with `feature` → Feature planning. Remainder is the feature description (may be empty).
- If empty → Use AskUserQuestion:

**What are we planning?**
- `A new project` — full project plan from scratch
- `A feature` — feature plan for an existing project

---

## Mode 1: Project Planning

### Round 1 — Vision & Users

Use a single AskUserQuestion with all of these:

**1. What problem does this solve?**
Free text — 1-3 sentences describing the core problem.

**2. Who are the primary users?**
- `Consumers (B2C)` — general public, end users
- `Business users (B2B)` — teams, organizations, employees
- `Developers` — API consumers, integrators
- `Internal team` — admin tools, dashboards
- `Mixed` — multiple user types (describe)

**3. What's the closest comparison?**
Free text — "It's like [X] but [difference]." Helps anchor the vision. Can say "nothing similar" if truly novel.

**4. What's the MVP scope?**
- `Tight MVP` — 1-2 core features, ship fast, validate
- `Functional MVP` — 3-5 features, usable product
- `Full v1` — comprehensive first release
- `Prototype / proof of concept` — just prove the idea works

### Round 2 — Core Features

Use AskUserQuestion:

**Based on your description, here are the feature areas I've identified:**

List 4-8 candidate features derived from Round 1 answers. For each, show a one-line description.

**Select which features to include in this plan (comma-separated numbers, or "all"):**
- `1. [Feature A]` — description
- `2. [Feature B]` — description
- `3. [Feature C]` — description
- ...
- `All` — include everything
- `Add more` — describe additional features not listed

For each selected feature, ask a single follow-up AskUserQuestion:

**For [Feature Name], which best describes the complexity?**
- `Simple` — CRUD, standard patterns, < 1 day
- `Medium` — some business logic, integrations, 1-3 days
- `Complex` — custom algorithms, real-time, multi-step flows, 3+ days
- `Uncertain` — needs research / spike

### Round 3 — Technical Decisions

Use a single AskUserQuestion:

**1. Data storage needs?**
- `Relational database (PostgreSQL)` — structured data, relationships, transactions
- `Document store (MongoDB)` — flexible schemas, nested data
- `None / in-memory` — no persistence needed
- `Not sure` — let the plan recommend

**2. Auth requirements?**
- `Email + password` — traditional sign-up/login
- `Social login (Google, GitHub, etc.)` — OAuth providers
- `Both` — email + social
- `API keys` — machine-to-machine
- `None` — no auth needed
- `Not sure`

**3. External integrations?**
Free text — list any APIs, services, or third-party tools. Say "none" if standalone.

**4. Real-time requirements?**
- `None` — standard request/response
- `Live updates` — WebSockets, SSE for dashboards or notifications
- `Real-time collaboration` — multiple users editing simultaneously
- `Not sure`

**5. Deployment target?**
- `Vercel` — serverless, great for Next.js
- `AWS` — EC2, ECS, Lambda
- `Docker / self-hosted` — own infrastructure
- `Not decided yet`

### Round 4 — Priorities & Constraints

Use a single AskUserQuestion:

**1. What matters most? (pick top 2)**
- `Speed to market` — ship fast, iterate later
- `Code quality` — clean architecture, full test coverage
- `User experience` — polished UI, smooth flows
- `Scalability` — handle growth from day one
- `Security` — sensitive data, compliance requirements
- `Cost efficiency` — minimize infrastructure spend

**2. Known constraints?**
Free text — deadlines, budget limits, team size, existing systems to integrate with, regulatory requirements. Say "none" if unconstrained.

**3. What should this plan NOT include?**
Free text — explicitly out of scope. Helps prevent scope creep. Say "nothing" if open-ended.

### Round 5 — User Flows (for projects with UI)

Skip this round if the project is an API service with no UI.

Use AskUserQuestion:

**What are the key user journeys? Select all that apply:**
- `Sign up / onboarding` — new user first experience
- `Dashboard / home` — main landing after login
- `Create / edit content` — forms, editors, builders
- `Browse / search` — discovery, filtering, lists
- `Settings / profile` — user preferences, account management
- `Checkout / payment` — purchasing flow
- `Admin / management` — back-office tools
- `Other` — describe

For the top 3 selected journeys, ask one follow-up each:

**Walk me through [Journey Name] in 3-5 steps:**
Free text — e.g., "User lands on homepage → clicks Sign Up → fills form → verifies email → sees dashboard"

---

## Mode 2: Feature Planning

### Step 0 — Load Context

Read `CLAUDE.md` and `ARCHITECTURE.md` from the current project. Extract:
- Stack, frameworks, patterns
- Existing data models
- Existing routes/pages
- Key constraints

If either file is missing, tell the user: "No project context found. Run `/audit` first, or use `/plan project` for a new project." Then stop.

### Round 1 — Feature Definition

Use a single AskUserQuestion:

**1. What's the feature?**
Free text if not provided in `$ARGUMENTS`. 1-3 sentences.

**2. Why is it needed?**
- `User request` — users are asking for it
- `Business goal` — revenue, growth, retention metric
- `Technical debt` — refactoring, performance, cleanup
- `Bug fix / improvement` — fixing broken or suboptimal behavior
- `Dependency` — another feature or system requires it

**3. Who uses this feature?**
- `All users`
- `Specific role` — describe (e.g., admins, premium users)
- `Internal only` — team/ops
- `System` — automated, no direct user interaction

**4. What does success look like?**
Free text — measurable outcome. e.g., "Users can filter products by category and see results in < 200ms."

### Round 2 — Scope & Behavior

Use AskUserQuestion:

**Based on the feature and your project's architecture, here's what I think is involved:**

List 3-6 sub-tasks derived from the feature description and existing architecture. Show which parts of the codebase they touch.

**Select which to include (comma-separated numbers, or "all"):**
- `1. [Sub-task A]` — touches: `src/app/api/...`, `prisma/schema.prisma`
- `2. [Sub-task B]` — touches: `src/components/...`
- `3. [Sub-task C]` — touches: `src/lib/...`
- ...
- `All`
- `Add more`

### Round 3 — Edge Cases & Behavior

Use a single AskUserQuestion:

**1. What happens when things go wrong?**
- `Show error message` — user-facing error states
- `Retry silently` — auto-retry with fallback
- `Degrade gracefully` — show partial data, disable feature
- `Not sure` — let the plan recommend

**2. Data edge cases?**
- `Empty state` — no data yet, first-time user
- `Large datasets` — pagination, virtual scrolling needed
- `Concurrent edits` — multiple users touching same data
- `None expected`
- `Not sure`

**3. Does this feature need to work offline or with poor connectivity?**
- `No` — always online
- `Yes, cache recent data` — offline read
- `Yes, queue actions` — offline write
- `Not applicable`

### Round 4 — Acceptance Criteria

Use AskUserQuestion:

**Here are the acceptance criteria I've drafted. Edit, add, or approve:**

List 4-8 acceptance criteria derived from all previous rounds. Format as checkboxes.

```
- [ ] User can [action] and sees [result]
- [ ] When [condition], the system [behavior]
- [ ] [Performance]: [action] completes in < [threshold]
- [ ] [Error]: When [failure], user sees [message]
...
```

**Options:**
- `Approve` — use these as-is
- `Edit` — describe changes (add, remove, modify criteria)

Loop until approved.

---

## Output: Plan Document

After all rounds, generate and write the plan to `.claude/plans/NNN-<slug>.md`.

**Numbering:** Find existing plans in `.claude/plans/`, take the highest `NNN` prefix, increment by 1. Start at `001` if none exist.

### Project Plan Format

```markdown
## Plan: <Project Name>

**Type:** Project
**Created:** <date>
**MVP Scope:** <tight/functional/full/prototype>
**Primary users:** <user type>

### Vision
<problem statement and comparison from Round 1>

### Features
| # | Feature | Complexity | Priority | Included |
|---|---------|-----------|----------|----------|
| 1 | <name> | <simple/medium/complex> | <must/should/nice> | yes/no |
| ... | ... | ... | ... | ... |

### Technical Decisions
- **Database:** <choice + reasoning>
- **Auth:** <choice + reasoning>
- **Integrations:** <list>
- **Real-time:** <choice>
- **Deployment:** <target>

### User Flows
#### <Journey 1>
1. <step>
2. <step>
...

#### <Journey 2>
...

### Priorities
1. <top priority>
2. <second priority>

### Out of Scope
- <item>
- ...

### Acceptance Criteria
- [ ] <criterion>
- [ ] ...

### Implementation Order
1. <what to build first and why>
2. <what to build next>
...
```

### Feature Plan Format

```markdown
## Plan: <Feature Name>

**Type:** Feature
**Created:** <date>
**Motivation:** <user request/business goal/tech debt/bug fix/dependency>
**Success metric:** <from Round 1>

### What
<feature description>

### Why
<motivation and context>

### Sub-tasks
| # | Task | Files | Complexity | Included |
|---|------|-------|-----------|----------|
| 1 | <name> | <paths> | <est> | yes/no |
| ... | ... | ... | ... | ... |

### Behavior
- **Error handling:** <strategy>
- **Edge cases:** <strategy>
- **Offline:** <strategy>

### Acceptance Criteria
- [ ] <criterion>
- [ ] ...

### Gotchas
- <anything flagged during planning>
```

---

## After Writing the Plan

Tell the user:

```
Plan saved to .claude/plans/NNN-<slug>.md

You can:
- Edit the plan directly before proceeding
- Run /orchestrate to execute this plan in a sandbox
- Run /scaffold (project plan) or /workflow (feature plan) to start manually
- Run /plan again to revise
```

If running inside the orchestrator, return the plan path as output so the next skill can consume it.
