import type { Owner, Income } from "./core";
import type { UiFormatSettings } from "@/lib/format";

export interface AddIncomeFormPayload {
  date: string;
  amount: number;
  description: string;
  category: string;
  owner: Owner;
}

export interface AddIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: string[];
  dateFormat?: UiFormatSettings["dateFormat"];
  onSubmit: (payload: AddIncomeFormPayload) => void;
  initialIncome?: Income;
}

export interface EditIncomeFormPayload {
  date: string;
  amount: number;
  description: string;
  category: string;
  owner: Owner;
}

export interface EditIncomeDialogProps {
  income: Income | null;
  onClose: () => void;
  owners: string[];
  onSubmit: (id: string, payload: EditIncomeFormPayload) => void;
}

export interface IncomeListProps {
  byMonth: [string, Income[]][];
  defaultOpenMonth: string;
  onIncomeTap: (income: Income) => void;
  onCopy?: (income: Income) => void;
}

export interface IncomeTableProps {
  byMonth: [string, Income[]][];
  defaultOpenMonth: string;
  onIncomeTap: (income: Income) => void;
  onCopy?: (income: Income) => void;
  onUpdateCategory?: (id: string, category: string) => void;
  onUpdateOwner?: (id: string, owner: string) => void;
  incomeCategories?: string[];
  ownerOptions?: string[];
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
