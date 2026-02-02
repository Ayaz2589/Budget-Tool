import type {
  Rule,
  RuleCondition,
  RuleAction,
  RuleContext,
  RuleExpense,
} from "@/types/rules";

export type { Rule, RuleCondition, RuleAction, RuleContext, RuleExpense };

const DEFAULT_MATCH = "contains" as const;

function normalize(text: string): string {
  return text.trim().toUpperCase();
}

function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function computeTotalsByCategoryForMonth(
  expenses: RuleExpense[],
  monthKey: string
): Record<string, number> {
  return expenses.reduce<Record<string, number>>((acc, expense) => {
    if (expense.date.slice(0, 7) !== monthKey) return acc;
    const key = expense.category || "";
    acc[key] = (acc[key] ?? 0) + expense.amount;
    return acc;
  }, {});
}

export function generateRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function evaluateCondition(
  condition: RuleCondition,
  expense: RuleExpense,
  context: RuleContext = {}
): boolean {
  switch (condition.type) {
    case "source":
      return expense.source === condition.value;
    case "cardMember": {
      if (!expense.cardMember) return false;
      const haystack = normalize(expense.cardMember);
      const needle = normalize(condition.value);
      const match = condition.match ?? DEFAULT_MATCH;
      return match === "equals" ? haystack === needle : haystack.includes(needle);
    }
    case "expenseAmount": {
      if (condition.operator === "lt") return expense.amount < condition.value;
      if (condition.operator === "gte") return expense.amount >= condition.value;
      if (condition.operator === "between") {
        if (typeof condition.valueMax !== "number") return false;
        return (
          expense.amount >= condition.value && expense.amount <= condition.valueMax
        );
      }
      return false;
    }
    case "categoryTotal": {
      const currentMonthKey = context.currentMonthKey ?? getCurrentMonthKey();
      if (expense.date.slice(0, 7) !== currentMonthKey) return false;
      const totalsByCategory = context.totalsByCategory ?? {};
      const total = totalsByCategory[condition.category] ?? 0;
      return condition.operator === "lt"
        ? total < condition.value
        : total >= condition.value;
    }
    default:
      return false;
  }
}

function evaluateCategoryTotalCondition(
  condition: Extract<RuleCondition, { type: "categoryTotal" }>,
  totalsByCategory: Record<string, number>
): boolean {
  const total = totalsByCategory[condition.category] ?? 0;
  return condition.operator === "lt"
    ? total < condition.value
    : total >= condition.value;
}

export function applyRulesToExpense<T extends RuleExpense>(
  expense: T,
  rules: Rule[],
  context: RuleContext = {}
): T {
  if (expense.category) return expense;
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (!evaluateCondition(rule.condition, expense, context)) continue;
    if (rule.action.type === "setCategory") {
      return { ...expense, category: rule.action.value };
    }
  }
  return expense;
}

export function applyRulesToExpenses<T extends RuleExpense>(
  expenses: T[],
  rules: Rule[],
  context: RuleContext = {}
): T[] {
  if (rules.length === 0) return expenses;
  const needsCategoryTotals = rules.some(
    (rule) => rule.enabled && rule.condition.type === "categoryTotal"
  );
  const currentMonthKey = context.currentMonthKey ?? getCurrentMonthKey();
  const totalsByCategory =
    context.totalsByCategory ??
    (needsCategoryTotals
      ? computeTotalsByCategoryForMonth(expenses, currentMonthKey)
      : undefined);
  const nextContext: RuleContext = {
    ...context,
    currentMonthKey,
    totalsByCategory,
  };
  return expenses.map((expense) =>
    applyRulesToExpense(expense, rules, nextContext)
  );
}

export function getDashboardWarnings(
  expenses: RuleExpense[],
  rules: Rule[],
  currentMonthKey: string = getCurrentMonthKey()
): string[] {
  if (rules.length === 0) return [];
  const totalsByCategory = computeTotalsByCategoryForMonth(
    expenses,
    currentMonthKey
  );
  return rules
    .filter(
      (rule) =>
        rule.enabled &&
        rule.action.type === "showWarning" &&
        rule.condition.type === "categoryTotal"
    )
    .filter((rule) =>
      evaluateCategoryTotalCondition(
        rule.condition as Extract<RuleCondition, { type: "categoryTotal" }>,
        totalsByCategory
      )
    )
    .map((rule) =>
      (rule.action as Extract<RuleAction, { type: "showWarning" }>).message
        .trim()
    )
    .filter((message) => message.length > 0);
}
