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

export function generateRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
