import type { Expense, ExpenseSource } from "./core";

export interface TransactionRow {
  id: string;
  date: string;
  amount: string;
  description: string;
  category: string;
  source: ExpenseSource;
  owner: string;
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
  byMonth: [string, Expense[]][];
  defaultOpenMonth: string;
  sortBy: SortColumn;
  sortDir: "asc" | "desc";
  onSort: (col: SortColumn) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateOwner: (id: string, owner: string) => void;
  expenseCategories: string[];
  ownerOptions: string[];
  onDeleteOne: (expense: Expense) => void;
  sourceLabelKeys: Record<string, string>;
  t: (key: string, opts?: { count?: number }) => string;
}

export interface ExpensesByMonthListProps {
  byMonth: [string, Expense[]][];
  defaultOpenMonth: string;
  onExpenseTap: (expense: Expense) => void;
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
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  expenseCategories: string[];
  ownerOptions: string[];
  cardSources: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCleanDescriptions: () => void;
  expensesCount: number;
  onDeleteAll: () => void;
  t: (key: string, opts?: { count?: number }) => string;
}

export interface ExpenseActionsDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateOwner: (id: string, owner: string) => void;
  onDelete: (expense: Expense) => void;
  expenseCategories: string[];
  ownerOptions: string[];
  t: (key: string) => string;
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
  showSync: boolean;
  syncStatus: import("./auth").SyncStatus;
  onSync: () => void;
  t: (key: string) => string;
}

export interface SyncConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  t: (key: string) => string;
}
