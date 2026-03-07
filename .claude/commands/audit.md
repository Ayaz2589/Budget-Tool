## Input

The project to audit is: `$ARGUMENTS`

## Validation

1. If `$ARGUMENTS` is empty or blank, tell the user: "Please specify a project to audit. Usage: `/audit <project>` (e.g., `/audit storefront_v2`, `/audit admin_dashboard_v2`)" — then STOP.
2. Check if the directory exists at the monorepo root: `<monorepo_root>/$ARGUMENTS/`. If it does not exist, tell the user: "Project `$ARGUMENTS` not found in the monorepo." — then STOP.

## Instructions

You are auditing the `$ARGUMENTS` project by comparing its `ARCHITECTURE.md` against the actual codebase.

### Step 1: Check for ARCHITECTURE.md

Look for `<monorepo_root>/$ARGUMENTS/ARCHITECTURE.md`.

**If it does NOT exist:**
- Tell the user: "No ARCHITECTURE.md found for `$ARGUMENTS`. Creating one now."
- Thoroughly explore the `$ARGUMENTS/` codebase: routes, models, services, components, config files, package.json, tests.
- Generate a comprehensive `ARCHITECTURE.md` for the project using the template structure below, adapted to this project's actual stack and patterns. Only include sections that are relevant — omit sections that don't apply to the project.
- Write it to `<monorepo_root>/$ARGUMENTS/ARCHITECTURE.md`.
- Then proceed to Step 2 with the newly created file.

**ARCHITECTURE.md Template Structure:**

Only include sections that are relevant to the project. Omit sections that don't apply.

```markdown
# <Project Name> Architecture

<1-2 sentence description of what the project does and how it fits in the monorepo.>

## Table of Contents

<Auto-generate based on included sections>

---

## System Overview

<ASCII diagram showing the high-level architecture: what components exist, how they communicate, what external services they depend on.>

<Paragraph explaining the diagram: framework, deployment model, key integrations.>

---

## Tech Stack

<Table of core technologies with versions: language, framework, ORM/DB client, UI library, state management, testing, etc.>

---

## Directory Structure

<Tree showing the top-level directory layout with brief descriptions of each directory's purpose.>

---

## Data Layer

<How the project reads and writes data. This could be:>
<- Database models, ORM patterns, mixins, enums (for backend/full-stack projects)>
<- API clients, fetch wrappers, cache strategies (for frontend projects consuming APIs)>
<- Both (for full-stack projects)>

<Include model relationship diagrams, enum value tables, response shape conventions as applicable.>

---

## Key Patterns

<The important architectural patterns and conventions that a developer needs to understand to work in this codebase. Examples:>
<- Component architecture (design system, wrapper pattern, page structure)>
<- State management approach>
<- Auth flow and token handling>
<- Error handling strategy>
<- Naming conventions>
<- Rendering/caching strategy>
<- Multi-tenancy scoping>
<- Event-driven flows>

<Organize into subsections as needed. Be specific — show code shapes, diagrams, and tables rather than abstract descriptions.>

---

## Domain Flows

<For each major domain/feature area, document the end-to-end flow:>

### N. <Domain Name>

**Data model:**

<Diagram or description of the models/types involved.>

**Flow:**

<Numbered steps showing how data moves through the system for this domain.>

**Key decisions:**

<Bullet points on important architectural choices.>

---

## Configuration

<Key config files, environment variables, build settings, and deployment configuration that affect how the project runs.>

---

## File Reference

<Tables mapping key directories and files to their contents, organized by layer or concern.>
```

**If it exists:**
- Read it and proceed to Step 2.

### Step 2: Run the audit

Systematically compare every claim in `ARCHITECTURE.md` against the actual codebase. Use parallel exploration agents for speed when checking independent sections.

**Check these categories:**

#### A. Structural Accuracy
- Do all referenced files and directories actually exist?
- Do referenced components, functions, types, and modules exist with the names and locations stated?
- Are import paths and aliases correct?
- Is the directory structure described in the file reference accurate?

#### B. API and Route Accuracy
- Do the documented API endpoints match the actual route definitions?
- Are HTTP methods, auth requirements, and parameter descriptions correct?
- Do documented request/response shapes match actual schemas?
- Are any endpoints missing from the docs or documented but not implemented?

#### C. Model and Schema Accuracy
- Do documented database models match actual model definitions?
- Are relationships (FK, M:N junctions) described correctly?
- Are enum values and status codes accurate?
- Are any models missing from the docs?

#### D. Pattern and Convention Accuracy
- Does the documented component pattern (e.g., local-ui wrapper pattern, PageClient/PageView) match reality?
- Are naming conventions described correctly?
- Is the auth flow described correctly?
- Is the state management approach described correctly?

#### E. Configuration Accuracy
- Do documented config values (cache headers, font setup, image domains, rewrites) match actual config files?
- Are package versions accurate?
- Are documented commands (build, test, sync) correct?

#### F. Areas of Improvement
- Dead code: unused exports, unreachable branches, orphaned files
- Missing tests for critical paths
- Inconsistent patterns (e.g., some pages follow conventions, others don't)
- Missing error handling on API boundaries
- Outdated dependencies or deprecated API usage

#### G. Critical Bugs
- Security issues: exposed secrets, missing auth checks, injection vectors
- Data integrity: missing validation, race conditions, unhandled edge cases
- Runtime errors: type mismatches, null reference risks, missing null checks
- Logic errors: incorrect calculations, wrong status transitions, broken flows

### Step 3: Output the audit report

Present findings in this format:

```
# Audit Report: <project>

## Summary
<1-2 sentence overall assessment>

## Inconsistencies (ARCHITECTURE.md vs. Codebase)
| # | Section | Claim in Docs | Actual in Code | Severity |
|---|---------|---------------|----------------|----------|
| 1 | ...     | ...           | ...            | High/Med/Low |

## Missing from Documentation
- <things in the codebase not covered by ARCHITECTURE.md>

## Areas of Improvement
| # | Category | Description | Location | Impact |
|---|----------|-------------|----------|--------|
| 1 | ...      | ...         | ...      | High/Med/Low |

## Critical Bugs
| # | Description | Location | Risk | Suggested Fix |
|---|-------------|----------|------|---------------|
| 1 | ...         | ...      | ...  | ...           |

## Recommendations
1. <prioritized list of actions>
```

If ARCHITECTURE.md was just created in Step 1, note that in the summary and skip the Inconsistencies section (since the doc was just generated from the codebase).

### Step 4: Update ARCHITECTURE.md

Based on the audit findings from Step 2, update the project's `ARCHITECTURE.md` to fix any inconsistencies found:

- **Fix inaccuracies:** Correct file paths, component names, endpoint definitions, enum values, model relationships, config values, or any other claims that don't match the codebase.
- **Add missing documentation:** Add sections or entries for undocumented endpoints, models, components, patterns, or config that were discovered during the audit.
- **Remove stale references:** Delete documentation for files, endpoints, or patterns that no longer exist in the codebase.
- **Do NOT add speculative content:** Only document what actually exists in the code. Don't add TODOs, aspirational patterns, or planned features.
- **Preserve structure:** Keep the same markdown structure and formatting conventions. Don't reorganize sections unless necessary to accommodate new content.

After making changes, tell the user what was updated in ARCHITECTURE.md with a brief summary of edits. If no changes were needed, say "ARCHITECTURE.md is up to date — no changes needed."
