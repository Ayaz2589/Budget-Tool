import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  ExpenseSource,
} from "@/types/core";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  ALL_EXPENSE_SOURCES,
} from "@/lib/types";
import { isValidDate, tryRepairDate } from "@/lib/dateRepair";

const BUDGET_STORAGE_KEY = "budget-tool-data";

import type { BudgetState } from "@/types/budget";
import type { BudgetContextValue } from "@/types/context";

export type { BudgetState };

const BudgetContext = createContext<BudgetContextValue | null>(null);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadStoredBudget(): {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  iOweNova: Record<string, number>;
  cardSources: string[];
  expenseCategories: string[];
  incomeCategories: string[];
  owners: string[];
} {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as {
        expenses?: Expense[];
        income?: Income[];
        debts?: Debt[];
        debtPayments?: DebtPayment[];
        iOweNova?: Record<string, number>;
        cardSources?: string[];
        expenseCategories?: string[];
        incomeCategories?: string[];
        owners?: string[];
      };
      const cardSources = Array.isArray(data.cardSources)
        ? data.cardSources.filter((s): s is ExpenseSource =>
            ALL_EXPENSE_SOURCES.includes(s as ExpenseSource)
          )
        : [...ALL_EXPENSE_SOURCES];
      const expenseCategories =
        Array.isArray(data.expenseCategories) &&
        data.expenseCategories.every((c) => typeof c === "string")
          ? data.expenseCategories
          : [...DEFAULT_EXPENSE_CATEGORIES];
      const incomeCategories =
        Array.isArray(data.incomeCategories) &&
        data.incomeCategories.every((c) => typeof c === "string")
          ? data.incomeCategories
          : [...DEFAULT_INCOME_CATEGORIES];
      const owners =
        Array.isArray(data.owners) &&
        data.owners.every((o) => typeof o === "string")
          ? data.owners
          : [];
      return {
        expenses: Array.isArray(data.expenses)
          ? data.expenses.map((e) => ({
              ...e,
              owner:
                (e as Expense & { cardMember?: string }).owner ??
                (e as Expense & { cardMember?: string }).cardMember ??
                undefined,
            }))
          : [],
        income: Array.isArray(data.income) ? data.income : [],
        debts: Array.isArray(data.debts) ? data.debts : [],
        debtPayments: Array.isArray(data.debtPayments) ? data.debtPayments : [],
        iOweNova:
          data.iOweNova && typeof data.iOweNova === "object"
            ? data.iOweNova
            : {},
        cardSources:
          cardSources.length > 0 ? cardSources : [...ALL_EXPENSE_SOURCES],
        expenseCategories,
        incomeCategories,
        owners,
      };
    }
  } catch {
    // ignore
  }
  return {
    expenses: [],
    income: [],
    debts: [],
    debtPayments: [],
    iOweNova: {},
    cardSources: [...ALL_EXPENSE_SOURCES],
    expenseCategories: [],
    incomeCategories: [],
    owners: [],
  };
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const stored = loadStoredBudget();
  const [expenses, setExpenses] = useState<Expense[]>(stored.expenses);
  const [income, setIncome] = useState<Income[]>(stored.income);
  const [debts, setDebts] = useState<Debt[]>(stored.debts);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>(
    stored.debtPayments
  );
  const [expenseCategories, setExpenseCategoriesState] = useState<string[]>(
    stored.expenseCategories
  );
  const [incomeCategories, setIncomeCategoriesState] = useState<string[]>(
    stored.incomeCategories
  );
  const [owners, setOwnersState] = useState<string[]>(stored.owners);
  const [cardSources, setCardSourcesState] = useState<string[]>(
    stored.cardSources
  );
  const [iOweNova, setIOweNovaState] = useState<Record<string, number>>(
    stored.iOweNova
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        BUDGET_STORAGE_KEY,
        JSON.stringify({
          expenses,
          income,
          debts,
        debtPayments,
        iOweNova,
        cardSources,
        expenseCategories,
        incomeCategories,
        owners,
      })
    );
  } catch {
      // ignore
    }
  }, [
    expenses,
    income,
    debts,
    debtPayments,
    iOweNova,
    cardSources,
    expenseCategories,
    incomeCategories,
    owners,
  ]);

  const addExpenses = useCallback((newExpenses: Expense[]) => {
    setExpenses((prev) => {
      const byId = new Map(prev.map((e) => [e.id, e]));
      for (const e of newExpenses) {
        if (!byId.has(e.id)) byId.set(e.id, e);
      }
      return Array.from(byId.values()).sort((a, b) =>
        b.date.localeCompare(a.date)
      );
    });
  }, []);

  const addExpense = useCallback((entry: Omit<Expense, "id">) => {
    const newExpense: Expense = { ...entry, id: generateId() };
    setExpenses((prev) =>
      [...prev, newExpense].sort((a, b) => b.date.localeCompare(a.date))
    );
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const removeExpenses = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setExpenses((prev) => prev.filter((e) => !idSet.has(e.id)));
  }, []);

  const addIncome = useCallback((entry: Omit<Income, "id">) => {
    const newEntry: Income = { ...entry, id: generateId() };
    setIncome((prev) =>
      [...prev, newEntry].sort((a, b) => b.date.localeCompare(a.date))
    );
  }, []);

  const addIncomes = useCallback((newIncome: Income[]) => {
    setIncome((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i]));
      for (const i of newIncome) {
        if (!byId.has(i.id)) byId.set(i.id, i);
      }
      return Array.from(byId.values()).sort((a, b) =>
        b.date.localeCompare(a.date)
      );
    });
  }, []);

  const updateIncome = useCallback((id: string, updates: Partial<Income>) => {
    setIncome((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  }, []);

  const removeIncome = useCallback((id: string) => {
    setIncome((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addDebt = useCallback((entry: Omit<Debt, "id">) => {
    const newDebt: Debt = { ...entry, id: generateId() };
    setDebts((prev) => [...prev, newDebt]);
  }, []);

  const addDebts = useCallback((newDebts: Debt[]) => {
    setDebts((prev) => {
      const byId = new Map(prev.map((d) => [d.id, d]));
      for (const d of newDebts) {
        if (!byId.has(d.id)) byId.set(d.id, d);
      }
      return Array.from(byId.values());
    });
  }, []);

  const updateDebt = useCallback((id: string, updates: Partial<Debt>) => {
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  }, []);

  const removeDebt = useCallback((id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    setDebtPayments((prev) => prev.filter((p) => p.debtId !== id));
  }, []);

  const addDebtPayment = useCallback((entry: Omit<DebtPayment, "id">) => {
    const newPayment: DebtPayment = { ...entry, id: generateId() };
    setDebtPayments((prev) =>
      [...prev, newPayment].sort((a, b) => b.date.localeCompare(a.date))
    );
  }, []);

  const addDebtPayments = useCallback((newPayments: DebtPayment[]) => {
    setDebtPayments((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      for (const p of newPayments) {
        if (!byId.has(p.id)) byId.set(p.id, p);
      }
      return Array.from(byId.values()).sort((a, b) =>
        b.date.localeCompare(a.date)
      );
    });
  }, []);

  const updateDebtPayment = useCallback(
    (id: string, updates: Partial<DebtPayment>) => {
      setDebtPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const removeDebtPayment = useCallback((id: string) => {
    setDebtPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setExpenseCategories = useCallback((categories: string[]) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.category && !categories.includes(e.category)
          ? { ...e, category: "" }
          : e
      )
    );
    setExpenseCategoriesState(categories);
  }, []);

  const setIncomeCategories = useCallback((categories: string[]) => {
    setIncome((prev) =>
      prev.map((i) =>
        i.category && !categories.includes(i.category)
          ? { ...i, category: "" }
          : i
      )
    );
    setIncomeCategoriesState(categories);
  }, []);

  const setOwners = useCallback((nextOwners: string[]) => {
    const normalized = nextOwners.map((o) => o.trim()).filter(Boolean);
    setExpenses((prev) =>
      prev.map((e) =>
        e.owner && !normalized.includes(e.owner) ? { ...e, owner: undefined } : e
      )
    );
    setIncome((prev) =>
      prev.map((i) =>
        i.owner && !normalized.includes(i.owner) ? { ...i, owner: undefined } : i
      )
    );
    setDebts((prev) =>
      prev.map((d) =>
        d.owner && !normalized.includes(d.owner) ? { ...d, owner: undefined } : d
      )
    );
    setOwnersState(normalized);
  }, []);

  const setCardSources = useCallback((sources: string[]) => {
    if (sources.length === 0) return;
    const fallback = (sources[0] as ExpenseSource) ?? "manual";
    setExpenses((prev) =>
      prev.map((e) =>
        sources.includes(e.source) ? e : { ...e, source: fallback }
      )
    );
    setCardSourcesState(sources);
  }, []);

  const setIOweNova = useCallback((monthKey: string, amount: number) => {
    setIOweNovaState((prev) => ({ ...prev, [monthKey]: amount }));
  }, []);

  const repairCorruptedDates = useCallback(() => {
    let fixedExpenses = 0;
    let fixedIncome = 0;
    const repairedExpenses = expenses.map((e) => {
      if (isValidDate(e.date)) return e;
      const repaired = tryRepairDate(e.date);
      if (repaired) {
        fixedExpenses++;
        return { ...e, date: repaired };
      }
      return e;
    });
    const repairedIncome = income.map((i) => {
      if (isValidDate(i.date)) return i;
      const repaired = tryRepairDate(i.date);
      if (repaired) {
        fixedIncome++;
        return { ...i, date: repaired };
      }
      return i;
    });
    setExpenses(
      [...repairedExpenses].sort((a, b) => b.date.localeCompare(a.date))
    );
    setIncome([...repairedIncome].sort((a, b) => b.date.localeCompare(a.date)));
    return { fixedExpenses, fixedIncome };
  }, [expenses, income]);

  const value = useMemo<BudgetContextValue>(
    () => ({
      expenses,
      income,
      debts,
      debtPayments,
      expenseCategories,
      incomeCategories,
      owners,
      cardSources,
      addExpenses,
      addExpense,
      updateExpense,
      removeExpense,
      removeExpenses,
      addIncome,
      addIncomes,
      updateIncome,
      removeIncome,
      addDebt,
      addDebts,
      updateDebt,
      removeDebt,
      addDebtPayment,
      addDebtPayments,
      updateDebtPayment,
      removeDebtPayment,
      setExpenseCategories,
      setIncomeCategories,
      setOwners,
      setCardSources,
      setIOweNova,
      iOweNova,
      repairCorruptedDates,
    }),
    [
      expenses,
      income,
      debts,
      debtPayments,
      expenseCategories,
      incomeCategories,
      owners,
      cardSources,
      iOweNova,
      addExpenses,
      addExpense,
      updateExpense,
      removeExpense,
      removeExpenses,
      addIncome,
      addIncomes,
      updateIncome,
      removeIncome,
      addDebt,
      addDebts,
      updateDebt,
      removeDebt,
      addDebtPayment,
      addDebtPayments,
      updateDebtPayment,
      removeDebtPayment,
      setExpenseCategories,
      setIncomeCategories,
      setOwners,
      setCardSources,
      setIOweNova,
      repairCorruptedDates,
    ]
  );

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
