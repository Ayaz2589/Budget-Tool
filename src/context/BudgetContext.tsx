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
  ExpenseSource,
  Income,
  OwnerTransfer,
} from "@/types/core";
import {
  ALL_EXPENSE_SOURCES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/lib/types";
import {
  getDefaultUiFormatSettings,
  setUiFormatSettings as applyUiFormatSettings,
  type UiFormatSettings,
} from "@/lib/format";
import { getUsdToEurRate } from "@/lib/fx";
import { isMortgageCategory } from "@/lib/mortgageCategory";
import { isValidDate, tryRepairDate } from "@/lib/dateRepair";
import { buildDummyBudget, type DummyBudgetData } from "@/lib/dummyData";
import type { BudgetState } from "@/types/budget";
import type { BudgetContextValue } from "@/types/context";

const BUDGET_STORAGE_KEY = "budget-tool-data";
const DUMMY_STORAGE_KEY = "budget-tool-dummy-mode";
const UI_FORMAT_STORAGE_KEY = "budget-tool-ui-format";

export type { BudgetState };

const BudgetContext = createContext<BudgetContextValue | null>(null);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function loadStoredUiFormatSettings(): UiFormatSettings {
  const fallback = getDefaultUiFormatSettings();
  try {
    const raw = localStorage.getItem(UI_FORMAT_STORAGE_KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Partial<UiFormatSettings>;
    const currency = data.currency === "EUR" ? "EUR" : "USD";
    const dateFormat =
      data.dateFormat === "MM/DD/YYYY" || data.dateFormat === "YYYY/MM/DD"
        ? data.dateFormat
        : fallback.dateFormat;
    const fxRate =
      Number.isFinite(data.fxRate) && Number(data.fxRate) > 0
        ? Number(data.fxRate)
        : fallback.fxRate;
    return {
      ...fallback,
      currency,
      baseCurrency: "USD",
      fxRate: currency === "USD" ? 1 : fxRate,
      fxAsOf: typeof data.fxAsOf === "string" ? data.fxAsOf : undefined,
      fxFallback:
        typeof data.fxFallback === "boolean" ? data.fxFallback : undefined,
      dateFormat,
    };
  } catch {
    return fallback;
  }
}

function loadStoredBudget(): {
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
} {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as {
        expenses?: Expense[];
        income?: Income[];
        debts?: Debt[];
        debtPayments?: DebtPayment[];
        ownerTransfers?: OwnerTransfer[];
        iOweNova?: Record<string, number>;
        cardSources?: string[];
        expenseCategories?: string[];
        incomeCategories?: string[];
        owners?: string[];
      };
      const cardSources = Array.isArray(data.cardSources)
        ? (() => {
            const filtered = data.cardSources.filter((s): s is ExpenseSource =>
              ALL_EXPENSE_SOURCES.includes(s as ExpenseSource)
            );
            // Migration: ensure newly added sources are available for existing users.
            for (const src of ALL_EXPENSE_SOURCES) {
              if (!filtered.includes(src)) filtered.push(src);
            }
            return filtered;
          })()
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
              paidByOwner:
                e.paidByOwner ??
                (e as Expense & { cardMember?: string }).owner ??
                (e as Expense & { cardMember?: string }).cardMember ??
                undefined,
            }))
          : [],
        income: Array.isArray(data.income) ? data.income : [],
        debts: Array.isArray(data.debts) ? data.debts : [],
        debtPayments: Array.isArray(data.debtPayments) ? data.debtPayments : [],
        ownerTransfers: Array.isArray(data.ownerTransfers)
          ? data.ownerTransfers
          : [],
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
    ownerTransfers: [],
    iOweNova: {},
    cardSources: [...ALL_EXPENSE_SOURCES],
    expenseCategories: [],
    incomeCategories: [],
    owners: [],
  };
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const isDev = import.meta.env.DEV;
  const stored = loadStoredBudget();
  const [expenses, setExpenses] = useState<Expense[]>(stored.expenses);
  const [income, setIncome] = useState<Income[]>(stored.income);
  const [debts, setDebts] = useState<Debt[]>(stored.debts);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>(
    stored.debtPayments
  );
  const [ownerTransfers, setOwnerTransfers] = useState<OwnerTransfer[]>(
    stored.ownerTransfers,
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
  const [uiFormatSettings, setUiFormatSettingsState] = useState<UiFormatSettings>(
    () => {
      const initialSettings = loadStoredUiFormatSettings();
      applyUiFormatSettings(initialSettings);
      return initialSettings;
    }
  );
  const [useDummyData, setUseDummyDataState] = useState(() => {
    if (!isDev) return false;
    try {
      return localStorage.getItem(DUMMY_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [dummyState, setDummyState] = useState<DummyBudgetData>(() =>
    buildDummyBudget(getCurrentMonthKey())
  );

  const setUseDummyData = useCallback(
    (value: boolean) => {
      if (!isDev) return;
      setUseDummyDataState(value);
    },
    [isDev]
  );

  useEffect(() => {
    if (!isDev) return;
    try {
      localStorage.setItem(DUMMY_STORAGE_KEY, useDummyData ? "true" : "false");
    } catch {
      // ignore
    }
  }, [isDev, useDummyData]);

  useEffect(() => {
    applyUiFormatSettings(uiFormatSettings);
    try {
      localStorage.setItem(UI_FORMAT_STORAGE_KEY, JSON.stringify(uiFormatSettings));
    } catch {
      // ignore
    }
  }, [uiFormatSettings]);

  useEffect(() => {
    if (uiFormatSettings.currency !== "EUR") return;
    let cancelled = false;
    getUsdToEurRate().then((fx) => {
      if (cancelled) return;
      setUiFormatSettingsState((prev) => {
        if (
          prev.currency !== "EUR" ||
          (Math.abs(prev.fxRate - fx.rate) < 0.000001 &&
            prev.fxAsOf === fx.asOf &&
            prev.fxFallback === fx.fallback)
        ) {
          return prev;
        }
        return {
          ...prev,
          fxRate: fx.rate,
          fxAsOf: fx.asOf,
          fxFallback: fx.fallback,
        };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [uiFormatSettings.currency]);

  useEffect(() => {
    if (useDummyData) return;
    try {
      localStorage.setItem(
        BUDGET_STORAGE_KEY,
        JSON.stringify({
          expenses,
          income,
          debts,
          debtPayments,
          ownerTransfers,
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
    useDummyData,
    expenses,
    income,
    debts,
    debtPayments,
    ownerTransfers,
    iOweNova,
    cardSources,
    expenseCategories,
    incomeCategories,
    owners,
  ]);

  const addExpenses = useCallback(
    (newExpenses: Expense[]) => {
      if (useDummyData) {
        setDummyState((prev) => {
          const byId = new Map(prev.expenses.map((e) => [e.id, e]));
          for (const e of newExpenses) {
            if (!byId.has(e.id))
              byId.set(e.id, {
                ...e,
                paidByOwner: e.paidByOwner ?? e.owner,
              });
          }
          return {
            ...prev,
            expenses: Array.from(byId.values()).sort((a, b) =>
              b.date.localeCompare(a.date)
            ),
          };
        });
        return;
      }
      setExpenses((prev) => {
        const byId = new Map(prev.map((e) => [e.id, e]));
        for (const e of newExpenses) {
          if (!byId.has(e.id))
            byId.set(e.id, {
              ...e,
              paidByOwner: e.paidByOwner ?? e.owner,
            });
        }
        return Array.from(byId.values()).sort((a, b) =>
          b.date.localeCompare(a.date)
        );
      });
    },
    [useDummyData]
  );

  const addExpense = useCallback(
    (entry: Omit<Expense, "id">) => {
      const newExpense: Expense = {
        ...entry,
        id: generateId(),
        paidByOwner: entry.paidByOwner ?? entry.owner,
      };
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          expenses: [...prev.expenses, newExpense].sort((a, b) =>
            b.date.localeCompare(a.date)
          ),
        }));
        return;
      }
      setExpenses((prev) =>
        [...prev, newExpense].sort((a, b) => b.date.localeCompare(a.date))
      );
    },
    [useDummyData]
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<Expense>) => {
      const normalizedUpdates: Partial<Expense> =
        "owner" in updates && !("paidByOwner" in updates)
          ? { ...updates, paidByOwner: updates.owner }
          : updates;
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          expenses: prev.expenses.map((e) =>
            e.id === id ? { ...e, ...normalizedUpdates } : e
          ),
        }));
        return;
      }
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...normalizedUpdates } : e))
      );
    },
    [useDummyData]
  );

  const removeExpense = useCallback(
    (id: string) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          expenses: prev.expenses.filter((e) => e.id !== id),
        }));
        return;
      }
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    },
    [useDummyData]
  );

  const removeExpenses = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          expenses: prev.expenses.filter((e) => !idSet.has(e.id)),
        }));
        return;
      }
      setExpenses((prev) => prev.filter((e) => !idSet.has(e.id)));
    },
    [useDummyData]
  );

  const addIncome = useCallback(
    (entry: Omit<Income, "id">) => {
      const newEntry: Income = { ...entry, id: generateId() };
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          income: [...prev.income, newEntry].sort((a, b) =>
            b.date.localeCompare(a.date)
          ),
        }));
        return;
      }
      setIncome((prev) =>
        [...prev, newEntry].sort((a, b) => b.date.localeCompare(a.date))
      );
    },
    [useDummyData]
  );

  const addIncomes = useCallback(
    (newIncome: Income[]) => {
      if (useDummyData) {
        setDummyState((prev) => {
          const byId = new Map(prev.income.map((i) => [i.id, i]));
          for (const i of newIncome) {
            if (!byId.has(i.id)) byId.set(i.id, i);
          }
          return {
            ...prev,
            income: Array.from(byId.values()).sort((a, b) =>
              b.date.localeCompare(a.date)
            ),
          };
        });
        return;
      }
      setIncome((prev) => {
        const byId = new Map(prev.map((i) => [i.id, i]));
        for (const i of newIncome) {
          if (!byId.has(i.id)) byId.set(i.id, i);
        }
        return Array.from(byId.values()).sort((a, b) =>
          b.date.localeCompare(a.date)
        );
      });
    },
    [useDummyData]
  );

  const updateIncome = useCallback(
    (id: string, updates: Partial<Income>) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          income: prev.income.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        }));
        return;
      }
      setIncome((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
      );
    },
    [useDummyData]
  );

  const removeIncome = useCallback(
    (id: string) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          income: prev.income.filter((i) => i.id !== id),
        }));
        return;
      }
      setIncome((prev) => prev.filter((i) => i.id !== id));
    },
    [useDummyData]
  );

  const addDebt = useCallback(
    (entry: Omit<Debt, "id">) => {
      const newDebt: Debt = { ...entry, id: generateId() };
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          debts: [...prev.debts, newDebt],
        }));
        return;
      }
      setDebts((prev) => [...prev, newDebt]);
    },
    [useDummyData]
  );

  const addDebts = useCallback(
    (newDebts: Debt[]) => {
      if (useDummyData) {
        setDummyState((prev) => {
          const byId = new Map(prev.debts.map((d) => [d.id, d]));
          for (const d of newDebts) {
            if (!byId.has(d.id)) byId.set(d.id, d);
          }
          return { ...prev, debts: Array.from(byId.values()) };
        });
        return;
      }
      setDebts((prev) => {
        const byId = new Map(prev.map((d) => [d.id, d]));
        for (const d of newDebts) {
          if (!byId.has(d.id)) byId.set(d.id, d);
        }
        return Array.from(byId.values());
      });
    },
    [useDummyData]
  );

  const updateDebt = useCallback(
    (id: string, updates: Partial<Debt>) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          debts: prev.debts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        }));
        return;
      }
      setDebts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
      );
    },
    [useDummyData]
  );

  const removeDebt = useCallback(
    (id: string) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          debts: prev.debts.filter((d) => d.id !== id),
          debtPayments: prev.debtPayments.filter((p) => p.debtId !== id),
        }));
        return;
      }
      setDebts((prev) => prev.filter((d) => d.id !== id));
      setDebtPayments((prev) => prev.filter((p) => p.debtId !== id));
    },
    [useDummyData]
  );

  const addDebtPayment = useCallback(
    (entry: Omit<DebtPayment, "id">) => {
      const newPayment: DebtPayment = { ...entry, id: generateId() };
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          debtPayments: [...prev.debtPayments, newPayment].sort((a, b) =>
            b.date.localeCompare(a.date)
          ),
        }));
        return;
      }
      setDebtPayments((prev) =>
        [...prev, newPayment].sort((a, b) => b.date.localeCompare(a.date))
      );
    },
    [useDummyData]
  );

  const addDebtPayments = useCallback(
    (newPayments: DebtPayment[]) => {
      if (useDummyData) {
        setDummyState((prev) => {
          const byId = new Map(prev.debtPayments.map((p) => [p.id, p]));
          for (const p of newPayments) {
            if (!byId.has(p.id)) byId.set(p.id, p);
          }
          return {
            ...prev,
            debtPayments: Array.from(byId.values()).sort((a, b) =>
              b.date.localeCompare(a.date)
            ),
          };
        });
        return;
      }
      setDebtPayments((prev) => {
        const byId = new Map(prev.map((p) => [p.id, p]));
        for (const p of newPayments) {
          if (!byId.has(p.id)) byId.set(p.id, p);
        }
        return Array.from(byId.values()).sort((a, b) =>
          b.date.localeCompare(a.date)
        );
      });
    },
    [useDummyData]
  );

  const updateDebtPayment = useCallback(
    (id: string, updates: Partial<DebtPayment>) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          debtPayments: prev.debtPayments.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
        return;
      }
      setDebtPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    [useDummyData]
  );

  const removeDebtPayment = useCallback(
    (id: string) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          debtPayments: prev.debtPayments.filter((p) => p.id !== id),
        }));
        return;
      }
      setDebtPayments((prev) => prev.filter((p) => p.id !== id));
    },
    [useDummyData]
  );

  const addOwnerTransfer = useCallback(
    (entry: Omit<OwnerTransfer, "id"> | OwnerTransfer) => {
      const newTransfer: OwnerTransfer = {
        ...entry,
        id: "id" in entry && entry.id ? entry.id : generateId(),
      };
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          ownerTransfers: [...prev.ownerTransfers, newTransfer].sort((a, b) =>
            b.date.localeCompare(a.date),
          ),
        }));
        return;
      }
      setOwnerTransfers((prev) =>
        [...prev, newTransfer].sort((a, b) => b.date.localeCompare(a.date)),
      );
    },
    [useDummyData],
  );

  const updateOwnerTransfer = useCallback(
    (id: string, updates: Partial<OwnerTransfer>) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          ownerTransfers: prev.ownerTransfers.map((row) =>
            row.id === id ? { ...row, ...updates } : row,
          ),
        }));
        return;
      }
      setOwnerTransfers((prev) =>
        prev.map((row) => (row.id === id ? { ...row, ...updates } : row)),
      );
    },
    [useDummyData],
  );

  const removeOwnerTransfer = useCallback(
    (id: string) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          ownerTransfers: prev.ownerTransfers.filter((row) => row.id !== id),
        }));
        return;
      }
      setOwnerTransfers((prev) => prev.filter((row) => row.id !== id));
    },
    [useDummyData],
  );

  const setExpenseCategories = useCallback(
    (categories: string[]) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          expenses: prev.expenses.map((e) =>
            e.category &&
            !isMortgageCategory(e.category) &&
            !categories.includes(e.category)
              ? { ...e, category: "" }
              : e
          ),
          expenseCategories: categories,
        }));
        return;
      }
      setExpenses((prev) =>
        prev.map((e) =>
          e.category &&
          !isMortgageCategory(e.category) &&
          !categories.includes(e.category)
            ? { ...e, category: "" }
            : e
        )
      );
      setExpenseCategoriesState(categories);
    },
    [useDummyData]
  );

  const setIncomeCategories = useCallback(
    (categories: string[]) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          income: prev.income.map((i) =>
            i.category && !categories.includes(i.category)
              ? { ...i, category: "" }
              : i
          ),
          incomeCategories: categories,
        }));
        return;
      }
      setIncome((prev) =>
        prev.map((i) =>
          i.category && !categories.includes(i.category)
            ? { ...i, category: "" }
            : i
        )
      );
      setIncomeCategoriesState(categories);
    },
    [useDummyData]
  );

  const setOwners = useCallback(
    (nextOwners: string[]) => {
      const normalized = nextOwners.map((o) => o.trim()).filter(Boolean);
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          expenses: prev.expenses.map((e) =>
            (e.owner && !normalized.includes(e.owner)) ||
            (e.paidByOwner && !normalized.includes(e.paidByOwner))
              ? {
                  ...e,
                  owner: e.owner && !normalized.includes(e.owner) ? undefined : e.owner,
                  paidByOwner:
                    e.paidByOwner && !normalized.includes(e.paidByOwner)
                      ? undefined
                      : e.paidByOwner,
                  allocation: e.allocation?.filter((a) =>
                    normalized.includes(a.owner),
                  ),
                }
              : e
          ),
          income: prev.income.map((i) =>
            i.owner && !normalized.includes(i.owner)
              ? { ...i, owner: undefined }
              : i
          ),
          debts: prev.debts.map((d) =>
            d.owner && !normalized.includes(d.owner)
              ? { ...d, owner: undefined }
              : d
          ),
          ownerTransfers: prev.ownerTransfers.filter(
            (row) =>
              normalized.includes(row.fromOwner) &&
              normalized.includes(row.toOwner),
          ),
          owners: normalized,
        }));
        return;
      }
      setExpenses((prev) =>
        prev.map((e) =>
          (e.owner && !normalized.includes(e.owner)) ||
          (e.paidByOwner && !normalized.includes(e.paidByOwner))
            ? {
                ...e,
                owner: e.owner && !normalized.includes(e.owner) ? undefined : e.owner,
                paidByOwner:
                  e.paidByOwner && !normalized.includes(e.paidByOwner)
                    ? undefined
                    : e.paidByOwner,
                allocation: e.allocation?.filter((a) => normalized.includes(a.owner)),
              }
            : e
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
      setOwnerTransfers((prev) =>
        prev.filter(
          (row) =>
            normalized.includes(row.fromOwner) &&
            normalized.includes(row.toOwner),
        ),
      );
      setOwnersState(normalized);
    },
    [useDummyData]
  );

  const setCardSources = useCallback(
    (sources: string[]) => {
      if (sources.length === 0) return;
      const fallback = (sources[0] as ExpenseSource) ?? "manual";
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          expenses: prev.expenses.map((e) =>
            sources.includes(e.source) ? e : { ...e, source: fallback }
          ),
          cardSources: sources,
        }));
        return;
      }
      setExpenses((prev) =>
        prev.map((e) =>
          sources.includes(e.source) ? e : { ...e, source: fallback }
        )
      );
      setCardSourcesState(sources);
    },
    [useDummyData]
  );

  const setIOweNova = useCallback(
    (monthKey: string, amount: number) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          iOweNova: { ...prev.iOweNova, [monthKey]: amount },
        }));
        return;
      }
      setIOweNovaState((prev) => ({ ...prev, [monthKey]: amount }));
    },
    [useDummyData]
  );

  const setUiFormatSettings = useCallback((settings: UiFormatSettings) => {
    setUiFormatSettingsState((prev) => ({
      ...prev,
      ...settings,
      baseCurrency: "USD",
      fxRate:
        settings.currency === "USD"
          ? 1
          : Number.isFinite(settings.fxRate) && settings.fxRate > 0
          ? settings.fxRate
          : prev.fxRate || 1,
      currency: settings.currency === "EUR" ? "EUR" : "USD",
    }));
  }, []);

  const repairCorruptedDates = useCallback(() => {
    const activeExpenses = useDummyData ? dummyState.expenses : expenses;
    const activeIncome = useDummyData ? dummyState.income : income;
    let fixedExpenses = 0;
    let fixedIncome = 0;
    const repairedExpenses = activeExpenses.map((e) => {
      if (isValidDate(e.date)) return e;
      const repaired = tryRepairDate(e.date);
      if (repaired) {
        fixedExpenses++;
        return { ...e, date: repaired };
      }
      return e;
    });
    const repairedIncome = activeIncome.map((i) => {
      if (isValidDate(i.date)) return i;
      const repaired = tryRepairDate(i.date);
      if (repaired) {
        fixedIncome++;
        return { ...i, date: repaired };
      }
      return i;
    });

    if (useDummyData) {
      setDummyState((prev) => ({
        ...prev,
        expenses: [...repairedExpenses].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
        income: [...repairedIncome].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
      }));
    } else {
      setExpenses(
        [...repairedExpenses].sort((a, b) => b.date.localeCompare(a.date))
      );
      setIncome(
        [...repairedIncome].sort((a, b) => b.date.localeCompare(a.date))
      );
    }

    return { fixedExpenses, fixedIncome };
  }, [dummyState.expenses, dummyState.income, expenses, income, useDummyData]);

  const value = useMemo<BudgetContextValue>(
    () => ({
      expenses: useDummyData ? dummyState.expenses : expenses,
      income: useDummyData ? dummyState.income : income,
      debts: useDummyData ? dummyState.debts : debts,
      debtPayments: useDummyData ? dummyState.debtPayments : debtPayments,
      ownerTransfers: useDummyData ? dummyState.ownerTransfers : ownerTransfers,
      expenseCategories: useDummyData
        ? dummyState.expenseCategories
        : expenseCategories,
      incomeCategories: useDummyData
        ? dummyState.incomeCategories
        : incomeCategories,
      owners: useDummyData ? dummyState.owners : owners,
      cardSources: useDummyData ? dummyState.cardSources : cardSources,
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
      addOwnerTransfer,
      updateOwnerTransfer,
      removeOwnerTransfer,
      setExpenseCategories,
      setIncomeCategories,
      setOwners,
      setCardSources,
      setIOweNova,
      iOweNova: useDummyData ? dummyState.iOweNova : iOweNova,
      repairCorruptedDates,
      uiFormatSettings,
      setUiFormatSettings,
      useDummyData,
      setUseDummyData,
    }),
    [
      addDebt,
      addDebtPayment,
      addDebtPayments,
      addOwnerTransfer,
      addDebts,
      addExpense,
      addExpenses,
      addIncome,
      addIncomes,
      cardSources,
      debtPayments,
      ownerTransfers,
      debts,
      dummyState,
      expenseCategories,
      expenses,
      iOweNova,
      income,
      incomeCategories,
      owners,
      removeDebt,
      removeDebtPayment,
      removeExpense,
      removeExpenses,
      removeIncome,
      removeOwnerTransfer,
      repairCorruptedDates,
      setCardSources,
      setExpenseCategories,
      setIOweNova,
      setUiFormatSettings,
      setIncomeCategories,
      setOwners,
      uiFormatSettings,
      updateDebt,
      updateDebtPayment,
      updateExpense,
      updateIncome,
      updateOwnerTransfer,
      useDummyData,
      setUseDummyData,
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
