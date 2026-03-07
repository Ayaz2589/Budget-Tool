---
name: scaffold
description: Scaffold a new project from scratch. Asks about the tech stack, brainstorms architecture from a description, gets approval, then generates the full project with CLAUDE.md and ARCHITECTURE.md.
---

## Input

Arguments: `$ARGUMENTS`

The arguments may contain the project name. If empty, ask the user for a project name.

## Stack

All projects use **Bun + TypeScript**. The only choice is the project type:

| Type | Stack |
|---|---|
| Full-stack app | Next.js + Bun + TypeScript + Tailwind CSS |
| API service | Bun + Hono + TypeScript |

**Fixed tooling (no questions asked):**
- **Runtime / PM:** Bun
- **Language:** TypeScript
- **Testing:** Vitest
- **Linting:** ESLint + Prettier
- **Database:** PostgreSQL (via Prisma) — if needed
- **Auth:** NextAuth + JWT (full-stack) or JWT (API) — if needed

## Instructions

Scaffold a new project from a user description. Follow these steps in order.

### 1. Project setup

Use the AskUserQuestion tool to collect all of the following in a single prompt:

**Question 1 — Project name:**
- If `$ARGUMENTS` is non-empty, use it as the project name (confirm with user).
- Otherwise ask for a name (lowercase, kebab-case).

**Question 2 — Project type:**
- `Full-stack app` — Next.js + Bun + Tailwind (SSR, file-based routing, React)
- `API service` — Bun + Hono (lightweight, fast, API-focused)

**Question 3 — Database:**
- `PostgreSQL` — via Prisma ORM
- `None` — no database

**Question 4 — Auth:**
- `Yes` — NextAuth + JWT (full-stack) or JWT middleware (API)
- `None` — no auth

### 2. Gather application description

Use the AskUserQuestion tool with a single question:

"How would you like to describe the application?"
- `Describe it now` — provide a freeform description in the next prompt
- `Use a spec/plan file` — provide a path to an existing spec, plan, or requirements document

**If "Describe it now":** Ask a follow-up: "Describe what the application should do. Include the main features, target users, and any key integrations."

**If "Use a spec/plan file":** Ask for the file path, then read the file. Extract the application description, features, acceptance criteria, and any architectural decisions already made. Respect decisions in the spec (e.g., if the spec already specifies a data model or API endpoints, use those in step 3 rather than inventing new ones).

### 3. Brainstorm architecture

Based on the project type and application description, produce a structured architecture proposal. Output this directly to the user (do NOT write to a file yet).

The proposal must include:

**System Overview**
- ASCII diagram showing the major components and how they communicate (browser, server, database, external APIs, etc.)
- 1-2 paragraph explanation of the architecture

**Key Domains**
- Identify 3-6 domains/feature areas from the description
- For each: name, 1-sentence description, key entities

**Data Model** (if database selected)
- Table of entities with fields, types, and relationships
- Include join tables for many-to-many relationships

**API Endpoints / Routes**
- Full-stack: Next.js API routes and pages — Method | Path | Description | Auth required
- API service: Hono routes — Method | Path | Description | Auth required
- Group by domain

**Directory Structure**
- Tree showing the proposed project layout
- Annotate key directories with their purpose

**Key Libraries**
- Table of libraries beyond defaults: name, purpose, why chosen

### 4. User approval

Use the AskUserQuestion tool:

"Does this architecture look good?"
- `Approve` — proceed to scaffolding
- `Request changes` — describe what to change (loops back to step 3 with modifications)
- `Start over` — go back to step 1

If the user requests changes, revise the proposal and ask again. Loop until approved.

### 5. Scaffold the project

Execute the following in order. The project directory is `<cwd>/<project-name>/`.

**5.1 — Create project via CLI**

Full-stack app:
```bash
bunx create-next-app@latest <project-name> --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-bun
```

API service:
```bash
mkdir <project-name> && cd <project-name> && bun init -y
```

If the CLI tool already created the directory, work inside it.

**5.2 — Adjust directory structure**

Create additional directories from the approved proposal that the CLI didn't create:

Full-stack app:
- `src/components/`, `src/lib/`, `src/services/`, `src/types/`
- `src/app/api/` subdirectories for API routes
- `tests/`

API service:
- `src/routes/`, `src/middleware/`, `src/services/`, `src/types/`
- `tests/`

Add `.gitkeep` files to empty directories.

**5.3 — Install dependencies**

```bash
cd <project-name>
bun add <runtime-deps>
bun add -D <dev-deps>
```

Always install:
- `vitest` (testing)

If full-stack:
- `prisma` + `@prisma/client` (if database)
- `next-auth` + `@auth/prisma-adapter` (if auth)

If API service:
- `hono`
- `prisma` + `@prisma/client` (if database)
- `jsonwebtoken` + `@types/jsonwebtoken` (if auth)

**5.4 — Create boilerplate files**

Generate starter files that match the approved architecture:
- Route/page files with basic structure
- Database schema (`prisma/schema.prisma`) if database selected
- API route handlers returning placeholder responses
- Layout and shared components (full-stack)
- Middleware files (API service)

Keep boilerplate minimal — just enough structure to show the pattern. Do NOT implement full business logic.

**5.5 — Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'jsdom' for full-stack
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Add a single passing test at `tests/example.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('example', () => {
  it('works', () => {
    expect(true).toBe(true)
  })
})
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**5.6 — Configure linting**

Do not overwrite ESLint/Prettier config if `create-next-app` already created it. Only add missing config.

For API service, create minimal ESLint + Prettier config:
- `.eslintrc.json` with TypeScript rules
- `.prettierrc` with sensible defaults
- Add `lint` and `format` scripts to `package.json`

**5.7 — Generate Docker files (if database selected)**

`Dockerfile`:
```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["bun", "run", "start"]
```

`docker-compose.yml`:
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/<project-name>

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: <project-name>
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  db_data:
```

**5.8 — Generate CLAUDE.md**

Create `CLAUDE.md` in the project root:

```markdown
# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

<1-2 sentence description from the approved architecture>

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — how the system works

## Commands

```bash
bun run dev           # Start dev server
bun run build         # Production build
bun run test          # Run tests
bun run test:watch    # Run tests in watch mode
bun run lint          # Lint
```

## Code Style

- **Runtime:** Bun
- **Language:** TypeScript (strict)
- **Framework:** <Next.js or Hono>
- **No `any` types** in new code

## Key Constraints

<Constraints derived from the architecture>
```

**5.9 — Generate ARCHITECTURE.md**

Create `ARCHITECTURE.md` in the project root using the approved architecture proposal from step 3. Follow the `/audit` template structure:

- System Overview (with ASCII diagram)
- Tech Stack (table with versions)
- Directory Structure (tree)
- Data Layer (Prisma models, relationships — if database)
- Key Patterns (conventions established by the scaffold)
- Domain Flows (from the key domains)
- Configuration (env vars, config files)

**5.10 — Generate standard files**

`.gitignore`:
```
node_modules/
.next/
dist/
build/
*.tsbuildinfo
.env
.env.local
.env*.local
.claude/
.idea/
.vscode/
*.sw?
```

`README.md`:
```markdown
# <project-name>

<1-sentence description>

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.x)
<- Docker (if database)>

### Installation
```bash
bun install
```

### Development
```bash
bun run dev
```

### Testing
```bash
bun run test
```
```

`.env.example` — List all required environment variables with placeholder values.

**5.11 — Initialize git**

```bash
cd <project-name>
git init
git add -A
git commit -m "Initial scaffold: <Next.js or Hono> + Bun + TypeScript

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

### 6. Design system (Full-stack only)

Skip this step for API services (no UI).

Use the AskUserQuestion tool:

"Would you like to generate a design system for this project?"
- `Yes` — set up the visual identity now
- `Skip` — I'll run `/design system` later

**If "Yes":** Run the `/design system` skill logic within the new project directory. This generates:
- `tailwind.config.ts` (extended with OKLCH tokens, custom type scale, spacing)
- `src/styles/globals.css` (font imports, CSS custom properties, dark mode, reduced motion)
- `src/styles/design-system.ts` (exportable tokens)
- `src/components/ui/` (Button, Card, Input, Badge, Typography, Skeleton)

After the design system is written, commit:
```bash
git add -A
git commit -m "feat: add design system

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**If "Skip":** Tell the user: "Run `/design system` when you're ready to establish the visual identity."

### 7. Report

Output a summary:

```
## Project Scaffolded

**Name:** <project-name>
**Location:** <full-path>
**Type:** <Full-stack app or API service>

### Files Created

<tree output of the project directory, 2 levels deep>

### Stack

| Category | Choice |
|---|---|
| Runtime | Bun |
| Framework | <Next.js or Hono> |
| Language | TypeScript |
| Testing | Vitest |
| Styling | <Tailwind CSS or N/A> |
| Database | <PostgreSQL (Prisma) or None> |
| Auth | <NextAuth + JWT / JWT / None> |
| Linting | ESLint + Prettier |

### Design System
<Generated / Skipped>

### Next Steps

1. `cd <project-name>`
2. Review and customize `CLAUDE.md`
3. Copy `.env.example` to `.env` and fill in values
4. `bun run dev` to start the dev server
5. `bun run test` to run the example test
<6. Run `/design system` to set up the visual identity (if skipped)>
```
