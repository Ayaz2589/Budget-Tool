import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  PresetTransaction,
} from "@/types/core";
import type { CategoryWithColorPayload } from "@/types/payload";
import { serializeToBlob } from "@/lib/minifiedPayload";

const DATA_START_MARKER = "BUDGET_TOOL_DATA_START";
const DATA_END_MARKER = "BUDGET_TOOL_DATA_END";

export function buildExportString(
  expenses: Expense[],
  income: Income[],
  debts: Debt[],
  debtPayments: DebtPayment[],
  presetTransactions: PresetTransaction[],
  expenseCategoriesWithColors: CategoryWithColorPayload[],
  incomeCategoriesWithColors: CategoryWithColorPayload[],
  owners: string[] = [],
  cardSources: string[] = [],
): string {
  const blob = serializeToBlob({
    expenses,
    income,
    debts,
    debtPayments,
    presetTransactions,
    expenseCategoriesWithColors,
    incomeCategoriesWithColors,
    owners,
    cardSources,
  });
  return `${DATA_START_MARKER}\n${blob}\n${DATA_END_MARKER}`;
}

export function downloadExportString(text: string): void {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-tool-export-${new Date()
    .toISOString()
    .slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
