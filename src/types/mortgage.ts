import type { Expense } from "./core";
import type { UiFormatSettings } from "@/lib/format";

export interface MortgagePaymentsTableProps {
  payments: Expense[];
  onRemove: (expense: Expense) => void;
  onUpdateOwner: (id: string, owner: string) => void;
  ownerOptions: string[];
}

export interface MortgagePaymentActionsDialogProps {
  payment: Expense | null;
  onClose: () => void;
  onRemove: (expense: Expense) => void;
  onUpdateOwner: (id: string, owner: string) => void;
  ownerOptions: string[];
  t: (key: string) => string;
}

export interface DeleteMortgagePaymentDialogProps {
  expense: Expense | null;
  onClose: () => void;
  onConfirm: () => void;
}

export interface MortgagePaymentsListProps {
  payments: Expense[];
  onPaymentTap: (expense: Expense) => void;
}

export interface AddMortgagePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateFormat?: UiFormatSettings["dateFormat"];
  date: string;
  onDateChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  owner: string;
  onOwnerChange: (value: string) => void;
  ownerOptions: string[];
  onSubmit: (e: import("react").FormEvent) => void;
}
