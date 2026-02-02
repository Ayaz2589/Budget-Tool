import type { DebtOwner, Income } from "./core";
import type { RecurringFrequency } from "./core";

export interface AddIncomeFormPayload {
  date: string;
  amount: number;
  description: string;
  category: string;
  owner: DebtOwner;
  recurringAmount?: number;
  recurringFrequency?: RecurringFrequency;
  recurringDayOfMonth?: number;
  recurringStartDate?: string;
}

export interface AddIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeCategories: string[];
  onSubmit: (payload: AddIncomeFormPayload) => void;
}

export interface EditIncomeFormPayload {
  date: string;
  amount: number;
  description: string;
  category: string;
  owner: DebtOwner;
  recurringAmount?: number;
  recurringFrequency?: RecurringFrequency;
  recurringDayOfMonth?: number;
  recurringStartDate?: string;
}

export interface EditIncomeDialogProps {
  income: Income | null;
  onClose: () => void;
  incomeCategories: string[];
  onSubmit: (id: string, payload: EditIncomeFormPayload) => void;
}

export interface IncomeListProps {
  sortedIncome: Income[];
  onIncomeTap: (income: Income) => void;
}

export interface IncomeTableProps {
  sortedIncome: Income[];
  incomeCategories: string[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateOwner: (id: string, owner: DebtOwner) => void;
}

export interface IncomeActionsDialogProps {
  income: Income | null;
  onClose: () => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateOwner: (id: string, owner: DebtOwner) => void;
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  incomeCategories: string[];
  t: (key: string) => string;
}
