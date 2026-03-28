import type { Expense, Income } from "@/types/core";
import {
  COMPOSITE_KEY_SEPARATOR,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  buildCompositeKey,
  findParentBySubKey,
} from "./registry";

// ---------------------------------------------------------------------------
// Migration version
// ---------------------------------------------------------------------------

const MIGRATION_KEY = "ortho-category-migration-version";
const CURRENT_VERSION = 1;

export function getCategoryMigrationVersion(): number {
  try {
    const raw = localStorage.getItem(MIGRATION_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function setCategoryMigrationVersion(version: number): void {
  try {
    localStorage.setItem(MIGRATION_KEY, String(version));
  } catch {
    // Storage unavailable (SSR, tests) — silently ignore
  }
}

export function isMigrationNeeded(): boolean {
  return getCategoryMigrationVersion() < CURRENT_VERSION;
}

// ---------------------------------------------------------------------------
// Known aliases (old flat name → composite key)
// ---------------------------------------------------------------------------

/** Manual alias map for old default categories that don't exactly match a sub key. */
const EXPENSE_ALIASES: Record<string, string> = {
  dining: buildCompositeKey("Food", "Dining Out"),
  amazon: buildCompositeKey("Shopping", "Electronics"),
  mortgage: buildCompositeKey("Home", "Rent/Mortgage"),
  transport: buildCompositeKey("Transport", "Gas/Fuel"),
};

const INCOME_ALIASES: Record<string, string> = {
  paycheck: buildCompositeKey("Income", "Salary"),
  rent: buildCompositeKey("Income", "Rental Income"),
  "side hustle": buildCompositeKey("Income", "Freelance"),
  other: "", // Map "Other" to uncategorized
};

// ---------------------------------------------------------------------------
// Single-category migration
// ---------------------------------------------------------------------------

/**
 * Migrate a single flat category string to a composite key.
 *
 * Strategy (in order):
 * 1. Already composite (contains " > ") → return as-is
 * 2. Empty/whitespace → return ""
 * 3. Known alias (case-insensitive) → return mapped composite key
 * 4. Exact subcategory name match (case-insensitive) → return composite key
 * 5. Exact parent name match (case-insensitive) → return first sub of that parent
 * 6. Unknown → return "" (uncategorized)
 */
export function migrateCategoryString(
  category: string,
  type: "expense" | "income",
): string {
  const trimmed = category.trim();

  // Already composite
  if (trimmed.includes(COMPOSITE_KEY_SEPARATOR)) return trimmed;

  // Empty
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();

  // Known alias
  const aliases = type === "income" ? INCOME_ALIASES : EXPENSE_ALIASES;
  if (lower in aliases) return aliases[lower]!;

  // Exact subcategory match
  const match = findParentBySubKey(trimmed, type);
  if (match) return buildCompositeKey(match.parent.key, match.sub.key);

  // Exact parent match → first sub
  const parents =
    type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const parentMatch = parents.find((p) => p.key.toLowerCase() === lower);
  if (parentMatch && parentMatch.subcategories.length > 0) {
    return buildCompositeKey(
      parentMatch.key,
      parentMatch.subcategories[0]!.key,
    );
  }

  // Unknown → uncategorized
  return "";
}

// ---------------------------------------------------------------------------
// Batch migration
// ---------------------------------------------------------------------------

export interface MigrationResult {
  expenses: Expense[];
  income: Income[];
  expensesMigrated: number;
  incomeMigrated: number;
}

/**
 * Migrate all expenses and income from flat categories to composite keys.
 * Returns new arrays (never mutates originals).
 */
export function migrateCategories(
  expenses: Expense[],
  income: Income[],
): MigrationResult {
  let expensesMigrated = 0;
  let incomeMigrated = 0;

  const migratedExpenses = expenses.map((e) => {
    const newCat = migrateCategoryString(e.category, "expense");
    if (newCat !== e.category) {
      expensesMigrated++;
      return { ...e, category: newCat };
    }
    return e;
  });

  const migratedIncome = income.map((i) => {
    const newCat = migrateCategoryString(i.category, "income");
    if (newCat !== i.category) {
      incomeMigrated++;
      return { ...i, category: newCat };
    }
    return i;
  });

  return {
    expenses: migratedExpenses,
    income: migratedIncome,
    expensesMigrated,
    incomeMigrated,
  };
}
