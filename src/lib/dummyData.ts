import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  OwnerTransfer,
} from "@/types/core";
import {
  ALL_EXPENSE_SOURCES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/lib/types";

export type DummyBudgetData = {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  ownerTransfers: OwnerTransfer[];
  iOweNova: Record<string, number>;
  cardSources: string[];
  expenseCategories: string[];
  incomeCategories: string[];
  owners: string[];
};

export function buildDummyBudget(currentMonthKey: string): DummyBudgetData {
  const [year, month] = currentMonthKey.split("-").map((n) => Number(n));
  const monthKeys = Array.from({ length: 5 }, (_, index) => {
    const d = new Date(year, (month ?? 1) - 1 - index, 1);
    return d.toISOString().slice(0, 7);
  });
  const [currentKey, prevKey, prev2Key, prev3Key, prev4Key] = monthKeys;

  const owners = ["Ayaz", "Tasnuva"];
  const expenseCategories = Array.from(
    new Set([...DEFAULT_EXPENSE_CATEGORIES, "Mortgage", "Travel", "Utilities"])
  );

  const incomeCategories = Array.from(
    new Set([...DEFAULT_INCOME_CATEGORIES, "Side Hustle"])
  );

  const expenseSeeds = [
    { description: "Groceries", category: "My Purchase", base: 65 },
    { description: "Coffee", category: "My Purchase", base: 8 },
    { description: "Gas", category: "My Purchase", base: 45 },
    { description: "Dining", category: "50/50", base: 38 },
    { description: "Utilities", category: "Utilities", base: 120 },
    { description: "Amazon", category: "Amazon", base: 55 },
    { description: "Clothes", category: "Tasnuva's Purchases", base: 70 },
    { description: "Travel", category: "Travel", base: 150 },
    { description: "Internet", category: "Utilities", base: 75 },
    { description: "Pharmacy", category: "Health", base: 30 },
  ];

  const incomeSeeds = [
    { description: "Paycheck", category: "Paycheck", base: 4800, owner: "Ayaz" },
    { description: "Rent", category: "Rent", base: 2000, owner: "Tasnuva" },
    { description: "Bonus", category: "Bonus", base: 600, owner: "Ayaz" },
    { description: "Freelance", category: "Side Hustle", base: 700, owner: "Tasnuva" },
    { description: "Consulting", category: "Side Hustle", base: 850, owner: "Ayaz" },
  ];

  const buildMonthlyExpenses = (monthKey: string, monthIndex: number) => {
    const out: Expense[] = [];
    const days = 28;
    for (let i = 0; i < 49; i++) {
      const seed = expenseSeeds[i % expenseSeeds.length]!;
      const owner = seed.category === "Tasnuva's Purchases" ? "Tasnuva" : owners[i % owners.length]!;
      const amount = seed.base + ((i + monthIndex * 7) % 9) * 5;
      const day = ((i * 3 + monthIndex * 5) % days) + 1;
      out.push({
        id: `exp-${monthKey}-${i}`,
        date: `${monthKey}-${String(day).padStart(2, "0")}`,
        amount,
        description: seed.description,
        category: seed.category,
        source: "manual",
        owner,
      });
    }

    out.push({
      id: `exp-${monthKey}-mortgage`,
      date: `${monthKey}-10`,
      amount: 860 + monthIndex * 5,
      description: "Mortgage",
      category: "Mortgage",
      source: "manual",
      owner: "Ayaz",
    });

    return out;
  };

  const buildMonthlyIncome = (monthKey: string, monthIndex: number) => {
    const out: Income[] = [];
    for (let i = 0; i < 12; i++) {
      const seed = incomeSeeds[i % incomeSeeds.length]!;
      const amount = seed.base + ((i + monthIndex * 3) % 6) * 75;
      const day = ((i * 2 + monthIndex * 4) % 26) + 1;
      out.push({
        id: `inc-${monthKey}-${i}`,
        date: `${monthKey}-${String(day).padStart(2, "0")}`,
        amount,
        description: seed.description,
        category: seed.category,
        owner: seed.owner,
      });
    }
    return out;
  };

  const expenses = monthKeys.flatMap((key, index) =>
    buildMonthlyExpenses(key, index)
  );
  const income = monthKeys.flatMap((key, index) =>
    buildMonthlyIncome(key, index)
  );

  const debts: Debt[] = [
    {
      id: "debt-1",
      name: "Car Loan",
      initialAmount: 12000,
      startDate: `${prev4Key}-01`,
      owner: "Ayaz",
    },
  ];

  const debtPayments: DebtPayment[] = [
    {
      id: "dp-1",
      debtId: "debt-1",
      date: `${prev3Key}-15`,
      amount: 400,
      note: "Payment",
    },
    {
      id: "dp-2",
      debtId: "debt-1",
      date: `${prev2Key}-15`,
      amount: 400,
      note: "Payment",
    },
    {
      id: "dp-3",
      debtId: "debt-1",
      date: `${prevKey}-15`,
      amount: 400,
      note: "Payment",
    },
    {
      id: "dp-4",
      debtId: "debt-1",
      date: `${currentKey}-15`,
      amount: 400,
      note: "Payment",
    },
  ];

  return {
    owners,
    expenses,
    income,
    debts,
    debtPayments,
    ownerTransfers: [],
    iOweNova: {
      [currentKey]: 320,
      [prevKey]: 180,
      [prev2Key]: 210,
      [prev3Key]: 140,
      [prev4Key]: 260,
    },
    cardSources: [...ALL_EXPENSE_SOURCES],
    expenseCategories,
    incomeCategories,
  };
}
