import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
  type Dispatch,
} from "react";
import type { Income } from "@/types/core";

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type IncomeAction =
  | { type: "ADD"; income: Income }
  | { type: "ADD_MANY"; income: Income[] }
  | { type: "UPDATE"; id: string; updates: Partial<Income> }
  | { type: "REMOVE"; id: string }
  | { type: "SET"; income: Income[] };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function sortByDateDesc(arr: Income[]): Income[] {
  return arr.sort((a, b) => b.date.localeCompare(a.date));
}

function incomeReducer(state: Income[], action: IncomeAction): Income[] {
  switch (action.type) {
    case "ADD":
      return sortByDateDesc([...state, action.income]);
    case "ADD_MANY": {
      const byId = new Map(state.map((i) => [i.id, i]));
      for (const i of action.income) {
        if (!byId.has(i.id)) byId.set(i.id, i);
      }
      return sortByDateDesc(Array.from(byId.values()));
    }
    case "UPDATE":
      return state.map((i) =>
        i.id === action.id ? { ...i, ...action.updates } : i,
      );
    case "REMOVE":
      return state.filter((i) => i.id !== action.id);
    case "SET":
      return action.income;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface IncomeContextValue {
  income: Income[];
  dispatch: Dispatch<IncomeAction>;
}

const IncomeContext = createContext<IncomeContextValue | null>(null);

export function IncomeProvider({
  children,
  initialIncome,
}: {
  children: ReactNode;
  initialIncome: Income[];
}) {
  const [income, dispatch] = useReducer(incomeReducer, initialIncome);

  const value = useMemo<IncomeContextValue>(
    () => ({ income, dispatch }),
    [income],
  );

  return (
    <IncomeContext.Provider value={value}>{children}</IncomeContext.Provider>
  );
}

export function useIncome() {
  const ctx = useContext(IncomeContext);
  if (!ctx) throw new Error("useIncome must be used within IncomeProvider");
  return ctx;
}

export type { IncomeAction };
