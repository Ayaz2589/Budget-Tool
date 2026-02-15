import type {
  Expense,
  ExpenseSource,
  OwnerTransfer,
} from "./core";

interface BaseTransactionRow {
  id: string;
  date: string;
  amount: string;
}

export interface ExpenseTransactionRow extends BaseTransactionRow {
  entryType: "expense";
  description: string;
  category: string;
  source: ExpenseSource;
  owner: string;
  paidByOwner: string;
  allocationMode: "single" | "equal" | "custom";
  allocationOwners: string[];
  allocationPercents: Record<string, string>;
  presetId?: string;
  // Transfer fields carried for form state when switching entry types
  transferFromOwner: string;
  transferToOwner: string;
  transferNote: string;
}

export interface TransferTransactionRow extends BaseTransactionRow {
  entryType: "owner-transfer";
  transferFromOwner: string;
  transferToOwner: string;
  transferNote: string;
  // Expense fields carried for form state when switching entry types
  description: string;
  category: string;
  source: ExpenseSource;
  owner: string;
  paidByOwner: string;
  allocationMode: "single" | "equal" | "custom";
  allocationOwners: string[];
  allocationPercents: Record<string, string>;
  presetId?: string;
}

export type TransactionRow = ExpenseTransactionRow | TransferTransactionRow;

export type SortColumn =
  | "date"
  | "amount"
  | "description"
  | "source"
  | "category"
  | "owner";

export interface TransactionLedgerRow {
  kind: "expense" | "owner-transfer";
  id: string;
  date: string;
  amount: number;
  description: string;
  source: ExpenseSource;
  owner?: string;
  category?: string;
  transferFromOwner?: string;
  transferToOwner?: string;
  transferNote?: string;
  expense?: Expense;
  transfer?: OwnerTransfer;
}

// Re-export UI prop types for backward compatibility
export type {
  AddTransactionDialogProps,
  ExpensesByMonthTableProps,
  ExpensesByMonthListProps,
  FiltersAndActionsDialogProps,
  ExpenseActionsDialogProps,
  TransferActionsDialogProps,
  EditTransactionDialogProps,
  EditTransferDialogProps,
  DeleteOneTransactionDialogProps,
  DeleteSelectedTransactionsDialogProps,
  DeleteAllTransactionsDialogProps,
  TransactionsToolbarProps,
} from "./transactions-ui";
