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
import { ALL_EXPENSE_SOURCES } from "@/lib/types";
import { isMortgageCategory } from "@/lib/domain/mortgageCategory";
import { isValidDate, tryRepairDate } from "@/lib/domain/dateRepair";
import { buildDummyBudget, type DummyBudgetData } from "@/lib/import/dummyData";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";
import type { BudgetState } from "@/types/budget";
import type { BudgetContextValue } from "@/types/context";

import {
  ExpensesProvider,
  useExpenses,
  type ExpensesAction,
} from "./ExpensesContext";
import { IncomeProvider, useIncome, type IncomeAction } from "./IncomeContext";
import { DebtProvider, useDebt, type DebtAction } from "./DebtContext";
import {
  OwnerTransfersProvider,
  useOwnerTransfers,
  type OwnerTransfersAction,
} from "./OwnerTransfersContext";
import {
  SettingsProvider,
  useSettings,
  type StoredSettingsData,
} from "./SettingsContext";

export type { BudgetState };

const BudgetContext = createContext<BudgetContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

// ---------------------------------------------------------------------------
// Load stored budget data (transaction arrays only; settings loaded separately)
// ---------------------------------------------------------------------------

interface StoredTransactionData {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  ownerTransfers: OwnerTransfer[];
}

interface StoredBudgetRaw {
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
}

export function loadStoredBudget(): StoredBudgetRaw {
  try {
    const raw = storage.getItem(STORAGE_KEYS.BUDGET_DATA);
    if (raw) {
      const data = JSON.parse(raw) as Partial<{
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
      }>;
      const cardSources = Array.isArray(data.cardSources)
        ? (() => {
            const filtered = data.cardSources.filter(
              (s): s is ExpenseSource =>
                ALL_EXPENSE_SOURCES.includes(s as ExpenseSource),
            );
            for (const src of ALL_EXPENSE_SOURCES) {
              if (!filtered.includes(src)) filtered.push(src);
            }
            return filtered;
          })()
        : [...ALL_EXPENSE_SOURCES];
      const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
      const isValidRecord = (r: { amount?: unknown; date?: unknown }) =>
        Number.isFinite(r.amount) &&
        typeof r.date === "string" &&
        isoDateRe.test(r.date);

      const rawExpenses = Array.isArray(data.expenses)
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
        : [];
      const validExpenses = rawExpenses.filter((e) => {
        if (!isValidRecord(e)) {
          console.warn("[budget] Skipping invalid expense from storage:", e.id);
          return false;
        }
        return true;
      });

      const rawIncome = Array.isArray(data.income) ? data.income : [];
      const validIncome = rawIncome.filter((i) => {
        if (!isValidRecord(i)) {
          console.warn("[budget] Skipping invalid income from storage:", i.id);
          return false;
        }
        return true;
      });

      return {
        expenses: validExpenses,
        income: validIncome,
        debts: Array.isArray(data.debts) ? data.debts : [],
        debtPayments: Array.isArray(data.debtPayments)
          ? data.debtPayments
          : [],
        ownerTransfers: Array.isArray(data.ownerTransfers)
          ? data.ownerTransfers
          : [],
        ownerBalances:
          data.ownerBalances && typeof data.ownerBalances === "object"
            ? data.ownerBalances
            : {},
        cardSources:
          cardSources.length > 0 ? cardSources : [...ALL_EXPENSE_SOURCES],
        expenseCategories:
          Array.isArray(data.expenseCategories) &&
          data.expenseCategories.every((c) => typeof c === "string")
            ? data.expenseCategories
            : [],
        incomeCategories:
          Array.isArray(data.incomeCategories) &&
          data.incomeCategories.every((c) => typeof c === "string")
            ? data.incomeCategories
            : [],
        owners:
          Array.isArray(data.owners) &&
          data.owners.every((o) => typeof o === "string")
            ? data.owners
            : [],
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
    ownerBalances: {},
    cardSources: [...ALL_EXPENSE_SOURCES],
    expenseCategories: [],
    incomeCategories: [],
    owners: [],
  };
}

// ---------------------------------------------------------------------------
// Inner composer: reads sub-contexts and builds the backward-compatible value
// ---------------------------------------------------------------------------

function BudgetComposer({
  children,
  useDummyData,
  setUseDummyData,
  dummyState,
  setDummyState,
}: {
  children: ReactNode;
  useDummyData: boolean;
  setUseDummyData: (value: boolean) => void;
  dummyState: DummyBudgetData;
  setDummyState: React.Dispatch<React.SetStateAction<DummyBudgetData>>;
}) {
  const { expenses: realExpenses, dispatch: expensesDispatch } = useExpenses();
  const { income: realIncome, dispatch: incomeDispatch } = useIncome();
  const {
    debts: realDebts,
    debtPayments: realDebtPayments,
    dispatch: debtDispatch,
  } = useDebt();
  const { ownerTransfers: realOwnerTransfers, dispatch: transfersDispatch } =
    useOwnerTransfers();
  const settings = useSettings();

  // Active data: dummy or real
  const expenses = useDummyData ? dummyState.expenses : realExpenses;
  const income = useDummyData ? dummyState.income : realIncome;
  const debts = useDummyData ? dummyState.debts : realDebts;
  const debtPayments = useDummyData
    ? dummyState.debtPayments
    : realDebtPayments;
  const ownerTransfers = useDummyData
    ? dummyState.ownerTransfers
    : realOwnerTransfers;
  const expenseCategories = useDummyData
    ? dummyState.expenseCategories
    : settings.expenseCategories;
  const incomeCategories = useDummyData
    ? dummyState.incomeCategories
    : settings.incomeCategories;
  const owners = useDummyData ? dummyState.owners : settings.owners;
  const cardSources = useDummyData
    ? dummyState.cardSources
    : settings.cardSources;
  const ownerBalances = useDummyData
    ? dummyState.ownerBalances
    : settings.ownerBalances;

  // --- Persistence effect (only for real data) ---
  useEffect(() => {
    if (useDummyData) return;
    storage.setItem(
      STORAGE_KEYS.BUDGET_DATA,
      JSON.stringify({
        expenses: realExpenses,
        income: realIncome,
        debts: realDebts,
        debtPayments: realDebtPayments,
        ownerTransfers: realOwnerTransfers,
        ownerBalances: settings.ownerBalances,
        cardSources: settings.cardSources,
        expenseCategories: settings.expenseCategories,
        incomeCategories: settings.incomeCategories,
        owners: settings.owners,
      }),
    );
  }, [
    useDummyData,
    realExpenses,
    realIncome,
    realDebts,
    realDebtPayments,
    realOwnerTransfers,
    settings.ownerBalances,
    settings.cardSources,
    settings.expenseCategories,
    settings.incomeCategories,
    settings.owners,
  ]);

  // ---------------------------------------------------------------------------
  // Dispatch helpers — thin wrappers that route to dummy or real reducers
  // ---------------------------------------------------------------------------

  const dispatchExpenses = useCallback(
    (action: ExpensesAction) => {
      if (useDummyData) {
        setDummyState((prev) => {
          switch (action.type) {
            case "ADD":
              return {
                ...prev,
                expenses: [...prev.expenses, action.expense].sort((a, b) =>
                  b.date.localeCompare(a.date),
                ),
              };
            case "ADD_MANY": {
              const byId = new Map(prev.expenses.map((e) => [e.id, e]));
              for (const e of action.expenses) {
                if (!byId.has(e.id))
                  byId.set(e.id, {
                    ...e,
                    paidByOwner: e.paidByOwner ?? e.owner,
                  });
              }
              return {
                ...prev,
                expenses: Array.from(byId.values()).sort((a, b) =>
                  b.date.localeCompare(a.date),
                ),
              };
            }
            case "UPDATE": {
              const normalizedUpdates: Partial<Expense> =
                "owner" in action.updates &&
                !("paidByOwner" in action.updates)
                  ? { ...action.updates, paidByOwner: action.updates.owner }
                  : action.updates;
              return {
                ...prev,
                expenses: prev.expenses.map((e) =>
                  e.id === action.id ? { ...e, ...normalizedUpdates } : e,
                ),
              };
            }
            case "REMOVE":
              return {
                ...prev,
                expenses: prev.expenses.filter((e) => e.id !== action.id),
              };
            case "REMOVE_MANY": {
              const idSet = new Set(action.ids);
              return {
                ...prev,
                expenses: prev.expenses.filter((e) => !idSet.has(e.id)),
              };
            }
            case "SET":
              return { ...prev, expenses: action.expenses };
          }
        });
      } else {
        expensesDispatch(action);
      }
    },
    [useDummyData, expensesDispatch, setDummyState],
  );

  const dispatchIncome = useCallback(
    (action: IncomeAction) => {
      if (useDummyData) {
        setDummyState((prev) => {
          switch (action.type) {
            case "ADD":
              return {
                ...prev,
                income: [...prev.income, action.income].sort((a, b) =>
                  b.date.localeCompare(a.date),
                ),
              };
            case "ADD_MANY": {
              const byId = new Map(prev.income.map((i) => [i.id, i]));
              for (const i of action.income) {
                if (!byId.has(i.id)) byId.set(i.id, i);
              }
              return {
                ...prev,
                income: Array.from(byId.values()).sort((a, b) =>
                  b.date.localeCompare(a.date),
                ),
              };
            }
            case "UPDATE":
              return {
                ...prev,
                income: prev.income.map((i) =>
                  i.id === action.id ? { ...i, ...action.updates } : i,
                ),
              };
            case "REMOVE":
              return {
                ...prev,
                income: prev.income.filter((i) => i.id !== action.id),
              };
            case "SET":
              return { ...prev, income: action.income };
          }
        });
      } else {
        incomeDispatch(action);
      }
    },
    [useDummyData, incomeDispatch, setDummyState],
  );

  const dispatchDebt = useCallback(
    (action: DebtAction) => {
      if (useDummyData) {
        setDummyState((prev) => {
          switch (action.type) {
            case "ADD_DEBT":
              return { ...prev, debts: [...prev.debts, action.debt] };
            case "ADD_DEBTS": {
              const byId = new Map(prev.debts.map((d) => [d.id, d]));
              for (const d of action.debts) {
                if (!byId.has(d.id)) byId.set(d.id, d);
              }
              return { ...prev, debts: Array.from(byId.values()) };
            }
            case "UPDATE_DEBT":
              return {
                ...prev,
                debts: prev.debts.map((d) =>
                  d.id === action.id ? { ...d, ...action.updates } : d,
                ),
              };
            case "REMOVE_DEBT":
              return {
                ...prev,
                debts: prev.debts.filter((d) => d.id !== action.id),
                debtPayments: prev.debtPayments.filter(
                  (p) => p.debtId !== action.id,
                ),
              };
            case "ADD_PAYMENT":
              return {
                ...prev,
                debtPayments: [...prev.debtPayments, action.payment].sort(
                  (a, b) => b.date.localeCompare(a.date),
                ),
              };
            case "ADD_PAYMENTS": {
              const byId = new Map(prev.debtPayments.map((p) => [p.id, p]));
              for (const p of action.payments) {
                if (!byId.has(p.id)) byId.set(p.id, p);
              }
              return {
                ...prev,
                debtPayments: Array.from(byId.values()).sort((a, b) =>
                  b.date.localeCompare(a.date),
                ),
              };
            }
            case "UPDATE_PAYMENT":
              return {
                ...prev,
                debtPayments: prev.debtPayments.map((p) =>
                  p.id === action.id ? { ...p, ...action.updates } : p,
                ),
              };
            case "REMOVE_PAYMENT":
              return {
                ...prev,
                debtPayments: prev.debtPayments.filter(
                  (p) => p.id !== action.id,
                ),
              };
            case "SET":
              return {
                ...prev,
                debts: action.debts,
                debtPayments: action.debtPayments,
              };
          }
        });
      } else {
        debtDispatch(action);
      }
    },
    [useDummyData, debtDispatch, setDummyState],
  );

  const dispatchTransfers = useCallback(
    (action: OwnerTransfersAction) => {
      if (useDummyData) {
        setDummyState((prev) => {
          switch (action.type) {
            case "ADD":
              return {
                ...prev,
                ownerTransfers: [
                  ...prev.ownerTransfers,
                  action.transfer,
                ].sort((a, b) => b.date.localeCompare(a.date)),
              };
            case "UPDATE":
              return {
                ...prev,
                ownerTransfers: prev.ownerTransfers.map((row) =>
                  row.id === action.id
                    ? { ...row, ...action.updates }
                    : row,
                ),
              };
            case "REMOVE":
              return {
                ...prev,
                ownerTransfers: prev.ownerTransfers.filter(
                  (row) => row.id !== action.id,
                ),
              };
            case "SET":
              return { ...prev, ownerTransfers: action.transfers };
          }
        });
      } else {
        transfersDispatch(action);
      }
    },
    [useDummyData, transfersDispatch, setDummyState],
  );

  // ---------------------------------------------------------------------------
  // Backward-compatible action callbacks
  // ---------------------------------------------------------------------------

  const addExpenses = useCallback(
    (newExpenses: Expense[]) => {
      dispatchExpenses({ type: "ADD_MANY", expenses: newExpenses });
    },
    [dispatchExpenses],
  );

  const addExpense = useCallback(
    (entry: Omit<Expense, "id">) => {
      const newExpense: Expense = {
        ...entry,
        id: generateId(),
        paidByOwner: entry.paidByOwner ?? entry.owner,
      };
      dispatchExpenses({ type: "ADD", expense: newExpense });
    },
    [dispatchExpenses],
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<Expense>) => {
      dispatchExpenses({ type: "UPDATE", id, updates });
    },
    [dispatchExpenses],
  );

  const removeExpense = useCallback(
    (id: string) => {
      dispatchExpenses({ type: "REMOVE", id });
    },
    [dispatchExpenses],
  );

  const removeExpenses = useCallback(
    (ids: string[]) => {
      dispatchExpenses({ type: "REMOVE_MANY", ids });
    },
    [dispatchExpenses],
  );

  const addIncome = useCallback(
    (entry: Omit<Income, "id">) => {
      const newEntry: Income = { ...entry, id: generateId() };
      dispatchIncome({ type: "ADD", income: newEntry });
    },
    [dispatchIncome],
  );

  const addIncomes = useCallback(
    (newIncome: Income[]) => {
      dispatchIncome({ type: "ADD_MANY", income: newIncome });
    },
    [dispatchIncome],
  );

  const updateIncome = useCallback(
    (id: string, updates: Partial<Income>) => {
      dispatchIncome({ type: "UPDATE", id, updates });
    },
    [dispatchIncome],
  );

  const removeIncome = useCallback(
    (id: string) => {
      dispatchIncome({ type: "REMOVE", id });
    },
    [dispatchIncome],
  );

  const addDebt = useCallback(
    (entry: Omit<Debt, "id">) => {
      const newDebt: Debt = { ...entry, id: generateId() };
      dispatchDebt({ type: "ADD_DEBT", debt: newDebt });
    },
    [dispatchDebt],
  );

  const addDebts = useCallback(
    (newDebts: Debt[]) => {
      dispatchDebt({ type: "ADD_DEBTS", debts: newDebts });
    },
    [dispatchDebt],
  );

  const updateDebt = useCallback(
    (id: string, updates: Partial<Debt>) => {
      dispatchDebt({ type: "UPDATE_DEBT", id, updates });
    },
    [dispatchDebt],
  );

  const removeDebt = useCallback(
    (id: string) => {
      dispatchDebt({ type: "REMOVE_DEBT", id });
    },
    [dispatchDebt],
  );

  const addDebtPayment = useCallback(
    (entry: Omit<DebtPayment, "id">) => {
      const newPayment: DebtPayment = { ...entry, id: generateId() };
      dispatchDebt({ type: "ADD_PAYMENT", payment: newPayment });
    },
    [dispatchDebt],
  );

  const addDebtPayments = useCallback(
    (newPayments: DebtPayment[]) => {
      dispatchDebt({ type: "ADD_PAYMENTS", payments: newPayments });
    },
    [dispatchDebt],
  );

  const updateDebtPayment = useCallback(
    (id: string, updates: Partial<DebtPayment>) => {
      dispatchDebt({ type: "UPDATE_PAYMENT", id, updates });
    },
    [dispatchDebt],
  );

  const removeDebtPayment = useCallback(
    (id: string) => {
      dispatchDebt({ type: "REMOVE_PAYMENT", id });
    },
    [dispatchDebt],
  );

  const addOwnerTransfer = useCallback(
    (entry: Omit<OwnerTransfer, "id"> | OwnerTransfer) => {
      const newTransfer: OwnerTransfer = {
        ...entry,
        id: "id" in entry && entry.id ? entry.id : generateId(),
      };
      dispatchTransfers({ type: "ADD", transfer: newTransfer });
    },
    [dispatchTransfers],
  );

  const updateOwnerTransfer = useCallback(
    (id: string, updates: Partial<OwnerTransfer>) => {
      dispatchTransfers({ type: "UPDATE", id, updates });
    },
    [dispatchTransfers],
  );

  const removeOwnerTransfer = useCallback(
    (id: string) => {
      dispatchTransfers({ type: "REMOVE", id });
    },
    [dispatchTransfers],
  );

  // --- Cross-concern setters that touch both settings and transactions ---

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
              : e,
          ),
          expenseCategories: categories,
        }));
      } else {
        // Clear categories from expenses that no longer exist
        dispatchExpenses({
          type: "SET",
          expenses: realExpenses.map((e) =>
            e.category &&
            !isMortgageCategory(e.category) &&
            !categories.includes(e.category)
              ? { ...e, category: "" }
              : e,
          ),
        });
        settings.setExpenseCategories(categories);
      }
    },
    [useDummyData, setDummyState, dispatchExpenses, realExpenses, settings],
  );

  const setIncomeCategories = useCallback(
    (categories: string[]) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          income: prev.income.map((i) =>
            i.category && !categories.includes(i.category)
              ? { ...i, category: "" }
              : i,
          ),
          incomeCategories: categories,
        }));
      } else {
        dispatchIncome({
          type: "SET",
          income: realIncome.map((i) =>
            i.category && !categories.includes(i.category)
              ? { ...i, category: "" }
              : i,
          ),
        });
        settings.setIncomeCategories(categories);
      }
    },
    [useDummyData, setDummyState, dispatchIncome, realIncome, settings],
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
                  owner:
                    e.owner && !normalized.includes(e.owner)
                      ? undefined
                      : e.owner,
                  paidByOwner:
                    e.paidByOwner && !normalized.includes(e.paidByOwner)
                      ? undefined
                      : e.paidByOwner,
                  allocation: e.allocation?.filter((a) =>
                    normalized.includes(a.owner),
                  ),
                }
              : e,
          ),
          income: prev.income.map((i) =>
            i.owner && !normalized.includes(i.owner)
              ? { ...i, owner: undefined }
              : i,
          ),
          debts: prev.debts.map((d) =>
            d.owner && !normalized.includes(d.owner)
              ? { ...d, owner: undefined }
              : d,
          ),
          ownerTransfers: prev.ownerTransfers.filter(
            (row) =>
              normalized.includes(row.fromOwner) &&
              normalized.includes(row.toOwner),
          ),
          owners: normalized,
        }));
      } else {
        dispatchExpenses({
          type: "SET",
          expenses: realExpenses.map((e) =>
            (e.owner && !normalized.includes(e.owner)) ||
            (e.paidByOwner && !normalized.includes(e.paidByOwner))
              ? {
                  ...e,
                  owner:
                    e.owner && !normalized.includes(e.owner)
                      ? undefined
                      : e.owner,
                  paidByOwner:
                    e.paidByOwner && !normalized.includes(e.paidByOwner)
                      ? undefined
                      : e.paidByOwner,
                  allocation: e.allocation?.filter((a) =>
                    normalized.includes(a.owner),
                  ),
                }
              : e,
          ),
        });
        dispatchIncome({
          type: "SET",
          income: realIncome.map((i) =>
            i.owner && !normalized.includes(i.owner)
              ? { ...i, owner: undefined }
              : i,
          ),
        });
        dispatchDebt({
          type: "SET",
          debts: realDebts.map((d) =>
            d.owner && !normalized.includes(d.owner)
              ? { ...d, owner: undefined }
              : d,
          ),
          debtPayments: realDebtPayments,
        });
        dispatchTransfers({
          type: "SET",
          transfers: realOwnerTransfers.filter(
            (row) =>
              normalized.includes(row.fromOwner) &&
              normalized.includes(row.toOwner),
          ),
        });
        settings.setOwners(normalized);
      }
    },
    [
      useDummyData,
      setDummyState,
      dispatchExpenses,
      dispatchIncome,
      dispatchDebt,
      dispatchTransfers,
      realExpenses,
      realIncome,
      realDebts,
      realDebtPayments,
      realOwnerTransfers,
      settings,
    ],
  );

  const setCardSources = useCallback(
    (sources: string[]) => {
      if (sources.length === 0) return;
      const fallback = (sources[0] as ExpenseSource) ?? "manual";
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          expenses: prev.expenses.map((e) =>
            sources.includes(e.source) ? e : { ...e, source: fallback },
          ),
          cardSources: sources,
        }));
      } else {
        dispatchExpenses({
          type: "SET",
          expenses: realExpenses.map((e) =>
            sources.includes(e.source) ? e : { ...e, source: fallback },
          ),
        });
        settings.setCardSources(sources);
      }
    },
    [useDummyData, setDummyState, dispatchExpenses, realExpenses, settings],
  );

  const setOwnerBalance = useCallback(
    (monthKey: string, owner: string, amount: number) => {
      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          ownerBalances: {
            ...prev.ownerBalances,
            [monthKey]: {
              ...(prev.ownerBalances[monthKey] ?? {}),
              [owner]: amount,
            },
          },
        }));
      } else {
        settings.setOwnerBalance(monthKey, owner, amount);
      }
    },
    [useDummyData, setDummyState, settings],
  );

  // ---------------------------------------------------------------------------
  // Rename helpers — atomically rename across settings + all transactions
  // ---------------------------------------------------------------------------

  const renameOwner = useCallback(
    (oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;

      const renameInOwnersList = (list: string[]) =>
        list.map((o) => (o === oldName ? trimmed : o));

      const renameExpenseOwner = (e: Expense): Expense => {
        const changed =
          e.owner === oldName ||
          e.paidByOwner === oldName ||
          e.allocation?.some((a) => a.owner === oldName);
        if (!changed) return e;
        return {
          ...e,
          owner: e.owner === oldName ? trimmed : e.owner,
          paidByOwner: e.paidByOwner === oldName ? trimmed : e.paidByOwner,
          allocation: e.allocation?.map((a) =>
            a.owner === oldName ? { ...a, owner: trimmed } : a,
          ),
        };
      };

      const renameIncomeOwner = (i: Income): Income =>
        i.owner === oldName ? { ...i, owner: trimmed } : i;

      const renameDebtOwner = (d: Debt): Debt =>
        d.owner === oldName ? { ...d, owner: trimmed } : d;

      const renameTransferOwner = (t: OwnerTransfer): OwnerTransfer => {
        const changed = t.fromOwner === oldName || t.toOwner === oldName;
        if (!changed) return t;
        return {
          ...t,
          fromOwner: t.fromOwner === oldName ? trimmed : t.fromOwner,
          toOwner: t.toOwner === oldName ? trimmed : t.toOwner,
        };
      };

      const renameBalanceOwner = (
        balances: Record<string, Record<string, number>>,
      ): Record<string, Record<string, number>> => {
        const result: Record<string, Record<string, number>> = {};
        for (const [month, ownerMap] of Object.entries(balances)) {
          const newMap: Record<string, number> = {};
          for (const [owner, amount] of Object.entries(ownerMap)) {
            newMap[owner === oldName ? trimmed : owner] = amount;
          }
          result[month] = newMap;
        }
        return result;
      };

      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          owners: renameInOwnersList(prev.owners),
          expenses: prev.expenses.map(renameExpenseOwner),
          income: prev.income.map(renameIncomeOwner),
          debts: prev.debts.map(renameDebtOwner),
          ownerTransfers: prev.ownerTransfers.map(renameTransferOwner),
          ownerBalances: renameBalanceOwner(prev.ownerBalances),
        }));
      } else {
        dispatchExpenses({
          type: "SET",
          expenses: realExpenses.map(renameExpenseOwner),
        });
        dispatchIncome({
          type: "SET",
          income: realIncome.map(renameIncomeOwner),
        });
        dispatchDebt({
          type: "SET",
          debts: realDebts.map(renameDebtOwner),
          debtPayments: realDebtPayments,
        });
        dispatchTransfers({
          type: "SET",
          transfers: realOwnerTransfers.map(renameTransferOwner),
        });
        settings.setOwners(renameInOwnersList(settings.owners));
        // Rename owner in balances
        const newBalances = renameBalanceOwner(settings.ownerBalances);
        for (const [month, ownerMap] of Object.entries(newBalances)) {
          for (const [owner, amount] of Object.entries(ownerMap)) {
            settings.setOwnerBalance(month, owner, amount);
          }
        }
      }
    },
    [
      useDummyData,
      setDummyState,
      dispatchExpenses,
      dispatchIncome,
      dispatchDebt,
      dispatchTransfers,
      realExpenses,
      realIncome,
      realDebts,
      realDebtPayments,
      realOwnerTransfers,
      settings,
    ],
  );

  const renameExpenseCategory = useCallback(
    (oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;

      const renameInList = (list: string[]) =>
        list.map((c) => (c === oldName ? trimmed : c));

      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          expenseCategories: renameInList(prev.expenseCategories),
          expenses: prev.expenses.map((e) =>
            e.category === oldName ? { ...e, category: trimmed } : e,
          ),
        }));
      } else {
        dispatchExpenses({
          type: "SET",
          expenses: realExpenses.map((e) =>
            e.category === oldName ? { ...e, category: trimmed } : e,
          ),
        });
        settings.setExpenseCategories(
          renameInList(settings.expenseCategories),
        );
      }
    },
    [useDummyData, setDummyState, dispatchExpenses, realExpenses, settings],
  );

  const renameIncomeCategory = useCallback(
    (oldName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return;

      const renameInList = (list: string[]) =>
        list.map((c) => (c === oldName ? trimmed : c));

      if (useDummyData) {
        setDummyState((prev) => ({
          ...prev,
          incomeCategories: renameInList(prev.incomeCategories),
          income: prev.income.map((i) =>
            i.category === oldName ? { ...i, category: trimmed } : i,
          ),
        }));
      } else {
        dispatchIncome({
          type: "SET",
          income: realIncome.map((i) =>
            i.category === oldName ? { ...i, category: trimmed } : i,
          ),
        });
        settings.setIncomeCategories(
          renameInList(settings.incomeCategories),
        );
      }
    },
    [useDummyData, setDummyState, dispatchIncome, realIncome, settings],
  );

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

    dispatchExpenses({
      type: "SET",
      expenses: [...repairedExpenses].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    });
    dispatchIncome({
      type: "SET",
      income: [...repairedIncome].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    });

    return { fixedExpenses, fixedIncome };
  }, [expenses, income, dispatchExpenses, dispatchIncome]);

  // ---------------------------------------------------------------------------
  // Compose the backward-compatible context value
  // ---------------------------------------------------------------------------

  const value = useMemo<BudgetContextValue>(
    () => ({
      expenses,
      income,
      debts,
      debtPayments,
      ownerTransfers,
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
      addOwnerTransfer,
      updateOwnerTransfer,
      removeOwnerTransfer,
      setExpenseCategories,
      setIncomeCategories,
      setOwners,
      renameOwner,
      renameExpenseCategory,
      renameIncomeCategory,
      setCardSources,
      setOwnerBalance,
      ownerBalances,
      repairCorruptedDates,
      uiFormatSettings: settings.uiFormatSettings,
      setUiFormatSettings: settings.setUiFormatSettings,
      isCurrencyUpdating: settings.isCurrencyUpdating,
      useDummyData,
      setUseDummyData,
    }),
    [
      expenses,
      income,
      debts,
      debtPayments,
      ownerTransfers,
      expenseCategories,
      incomeCategories,
      owners,
      cardSources,
      ownerBalances,
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
      renameOwner,
      renameExpenseCategory,
      renameIncomeCategory,
      setCardSources,
      setOwnerBalance,
      repairCorruptedDates,
      settings.uiFormatSettings,
      settings.setUiFormatSettings,
      settings.isCurrencyUpdating,
      useDummyData,
      setUseDummyData,
    ],
  );

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Public BudgetProvider — sets up sub-context providers + dummy data state
// ---------------------------------------------------------------------------

export function BudgetProvider({ children }: { children: ReactNode }) {
  const isDev = import.meta.env.DEV;
  const stored = loadStoredBudget();

  const transactionData: StoredTransactionData = {
    expenses: stored.expenses,
    income: stored.income,
    debts: stored.debts,
    debtPayments: stored.debtPayments,
    ownerTransfers: stored.ownerTransfers,
  };

  const settingsData: StoredSettingsData = {
    ownerBalances: stored.ownerBalances,
    cardSources: stored.cardSources,
    expenseCategories: stored.expenseCategories,
    incomeCategories: stored.incomeCategories,
    owners: stored.owners,
  };

  const [useDummyData, setUseDummyDataState] = useState(() => {
    if (!isDev) return false;
    return storage.getItem(STORAGE_KEYS.DUMMY_MODE) === "true";
  });
  const [dummyState, setDummyState] = useState<DummyBudgetData>(() =>
    buildDummyBudget(getCurrentMonthKey()),
  );

  const setUseDummyData = useCallback(
    (value: boolean) => {
      if (!isDev) return;
      setUseDummyDataState(value);
    },
    [isDev],
  );

  useEffect(() => {
    if (!isDev) return;
    storage.setItem(
      STORAGE_KEYS.DUMMY_MODE,
      useDummyData ? "true" : "false",
    );
  }, [isDev, useDummyData]);

  return (
    <SettingsProvider initialSettings={settingsData}>
      <ExpensesProvider initialExpenses={transactionData.expenses}>
        <IncomeProvider initialIncome={transactionData.income}>
          <DebtProvider
            initialDebts={transactionData.debts}
            initialDebtPayments={transactionData.debtPayments}
          >
            <OwnerTransfersProvider
              initialOwnerTransfers={transactionData.ownerTransfers}
            >
              <BudgetComposer
                useDummyData={useDummyData}
                setUseDummyData={setUseDummyData}
                dummyState={dummyState}
                setDummyState={setDummyState}
              >
                {children}
              </BudgetComposer>
            </OwnerTransfersProvider>
          </DebtProvider>
        </IncomeProvider>
      </ExpensesProvider>
    </SettingsProvider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
