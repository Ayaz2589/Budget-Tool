import { test, expect } from "bun:test";
import { buildExpandedPayload, parseBudgetJson } from "@/lib/jsonExport";
import type { ExpandedPayload } from "@/types/payload";

test("buildExpandedPayload returns expected shape and parseBudgetJson roundtrips", () => {
  const payload = buildExpandedPayload(
    [
      {
        id: "exp-1",
        date: "2025-01-01",
        amount: 10,
        description: "Coffee",
        category: "Food",
        source: "manual",
      },
    ],
    [
      {
        id: "inc-1",
        date: "2025-01-02",
        amount: 100,
        description: "Paycheck",
        category: "Paycheck",
      },
    ],
    [
      {
        id: "debt-1",
        name: "Loan",
        initialAmount: 500,
        startDate: "2024-12-01",
      },
    ],
    [
      {
        id: "pay-1",
        debtId: "debt-1",
        date: "2025-01-15",
        amount: 50,
      },
    ],
    [
      {
        id: "pt-1",
        source: "manual",
        description: "Preset",
        category: "Food",
        owner: "",
      },
    ],
    [{ name: "Food", color: "#fff" }],
    [{ name: "Paycheck", color: "#000" }],
    ["Alex"],
    ["amex"],
  );

  const parsed = parseBudgetJson(JSON.stringify(payload)) as ExpandedPayload;
  expect(parsed.expenses[0]?.id).toBe("exp-1");
  expect(parsed.income[0]?.id).toBe("inc-1");
  expect(parsed.debts[0]?.id).toBe("debt-1");
  expect(parsed.debtPayments[0]?.id).toBe("pay-1");
  expect(parsed.presetTransactions[0]?.id).toBe("pt-1");
  expect(parsed.expenseCategoriesWithColors?.[0]?.name).toBe("Food");
  expect(parsed.incomeCategoriesWithColors?.[0]?.name).toBe("Paycheck");
  expect(parsed.owners?.[0]).toBe("Alex");
  expect(parsed.cardSources?.[0]).toBe("amex");
});
