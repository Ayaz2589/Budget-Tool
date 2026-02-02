import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
} from "./core";
import type { BudgetState } from "./budget";
import type { Rule } from "./rules";
import type { PresetTransaction } from "./core";

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
  setExpenseCategories: (categories: string[]) => void;
  setIncomeCategories: (categories: string[]) => void;
  setCardSources: (sources: string[]) => void;
  setIOweNova: (monthKey: string, amount: number) => void;
  iOweNova: Record<string, number>;
  repairCorruptedDates: () => { fixedExpenses: number; fixedIncome: number };
}

export interface RulesContextValue {
  rules: Rule[];
  addRule: (rule: Omit<Rule, "id">) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  removeRule: (id: string) => void;
  reorderRule: (id: string, direction: "up" | "down") => void;
  toggleRule: (id: string) => void;
  setRules: (rules: Rule[]) => void;
}

export interface PresetTransactionsContextValue {
  presetTransactions: PresetTransaction[];
  addPreset: (preset: Omit<PresetTransaction, "id">) => void;
  removePreset: (id: string) => void;
  setPresets: (presets: PresetTransaction[]) => void;
}
