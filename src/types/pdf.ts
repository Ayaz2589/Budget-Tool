import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  OwnerTransfer,
  PresetTransaction,
} from "./core";
import type { CategoryWithColorPayload } from "./payload";
import type { DisplayCurrency } from "./currency";

export interface ParsedExportedPdf {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  ownerTransfers?: OwnerTransfer[];
  presetTransactions: PresetTransaction[];
  expenseCategoriesWithColors?: CategoryWithColorPayload[];
  incomeCategoriesWithColors?: CategoryWithColorPayload[];
  owners?: string[];
  cardSources?: string[];
  displayCurrency?: DisplayCurrency;
  baseCurrency?: "USD";
  fxAsOf?: string;
}
