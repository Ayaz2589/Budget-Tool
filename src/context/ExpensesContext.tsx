import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
  type Dispatch,
} from "react";
import type { Expense } from "@/types/core";

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type ExpensesAction =
  | { type: "ADD"; expense: Expense }
  | { type: "ADD_MANY"; expenses: Expense[] }
  | { type: "UPDATE"; id: string; updates: Partial<Expense> }
  | { type: "REMOVE"; id: string }
  | { type: "REMOVE_MANY"; ids: string[] }
  | { type: "SET"; expenses: Expense[] };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function sortByDateDesc(arr: Expense[]): Expense[] {
  return arr.sort((a, b) => b.date.localeCompare(a.date));
}

function expensesReducer(state: Expense[], action: ExpensesAction): Expense[] {
  switch (action.type) {
    case "ADD": {
      return sortByDateDesc([...state, action.expense]);
    }
    case "ADD_MANY": {
      const byId = new Map(state.map((e) => [e.id, e]));
      for (const e of action.expenses) {
        if (!byId.has(e.id))
          byId.set(e.id, {
            ...e,
            paidByOwner: e.paidByOwner ?? e.owner,
          });
      }
      return sortByDateDesc(Array.from(byId.values()));
    }
    case "UPDATE": {
      const normalizedUpdates: Partial<Expense> =
        "owner" in action.updates && !("paidByOwner" in action.updates)
          ? { ...action.updates, paidByOwner: action.updates.owner }
          : action.updates;
      return state.map((e) =>
        e.id === action.id ? { ...e, ...normalizedUpdates } : e,
      );
    }
    case "REMOVE":
      return state.filter((e) => e.id !== action.id);
    case "REMOVE_MANY": {
      const idSet = new Set(action.ids);
      return state.filter((e) => !idSet.has(e.id));
    }
    case "SET":
      return action.expenses;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface ExpensesContextValue {
  expenses: Expense[];
  dispatch: Dispatch<ExpensesAction>;
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({
  children,
  initialExpenses,
}: {
  children: ReactNode;
  initialExpenses: Expense[];
}) {
  const [expenses, dispatch] = useReducer(expensesReducer, initialExpenses);

  const value = useMemo<ExpensesContextValue>(
    () => ({ expenses, dispatch }),
    [expenses],
  );

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext);
  if (!ctx)
    throw new Error("useExpenses must be used within ExpensesProvider");
  return ctx;
}

export type { ExpensesAction };
