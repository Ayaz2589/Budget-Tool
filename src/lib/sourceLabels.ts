import type { ExpenseSource } from "@/lib/types";
import { ALL_EXPENSE_SOURCES } from "@/lib/types";

/**
 * i18n key suffix per expense source. Use with namespaces:
 * - addTransaction.* for AddTransactionDialog and CardSourcesCard
 * - transactions.* for FiltersAndActionsDialog and TransactionsPage
 */
export const EXPENSE_SOURCE_LOCALE_KEYS: Record<ExpenseSource, string> = {
  amex: "sourceAmexPlatinum",
  "amex-gold": "sourceAmexGold",
  chase: "sourceChase",
  apple: "sourceApple",
  manual: "sourceManual",
  td: "sourceTd",
};

/** English display names for PDF export and presets labels. */
export const EXPENSE_SOURCE_DISPLAY_LABELS: Record<ExpenseSource, string> = {
  amex: "Amex Platinum Card",
  "amex-gold": "Amex Gold Card",
  chase: "Chase",
  apple: "Apple Card",
  manual: "Manual",
  td: "Debit (TD Bank)",
};

/** Full i18n keys for transaction filter dropdown (transactions.* + common.all). */
export const SOURCE_LABEL_KEYS: Record<ExpenseSource | "all", string> = {
  all: "common.all",
  amex: "transactions.sourceAmexPlatinum",
  "amex-gold": "transactions.sourceAmexGold",
  chase: "transactions.sourceChase",
  apple: "transactions.sourceApple",
  manual: "transactions.sourceManual",
  td: "transactions.sourceTd",
};

/** Options for Presets page: value + display label. */
export const SOURCE_OPTIONS: { value: ExpenseSource; label: string }[] =
  ALL_EXPENSE_SOURCES.map((value) => ({
    value,
    label: EXPENSE_SOURCE_DISPLAY_LABELS[value],
  }));
