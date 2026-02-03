import type { Owner, Income } from "./core";
import type { RecurringFrequency } from "./core";

export interface AddIncomeFormPayload {
  date: string;
  amount: number;
  description: string;
  category: string;
  owner: Owner;
  recurringAmount?: number;
  recurringFrequency?: RecurringFrequency;
  recurringDayOfMonth?: number;
  recurringStartDate?: string;
}

export interface AddIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeCategories: string[];
  owners: string[];
  onSubmit: (payload: AddIncomeFormPayload) => void;
}

export interface EditIncomeFormPayload {
  date: string;
  amount: number;
  description: string;
  category: string;
  owner: Owner;
  recurringAmount?: number;
  recurringFrequency?: RecurringFrequency;
  recurringDayOfMonth?: number;
  recurringStartDate?: string;
}

export interface EditIncomeDialogProps {
  income: Income | null;
  onClose: () => void;
  incomeCategories: string[];
  owners: string[];
  onSubmit: (id: string, payload: EditIncomeFormPayload) => void;
}

export interface IncomeListProps {
  sortedIncome: Income[];
  onIncomeTap: (income: Income) => void;
}

export interface IncomeTableProps {
  sortedIncome: Income[];
  incomeCategories: string[];
  ownerOptions: string[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateOwner: (id: string, owner: Owner) => void;
}

export interface IncomeActionsDialogProps {
  income: Income | null;
  onClose: () => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateOwner: (id: string, owner: Owner) => void;
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  incomeCategories: string[];
  ownerOptions: string[];
  t: (key: string) => string;
}
