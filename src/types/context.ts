import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  OwnerTransfer,
} from "./core";
import type { BudgetState } from "./budget";
import type { PresetTransaction } from "./core";
import type { UiFormatSettings } from "@/lib/format";

export interface BudgetContextValue extends BudgetState {
  addExpenses: (expenses: Expense[]) => void;
  addExpense: (entry: Omit<Expense, "id">) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  removeExpenses: (ids: string[]) => void;
  addIncome: (entry: Omit<Income, "id">) => void;
  addIncomes: (income: Income[]) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  removeIncome: (id: string) => void;
  addDebt: (entry: Omit<Debt, "id">) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  removeDebt: (id: string) => void;
  addDebts: (debts: Debt[]) => void;
  addDebtPayment: (entry: Omit<DebtPayment, "id">) => void;
  updateDebtPayment: (id: string, updates: Partial<DebtPayment>) => void;
  removeDebtPayment: (id: string) => void;
  addDebtPayments: (payments: DebtPayment[]) => void;
  addOwnerTransfer: (entry: Omit<OwnerTransfer, "id"> | OwnerTransfer) => void;
  updateOwnerTransfer: (id: string, updates: Partial<OwnerTransfer>) => void;
  removeOwnerTransfer: (id: string) => void;
  setExpenseCategories: (categories: string[]) => void;
  setIncomeCategories: (categories: string[]) => void;
  setOwners: (owners: string[]) => void;
  renameOwner: (oldName: string, newName: string) => void;
  renameExpenseCategory: (oldName: string, newName: string) => void;
  renameIncomeCategory: (oldName: string, newName: string) => void;
  setCardSources: (sources: string[]) => void;
  setOwnerBalance: (monthKey: string, owner: string, amount: number) => void;
  ownerBalances: Record<string, Record<string, number>>;
  repairCorruptedDates: () => { fixedExpenses: number; fixedIncome: number };
  uiFormatSettings: UiFormatSettings;
  setUiFormatSettings: (settings: UiFormatSettings) => void;
  isCurrencyUpdating: boolean;
  useDummyData: boolean;
  setUseDummyData: (value: boolean) => void;
}

export interface PresetTransactionsContextValue {
  presetTransactions: PresetTransaction[];
  addPreset: (preset: Omit<PresetTransaction, "id">) => void;
  removePreset: (id: string) => void;
  setPresets: (presets: PresetTransaction[]) => void;
}
