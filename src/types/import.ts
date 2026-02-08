import type * as React from "react";
import type { Debt, DebtPayment, Expense, Income } from "./core";

export type CsvSource = "amex" | "apple" | "chase" | "unknown";

export type SourceChoice =
  | "amex"
  | "amex-gold"
  | "apple"
  | "chase"
  | "pdf-export";

export interface ImportPreviewCardProps {
  previewExpenses: Expense[];
  previewIncome: Income[];
  previewDebts: Debt[];
  previewDebtPayments: DebtPayment[];
  expenseCategories: string[];
  onUpdateCategory: (id: string, category: string) => void;
  lastDetected: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export interface ImportSourceCardProps {
  selectedSource: SourceChoice;
  onSourceChange: (value: SourceChoice) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importError: string;
  lastDetected: string;
  sourceLabel: string;
  previewExpensesCount: number;
  previewIncomeCount: number;
  previewDebtsCount: number;
  previewDebtPaymentsCount: number;
  skippedDuplicates: number;
  onAddToTransactions: () => void;
  isPdfExport: boolean;
  cardSources: string[];
  t: (key: string, options?: Record<string, unknown>) => string;
  statusText?: string;
  showPrimaryAction?: boolean;
  primaryActionLabel?: string;
}
