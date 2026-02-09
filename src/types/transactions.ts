import type {
  Expense,
  ExpenseAllocation,
  ExpenseSource,
  LedgerEntryType,
  OwnerTransfer,
} from "./core";

export interface TransactionRow {
  id: string;
  entryType: LedgerEntryType;
  date: string;
  amount: string;
  description: string;
  category: string;
  source: ExpenseSource;
  owner: string;
  paidByOwner: string;
  allocationMode: "single" | "equal" | "custom";
  allocationOwners: string[];
  allocationPercents: Record<string, string>;
  transferFromOwner: string;
  transferToOwner: string;
  transferNote: string;
  presetId?: string;
}

export interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type SortColumn =
  | "date"
  | "amount"
  | "description"
  | "source"
  | "category"
  | "owner";

export interface ExpensesByMonthTableProps {
  byMonth: [string, TransactionLedgerRow[]][];
  defaultOpenMonth: string;
  sortBy: SortColumn;
  sortDir: "asc" | "desc";
  onSort: (col: SortColumn) => void;
  onRowTap: (row: TransactionLedgerRow) => void;
  sourceLabelKeys: Record<string, string>;
  t: (key: string, opts?: { count?: number }) => string;
}

export interface ExpensesByMonthListProps {
  byMonth: [string, TransactionLedgerRow[]][];
  defaultOpenMonth: string;
  onRowTap: (row: TransactionLedgerRow) => void;
  t: (key: string, opts?: { count?: number }) => string;
}

export interface FiltersAndActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthFilter: string;
  onMonthFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  typeFilter: "all" | "expense" | "transfer";
  onTypeFilterChange: (value: "all" | "expense" | "transfer") => void;
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  expenseCategories: string[];
  ownerOptions: string[];
  cardSources: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  t: (key: string, opts?: { count?: number }) => string;
}

export interface ExpenseActionsDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateOwner: (id: string, owner: string) => void;
  onDelete: (expense: Expense) => void;
  expenseCategories: string[];
  ownerOptions: string[];
  t: (key: string) => string;
}

export interface TransferActionsDialogProps {
  transfer: OwnerTransfer | null;
  onClose: () => void;
  onEdit: (transfer: OwnerTransfer) => void;
  onDelete: (transfer: OwnerTransfer) => void;
  t: (key: string) => string;
}

export interface EditTransactionDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onSubmit: (
    id: string,
    updates: {
      date: string;
      amount: number;
      description: string;
      category: string;
      source: ExpenseSource;
      owner?: string;
      paidByOwner?: string;
      allocationMode?: "single" | "equal" | "custom";
      allocation?: ExpenseAllocation[];
    },
  ) => void;
  expenseCategories: string[];
  ownerOptions: string[];
  cardSources: string[];
}

export interface EditTransferDialogProps {
  transfer: OwnerTransfer | null;
  onClose: () => void;
  onSubmit: (
    id: string,
    updates: {
      date: string;
      amount: number;
      fromOwner: string;
      toOwner: string;
      note?: string;
    },
  ) => void;
  ownerOptions: string[];
  t: (key: string) => string;
}

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

export interface DeleteOneTransactionDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string, opts?: Record<string, string>) => string;
}

export interface DeleteSelectedTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => void;
  t: (key: string, opts?: { count?: number }) => string;
}

export interface DeleteAllTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => void;
  t: (key: string, opts?: { count?: number }) => string;
}

export interface TransactionsToolbarProps {
  onOpenFilters: () => void;
  onAddTransaction: () => void;
  hasActiveFilters: boolean;
  t: (key: string) => string;
}
