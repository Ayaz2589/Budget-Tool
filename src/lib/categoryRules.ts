import type { Expense } from "@/lib/types";

export type RuleType = "expense" | "income";

export interface CategoryRule {
  id: string;
  pattern: string;
  category: string;
  type: RuleType;
}

function matchesRule(description: string, pattern: string): boolean {
  const desc = description.toLowerCase();
  const pat = pattern.toLowerCase().trim();
  return desc.includes(pat);
}

export function applyRulesToExpense(
  expense: Expense,
  rules: CategoryRule[]
): Expense {
  if (expense.category) return expense;
  for (const rule of rules) {
    if (rule.type !== "expense") continue;
    if (matchesRule(expense.description, rule.pattern)) {
      return { ...expense, category: rule.category };
    }
  }
  return expense;
}

export function applyRulesToExpenses(
  expenses: Expense[],
  rules: CategoryRule[]
): Expense[] {
  return expenses.map((e) => applyRulesToExpense(e, rules));
}

/** Baseline rules (only if still uncategorized). */
export function applyBaselineToExpense(expense: Expense): Expense {
  if (expense.category) return expense;
  // Chase (Amazon card) → Amazon
  if (expense.source === "chase") {
    return { ...expense, category: "Amazon" };
  }
  // Apple Card → My Purchase
  if (expense.source === "apple") {
    return { ...expense, category: "My Purchase" };
  }
  // Card Member TASNUVA AHMED → Tasnuva's Purchases
  if (expense.cardMember?.toUpperCase() === "TASNUVA AHMED") {
    return { ...expense, category: "Tasnuva's Purchases" };
  }
  // UBER EATS + not Tasnuva + amount < $25 → My Purchase
  if (
    expense.description.toUpperCase().includes("UBER EATS") &&
    expense.cardMember?.toUpperCase() !== "TASNUVA AHMED" &&
    expense.amount < 25
  ) {
    return { ...expense, category: "My Purchase" };
  }
  return expense;
}

export function applyBaselineToExpenses(expenses: Expense[]): Expense[] {
  return expenses.map((e) => applyBaselineToExpense(e));
}

export function generateRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Built-in rules shown in the UI (read-only, not removable). */
export const BASELINE_RULES_READONLY: { id: string; pattern: string; category: string }[] = [
  { id: "baseline-chase", pattern: "Source: Chase", category: "Amazon" },
  { id: "baseline-apple", pattern: "Source: Apple Card", category: "My Purchase" },
  { id: "baseline-tasnuva", pattern: "Card member: TASNUVA AHMED", category: "Tasnuva's Purchases" },
  { id: "baseline-uber", pattern: "UBER EATS (amount < $25, not Tasnuva)", category: "My Purchase" },
];
