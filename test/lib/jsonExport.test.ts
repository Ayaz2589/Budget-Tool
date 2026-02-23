import { test, expect, mock } from "bun:test";
import {
  buildExpandedPayload,
  downloadBudgetJson,
  parseBudgetJson,
} from "@/lib/export/jsonExport";
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

test("parseBudgetJson throws on invalid JSON", () => {
  expect(() => parseBudgetJson("{")).toThrow();
});

test("downloadBudgetJson creates object URL and clicks anchor", () => {
  const createObjectURL = mock(() => "blob:test");
  const revokeObjectURL = mock(() => {});
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;

  const click = mock(() => {});
  const originalCreateElement = document.createElement.bind(document);
  const createElementMock = mock((tag: string) => {
    const el = originalCreateElement(tag);
    if (tag === "a") {
      (el as HTMLAnchorElement).click = click as unknown as () => void;
    }
    return el;
  });
  document.createElement = createElementMock as unknown as typeof document.createElement;

  downloadBudgetJson({
    expenses: [],
    income: [],
    debts: [],
    debtPayments: [],
    presetTransactions: [],
    expenseCategoriesWithColors: [],
    incomeCategoriesWithColors: [],
    owners: [],
    cardSources: [],
  });

  expect(createObjectURL).toHaveBeenCalledTimes(1);
  expect(click).toHaveBeenCalledTimes(1);
  expect(revokeObjectURL).toHaveBeenCalledTimes(1);

  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  document.createElement = originalCreateElement as typeof document.createElement;
});
