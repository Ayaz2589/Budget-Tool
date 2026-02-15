import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
  type Dispatch,
} from "react";
import type { Debt, DebtPayment } from "@/types/core";

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type DebtAction =
  | { type: "ADD_DEBT"; debt: Debt }
  | { type: "ADD_DEBTS"; debts: Debt[] }
  | { type: "UPDATE_DEBT"; id: string; updates: Partial<Debt> }
  | { type: "REMOVE_DEBT"; id: string }
  | { type: "ADD_PAYMENT"; payment: DebtPayment }
  | { type: "ADD_PAYMENTS"; payments: DebtPayment[] }
  | { type: "UPDATE_PAYMENT"; id: string; updates: Partial<DebtPayment> }
  | { type: "REMOVE_PAYMENT"; id: string }
  | { type: "SET"; debts: Debt[]; debtPayments: DebtPayment[] };

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface DebtState {
  debts: Debt[];
  debtPayments: DebtPayment[];
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function sortPaymentsByDateDesc(arr: DebtPayment[]): DebtPayment[] {
  return arr.sort((a, b) => b.date.localeCompare(a.date));
}

function debtReducer(state: DebtState, action: DebtAction): DebtState {
  switch (action.type) {
    case "ADD_DEBT":
      return { ...state, debts: [...state.debts, action.debt] };
    case "ADD_DEBTS": {
      const byId = new Map(state.debts.map((d) => [d.id, d]));
      for (const d of action.debts) {
        if (!byId.has(d.id)) byId.set(d.id, d);
      }
      return { ...state, debts: Array.from(byId.values()) };
    }
    case "UPDATE_DEBT":
      return {
        ...state,
        debts: state.debts.map((d) =>
          d.id === action.id ? { ...d, ...action.updates } : d,
        ),
      };
    case "REMOVE_DEBT":
      return {
        ...state,
        debts: state.debts.filter((d) => d.id !== action.id),
        debtPayments: state.debtPayments.filter(
          (p) => p.debtId !== action.id,
        ),
      };
    case "ADD_PAYMENT":
      return {
        ...state,
        debtPayments: sortPaymentsByDateDesc([
          ...state.debtPayments,
          action.payment,
        ]),
      };
    case "ADD_PAYMENTS": {
      const byId = new Map(state.debtPayments.map((p) => [p.id, p]));
      for (const p of action.payments) {
        if (!byId.has(p.id)) byId.set(p.id, p);
      }
      return {
        ...state,
        debtPayments: sortPaymentsByDateDesc(Array.from(byId.values())),
      };
    }
    case "UPDATE_PAYMENT":
      return {
        ...state,
        debtPayments: state.debtPayments.map((p) =>
          p.id === action.id ? { ...p, ...action.updates } : p,
        ),
      };
    case "REMOVE_PAYMENT":
      return {
        ...state,
        debtPayments: state.debtPayments.filter((p) => p.id !== action.id),
      };
    case "SET":
      return { debts: action.debts, debtPayments: action.debtPayments };
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface DebtContextValue {
  debts: Debt[];
  debtPayments: DebtPayment[];
  dispatch: Dispatch<DebtAction>;
}

const DebtContext = createContext<DebtContextValue | null>(null);

export function DebtProvider({
  children,
  initialDebts,
  initialDebtPayments,
}: {
  children: ReactNode;
  initialDebts: Debt[];
  initialDebtPayments: DebtPayment[];
}) {
  const [state, dispatch] = useReducer(debtReducer, {
    debts: initialDebts,
    debtPayments: initialDebtPayments,
  });

  const value = useMemo<DebtContextValue>(
    () => ({ debts: state.debts, debtPayments: state.debtPayments, dispatch }),
    [state.debts, state.debtPayments],
  );

  return (
    <DebtContext.Provider value={value}>{children}</DebtContext.Provider>
  );
}

export function useDebt() {
  const ctx = useContext(DebtContext);
  if (!ctx) throw new Error("useDebt must be used within DebtProvider");
  return ctx;
}

export type { DebtAction };
