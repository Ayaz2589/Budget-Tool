import { test, expect } from "bun:test";
import {
  applyRulesToExpense,
  applyRulesToExpenses,
  applyBaselineToExpense,
  applyBaselineToExpenses,
  type CategoryRule,
} from "@/lib/categoryRules";
import type { Expense } from "@/lib/types";

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "1",
    date: "2025-01-15",
    amount: 10,
    description: "Coffee",
    category: "",
    source: "manual",
    ...overrides,
  };
}

test("applyRulesToExpense leaves category when already set", () => {
  const e = expense({ category: "50/50" });
  const rules: CategoryRule[] = [
    { id: "r1", pattern: "Coffee", category: "My Purchase", type: "expense" },
  ];
  expect(applyRulesToExpense(e, rules)).toEqual(e);
});

test("applyRulesToExpense applies first matching rule", () => {
  const e = expense({ description: "Uber Eats lunch" });
  const rules: CategoryRule[] = [
    { id: "r1", pattern: "uber eats", category: "50/50", type: "expense" },
  ];
  const out = applyRulesToExpense(e, rules);
  expect(out.category).toBe("50/50");
});

test("applyRulesToExpense ignores income rules", () => {
  const e = expense({ description: "Paycheck" });
  const rules: CategoryRule[] = [
    { id: "r1", pattern: "paycheck", category: "Paycheck", type: "income" },
  ];
  expect(applyRulesToExpense(e, rules).category).toBe("");
});

test("applyRulesToExpenses maps over array", () => {
  const expenses = [
    expense({ description: "A" }),
    expense({ description: "B" }),
  ];
  const rules: CategoryRule[] = [
    { id: "r1", pattern: "a", category: "X", type: "expense" },
  ];
  const out = applyRulesToExpenses(expenses, rules);
  expect(out[0]!.category).toBe("X");
  expect(out[1]!.category).toBe("");
});

test("applyBaselineToExpense leaves category when set", () => {
  const e = expense({ category: "50/50" });
  expect(applyBaselineToExpense(e).category).toBe("50/50");
});

test("applyBaselineToExpense: chase → Amazon", () => {
  const e = expense({ source: "chase", category: "" });
  expect(applyBaselineToExpense(e).category).toBe("Amazon");
});

test("applyBaselineToExpense: apple → My Purchase", () => {
  const e = expense({ source: "apple", category: "" });
  expect(applyBaselineToExpense(e).category).toBe("My Purchase");
});

test("applyBaselineToExpense: TASNUVA AHMED → Tasnuva's Purchases", () => {
  const e = expense({ cardMember: "TASNUVA AHMED", category: "" });
  expect(applyBaselineToExpense(e).category).toBe("Tasnuva's Purchases");
});

test("applyBaselineToExpense: UBER EATS small amount not Tasnuva → My Purchase", () => {
  const e = expense({
    description: "UBER EATS",
    cardMember: "AYAZ",
    amount: 20,
    category: "",
  });
  expect(applyBaselineToExpense(e).category).toBe("My Purchase");
});

test("applyBaselineToExpenses maps over array", () => {
  const expenses = [
    expense({ source: "chase", category: "" }),
    expense({ source: "apple", category: "" }),
  ];
  const out = applyBaselineToExpenses(expenses);
  expect(out[0]!.category).toBe("Amazon");
  expect(out[1]!.category).toBe("My Purchase");
});
