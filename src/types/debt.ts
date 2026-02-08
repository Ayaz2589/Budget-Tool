import type { Debt, DebtPayment, Owner } from "./core";
import type { UiFormatSettings } from "@/lib/format";

export interface DebtListProps {
  debts: Debt[];
  paymentsByDebt: Map<string, DebtPayment[]>;
  onDebtTap: (debt: Debt) => void;
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
  owner: Owner;
}

export interface AddDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owners: string[];
  dateFormat?: UiFormatSettings["dateFormat"];
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
  onUpdateOwner: (debtId: string, owner: Owner) => void;
  ownerOptions: string[];
  onDelete: (debtId: string) => void;
  onRemovePayment: (paymentId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}
