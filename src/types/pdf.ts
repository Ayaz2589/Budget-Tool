import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  OwnerTransfer,
  PresetTransaction,
} from "./core";
import type { InvestmentPortfolio } from "./investments";
import type { CategoryWithColorPayload } from "./payload";

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
  investmentPortfolios?: InvestmentPortfolio[];
}
