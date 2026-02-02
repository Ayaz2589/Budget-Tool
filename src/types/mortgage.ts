import type { Expense } from "./core";

export interface MortgagePaymentsTableProps {
  payments: Expense[];
  onRemove: (expense: Expense) => void;
}

export interface MortgagePaymentActionsDialogProps {
  payment: Expense | null;
  onClose: () => void;
  onRemove: (expense: Expense) => void;
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
  date: string;
  onDateChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  onSubmit: (e: import("react").FormEvent) => void;
}
