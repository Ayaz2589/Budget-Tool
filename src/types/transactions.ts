import type { Expense, ExpenseAllocation, ExpenseSource } from "./core";

export interface TransactionRow {
  id: string;
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
  onExpenseTap: (expense: Expense) => void;
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
