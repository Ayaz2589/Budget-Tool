import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  OwnerTransfer,
} from "@/types/core";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/lib/types";

export type DummyBudgetData = {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  ownerTransfers: OwnerTransfer[];
  ownerBalances: Record<string, Record<string, number>>;
  cardSources: string[];
  expenseCategories: string[];
  incomeCategories: string[];
  owners: string[];
};

export function buildDummyBudget(currentMonthKey: string): DummyBudgetData {
  const [year, month] = currentMonthKey.split("-").map((n) => Number(n));
  const monthKeys = Array.from({ length: 2 }, (_, index) => {
    const d = new Date(year, (month ?? 1) - 1 - index, 1);
    return d.toISOString().slice(0, 7);
  });
  const [currentKey, previousKey] = monthKeys;
  const resolvedCurrentKey = currentKey ?? currentMonthKey;
  const resolvedPreviousKey =
    previousKey ??
    new Date(year, (month ?? 1) - 2, 1).toISOString().slice(0, 7);

  const owners = ["Ayaz", "Tasnuva"];
  const expenseCategories = Array.from(
    new Set([...DEFAULT_EXPENSE_CATEGORIES, "Mortgage", "Utilities"])
  );

  const incomeCategories = Array.from(
    new Set([...DEFAULT_INCOME_CATEGORIES, "Side Hustle"])
  );
  const expenses: Expense[] = [
    {
      id: `exp-${resolvedCurrentKey}-groceries`,
      date: `${resolvedCurrentKey}-03`,
      amount: 180,
      description: "Groceries",
      category: "Groceries",
      source: "amex",
      owner: "Ayaz",
      paidByOwner: "Ayaz",
    },
    {
      id: `exp-${resolvedCurrentKey}-dining`,
      date: `${resolvedCurrentKey}-06`,
      amount: 90,
      description: "Dining",
      category: "Dining",
      source: "manual",
      owner: "Tasnuva",
      paidByOwner: "Tasnuva",
      allocationMode: "equal" as const,
      allocation: [
        { owner: "Ayaz", percent: 50 },
        { owner: "Tasnuva", percent: 50 },
      ],
    },
    {
      id: `exp-${resolvedCurrentKey}-utilities`,
      date: `${resolvedCurrentKey}-09`,
      amount: 120,
      description: "Utilities",
      category: "Utilities",
      source: "td",
      owner: "Ayaz",
    },
    {
      id: `exp-${resolvedCurrentKey}-mortgage`,
      date: `${resolvedCurrentKey}-10`,
      amount: 1600,
      description: "Mortgage",
      category: "Mortgage",
      source: "manual",
      owner: "Ayaz",
    },
    {
      id: `exp-${resolvedCurrentKey}-pharmacy`,
      date: `${resolvedCurrentKey}-14`,
      amount: 45,
      description: "Pharmacy",
      category: "Health",
      source: "manual",
      owner: "Tasnuva",
    },
    {
      id: `exp-${resolvedPreviousKey}-groceries`,
      date: `${resolvedPreviousKey}-03`,
      amount: 160,
      description: "Groceries",
      category: "Groceries",
      source: "amex",
      owner: "Ayaz",
      paidByOwner: "Ayaz",
    },
    {
      id: `exp-${resolvedPreviousKey}-dining`,
      date: `${resolvedPreviousKey}-06`,
      amount: 80,
      description: "Dining",
      category: "Dining",
      source: "manual",
      owner: "Tasnuva",
      paidByOwner: "Tasnuva",
      allocationMode: "equal" as const,
      allocation: [
        { owner: "Ayaz", percent: 50 },
        { owner: "Tasnuva", percent: 50 },
      ],
    },
    {
      id: `exp-${resolvedPreviousKey}-utilities`,
      date: `${resolvedPreviousKey}-09`,
      amount: 110,
      description: "Utilities",
      category: "Utilities",
      source: "td",
      owner: "Ayaz",
    },
    {
      id: `exp-${resolvedPreviousKey}-mortgage`,
      date: `${resolvedPreviousKey}-10`,
      amount: 1600,
      description: "Mortgage",
      category: "Mortgage",
      source: "manual",
      owner: "Ayaz",
    },
  ];

  const income: Income[] = [
    {
      id: `inc-${resolvedCurrentKey}-paycheck-ayaz`,
      date: `${resolvedCurrentKey}-01`,
      amount: 3500,
      description: "Paycheck",
      category: "Paycheck",
      owner: "Ayaz",
    },
    {
      id: `inc-${resolvedCurrentKey}-paycheck-tasnuva`,
      date: `${resolvedCurrentKey}-01`,
      amount: 2200,
      description: "Paycheck",
      category: "Paycheck",
      owner: "Tasnuva",
    },
    {
      id: `inc-${resolvedCurrentKey}-side-hustle`,
      date: `${resolvedCurrentKey}-12`,
      amount: 300,
      description: "Side Hustle",
      category: "Side Hustle",
      owner: "Tasnuva",
    },
    {
      id: `inc-${resolvedPreviousKey}-paycheck-ayaz`,
      date: `${resolvedPreviousKey}-01`,
      amount: 3400,
      description: "Paycheck",
      category: "Paycheck",
      owner: "Ayaz",
    },
    {
      id: `inc-${resolvedPreviousKey}-paycheck-tasnuva`,
      date: `${resolvedPreviousKey}-01`,
      amount: 2100,
      description: "Paycheck",
      category: "Paycheck",
      owner: "Tasnuva",
    },
  ];

  const debts: Debt[] = [
    {
      id: "debt-1",
      name: "Credit Card",
      initialAmount: 2400,
      startDate: `${resolvedPreviousKey}-01`,
      owner: "Tasnuva",
    },
  ];

  const debtPayments: DebtPayment[] = [
    {
      id: `dp-${resolvedPreviousKey}-1`,
      debtId: "debt-1",
      date: `${resolvedPreviousKey}-15`,
      amount: 250,
      note: "Monthly payment",
    },
    {
      id: `dp-${resolvedCurrentKey}-1`,
      debtId: "debt-1",
      date: `${resolvedCurrentKey}-15`,
      amount: 250,
      note: "Monthly payment",
    },
  ];

  const ownerTransfers: OwnerTransfer[] = [
    {
      id: `transfer-${resolvedCurrentKey}-1`,
      date: `${resolvedCurrentKey}-18`,
      fromOwner: "Tasnuva",
      toOwner: "Ayaz",
      amount: 200,
      note: "Utilities share",
    },
    {
      id: `transfer-${resolvedPreviousKey}-1`,
      date: `${resolvedPreviousKey}-18`,
      fromOwner: "Ayaz",
      toOwner: "Tasnuva",
      amount: 120,
      note: "Dining share",
    },
  ];

  return {
    owners,
    expenses,
    income,
    debts,
    debtPayments,
    ownerTransfers,
    ownerBalances: {
      [resolvedCurrentKey]: { Ayaz: 80 },
      [resolvedPreviousKey]: { Ayaz: 40 },
    },
    cardSources: ["amex", "manual", "td", "chase"],
    expenseCategories,
    incomeCategories,
  };
}
