import type { Debt, DebtPayment, DebtOwner } from "./core";
import type { RecurringFrequency } from "./core";

export interface DebtListProps {
  debts: Debt[];
  paymentsByDebt: Map<string, DebtPayment[]>;
  onAddPayment: (debtId: string) => void;
  onEditRecurring: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
  onRemovePayment: (paymentId: string) => void;
}

export interface DebtListMobileProps {
  debts: Debt[];
  paymentsByDebt: Map<string, DebtPayment[]>;
  onDebtTap: (debt: Debt) => void;
}

export interface AddDebtPayload {
  name: string;
  initialAmount: number;
  startDate?: string;
  owner: DebtOwner;
  recurringAmount?: number;
  recurringFrequency?: RecurringFrequency;
  recurringDayOfMonth?: number;
  recurringStartDate?: string;
}

export interface AddDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AddDebtPayload) => void;
}

export interface AddPaymentPayload {
  debtId: string;
  date: string;
  amount: number;
  note?: string;
}

export interface AddPaymentDialogProps {
  open: boolean;
  debtId: string | null;
  onClose: () => void;
  onSubmit: (payload: AddPaymentPayload) => void;
}

export interface DebtActionsDialogProps {
  debt: Debt | null;
  payments: DebtPayment[];
  onClose: () => void;
  onAddPayment: (debtId: string) => void;
  onEditRecurring: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
  onRemovePayment: (paymentId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export interface EditRecurringPayload {
  recurringAmount: number;
  recurringFrequency: RecurringFrequency;
  recurringDayOfMonth?: number;
  recurringStartDate?: string;
}

export interface EditRecurringDialogProps {
  open: boolean;
  debt: Debt | null;
  onClose: () => void;
  onSave: (payload: EditRecurringPayload) => void;
  onClear: () => void;
}
