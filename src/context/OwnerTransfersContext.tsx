import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
  type Dispatch,
} from "react";
import type { OwnerTransfer } from "@/types/core";

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type OwnerTransfersAction =
  | { type: "ADD"; transfer: OwnerTransfer }
  | { type: "UPDATE"; id: string; updates: Partial<OwnerTransfer> }
  | { type: "REMOVE"; id: string }
  | { type: "SET"; transfers: OwnerTransfer[] };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function sortByDateDesc(arr: OwnerTransfer[]): OwnerTransfer[] {
  return arr.sort((a, b) => b.date.localeCompare(a.date));
}

function ownerTransfersReducer(
  state: OwnerTransfer[],
  action: OwnerTransfersAction,
): OwnerTransfer[] {
  switch (action.type) {
    case "ADD":
      return sortByDateDesc([...state, action.transfer]);
    case "UPDATE":
      return state.map((row) =>
        row.id === action.id ? { ...row, ...action.updates } : row,
      );
    case "REMOVE":
      return state.filter((row) => row.id !== action.id);
    case "SET":
      return action.transfers;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface OwnerTransfersContextValue {
  ownerTransfers: OwnerTransfer[];
  dispatch: Dispatch<OwnerTransfersAction>;
}

const OwnerTransfersContext =
  createContext<OwnerTransfersContextValue | null>(null);

export function OwnerTransfersProvider({
  children,
  initialOwnerTransfers,
}: {
  children: ReactNode;
  initialOwnerTransfers: OwnerTransfer[];
}) {
  const [ownerTransfers, dispatch] = useReducer(
    ownerTransfersReducer,
    initialOwnerTransfers,
  );

  const value = useMemo<OwnerTransfersContextValue>(
    () => ({ ownerTransfers, dispatch }),
    [ownerTransfers],
  );

  return (
    <OwnerTransfersContext.Provider value={value}>
      {children}
    </OwnerTransfersContext.Provider>
  );
}

export function useOwnerTransfers() {
  const ctx = useContext(OwnerTransfersContext);
  if (!ctx)
    throw new Error(
      "useOwnerTransfers must be used within OwnerTransfersProvider",
    );
  return ctx;
}

export type { OwnerTransfersAction };
