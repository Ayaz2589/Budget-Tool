import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Debt, DebtPayment, Expense, Income } from "@/lib/types";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/lib/types";
import { isValidDate, tryRepairDate } from "@/lib/dateRepair";

const BUDGET_STORAGE_KEY = "budget-tool-data";

export interface BudgetState {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  expenseCategories: string[];
  incomeCategories: string[];
}

interface BudgetContextValue extends BudgetState {
  addExpenses: (expenses: Expense[]) => void;
  addExpense: (entry: Omit<Expense, "id">) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  removeExpenses: (ids: string[]) => void;
  addIncome: (entry: Omit<Income, "id">) => void;
  addIncomes: (income: Income[]) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  removeIncome: (id: string) => void;
  addDebt: (entry: Omit<Debt, "id">) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  removeDebt: (id: string) => void;
  addDebts: (debts: Debt[]) => void;
  addDebtPayment: (entry: Omit<DebtPayment, "id">) => void;
  updateDebtPayment: (id: string, updates: Partial<DebtPayment>) => void;
  removeDebtPayment: (id: string) => void;
  addDebtPayments: (payments: DebtPayment[]) => void;
  setExpenseCategories: (categories: string[]) => void;
  setIncomeCategories: (categories: string[]) => void;
  setIOweNova: (monthKey: string, amount: number) => void;
  iOweNova: Record<string, number>;
  repairCorruptedDates: () => { fixedExpenses: number; fixedIncome: number };
}

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
      };
      return {
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
        income: Array.isArray(data.income) ? data.income : [],
        debts: Array.isArray(data.debts) ? data.debts : [],
        debtPayments: Array.isArray(data.debtPayments) ? data.debtPayments : [],
        iOweNova:
          data.iOweNova && typeof data.iOweNova === "object"
            ? data.iOweNova
            : {},
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
  };
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const stored = loadStoredBudget();
  const [expenses, setExpenses] = useState<Expense[]>(stored.expenses);
  const [income, setIncome] = useState<Income[]>(stored.income);
  const [debts, setDebts] = useState<Debt[]>(stored.debts);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>(
    stored.debtPayments,
  );
  const [expenseCategories, setExpenseCategoriesState] = useState<string[]>([
    ...DEFAULT_EXPENSE_CATEGORIES,
  ]);
  const [incomeCategories, setIncomeCategoriesState] = useState<string[]>([
    ...DEFAULT_INCOME_CATEGORIES,
  ]);
  const [iOweNova, setIOweNovaState] = useState<Record<string, number>>(
    stored.iOweNova,
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
        }),
      );
    } catch {
      // ignore
    }
  }, [expenses, income, debts, debtPayments, iOweNova]);

  const addExpenses = useCallback((newExpenses: Expense[]) => {
    setExpenses((prev) => {
      const byId = new Map(prev.map((e) => [e.id, e]));
      for (const e of newExpenses) {
        if (!byId.has(e.id)) byId.set(e.id, e);
      }
      return Array.from(byId.values()).sort((a, b) =>
        b.date.localeCompare(a.date),
      );
    });
  }, []);

  const addExpense = useCallback((entry: Omit<Expense, "id">) => {
    const newExpense: Expense = { ...entry, id: generateId() };
    setExpenses((prev) =>
      [...prev, newExpense].sort((a, b) => b.date.localeCompare(a.date)),
    );
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
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
      [...prev, newEntry].sort((a, b) => b.date.localeCompare(a.date)),
    );
  }, []);

  const addIncomes = useCallback((newIncome: Income[]) => {
    setIncome((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i]));
      for (const i of newIncome) {
        if (!byId.has(i.id)) byId.set(i.id, i);
      }
      return Array.from(byId.values()).sort((a, b) =>
        b.date.localeCompare(a.date),
      );
    });
  }, []);

  const updateIncome = useCallback((id: string, updates: Partial<Income>) => {
    setIncome((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
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
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
  }, []);

  const removeDebt = useCallback((id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    setDebtPayments((prev) => prev.filter((p) => p.debtId !== id));
  }, []);

  const addDebtPayment = useCallback((entry: Omit<DebtPayment, "id">) => {
    const newPayment: DebtPayment = { ...entry, id: generateId() };
    setDebtPayments((prev) =>
      [...prev, newPayment].sort((a, b) => b.date.localeCompare(a.date)),
    );
  }, []);

  const addDebtPayments = useCallback((newPayments: DebtPayment[]) => {
    setDebtPayments((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      for (const p of newPayments) {
        if (!byId.has(p.id)) byId.set(p.id, p);
      }
      return Array.from(byId.values()).sort((a, b) =>
        b.date.localeCompare(a.date),
      );
    });
  }, []);

  const updateDebtPayment = useCallback(
    (id: string, updates: Partial<DebtPayment>) => {
      setDebtPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [],
  );

  const removeDebtPayment = useCallback((id: string) => {
    setDebtPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setExpenseCategories = useCallback((categories: string[]) => {
    setExpenseCategoriesState(categories);
  }, []);

  const setIncomeCategories = useCallback((categories: string[]) => {
    setIncomeCategoriesState(categories);
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
      [...repairedExpenses].sort((a, b) => b.date.localeCompare(a.date)),
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
      setIOweNova,
      repairCorruptedDates,
    ],
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
