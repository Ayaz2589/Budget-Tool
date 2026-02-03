import { test, expect } from "bun:test";
import {
  applyRulesToExpense,
  applyRulesToExpenses,
  getDashboardWarnings,
  type Rule,
} from "@/lib/rules";
import type { Expense } from "@/lib/types";

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "e1",
    date: "2025-01-15",
    amount: 10,
    description: "Coffee",
    category: "",
    source: "manual",
    ...overrides,
  };
}

test("applyRulesToExpense respects enabled rules and sets category", () => {
  const e = expense({ source: "chase" });
  const rules: Rule[] = [
    {
      id: "r1",
      enabled: true,
      condition: { type: "source", value: "chase" },
      action: { type: "setCategory", value: "Amazon" },
    },
  ];
  const out = applyRulesToExpense(e, rules);
  expect(out.category).toBe("Amazon");
});

test("applyRulesToExpense skips when category already set", () => {
  const e = expense({ category: "50/50", source: "chase" });
  const rules: Rule[] = [
    {
      id: "r1",
      enabled: true,
      condition: { type: "source", value: "chase" },
      action: { type: "setCategory", value: "Amazon" },
    },
  ];
  expect(applyRulesToExpense(e, rules).category).toBe("50/50");
});

test("applyRulesToExpenses supports owner contains", () => {
  const expenses = [expense({ owner: "TASNUVA AHMED" })];
  const rules: Rule[] = [
    {
      id: "r1",
      enabled: true,
      condition: {
        type: "owner",
        value: "tasnuva",
        match: "contains",
      },
      action: { type: "setCategory", value: "Tasnuva's Purchases" },
    },
  ];
  const out = applyRulesToExpenses(expenses, rules);
  expect(out[0]!.category).toBe("Tasnuva's Purchases");
});

test("applyRulesToExpenses supports amount between", () => {
  const expenses = [expense({ amount: 55 })];
  const rules: Rule[] = [
    {
      id: "r1",
      enabled: true,
      condition: {
        type: "expenseAmount",
        operator: "between",
        value: 50,
        valueMax: 60,
      },
      action: { type: "setCategory", value: "My Purchase" },
    },
  ];
  const out = applyRulesToExpenses(expenses, rules);
  expect(out[0]!.category).toBe("My Purchase");
});

test("applyRulesToExpenses supports category total threshold", () => {
  const monthKey = "2025-01";
  const expenses = [
    expense({
      id: "e1",
      category: "50/50",
      amount: 2100,
      date: "2025-01-10",
    }),
    expense({ id: "e2", category: "", amount: 5, date: "2025-01-11" }),
  ];
  const rules: Rule[] = [
    {
      id: "r1",
      enabled: true,
      condition: {
        type: "categoryTotal",
        category: "50/50",
        operator: "gte",
        value: 2000,
        period: "current_month",
      },
      action: { type: "setCategory", value: "50/50" },
    },
  ];
  const out = applyRulesToExpenses(expenses, rules, {
    currentMonthKey: monthKey,
    totalsByCategory: { "50/50": 2100 },
  });
  expect(out[1]!.category).toBe("50/50");
});

test("getDashboardWarnings returns warning messages for category thresholds", () => {
  const rules: Rule[] = [
    {
      id: "r1",
      enabled: true,
      condition: {
        type: "categoryTotal",
        category: "50/50",
        operator: "gte",
        value: 2000,
        period: "current_month",
      },
      action: { type: "showWarning", message: "Over limit" },
    },
  ];
  const warnings = getDashboardWarnings(
    [expense({ category: "50/50", amount: 2100 })],
    rules,
    "2025-01",
  );
  expect(warnings).toEqual(["Over limit"]);
});
