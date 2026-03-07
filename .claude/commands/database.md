---
name: database
description: Manage Prisma database schema, migrations, and seeding. Design models interactively, generate migrations, create realistic seed data, and reset the database.
---

## Input

Arguments: `$ARGUMENTS`

Supported commands:
- `/database` — interactive mode (asks what to do)
- `/database model` — design or modify a model
- `/database migrate` — generate and run a migration
- `/database seed` — create or update seed data
- `/database reset` — reset database and re-seed
- `/database studio` — open Prisma Studio
- `/database status` — show current schema and migration status

## Stack

This skill assumes the project uses:
- **Bun** as runtime and package manager
- **Prisma** as ORM
- **PostgreSQL** as database
- **TypeScript**

## Safety Principles

**Be stringent with schema changes.** Before applying any change, evaluate its impact on existing data:

- **Dropping columns/models:** Warn the user that this will permanently delete data. Suggest renaming or soft-deleting instead. Do NOT proceed without explicit confirmation and a stated reason.
- **Changing field types:** Flag potential data loss (e.g., `String` → `Int`, `Float` → `Int`, narrowing enums). Propose a migration strategy if data exists.
- **Removing relations:** Explain what happens to orphaned records. Suggest cascading rules or cleanup steps.
- **Making nullable fields required:** Flag that existing rows with NULL will cause the migration to fail. Require a default value or backfill strategy.
- **Renaming fields/models:** Prisma treats renames as drop + create. Warn that this deletes data unless a custom migration SQL is written.
- **Resetting the database:** Always confirm. In production-like environments, refuse and suggest `migrate dev` instead.

If you believe a requested change will cause data loss, corruption, or integrity issues, **push back on the user**. Explain the risk clearly and propose a safer alternative. Only proceed with destructive changes after the user explicitly acknowledges the risk.

## Instructions

### 0. Verify setup

Check that Prisma is configured in the project:

1. Look for `prisma/schema.prisma` in the project root.
2. If missing, ask the user: "No Prisma schema found. Want me to set up Prisma?"
   - If yes:
     ```bash
     bun add prisma @prisma/client
     bunx prisma init --datasource-provider postgresql
     ```
   - If no: stop.

3. Check `.env` for `DATABASE_URL`. If missing, warn the user: "No DATABASE_URL found in .env. Add your PostgreSQL connection string to continue."

Read `prisma/schema.prisma` to understand the current data model.

### 1. Determine action

If `$ARGUMENTS` matches a command (`model`, `migrate`, `seed`, `reset`, `studio`, `status`), go to that section.

If `$ARGUMENTS` is empty or unrecognized, use the AskUserQuestion tool:

"What would you like to do?"
- `Design a model` — create or modify a Prisma model
- `Run migration` — generate and apply a migration
- `Seed database` — create or update seed data
- `Reset database` — drop all data, re-migrate, re-seed
- `Open Studio` — launch Prisma Studio in browser
- `Show status` — current schema summary and migration status

---

### Action: Design a model

Use the AskUserQuestion tool to collect in a single prompt:

**Question 1 — Operation:**
- `Create new model` — design a single new model from scratch
- `Modify existing model` — add/change/remove fields on an existing model
- `Full schema from spec` — generate the entire schema from a spec/plan/doc file

**Question 2 (if "Create new model" or "Modify existing model"):**
"Describe the model (or changes). Example: 'A Product model with name, price, description, and a relation to Category' or 'Add an email field to User'"

**Question 2 (if "Full schema from spec"):**
"Provide the path to your spec, plan, or documentation file (e.g., `.claude/plans/001-data-model.md`, `specs/schema.md`, `PRD.md`)"

---

**If "Full schema from spec":**

1. Read the spec file provided by the user.
2. Read the current `prisma/schema.prisma`.
3. Extract all models, fields, types, relationships, enums, and constraints from the spec. Look for:
   - Entity/model definitions (tables, classes, types)
   - Field names, types, nullability, defaults
   - Relationships (1:1, 1:N, N:N with join tables)
   - Enums and status fields
   - Indexes and unique constraints
   - Any notes about cascading deletes, soft deletes, or audit fields
4. Translate the full spec into a complete Prisma schema. Add standard fields the spec may not mention:
   - `id` using `@id @default(cuid())`
   - `createdAt` and `updatedAt` timestamps
   - Indexes on all foreign key fields
5. Present the **complete proposed schema** to the user, organized by domain/feature area.
6. Ask for approval:
   - `Approve` — write the full schema
   - `Request changes` — describe what to adjust (loop until approved)
   - `Cancel` — stop
7. On approval, write the complete `prisma/schema.prisma`.
8. Ask: "Generate migration and seed data now?"
   - If yes, run **Action: Run migration**, then **Action: Seed database**.
   - If no, tell the user: "Run `/database migrate` then `/database seed` when ready."

Skip to step 5 below for the remaining single-model flow.

---

**If "Create new model" or "Modify existing model":**

1. Read the current `prisma/schema.prisma`.
2. Based on the description, generate the Prisma model definition. For new models, propose:
   - Model name (PascalCase)
   - Fields with types (`String`, `Int`, `Float`, `Boolean`, `DateTime`, `Json`, etc.)
   - `id` field using `@id @default(cuid())`
   - `createdAt` and `updatedAt` timestamps
   - Relations with `@relation` directives
   - Indexes with `@@index` where appropriate
   - Enums if needed

3. Present the proposed schema change to the user:
   ```prisma
   model Product {
     id          String   @id @default(cuid())
     name        String
     price       Float
     description String?
     categoryId  String
     category    Category @relation(fields: [categoryId], references: [id])
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     @@index([categoryId])
   }
   ```

4. Ask for approval:
   - `Approve` — write to schema
   - `Request changes` — modify and re-propose
   - `Cancel` — stop

5. On approval, update `prisma/schema.prisma` with the new/modified model.

6. Ask: "Generate and apply migration now?"
   - If yes, go to **Action: Run migration**.
   - If no, tell the user: "Run `/database migrate` when ready."

---

### Action: Run migration

1. Read `prisma/schema.prisma` to confirm there are pending changes.

2. Ask the user for a migration name (short, descriptive, snake_case). Suggest one based on recent schema changes (e.g., `add_product_model`, `add_email_to_user`).

3. Generate the migration:
   ```bash
   bunx prisma migrate dev --name <migration-name>
   ```

4. If the migration fails, read the error and help the user fix it. Common issues:
   - Missing `DATABASE_URL` — remind to check `.env`
   - Destructive changes — Prisma will warn. Ask user to confirm.
   - Relation conflicts — help fix the schema.

5. After successful migration, regenerate the Prisma client:
   ```bash
   bunx prisma generate
   ```

6. Report:
   ```
   ## Migration Applied

   **Name:** <migration-name>
   **File:** prisma/migrations/<timestamp>_<name>/migration.sql
   **Changes:** <summary of what changed>
   ```

---

### Action: Seed database

1. Read `prisma/schema.prisma` to understand all models, fields, types, and relations.

2. Check if `prisma/seed.ts` exists.

**If it does NOT exist:**

Create `prisma/seed.ts` with realistic seed data for all models. Follow these rules:

- Import `PrismaClient` from `@prisma/client`
- Create records in dependency order (referenced models first)
- Use `upsert` with a stable identifier so seeds are idempotent
- Generate realistic data (real-looking names, emails, descriptions — not "test1", "foo", "bar")
- Create enough records to be useful: 3-5 per model minimum, more for models that benefit from volume
- Handle relations by creating parent records first, then children with correct foreign keys
- Wrap in a `main()` async function with proper error handling

Template:
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create in dependency order
  const category = await prisma.category.upsert({
    where: { id: 'seed-category-1' },
    update: {},
    create: {
      id: 'seed-category-1',
      name: 'Electronics',
    },
  })

  // ... more records

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Add the seed command to `package.json`:
```json
{
  "prisma": {
    "seed": "bun run prisma/seed.ts"
  }
}
```

**If it exists:**

Read the current seed file and the current schema. Identify:
- New models not yet seeded
- Existing models with new required fields
- Removed models still being seeded

Ask the user:
- `Update seed file` — add seeds for new models, update existing ones
- `Regenerate from scratch` — rewrite the entire seed file
- `Keep as-is` — no changes

3. Run the seed:
   ```bash
   bunx prisma db seed
   ```

4. Report:
   ```
   ## Database Seeded

   **Records created:**
   | Model | Count |
   |---|---|
   | Category | 5 |
   | Product | 12 |
   | User | 3 |
   ```

---

### Action: Reset database

**This is destructive.** Confirm with the user first:

"This will drop all data, re-run all migrations, and re-seed. Continue?"
- `Yes` — proceed
- `No` — cancel

If confirmed:
```bash
bunx prisma migrate reset --force
```

This runs all migrations from scratch and executes the seed file if configured.

Report:
```
## Database Reset

All tables dropped, migrations re-applied, and seed data loaded.
```

---

### Action: Open Studio

```bash
bunx prisma studio
```

Tell the user: "Prisma Studio is running at http://localhost:5555"

---

### Action: Show status

1. Read `prisma/schema.prisma` and summarize:
   - List of models with field counts
   - Enums defined
   - Relations between models

2. Check migration status:
   ```bash
   bunx prisma migrate status
   ```

3. Output:
   ```
   ## Database Status

   ### Models
   | Model | Fields | Relations |
   |---|---|---|
   | User | 8 | Post (1:N), Profile (1:1) |
   | Post | 6 | User (N:1), Tag (N:N) |

   ### Enums
   - Role: ADMIN, USER
   - Status: DRAFT, PUBLISHED, ARCHIVED

   ### Migration Status
   <output from prisma migrate status>
   ```
